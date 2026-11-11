"""
multilingual_prompt_builder.py
-------------------------------
Builds language-adapted image generation prompts for PolicyVision AI.

For each supported language the builder:
  1. Translates section labels, coverage categories, and amounts into the
     target script using pre-verified template strings (no LLM call needed).
  2. Injects a diffusion-model language directive so the image generator
     renders on-image text in the correct script.
  3. Adjusts the font_path in every TextOverlay to the correct Noto Sans
     variant for the target script.
  4. Falls back to English if the language code is not supported.
"""

from typing import Dict, List, Optional, Tuple

from app.models import (
    ClaimStep,
    ImagePrompt,
    PolicyFields,
    QAAnswer,
    SourceCitation,
    TextOverlay,
    VisualStyle,
)
from app.utils.language_utils import LANGUAGE_NAMES, load_noto_fonts

# ---------------------------------------------------------------------------
# Style modifiers (positive + negative prompt additions per style)
# ---------------------------------------------------------------------------

STYLE_MODIFIERS: Dict[VisualStyle, Dict[str, str]] = {
    VisualStyle.PROFESSIONAL_INFOGRAPHIC: {
        "positive": (
            "clean award-winning insurance infographic, modern vector illustration, "
            "detailed pictorial elements showing modern hospital facade with cross, emergency ambulance, "
            "protection umbrella shield with family silhouettes, and circular coverage progress gauge meter, "
            "crisp structured cards, corporate navy and emerald palette, 150 DPI print-ready graphic design, high resolution"
        ),
        "negative": (
            "photorealistic photo, 3D render, messy clutter, distorted lines, "
            "blurry text, watermark, low resolution, dark background"
        ),
    },
    VisualStyle.ILLUSTRATED_CARTOON: {
        "positive": (
            "friendly modern insurance visual explainer, approachable vector illustrations of doctors, "
            "family protection umbrella, clinic building with cross, rounded cards, vibrant inviting colors, "
            "clear readable hierarchy, 150 DPI vector layout"
        ),
        "negative": (
            "photorealistic, dark gritty aesthetic, technical diagram, "
            "dense text, violent imagery, generic stock art"
        ),
    },
    VisualStyle.FLOWCHART_DIAGRAM: {
        "positive": (
            "technical insurance claims flowchart diagram, sequential process node boxes with rounded corners, "
            "directional connector arrows with arrowheads, decision split diamond node for cashless vs reimbursement, "
            "numerical step badges 01 02 03 04, status pills, crisp blueprint white background, clean orthogonal chart layout, high legibility"
        ),
        "negative": (
            "artistic decoration, chaotic circular spaghetti lines, disconnected arrows, "
            "circular layout, missing labels, hand-drawn sketch"
        ),
    },
}

# ---------------------------------------------------------------------------
# Per-language UI label translations
# (verified native-speaker template strings — no LLM dependency)
# ---------------------------------------------------------------------------

