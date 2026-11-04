import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_api_session_lifecycle():
    # 1. Get session
    res = client.get("/api/v1/session")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    session_id = data["data"]["session_id"]
    headers = {"X-Session-ID": session_id}

    # 2. Text submission
    valid_text = "This comprehensive health policy covers inpatient hospitalization up to Rs 5,00,000 per policy year."
    res2 = client.post("/api/v1/documents/text", json={"text": valid_text}, headers=headers)
    assert res2.status_code == 200
    assert res2.json()["data"]["index_status"] == "ready"

    # 3. Document status
    res3 = client.get("/api/v1/documents/status", headers=headers)
    assert res3.status_code == 200
    assert res3.json()["data"]["filename"] == "Free Text Policy"

    # 4. Generate explanation
    res4 = client.post("/api/v1/generate/explanation", json={"language": "en", "style": "professional_infographic"}, headers=headers)
    assert res4.status_code == 200
    assert res4.json()["success"] is True
    expl_data = res4.json()["data"]["explanation"]
    assert "what_is_covered" in expl_data
    assert "what_is_not_covered" in expl_data
    assert "how_to_claim" in expl_data

    # 5. Q&A ask
    res5 = client.post("/api/v1/qa/ask", json={"question": "What is the inpatient limit?"}, headers=headers)
    assert res5.status_code == 200
    assert "answer" in res5.json()["data"]

    # 6. Delete session
    res6 = client.delete("/api/v1/session", headers=headers)
    assert res6.status_code == 200
    assert res6.json()["data"]["deleted"] is True

def test_api_validation_errors():
    # Text too short
    res = client.post("/api/v1/documents/text", json={"text": "too short"})
    assert res.status_code == 200
    assert res.json()["success"] is False
    assert res.json()["error"]["code"] == "TEXT_TOO_SHORT"

    # Generation without document
    fresh_client = TestClient(app)
    res_no_doc = fresh_client.post("/api/v1/generate/explanation", json={"language": "en"})
    assert res_no_doc.status_code == 200
    assert res_no_doc.json()["success"] is False
    assert res_no_doc.json()["error"]["code"] == "NO_DOCUMENT"

def test_export_png_metadata_and_dpi(tmp_path):
    from PIL import Image
    from app.services.export_service import ExportService
    from app.services.session_manager import SessionManager
    import io

    mgr = SessionManager()
    mgr.create_session("test_session_export")
    
    cache_dir = tmp_path / "cache"
    sess_dir = cache_dir / "sessions" / "test_session_export"
    sess_dir.mkdir(parents=True, exist_ok=True)
    
    test_img = Image.new("RGB", (1024, 1024), color=(240, 244, 250))
    test_img.save(sess_dir / "img_test.png", format="PNG")
    
    export_svc = ExportService(cache_dir=cache_dir, session_mgr=mgr)
    exported = export_svc.export_image(
        session_id="test_session_export",
        image_id="img_test",
        document_name="HDFC_Ergo_Optima_Restore.pdf",
        policy_id="HDFC-POL-992",
    )
    
    assert exported.filename == "visual_explainer_img_test.png"
    assert exported.mime_type == "image/png"
    
    # Read back image and verify REQ-10.1 & REQ-10.4
    loaded_img = Image.open(io.BytesIO(exported.file_bytes))
    assert loaded_img.size == (1024, 1024)
    
    dpi = loaded_img.info.get("dpi")
    assert dpi is not None
    assert round(dpi[0]) == 150 and round(dpi[1]) == 150
    
    # Assert XMP/PNG metadata fields
    assert loaded_img.info.get("policy_document_name") == "HDFC_Ergo_Optima_Restore.pdf"
    assert loaded_img.info.get("policy_identifier") == "HDFC-POL-992"
    assert "generation_timestamp_utc" in loaded_img.info
    assert len(loaded_img.info["generation_timestamp_utc"]) > 10


