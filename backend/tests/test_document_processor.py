import pytest
from hypothesis import given, settings, strategies as st
from app.models import DocumentProcessingError
from app.services.document_processor import DocumentProcessor

processor = DocumentProcessor()

# Feature: policy-vision-ai, Property 1: Text validation bounds are symmetric
# Validates: Requirements 2.1, 2.2, 2.3, 2.4
@settings(max_examples=100)
@given(text=st.text(min_size=0, max_size=6000))
def test_property_1_text_validation_bounds(text):
    has_non_whitespace = bool(text.strip())
    char_count = len(text)
    
    if 50 <= char_count <= 5000 and has_non_whitespace:
        doc = processor.process_text(text)
        assert doc.source_type == "text"
        assert len(doc.chunks) == 1
        assert doc.chunks[0].text == text.strip()
    else:
        with pytest.raises(DocumentProcessingError) as exc_info:
            processor.process_text(text)
        assert exc_info.value.code in ["TEXT_EMPTY", "TEXT_TOO_SHORT", "TEXT_TOO_LONG"]

def test_document_processor_text_bounds_explicit():
    # Below 50
    with pytest.raises(DocumentProcessingError) as exc:
        processor.process_text("short policy text")
    assert exc.value.code == "TEXT_TOO_SHORT"

    # Exactly 50
    valid_50 = "A" * 50
    doc = processor.process_text(valid_50)
    assert doc.page_count == 0

    # Over 5000
    with pytest.raises(DocumentProcessingError) as exc:
        processor.process_text("A" * 5001)
    assert exc.value.code == "TEXT_TOO_LONG"

    # Whitespace only
    with pytest.raises(DocumentProcessingError) as exc:
        processor.process_text("   \n\t   ")
    assert exc.value.code == "TEXT_EMPTY"

def test_document_processor_pdf_validation():
    # Unsupported format
    with pytest.raises(DocumentProcessingError) as exc:
        processor.process_pdf(b"test", "document.docx")
    assert exc.value.code == "UNSUPPORTED_FORMAT"

    # Size limit enforcement (51 MB should fail)
    oversized = b"%PDF" + b"0" * (51 * 1024 * 1024)
    with pytest.raises(DocumentProcessingError) as exc:
        processor.process_pdf(oversized, "document.pdf")
    assert exc.value.code == "FILE_TOO_LARGE"

    # Corrupted PDF
    with pytest.raises(DocumentProcessingError) as exc:
        processor.process_pdf(b"not-a-pdf-content", "sample.pdf")
    assert exc.value.code == "CORRUPTED_PDF"

