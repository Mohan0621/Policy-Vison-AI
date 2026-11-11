import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)

os.makedirs(r"D:\Mohan\Gen AI\sample_policies", exist_ok=True)

def generate_care_optima_policy():
    pdf_path = r"D:\Mohan\Gen AI\sample_policies\Care_Optima_Health_Insurance_Policy.pdf"
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'),
        alignment=1, # Center
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B'),
        alignment=1,
    )

    h1_style = ParagraphStyle(
        'Heading1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#1E3A8A'),
        spaceBefore=12,
        spaceAfter=6,
    )

    h2_style = ParagraphStyle(
        'Heading2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=8,
        spaceAfter=4,
    )

    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#334155'),
        spaceAfter=5,
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155'),
        leftIndent=15,
        spaceAfter=3,
    )

    story = []

    # 1. Header Banner & Title
    story.append(Paragraph("CARE HEALTH INSURANCE COMPANY LIMITED", title_style))
    story.append(Paragraph("IRDAI Reg. No: 148 • Policy UIN: IRDAI/HLT/CARE/P-H/V.1/108/2026", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#EA580C'), spaceAfter=15))

    story.append(Paragraph("POLICY SCHEDULE & TERMS: CARE OPTIMA RESTORE (SUM INSURED: ₹ 15,00,000)", h1_style))
    story.append(Paragraph("This Policy of Insurance is an evidence of the contract between Care Health Insurance Company Limited and the Policyholder named in the schedule below.", body_style))
    story.append(Spacer(1, 8))

    # 2. Policy Schedule Summary Table
    table_data = [
        [Paragraph("<b>Policy Number:</b>", body_style), Paragraph("POL-HLT-2026-981249", body_style),
         Paragraph("<b>Policy Status:</b>", body_style), Paragraph("<font color='#059669'><b>IN FORCE (ACTIVE)</b></font>", body_style)],
        [Paragraph("<b>Policyholder Name:</b>", body_style), Paragraph("Chaitanya Mohan", body_style),
         Paragraph("<b>Date of Birth / Age:</b>", body_style), Paragraph("15-Aug-1994 (32 Yrs)", body_style)],
        [Paragraph("<b>Policy Period:</b>", body_style), Paragraph("01-Jan-2026 to 31-Dec-2026", body_style),
         Paragraph("<b>Plan Type:</b>", body_style), Paragraph("Individual Comprehensive", body_style)],
        [Paragraph("<b>Basic Sum Insured:</b>", body_style), Paragraph("<b>₹ 15,00,000</b> (INR Fifteen Lakh)", body_style),
         Paragraph("<b>Restore Benefit:</b>", body_style), Paragraph("100% Automatic Re-instatement", body_style)],
        [Paragraph("<b>Gross Premium:</b>", body_style), Paragraph("₹ 14,200.00", body_style),
         Paragraph("<b>Taxes (CGST + SGST 18%):</b>", body_style), Paragraph("₹ 2,556.00 (Total: ₹ 16,756.00)", body_style)],
        [Paragraph("<b>Third Party Administrator:</b>", body_style), Paragraph("Care Health In-House TPA Desk", body_style),
         Paragraph("<b>Toll-Free Claims Helpline:</b>", body_style), Paragraph("1800-102-4488 / 1800-200-4488", body_style)]
    ]

    t = Table(table_data, colWidths=[1.8 * inch, 2.0 * inch, 1.8 * inch, 1.9 * inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 15))

    # 3. Section 1: Scope of Coverage (What is Covered)
    story.append(Paragraph("SECTION 1: SCOPE OF INPATIENT HOSPITALIZATION COVERAGE", h1_style))
    story.append(Paragraph("If the Insured Person contracts any Disease or suffers any Illness or sustaining bodily Injury during the Policy Period necessitating inpatient hospital admission, the Company will pay the Medically Necessary Expenses subject to terms, sub-limits, and conditions herein:", body_style))
    
    story.append(Paragraph("<b>1.1 Room Rent, Boarding and Nursing Expenses:</b> Covered up to Single Private Air Conditioned room without proportionate deduction.", bullet_style))
    story.append(Paragraph("<b>1.2 Intensive Care Unit (ICU) / Intensive Cardiac Care Unit (ICCU):</b> Covered in full with no sub-limit up to the basic Sum Insured.", bullet_style))
    story.append(Paragraph("<b>1.3 Medical Practitioner and Specialist Fees:</b> Surgeon, Anesthetist, Medical Practitioner, Consultant and Specialist Consultation fees covered.", bullet_style))
    story.append(Paragraph("<b>1.4 Pre-Hospitalization Medical Expenses:</b> Incurred during thirty (30) days prior to hospital admission covered, provided relevant to the primary treatment.", bullet_style))
    story.append(Paragraph("<b>1.5 Post-Hospitalization Medical Expenses:</b> Incurred during sixty (60) days immediately following discharge from the hospital covered.", bullet_style))
    story.append(Paragraph("<b>1.6 Day Care Treatments:</b> Over 540 Day Care treatments that require less than 24 hours of hospitalization due to advanced technological surgery covered.", bullet_style))
    story.append(Paragraph("<b>1.7 Emergency Road Ambulance:</b> Actual charges up to ₹ 3,000 per hospitalization covered for shifting patient to nearest network hospital.", bullet_style))
    story.append(Paragraph("<b>1.8 Cumulative Bonus:</b> 50% increase in basic Sum Insured for each claim-free year up to maximum 100% of basic Sum Insured.", bullet_style))
    story.append(Spacer(1, 15))

    # 4. Section 2: Exclusions and Waiting Periods (What is Not Covered)
    story.append(Paragraph("SECTION 2: EXCLUSIONS AND WAITING PERIODS", h1_style))
    story.append(Paragraph("The Company shall not be liable to make any payment under this Policy in respect of any expenses whatsoever incurred by the Insured Person in connection with or in respect of:", body_style))

    story.append(Paragraph("<b>2.1 Initial 30-Day Waiting Period (Code - Excl03):</b> Expenses related to the treatment of any illness within thirty (30) days from the first policy inception date shall be excluded except claims arising due to an Accidental Bodily Injury.", bullet_style))
    story.append(Paragraph("<b>2.2 Specified Disease / Procedure Waiting Period (24 Months) (Code - Excl02):</b> Expenses related to treatment of Cataract, Hernia, Hydrocele, Piles, Sinusitis, Joint Replacement surgery (unless accidental), and Gall Bladder Stones are excluded for twenty-four (24) continuous months of coverage.", bullet_style))
    story.append(Paragraph("<b>2.3 Pre-Existing Diseases (PED) Waiting Period (36 Months) (Code - Excl01):</b> Any condition, ailment or injury diagnosed by a physician within 48 months prior to the effective date of the policy shall have a thirty-six (36) months waiting period before claim eligibility.", bullet_style))
    story.append(Paragraph("<b>2.4 Permanent Standard Exclusions:</b>", h2_style))
    story.append(Paragraph("• Cosmetic, Aesthetic or Plastic Surgery (Code - Excl08), except as reconstruction necessitated by accident or cancer.", bullet_style))
    story.append(Paragraph("• Obesity and Weight Control programs, surgical bariatric procedures (Code - Excl06).", bullet_style))
    story.append(Paragraph("• Treatment for alcoholism, drug abuse, or any addictive condition and intentional self-inflicted harm (Code - Excl12).", bullet_style))
    story.append(Paragraph("• Routine Outpatient Department (OPD) dental checkups, spectacles, contact lenses, and hearing aids.", bullet_style))
    story.append(Paragraph("• Unproven or experimental medical treatments and non-allopathic unapproved hospitalizations.", bullet_style))
    story.append(Spacer(1, 15))

    # 5. Section 3: How to Claim (Claims Procedure)
    story.append(Paragraph("SECTION 3: CLAIMS PROCEDURE & DISCHARGE PROTOCOL", h1_style))
    story.append(Paragraph("The Insured Person or representative must observe the following procedure to obtain cashless hospital authorization or claim reimbursement:", body_style))

    claim_steps = [
        [Paragraph("<b>Step 1: Intimation of Hospitalization</b>", h2_style),
         Paragraph("<b>Emergency Admission:</b> Notify Company/TPA within 24 hours of hospitalization.<br/><b>Planned Admission:</b> Notify Company/TPA at least 48 hours prior to scheduled admission.", body_style)],
        [Paragraph("<b>Step 2: Cashless Pre-Authorization</b>", h2_style),
         Paragraph("Visit Insurance / TPA Helpdesk at Network Hospital. Present Care Health e-Card and government photo ID (Aadhaar / Voter ID). Hospital submits pre-authorization request form to TPA.", body_style)],
        [Paragraph("<b>Step 3: Direct Discharge Settlement</b>", h2_style),
         Paragraph("TPA reviews medical documents and issues cashless guarantee letter directly to the hospital. At discharge, the Insured signs final bill and pays only non-medical excluded items.", body_style)]
    ]
    ct = Table(claim_steps, colWidths=[2.8 * inch, 4.7 * inch])
    ct.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FFFFFF')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(ct)
    story.append(Spacer(1, 15))

    # 6. Section 4: Grievance Redressal & Ombudsman
    story.append(Paragraph("SECTION 4: GRIEVANCE REDRESSAL & INSURANCE OMBUDSMAN", h1_style))
    story.append(Paragraph("In case of dissatisfaction with service or claim decisions, policyholders can contact the Grievance Officer at <b>grievance@careinsurance.com</b>. If unresolved within 15 days, policyholders can approach the IRDAI Grievance Call Centre (Toll Free: 155255 / 1800 4254 732) or submit a representation to the Insurance Ombudsman under Insurance Ombudsman Rules, 2017.", body_style))
    story.append(Spacer(1, 10))

    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceAfter=10))
    story.append(Paragraph("<i>This document is a computer generated certificate of insurance under Information Technology Act, 2000. Verified IRDAI Grounded Policy Schedule.</i>", subtitle_style))

    doc.build(story)
    print(f"Generated Care Optima Policy PDF: {pdf_path} (Size: {os.path.getsize(pdf_path)} bytes)")


