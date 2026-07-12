from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
import os
from crud.upload_knowledge_source import upload_file
from core.jwt import get_current_user

router = APIRouter()

ACCEPTED_EXTENSIONS = {".pdf", ".csv", ".doc", ".docx", ".txt", ".md"}


@router.get("/check")
async def check():
    return {"message": "ok - knowledge source"}


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
