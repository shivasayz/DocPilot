import os
from pathlib import Path

try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent / ".env")
except ImportError:
    pass


def _env(key: str, default: str = "") -> str:
    value = os.getenv(key)
    return value if value else default


# Set secrets in backend/.env (see .env.example). Never commit real keys.
MONGO_URL = _env("MONGO_URL")
DATABASE_NAME = _env("DATABASE_NAME", "intellisource")

JWT_SECRET = _env("JWT_SECRET", "change-me-in-backend-dotenv")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_MINUTES = int(_env("JWT_EXPIRY_MINUTES", str(60 * 24)))  # 24 hours

GROQ_API_KEY = _env("GROQ_API_KEY")
EMBEDDING_MODEL = _env("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
GROQ_MODEL = _env("GROQ_MODEL", "openai/gpt-oss-20b")
