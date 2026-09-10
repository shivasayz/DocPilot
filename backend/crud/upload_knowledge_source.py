import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
from fastapi import UploadFile
from bson import ObjectId
from db.connection import db

STORAGE_DIR = "storage"
knowledge_sources = db["knowledge_sources"]

MIME_MAP = {
    ".pdf": "application/pdf",
    ".csv": "text/csv",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
    ".md": "text/markdown",
}


def _to_iso_utc(value) -> str | None:
    """Serialize datetimes as UTC ISO-8601 with Z so JS Date parses correctly."""
    if value is None:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        else:
            value = value.astimezone(timezone.utc)
        return value.isoformat().replace("+00:00", "Z")
    return str(value)


def _serialize(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name"),
        "file_name": doc.get("file_name"),
        "type": doc.get("type"),
        "file_size": doc.get("file_size", 0),
        "status": doc.get("status", "pending"),
        "chunks_count": doc.get("chunks_count", 0),
        "auto_sync": bool(doc.get("auto_sync", False)),
        "last_indexed_at": _to_iso_utc(doc.get("last_indexed_at")),
        "created_at": _to_iso_utc(doc.get("created_at")),
    }


async def upload_file(file: UploadFile, user_id: str, ext: str):
    source_id = str(ObjectId())
    dir_path = os.path.join(STORAGE_DIR, user_id)
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


async def list_sources(user_id: str) -> list[dict]:
    from crud.notes import find_notes_by_user
    from ingestion.pipeline import user_faiss_dir
    import pickle

    cursor = knowledge_sources.find({"user_id": user_id}).sort("created_at", -1)
    sources = [_serialize(doc) async for doc in cursor]

    notes = await find_notes_by_user(user_id)
    if notes:
        note_chunks = 0
        indexed = False
        last_indexed_at = None
        meta_path = os.path.join(user_faiss_dir(user_id), "metadata.pkl")
        if os.path.isfile(meta_path):
            try:
                with open(meta_path, "rb") as f:
                    metadata = pickle.load(f)
                note_chunks = sum(1 for m in metadata if m.get("source_type") == "note")
                indexed = note_chunks > 0
                if indexed:
                    last_indexed_at = datetime.fromtimestamp(
                        os.path.getmtime(meta_path), tz=timezone.utc
                    )
            except Exception:
                pass

        sources.insert(
            0,
            {
                "id": "notes",
                "name": "My Notes",
                "file_name": f"My Notes ({len(notes)})",
                "type": "notes",
                "file_size": sum(len(n.get("content") or "") for n in notes),
                "status": "indexed" if indexed else "pending",
                "chunks_count": note_chunks,
                "auto_sync": False,
                "last_indexed_at": _to_iso_utc(last_indexed_at) if indexed else None,
                "created_at": None,
            },
        )

    return sources


async def delete_source(user_id: str, source_id: str) -> bool:
    if source_id == "notes":
        return False

    try:
        oid = ObjectId(source_id)
    except Exception:
        return False

    doc = await knowledge_sources.find_one({"_id": oid, "user_id": user_id})
    if not doc:
        return False

    file_path = doc.get("file_path")
    candidates = []
    if file_path:
        candidates.append(file_path)
        parts = Path(file_path).parts
        if len(parts) >= 2:
            candidates.append(os.path.join(STORAGE_DIR, parts[-2], parts[-1]))
    # Also try by filename under user folder
    user_id_path = os.path.join(STORAGE_DIR, user_id, doc.get("file_name") or "")
    candidates.append(user_id_path)

    for candidate in candidates:
        if candidate and os.path.isfile(candidate):
            try:
                os.remove(candidate)
            except OSError:
                pass
            break

    await knowledge_sources.delete_one({"_id": oid, "user_id": user_id})
    return True
