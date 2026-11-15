import re
from typing import Any, Dict, List, Optional, Tuple

from app.models import (
    ClaimStep,
    ImagePrompt,
    PolicyFields,
    QAAnswer,
    SourceCitation,
    TextOverlay,
    VisualStyle,
)
from app.services.multilingual_prompt_builder import LABEL_TRANSLATIONS

STYLE_PROMPTS = {
    VisualStyle.PROFESSIONAL_INFOGRAPHIC: {
        "positive": (
            "clean award-winning flat design infographic, modern vector illustration, "
            "detailed pictorial elements showing modern hospital facade with cross, emergency ambulance, "
            "protection umbrella shield with family silhouettes, and circular coverage progress gauge meter, "
            "crisp structured cards, corporate navy and emerald palette, 150 DPI print-ready graphic design, high resolution"
        ),
        "negative": "photorealistic photo, 3D render, messy clutter, distorted lines, illegible text, low resolution, watermark",
    },
    VisualStyle.ILLUSTRATED_CARTOON: {
        "positive": (
            "friendly modern insurance cartoon style visual explainer, approachable vector illustrations of doctors, "
            "family protection umbrella, clinic building with cross, rounded cards, vibrant inviting colors, "
            "clear readable hierarchy, 150 DPI vector layout"
        ),
        "negative": "photorealistic, technical diagram, gloomy, dark, realistic humans, messy artifacts",
    },
    VisualStyle.FLOWCHART_DIAGRAM: {
        "positive": (
            "technical insurance claims flowchart diagram, sequential process node boxes with rounded corners, "
            "directional connector arrows with arrowheads, decision split diamond node for cashless vs reimbursement, "
            "numerical step badges 01 02 03 04, status pills, crisp blueprint white background, clean orthogonal chart layout, high legibility"
        ),
        "negative": "artistic decoration, chaotic circular spaghetti lines, disconnected arrows, 3D render, dark background, blurry labels",
    },
}