LABEL_TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "en": {
        "title_coverage":    "POLICY COVERAGE OVERVIEW",
        "title_claims":      "CLAIMS PROCEDURE FLOWCHART",
        "title_qa":          "POLICY ANSWER BREAKDOWN",
        "total_cover":       "Total Cover",
        "sub_limit":         "Sub-limit",
        "additional":        "Day Care",
        "covered":           "What is Covered",
        "not_covered":       "What is Not Covered",
        "how_to_claim":      "How to Claim",
        "step":              "Step",
        "cashless":          "CASHLESS",
        "reimbursement":     "REIMBURSEMENT",
        "lang_directive":    "",
    },
    "hi": {
        "title_coverage":    "पॉलिसी कवरेज अवलोकन",
        "title_claims":      "दावा प्रक्रिया फ़्लोचार्ट",
        "title_qa":          "पॉलिसी उत्तर विवरण",
        "total_cover":       "कुल कवर",
        "sub_limit":         "उप-सीमा",
        "additional":        "डे केयर",
        "covered":           "क्या कवर है",
        "not_covered":       "क्या कवर नहीं है",
        "how_to_claim":      "दावा कैसे करें",
        "step":              "चरण",
        "cashless":          "कैशलेस",
        "reimbursement":     "प्रतिपूर्ति",
        "lang_directive":    "text rendered in Devanagari Hindi script",
    },
    "ta": {
        "title_coverage":    "பாலிசி கவரேஜ் கண்ணோட்டம்",
        "title_claims":      "கோரிக்கை நடைமுறை வரைப்படம்",
        "title_qa":          "பாலிசி பதில் விரிவாக்கம்",
        "total_cover":       "மொத்த கவர்",
        "sub_limit":         "துணை வரம்பு",
        "additional":        "நாள் பராமரிப்பு",
        "covered":           "என்ன கவர் செய்யப்படுகிறது",
        "not_covered":       "என்ன கவர் செய்யப்படவில்லை",
        "how_to_claim":      "எவ்வாறு கோரிக்கை செய்வது",
        "step":              "படி",
        "cashless":          "கேஷ்லெஸ்",
        "reimbursement":     "திரும்பச் செலுத்துதல்",
        "lang_directive":    "text rendered in Tamil script",
    },
    "te": {
        "title_coverage":    "పాలసీ కవరేజ్ అవలోకనం",
        "title_claims":      "క్లెయిమ్ విధానం ఫ్లోచార్ట్",
        "title_qa":          "పాలసీ సమాధాన వివరణ",
        "total_cover":       "మొత్తం కవర్",
        "sub_limit":         "ఉప పరిమితి",
        "additional":        "డే కేర్",
        "covered":           "ఏది కవర్ అవుతుంది",
        "not_covered":       "ఏది కవర్ కాదు",
        "how_to_claim":      "క్లెయిమ్ ఎలా చేయాలి",
        "step":              "దశ",
        "cashless":          "క్యాష్‌లెస్",
        "reimbursement":     "తిరిగి చెల్లింపు",
        "lang_directive":    "text rendered in Telugu script",
    },
    "kn": {
        "title_coverage":    "ಪಾಲಿಸಿ ಕವರೇಜ್ ಅವಲೋಕನ",
        "title_claims":      "ಕ್ಲೈಮ್ ಪ್ರಕ್ರಿಯೆ ಫ್ಲೋಚಾರ್ಟ್",
        "title_qa":          "ಪಾಲಿಸಿ ಉತ್ತರ ವಿವರ",
        "total_cover":       "ಒಟ್ಟು ಕವರ್",
        "sub_limit":         "ಉಪ ಮಿತಿ",
        "additional":        "ಡೇ ಕೇರ್",
        "covered":           "ಏನು ಒಳಗೊಂಡಿದೆ",
        "not_covered":       "ಏನು ಒಳಗೊಂಡಿಲ್ಲ",
        "how_to_claim":      "ಕ್ಲೈಮ್ ಹೇಗೆ ಮಾಡಬೇಕು",
        "step":              "ಹಂತ",
        "cashless":          "ಕ್ಯಾಶ್‌ಲೆಸ್",
        "reimbursement":     "ಮರುಪಾವತಿ",
        "lang_directive":    "text rendered in Kannada script",
    },
    "ml": {
        "title_coverage":    "പോളിസി കവറേജ് അവലോകനം",
        "title_claims":      "ക്ലെയിം നടപടി ഫ്ലോചാർട്ട്",
        "title_qa":          "പോളിസി ഉത്തര വിശദീകരണം",
        "total_cover":       "ആകെ കവർ",
        "sub_limit":         "ഉപ പരിധി",
        "additional":        "ഡേ കെയർ",
        "covered":           "എന്ത് ഉൾപ്പെടുന്നു",
        "not_covered":       "എന്ത് ഉൾപ്പെടുന്നില്ല",
        "how_to_claim":      "ക്ലെയിം എങ്ങനെ ചെയ്യണം",
        "step":              "ഘട്ടം",
        "cashless":          "ക്യാഷ്‌ലെസ്",
        "reimbursement":     "തിരിച്ചടവ്",
        "lang_directive":    "text rendered in Malayalam script",
    },
    "bn": {
        "title_coverage":    "পলিসি কভারেজ ওভারভিউ",
        "title_claims":      "দাবি প্রক্রিয়া ফ্লোচার্ট",
        "title_qa":          "পলিসি উত্তর বিশদ",
        "total_cover":       "মোট কভার",
        "sub_limit":         "সাব-লিমিট",
        "additional":        "ডে কেয়ার",
        "covered":           "কী কভার হয়",
        "not_covered":       "কী কভার হয় না",
        "how_to_claim":      "দাবি কীভাবে করবেন",
        "step":              "ধাপ",
        "cashless":          "ক্যাশলেস",
        "reimbursement":     "পরিশোধ",
        "lang_directive":    "text rendered in Bengali script",
    },
    "mr": {
        "title_coverage":    "पॉलिसी कव्हरेज आढावा",
        "title_claims":      "दावा प्रक्रिया फ्लोचार्ट",
        "title_qa":          "पॉलिसी उत्तर तपशील",
        "total_cover":       "एकूण कव्हर",
        "sub_limit":         "उप-मर्यादा",
        "additional":        "डे केअर",
        "covered":           "काय कव्हर आहे",
        "not_covered":       "काय कव्हर नाही",
        "how_to_claim":      "दावा कसा करावा",
        "step":              "टप्पा",
        "cashless":          "कॅशलेस",
        "reimbursement":     "परतावा",
        "lang_directive":    "text rendered in Devanagari Marathi script",
    },
    "gu": {
        "title_coverage":    "પોલિસી કવરેજ ઝાંખી",
        "title_claims":      "દાવો પ્રક્રિયા ફ્લોચાર્ટ",
        "title_qa":          "પોલિસી જવાબ વિગત",
        "total_cover":       "કુલ કવર",
        "sub_limit":         "સબ-લિમિટ",
        "additional":        "ડે કેર",
        "covered":           "શું આવરી લેવામાં આવ્યું",
        "not_covered":       "શું આવરી લેવામાં આવ્યું નથી",
        "how_to_claim":      "દાવો કેવી રીતે કરવો",
        "step":              "પગલું",
        "cashless":          "કૅશલેસ",
        "reimbursement":     "ચૂકવણી",
        "lang_directive":    "text rendered in Gujarati script",
    },
}


