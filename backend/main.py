from core.auth import auth_route
from fastapi import FastAPI

app = FastAPI(
    title="Knowledge Copilot API",
    version="1.0.0",
    description=(
        "Backend API for Knowledge Copilot, an AI-powered personal learning assistant "
        "that enables Retrieval-Augmented Generation (RAG), document ingestion, "
        "knowledge management, intelligent search, note-taking, and AI-assisted learning."
    ),
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs"
)

@app.get("/health")
def get_health():
    return {"status": "healthy"}

@app.get("/")
def read_root():
    return {"Message": "ok!"}

app.include_router(
    auth_route,
    prefix="/api/auth",
    tags=["Authentication"]
)