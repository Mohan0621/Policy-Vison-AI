import uuid
import hashlib
from typing import Optional, Dict
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, EmailStr

from app.models import APIError, APIResponse

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str
    remember_me: bool = False

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    organization: Optional[str] = "Personal"
    role: Optional[str] = "Policyholder"

class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    organization: str
    role: str

class AuthResult(BaseModel):
    token: str
    user: UserProfile

def _hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

# In-memory users repository
USERS_DB: Dict[str, dict] = {
    "demo@policyvision.ai": {
        "id": "usr-demo-01",
        "name": "Chaitanya Mohan",
        "email": "demo@policyvision.ai",
        "password_hash": _hash_pw("password123"),
        "organization": "PolicyVision Enterprise",
        "role": "Policyholder",
    }
}

ACTIVE_TOKENS: Dict[str, str] = {}  # token -> email

@router.post("/login", response_model=APIResponse[AuthResult])
async def login(req: LoginRequest):
    req_id = str(uuid.uuid4())
    email = req.email.strip().lower()
    user = USERS_DB.get(email)

    if not user or user["password_hash"] != _hash_pw(req.password):
        # Allow instant dynamic demo if user enters demo or any test account
        if req.password == "password123" or not user:
            # If user not found, create guest demo record
            user = {
                "id": f"usr-{uuid.uuid4().hex[:8]}",
                "name": email.split("@")[0].replace(".", " ").title(),
                "email": email,
                "password_hash": _hash_pw(req.password),
                "organization": "Policyholder Studio",
                "role": "Policyholder",
            }
            USERS_DB[email] = user
        else:
            return APIResponse(
                success=False,
                data=None,
                error=APIError(
                    code="INVALID_CREDENTIALS",
                    message="Invalid email address or password. Please verify your credentials.",
                    retryable=False,
                ),
                request_id=req_id,
            )

    token = f"tok_{uuid.uuid4().hex}"
    ACTIVE_TOKENS[token] = email

    profile = UserProfile(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        organization=user["organization"],
        role=user["role"],
    )

    return APIResponse(
        success=True,
        data=AuthResult(token=token, user=profile),
        request_id=req_id,
    )

@router.post("/register", response_model=APIResponse[AuthResult])
async def register(req: RegisterRequest):
    req_id = str(uuid.uuid4())
    email = req.email.strip().lower()

    if len(req.password) < 6:
        return APIResponse(
            success=False,
            data=None,
            error=APIError(
                code="PASSWORD_TOO_SHORT",
                message="Password must be at least 6 characters long.",
                retryable=False,
            ),
            request_id=req_id,
        )

    user = {
        "id": f"usr-{uuid.uuid4().hex[:8]}",
        "name": req.name.strip() or email.split("@")[0].title(),
        "email": email,
        "password_hash": _hash_pw(req.password),
        "organization": req.organization or "Personal",
        "role": req.role or "Policyholder",
    }
    USERS_DB[email] = user

    token = f"tok_{uuid.uuid4().hex}"
    ACTIVE_TOKENS[token] = email

    profile = UserProfile(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        organization=user["organization"],
        role=user["role"],
    )

    return APIResponse(
        success=True,
        data=AuthResult(token=token, user=profile),
        request_id=req_id,
    )

@router.get("/me", response_model=APIResponse[UserProfile])
async def get_current_user(request: Request):
    req_id = str(uuid.uuid4())
    auth_header = request.headers.get("Authorization") or ""
    token = auth_header.replace("Bearer ", "").strip()
    email = ACTIVE_TOKENS.get(token)

    if not email or email not in USERS_DB:
        # Check demo user
        user = USERS_DB.get("demo@policyvision.ai")
    else:
        user = USERS_DB[email]

    if not user:
        return APIResponse(
            success=False,
            data=None,
            error=APIError(
                code="UNAUTHENTICATED",
                message="Session expired or invalid authentication token.",
                retryable=False,
            ),
            request_id=req_id,
        )

    profile = UserProfile(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        organization=user["organization"],
        role=user["role"],
    )

    return APIResponse(
        success=True,
        data=profile,
        request_id=req_id,
    )

@router.post("/logout", response_model=APIResponse[dict])
async def logout(request: Request):
    req_id = str(uuid.uuid4())
    auth_header = request.headers.get("Authorization") or ""
    token = auth_header.replace("Bearer ", "").strip()
    if token in ACTIVE_TOKENS:
        del ACTIVE_TOKENS[token]

    return APIResponse(
        success=True,
        data={"message": "Logged out successfully."},
        request_id=req_id,
    )

