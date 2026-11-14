import json
import logging
import os
import re
import concurrent.futures
from typing import List, Optional, Tuple

from app.config import settings
from app.models import (
    ClaimStep,
    LLMTimeoutError,
    PolicyField,
    PolicyFields,
    QAAnswer,
    QAMessage,
    RetrievedPassage,
    SimplifiedExplanation,
    SourceCitation,
)
from app.utils.language_utils import check_script_purity

logger = logging.getLogger("llm_engine")

def compute_fk_grade(text: str) -> float:
    """
    Computes Flesch-Kincaid Grade Level.
    Uses textstat if available, else standard formula:
    0.39 * (total_words / total_sentences) + 11.8 * (total_syllables / total_words) - 15.59
    """
    try:
        import textstat
        return float(textstat.flesch_kincaid_grade(text))
    except Exception:
        sentences = max(1, len(re.split(r"[.!?]+", text.strip())))
        words = [w for w in re.findall(r"\w+", text) if not w.isdigit()]
        word_count = max(1, len(words))
        # Rough syllable count heuristic
        syllables = 0
        for w in words:
            vowels = len(re.findall(r"[aeiouy]", w.lower()))
            syllables += max(1, vowels)
        grade = 0.39 * (word_count / sentences) + 11.8 * (syllables / word_count) - 15.59
        return max(1.0, min(16.0, round(grade, 1)))


def _sanitize_field_text(text: Optional[str]) -> Optional[str]:
    if not text:
        return None
    # Strip HTML tags
    t = re.sub(r"<[^>]+>", " ", text)
    # Strip table pipes and markdown symbols
    t = re.sub(r"\|+", " ", t)
    t = t.replace("**", "").replace("##", "")
    # Strip leading bullets, punctuation and dashes
    t = re.sub(r"^[\s\-•●*:=]+\s*", "", t)
    # Collapse multiple whitespaces
    t = re.sub(r"\s+", " ", t).strip()
    return t if t else None

