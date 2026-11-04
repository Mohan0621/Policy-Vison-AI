import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import auth, documents, export, generate, qa, session
from app.utils.language_utils import load_noto_fonts

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def session_middleware(request: Request, call_next):
    # Session cookie resolution or generation
    session_id = request.cookies.get("session_id")
    if not session_id:
        session_id = request.headers.get("X-Session-ID") or str(uuid.uuid4())
    request.state.session_id = session_id
    
    response = await call_next(request)
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        samesite="lax",
        max_age=settings.SESSION_INACTIVITY_HOURS * 3600,
    )
    return response

@app.on_event("startup")
async def startup_event():
    # Cache font references and warm up directories
    load_noto_fonts(str(settings.FONTS_DIR))

# Register API routers with /api/v1 prefix
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(documents.router, prefix=settings.API_V1_PREFIX)
app.include_router(generate.router, prefix=settings.API_V1_PREFIX)
app.include_router(qa.router, prefix=settings.API_V1_PREFIX)
app.include_router(export.router, prefix=settings.API_V1_PREFIX)
app.include_router(session.router, prefix=settings.API_V1_PREFIX)

@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}
