from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.connection import connect_db, close_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="AI-Project API",
    version="1.0.0",
    description="API for AI-Project",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from api.auth import router as auth_router
from api.notes import router as notes_router
from api.upload_knowledge_source import router as knowledge_source_router
from api.widget_settings import router as widget_settings_router


@app.get("/health")
def get_health():
    return {"message": "Server is running"}


app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(notes_router, prefix="/notes", tags=["Notes"])
app.include_router(knowledge_source_router, prefix="/knowledge-source", tags=["Knowledge Source"])
app.include_router(widget_settings_router, prefix="/api/v1/widget", tags=["Widget Settings"])

