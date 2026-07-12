import os
import shutil
from datetime import datetime, timezone
from fastapi import UploadFile
from bson import ObjectId
from db.connection import db

STORAGE_DIR = "storage"
knowledge_sources = db["knowledge_sources"]

MIME_MAP = {
    ".pdf": "application/pdf",
    ".csv": "text/csv",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
    ".md": "text/markdown",
}


async def upload_file(file: UploadFile, user_id: str, ext: str):
    source_id = str(ObjectId())
    dir_path = os.path.join(STORAGE_DIR, user_id, source_id)
    os.makedirs(dir_path, exist_ok=True)

    file_path = os.path.join(dir_path, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)
    now = datetime.now(timezone.utc)

    doc = {
        "_id": ObjectId(source_id),
        "user_id": user_id,
        "name": os.path.splitext(file.filename)[0],
        "type": ext.lstrip("."),
        "file_name": file.filename,
        "file_path": file_path,
        "file_size": file_size,
        "mime_type": MIME_MAP.get(ext, "application/octet-stream"),
        "status": "pending",
        "chunks_count": 0,
        "last_indexed_at": None,
        "auto_sync": False,
        "created_at": now,
        "updated_at": now,
    }

    await knowledge_sources.insert_one(doc)

    return {
        "id": source_id,
        "name": doc["name"],
        "file_name": doc["file_name"],
        "file_size": doc["file_size"],
        "status": doc["status"],
    }
