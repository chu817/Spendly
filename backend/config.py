"""Environment-based configuration for the impulse finance backend."""
import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from repo root (parent of backend/)
_load_env = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_load_env)
load_dotenv()  # Also allow cwd .env


def load_config():
    """Load config from environment. Single source of truth for limits and feature flags."""
    demo_path = os.getenv("DEMO_DATASET_PATH")
    if demo_path and not Path(demo_path).is_absolute():
        # Resolve relative to project root (parent of backend/)
        base = Path(__file__).resolve().parent.parent
        demo_path = str((base / demo_path).resolve())
    return {
        "GEMINI_API_KEY": os.getenv("GEMINI_API_KEY", ""),
        "DEMO_DATASET_PATH": demo_path or "",
        "MAX_UPLOAD_MB": int(os.getenv("MAX_UPLOAD_MB", "3200")),
        "CHUNK_SIZE": int(os.getenv("CHUNK_SIZE", "100000")),
        "CORS_ORIGINS": os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
        "FLASK_ENV": os.getenv("FLASK_ENV", "development"),
    }


config = load_config()
