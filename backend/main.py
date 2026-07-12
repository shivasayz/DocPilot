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


@app.get("/health")
def get_health():
    return {"message": "Server is running"}


app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(notes_router, prefix="/notes", tags=["Notes"])
