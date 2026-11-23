"""
test_multilingual.py
====================
Unit and Property-Based Test Suite for Multilingual Processing & Script Purity.

This test module validates:
1. Property 5 (Hypothesis): Multilingual script purity calculation:
   - Script purity checks the ratio of words matching the target Unicode block
     (Devanagari for Hindi/Marathi, Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati).
   - Numerical digits (e.g. 1000), currency symbols (e.g. ₹5,00,000), and policy IDs
     (e.g. POL-12345) are excluded from the evaluable word set so they do not falsely
     penalize script purity.
2. Script Purity Edge Cases:
   - Validates that pure Hindi, Tamil, and Gujarati sentences achieve >= 95% script purity.
   - Validates that mixed text with Indian currency and days still achieves >= 95% purity.
3. Font Mapping Verification:
   - Validates that load_noto_fonts() provides font mappings for all 9 supported languages.
"""

import pytest
from hypothesis import given, settings, strategies as st
from app.utils.language_utils import check_script_purity, load_noto_fonts


# -----------------------------------------------------------------------------
# Property 5: Multilingual output script purity
# Validates: Requirements 8.1, 8.4
# -----------------------------------------------------------------------------
@settings(max_examples=30, deadline=None)
@given(
    target_count=st.integers(min_value=1, max_value=20),
    latin_count=st.integers(min_value=0, max_value=20),
)
def test_property_5_multilingual_script_purity(target_count: int, latin_count: int):
    """
    Property-Based Test: Validates that check_script_purity accurately computes the
    ratio of target script words to total evaluable words, while ignoring numerals,
    currency tokens, and policy identifiers.
    """
    # 1. Prepare word vocabulary pools
    devanagari_words = ["बीमा", "पॉलिसी", "सुरक्षा", "अस्पताल", "दावा", "कवरेज", "नियम", "शर्तें"]
    latin_words = ["policy", "insurance", "coverage", "hospital", "claim", "deductible"]

    # 2. Build synthetic mixed-script text
    words = [devanagari_words[i % len(devanagari_words)] for i in range(target_count)]
    words += [latin_words[i % len(latin_words)] for i in range(latin_count)]

    # 3. Append non-evaluable tokens: numbers, currency, and alphanumeric policy IDs
    words.append("1000")
    words.append("₹5,00,000")
    words.append("POL-12345")

    # 4. Compute script purity score for Hindi ('hi')
    text = " ".join(words)
    purity = check_script_purity(text, language_code="hi")

    # 5. Expected calculation: numerals and IDs must not be counted in denominator
    expected_evaluable = target_count + latin_count
    expected_ratio = target_count / expected_evaluable if expected_evaluable > 0 else 1.0

    # 6. Assert purity is within normalized [0.0, 1.0] and matches expected ratio
    assert 0.0 <= purity <= 1.0
    assert abs(purity - expected_ratio) < 0.1


# -----------------------------------------------------------------------------
# Unit Test: Language-Specific Script Purity Edge Cases
# -----------------------------------------------------------------------------
def test_multilingual_purity_edge_cases():
    """
    Unit Test: Tests script purity across regional Indian language scripts:
    - Pure Devanagari Hindi text (>= 95%).
    - Pure Tamil text (>= 95%).
    - Pure Gujarati text (>= 95%).
    - Mixed Indian currency & timeline tokens without purity degradation.
    - Font loader availability for all 9 supported languages.
    """
    # Block A: Pure Devanagari Hindi validation
    hindi_text = "यह पॉलिसी अस्पताल में भर्ती होने के खर्च को कवर करती है।"
    assert check_script_purity(hindi_text, "hi") >= 0.95

    # Block B: Pure Tamil script validation
    tamil_text = "இந்த பாலிசி மருத்துவமனை செலவுகளை உள்ளடக்கியது."
    assert check_script_purity(tamil_text, "ta") >= 0.95

    # Block C: Pure Gujarati script validation
    gujarati_text = "આ પોલિસી હોસ્પિટલના ખર્ચને આવરી લે છે."
    assert check_script_purity(gujarati_text, "gu") >= 0.95

    # Block D: Indian currency symbol (₹) and numbers must be excluded from penalty
    mixed_with_numbers = "बीमा राशि ₹5,00,000 और 30 दिन का समय।"
    assert check_script_purity(mixed_with_numbers, "hi") >= 0.95

    # Block E: Noto Sans font loader coverage across English and 8 Indian languages
    fonts = load_noto_fonts()
    for lang in ["en", "hi", "ta", "te", "kn", "ml", "bn", "mr", "gu"]:
        assert lang in fonts
