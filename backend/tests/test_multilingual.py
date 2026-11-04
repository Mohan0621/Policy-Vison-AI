import pytest
from hypothesis import given, settings, strategies as st
from app.utils.language_utils import check_script_purity, load_noto_fonts

# Feature: policy-vision-ai, Property 5: Multilingual output script purity
# Validates: Requirements 8.1, 8.4
@settings(max_examples=50)
@given(
    target_count=st.integers(min_value=1, max_value=20),
    latin_count=st.integers(min_value=0, max_value=20),
)
def test_property_5_multilingual_script_purity(target_count, latin_count):
    # Hindi / Devanagari words
    devanagari_words = ["बीमा", "पॉलिसी", "सुरक्षा", "अस्पताल", "दावा", "कवरेज", "नियम", "शर्तें"]
    latin_words = ["policy", "insurance", "coverage", "hospital", "claim", "deductible"]

    words = [devanagari_words[i % len(devanagari_words)] for i in range(target_count)]
    words += [latin_words[i % len(latin_words)] for i in range(latin_count)]

    # Include numerals and identifiers which should be excluded from calculation
    words.append("1000")
    words.append("₹5,00,000")
    words.append("POL-12345")

    text = " ".join(words)
    purity = check_script_purity(text, language_code="hi")

    expected_evaluable = target_count + latin_count
    expected_ratio = target_count / expected_evaluable if expected_evaluable > 0 else 1.0

    assert 0.0 <= purity <= 1.0
    assert abs(purity - expected_ratio) < 0.1

def test_multilingual_purity_edge_cases():
    # Pure Devanagari Hindi
    hindi_text = "यह पॉलिसी अस्पताल में भर्ती होने के खर्च को कवर करती है।"
    assert check_script_purity(hindi_text, "hi") >= 0.95

    # Pure Tamil
    tamil_text = "இந்த பாலிசி மருத்துவமனை செலவுகளை உள்ளடக்கியது."
    assert check_script_purity(tamil_text, "ta") >= 0.95

    # Pure Gujarati
    gujarati_text = "આ પોલિસી હોસ્પિટલના ખર્ચને આવરી લે છે."
    assert check_script_purity(gujarati_text, "gu") >= 0.95

    # Numerals and currency excluded
    mixed_with_numbers = "बीमा राशि ₹5,00,000 और 30 दिन का समय।"
    assert check_script_purity(mixed_with_numbers, "hi") >= 0.95

    # Font loader returns all 9 languages
    fonts = load_noto_fonts()
    for lang in ["en", "hi", "ta", "te", "kn", "ml", "bn", "mr", "gu"]:
        assert lang in fonts

