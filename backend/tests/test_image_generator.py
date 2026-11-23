"""
test_image_generator.py
========================
Unit and Property-Based Test Suite for Visual Explainer Generation & Resolution Standards.

This test module validates:
1. High-Resolution Standards:
   - Enforcing strict >= 1024x1024 pixel resolution constraints.
   - Rejection of substandard resolutions (< 1024) with IMAGE_RESOLUTION_INSUFFICIENT.
2. Pillow Canvas Generation & Text Overlay Integration:
   - Verifying generation of 1024x1024 print-ready PNG images.
   - Burning in text overlays with Noto Sans typography.
   - Validating output image byte readability via PIL.
3. Property 8 (Hypothesis): Export Round-Trip Resolution & Metadata Preservation:
   - Validating that for any image with dimensions in [1024, 1400], exporting preserves
     the resolution (no downscaling).
   - Validating that statutory XMP/PNG metadata tags ('policy_document_name' and
     'policy_identifier') are embedded in the exported PNG headers.
"""

import io
import uuid
from PIL import Image
import pytest
from hypothesis import given, settings, strategies as st
from app.models import GeneratedImage, ImageGenerationError, ImagePrompt, TextOverlay, VisualStyle
from app.services.image_generator import ImageGenerator
from app.services.export_service import ExportService

# Global service instances
img_gen = ImageGenerator()
export_svc = ExportService()


# -----------------------------------------------------------------------------
# Unit Test: Strict Image Resolution Validation (>= 1024x1024)
# -----------------------------------------------------------------------------
def test_image_generator_resolution_validation():
    """
    Unit Test: Tests that images below the minimum acceptable print threshold
    (1024x1024) are rejected with IMAGE_RESOLUTION_INSUFFICIENT, while compliant
    images pass validation.
    """
    # Block A: Substandard width (1023 x 1024) must raise an ImageGenerationError
    bad_img = GeneratedImage(
        image_id="bad",
        session_id="s1",
        image_bytes=b"dummy",
        width=1023,
        height=1024,
        prompt=ImagePrompt("p", "n", VisualStyle.PROFESSIONAL_INFOGRAPHIC, "en", [], []),
        generation_timestamp_utc="",
        visual_type="coverage",
    )
    with pytest.raises(ImageGenerationError) as exc:
        img_gen.validate_resolution(bad_img)
    assert exc.value.code == "IMAGE_RESOLUTION_INSUFFICIENT"

    # Block B: Exact compliant dimensions (1024 x 1024) must pass validation
    good_img = GeneratedImage(
        image_id="good",
        session_id="s1",
        image_bytes=b"dummy",
        width=1024,
        height=1024,
        prompt=ImagePrompt("p", "n", VisualStyle.PROFESSIONAL_INFOGRAPHIC, "en", [], []),
        generation_timestamp_utc="",
        visual_type="coverage",
    )
    assert img_gen.validate_resolution(good_img) is True


# -----------------------------------------------------------------------------
# Unit Test: Canvas Generation and High-Contrast Text Overlays
# -----------------------------------------------------------------------------
def test_image_generation_and_text_overlay():
    """
    Unit Test: Generates a full visual canvas with a high-contrast text overlay,
    verifying image dimensions, byte stream integrity, and PIL decode compatibility.
    """
    session_id = str(uuid.uuid4())
    
    # 1. Define image prompt with an explicit text overlay
    prompt = ImagePrompt(
        prompt_text="Test prompt for health insurance coverage",
        negative_prompt="Test neg clutter, blurry",
        style=VisualStyle.PROFESSIONAL_INFOGRAPHIC,
        language="en",
        text_overlays=[
            TextOverlay(
                text="TEST OVERLAY 100K",
                position=(100, 100),
                font_size=32,
                font_path="fonts/NotoSans-en.ttf",
                color="#FFFFFF",
            )
        ],
        source_citations=[],
    )

    # 2. Execute image generation (Pillow canvas backend)
    gen_img = img_gen.generate(prompt, session_id=session_id)
    
    # 3. Assert minimum dimension and byte payload guarantees
    assert gen_img.width >= 1024
    assert gen_img.height >= 1024
    assert len(gen_img.image_bytes) > 0

    # 4. Verify the byte payload forms a valid, readable PNG image with exact dimensions
    pil_img = Image.open(io.BytesIO(gen_img.image_bytes))
    assert pil_img.size == (1024, 1024)


# -----------------------------------------------------------------------------
# Property 8: Export round-trip resolution preservation
# Validates: Requirements 10.1
# -----------------------------------------------------------------------------
@settings(max_examples=30, deadline=None)
@given(
    width=st.integers(min_value=1024, max_value=1400),
    height=st.integers(min_value=1024, max_value=1400),
)
def test_property_8_export_resolution_roundtrip(width: int, height: int):
    """
    Property-Based Test: Verifies that export operations preserve image dimensions
    without lossy downscaling, and embed required XMP/PNG metadata fields into the headers.
    """
    session_id = str(uuid.uuid4())
    img_id = str(uuid.uuid4())
    
    # 1. Create and save a source image with arbitrary high-resolution dimensions
    img = Image.new("RGB", (width, height), (255, 255, 255))
    session_dir = export_svc.cache_dir / "sessions" / session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    img_path = session_dir / f"{img_id}.png"
    img.save(img_path, format="PNG")

    # 2. Export the image through the ExportService
    exported = export_svc.export_image(session_id, img_id)
    assert exported.mime_type == "image/png"

    # 3. Decode exported bytes and assert resolution is preserved
    decoded = Image.open(io.BytesIO(exported.file_bytes))
    out_w, out_h = decoded.size
    assert out_w >= width
    assert out_h >= height

    # 4. Verify embedded audit metadata chunks in PNG headers
    assert decoded.info.get("policy_document_name") is not None
    assert decoded.info.get("policy_identifier") is not None
