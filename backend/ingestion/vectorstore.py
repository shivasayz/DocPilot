"""FAISS vector store (RAG-Tutorials FaissVectorStore), one store per user."""

from __future__ import annotations

import os
import pickle
import time
from typing import Any, List

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

from ingestion.chunk_ids import make_chunk_id
from ingestion.embedding import EmbeddingPipeline


class FaissVectorStore:
    def __init__(
        self,
        persist_dir: str,
        embedding_model: str = "all-MiniLM-L6-v2",
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
    ):
        self.persist_dir = persist_dir
        os.makedirs(self.persist_dir, exist_ok=True)
        self.index = None
        self.metadata: List[Any] = []
        self.embedding_model = embedding_model
        self.model = SentenceTransformer(embedding_model)
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        print(f"[INFO] Loaded embedding model: {embedding_model}")

    def build_from_documents(self, documents: List[Any]):
        """Rebuild index from scratch (best with IndexFlatL2 — no delete API)."""
        print(f"[INFO] Building vector store from {len(documents)} raw documents...")
        emb_pipe = EmbeddingPipeline(
            model_name=self.embedding_model,
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
        )
        chunks = emb_pipe.chunk_documents(documents)
        embeddings = emb_pipe.embed_chunks(chunks)
        metadatas = []
        for chunk in chunks:
            file_name = chunk.metadata.get("file_name") or os.path.basename(chunk.metadata.get("source") or "")
            note_id = chunk.metadata.get("note_id")
            text = chunk.page_content
            source_key = str(note_id or file_name or chunk.metadata.get("source") or "")
            metadatas.append(
                {
                    "text": text,
                    "source": chunk.metadata.get("source"),
                    "file_name": file_name,
                    "source_type": chunk.metadata.get("source_type", "file"),
                    "note_id": note_id,
                    "note_title": chunk.metadata.get("note_title"),
                    "chunk_id": make_chunk_id(source_key, text),
                }
            )
        self.index = None
        self.metadata = []
        self.add_embeddings(np.array(embeddings).astype("float32"), metadatas)
        self.save()
        print(f"[INFO] Vector store built and saved to {self.persist_dir}")
        return len(chunks)

    def add_embeddings(self, embeddings: np.ndarray, metadatas: List[Any] = None):
        dim = embeddings.shape[1]
        if self.index is None:
            self.index = faiss.IndexFlatL2(dim)
        self.index.add(embeddings)
        if metadatas:
            self.metadata.extend(metadatas)
        print(f"[INFO] Added {embeddings.shape[0]} vectors to Faiss index.")

    def save(self):
        faiss_path = os.path.join(self.persist_dir, "faiss.index")
        meta_path = os.path.join(self.persist_dir, "metadata.pkl")
        faiss.write_index(self.index, faiss_path)
        with open(meta_path, "wb") as f:
            pickle.dump(self.metadata, f)
        print(f"[INFO] Saved Faiss index and metadata to {self.persist_dir}")

    def load(self):
        faiss_path = os.path.join(self.persist_dir, "faiss.index")
        meta_path = os.path.join(self.persist_dir, "metadata.pkl")
        self.index = faiss.read_index(faiss_path)
        with open(meta_path, "rb") as f:
            self.metadata = pickle.load(f)
        print(f"[INFO] Loaded Faiss index and metadata from {self.persist_dir}")

    def search(self, query_embedding: np.ndarray, top_k: int = 5):
        D, I = self.index.search(query_embedding, top_k)
        results = []
        for idx, dist in zip(I[0], D[0]):
            index = int(idx)
            meta = self.metadata[index] if 0 <= index < len(self.metadata) else None
            results.append({"index": index, "distance": float(dist), "metadata": meta})
        return results

    def query(self, query_text: str, top_k: int = 5):
        results, _timing = self.query_timed(query_text, top_k=top_k)
        return results

    def query_timed(self, query_text: str, top_k: int = 5):
        print(f"[INFO] Querying vector store for: '{query_text}'")
        started = time.perf_counter()
        query_emb = self.model.encode([query_text]).astype("float32")
        embed_ms = (time.perf_counter() - started) * 1000
        started = time.perf_counter()
        results = self.search(query_emb, top_k=top_k)
        search_ms = (time.perf_counter() - started) * 1000
        return results, {"embed_ms": embed_ms, "search_ms": search_ms, "retrieval_ms": embed_ms + search_ms}
