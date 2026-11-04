import io
import uuid
from PIL import Image
import pytest
from hypothesis import given, settings, strategies as st
from app.models import GeneratedImage, ImageGenerationError, ImagePrompt, TextOverlay, VisualStyle
from app.services.image_generator import ImageGenerator
from app.services.export_service import ExportService

img_gen = ImageGenerator()
export_svc = ExportService()

def test_image_generator_resolution_validation():
    # 1023 x 1024 -> Fails
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

    # 1024 x 1024 -> Passes
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

def test_image_generation_and_text_overlay():
    session_id = str(uuid.uuid4())
    prompt = ImagePrompt(
        prompt_text="Test prompt",
        negative_prompt="Test neg",
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

    gen_img = img_gen.generate(prompt, session_id=session_id)
    assert gen_img.width >= 1024
    assert gen_img.height >= 1024
    assert len(gen_img.image_bytes) > 0

    # Verify PNG bytes can be read by PIL
    pil_img = Image.open(io.BytesIO(gen_img.image_bytes))
    assert pil_img.size == (1024, 1024)

# Feature: policy-vision-ai, Property 8: Export round-trip resolution preservation
# Validates: Requirements 10.1
@settings(max_examples=30)
@given(
    width=st.integers(min_value=1024, max_value=1400),
    height=st.integers(min_value=1024, max_value=1400),
)
def test_property_8_export_resolution_roundtrip(width, height):
    session_id = str(uuid.uuid4())
    img_id = str(uuid.uuid4())
    
    # Create image with specific resolution
    img = Image.new("RGB", (width, height), (255, 255, 255))
    session_dir = export_svc.cache_dir / "sessions" / session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    img_path = session_dir / f"{img_id}.png"
    img.save(img_path, format="PNG")

    # Export image
    exported = export_svc.export_image(session_id, img_id)
    assert exported.mime_type == "image/png"

    # Decode and assert resolution is preserved (w >= width, h >= height)
    decoded = Image.open(io.BytesIO(exported.file_bytes))
    out_w, out_h = decoded.size
    assert out_w >= width
    assert out_h >= height
    assert decoded.info.get("policy_document_name") is not None
    assert decoded.info.get("policy_identifier") is not None

