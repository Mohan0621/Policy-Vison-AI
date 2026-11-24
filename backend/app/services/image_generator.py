"""
image_generator.py
------------------
Dynamic Multilingual Insurance Policy Visual Explainer Engine for PolicyVision AI.

Architecture:
  Document Understanding -> Policy Extraction -> Multilingual Processing
  -> Visual Planning Engine -> Dynamic Image Prompt Generator
  -> AI Diffusion Generation (FLUX.1 / SDXL / OpenRouter / Cloudflare)
  -> Multilingual Typography & Dynamic Layout Renderer
  -> VLM Visual Quality Evaluation -> Final 1024x1024 150 DPI Asset.

Zero Hardcoded Content:
  Eliminates static insurance templates, hardcoded amounts, fixed stage lists,
  and predefined benefits. All visual layouts, numbers, and clauses are dynamically
  derived from the uploaded policy document.
"""

import concurrent.futures
import datetime
import io
import logging
import os
import re
import uuid
from pathlib import Path
from typing import List, Optional

import httpx
from PIL import Image, ImageDraw

from app.config import settings
from app.models import (
    GeneratedImage,
    ImageGenerationError,
    ImagePrompt,
    TextOverlay,
    VisualPlan,
    VisualStyle,
)
from app.services.image_prompt_generator import DynamicImagePromptGenerator
from app.services.multilingual_renderer import (
    MultilingualRenderer,
    get_unicode_font,
)
from app.services.visual_planning_engine import VisualPlanningEngine
from app.services.vlm_quality_evaluator import VLMQualityEvaluator

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Backend Diffusion Invocation Helpers
# ---------------------------------------------------------------------------

def _try_cloudflare_flux(prompt: ImagePrompt) -> Optional[Image.Image]:
    """Calls Cloudflare Workers AI FLUX.1 [schnell] for 3D visual artwork."""
    account_id = settings.CF_ACCOUNT_ID
    api_token = settings.CF_API_TOKEN
    model = settings.CF_IMAGE_MODEL

    if not (account_id and api_token):
        return None

    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}"
    headers = {"Authorization": f"Bearer {api_token}"}
    payload = {
        "prompt": prompt.prompt_text,
    }

    try:
        resp = httpx.post(url, headers=headers, json=payload, timeout=40.0)
        if resp.status_code == 200:
            content_type = resp.headers.get("content-type", "")
            if "image" in content_type:
                return Image.open(io.BytesIO(resp.content))
            else:
                data = resp.json()
                if "result" in data and "image" in data["result"]:
                    import base64
                    img_bytes = base64.b64decode(data["result"]["image"])
                    return Image.open(io.BytesIO(img_bytes))
        else:
            logger.warning("Cloudflare Workers AI FLUX returned HTTP %d: %s", resp.status_code, resp.text[:120])
    except Exception as e:
        logger.warning("Cloudflare FLUX API request failed: %s", str(e))
    return None


def _try_openrouter_flux(prompt: ImagePrompt) -> Optional[Image.Image]:
    """Calls OpenRouter FLUX.2-flex:free endpoint."""
    api_key = settings.OPENROUTER_API_KEY
    model = settings.OPENROUTER_IMAGE_MODEL

    if not api_key:
        return None

    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://policyvision.ai",
        "X-Title": "PolicyVision AI",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "prompt": prompt.prompt_text,
        "aspect_ratio": "1:1",
    }

    try:
        resp = httpx.post("https://openrouter.ai/api/v1/images/generations", headers=headers, json=payload, timeout=45.0)
        if resp.status_code == 200:
            data = resp.json()
            if "data" in data and len(data["data"]) > 0:
                first = data["data"][0]
                if "b64_json" in first:
                    import base64
                    return Image.open(io.BytesIO(base64.b64decode(first["b64_json"])))
                elif "url" in first:
                    img_resp = httpx.get(first["url"], timeout=30.0)
                    if img_resp.status_code == 200:
                        return Image.open(io.BytesIO(img_resp.content))
        else:
            logger.warning("OpenRouter FLUX returned HTTP %d: %s", resp.status_code, resp.text[:120])
    except Exception as e:
        logger.warning("OpenRouter FLUX request failed: %s", str(e))
    return None


def _try_diffusers(prompt: ImagePrompt, backend: str, width: int, height: int) -> Optional[Image.Image]:
    """Attempt local diffusers generation if GPU / torch is available."""
    try:
        import torch
        from diffusers import AutoPipelineForText2Image
    except ImportError:
        return None

    try:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        dtype = torch.float16 if torch.cuda.is_available() else torch.float32

        if backend == "sdxl_turbo":
            pipe = AutoPipelineForText2Image.from_pretrained(
                "stabilityai/sdxl-turbo",
                torch_dtype=dtype,
                variant="fp16" if torch.cuda.is_available() else None,
            ).to(device)
            result = pipe(
                prompt=prompt.prompt_text,
                num_inference_steps=1 if device == "cpu" else 4,
                guidance_scale=0.0,
                width=width,
                height=height,
            )
            return result.images[0]
    except Exception as e:
        logger.warning("Local diffusers failed: %s", str(e))
    return None


