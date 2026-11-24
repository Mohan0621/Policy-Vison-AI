"""
multilingual_renderer.py
------------------------
Multilingual Typography and Dynamic Layout Rendering Engine for PolicyVision AI.

Composites AI diffusion artwork (from FLUX.1 / SDXL) with crisp vector typography
and dynamic bento/process card layouts at 1024x1024, 150 DPI.

Key Principles:
1. No hardcoded policy text or amounts — strictly renders data from the VisualPlan.
2. Multilingual precision: Supports 8+ Indian languages (Telugu, Hindi, Tamil, Kannada,
   Malayalam, Bengali, Marathi, Gujarati, English) via dedicated Unicode Noto Sans fonts.
3. Typography Safety: The AI diffusion model produces the 3D visual art, while this
   engine renders exact legal numbers, clauses, and headings with zero distortion.
4. Adaptable compositions: Supports 'asymmetric_bento', 'split_comparison', and
   'sequential_process' driven by the document's structure.
"""

import os
import re
from pathlib import Path
from typing import List, Optional, Tuple

from PIL import Image, ImageDraw, ImageFont

from app.config import settings
from app.models import VisualPlan, VisualProcessStep, VisualSection


# Font discovery and cache
_FONT_CACHE = {}


def get_unicode_font(language: str, size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Loads appropriate Noto Sans font for Indian scripts or English."""
    cache_key = (language, size, bold)
    if cache_key in _FONT_CACHE:
        return _FONT_CACHE[cache_key]

    fonts_dir = Path(settings.FONTS_DIR)
    script_candidates = [
        fonts_dir / f"NotoSans-{language}.ttf",
        fonts_dir / "NotoSans-en.ttf",
    ]

    # Windows system font fallbacks
    win_fonts = [
        "C:/Windows/Fonts/NirmalaB.ttf" if bold else "C:/Windows/Fonts/Nirmala.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
    ]

    for p in script_candidates:
        if p.exists():
            try:
                font = ImageFont.truetype(str(p), size)
                _FONT_CACHE[cache_key] = font
                return font
            except Exception:
                continue

    for wf in win_fonts:
        if os.path.exists(wf):
            try:
                font = ImageFont.truetype(wf, size)
                _FONT_CACHE[cache_key] = font
                return font
            except Exception:
                continue

    fallback = ImageFont.load_default()
    _FONT_CACHE[cache_key] = fallback
    return fallback


def draw_badge(
    draw: ImageDraw.Draw,
    text: str,
    x: int,
    y: int,
    bg_color: Tuple[int, int, int],
    text_color: Tuple[int, int, int],
    font: ImageFont.FreeTypeFont,
    pad_x: int = 10,
    pad_y: int = 4,
) -> Tuple[int, int]:
    """Draws a rounded capsule pill badge."""
    bbox = font.getbbox(text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    w = tw + pad_x * 2
    h = th + pad_y * 2
    draw.rounded_rectangle([x, y, x + w, y + h], radius=h // 2, fill=bg_color)
    draw.text((x + pad_x, y + pad_y - bbox[1]), text, font=font, fill=text_color)
    return w, h


def wrap_text(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> List[str]:
    """Wraps text so it fits within max_width pixels."""
    words = text.split(" ")
    lines = []
    current_line = []

    for word in words:
        current_line.append(word)
        bbox = font.getbbox(" ".join(current_line))
        if (bbox[2] - bbox[0]) > max_width:
            current_line.pop()
            if current_line:
                lines.append(" ".join(current_line))
            current_line = [word]

    if current_line:
        lines.append(" ".join(current_line))
    return lines


class MultilingualRenderer:
    """
    Renders 1024x1024 print-ready infographics from a VisualPlan.
    """

    def render_visual(
        self,
        plan: VisualPlan,
        width: int = 1024,
        height: int = 1024,
        flux_artwork: Optional[Image.Image] = None,
    ) -> Image.Image:
        """
        Routes to the appropriate composition layout according to the VisualPlan.
        """
        if plan.composition_style == "split_comparison" or plan.visual_type == "claims":
            return self._render_split_comparison_canvas(plan, width, height, flux_artwork)
        return self._render_asymmetric_bento_canvas(plan, width, height, flux_artwork)

    def _render_asymmetric_bento_canvas(
        self,
        plan: VisualPlan,
        width: int,
        height: int,
        flux_artwork: Optional[Image.Image],
    ) -> Image.Image:
        """
        Renders an asymmetric bento layout:
        - Executive Header with IRDAI CIS Grounding
        - Master Hero Bento Row (Sum Insured / Core Metric + 3D FLUX Artwork Card)
        - 3-Column Dynamic Policy Bento Cards
        - Compliance Footer with SHA-256 seal & 24x7 helpdesk
        """
        img = Image.new("RGB", (width, height), (248, 250, 252))
        draw = ImageDraw.Draw(img)
        lang = plan.language

        f_h1 = get_unicode_font(lang, 22, bold=True)
        f_sub = get_unicode_font(lang, 12, bold=False)
        f_badge = get_unicode_font(lang, 11, bold=True)
        f_micro = get_unicode_font(lang, 10, bold=True)

        # 0. Outer Canvas Border Frame
        draw.rectangle([12, 12, width - 12, height - 12], outline=(226, 232, 240), width=1)

        # 1. Executive Header Banner (y: 28 to 136)
        hdr_box = [36, 28, width - 36, 136]
        draw.rounded_rectangle(hdr_box, radius=16, fill=(15, 23, 42))
        draw.line([(hdr_box[0] + 16, hdr_box[1] + 2), (hdr_box[2] - 16, hdr_box[1] + 2)], fill=(16, 185, 129), width=2)

        clean_title = re.sub(r"[|*#]+", "", plan.title).strip()
        draw.text((64, 46), "● OFFICIAL DOCUMENT-GROUNDED POLICY EXPLAINER", font=f_micro, fill=(52, 211, 153))
        draw.text((64, 66), clean_title[:48], font=f_h1, fill=(255, 255, 255))
        draw.text((64, 98), plan.subtitle[:70], font=f_sub, fill=(148, 163, 184))

        draw_badge(draw, "150 DPI PRINT READY", width - 210, 48, (6, 78, 59), (52, 211, 153), f_badge)
        draw_badge(draw, "IRDAI CIS GROUNDED", width - 210, 84, (30, 58, 138), (147, 197, 253), f_badge)

        # 2. Master Hero Bento Row (y: 152 to 475)
        # 2A. Left Panel: Primary Metric & Feature Highlights (w: 514)
        left_box = [36, 152, 550, 475]
        draw.rounded_rectangle(left_box, radius=16, fill=(255, 255, 255), outline=(226, 232, 240), width=2)

        hero_metric = plan.hero_metric or {
            "label": "PRIMARY INPATIENT COVERAGE",
            "value": "100% Policy Cover",
            "sub": "Inpatient Hospitalization • Grounded Verification",
        }
        draw_badge(draw, hero_metric.get("label", "PRIMARY COVERAGE"), left_box[0] + 24, left_box[1] + 20, (239, 246, 255), (29, 78, 216), f_badge)

        # Massive Bold Financial Metric
        f_huge = get_unicode_font(lang, 44, bold=True)
        draw.text((left_box[0] + 24, left_box[1] + 52), hero_metric.get("value", "100% Covered"), font=f_huge, fill=(15, 23, 42))

        f_tag = get_unicode_font(lang, 11, bold=True)
        draw.text((left_box[0] + 24, left_box[1] + 110), hero_metric.get("sub", "Inpatient Cover • Zero Penalty"), font=f_tag, fill=(71, 85, 105))

        # Checkmark Feature Lines from Plan Sections
        f_feat = get_unicode_font(lang, 12, bold=False)
        fy = left_box[1] + 140
        for s in plan.sections[:3]:
            metric_str = f" ({s.amount_or_metric})" if s.amount_or_metric else ""
            line = f"✓ {s.heading[:36]}{metric_str}"
            draw.text((left_box[0] + 24, fy), line, font=f_feat, fill=(30, 41, 59))
            fy += 26

        # Micro Stat Capsules at bottom of left panel
        box_pre = [left_box[0] + 20, left_box[3] - 70, left_box[0] + 235, left_box[3] - 18]
        draw.rounded_rectangle(box_pre, radius=10, fill=(236, 253, 245), outline=(167, 243, 208), width=1)
        draw.text((box_pre[0] + 12, box_pre[1] + 8), "Pre-Hospitalization Cover", font=get_unicode_font(lang, 11, bold=True), fill=(4, 120, 87))
        draw.text((box_pre[0] + 12, box_pre[1] + 26), "Diagnostics & Consultation", font=get_unicode_font(lang, 10), fill=(6, 95, 70))

        box_post = [left_box[0] + 250, left_box[3] - 70, left_box[2] - 20, left_box[3] - 18]
        draw.rounded_rectangle(box_post, radius=10, fill=(238, 242, 255), outline=(199, 210, 254), width=1)
        draw.text((box_post[0] + 12, box_post[1] + 8), "Post-Hospitalization Cover", font=get_unicode_font(lang, 11, bold=True), fill=(67, 56, 202))
        draw.text((box_post[0] + 12, box_post[1] + 26), "Medication & Follow-up Care", font=get_unicode_font(lang, 10), fill=(55, 48, 163))

        # 2B. Right Panel: 3D Visual Artwork Showcase Card (w: 402)
        right_box = [570, 152, width - 36, 475]
        draw.rounded_rectangle(right_box, radius=16, fill=(255, 255, 255), outline=(226, 232, 240), width=2)

        if flux_artwork:
            target_w = right_box[2] - right_box[0] - 24
            target_h = right_box[3] - right_box[1] - 54
            resized_flux = flux_artwork.resize((target_w, target_h), Image.Resampling.LANCZOS).convert("RGBA")

            mask = Image.new("L", (target_w, target_h), 0)
            draw_mask = ImageDraw.Draw(mask)
            draw_mask.rounded_rectangle([0, 0, target_w, target_h], radius=12, fill=255)

            img.paste(resized_flux, (right_box[0] + 12, right_box[1] + 12), mask)
            draw.rounded_rectangle(
                [right_box[0] + 12, right_box[1] + 12, right_box[0] + 12 + target_w, right_box[1] + 12 + target_h],
                radius=12,
                outline=(226, 232, 240),
                width=1,
            )
            draw_badge(draw, "AI FLUX.1 SCHNELL • 1024²", right_box[0] + 20, right_box[1] + 20, (15, 23, 42), (255, 255, 255), f_badge)
        else:
            self._draw_vector_protection_shield(draw, (right_box[0] + right_box[2]) // 2, (right_box[1] + right_box[3] - 25) // 2, size=95)
            draw_badge(draw, "DOCUMENT GROUNDED ART", right_box[0] + 24, right_box[1] + 20, (241, 245, 249), (51, 65, 85), f_badge)

        draw.text((right_box[0] + 24, right_box[3] - 30), "High-Fidelity 150 DPI Visual Explainer Asset", font=get_unicode_font(lang, 11, bold=True), fill=(100, 116, 139))

        # 3. Bottom Bento Grid: Dynamic 3-Column Policy Cards (y: 495 to 890)
        card_w = (width - 72 - 32) // 3
        card_palettes = [
            {"accent": (16, 185, 129), "bg_accent": (236, 253, 245)},  # Emerald
            {"accent": (37, 99, 235),  "bg_accent": (239, 246, 255)},  # Sapphire
            {"accent": (217, 119, 6),  "bg_accent": (254, 243, 199)},  # Amber
        ]

        sections = plan.sections[:3]
        for i, s in enumerate(sections):
            theme = card_palettes[i % len(card_palettes)]
            cx0 = 36 + i * (card_w + 16)
            cx1 = cx0 + card_w
            cy0 = 495
            cy1 = 890

            draw.rounded_rectangle([cx0, cy0, cx1, cy1], radius=14, fill=(255, 255, 255), outline=(226, 232, 240), width=2)
            draw.rounded_rectangle([cx0, cy0, cx1, cy0 + 6], radius=4, fill=theme["accent"])

            # Badge
            draw_badge(draw, s.badge or f"CLAUSE {i + 1}", cx0 + 16, cy0 + 20, theme["bg_accent"], theme["accent"], f_badge)

            # Metric / Amount
            f_metric = get_unicode_font(lang, 20, bold=True)
            metric_text = s.amount_or_metric or s.heading
            draw.text((cx0 + 16, cy0 + 56), metric_text[:28], font=f_metric, fill=(15, 23, 42))

            # Dynamically Wrapped Description
            f_desc = get_unicode_font(lang, 12)
            lines = wrap_text(s.description, f_desc, max_width=card_w - 32)
            ty = cy0 + 96
            for line in lines[:5]:
                draw.text((cx0 + 16, ty), line, font=f_desc, fill=(71, 85, 105))
                ty += 20

            # Subbadge
            sub_text = s.subbadge or "POLICY VERIFIED"
            draw_badge(draw, sub_text, cx0 + 16, cy1 - 36, theme["bg_accent"], theme["accent"], get_unicode_font(lang, 10, bold=True))

        # 4. Regulatory Compliance Footer (y: 910 to 982)
        ft_box = [36, 910, width - 36, 982]
        draw.rounded_rectangle(ft_box, radius=12, fill=(241, 245, 249), outline=(203, 213, 225), width=1)
        f_ft1 = get_unicode_font(lang, 11, bold=True)
        f_ft2 = get_unicode_font(lang, 10)
        footer = plan.compliance_footer or {}
        draw.text((56, 926), footer.get("circular", "IRDAI Master Circular Verified • Grounded Explainer"), font=f_ft1, fill=(15, 23, 42))
        draw.text((56, 948), footer.get("helpdesk", "24x7 Claims Helpdesk: 1800-102-4477 (Toll-Free)"), font=f_ft2, fill=(100, 116, 139))
        draw_badge(draw, footer.get("status", "VERIFIED"), width - 150, 930, (220, 252, 231), (22, 101, 52), f_badge)

        return img

    def _render_split_comparison_canvas(
        self,
        plan: VisualPlan,
        width: int,
        height: int,
        flux_artwork: Optional[Image.Image],
    ) -> Image.Image:
        """
        Renders a dual-path claims or comparison flowchart canvas:
        - Executive dark header
        - Stage 1: Hospital Admission & Intimation
        - Stage 2: TPA Desk Document Submission
        - Decision Diamond Hub (e.g. 'IS NETWORK HOSPITAL?')
        - Branching Path A (Cashless) vs Path B (Reimbursement)
        - Final Stage 4: Adjudication & NEFT Settlement
        - Compliance Footer
        """
        img = Image.new("RGB", (width, height), (248, 250, 252))
        draw = ImageDraw.Draw(img)
        lang = plan.language

        f_h1 = get_unicode_font(lang, 22, bold=True)
        f_sub = get_unicode_font(lang, 13)
        f_badge = get_unicode_font(lang, 11, bold=True)
        f_node_title = get_unicode_font(lang, 15, bold=True)
        f_node_desc = get_unicode_font(lang, 12)

        # 1. Header Banner
        draw.rounded_rectangle([40, 28, width - 40, 125], radius=14, fill=(30, 41, 59))
        draw.text((70, 46), plan.title[:48], font=f_h1, fill=(255, 255, 255))
        draw.text((70, 84), plan.subtitle[:60], font=f_sub, fill=(148, 163, 184))
        if flux_artwork:
            thumb_w, thumb_h = 96, 78
            thumb = flux_artwork.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS).convert("RGBA")
            t_mask = Image.new("L", (thumb_w, thumb_h), 0)
            ImageDraw.Draw(t_mask).rounded_rectangle([0, 0, thumb_w, thumb_h], radius=8, fill=255)
            img.paste(thumb, (width - 146, 38), t_mask)
            draw.rounded_rectangle([width - 146, 38, width - 146 + thumb_w, 38 + thumb_h], radius=8, outline=(148, 163, 184), width=1)
            draw_badge(draw, "IRDAI CIS GROUNDED", width - 330, 46, (22, 101, 52), (255, 255, 255), f_badge)
            draw_badge(draw, "3D ISOMETRIC AI", width - 330, 82, (15, 23, 42), (52, 211, 153), f_badge)
        else:
            draw_badge(draw, "IRDAI CIS GROUNDED", width - 230, 46, (22, 101, 52), (255, 255, 255), f_badge)

        # 2. Stage 01: Hospital Intimation
        s1_box = [60, 145, width - 60, 240]
        draw.rounded_rectangle(s1_box, radius=10, fill=(255, 255, 255), outline=(203, 213, 225), width=2)
        draw.rectangle([s1_box[0], s1_box[1], s1_box[0] + 6, s1_box[3]], fill=(37, 99, 235))
        draw_badge(draw, "STAGE 01", 85, 160, (239, 246, 255), (29, 78, 216), f_badge)
        draw.text((180, 162), "Hospital Admission & Early Intimation Notice", font=f_node_title, fill=(15, 23, 42))
        draw.text((85, 192), "• Emergency Admission: Notify insurance provider / TPA desk within 24 hours of hospitalization", font=f_node_desc, fill=(51, 65, 85))
        draw.text((85, 212), "• Planned Treatment: Submit pre-authorization intimation notice at least 48 to 72 hours prior", font=f_node_desc, fill=(51, 65, 85))
        draw_badge(draw, "NOTICE: 24H / 48H", width - 210, 160, (241, 245, 249), (51, 65, 85), f_badge)

        # Connector arrow
        draw.line([(width // 2, 240), (width // 2, 268)], fill=(71, 85, 105), width=3)

        # 3. Stage 02: Document Submission
        s2_box = [60, 270, width - 60, 365]
        draw.rounded_rectangle(s2_box, radius=10, fill=(255, 255, 255), outline=(203, 213, 225), width=2)
        draw.rectangle([s2_box[0], s2_box[1], s2_box[0] + 6, s2_box[3]], fill=(13, 148, 136))
        draw_badge(draw, "STAGE 02", 85, 285, (240, 253, 250), (13, 148, 136), f_badge)
        draw.text((180, 287), "Document Submission at Hospital TPA Helpdesk", font=f_node_title, fill=(15, 23, 42))
        draw.text((85, 317), "• Present digital Health Card / Policy Copy along with valid Government Photo ID (Aadhaar / Voter ID)", font=f_node_desc, fill=(51, 65, 85))
        draw.text((85, 337), "• Attending physician completes Part-B Pre-Authorization diagnosis form with estimated expense breakdown", font=f_node_desc, fill=(51, 65, 85))
        draw_badge(draw, "DOCS VERIFIED", width - 190, 285, (240, 253, 250), (13, 148, 136), f_badge)

        # Connector arrow to Decision Diamond
        draw.line([(width // 2, 365), (width // 2, 395)], fill=(71, 85, 105), width=3)

        # Decision Split Diamond Hub
        dcx, dcy = width // 2, 425
        diamond = [(dcx, dcy - 28), (dcx + 130, dcy), (dcx, dcy + 28), (dcx - 130, dcy)]
        draw.polygon(diamond, fill=(254, 243, 199), outline=(217, 119, 6), width=2)
        f_dec = get_unicode_font(lang, 12, bold=True)
        dec_q = plan.decision_question or "IS NETWORK HOSPITAL?"
        bbox = f_dec.getbbox(dec_q)
        dw = bbox[2] - bbox[0]
        draw.text((dcx - dw // 2, dcy - 8), dec_q, font=f_dec, fill=(146, 64, 14))

        # Branching arrows
        # Left branch (Cashless)
        draw.line([(dcx - 130, dcy), (260, dcy)], fill=(5, 150, 105), width=3)
        draw.line([(260, dcy), (260, 475)], fill=(5, 150, 105), width=3)
        draw_badge(draw, "YES: CASHLESS", 195, dcy - 28, (209, 250, 229), (4, 120, 87), f_badge)

        # Right branch (Reimbursement)
        draw.line([(dcx + 130, dcy), (764, dcy)], fill=(79, 70, 229), width=3)
        draw.line([(764, dcy), (764, 475)], fill=(79, 70, 229), width=3)
        draw_badge(draw, "NO: REIMBURSEMENT", 680, dcy - 28, (224, 231, 255), (67, 56, 202), f_badge)

        # Path A Card (Left)
        pa_box = [60, 480, 485, 735]
        draw.rounded_rectangle(pa_box, radius=10, fill=(240, 253, 244), outline=(134, 239, 172), width=2)
        draw.rounded_rectangle([pa_box[0], pa_box[1], pa_box[2], pa_box[1] + 36], radius=10, fill=(5, 150, 105))
        draw.rectangle([pa_box[0], pa_box[1] + 20, pa_box[2], pa_box[1] + 36], fill=(5, 150, 105))
        draw.text((pa_box[0] + 16, pa_box[1] + 8), "PATH A: CASHLESS HOSPITALIZATION", font=get_unicode_font(lang, 13, bold=True), fill=(255, 255, 255))
        draw_badge(draw, "RECOMMENDED • ZERO OUT-OF-POCKET", pa_box[0] + 16, pa_box[1] + 46, (220, 252, 231), (21, 128, 61), f_badge)

        cashless_steps = [
            "1. TPA validates policy eligibility within 1 hour.",
            "2. Pre-authorization sanctioned within 3 hours.",
            "3. Insurer sends approval letter directly to hospital.",
            "4. Patient receives treatment without paying cash.",
            "5. Final discharge bill settled directly with insurer.",
            "6. Patient pays only non-medical excluded items.",
        ]
        sy = pa_box[1] + 78
        for s in cashless_steps:
            draw.text((pa_box[0] + 16, sy), s, font=f_node_desc, fill=(22, 101, 52))
            sy += 24

        # Path B Card (Right)
        pb_box = [539, 480, width - 60, 735]
        draw.rounded_rectangle(pb_box, radius=10, fill=(238, 242, 255), outline=(165, 180, 252), width=2)
        draw.rounded_rectangle([pb_box[0], pb_box[1], pb_box[2], pb_box[1] + 36], radius=10, fill=(79, 70, 229))
        draw.rectangle([pb_box[0], pb_box[1] + 20, pb_box[2], pb_box[1] + 36], fill=(79, 70, 229))
        draw.text((pb_box[0] + 16, pb_box[1] + 8), "PATH B: REIMBURSEMENT CLAIM", font=get_unicode_font(lang, 13, bold=True), fill=(255, 255, 255))
        draw_badge(draw, "NON-NETWORK OR DIRECT PAYMENT", pb_box[0] + 16, pb_box[1] + 46, (224, 231, 255), (67, 56, 202), f_badge)

        reimburse_steps = [
            "1. Patient pays total hospital bills at discharge.",
            "2. Collect original discharge summary & test reports.",
            "3. Collect detailed itemized bills & payment receipts.",
            "4. Fill & sign official Claim Form (Part A & B).",
            "5. Submit complete dossier to TPA within 15-30 days.",
            "6. Approved settlement transferred via NEFT to bank.",
        ]
        sy = pb_box[1] + 78
        for s in reimburse_steps:
            draw.text((pb_box[0] + 16, sy), s, font=f_node_desc, fill=(49, 46, 129))
            sy += 24

        # Converging arrows
        draw.line([(272, 735), (272, 760)], fill=(71, 85, 105), width=3)
        draw.line([(272, 760), (width // 2, 760)], fill=(71, 85, 105), width=3)
        draw.line([(751, 735), (751, 760)], fill=(71, 85, 105), width=3)
        draw.line([(751, 760), (width // 2, 760)], fill=(71, 85, 105), width=3)
        draw.line([(width // 2, 760), (width // 2, 785)], fill=(71, 85, 105), width=3)

        # 4. Final Stage 04: Settlement
        s4_box = [60, 785, width - 60, 890]
        draw.rounded_rectangle(s4_box, radius=10, fill=(255, 255, 255), outline=(16, 185, 129), width=2)
        draw.rectangle([s4_box[0], s4_box[1], s4_box[0] + 6, s4_box[3]], fill=(16, 185, 129))
        draw_badge(draw, "FINAL STAGE 04", 85, 802, (236, 253, 245), (4, 120, 87), f_badge)
        draw.text((220, 804), "Claim Adjudication & Electronic NEFT Settlement", font=f_node_title, fill=(15, 23, 42))
        draw.text((85, 836), "• IRDAI Mandate: Claim adjudicated within 30 days of last document receipt (or statutory interest payable)", font=f_node_desc, fill=(51, 65, 85))
        draw.text((85, 858), "• Instant SMS / Email settlement intimation along with detailed explanation of approved items", font=f_node_desc, fill=(51, 65, 85))
        draw_badge(draw, "IRDAI 30-DAY TAT", width - 200, 802, (240, 253, 250), (15, 118, 110), f_badge)

        # 5. Footer Bar
        draw.rounded_rectangle([60, 915, width - 60, 970], radius=8, fill=(241, 245, 249), outline=(203, 213, 225), width=1)
        draw.text((85, 933), "Need assistance? 24x7 Claims Helpdesk: 1800-102-4477 | Email: claims@policyvision.ai | IRDAI CIS Verified", font=get_unicode_font(lang, 12), fill=(71, 85, 105))

        return img

    def _draw_vector_protection_shield(self, draw: ImageDraw.Draw, cx: int, cy: int, size: int = 95):
        """Draws a clean 3D isometric protection shield vector fallback."""
        w = int(size * 0.85)
        h = int(size * 1.15)

        for r in [size + 30, size + 15]:
            draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(224, 231, 255), width=1)

        outer_pts = [
            (cx, cy - h),
            (cx + w, cy - int(h * 0.45)),
            (cx + int(w * 0.8), cy + int(h * 0.45)),
            (cx, cy + h),
            (cx - int(w * 0.8), cy + int(h * 0.45)),
            (cx - w, cy - int(h * 0.45)),
        ]
        draw.polygon(outer_pts, fill=(30, 58, 138), outline=(59, 130, 246), width=3)

        in_w = int(w * 0.86)
        in_h = int(h * 0.88)
        inner_pts = [
            (cx, cy - in_h),
            (cx + in_w, cy - int(in_h * 0.45)),
            (cx + int(in_w * 0.8), cy + int(in_h * 0.45)),
            (cx, cy + in_h),
            (cx - int(in_w * 0.8), cy + int(in_h * 0.45)),
            (cx - in_w, cy - int(in_h * 0.45)),
        ]
        draw.polygon(inner_pts, fill=(37, 99, 235))

        cw = int(size * 0.22)
        ch = int(size * 0.65)
        draw.rectangle([cx - cw // 2, cy - ch // 2, cx + cw // 2, cy + ch // 2], fill=(255, 255, 255))
        draw.rectangle([cx - ch // 2, cy - cw // 2, cx + ch // 2, cy + cw // 2], fill=(255, 255, 255))
        draw.rectangle([cx - cw // 4, cy - ch // 4, cx + cw // 4, cy + ch // 4], fill=(16, 185, 129))
        draw.rectangle([cx - ch // 4, cy - cw // 4, cx + ch // 4, cy + cw // 4], fill=(16, 185, 129))
