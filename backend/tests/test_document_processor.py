"""
test_document_processor.py
===========================
Unit and Property-Based Test Suite for DocumentProcessor and TextPreprocessor.

This test module validates:
1. Property 1 (Hypothesis): Text validation bounds are strictly symmetric:
   - Accept strings with length between 50 and 5,000 characters with non-whitespace content.
   - Reject empty, under-50, over-5000, or whitespace-only inputs with specific error codes.
2. Explicit boundary checks:
   - Under minimum (< 50 chars -> TEXT_TOO_SHORT).
   - Exact minimum boundary (50 chars -> succeeds).
   - Over maximum boundary (> 5000 chars -> TEXT_TOO_LONG).
   - Pure whitespace (-> TEXT_EMPTY).
3. PDF Ingestion Security & Format Controls:
   - Non-PDF extensions (e.g., .docx -> UNSUPPORTED_FORMAT).
   - Over 50 MB size limitation (-> FILE_TOO_LARGE).
   - Corrupted/unreadable byte streams (-> CORRUPTED_PDF).
"""

import pytest
from hypothesis import given, settings, strategies as st
from app.models import DocumentProcessingError
from app.services.document_processor import DocumentProcessor

# Global instance of the document processor under test
processor = DocumentProcessor()


# -----------------------------------------------------------------------------
# Property 1: Text validation bounds are symmetric
# Validates: Requirements 2.1, 2.2, 2.3, 2.4
# -----------------------------------------------------------------------------
@settings(max_examples=50, deadline=None)
@given(text=st.text(min_size=0, max_size=6000))
def test_property_1_text_validation_bounds(text: str):
    """
    Property-Based Test: Validates that for ANY generated unicode string:
    - If non-whitespace and length is between 50 and 5,000 characters:
      The document processor MUST successfully construct a ProcessedDocument with
      source_type='text' and exactly one chunk containing the stripped text.
    - Otherwise (length < 50, length > 5000, or all whitespace):
      The processor MUST raise DocumentProcessingError with one of:
      TEXT_EMPTY, TEXT_TOO_SHORT, or TEXT_TOO_LONG.
    """
    # 1. Determine input properties
    has_non_whitespace = bool(text.strip())
    char_count = len(text)
    
    # 2. Branch: Valid bounds vs Invalid bounds
    if 50 <= char_count <= 5000 and has_non_whitespace:
        # Should succeed without throwing any exception
        doc = processor.process_text(text)
        
        # Verify document metadata structure
        assert doc.source_type == "text"
        assert len(doc.chunks) == 1
        assert doc.chunks[0].text == text.strip()
    else:
        # Out-of-bounds inputs must deterministically raise DocumentProcessingError
        with pytest.raises(DocumentProcessingError) as exc_info:
            processor.process_text(text)
        
        # Verify the appropriate compliance error code was attached
        assert exc_info.value.code in ["TEXT_EMPTY", "TEXT_TOO_SHORT", "TEXT_TOO_LONG"]


# -----------------------------------------------------------------------------
# Unit Test: Explicit character count boundary tests
# -----------------------------------------------------------------------------
def test_document_processor_text_bounds_explicit():
    """
    Unit Test: Tests exact edge boundaries for user-submitted policy text.
    Verifies that boundary transitions trigger exact error codes.
    """
    # Block A: Below minimum boundary (< 50 characters)
    # A short phrase like 'short policy text' (17 chars) must fail with TEXT_TOO_SHORT
    with pytest.raises(DocumentProcessingError) as exc:
        processor.process_text("short policy text")
    assert exc.value.code == "TEXT_TOO_SHORT"

    # Block B: Exact minimum boundary (exactly 50 characters)
    # 50 characters of valid non-whitespace text must succeed
    valid_50 = "A" * 50
    doc = processor.process_text(valid_50)
    assert doc.page_count == 0
    assert len(doc.chunks) == 1
    assert doc.chunks[0].text == valid_50

    # Block C: Over maximum boundary (> 5,000 characters)
    # 5,001 characters exceeds the upper limit and must fail with TEXT_TOO_LONG
    with pytest.raises(DocumentProcessingError) as exc:
        processor.process_text("A" * 5001)
    assert exc.value.code == "TEXT_TOO_LONG"

    # Block D: Pure whitespace rejection
    # Spaces, newlines, and tabs contain no meaningful policy information
    with pytest.raises(DocumentProcessingError) as exc:
        processor.process_text("   \n\t   ")
    assert exc.value.code == "TEXT_EMPTY"


# -----------------------------------------------------------------------------
# Unit Test: PDF ingestion validation & security controls
# -----------------------------------------------------------------------------
def test_document_processor_pdf_validation():
    """
    Unit Test: Validates PDF upload rules:
    - Unsupported file extensions (.docx) are rejected.
    - Over-sized payloads (> 50 MB) trigger FILE_TOO_LARGE.
    - Invalid or corrupted binary payloads trigger CORRUPTED_PDF.
    """
    # Block A: Reject non-PDF file formats
    # Ensures security and parsing stability by refusing unsupported formats
    with pytest.raises(DocumentProcessingError) as exc:
        processor.process_pdf(b"test", "document.docx")
    assert exc.value.code == "UNSUPPORTED_FORMAT"

    # Block B: Enforce 50 MB file size limit
    # Construct a simulated oversized byte payload (51 MB)
    oversized = b"%PDF" + b"0" * (51 * 1024 * 1024)
    with pytest.raises(DocumentProcessingError) as exc:
        processor.process_pdf(oversized, "document.pdf")
    assert exc.value.code == "FILE_TOO_LARGE"

    # Block C: Corrupted PDF detection
    # Valid filename but malformed binary header must fail gracefully
    with pytest.raises(DocumentProcessingError) as exc:
        processor.process_pdf(b"not-a-pdf-content", "sample.pdf")
    assert exc.value.code == "CORRUPTED_PDF"
