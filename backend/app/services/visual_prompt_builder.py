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
        "positive": "flat design infographic, clean sans-serif fonts, corporate color palette, data visualization, high contrast, clean vector layout",
        "negative": "photorealistic, cartoon, hand-drawn, cluttered, messy text, blurry",
    },
    VisualStyle.ILLUSTRATED_CARTOON: {
        "positive": "friendly cartoon style, rounded shapes, bright colors, simple icons, approachable illustration, clear labels",
        "negative": "photorealistic, technical diagram, gloomy, dark, realistic humans",
    },
    VisualStyle.FLOWCHART_DIAGRAM: {
        "positive": "technical flowchart, boxes and arrows, monochrome accents, precise layout, labeled nodes, clear directional arrows",
        "negative": "artistic, photorealistic, decorative, chaotic lines, ambiguous paths",
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
            f"Insurance Coverage Infographic: {type_text}. "
            f"Features distinct sections with coverage amounts: {categories_str}. "
            f"Includes icons for medical cross, ambulance, and hospital. {pos_style}{lang_directive}."
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
            f"Claims Process Flowchart diagram showing step-by-step procedure: {steps_joined}."
            f"{dual_path_directive} Labeled decision boxes, directional sequence arrows, status icons. "
            f"{pos_style}{lang_directive}."
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