def generate_star_comprehensive_policy():
    pdf_path = r"D:\Mohan\Gen AI\sample_policies\Star_Comprehensive_Family_Health_Policy.pdf"
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'),
        alignment=1,
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle2',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B'),
        alignment=1,
    )

    h1_style = ParagraphStyle(
        'Heading1_2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#047857'),
        spaceBefore=12,
        spaceAfter=6,
    )

    body_style = ParagraphStyle(
        'BodyText2',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#334155'),
        spaceAfter=5,
    )

    bullet_style = ParagraphStyle(
        'BulletText2',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155'),
        leftIndent=15,
        spaceAfter=3,
    )

    story = []

    story.append(Paragraph("STAR HEALTH AND ALLIED INSURANCE COMPANY LIMITED", title_style))
    story.append(Paragraph("IRDAI Reg. No: 129 • Corporate Office: Chennai • UIN: SHAHLIP23028V062223", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#059669'), spaceAfter=15))

    story.append(Paragraph("POLICY SCHEDULE: STAR COMPREHENSIVE INSURANCE (FAMILY FLOATER)", h1_style))
    story.append(Paragraph("Policy providing comprehensive hospitalization coverage for entire family with Automatic Restoration, Bariatric surgery cover, and OPD dental benefits.", body_style))
    story.append(Spacer(1, 8))

    table_data = [
        [Paragraph("<b>Policy Number:</b>", body_style), Paragraph("STAR-COMP-2026-441092", body_style),
         Paragraph("<b>Policy Status:</b>", body_style), Paragraph("<font color='#059669'><b>ACTIVE FLOATER</b></font>", body_style)],
        [Paragraph("<b>Primary Insured:</b>", body_style), Paragraph("Chaitanya Mohan (32 Yrs)", body_style),
         Paragraph("<b>Covered Dependents:</b>", body_style), Paragraph("Spouse (30 Yrs) + 1 Child (4 Yrs)", body_style)],
        [Paragraph("<b>Sum Insured:</b>", body_style), Paragraph("<b>₹ 25,00,000</b> (INR Twenty-Five Lakh)", body_style),
         Paragraph("<b>Recharge Benefit:</b>", body_style), Paragraph("100% Instant Auto-Recharge", body_style)],
        [Paragraph("<b>Annual Premium:</b>", body_style), Paragraph("₹ 24,800.00 + GST", body_style),
         Paragraph("<b>Hospital Network:</b>", body_style), Paragraph("14,000+ Cashless Hospitals", body_style)],
    ]

    t = Table(table_data, colWidths=[1.8 * inch, 2.0 * inch, 1.8 * inch, 1.9 * inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F0FDF4')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#A7F3D0')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 15))

    story.append(Paragraph("SECTION 1: COVERAGE HIGHLIGHTS & BENEFIT CLAUSES", h1_style))
    story.append(Paragraph("<b>1.1 Room Rent Limit:</b> Single Private AC room covered in full with zero room-rent cap.", bullet_style))
    story.append(Paragraph("<b>1.2 ICU/ICCU Charges:</b> Covered without sub-limit up to the basic Sum Insured.", bullet_style))
    story.append(Paragraph("<b>1.3 Pre & Post Hospitalization:</b> 60 days pre-admission and 90 days post-discharge expenses.", bullet_style))
    story.append(Paragraph("<b>1.4 Outpatient Dental and Ophthalmic Treatment:</b> Up to ₹ 5,000 every block of 3 years.", bullet_style))
    story.append(Paragraph("<b>1.5 Air Ambulance Coverage:</b> Up to ₹ 2,50,000 per hospitalization for emergency transfer.", bullet_style))
    story.append(Paragraph("<b>1.6 Second Medical Opinion:</b> Free e-consultation from Star Health Medical Panel.", bullet_style))
    story.append(Spacer(1, 15))

    story.append(Paragraph("SECTION 2: WAITING PERIODS AND RESTRICTIONS", h1_style))
    story.append(Paragraph("<b>2.1 Initial Waiting Period:</b> 30 days from inception date (accidental trauma excluded from waiting period).", bullet_style))
    story.append(Paragraph("<b>2.2 Specified Ailments Waiting Period:</b> 24 months for ENT ailments, cataract, and calculus diseases.", bullet_style))
    story.append(Paragraph("<b>2.3 Pre-Existing Conditions:</b> 36 months continuous coverage waiting period.", bullet_style))
    story.append(Paragraph("<b>2.4 Exclusions:</b> Self-inflicted injuries, non-allopathic unproven cures, cosmetic interventions.", bullet_style))
    story.append(Spacer(1, 15))

    story.append(Paragraph("SECTION 3: HOW TO CLAIM (CASHLESS & REIMBURSEMENT)", h1_style))
    story.append(Paragraph("1. Notify the Star Health 24x7 Helpdesk (Toll Free: 1800 425 2255) prior to planned admission or within 24h for emergency.", bullet_style))
    story.append(Paragraph("2. Submit Star Health ID Card and Aadhaar at the hospital TPA / Insurance desk.", bullet_style))
    story.append(Paragraph("3. TPA assesses claim and transmits cashless authorization directly to the network medical facility.", bullet_style))
    story.append(Spacer(1, 10))

    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceAfter=10))
    story.append(Paragraph("<i>Policy issued under IRDAI regulations. Star Health and Allied Insurance Co. Ltd.</i>", subtitle_style))

    doc.build(story)
    print(f"Generated Star Comprehensive Policy PDF: {pdf_path} (Size: {os.path.getsize(pdf_path)} bytes)")

if __name__ == "__main__":
    generate_care_optima_policy()
    generate_star_comprehensive_policy()

