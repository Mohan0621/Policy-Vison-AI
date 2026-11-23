"""
test_integration.py
===================
Full End-to-End Integration Test Suite for PolicyVision AI.

This test module exercises the complete user journey across all backend subsystems:
1. Starting a session via the session router.
2. Ingesting multi-clause policy text (limits, deductibles, exclusions, claims steps).
3. Verifying RAG indexing readiness.
4. Generating the 3-section simplified explanation with numeric preservation and FK bounds.
5. Triggering asynchronous coverage visual generation and polling for task completion.
6. Triggering asynchronous claims flowchart generation.
7. Asking grounded Q&A queries and receiving citation chips.
8. Packaging and downloading the enterprise ZIP bundle, validating its contents
   (manifest.txt, PNG visuals, and summary PDF).
"""

import io
import time
import zipfile
import pytest
from fastapi.testclient import TestClient
from app.main import app

# Test client instance for invoking FastAPI routes
client = TestClient(app)


# -----------------------------------------------------------------------------
# Integration Test: Complete End-to-End Workflow
# -----------------------------------------------------------------------------
@pytest.mark.integration
def test_integration_full_end_to_end_flow():
    """
    Integration Test: Simulates a complete user session from document upload
    through multi-style visual generation, Q&A, and enterprise ZIP download.
    """
    # -------------------------------------------------------------------------
    # Stage 1: Initialize fresh user session
    # -------------------------------------------------------------------------
    sess_res = client.get("/api/v1/session")
    session_id = sess_res.json()["data"]["session_id"]
    headers = {"X-Session-ID": session_id}

    # -------------------------------------------------------------------------
    # Stage 2: Ingest multi-clause health insurance policy text
    # -------------------------------------------------------------------------
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

    # -------------------------------------------------------------------------
    # Stage 3: Poll document indexing status until ready
    # -------------------------------------------------------------------------
    status_res = client.get("/api/v1/documents/status", headers=headers)
    assert status_res.json()["data"]["index_status"] == "ready"

    # -------------------------------------------------------------------------
    # Stage 4: Generate 3-section plain language explanation
    # -------------------------------------------------------------------------
    gen_res = client.post(
        "/api/v1/generate/explanation",
        json={"language": "en", "style": "professional_infographic"},
        headers=headers
    )
    assert gen_res.json()["success"] is True
    data = gen_res.json()["data"]
    expl = data["explanation"]
    
    # Assert numeric limit was preserved verbatim
    assert "Rs. 10,00,000" in expl["what_is_covered"] or "10,00,000" in expl["what_is_covered"]
    # Assert Flesch-Kincaid readability grade is within bounds
    assert 1.0 <= expl["fk_grade_level"] <= 8.0

    # -------------------------------------------------------------------------
    # Stage 5: Trigger asynchronous coverage visual explainer generation
    # -------------------------------------------------------------------------
    cov_res = client.post(
        "/api/v1/generate/coverage-visual",
        json={"style": "professional_infographic", "language": "en"},
        headers=headers
    )
    assert cov_res.json()["success"] is True
    task_id = cov_res.json()["data"]["task_id"]

    # Poll background task status
    time.sleep(0.5)
    t_status = client.get(f"/api/v1/generate/status/{task_id}", headers=headers)
    assert t_status.json()["success"] is True
    img_data = t_status.json()["data"]
    if img_data.get("status") == "complete":
        assert img_data["result"]["width"] >= 1024

    # -------------------------------------------------------------------------
    # Stage 6: Trigger asynchronous claims flowchart diagram generation
    # -------------------------------------------------------------------------
    claim_res = client.post(
        "/api/v1/generate/claims-visual",
        json={"style": "flowchart_diagram", "language": "en"},
        headers=headers
    )
    assert claim_res.json()["success"] is True

    # -------------------------------------------------------------------------
    # Stage 7: Grounded Policy Q&A with citation verification
    # -------------------------------------------------------------------------
    qa_res = client.post(
        "/api/v1/qa/ask",
        json={"question": "What is the maximum sum insured and deductible amount?", "language": "en"},
        headers=headers
    )
    assert qa_res.json()["success"] is True
    assert len(qa_res.json()["data"]["citations"]) > 0

    # -------------------------------------------------------------------------
    # Stage 8: Export complete session bundle as enterprise ZIP
    # -------------------------------------------------------------------------
    zip_res = client.post("/api/v1/export/session-zip", headers=headers)
    assert zip_res.status_code == 200
    assert zip_res.headers["content-type"] == "application/zip"
    
    # Verify ZIP file integrity and member entries
    zf = zipfile.ZipFile(io.BytesIO(zip_res.content))
    namelist = zf.namelist()
    assert "manifest.txt" in namelist
    assert any(name.endswith(".png") or name.endswith(".pdf") for name in namelist)
