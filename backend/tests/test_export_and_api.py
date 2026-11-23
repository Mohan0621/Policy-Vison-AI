"""
test_export_and_api.py
======================
Unit Test Suite for API Endpoints, Validation Guardrails, and Enterprise PNG Export.

This test module validates:
1. System Health:
   - Validating the '/health' endpoint returns status 'ok'.
2. API Session Lifecycle:
   - Creating a session -> Submitting free text policy -> Checking document status.
   - Generating 3-section explanation -> Asking a grounded Q&A question -> Deleting session.
3. Input Validation Errors:
   - Text too short (< 50 chars) returns TEXT_TOO_SHORT.
   - Requesting generation without an uploaded policy returns NO_DOCUMENT.
4. Enterprise PNG Export Standards:
   - Verifying 150 DPI print-ready resolution headers.
   - Verifying embedded XMP/PNG metadata tags (policy document name, policy ID, timestamp).
"""

import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

# Test client instance for invoking FastAPI routes
client = TestClient(app)


# -----------------------------------------------------------------------------
# Unit Test: Server Health Check
# -----------------------------------------------------------------------------
def test_api_health_check():
    """
    Unit Test: Verifies service liveness via the /health endpoint.
    """
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


# -----------------------------------------------------------------------------
# Unit Test: Full REST API Session Lifecycle
# -----------------------------------------------------------------------------
def test_api_session_lifecycle():
    """
    Unit Test: Tests the complete end-to-end REST API session workflow:
    1. Retrieve or create session via /api/v1/session.
    2. Submit valid policy text via /api/v1/documents/text.
    3. Verify indexing status via /api/v1/documents/status.
    4. Generate 3-section simplified explanation via /api/v1/generate/explanation.
    5. Ask a question via /api/v1/qa/ask.
    6. Delete the session via /api/v1/session.
    """
    # 1. Retrieve session and establish session header
    res = client.get("/api/v1/session")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    session_id = data["data"]["session_id"]
    headers = {"X-Session-ID": session_id}

    # 2. Submit policy text
    valid_text = "This comprehensive health policy covers inpatient hospitalization up to Rs 5,00,000 per policy year."
    res2 = client.post("/api/v1/documents/text", json={"text": valid_text}, headers=headers)
    assert res2.status_code == 200
    assert res2.json()["data"]["index_status"] == "ready"

    # 3. Poll document indexing status
    res3 = client.get("/api/v1/documents/status", headers=headers)
    assert res3.status_code == 200
    assert res3.json()["data"]["filename"] == "Free Text Policy"

    # 4. Generate 3-section explanation
    res4 = client.post(
        "/api/v1/generate/explanation",
        json={"language": "en", "style": "professional_infographic"},
        headers=headers,
    )
    assert res4.status_code == 200
    assert res4.json()["success"] is True
    expl_data = res4.json()["data"]["explanation"]
    assert "what_is_covered" in expl_data
    assert "what_is_not_covered" in expl_data
    assert "how_to_claim" in expl_data

    # 5. Ask a policy query
    res5 = client.post("/api/v1/qa/ask", json={"question": "What is the inpatient limit?"}, headers=headers)
    assert res5.status_code == 200
    assert "answer" in res5.json()["data"]

    # 6. Delete session and confirm cleanup
    res6 = client.delete("/api/v1/session", headers=headers)
    assert res6.status_code == 200
    assert res6.json()["data"]["deleted"] is True


# -----------------------------------------------------------------------------
# Unit Test: API Input Validation & Guardrails
# -----------------------------------------------------------------------------
def test_api_validation_errors():
    """
    Unit Test: Tests API error responses for invalid client requests:
    - Text below minimum 50 characters fails with TEXT_TOO_SHORT.
    - Attempting generation on an empty session fails with NO_DOCUMENT.
    """
    # Block A: Short text rejection
    res = client.post("/api/v1/documents/text", json={"text": "too short"})
    assert res.status_code == 200
    assert res.json()["success"] is False
    assert res.json()["error"]["code"] == "TEXT_TOO_SHORT"

    # Block B: Generation request without uploaded document
    fresh_client = TestClient(app)
    res_no_doc = fresh_client.post("/api/v1/generate/explanation", json={"language": "en"})
    assert res_no_doc.status_code == 200
    assert res_no_doc.json()["success"] is False
    assert res_no_doc.json()["error"]["code"] == "NO_DOCUMENT"


# -----------------------------------------------------------------------------
# Unit Test: Export Image 150 DPI and Embedded Metadata Verification
# -----------------------------------------------------------------------------
def test_export_png_metadata_and_dpi(tmp_path):
    """
    Unit Test: Validates enterprise export standards (Requirements 10.1 & 10.4):
    - Exported PNG images must declare 150 DPI print-ready resolution.
    - Embedded PNG info chunks must contain policy_document_name, policy_identifier,
      and generation_timestamp_utc.
    """
    from PIL import Image
    from app.services.export_service import ExportService
    from app.services.session_manager import SessionManager
    import io

    # 1. Setup temporary isolated cache directory
    mgr = SessionManager()
    mgr.create_session("test_session_export")
    
    cache_dir = tmp_path / "cache"
    sess_dir = cache_dir / "sessions" / "test_session_export"
    sess_dir.mkdir(parents=True, exist_ok=True)
    
    # 2. Save a test 1024x1024 image in session cache
    test_img = Image.new("RGB", (1024, 1024), color=(240, 244, 250))
    test_img.save(sess_dir / "img_test.png", format="PNG")
    
    # 3. Export image through ExportService
    export_svc = ExportService(cache_dir=cache_dir, session_mgr=mgr)
    exported = export_svc.export_image(
        session_id="test_session_export",
        image_id="img_test",
        document_name="HDFC_Ergo_Optima_Restore.pdf",
        policy_id="HDFC-POL-992",
    )
    
    assert exported.filename == "visual_explainer_img_test.png"
    assert exported.mime_type == "image/png"
    
    # 4. Read back image bytes and verify resolution and DPI
    loaded_img = Image.open(io.BytesIO(exported.file_bytes))
    assert loaded_img.size == (1024, 1024)
    
    dpi = loaded_img.info.get("dpi")
    assert dpi is not None
    assert round(dpi[0]) == 150 and round(dpi[1]) == 150
    
    # 5. Assert embedded XMP/PNG metadata attributes
    assert loaded_img.info.get("policy_document_name") == "HDFC_Ergo_Optima_Restore.pdf"
    assert loaded_img.info.get("policy_identifier") == "HDFC-POL-992"
    assert "generation_timestamp_utc" in loaded_img.info
    assert len(loaded_img.info["generation_timestamp_utc"]) > 10
