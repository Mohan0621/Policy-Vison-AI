import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio

OUTPUT_PATH = r"D:\Mohan\Gen AI\frontend\public\policyvision_demo.mp4"
WIDTH = 1200
HEIGHT = 800
FPS = 30
DURATION_SEC = 6.0
TOTAL_FRAMES = int(FPS * DURATION_SEC)

def get_font(size, bold=False):
    fonts = ["segoeuib.ttf" if bold else "segoeui.ttf", "arialbd.ttf" if bold else "arial.ttf", "calibrib.ttf" if bold else "calibri.ttf"]
    for f in fonts:
        try:
            return ImageFont.truetype(f, size)
        except Exception:
            continue
    return ImageFont.load_default()

font_title = get_font(30, bold=True)
font_h2 = get_font(22, bold=True)
font_body = get_font(16, bold=False)
font_badge = get_font(13, bold=True)
font_small = get_font(12, bold=False)

writer = imageio.get_writer(OUTPUT_PATH, fps=FPS, codec="libx264", quality=8, pixelformat="yuv420p")

for frame_idx in range(TOTAL_FRAMES):
    t = frame_idx / FPS  # Current time in seconds
    progress = frame_idx / TOTAL_FRAMES

    # Background canvas: Soft refreshing gradient from warm slate to light orange/pink tint
    img = Image.new("RGB", (WIDTH, HEIGHT), color="#F8FAFC")
    draw = ImageDraw.Draw(img)

    # Subtle ambient gradient circles
    glow_y = int(200 + 40 * math.sin(t * 1.5))
    draw.ellipse([-100, -100, 600, 600], fill="#FFF7ED")
    draw.ellipse([WIDTH - 500, HEIGHT - 500, WIDTH + 200, HEIGHT + 200], fill="#FDF2F8")

    # 1. Studio Header Bar
    draw.rounded_rectangle([40, 30, WIDTH - 40, 110], radius=16, fill="#FFFFFF", outline="#E2E8F0", width=1)
    
    # PV Badge
    draw.rounded_rectangle([60, 48, 104, 92], radius=10, fill="#F97316")
    draw.text((72, 58), "PV", font=font_title, fill="#FFFFFF")

    draw.text((120, 52), "PolicyVision AI Studio // Live Visual Synthesis", font=font_h2, fill="#0F172A")
    draw.text((120, 82), "Real-Time Document Grounding • Zero Hallucinations • 150 DPI Standard", font=font_small, fill="#64748B")

    # Status Pill on Right
    draw.rounded_rectangle([WIDTH - 220, 52, WIDTH - 60, 88], radius=18, fill="#ECFDF5", outline="#A7F3D0")
    pulse = (math.sin(t * 6) + 1) / 2
    draw.ellipse([WIDTH - 202, 66, WIDTH - 192, 76], fill="#10B981")
    draw.text((WIDTH - 182, 62), "PIPELINE ACTIVE", font=font_badge, fill="#065F46")

    # 2. Main Stage: Two Columns
    # Left Column: Document Scanner (450px)
    # Right Column: Visual Infographic Compiler (630px)

    # --- LEFT COLUMN: Document Ingestion & Optical Scan ---
    draw.rounded_rectangle([40, 130, 480, 750], radius=20, fill="#FFFFFF", outline="#E2E8F0", width=1)
    draw.rounded_rectangle([40, 130, 480, 180], radius=20, fill="#F1F5F9")
    draw.rectangle([40, 160, 480, 180], fill="#F1F5F9")
    draw.text((60, 145), "POLICY DOCUMENT // HIERARCHICAL TOKENS", font=font_badge, fill="#334155")

    # Mock policy text lines
    for line_y in range(210, 710, 24):
        width_ratio = 0.6 + 0.35 * math.sin(line_y * 7)
        line_w = int(380 * width_ratio)
        draw.rounded_rectangle([65, line_y, 65 + line_w, line_y + 8], radius=4, fill="#E2E8F0")

    # Highlighted Grounded Passages in Doc
    draw.rounded_rectangle([65, 275, 430, 315], radius=6, fill="#FFEDD5", outline="#FDBA74")
    draw.text((75, 285), "• Inpatient Care & Room Rent: Full Coverage up to ₹15L", font=font_small, fill="#9A3412")

    draw.rounded_rectangle([65, 380, 430, 420], radius=6, fill="#FFE4E6", outline="#FDA4AF")
    draw.text((75, 390), "• Initial Waiting Period: 30 days except accidental injury", font=font_small, fill="#9F1239")

    draw.rounded_rectangle([65, 485, 430, 525], radius=6, fill="#E0F2FE", outline="#7DD3FC")
    draw.text((75, 495), "• Cashless Hospital Claim: Intimate TPA within 24 hours", font=font_small, fill="#0369A1")

    # Scanning Laser Beam moving vertically
    scan_y = int(200 + ((t * 120) % 510))
    draw.line([(42, scan_y), (478, scan_y)], fill="#F97316", width=3)
    draw.line([(42, scan_y - 1), (478, scan_y - 1)], fill="#FDBA74", width=1)
    draw.line([(42, scan_y + 1), (478, scan_y + 1)], fill="#FDBA74", width=1)
    draw.text((360, scan_y - 18), "SCANNING...", font=font_small, fill="#EA580C")

    # --- RIGHT COLUMN: Synthesized Visual Explainer ---
    draw.rounded_rectangle([510, 130, WIDTH - 40, 750], radius=20, fill="#FFFFFF", outline="#CBD5E1", width=2)

    # Infographic Header Card
    draw.rounded_rectangle([530, 150, WIDTH - 60, 235], radius=14, fill="#1E293B")
    draw.text((555, 168), "HEALTH INSURANCE POLICY EXPLAINER", font=font_h2, fill="#FFFFFF")
    draw.text((555, 200), "Sum Insured: ₹ 15,00,000  •  Network Hospitals: 9,500+  •  IRDAI Grounded", font=font_small, fill="#94A3B8")

    # Animated Section 1: What is Covered
    alpha1 = min(1.0, max(0.0, (t - 0.5) * 1.5))
    if alpha1 > 0:
        draw.rounded_rectangle([530, 255, WIDTH - 60, 395], radius=14, fill="#F0FDF4", outline="#BBF7D0", width=1)
        draw.text((550, 270), "✔  1. WHAT IS COVERED", font=font_h2, fill="#166534")
        draw.text((550, 305), "• Inpatient Hospitalization: ICU, nursing, surgeon fees, medicines (100% cover)", font=font_body, fill="#1E293B")
        draw.text((550, 335), "• Pre & Post Care: 60 days pre-admission and 90 days post-discharge expenses", font=font_body, fill="#1E293B")
        draw.text((550, 365), "• Road Ambulance: Emergency transport covered up to ₹ 3,000 per incident", font=font_body, fill="#1E293B")

    # Animated Section 2: What is Not Covered
    alpha2 = min(1.0, max(0.0, (t - 1.8) * 1.5))
    if alpha2 > 0:
        draw.rounded_rectangle([530, 415, WIDTH - 60, 555], radius=14, fill="#FFF1F2", outline="#FECDD3", width=1)
        draw.text((550, 430), "✕  2. WHAT IS NOT COVERED & WAITING PERIODS", font=font_h2, fill="#9F1239")
        # Pill Badges
        draw.rounded_rectangle([550, 465, 780, 500], radius=8, fill="#FFF7ED", outline="#FED7AA")
        draw.text((565, 474), "30 DAYS INITIAL WAITING", font=font_badge, fill="#C2410C")
        
        draw.rounded_rectangle([800, 465, 1070, 500], radius=8, fill="#FFF1F2", outline="#FECDD3")
        draw.text((815, 474), "36 MONTHS FOR PRE-EXISTING", font=font_badge, fill="#BE123C")

        draw.text((550, 518), "• Cosmetic surgery, obesity, unproven therapies & routine vision excluded.", font=font_body, fill="#475569")

    # Animated Section 3: 3-Step Cashless Hospital Workflow
    alpha3 = min(1.0, max(0.0, (t - 3.2) * 1.5))
    if alpha3 > 0:
        draw.rounded_rectangle([530, 575, WIDTH - 60, 725], radius=14, fill="#F8FAFC", outline="#E2E8F0", width=1)
        draw.text((550, 590), "➔  3. HOW TO CLAIM: CASHLESS PROCEDURE", font=font_h2, fill="#0F172A")

        # 3 Step boxes
        step_w = 180
        # Step 1
        draw.rounded_rectangle([550, 625, 550 + step_w, 705], radius=10, fill="#FFFFFF", outline="#CBD5E1")
        draw.rounded_rectangle([558, 633, 620, 655], radius=6, fill="#EA580C")
        draw.text((566, 638), "STEP 1", font=font_badge, fill="#FFFFFF")
        draw.text((558, 663), "Intimate Insurer", font=font_badge, fill="#0F172A")
        draw.text((558, 683), "Within 24 hours", font=font_small, fill="#64748B")

        # Arrow 1->2
        draw.text((748, 655), "➔", font=font_h2, fill="#94A3B8")

        # Step 2
        draw.rounded_rectangle([780, 625, 780 + step_w, 705], radius=10, fill="#FFFFFF", outline="#CBD5E1")
        draw.rounded_rectangle([788, 633, 850, 655], radius=6, fill="#2563EB")
        draw.text((796, 638), "STEP 2", font=font_badge, fill="#FFFFFF")
        draw.text((788, 663), "TPA Desk Card", font=font_badge, fill="#0F172A")
        draw.text((788, 683), "Submit pre-auth", font=font_small, fill="#64748B")

        # Arrow 2->3
        draw.text((978, 655), "➔", font=font_h2, fill="#94A3B8")

        # Step 3
        draw.rounded_rectangle([1010, 625, 1010 + 130, 705], radius=10, fill="#FFFFFF", outline="#CBD5E1")
        draw.rounded_rectangle([1018, 633, 1080, 655], radius=6, fill="#10B981")
        draw.text((1026, 638), "STEP 3", font=font_badge, fill="#FFFFFF")
        draw.text((1018, 663), "Direct Settle", font=font_badge, fill="#065F46")
        draw.text((1018, 683), "Zero Cash", font=font_small, fill="#64748B")

    # Animated Grounding Rays / Laser Links connecting Doc to Visuals
    if t > 1.2:
        ray_pulse = (math.sin(t * 8) + 1) / 2
        ray_alpha = int(120 + 80 * ray_pulse)
        draw.line([(430, 295), (530, 310)], fill="#EA580C", width=2)
        draw.line([(430, 400), (530, 470)], fill="#BE123C", width=2)
        draw.line([(430, 505), (530, 640)], fill="#2563EB", width=2)

    writer.append_data(np.array(img))

writer.close()
print(f"Successfully generated video at {OUTPUT_PATH}")

