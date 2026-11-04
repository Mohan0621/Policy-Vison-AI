import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "PolicyVision AI"
    APP_VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Storage and paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    FILE_CACHE_DIR: Path = BASE_DIR / "file_cache"
    FONTS_DIR: Path = BASE_DIR / "fonts"
    CHROMA_PERSIST_DIR: Path = BASE_DIR / "chroma_data"
    
    # Backends
    SESSION_BACKEND: str = "memory"  # "memory" or "redis"
    REDIS_URL: str = "redis://localhost:6379/0"
    LLM_BACKEND: str = "heuristic"  # "heuristic", "llama_cpp", "transformers"
    IMAGE_BACKEND: str = "canvas"  # "canvas", "flux", "hf_api", "sdxl", "sdxl_turbo"
    ENABLE_OCR: bool = False
    
    # Hugging Face API Configs
    HF_API_TOKEN: str = os.getenv("HF_API_TOKEN", "")
    HF_IMAGE_MODEL: str = os.getenv("HF_IMAGE_MODEL", "black-forest-labs/FLUX.1-schnell")
    
    # Model configs
    EMBEDDING_MODEL: str = "BAAI/bge-m3"
    LLM_MODEL_PATH: str = "models/llama-3.1-8b-instruct.Q4_K_M.gguf"
    
    # Limits & Timeouts
    MAX_FILE_SIZE_BYTES: int = 50 * 1024 * 1024  # 50 MB
    MAX_PDF_PAGES: int = 100
    MIN_TEXT_CHARS: int = 50
    MAX_TEXT_CHARS: int = 5000
    
    PDF_PROCESS_TIMEOUT_SEC: int = 60
    INDEXING_TIMEOUT_SEC: int = 30
    LLM_EXTRACTION_TIMEOUT_SEC: int = 120
    LLM_SIMPLIFY_TIMEOUT_SEC: int = 15
    LLM_TRANSLATION_TIMEOUT_SEC: int = 20
    LLM_QA_TIMEOUT_SEC: int = 10
    IMAGE_GEN_TIMEOUT_SEC: int = 90
    ZIP_EXPORT_TIMEOUT_SEC: int = 30
    
    SESSION_INACTIVITY_HOURS: int = 4
    QA_INACTIVITY_MINUTES: int = 30
    MAX_QA_HISTORY: int = 10
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
os.makedirs(settings.FILE_CACHE_DIR, exist_ok=True)
os.makedirs(settings.FONTS_DIR, exist_ok=True)

