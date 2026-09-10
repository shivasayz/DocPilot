"""Orchestrate per-user ingestion: load registered files + notes → FAISS rebuild."""

from __future__ import annotations

import os
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from db.connection import db
from crud.notes import find_notes_by_user
from ingestion.data_loader import SKIP_DIR_NAMES, load_documents_for_paths, notes_to_documents
from ingestion.vectorstore import FaissVectorStore

STORAGE_DIR = "storage"
knowledge_sources = db["knowledge_sources"]


def user_data_dir(user_id: str) -> str:
    return os.path.join(STORAGE_DIR, user_id)


def user_faiss_dir(user_id: str) -> str:
    return os.path.join(user_data_dir(user_id), "faiss_store")


def _resolve_path(file_path: str | None) -> str | None:
    if not file_path:
        return None
    if os.path.isfile(file_path):
        return os.path.abspath(file_path)
    # Fallback if server cwd differs from upload time
    parts = Path(file_path).parts
    if len(parts) >= 2:
        alt = os.path.join(STORAGE_DIR, parts[-2], parts[-1])
        if os.path.isfile(alt):
            return os.path.abspath(alt)
    return None


def _prune_orphan_files(user_id: str, keep_paths: set[str]) -> int:
    """Remove files on disk that are no longer in knowledge_sources."""
    data_dir = user_data_dir(user_id)
    if not os.path.isdir(data_dir):
        return 0
    removed = 0
    keep_resolved = {os.path.abspath(p) for p in keep_paths}
    for root, dirs, files in os.walk(data_dir):
        dirs[:] = [d for d in dirs if d not in SKIP_DIR_NAMES]
        if any(part in SKIP_DIR_NAMES for part in Path(root).parts):
            continue
        for name in files:
            full = os.path.abspath(os.path.join(root, name))
            if full not in keep_resolved:
                try:
                    os.remove(full)
                    removed += 1
                    print(f"[INFO] Removed orphan file: {full}")
                except OSError as e:
                    print(f"[WARN] Could not remove orphan {full}: {e}")
    return removed


async def ingest_user_documents(user_id: str) -> dict:
    """
    Rebuild this user's FAISS index from:
      - files still registered in knowledge_sources (not every file on disk)
      - all notes for that user in MongoDB
    """
    data_dir = user_data_dir(user_id)
    os.makedirs(data_dir, exist_ok=True)

    source_docs = []
    cursor = knowledge_sources.find({"user_id": user_id})
    async for doc in cursor:
        source_docs.append(doc)

    keep_paths: set[str] = set()
    path_list: list[str] = []
    for doc in source_docs:
        resolved = _resolve_path(doc.get("file_path"))
        if resolved:
            keep_paths.add(resolved)
            path_list.append(resolved)
        else:
            print(
                f"[WARN] Missing file for source {doc.get('file_name')}: {doc.get('file_path')}"
            )

    orphans_removed = _prune_orphan_files(user_id, keep_paths)

    file_docs = load_documents_for_paths(path_list)
    notes = await find_notes_by_user(user_id)
    note_docs = notes_to_documents(notes)
    documents = [*file_docs, *note_docs]

    if not documents:
        raise ValueError("No documents or notes found to ingest")

    store = FaissVectorStore(persist_dir=user_faiss_dir(user_id))
    total_chunks = store.build_from_documents(documents)

    counts = Counter(
        m.get("file_name") or os.path.basename(m.get("source") or "")
        for m in store.metadata
        if m.get("source") and m.get("source_type") != "note"
    )
    note_chunks = sum(1 for m in store.metadata if m.get("source_type") == "note")

    now = datetime.now(timezone.utc)
    updated = 0
    for doc in source_docs:
        file_name = doc.get("file_name") or ""
        chunks_count = counts.get(file_name, 0)
        await knowledge_sources.update_one(
            {"_id": doc["_id"]},
            {
                "$set": {
                    "status": "indexed" if chunks_count else "pending",
                    "chunks_count": chunks_count,
                    "last_indexed_at": now if chunks_count else None,
                    "updated_at": now,
                }
            },
        )
        updated += 1

    return {
        "user_id": user_id,
        "documents_loaded": len({os.path.abspath(p) for p in path_list}),
        "notes_loaded": len(note_docs),
        "chunks_count": total_chunks,
        "note_chunks": note_chunks,
        "orphans_removed": orphans_removed,
        "sources_updated": updated,
        "faiss_dir": user_faiss_dir(user_id),
        "status": "indexed",
    }
