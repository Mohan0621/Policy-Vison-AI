"""
test_auth.py
=============
Unit Test Suite for User Authentication and Account Registration.

This test module validates:
1. Demo User Login:
   - Verifying the pre-seeded demo user account (demo@policyvision.ai).
   - Validating JWT bearer token generation and user profile payload.
2. Registration and Subsequent Authentication:
   - Registering a new compliance user with name, organization, and role.
   - Logging in with the newly registered credentials.
3. Password Security Validation:
   - Rejecting short passwords (< 6 characters) with PASSWORD_TOO_SHORT.
"""

from fastapi.testclient import TestClient
from app.main import app

# Test client instance for invoking FastAPI routes
client = TestClient(app)


# -----------------------------------------------------------------------------
# Unit Test: Pre-Seeded Demo User Login
# -----------------------------------------------------------------------------
def test_auth_login_demo():
    """
    Unit Test: Tests logging in with pre-seeded demo credentials.
    Verifies HTTP 200, success=True, JWT access token, and user profile data.
    """
    # 1. Send login POST request with demo credentials
    resp = client.post("/api/v1/auth/login", json={
        "email": "demo@policyvision.ai",
        "password": "password123",
        "remember_me": True,
    })
    
    # 2. Assert success and structure of authentication payload
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "token" in data["data"]
    assert data["data"]["user"]["email"] == "demo@policyvision.ai"


# -----------------------------------------------------------------------------
# Unit Test: New User Registration & Subsequent Login
# -----------------------------------------------------------------------------
def test_auth_register_and_login():
    """
    Unit Test: Tests registration of a new compliance auditor user, followed
    immediately by authentication with those credentials.
    """
    # 1. Register a new user account
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

    # 2. Log in using the newly created account credentials
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "arjun@example.com",
        "password": "securepassword",
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert login_data["success"] is True
    assert login_data["data"]["user"]["role"] == "Compliance Auditor"


# -----------------------------------------------------------------------------
# Unit Test: Password Length Validation Guardrail
# -----------------------------------------------------------------------------
def test_auth_password_too_short():
    """
    Unit Test: Verifies that attempting to register with a password shorter
    than 6 characters is rejected with PASSWORD_TOO_SHORT.
    """
    resp = client.post("/api/v1/auth/register", json={
        "name": "Short Pass",
        "email": "short@example.com",
        "password": "123",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is False
    assert data["error"]["code"] == "PASSWORD_TOO_SHORT"
