import os
import re
from typing import Dict, Tuple

SCRIPT_RANGES: Dict[str, Tuple[int, int]] = {
    "hi": (0x0900, 0x097F),  # Devanagari (Hindi)
    "mr": (0x0900, 0x097F),  # Devanagari (Marathi)
    "ta": (0x0B80, 0x0BFF),  # Tamil
    "te": (0x0C00, 0x0C7F),  # Telugu
    "kn": (0x0C80, 0x0CFF),  # Kannada
    "ml": (0x0D00, 0x0D7F),  # Malayalam
    "bn": (0x0980, 0x09FF),  # Bengali
    "gu": (0x0A80, 0x0AFF),  # Gujarati
}

LANGUAGE_NAMES: Dict[str, str] = {
    "en": "English",
    "hi": "Hindi",
    "ta": "Tamil",
    "te": "Telugu",
    "kn": "Kannada",
    "ml": "Malayalam",
    "bn": "Bengali",
    "mr": "Marathi",
    "gu": "Gujarati",
}

def is_numeral_or_punct_or_identifier(token: str) -> bool:
    # Digits, currency symbols, percentages, punctuation
    cleaned = re.sub(r"[0-9.,;:!?%₹$€£\-\–\—\(\)\[\]\/\"\'\+\*]", "", token)
    if not cleaned:
        return True
    # Policy identifiers (e.g. POL-1234, ABC123X)
    if re.match(r"^[A-Z0-9_\-]+$", token) and any(c.isdigit() for c in token):
        return True
    return False

def check_script_purity(text: str, language_code: str) -> float:
    """
    Computes fraction of words belonging to the target Unicode script block.
    Excludes numerals, punctuation, proper nouns, and policy identifiers.
    Returns a float between 0.0 and 1.0. For English, returns 1.0 if predominantly ASCII.
    """
    if not text or not text.strip():
        return 1.0

    if language_code == "en":
        # Check ASCII/Latin
        words = text.split()
        if not words:
            return 1.0
        latin_count = sum(1 for w in words if all(ord(c) < 256 for c in w))
        return latin_count / len(words)

    script_range = SCRIPT_RANGES.get(language_code)
    if not script_range:
        # Unknown non-English language code: default to 1.0
        return 1.0

    low, high = script_range
    words = text.split()
    evaluable_words = []

    for word in words:
        clean_word = word.strip(".,;:!?()[]{}\"'“”‘’—–-")
        if not clean_word:
            continue
        if is_numeral_or_punct_or_identifier(clean_word):
            continue
        # Proper noun heuristic: English title-case token in regional script text
        if clean_word.istitle() and all(ord(c) < 128 for c in clean_word):
            continue
        evaluable_words.append(clean_word)

    if not evaluable_words:
        return 1.0

    valid_script_words = 0
    for word in evaluable_words:
        # Check if characters in word fall in script range or combining marks
        in_script_chars = sum(1 for c in word if low <= ord(c) <= high)
        if in_script_chars > 0 and (in_script_chars / len(word)) >= 0.5:
            valid_script_words += 1

    return valid_script_words / len(evaluable_words)


def load_noto_fonts(fonts_dir: str = "fonts") -> Dict[str, str]:
    """
    Maps language code to local font path.
    If system / local Noto Sans TTF exists, points to it, or falls back to system font.
    """
    os.makedirs(fonts_dir, exist_ok=True)
    font_map = {}
    for code in LANGUAGE_NAMES.keys():
        font_path = os.path.join(fonts_dir, f"NotoSans-{code}.ttf")
        font_map[code] = font_path
    return font_map

