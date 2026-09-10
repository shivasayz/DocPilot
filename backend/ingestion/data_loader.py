"""Load user documents with LangChain loaders (same pattern as RAG-Tutorials)."""

from __future__ import annotations

from pathlib import Path
from typing import Any, List

from langchain_community.document_loaders import (
    CSVLoader,
    Docx2txtLoader,
    JSONLoader,
    PyPDFLoader,
    TextLoader,
)
from langchain_core.documents import Document

from openpyxl import load_workbook


SKIP_DIR_NAMES = {"faiss_store", "__pycache__"}


def _load_excel_with_openpyxl(file_path: Path) -> List[Document]:
    workbook = load_workbook(str(file_path), read_only=True, data_only=True)
    docs: List[Document] = []
    for sheet in workbook.worksheets:
        rows = []
        for row in sheet.iter_rows(values_only=True):
            cells = ["" if cell is None else str(cell) for cell in row]
            if any(cells):
                rows.append(" | ".join(cells))
        if not rows:
            continue
        docs.append(
            Document(
                page_content="\n".join(rows),
                metadata={
                    "source": str(file_path),
                    "file_name": file_path.name,
                    "sheet": sheet.title,
                    "source_type": "file",
                },
            )
        )
    return docs


def notes_to_documents(notes: list[dict]) -> List[Document]:
    """Convert Mongo notes into LangChain Documents for chunking/embedding."""
    documents: List[Document] = []
    for note in notes:
        title = (note.get("title") or "Untitled").strip()
        content = (note.get("content") or "").strip()
        if not content and not title:
            continue
        note_id = note.get("id") or str(note.get("_id") or "")
        label = f"Note: {title}"
        page = f"# {title}\n\n{content}".strip()
        documents.append(
            Document(
                page_content=page,
                metadata={
                    "source": f"note:{note_id}",
                    "file_name": label,
                    "source_type": "note",
                    "note_id": note_id,
                    "note_title": title,
                },
            )
        )
    print(f"[INFO] Loaded {len(documents)} notes as documents")
    return documents


def load_single_document(file_path: str) -> List[Document]:
    """Load one file path into LangChain Documents."""
    path = Path(file_path)
    if not path.is_file():
        print(f"[ERROR] File not found: {file_path}")
        return []

    lower = path.name.lower()

    def _tag(docs: list) -> list:
        for d in docs:
            d.metadata["source"] = str(path)
            d.metadata["file_name"] = path.name
            d.metadata["source_type"] = "file"
        return docs

    try:
        if lower.endswith(".pdf"):
            return _tag(PyPDFLoader(str(path)).load())
        if lower.endswith(".txt") or lower.endswith(".md"):
            return _tag(TextLoader(str(path), encoding="utf-8").load())
        if lower.endswith(".csv"):
            return _tag(CSVLoader(str(path)).load())
        if lower.endswith(".xlsx"):
            return _load_excel_with_openpyxl(path)
        if lower.endswith(".docx"):
            return _tag(Docx2txtLoader(str(path)).load())
        if lower.endswith(".json"):
            return _tag(JSONLoader(str(path), jq_schema=".", text_content=False).load())
        print(f"[WARN] Unsupported file type skipped: {path.name}")
        return []
    except Exception as e:
        print(f"[ERROR] Failed to load {path}: {e}")
        return []


def load_documents_for_paths(file_paths: list[str]) -> List[Document]:
    """Load only the given registered file paths (not everything on disk)."""
    documents: List[Document] = []
    seen: set[str] = set()
    for fp in file_paths:
        key = str(Path(fp).resolve()) if Path(fp).exists() else fp
        if key in seen:
            continue
        seen.add(key)
        documents.extend(load_single_document(fp))
    print(f"[INFO] Loaded {len(documents)} LangChain docs from {len(seen)} registered files")
    return documents


def load_all_documents(data_dir: str) -> List[Any]:
    """
    Load all supported files from the data directory into LangChain Documents.
    Supported: PDF, TXT, MD, CSV, Excel, Word, JSON
    """
    data_path = Path(data_dir).resolve()
    if not data_path.is_dir():
        return []

    paths: list[str] = []
    for path in data_path.rglob("*"):
        if not path.is_file():
            continue
        if any(part in SKIP_DIR_NAMES for part in path.parts):
            continue
        paths.append(str(path))
    return load_documents_for_paths(paths)