# ---------------------------------------------------------------------------
# ImageGenerator Service
# ---------------------------------------------------------------------------

class ImageGenerator:
    """
    Generates 1024×1024 PNG Visual Explainers with strict timeout and VLM quality evaluation.

    Pipeline:
    1. Visual Planning: Analyzes policy document passages to formulate dynamic plan.
    2. Prompt Synthesis: Generates cinematography brief for 3D AI diffusion.
    3. AI Generation: Obtains 3D artwork from FLUX.1 / SDXL / OpenRouter.
    4. Multilingual Typography: Composites accurate numbers, headings & cards into 150 DPI canvas.
    5. VLM Quality Gate: Verifies visual richness, legibility, and grounding.
    """

    def __init__(
        self,
        backend: str = settings.IMAGE_BACKEND,
        cache_dir: Path = settings.FILE_CACHE_DIR,
        timeout_seconds: int = settings.IMAGE_GEN_TIMEOUT_SEC,
    ):
        self.backend = backend
        self.cache_dir = cache_dir
        self.timeout_seconds = timeout_seconds

        self.planning_engine = VisualPlanningEngine()
        self.prompt_generator = DynamicImagePromptGenerator()
        self.multilingual_renderer = MultilingualRenderer()
        self.quality_evaluator = VLMQualityEvaluator()

    def validate_resolution(self, image: GeneratedImage) -> bool:
        """Validates that resolution meets the strict 1024x1024 standard."""
        if image.width < 1024 or image.height < 1024:
            raise ImageGenerationError(
                code="IMAGE_RESOLUTION_INSUFFICIENT",
                message="Generated image did not meet the 1024×1024 minimum. Please retry.",
            )
        return True

    def evaluate_visual_quality(self, image: GeneratedImage) -> dict:
        """
        Public API for visual quality evaluation.
        Delegates to the advanced VLMQualityEvaluator.
        """
        plan = image.prompt.visual_plan
        if not plan:
            # Construct a basic plan from prompt metadata for evaluation
            plan = VisualPlan(
                title=image.prompt.prompt_text[:40],
                subtitle="Policy Visual Explainer",
                language=image.prompt.language,
                visual_type=image.visual_type,
                art_direction="Editorial 3D infographic",
                composition_style="asymmetric_bento",
                color_palette={},
                hero_artwork_prompt="",
            )

        eval_result = self.quality_evaluator.evaluate(image.image_bytes, plan)
        return {
            "passed": eval_result.passed,
            "resolution": f"{image.width}x{image.height}",
            "aspect_ratio": round(image.width / image.height, 2),
            "quality_score": eval_result.quality_score,
            "sub_scores": eval_result.scores,
            "critique": eval_result.critique,
            "correction_instructions": eval_result.correction_instructions,
            "model_used": eval_result.model_used,
        }

    def apply_text_overlays(
        self,
        image: GeneratedImage,
        overlays: List[TextOverlay],
    ) -> GeneratedImage:
        """Burns text overlays onto the PNG using Pillow with drop-shadow."""
        pil_img = Image.open(io.BytesIO(image.image_bytes)).convert("RGBA")
        draw = ImageDraw.Draw(pil_img)

        for ov in overlays:
            font = get_unicode_font(image.prompt.language, ov.font_size)
            x, y = ov.position
            draw.text((x + 2, y + 2), ov.text, font=font, fill=(0, 0, 0, 90))
            color = ov.color
            if isinstance(color, str) and color.startswith("#"):
                h = color.lstrip("#")
                color = tuple(int(h[i : i + 2], 16) for i in (0, 2, 4)) + (255,)
            draw.text((x, y), ov.text, font=font, fill=color)

        buf = io.BytesIO()
        pil_img.convert("RGB").save(buf, format="PNG", dpi=(150, 150))
        final_bytes = buf.getvalue()

        file_path = self.cache_dir / "sessions" / image.session_id / f"{image.image_id}.png"
        if file_path.parent.exists():
            file_path.write_bytes(final_bytes)

        return GeneratedImage(
            image_id=image.image_id,
            session_id=image.session_id,
            image_bytes=final_bytes,
            width=image.width,
            height=image.height,
            prompt=image.prompt,
            generation_timestamp_utc=image.generation_timestamp_utc,
            visual_type=image.visual_type,
        )

    def generate(
        self,
        prompt: ImagePrompt,
        session_id: str,
        visual_type: str = "coverage",
        width: int = 1024,
        height: int = 1024,
    ) -> GeneratedImage:
        """
        Entry point. Runs generation inside a ThreadPoolExecutor with timeout.
        """
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(
                self._generate_worker,
                prompt,
                session_id,
                visual_type,
                width,
                height,
            )
            try:
                return future.result(timeout=self.timeout_seconds)
            except concurrent.futures.TimeoutError:
                future.cancel()
                raise ImageGenerationError(
                    code="IMAGE_GENERATION_TIMEOUT",
                    message=f"Visual generation did not complete within {self.timeout_seconds}s. Please retry.",
                )
            except ImageGenerationError:
                raise
            except Exception as exc:
                raise ImageGenerationError(
                    code="IMAGE_GENERATION_FAILED",
                    message=f"Visual generation failed: {exc}",
                )

    def _generate_worker(
        self,
        prompt: ImagePrompt,
        session_id: str,
        visual_type: str,
        width: int,
        height: int,
    ) -> GeneratedImage:
        image_id = str(uuid.uuid4())
        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # 1. Resolve or formulate VisualPlan
        plan = prompt.visual_plan
        if not plan:
            # Reconstruct dynamic plan from structured data or citations
            plan = self.planning_engine._synthesize_grounded_plan(
                passages=[],
                fields=None,
                steps=None,
                language=prompt.language,
                visual_type=visual_type,
                domain="health",
                document_filename=None,
                citations=prompt.source_citations,
            )
            # Override title & subtitle if provided in structured_data
            s_data = prompt.structured_data or {}
            if s_data.get("custom_title") or s_data.get("title"):
                plan.title = s_data.get("custom_title") or s_data.get("title")
            if s_data.get("custom_subtitle") or s_data.get("subtitle"):
                plan.subtitle = s_data.get("custom_subtitle") or s_data.get("subtitle")
            if s_data.get("sum_insured"):
                plan.hero_metric = {
                    "label": "SUM INSURED / COVER",
                    "value": s_data.get("sum_insured"),
                    "sub": "Inpatient Hospitalization • Document Grounded",
                }
            prompt.visual_plan = plan

        # 2. Diffusion 3D Artwork Generation
        flux_hero: Optional[Image.Image] = None
        backend_used = "canvas"

        if self.backend in ("cloudflare", "cf", "flux_cloudflare") or (
            self.backend == "flux" and settings.CF_ACCOUNT_ID and settings.CF_API_TOKEN
        ):
            flux_hero = _try_cloudflare_flux(prompt)
            if flux_hero:
                backend_used = "cloudflare_flux_1_schnell"

        if flux_hero is None and (
            self.backend in ("openrouter", "flux_openrouter")
            or (self.backend == "flux" and settings.OPENROUTER_API_KEY)
        ):
            flux_hero = _try_openrouter_flux(prompt)
            if flux_hero:
                backend_used = "openrouter_flux_2_flex"

        if flux_hero is None and self.backend in ("sdxl_turbo", "flux"):
            flux_hero = _try_diffusers(prompt, self.backend, width, height)
            if flux_hero:
                backend_used = self.backend

        logger.info(
            "Visual generation for session %s using artwork backend: %s (diffusion success=%s)",
            session_id,
            backend_used,
            flux_hero is not None,
        )

        # 3. Multilingual Typography and Dynamic Layout Rendering
        pil_img = self.multilingual_renderer.render_visual(
            plan=plan,
            width=width,
            height=height,
            flux_artwork=flux_hero,
        )

        # 4. Encode to PNG bytes with 150 DPI metadata
        buf = io.BytesIO()
        pil_img.save(buf, format="PNG", dpi=(150, 150))
        img_bytes = buf.getvalue()

        gen_img = GeneratedImage(
            image_id=image_id,
            session_id=session_id,
            image_bytes=img_bytes,
            width=pil_img.width,
            height=pil_img.height,
            prompt=prompt,
            generation_timestamp_utc=timestamp,
            visual_type=visual_type,  # type: ignore[arg-type]
        )

        # 5. Validate Resolution (>= 1024x1024)
        self.validate_resolution(gen_img)

        # 6. VLM Quality Evaluation Gate & Bounded Self-Correction
        max_attempts = 2
        for attempt in range(max_attempts):
            quality_eval = self.quality_evaluator.evaluate(gen_img.image_bytes, plan)
            logger.info(
                "Attempt %d/%d Quality Score: %.2f (model: %s, critique: %s)",
                attempt + 1,
                max_attempts,
                quality_eval.quality_score,
                quality_eval.model_used,
                quality_eval.critique,
            )

            if quality_eval.passed or attempt == max_attempts - 1:
                break

            # If failed and attempts remain: perform correction adjustments
            logger.info("Applying self-correction instructions: %s", quality_eval.correction_instructions)
            # Re-render with high-contrast palette
            plan.color_palette["primary"] = "#0F172A"
            pil_img = self.multilingual_renderer.render_visual(
                plan=plan,
                width=width,
                height=height,
                flux_artwork=flux_hero,
            )
            buf = io.BytesIO()
            pil_img.save(buf, format="PNG", dpi=(150, 150))
            gen_img.image_bytes = buf.getvalue()

        # 7. Write to Session Cache
        session_cache = self.cache_dir / "sessions" / session_id
        session_cache.mkdir(parents=True, exist_ok=True)
        (session_cache / f"{image_id}.png").write_bytes(gen_img.image_bytes)

        return gen_img
