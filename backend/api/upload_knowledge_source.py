from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
import os
from crud.upload_knowledge_source import upload_file, list_sources, delete_source
from core.jwt import get_current_user
from ingestion.pipeline import ingest_user_documents
from ingestion.search import search_user_documents
from schemas.knowledge_source import SearchRequest

router = APIRouter()

ACCEPTED_EXTENSIONS = {".pdf", ".csv", ".xls", ".xlsx", ".doc", ".docx", ".txt", ".md"}


@router.get("/check")
async def check():
    return {"message": "ok - knowledge source"}


@router.get("/")
async def get_knowledge_sources(current_user: dict = Depends(get_current_user)):
    return await list_sources(current_user["sub"])


@router.post("/upload")
async def upload_knowledge_source(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ACCEPTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Accepted: {', '.join(sorted(ACCEPTED_EXTENSIONS))}",
        )
    return await upload_file(file, current_user["sub"], ext)


@router.delete("/{source_id}")
async def delete_knowledge_source(
    source_id: str,
    current_user: dict = Depends(get_current_user),
):
    ok = await delete_source(current_user["sub"], source_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
    return {"ok": True, "id": source_id}


@router.post("/ingest")
async def ingest_knowledge_sources(current_user: dict = Depends(get_current_user)):
    """Manually rebuild this user's FAISS index from all uploaded docs."""
    try:
        return await ingest_user_documents(current_user["sub"])
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ingestion failed: {e}",
        )


@router.post("/search")
async def search_knowledge_sources(
    body: SearchRequest,
    current_user: dict = Depends(get_current_user),
):
    """RAG search over the current user's indexed documents."""
    try:
        return search_user_documents(
            current_user["sub"],
            body.query,
            top_k=body.top_k,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {e}",
        )
