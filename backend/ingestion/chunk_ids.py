"""Stable ids for retrieved paragraphs.

FAISS row numbers change every ingest. The id is a hash of the source plus the
chunk text, so the same paragraph keeps the same id after a rebuild.
"""

from __future__ import annotations

import hashlib


def make_chunk_id(source: str, text: str) -> str:
    payload = f"{source}\n{text}".encode()
    return hashlib.sha1(payload).hexdigest()[:16]


def chunk_id_from_metadata(metadata: dict | None) -> str | None:
    if not metadata:
        return None
    existing = metadata.get("chunk_id")
    if existing:
        return str(existing)
    text = metadata.get("text") or ""
    if not text:
        return None
    source = str(metadata.get("note_id") or metadata.get("file_name") or metadata.get("source") or "")
    return make_chunk_id(source, text)
