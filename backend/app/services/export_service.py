import io
import os
import zipfile
import datetime
import concurrent.futures
from pathlib import Path
from typing import Dict, List, Optional
from PIL import Image, PngImagePlugin

from app.config import settings
from app.models import ExportError, ExportedFile
from app.services.session_manager import SessionManager, session_manager

class ExportService:
    def __init__(
        self,
        cache_dir: Path = settings.FILE_CACHE_DIR,
        session_mgr: Optional[SessionManager] = None,
        timeout_seconds: int = settings.ZIP_EXPORT_TIMEOUT_SEC,
    ):
        self.cache_dir = cache_dir
        self.session_mgr = session_mgr or session_manager
        self.timeout_seconds = timeout_seconds

    def export_image(
        self,
        session_id: str,
        image_id: str,
        document_name: str = "Insurance_Policy.pdf",
        policy_id: str = "POL-001",
    ) -> ExportedFile:
        file_path = self.cache_dir / "sessions" / session_id / f"{image_id}.png"
        if not file_path.exists():
            raise ExportError(
                code="IMAGE_NOT_FOUND",
                message=f"Requested image {image_id} was not found in session cache.",
                retryable=False,
            )

        # Open and embed PNG metadata
        img = Image.open(file_path)
        orig_w, orig_h = img.size
        if orig_w < 1024 or orig_h < 1024:
            raise ExportError(
                code="RESOLUTION_ERROR",
                message="Image resolution is below the minimum required standard.",
                retryable=False,
            )

        metadata = PngImagePlugin.PngInfo()
        metadata.add_text("policy_document_name", document_name)
        metadata.add_text("policy_identifier", policy_id)
        metadata.add_text("generation_timestamp_utc", datetime.datetime.now(datetime.timezone.utc).isoformat())

        buf = io.BytesIO()
        img.save(buf, format="PNG", pnginfo=metadata, dpi=(150, 150))
        img_bytes = buf.getvalue()

        return ExportedFile(
            filename=f"visual_explainer_{image_id}.png",
            file_bytes=img_bytes,
            mime_type="image/png",
        )

    def _create_explanation_pdf(self, explanation: dict, filename: str) -> bytes:
        buf = io.BytesIO()
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.pdfgen import canvas
            
            c = canvas.Canvas(buf, pagesize=letter)
            c.setFont("Helvetica-Bold", 16)
            c.drawString(50, 750, f"PolicyVision AI — {filename} Summary")
            
            c.setFont("Helvetica-Bold", 12)
            c.drawString(50, 710, "1. What is Covered")
            c.setFont("Helvetica", 10)
            text_cov = explanation.get("what_is_covered", "N/A")
            c.drawString(50, 690, text_cov[:95])
            if len(text_cov) > 95:
                c.drawString(50, 675, text_cov[95:190])

            c.setFont("Helvetica-Bold", 12)
            c.drawString(50, 640, "2. What is Not Covered")
            c.setFont("Helvetica", 10)
            text_not = explanation.get("what_is_not_covered", "N/A")
            c.drawString(50, 620, text_not[:95])
            if len(text_not) > 95:
                c.drawString(50, 605, text_not[95:190])

            c.setFont("Helvetica-Bold", 12)
            c.drawString(50, 570, "3. How to Claim")
            c.setFont("Helvetica", 10)
            text_claim = explanation.get("how_to_claim", "N/A")
            c.drawString(50, 550, text_claim[:95])
            if len(text_claim) > 95:
                c.drawString(50, 535, text_claim[95:190])

            c.showPage()
            c.save()
            return buf.getvalue()
        except ImportError:
            # Simple text PDF fallback
            header = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
            content = f"Policy Explanation Summary\nCovered: {explanation.get('what_is_covered')}\nNot Covered: {explanation.get('what_is_not_covered')}\nClaim: {explanation.get('how_to_claim')}"
            stream = f"3 0 obj<</Type/Page/Parent 2 0 R/Contents 4 0 R>>endobj\n4 0 obj<</Length {len(content)}>>stream\n{content}\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n100\n%%EOF"
            return (header + stream).encode("utf-8")

    def _export_zip_worker(self, session_id: str) -> ExportedFile:
        session = self.session_mgr.get_session(session_id)
        if not session:
            raise ExportError(
                code="SESSION_EXPIRED",
                message="Session expired or not found.",
                retryable=False,
            )

        zip_buf = io.BytesIO()
        with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
            session_folder = self.cache_dir / "sessions" / session_id
            if session_folder.exists():
                for p in session_folder.glob("*.png"):
                    zf.write(p, arcname=f"visuals/{p.name}")

            # Include explanation PDF if exists
            expl = session.get("simplified_explanation")
            if expl:
                doc_name = (session.get("policy_document") or {}).get("filename", "Policy_Document")
                pdf_bytes = self._create_explanation_pdf(expl, doc_name)
                zf.writestr("Policy_Summary_Explanation.pdf", pdf_bytes)

            # Include manifest JSON
            manifest_info = f"""PolicyVision AI Session Export
Session ID: {session_id}
Generated At: {datetime.datetime.now(datetime.timezone.utc).isoformat()}
Language: {session.get('selected_language', 'en')}
Style: {session.get('selected_style', 'professional_infographic')}
"""
            zf.writestr("manifest.txt", manifest_info)

        zip_bytes = zip_buf.getvalue()
        return ExportedFile(
            filename=f"policyvision_session_{session_id[:8]}.zip",
            file_bytes=zip_bytes,
            mime_type="application/zip",
        )

    def export_session_zip(self, session_id: str) -> ExportedFile:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(self._export_zip_worker, session_id)
            try:
                return future.result(timeout=self.timeout_seconds)
            except concurrent.futures.TimeoutError:
                raise ExportError(
                    code="EXPORT_FAILED",
                    message="Export assembly timed out after 30 seconds. Please retry.",
                    retryable=True,
                )
            except ExportError:
                raise
            except Exception as e:
                raise ExportError(
                    code="EXPORT_FAILED",
                    message=f"Export assembly failed: {str(e)}",
                    retryable=True,
                )

