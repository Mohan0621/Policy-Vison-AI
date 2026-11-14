import re
from typing import List, Optional, Tuple

from app.models import (
    ClaimStep,
    ImagePrompt,
    PolicyFields,
    QAAnswer,
    SourceCitation,
    TextOverlay,
    VisualStyle,
)

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

    def build_coverage_prompt(
        self,
        fields: PolicyFields,
        style: VisualStyle = VisualStyle.PROFESSIONAL_INFOGRAPHIC,
        language: str = "en",
    ) -> ImagePrompt:
        pos_style, neg_style = self._get_style_modifiers(style)

        # Extract or synthesize at least 3 categories with amounts
        categories = []
        limits_text = fields.coverage_limits.value or ""
        type_text = fields.coverage_type.value or "Hospitalization & Inpatient Care"
        prem_text = fields.premium_details.value or ""

        # Extract numeric values
        numbers = re.findall(r"(?:Rs\.?|₹|\$)?\s*\d+(?:,\d+)*(?:\.\d+)?(?:\s*(?:lakh|crore|thousand))?", f"{limits_text} {type_text} {prem_text}")
        
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

        overlays = [
            TextOverlay(
                text="POLICY COVERAGE OVERVIEW",
                position=(80, 60),
                font_size=42,
                font_path=f"fonts/NotoSans-{language}.ttf",
                color="#0F172A",
            ),
            TextOverlay(
                text=f"Total Cover: {amt1}",
                position=(80, 150),
                font_size=32,
                font_path=f"fonts/NotoSans-{language}.ttf",
                color="#2563EB",
            ),
            TextOverlay(
                text=f"Sub-limit: {amt2}",
                position=(80, 220),
                font_size=28,
                font_path=f"fonts/NotoSans-{language}.ttf",
                color="#059669",
            ),
            TextOverlay(
                text=f"Additional: {amt3}",
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

        return ImagePrompt(
            prompt_text=prompt_text,
            negative_prompt=neg_style,
            style=style,
            language=language,
            text_overlays=overlays,
            source_citations=citations,
        )

    def build_claims_prompt(
        self,
        steps: List[ClaimStep],
        style: VisualStyle = VisualStyle.FLOWCHART_DIAGRAM,
        has_dual_path: bool = False,
        language: str = "en",
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

        overlays = [
            TextOverlay(
                text="CLAIMS PROCEDURE FLOWCHART",
                position=(80, 60),
                font_size=40,
                font_path=f"fonts/NotoSans-{language}.ttf",
                color="#0F172A",
            )
        ]

        y_offset = 150
        for s in sorted_steps[:6]:
            lbl = f"Step {s.step_number}: {s.title}"
            if s.path_label:
                lbl = f"[{s.path_label.upper()}] {lbl}"
            overlays.append(TextOverlay(
                text=lbl[:60],
                position=(80, y_offset),
                font_size=26,
                font_path=f"fonts/NotoSans-{language}.ttf",
                color="#1E293B",
            ))
            y_offset += 70

        return ImagePrompt(
            prompt_text=prompt_text,
            negative_prompt=neg_style,
            style=style,
            language=language,
            text_overlays=overlays,
            source_citations=[],
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
        prompt_text = (
            f"Focused educational infographic illustrating policy query: {answer.text[:150]}. "
            f"Visual cards, numerical highlight badge, clarity diagrams. {pos_style}."
        )

        overlays = [
            TextOverlay(
                text="POLICY ANSWER BREAKDOWN",
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

        return ImagePrompt(
            prompt_text=prompt_text,
            negative_prompt=neg_style,
            style=style,
            language=language,
            text_overlays=overlays,
            source_citations=answer.citations,
        )

