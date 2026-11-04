import io
import zipfile
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.mark.integration
def test_integration_full_end_to_end_flow():
    # 1. Start fresh session
    sess_res = client.get("/api/v1/session")
    session_id = sess_res.json()["data"]["session_id"]
    headers = {"X-Session-ID": session_id}

    # 2. Upload text policy
    policy_text = """
    COMPREHENSIVE HEALTH INSURANCE POLICY
    Coverage Limit: Maximum sum insured of Rs. 10,00,000 per policyholder.
    Deductible: Compulsory deductible of Rs. 10,000 per claim.
    Cashless Hospitalization: Available across network hospitals with 24 hours prior intimation.
    Exclusions: Cosmetic surgery, intentional self-harm, and pre-existing diseases for first 2 years.
    Claim Procedure:
    Step 1: Intimate insurer within 24 hours of hospital admission.
    Step 2: Submit discharge summary, doctor prescriptions, and original bills.
    Step 3: Insurer audits documents and settles claim within 15 working days.
    """
    upload_res = client.post("/api/v1/documents/text", json={"text": policy_text.strip()}, headers=headers)
    assert upload_res.json()["success"] is True

    # 3. Poll document status
    status_res = client.get("/api/v1/documents/status", headers=headers)
    assert status_res.json()["data"]["index_status"] == "ready"

    # 4. Generate explanation
    gen_res = client.post(
        "/api/v1/generate/explanation",
        json={"language": "en", "style": "professional_infographic"},
        headers=headers
    )
    assert gen_res.json()["success"] is True
    data = gen_res.json()["data"]
    expl = data["explanation"]
    assert "Rs. 10,00,000" in expl["what_is_covered"] or "10,00,000" in expl["what_is_covered"]
    assert 1.0 <= expl["fk_grade_level"] <= 8.0

    # 5. Generate coverage visual
    cov_res = client.post(
        "/api/v1/generate/coverage-visual",
        json={"style": "professional_infographic", "language": "en"},
        headers=headers
    )
    assert cov_res.json()["success"] is True
    task_id = cov_res.json()["data"]["task_id"]

    # Check task status
    import time
    time.sleep(0.5)
    t_status = client.get(f"/api/v1/generate/status/{task_id}", headers=headers)
    assert t_status.json()["success"] is True
    img_data = t_status.json()["data"]
    if img_data.get("status") == "complete":
        assert img_data["result"]["width"] >= 1024

    # 6. Generate claims visual
    claim_res = client.post(
        "/api/v1/generate/claims-visual",
        json={"style": "flowchart_diagram", "language": "en"},
        headers=headers
    )
    assert claim_res.json()["success"] is True

    # 7. Q&A Ask
    qa_res = client.post(
        "/api/v1/qa/ask",
        json={"question": "What is the maximum sum insured and deductible amount?", "language": "en"},
        headers=headers
    )
    assert qa_res.json()["success"] is True
    assert len(qa_res.json()["data"]["citations"]) > 0

    # 8. Export session zip
    zip_res = client.post("/api/v1/export/session-zip", headers=headers)
    assert zip_res.status_code == 200
    assert zip_res.headers["content-type"] == "application/zip"
    
    # Verify zip content
    zf = zipfile.ZipFile(io.BytesIO(zip_res.content))
    namelist = zf.namelist()
    assert "manifest.txt" in namelist
    assert any(name.endswith(".png") or name.endswith(".pdf") for name in namelist)

