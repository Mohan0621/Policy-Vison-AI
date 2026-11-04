from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_auth_login_demo():
    resp = client.post("/api/v1/auth/login", json={
        "email": "demo@policyvision.ai",
        "password": "password123",
        "remember_me": True,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "token" in data["data"]
    assert data["data"]["user"]["email"] == "demo@policyvision.ai"

def test_auth_register_and_login():
    resp = client.post("/api/v1/auth/register", json={
        "name": "Arjun Kumar",
        "email": "arjun@example.com",
        "password": "securepassword",
        "organization": "FinTech Corp",
        "role": "Compliance Auditor",
    })
    assert resp.status_code == 200
    reg_data = resp.json()
    assert reg_data["success"] is True
    assert reg_data["data"]["user"]["name"] == "Arjun Kumar"

    # Now login with the newly created account
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "arjun@example.com",
        "password": "securepassword",
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert login_data["success"] is True
    assert login_data["data"]["user"]["role"] == "Compliance Auditor"

def test_auth_password_too_short():
    resp = client.post("/api/v1/auth/register", json={
        "name": "Short Pass",
        "email": "short@example.com",
        "password": "123",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is False
    assert data["error"]["code"] == "PASSWORD_TOO_SHORT"

