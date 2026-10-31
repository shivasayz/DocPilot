import os


def _env(key: str, default: str = "") -> str:
    value = os.getenv(key)
    return value if value else default


# Override with env vars in Docker / CI. Defaults keep local scripts working.
MONGO_URL = _env(
    "MONGO_URL",
    "mongodb+srv://randomweirdlunatic_db_user:RvwxZmWbASuoaGNI@cluster0.atinsvl.mongodb.net/?appName=Cluster0",
)
DATABASE_NAME = _env("DATABASE_NAME", "intellisource")

JWT_SECRET = _env("JWT_SECRET", "your-super-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_MINUTES = int(_env("JWT_EXPIRY_MINUTES", str(60 * 24)))  # 24 hours

GROQ_API_KEY = _env("GROQ_API_KEY", "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")
EMBEDDING_MODEL = _env("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
GROQ_MODEL = _env("GROQ_MODEL", "openai/gpt-oss-20b")