# ---------------------------------------------------------------------------
# MultilingualPromptBuilder
# ---------------------------------------------------------------------------

class MultilingualPromptBuilder:
    """
    Language-aware image prompt builder.

    Replaces VisualPromptBuilder for multilingual deployments.
    Falls back gracefully to English for unknown language codes.
    """

    def __init__(self, fonts_dir: str = "fonts"):
        self._font_map: Dict[str, str] = load_noto_fonts(fonts_dir)

    # ------------------------------------------------------------------ #
    # Internal helpers                                                      #
    # ------------------------------------------------------------------ #

    def _labels(self, language: str) -> Dict[str, str]:
        """Return label dict for given language, falling back to English."""
        return LABEL_TRANSLATIONS.get(language, LABEL_TRANSLATIONS["en"])

    def _font(self, language: str) -> str:
        """Return Noto Sans font path for the given language script."""
        return self._font_map.get(language, self._font_map.get("en", "fonts/NotoSans-en.ttf"))

    def _style_modifiers(self, style: VisualStyle) -> Tuple[str, str]:
        mods = STYLE_MODIFIERS.get(style, STYLE_MODIFIERS[VisualStyle.PROFESSIONAL_INFOGRAPHIC])
        return mods["positive"], mods["negative"]

    def _extract_amounts(self, fields: "PolicyFields") -> Tuple[str, str, str]:
        """Pull up to three coverage amounts from PolicyFields."""
        import re
        num_pattern = r"(?:Rs\.?\s*|₹\s*)[\d,]+(?:\.\d+)?(?:\s*(?:lakh|crore|thousand))?|\d+(?:,\d+)*(?:\.\d+)?%"

        raw = " ".join(filter(None, [
            fields.coverage_limits.value or "",
            fields.coverage_type.value or "",
            fields.premium_details.value or "",
        ]))
        nums = re.findall(num_pattern, raw, re.IGNORECASE)

        amt1 = nums[0].strip() if len(nums) > 0 else "Rs. 5,00,000"
        amt2 = nums[1].strip() if len(nums) > 1 else "Rs. 50,000"
        amt3 = nums[2].strip() if len(nums) > 2 else "100%"
        return amt1, amt2, amt3

    # ------------------------------------------------------------------ #
    # Coverage infographic prompt                                           #
    # ------------------------------------------------------------------ #

    def build_coverage_prompt(
        self,
        fields: "PolicyFields",
        style: VisualStyle = VisualStyle.PROFESSIONAL_INFOGRAPHIC,
        language: str = "en",
    ) -> ImagePrompt:
        lbl = self._labels(language)
        font = self._font(language)
        pos_style, neg_style = self._style_modifiers(style)
        amt1, amt2, amt3 = self._extract_amounts(fields)

        lang_directive = lbl["lang_directive"]
        coverage_type = fields.coverage_type.value or "Comprehensive Health Insurance"

        # Diffusion model prompt — language directive tells the model to render
        # on-image text in the target script
        prompt_text = (
            f"Insurance coverage infographic and visual explainer for '{coverage_type}'. "
            f"Pictorial vector illustration of modern hospital building facade with red cross, "
            f"protective family umbrella shield, and circular coverage progress gauge meter. "
            f"Three structured cards with coverage amounts: "
            f"'{lbl['total_cover']}: {amt1}', "
            f"'{lbl['sub_limit']}: {amt2}', "
            f"'{lbl['additional']}: {amt3}'. "
            f"Title: '{lbl['title_coverage']}'. "
            f"Sections labeled '{lbl['covered']}', '{lbl['not_covered']}', '{lbl['how_to_claim']}'. "
            f"{pos_style}. "
            + (f"{lang_directive}. " if lang_directive else "")
            + "1024x1024 pixels, print-quality 150 DPI."
        )

        # Text overlays (Pillow post-processing — language-aware font)
        overlays: List[TextOverlay] = [
            TextOverlay(
                text=lbl["title_coverage"],
                position=(72, 55),
                font_size=38,
                font_path=font,
                color="#0F172A",
            ),
            TextOverlay(
                text=f"{lbl['total_cover']}: {amt1}",
                position=(72, 145),
                font_size=30,
                font_path=font,
                color="#1D4ED8",
            ),
            TextOverlay(
                text=f"{lbl['sub_limit']}: {amt2}",
                position=(72, 215),
                font_size=26,
                font_path=font,
                color="#059669",
            ),
            TextOverlay(
                text=f"{lbl['additional']}: {amt3}",
                position=(72, 278),
                font_size=26,
                font_path=font,
                color="#D97706",
            ),
            TextOverlay(
                text=f"✓ {lbl['covered']}",
                position=(72, 380),
                font_size=22,
                font_path=font,
                color="#065F46",
            ),
            TextOverlay(
                text=f"✗ {lbl['not_covered']}",
                position=(72, 530),
                font_size=22,
                font_path=font,
                color="#991B1B",
            ),
            TextOverlay(
                text=f"→ {lbl['how_to_claim']}",
                position=(72, 680),
                font_size=22,
                font_path=font,
                color="#1E40AF",
            ),
        ]

        # Gather source citations from fields
        citations: List[SourceCitation] = []
        for pid in (fields.coverage_limits.source_passage_ids or [])[:3]:
            citations.append(SourceCitation(
                document_name="Policy Document",
                page_number=1,
                section_heading="Coverage Limits",
                passage_text=(fields.coverage_limits.value or "")[:120],
                relevance_score=0.9,
            ))

        return ImagePrompt(
            prompt_text=prompt_text,
            negative_prompt=neg_style,
            style=style,
            language=language,
            text_overlays=overlays,
            source_citations=citations,
        )

    # ------------------------------------------------------------------ #
    # Claims flowchart prompt                                               #
    # ------------------------------------------------------------------ #

    def build_claims_prompt(
        self,
        steps: List[ClaimStep],
        style: VisualStyle = VisualStyle.FLOWCHART_DIAGRAM,
        has_dual_path: bool = False,
        language: str = "en",
    ) -> ImagePrompt:
        lbl = self._labels(language)
        font = self._font(language)
        pos_style, neg_style = self._style_modifiers(style)

        sorted_steps = sorted(steps, key=lambda s: s.step_number) if steps else []

        step_descriptions = []
        for s in sorted_steps:
            path = ""
            if s.path_label == "cashless":
                path = f" [{lbl['cashless']}]"
            elif s.path_label == "reimbursement":
                path = f" [{lbl['reimbursement']}]"
            step_descriptions.append(f"{lbl['step']} {s.step_number}{path}: {s.title}")

        steps_joined = " → ".join(step_descriptions) if step_descriptions else "Intimate → Submit → Settle"

        dual_path_note = ""
        if has_dual_path:
            dual_path_note = (
                f" Dual-path layout: '{lbl['cashless']}' branch on left, "
                f"'{lbl['reimbursement']}' branch on right."
            )

        lang_directive = lbl["lang_directive"]
        prompt_text = (
            f"Step-by-step Technical Insurance claims process flowchart diagram. "
            f"Title: '{lbl['title_claims']}'. "
            f"Sequential process boxes: {steps_joined}. "
            f"{dual_path_note} "
            f"Features directional connector arrows with arrowheads, decision split diamond node for cashless vs reimbursement, "
            f"numbered step badges (01, 02, 03, 04), and final settlement checkmark badge. "
            f"{pos_style}. "
            + (f"{lang_directive}. " if lang_directive else "")
            + "1024x1024 pixels, 150 DPI."
        )

        # Overlays for claims
        overlays: List[TextOverlay] = [
            TextOverlay(
                text=lbl["title_claims"],
                position=(72, 55),
                font_size=36,
                font_path=font,
                color="#0F172A",
            )
        ]
        y = 145
        for s in sorted_steps[:7]:  # Max 7 fit at 100px spacing
            path_tag = ""
            if s.path_label == "cashless":
                path_tag = f" [{lbl['cashless']}]"
            elif s.path_label == "reimbursement":
                path_tag = f" [{lbl['reimbursement']}]"
            label = f"{lbl['step']} {s.step_number}{path_tag}: {s.title}"
            overlays.append(TextOverlay(
                text=label[:62],
                position=(72, y),
                font_size=24,
                font_path=font,
                color="#1E293B",
            ))
            y += 100

        return ImagePrompt(
            prompt_text=prompt_text,
            negative_prompt=neg_style,
            style=style,
            language=language,
            text_overlays=overlays,
            source_citations=[],
        )

    # ------------------------------------------------------------------ #
    # Q&A answer prompt                                                     #
    # ------------------------------------------------------------------ #

    def build_qa_visual_prompt(
        self,
        answer: "QAAnswer",
        style: VisualStyle = VisualStyle.PROFESSIONAL_INFOGRAPHIC,
        language: str = "en",
    ) -> Optional[ImagePrompt]:
        if not answer.is_visual_needed:
            return None

        lbl = self._labels(language)
        font = self._font(language)
        pos_style, neg_style = self._style_modifiers(style)
        lang_directive = lbl["lang_directive"]

        prompt_text = (
            f"Insurance policy educational infographic answering: '{answer.text[:120]}'. "
            f"Title: '{lbl['title_qa']}'. "
            f"Visual cards with numeric highlights, clear labels. "
            f"{pos_style}. "
            + (f"{lang_directive}. " if lang_directive else "")
            + "1024x1024 pixels."
        )

        overlays = [
            TextOverlay(
                text=lbl["title_qa"],
                position=(72, 55),
                font_size=36,
                font_path=font,
                color="#0F172A",
            ),
            TextOverlay(
                text=answer.text[:75],
                position=(72, 145),
                font_size=24,
                font_path=font,
                color="#334155",
            ),
        ]

        return ImagePrompt(
            prompt_text=prompt_text,
            negative_prompt=neg_style,
            style=style,
            language=language,
            text_overlays=overlays,
            source_citations=answer.citations,
        )