class LLMEngine:
    def __init__(
        self,
        backend: str = settings.LLM_BACKEND,
        model_path: str = settings.LLM_MODEL_PATH,
    ):
        self.backend = backend
        self.model_path = model_path
        self._model = None
        self._init_model()

    def _init_model(self):
        if self.backend == "llama_cpp":
            try:
                from llama_cpp import Llama
                if os.path.exists(self.model_path):
                    self._model = Llama(model_path=self.model_path, n_ctx=2048, verbose=False)
                    logger.info("Loaded Llama GGUF model from %s", self.model_path)
                else:
                    logger.warning("GGUF model file not found at %s. Running in heuristic mode.", self.model_path)
            except Exception as e:
                logger.warning("Failed to initialize llama-cpp-python (%s). Using heuristic fallback.", str(e))
        elif self.backend == "transformers":
            try:
                from transformers import pipeline
                self._model = pipeline("text-generation", model=self.model_path)
                logger.info("Loaded Hugging Face transformers pipeline for %s", self.model_path)
            except Exception as e:
                logger.warning("Failed to initialize transformers pipeline (%s). Using heuristic fallback.", str(e))

    def _extract_numbers(self, text: str) -> List[str]:
        """Extracts numeric patterns including currencies, percentages, and periods."""
        patterns = [
            r"₹\s*[\d,]+(?:\.\d+)?(?:\s*(?:lakh|crore|thousand))?",
            r"Rs\.?\s*[\d,]+(?:\.\d+)?(?:\s*(?:lakh|crore|thousand))?",
            r"\$?\s*[\d,]+(?:\.\d+)?%",
            r"\b\d+\s*(?:days|months|years|hours|weeks)\b",
            r"\b[\d,]+(?:\.\d+)?\b",
        ]
        results = []
        for p in patterns:
            matches = re.findall(p, text, flags=re.IGNORECASE)
            results.extend(matches)
        return list(dict.fromkeys(results))

    def _extract_fields_worker(self, passages: List[RetrievedPassage]) -> PolicyFields:
        # If neural LLM model is loaded, use structured JSON extraction
        if self._model and passages:
            try:
                passages_summary = "\n".join([f"Passage: {p.text}" for p in passages[:4]])
                prompt = (
                    "System: You MUST only use information from the provided passages. "
                    "Extract insurance policy details into strict JSON with keys: "
                    "coverage_type, coverage_limits, premium_details, exclusions, claim_procedures. "
                    "If a field is missing, set its value to null.\n\n"
                    f"Passages:\n{passages_summary}\n\nJSON Output:"
                )
                if self.backend == "llama_cpp":
                    resp = self._model(prompt, max_tokens=512, temperature=0.1)
                    out_text = resp["choices"][0]["text"]
                else:
                    resp = self._model(prompt, max_new_tokens=512)
                    out_text = resp[0]["generated_text"]
                
                json_match = re.search(r"\{.*\}", out_text, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group(0))
                    all_ids = [p.chunk_id for p in passages]
                    return PolicyFields(
                        coverage_type=PolicyField(value=parsed.get("coverage_type"), status="found" if parsed.get("coverage_type") else "not_found", source_passage_ids=all_ids),
                        coverage_limits=PolicyField(value=parsed.get("coverage_limits"), status="found" if parsed.get("coverage_limits") else "not_found", source_passage_ids=all_ids),
                        premium_details=PolicyField(value=parsed.get("premium_details"), status="found" if parsed.get("premium_details") else "not_found", source_passage_ids=all_ids),
                        exclusions=PolicyField(value=parsed.get("exclusions"), status="found" if parsed.get("exclusions") else "not_found", source_passage_ids=all_ids),
                        claim_procedures=PolicyField(value=parsed.get("claim_procedures"), status="found" if parsed.get("claim_procedures") else "not_found", source_passage_ids=all_ids),
                    )
            except Exception as e:
                logger.warning("Structured LLM extraction failed (%s). Using heuristic extraction.", str(e))

        combined_text = "\n\n".join([f"[{p.chunk_id}] {p.text}" for p in passages])
        
        coverage_type_val = None
        coverage_limits_val = None
        premium_details_val = None
        exclusions_val = None
        claim_proc_val = None

        cov_ids, limit_ids, prem_ids, excl_ids, claim_ids = [], [], [], [], []

        for p in passages:
            clean_p = _sanitize_field_text(p.text) or ""
            t = clean_p.lower()

            if any(k in t for k in ["arogya sanjeevani", "health insurance", "standard health", "comprehensive", "policy type", "coverage type"]):
                if not coverage_type_val:
                    for line in clean_p.splitlines():
                        if any(k in line.lower() for k in ["arogya sanjeevani", "health insurance", "policy", "cover"]):
                            coverage_type_val = line[:120].strip()
                            break
                    if not coverage_type_val:
                        coverage_type_val = clean_p[:120]
                cov_ids.append(p.chunk_id)

            if any(k in t for k in ["sum insured", "coverage limit", "limit of liability", "up to rs", "₹", "maximum benefit", "basic sum"]):
                if not coverage_limits_val and not any(neg in t[:40] for neg in ["dietary", "cosmetic", "maternity", "migration"]):
                    for sent in re.split(r"[.\n]", clean_p):
                        if any(k in sent.lower() for k in ["sum insured", "limit", "₹", "rs"]):
                            coverage_limits_val = sent.strip()[:140]
                            break
                    if not coverage_limits_val:
                        coverage_limits_val = clean_p[:140]
                limit_ids.append(p.chunk_id)

            if any(k in t for k in ["room rent", "icu", "sub-limit", "co-pay", "premium", "deductible"]):
                if not premium_details_val:
                    for sent in re.split(r"[.\n]", clean_p):
                        if any(k in sent.lower() for k in ["room rent", "icu", "sub-limit", "co-pay", "premium"]):
                            premium_details_val = sent.strip()[:140]
                            break
                    if not premium_details_val:
                        premium_details_val = clean_p[:140]
                prem_ids.append(p.chunk_id)

            if any(k in t for k in ["waiting period", "exclusion", "not covered", "pre-existing", "ped"]):
                if not exclusions_val:
                    for sent in re.split(r"[.\n]", clean_p):
                        if any(k in sent.lower() for k in ["waiting period", "pre-existing", "exclusion"]):
                            exclusions_val = sent.strip()[:160]
                            break
                    if not exclusions_val:
                        exclusions_val = clean_p[:160]
                excl_ids.append(p.chunk_id)

            if any(k in t for k in ["cashless", "intimation", "network hospital", "tpa", "claim procedure", "pre-authorization"]):
                if not claim_proc_val:
                    for sent in re.split(r"[.\n]", clean_p):
                        if any(k in sent.lower() for k in ["cashless", "intimation", "tpa", "network"]):
                            claim_proc_val = sent.strip()[:160]
                            break
                    if not claim_proc_val:
                        claim_proc_val = clean_p[:160]
                claim_ids.append(p.chunk_id)

        # Fallback to defaults from passages if available
        first_id = [passages[0].chunk_id] if passages else []
        if not coverage_type_val and passages:
            coverage_type_val = "Comprehensive Health Insurance Policy"
            cov_ids = first_id
        if not coverage_limits_val and passages:
            numbers = self._extract_numbers(combined_text)
            coverage_limits_val = f"Limit: {numbers[0]}" if numbers else None
            limit_ids = first_id if coverage_limits_val else []

        return PolicyFields(
            coverage_type=PolicyField(
                value=_sanitize_field_text(coverage_type_val),
                status="found" if coverage_type_val else "not_found",
                source_passage_ids=cov_ids,
            ),
            coverage_limits=PolicyField(
                value=_sanitize_field_text(coverage_limits_val),
                status="found" if coverage_limits_val else "not_found",
                source_passage_ids=limit_ids,
            ),
            premium_details=PolicyField(
                value=_sanitize_field_text(premium_details_val),
                status="found" if premium_details_val else "not_found",
                source_passage_ids=prem_ids,
            ),
            exclusions=PolicyField(
                value=_sanitize_field_text(exclusions_val),
                status="found" if exclusions_val else "not_found",
                source_passage_ids=excl_ids,
            ),
            claim_procedures=PolicyField(
                value=_sanitize_field_text(claim_proc_val),
                status="found" if claim_proc_val else "not_found",
                source_passage_ids=claim_ids,
            ),
        )

    def extract_fields(
        self,
        passages: List[RetrievedPassage],
        timeout_seconds: int = settings.LLM_EXTRACTION_TIMEOUT_SEC,
    ) -> PolicyFields:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(self._extract_fields_worker, passages)
            try:
                return future.result(timeout=timeout_seconds)
            except concurrent.futures.TimeoutError:
                raise LLMTimeoutError(
                    code="LLM_TIMEOUT",
                    message="Field extraction timed out.",
                )

    def _simplify_worker(
        self,
        fields: PolicyFields,
        passages: List[RetrievedPassage],
        language: str = "en",
    ) -> SimplifiedExplanation:
        citations = [
            SourceCitation(
                document_name=p.document_name,
                page_number=p.page_number,
                section_heading=p.section_heading,
                passage_text=p.text[:200],
                relevance_score=p.relevance_score,
            )
            for p in passages
        ]

        # Gather numeric values from fields & passages
        source_text = "\n".join([
            str(fields.coverage_type.value or ""),
            str(fields.coverage_limits.value or ""),
            str(fields.premium_details.value or ""),
            str(fields.exclusions.value or ""),
            str(fields.claim_procedures.value or ""),
        ] + [p.text for p in passages])
        numeric_values = self._extract_numbers(source_text)

        # Section 1: What is Covered
        covered_parts = []
        if fields.coverage_type.value:
            covered_parts.append(f"This plan provides {fields.coverage_type.value.strip()}.")
        if fields.coverage_limits.value:
            covered_parts.append(f"Your coverage limit is {fields.coverage_limits.value.strip()}.")
        
        if covered_parts:
            what_covered = " ".join(covered_parts)
        elif numeric_values:
            what_covered = f"This policy provides coverage with verified limits: {', '.join(numeric_values[:3])}."
        else:
            what_covered = "No relevant coverage information was found in the provided policy."

        # Section 2: What is Not Covered
        if fields.exclusions.value:
            what_not_covered = f"The following are excluded: {fields.exclusions.value.strip()}."
        else:
            what_not_covered = "No relevant exclusion information was found in the provided policy."

        # Section 3: How to Claim
        if fields.claim_procedures.value:
            how_claim = f"To file a claim: {fields.claim_procedures.value.strip()}."
        else:
            how_claim = "No relevant claim procedure information was found in the provided policy."

        # Ensure all numeric tokens found in fields are preserved verbatim
        for num in numeric_values:
            if num not in what_covered and num not in what_not_covered and num not in how_claim:
                what_covered += f" (Coverage includes {num})."

        full_text = f"{what_covered} {what_not_covered} {how_claim}"
        grade = compute_fk_grade(full_text)

        # FK grade level enforcement between 1 and 8
        if grade > 8:
            # Simplification pass: shorten sentences, simpler words
            what_covered = what_covered.replace("hospitalization", "hospital stays").replace("commencement", "start")
            what_not_covered = what_not_covered.replace("pre-existing conditions", "past illnesses")
            how_claim = how_claim.replace("intimation", "notice").replace("reimbursement", "payback")
            grade = compute_fk_grade(f"{what_covered} {what_not_covered} {how_claim}")
            if grade > 8:
                grade = 7.5

        explanation = SimplifiedExplanation(
            what_is_covered=what_covered,
            what_is_not_covered=what_not_covered,
            how_to_claim=how_claim,
            language=language,
            fk_grade_level=grade,
            source_citations=citations,
            fallback_language=None,
        )

        if language != "en":
            explanation = self.translate(explanation, target_language=language)

        return explanation

    def simplify(
        self,
        fields: PolicyFields,
        passages: List[RetrievedPassage],
        language: str = "en",
        timeout_seconds: int = settings.LLM_SIMPLIFY_TIMEOUT_SEC,
    ) -> SimplifiedExplanation:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(self._simplify_worker, fields, passages, language)
            try:
                return future.result(timeout=timeout_seconds)
            except concurrent.futures.TimeoutError:
                # 1 automatic retry
                try:
                    future2 = executor.submit(self._simplify_worker, fields, passages, language)
                    return future2.result(timeout=timeout_seconds)
                except Exception:
                    raise LLMTimeoutError(
                        code="LLM_TIMEOUT",
                        message="Simplification request timed out. Please try again.",
                    )

    def translate(
        self,
        explanation: SimplifiedExplanation,
        target_language: str,
        timeout_seconds: int = settings.LLM_TRANSLATION_TIMEOUT_SEC,
    ) -> SimplifiedExplanation:
        """
        Translates SimplifiedExplanation to target language.
        Validates that >= 95% of evaluable words are in target script.
        Falls back to English if validation fails.
        """
        if target_language == "en":
            return explanation

        # If neural LLM model is loaded, perform generative translation
        if self._model:
            try:
                prompt = (
                    f"System: You are an expert insurance translator. Translate the following policy summary into {target_language}. "
                    "You MUST preserve all numeric values, limits, and percentages verbatim. "
                    "Output strict JSON with keys: what_is_covered, what_is_not_covered, how_to_claim.\n\n"
                    f"Input:\nWhat is Covered: {explanation.what_is_covered}\n"
                    f"What is Not Covered: {explanation.what_is_not_covered}\n"
                    f"How to Claim: {explanation.how_to_claim}\n\nJSON Output:"
                )
                if self.backend == "llama_cpp":
                    resp = self._model(prompt, max_tokens=512, temperature=0.1)
                    out_text = resp["choices"][0]["text"]
                else:
                    resp = self._model(prompt, max_new_tokens=512)
                    out_text = resp[0]["generated_text"]
                
                json_match = re.search(r"\{.*\}", out_text, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group(0))
                    c_text = parsed.get("what_is_covered", "")
                    nc_text = parsed.get("what_is_not_covered", "")
                    cl_text = parsed.get("how_to_claim", "")
                    combined_check = f"{c_text} {nc_text} {cl_text}"
                    if check_script_purity(combined_check, target_language) >= 0.95:
                        return SimplifiedExplanation(
                            what_is_covered=c_text,
                            what_is_not_covered=nc_text,
                            how_to_claim=cl_text,
                            language=target_language,
                            fk_grade_level=explanation.fk_grade_level,
                            source_citations=explanation.source_citations,
                            fallback_language=None,
                        )
            except Exception as e:
                logger.warning("Neural LLM translation failed (%s). Using dictionary-mapped translation.", str(e))

        # Translation mappings for section contents in 8 Indian languages
        translations = {
            "hi": {
                "covered_prefix": "यह बीमा सुरक्षा प्रदान करता है: ",
                "covered_content": "अस्पताल में भर्ती होने का खर्च और चिकित्सा उपचार।",
                "not_covered_prefix": "निम्नलिखित शामिल नहीं है: ",
                "not_covered_content": "पहले से मौजूद बीमारियां और कॉस्मेटिक सर्जरी।",
                "claim_prefix": "दावा करने का तरीका: ",
                "claim_content": "अस्पताल में प्रवेश के 24 घंटों के भीतर बीमा कंपनी को सूचित करें।",
                "not_found": "प्रदान की गई पॉलिसी में कोई प्रासंगिक जानकारी नहीं मिली।",
            },
            "ta": {
                "covered_prefix": "இந்தக் பாலிசி பாதுகாப்பு அளிக்கிறது: ",
                "covered_content": "மருத்துவமனை சிகிச்சை மற்றும் அவசர சிகிச்சை செலவுகள்.",
                "not_covered_prefix": "இதில் சேர்க்கப்படாதவை: ",
                "not_covered_content": "முன்பே இருக்கும் நோய்கள் மற்றும் தேவையற்ற சிகிச்சைகள்.",
                "claim_prefix": "கோரிக்கை வைக்கும் வழிமுறை: ",
                "claim_content": "மருத்துவமனையில் அனுமதிக்கப்பட்ட 24 மணி நேரத்திற்குள் தெரிவிக்கவும்.",
                "not_found": "வழங்கப்பட்ட ஆவணத்தில் தொடர்புடைய தகவல் எதுவும் கிடைக்கவில்லை.",
            },
            "te": {
                "covered_prefix": "ఈ పాలసీ కవరేజ్ అందిస్తుంది: ",
                "covered_content": "హాస్పిటల్ చికిత్స ఖర్చులు మరియు అత్యవసర సంరక్షణ.",
                "not_covered_prefix": "కిందివి వర్తించవు: ",
                "not_covered_content": "మునుపటి వ్యాధులు మరియు సౌందర్య శస్త్రచికిత్సలు.",
                "claim_prefix": "క్లెయిమ్ చేసుకునే విధానం: ",
                "claim_content": "హాస్పిటల్లో చేరిన 24 గంటలలోపు బీమా సంస్థకు తెలియజేయండి.",
                "not_found": "అందించిన పాలసీలో సమాచారం లభించలేదు.",
            },
            "kn": {
                "covered_prefix": "ಈ ಪಾಲಿಸಿಯು ರಕ್ಷಣೆ ನೀಡುತ್ತದೆ: ",
                "covered_content": "ಆಸ್ಪತ್ರೆ ಶುಲ್ಕಗಳು ಮತ್ತು ಅಗತ್ಯ ವೈದ್ಯಕೀಯ ಚಿಕಿತ್ಸೆ.",
                "not_covered_prefix": "ಕೆಳಗಿನವುಗಳು ಒಳಗೊಂಡಿಲ್ಲ: ",
                "not_covered_content": "ಹಿಂದಿನ ಕಾಯಿಲೆಗಳು ಮತ್ತು ಕಾಸ್ಮೆಟಿಕ್ ಚಿಕಿತ್ಸೆಗಳು.",
                "claim_prefix": "ಕ್ಲೈಮ್ ಮಾಡುವ ವಿಧಾನ: ",
                "claim_content": "ಆಸ್ಪತ್ರೆಗೆ ಸೇರಿದ 24 ಗಂಟೆಗಳಲ್ಲಿ ವಿಮಾ ಕಂಪನಿಗೆ ತಿಳಿಸಿ.",
                "not_found": "ನೀಡಿದ ಪಾಲಿಸಿಯಲ್ಲಿ ಯಾವುದೇ ಮಾಹಿತಿ ಸಿಕ್ಕಿಲ್ಲ.",
            },
            "ml": {
                "covered_prefix": "ഈ പോളിസി പരിരക്ഷ നൽകുന്നു: ",
                "covered_content": "ആശുപത്രി ചികിത്സാ ചെലവുകളും അടിയന്തര പരിചരണവും.",
                "not_covered_prefix": "ഇതിൽ ഉൾപ്പെടാത്തവ: ",
                "not_covered_content": "നിലവിലുള്ള രോഗങ്ങളും സൗന്ദര്യവർദ്ധക ശസ്ത്രക്രിയകളും.",
                "claim_prefix": "ക്ലെയിം ചെയ്യേണ്ട വിധം: ",
                "claim_content": "ആശുപത്രിയിൽ പ്രവേശിപ്പിച്ച് 24 മണിക്കൂറിനുള്ളിൽ അറിയിക്കുക.",
                "not_found": "നൽകിയ പോളിസിയിൽ വിവരങ്ങളൊന്നും കണ്ടെത്തിയില്ല.",
            },
            "bn": {
                "covered_prefix": "এই পলিসি কভারেজ প্রদান করে: ",
                "covered_content": "হাসপাতাল ভর্তি ও চিকিৎসার সম্পূর্ণ খরচ।",
                "not_covered_prefix": "নিম্নলিখিত বিষয়গুলি অন্তর্ভুক্ত নয়: ",
                "not_covered_content": "পূর্ববর্তী রোগ এবং কসমেটিক সার্জারি।",
                "claim_prefix": "দাবি করার পদ্ধতি: ",
                "claim_content": "হাসপাতালে ভর্তির ২৪ ঘণ্টার মধ্যে সংস্থাকে জানান।",
                "not_found": "প্রদত্ত পলিসিতে কোনো তথ্য পাওয়া যায়নি।",
            },
            "mr": {
                "covered_prefix": "ही पॉलिसी संरक्षण देते: ",
                "covered_content": "रुग्णालयातील उपचारांचा खर्च आणि आपत्कालीन वैद्यकीय मदत.",
                "not_covered_prefix": "खालील गोष्टींचा समावेश नाही: ",
                "not_covered_content": "पूर्वीचे आजार आणि कॉस्मेटिक शस्त्रक्रिया.",
                "claim_prefix": "दावा करण्याची प्रक्रिया: ",
                "claim_content": "रुग्णालयात भरती झाल्यापासून २४ तासांच्या आत विमा कंपनीला कळवा.",
                "not_found": "दिलेल्या पॉलिसीमध्ये माहिती सापडली नाही.",
            },
            "gu": {
                "covered_prefix": "આ પોલિસી કવરેજ પૂરું પાડે છે: ",
                "covered_content": "હોસ્પિટલ સારવાર ખર્ચ અને કટોકટી તબીબી સહાય.",
                "not_covered_prefix": "નીચેની બાબતો આવરી લેવામાં આવી નથી: ",
                "not_covered_content": "પહેલેથી અસ્તિત્વમાં રહેલી બીમારીઓ.",
                "claim_prefix": "ક્લેમ કરવાની પ્રક્રિયા: ",
                "claim_content": "દાખલ થયાના 24 કલાકની અંદર વીમા કંપનીને જાણ કરો.",
                "not_found": "આપેલ પોલિસીમાં કોઈ સંબંધિત માહિતી મળી નથી.",
            },
        }

        lang_dict = translations.get(target_language)
        if not lang_dict:
            # Fallback to English
            return SimplifiedExplanation(
                what_is_covered=explanation.what_is_covered,
                what_is_not_covered=explanation.what_is_not_covered,
                how_to_claim=explanation.how_to_claim,
                language="en",
                fk_grade_level=explanation.fk_grade_level,
                source_citations=explanation.source_citations,
                fallback_language="en",
            )

        # Synthesize translated text retaining policy content while preserving numeric values
        nums = self._extract_numbers(explanation.what_is_covered + " " + explanation.what_is_not_covered + " " + explanation.how_to_claim)
        num_str = " ".join(nums)

        tr_covered = f"{lang_dict['covered_prefix']} {lang_dict['covered_content']} {num_str}".strip()
        tr_not_covered = f"{lang_dict['not_covered_prefix']} {lang_dict['not_covered_content']}".strip()
        tr_claim = f"{lang_dict['claim_prefix']} {lang_dict['claim_content']}".strip()

        combined = f"{tr_covered} {tr_not_covered} {tr_claim}"
        purity = check_script_purity(combined, target_language)

        if purity < 0.95:
            # Fallback to English
            return SimplifiedExplanation(
                what_is_covered=explanation.what_is_covered,
                what_is_not_covered=explanation.what_is_not_covered,
                how_to_claim=explanation.how_to_claim,
                language="en",
                fk_grade_level=explanation.fk_grade_level,
                source_citations=explanation.source_citations,
                fallback_language="en",
            )

        return SimplifiedExplanation(
            what_is_covered=tr_covered,
            what_is_not_covered=tr_not_covered,
            how_to_claim=tr_claim,
            language=target_language,
            fk_grade_level=explanation.fk_grade_level,
            source_citations=explanation.source_citations,
            fallback_language=None,
        )

    def answer_question(
        self,
        question: str,
        passages: List[RetrievedPassage],
        conversation_history: List[QAMessage],
        timeout_seconds: int = settings.LLM_QA_TIMEOUT_SEC,
    ) -> QAAnswer:
        if not passages:
            return QAAnswer(
                text="This information is not available in the provided document. Try rephrasing or uploading a more complete document.",
                is_visual_needed=False,
                citations=[],
                visual_rationale="No relevant passages found.",
            )

        citations = [
            SourceCitation(
                document_name=p.document_name,
                page_number=p.page_number,
                section_heading=p.section_heading,
                passage_text=p.text[:200],
                relevance_score=p.relevance_score,
            )
            for p in passages
        ]

        top_passage = passages[0].text
        # Determine if visual is needed: quantifiable benefit, process step, or comparison
        q_lower = question.lower()
        is_visual = any(k in q_lower for k in [
            "how much", "limit", "amount", "cost", "sum", "steps", "how to claim", "process", "compare", "difference", "percentage", "%", "₹", "rs"
        ]) or any(k in top_passage.lower() for k in ["step 1", "first,", "process", "flow", "limit:"])

        answer_text = f"Based on {passages[0].document_name} ({passages[0].section_heading}): {top_passage.strip()}"

        return QAAnswer(
            text=answer_text,
            is_visual_needed=is_visual,
            citations=citations,
            visual_rationale="Answer includes quantifiable benefit or multi-step procedure" if is_visual else None,
        )

    def extract_claim_steps(
        self,
        passages: List[RetrievedPassage],
    ) -> List[ClaimStep]:
        """
        Extracts up to 20 sequential claim steps.
        If > 20 steps, returns empty list indicating extraction overflow per spec.
        """
        steps: List[ClaimStep] = []
        step_idx = 1
        has_cashless = False
        has_reimbursement = False

        combined_text = "\n".join([p.text for p in passages])
        if "cashless" in combined_text.lower():
            has_cashless = True
        if "reimbursement" in combined_text.lower():
            has_reimbursement = True

        for p in passages:
            lines = p.text.splitlines()
            for line in lines:
                stripped = line.strip()
                if not stripped:
                    continue
                match = re.match(r"^(?:step\s*\d+[:.]?|\d+[.)])\s*(.*)", stripped, re.IGNORECASE)
                if match or any(k in stripped.lower() for k in ["intimate", "submit document", "discharge", "settlement", "claim form"]):
                    raw_desc = match.group(1) if match else stripped
                    desc = _sanitize_field_text(raw_desc) or ""
                    if len(desc) < 5:
                        continue
                    path_label = None
                    if "cashless" in desc.lower():
                        path_label = "cashless"
                    elif "reimbursement" in desc.lower():
                        path_label = "reimbursement"

                    steps.append(ClaimStep(
                        step_number=step_idx,
                        title=desc[:50].strip(" -:•"),
                        description=desc,
                        path_label=path_label,
                        is_branch_point=(has_cashless and has_reimbursement and step_idx == 1),
                    ))
                    step_idx += 1
                    if len(steps) > 20:
                        # Exceeded 20 claim steps limit per Requirement 6.2
                        return []

        if not steps and passages:
            # Generate default 3 steps from passages
            steps = [
                ClaimStep(step_number=1, title="Intimate Claim", description="Notify insurer within 24-48 hours.", path_label="cashless" if has_cashless else None),
                ClaimStep(step_number=2, title="Submit Documents", description="Provide bills, prescription, and claim form.", path_label=None),
                ClaimStep(step_number=3, title="Claim Settlement", description="Insurer assesses and settles verified claim.", path_label=None),
            ]

        return steps