class VisualPromptBuilder:
    def __init__(self, default_font_path: str = "fonts/NotoSans-en.ttf"):
        self.default_font_path = default_font_path

    def _get_style_modifiers(self, style: VisualStyle) -> Tuple[str, str]:
        config = STYLE_PROMPTS.get(style, STYLE_PROMPTS[VisualStyle.PROFESSIONAL_INFOGRAPHIC])
        return config["positive"], config["negative"]

    @staticmethod
    def compile_flux_prompt(subject: str, layout_type: str, details: str, text_labels: List[str]) -> str:
        """
        FLUX.1 Engine Compiler:
        Natural language cinematography & commercial art direction brief.
        Physical materials, lighting, and explicit quoted typography.
        """
        quotes_str = ", ".join([f'"{lbl}"' for lbl in text_labels[:4]])
        return (
            f"Commercial art direction photograph and vector visual explainer for {subject}. "
            f"Composition: 1:1 square aspect ratio, modular {layout_type} layout, generous clean negative space. "
            f"Materials: Frosted glassmorphism panels, beveled white card surfaces, soft drop-shadows, matte finish. "
            f"Lighting: Soft diffused studio softbox lighting with subtle ambient occlusion and edge rim highlights. "
            f"Palette: Modern slate navy (#0F172A), vibrant royal blue (#2563EB), emerald (#059669), and amber (#D97706). "
            f"Content details: {details}. "
            f"Explicit legible typography reading: {quotes_str}. High resolution, 150 DPI print-ready graphic design."
        )

    @staticmethod
    def compile_ideogram_prompt(subject: str, layout_type: str, details: str, text_labels: List[str]) -> str:
        """
        Ideogram Engine Compiler:
        Poster/vector infographic design with graphic hierarchy and double-quoted title badges.
        """
        quotes_str = ", ".join([f'"{lbl}"' for lbl in text_labels[:4]])
        return (
            f"Vector infographic poster design: {subject}. "
            f"Format: Modern corporate dashboard {layout_type} with structured cards, rounded pill badges, and vector icons. "
            f"Color Scheme: Crisp white background, navy headers, emerald and blue accents. "
            f"Typography: Bold legible sans-serif text labels featuring {quotes_str}. "
            f"Key metrics: {details}. Award-winning editorial layout, vector illustration, sharp edges, 150 DPI."
        )

    @staticmethod
    def compile_midjourney_prompt(subject: str, layout_type: str, details: str, style_name: str = "infographic") -> str:
        """
        Midjourney Engine Compiler:
        Front-loaded subject tokens, clean aesthetic descriptors, and CLI parameters.
        """
        return (
            f"{subject}, modern {style_name} layout, {details}, "
            f"fintech dashboard UI, vector medical icons, clean typography, soft studio lighting, "
            f"minimalist corporate aesthetic --ar 1:1 --v 6.0 --style raw"
        )

    def build_coverage_prompt(
        self,
        fields: PolicyFields,
        style: VisualStyle = VisualStyle.PROFESSIONAL_INFOGRAPHIC,
        language: str = "en",
        visual_spec: Optional[Dict[str, Any]] = None,
    ) -> ImagePrompt:
        pos_style, neg_style = self._get_style_modifiers(style)

        # Extract or synthesize at least 3 categories with amounts
        categories = []
        limits_text = str(fields.coverage_limits.value or "")
        type_text = str(fields.coverage_type.value or "Hospitalization & Inpatient Care")
        prem_text = str(fields.premium_details.value or "")
        excl_text = str(fields.exclusions.value or "")

        # Extract numeric values
        numbers = re.findall(
            r"(?:Rs\.?|₹|\$)?\s*\d+(?:,\d+)*(?:\.\d+)?(?:\s*(?:lakh|crore|thousand))?",
            f"{limits_text} {type_text} {prem_text}"
        )
        
        amt1 = numbers[0] if len(numbers) > 0 else "Rs. 5,00,000"
        amt2 = numbers[1] if len(numbers) > 1 else "Rs. 50,000"
        amt3 = numbers[2] if len(numbers) > 2 else "100% Covered"

        categories.append(f"Primary Coverage: {amt1}")
        categories.append(f"Pre & Post Care: {amt2}")
        categories.append(f"Day Care Procedures: {amt3}")

        categories_str = ", ".join(categories)
        lang_directive = f" rendered with text in {language} script" if language != "en" else " in English"

        prompt_text = (
            f"Insurance Coverage Infographic and Visual Explainer for '{type_text}'. "
            f"Key pictorial illustrations: modern hospital architectural facade with emergency medical cross, "
            f"protective family umbrella shield, and circular coverage progress gauge meter. "
            f"Structured visual cards highlighting coverage limits: {categories_str}. "
            f"Crisp icons for inpatient admission, room rent caps, ambulance service, and day-care surgery. "
            f"{pos_style}{lang_directive}."
        )

        lbl_dict = LABEL_TRANSLATIONS.get(language, LABEL_TRANSLATIONS["en"])
        title_cov = lbl_dict.get("title_coverage", "POLICY COVERAGE OVERVIEW")
        total_lbl = lbl_dict.get("total_cover", "Total Cover")
        sub_lbl = lbl_dict.get("sub_limit", "Sub-limit")
        add_lbl = lbl_dict.get("additional", "Additional")

        overlays = [
            TextOverlay(
                text=title_cov,
                position=(80, 60),
                font_size=42,
                font_path=f"fonts/NotoSans-{language}.ttf",
                color="#0F172A",
            ),
            TextOverlay(
                text=f"{total_lbl}: {amt1}",
                position=(80, 150),
                font_size=32,
                font_path=f"fonts/NotoSans-{language}.ttf",
                color="#2563EB",
            ),
            TextOverlay(
                text=f"{sub_lbl}: {amt2}",
                position=(80, 220),
                font_size=28,
                font_path=f"fonts/NotoSans-{language}.ttf",
                color="#059669",
            ),
            TextOverlay(
                text=f"{add_lbl}: {amt3}",
                position=(80, 280),
                font_size=28,
                font_path=f"fonts/NotoSans-{language}.ttf",
                color="#D97706",
            ),
        ]

        citations = []
        for pid in (fields.coverage_limits.source_passage_ids or []):
            citations.append(SourceCitation(
                document_name="Policy Document",
                page_number=1,
                section_heading="Coverage Limits",
                passage_text=limits_text[:120],
                relevance_score=0.9,
            ))

        # Compilers based on leading industry practices
        labels = [amt1, amt2, amt3, "COVERAGE OVERVIEW"]
        compiled = {
            "flux": self.compile_flux_prompt(f"Policy Coverage for {type_text}", "dashboard infographic", categories_str, labels),
            "ideogram": self.compile_ideogram_prompt(f"Coverage Schedule for {type_text}", "card dashboard", categories_str, labels),
            "midjourney": self.compile_midjourney_prompt(f"Health insurance coverage infographic for {type_text}", "infographic", categories_str, "infographic"),
        }

        structured = {
            "type": "coverage",
            "language": language,
            "title": type_text,
            "sum_insured": amt1,
            "sub_limit": amt2,
            "additional": amt3,
            "categories": categories,
            "premium_details": prem_text,
            "exclusions": excl_text,
        }
        if visual_spec and isinstance(visual_spec, dict):
            structured.update({
                "custom_title": visual_spec.get("title"),
                "custom_subtitle": visual_spec.get("subtitle"),
                "custom_chips": visual_spec.get("chips"),
                "custom_cards": visual_spec.get("cards"),
            })
            if visual_spec.get("sum_insured"):
                structured["sum_insured"] = visual_spec["sum_insured"]
            if visual_spec.get("sub_limit"):
                structured["sub_limit"] = visual_spec["sub_limit"]
            if visual_spec.get("additional"):
                structured["additional"] = visual_spec["additional"]

        return ImagePrompt(
            prompt_text=prompt_text,
            negative_prompt=neg_style,
            style=style,
            language=language,
            text_overlays=overlays,
            source_citations=citations,
            compiled_prompts=compiled,
            structured_data=structured,
        )

    def build_claims_prompt(
        self,
        steps: List[ClaimStep],
        style: VisualStyle = VisualStyle.FLOWCHART_DIAGRAM,
        has_dual_path: bool = False,
        language: str = "en",
        visual_spec: Optional[Dict[str, Any]] = None,
    ) -> ImagePrompt:
        pos_style, neg_style = self._get_style_modifiers(style)
        
        # Sort steps by step_number
        sorted_steps = sorted(steps, key=lambda s: s.step_number)

        step_descriptions = []
        for s in sorted_steps:
            prefix = f"Stage {s.step_number}"
            if s.path_label:
                prefix += f" [{s.path_label.upper()}]"
            step_descriptions.append(f"{prefix}: {s.title}")

        dual_path_directive = ""
        if has_dual_path or any(s.path_label for s in sorted_steps):
            dual_path_directive = " Dual path visual showing Cashless Hospitalization on the left and Reimbursement Claim on the right."

        steps_joined = " -> ".join(step_descriptions)
        lang_directive = f" text labels in {language}" if language != "en" else ""

        prompt_text = (
            f"Step-by-step Technical Insurance Claims Process Flowchart Diagram: {steps_joined}. "
            f"{dual_path_directive} Flowchart architecture features sequential rounded process cards, "
            f"connecting directional arrows with sharp arrowheads, a central Decision Diamond node splitting "
            f"into Cashless Hospitalization (Path A) vs Reimbursement Claim Filing (Path B), "
            f"and converging into Final Claim Adjudication & NEFT Settlement with verified shield checkmark. "
            f"Numbered step badges (01, 02, 03, 04) and status pills. {pos_style}{lang_directive}."
        )

        lbl_dict = LABEL_TRANSLATIONS.get(language, LABEL_TRANSLATIONS["en"])
        title_cl = lbl_dict.get("title_claims", "CLAIMS PROCEDURE FLOWCHART")
        step_word = lbl_dict.get("step", "Step")

        overlays = [
            TextOverlay(
                text=title_cl,
                position=(80, 60),
                font_size=40,
                font_path=f"fonts/NotoSans-{language}.ttf",
                color="#0F172A",
            )
        ]

        y_offset = 150
        for s in sorted_steps[:6]:
            path_tag = lbl_dict.get(s.path_label, s.path_label.upper()) if s.path_label else ""
            prefix = f"[{path_tag}] " if path_tag else ""
            lbl = f"{prefix}{step_word} {s.step_number}: {s.title}"
            overlays.append(TextOverlay(
                text=lbl[:60],
                position=(80, y_offset),
                font_size=26,
                font_path=f"fonts/NotoSans-{language}.ttf",
                color="#1E293B",
            ))
            y_offset += 70

        labels = [s.title for s in sorted_steps[:4]] or ["Cashless Claim", "Reimbursement", "Intimation", "Settlement"]
        compiled = {
            "flux": self.compile_flux_prompt("Insurance Claims Procedure Flowchart", "dual-path workflow", steps_joined, labels),
            "ideogram": self.compile_ideogram_prompt("Claims Process Diagram", "sequential flowchart", steps_joined, labels),
            "midjourney": self.compile_midjourney_prompt("Claims process flowchart diagram", "flowchart diagram", steps_joined, "technical flowchart"),
        }

        structured = {
            "type": "claims",
            "language": language,
            "title": title_cl,
            "steps": [
                {
                    "step_number": s.step_number,
                    "title": s.title,
                    "description": s.description,
                    "path_label": s.path_label,
                }
                for s in sorted_steps
            ],
            "has_dual_path": has_dual_path or any(s.path_label for s in sorted_steps),
        }
        if visual_spec and isinstance(visual_spec, dict):
            dp = visual_spec.get("dual_path") if isinstance(visual_spec.get("dual_path"), dict) else {}
            structured.update({
                "custom_flowchart_title": visual_spec.get("flowchart_title"),
                "custom_flowchart_subtitle": visual_spec.get("flowchart_subtitle"),
                "has_dual_path": visual_spec.get("has_dual_path", True),
                "custom_stages": visual_spec.get("stages") or [],
                "custom_dual_path": dp,
                "custom_final_stage": visual_spec.get("final_stage") or {},
                "custom_stage1_title": visual_spec.get("stage1_title"),
                "custom_stage1_desc1": visual_spec.get("stage1_desc1"),
                "custom_stage1_desc2": visual_spec.get("stage1_desc2"),
                "custom_stage2_title": visual_spec.get("stage2_title"),
                "custom_stage2_desc1": visual_spec.get("stage2_desc1"),
                "custom_stage2_desc2": visual_spec.get("stage2_desc2"),
                "custom_steps_a": visual_spec.get("steps_a") or dp.get("steps_a"),
                "custom_steps_b": visual_spec.get("steps_b") or dp.get("steps_b"),
                "custom_stage4_title": visual_spec.get("stage4_title") or (visual_spec.get("final_stage", {}).get("title") if isinstance(visual_spec.get("final_stage"), dict) else None),
                "custom_stage4_desc1": visual_spec.get("stage4_desc1") or (visual_spec.get("final_stage", {}).get("desc1") if isinstance(visual_spec.get("final_stage"), dict) else None),
                "custom_stage4_desc2": visual_spec.get("stage4_desc2") or (visual_spec.get("final_stage", {}).get("desc2") if isinstance(visual_spec.get("final_stage"), dict) else None),
            })

        return ImagePrompt(
            prompt_text=prompt_text,
            negative_prompt=neg_style,
            style=style,
            language=language,
            text_overlays=overlays,
            source_citations=[],
            compiled_prompts=compiled,
            structured_data=structured,
        )

    def build_qa_visual_prompt(
        self,
        answer: QAAnswer,
        style: VisualStyle = VisualStyle.PROFESSIONAL_INFOGRAPHIC,
        language: str = "en",
    ) -> Optional[ImagePrompt]:
        if not answer.is_visual_needed:
            return None

        pos_style, neg_style = self._get_style_modifiers(style)
        lbl_dict = LABEL_TRANSLATIONS.get(language, LABEL_TRANSLATIONS["en"])
        title_qa = lbl_dict.get("title_qa", "POLICY ANSWER BREAKDOWN")
        prompt_text = (
            f"Focused educational infographic illustrating policy query: {answer.text[:150]}. "
            f"Visual cards, numerical highlight badge, clarity diagrams. {pos_style}."
        )

        overlays = [
            TextOverlay(
                text=title_qa,
                position=(80, 60),
                font_size=38,
                font_path=f"fonts/NotoSans-{language}.ttf",
                color="#0F172A",
            ),
            TextOverlay(
                text=answer.text[:80],
                position=(80, 150),
                font_size=26,
                font_path=f"fonts/NotoSans-{language}.ttf",
                color="#334155",
            ),
        ]

        compiled = {
            "flux": self.compile_flux_prompt("Policy Query Explainer", "single-topic card", answer.text[:120], ["POLICY Q&A", "VERIFIED CLAUSE"]),
            "ideogram": self.compile_ideogram_prompt("Policy QA Breakdown", "explanatory card", answer.text[:120], ["POLICY Q&A", "VERIFIED CLAUSE"]),
            "midjourney": self.compile_midjourney_prompt("Policy question breakdown infographic", "infographic", answer.text[:120], "infographic"),
        }

        return ImagePrompt(
            prompt_text=prompt_text,
            negative_prompt=neg_style,
            style=style,
            language=language,
            text_overlays=overlays,
            source_citations=answer.citations,
            compiled_prompts=compiled,
            structured_data={"type": "qa_answer", "answer": answer.text},
        )
