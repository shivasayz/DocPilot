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

# CORS - must be before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routes after app is created
from core.auth import auth_route
from routes.notes import notes_route

@app.get("/health")
def get_health():
    return {"message": "Server is running"}

app.include_router(
    auth_route,
    prefix="/auth",
    tags=["Authentication"]
)

app.include_router(
    notes_route,
    prefix="/notes",
    tags=["Notes"]
)
