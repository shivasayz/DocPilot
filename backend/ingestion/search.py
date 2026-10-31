"""RAG search over a user's FAISS store + Groq LLM (RAG-Tutorials search.py)."""

from __future__ import annotations

import os

from env import EMBEDDING_MODEL, GROQ_API_KEY, GROQ_MODEL

SYSTEM_PROMPT = """You are DocPilot, a retrieval-augmented assistant.

Hard rules:
1. Answer ONLY using the provided Knowledge Context (uploaded documents and user notes).
2. If the context does not contain enough information, say clearly that you could not find it in the knowledge base. Do NOT invent facts.
3. Prefer concise, well-structured markdown answers. Cite source names when helpful (e.g. file name or "Note: …").
4. Exception — only if the user EXPLICITLY asks for general knowledge, opinions, or something outside their library (e.g. "ignore my docs", "in general", "from your own knowledge"), you may answer beyond the context. Otherwise stay inside the knowledge base.
5. If the query is a greeting or meta question about how you work, briefly explain that you answer from their indexed sources and notes.
6. When the context includes several sources, cover each one. Do not leave a provided source out of the answer.
"""


def is_library_summary(query: str) -> bool:
    """True when the question asks for a summary of the whole library, not one fact."""
    text = " ".join(query.lower().split())
    if not any(word in text for word in ("summarize", "summarise", "summary", "overview")):
        return False
    cues = (
        "document",
        "upload",
        "file",
        "library",
        "source",
        "everything",
        "all my",
        "knowledge",
        "notes",
    )
    return any(cue in text for cue in cues)


def cover_sources(
    ranked_results: list[dict],
    max_per_source: int = 2,
    max_chars: int = 14000,
) -> list[dict]:
    """Keep the closest chunk from every source, then extra chunks within a size budget."""
    first: list[dict] = []
    extra: list[dict] = []
    seen: set[str] = set()
    for result in ranked_results:
        meta = result.get("metadata") or {}
        label = meta.get("file_name") or meta.get("source")
        text = meta.get("text") or ""
        if not label or not text:
            continue
        if label not in seen:
            seen.add(label)
            first.append(result)
        else:
            extra.append(result)

    picked = list(first)
    counts = {((item.get("metadata") or {}).get("file_name") or (item.get("metadata") or {}).get("source")): 1 for item in first}
    used = sum(len((item.get("metadata") or {}).get("text") or "") for item in first)
    for result in extra:
        meta = result.get("metadata") or {}
        label = meta.get("file_name") or meta.get("source")
        text = meta.get("text") or ""
        if counts.get(label, 0) >= max_per_source:
            continue
        if used + len(text) > max_chars:
            continue
        picked.append(result)
        counts[label] = counts.get(label, 0) + 1
        used += len(text)
    return picked


class RAGSearch:
    def __init__(
        self,
        user_id: str,
        embedding_model: str = EMBEDDING_MODEL,
        llm_model: str = GROQ_MODEL,
    ):
        from langchain_groq import ChatGroq

        from ingestion.pipeline import user_faiss_dir
        from ingestion.vectorstore import FaissVectorStore

        if not GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is not set in env.py")

        persist_dir = user_faiss_dir(user_id)
        faiss_path = os.path.join(persist_dir, "faiss.index")
        meta_path = os.path.join(persist_dir, "metadata.pkl")

        self.vectorstore = FaissVectorStore(persist_dir, embedding_model)

        if not (os.path.exists(faiss_path) and os.path.exists(meta_path)):
            raise FileNotFoundError(
                f"No FAISS index for this user. Call POST /knowledge-source/ingest first. "
                f"Expected: {persist_dir}"
            )

        self.vectorstore.load()
        self.llm = ChatGroq(api_key=GROQ_API_KEY, model=llm_model)
        print(f"[INFO] Groq LLM initialized: {llm_model}")

    def search_and_summarize(self, query: str, top_k: int = 5) -> dict:
        fetch_k = top_k
        if is_library_summary(query) and self.vectorstore.index is not None:
            fetch_k = max(top_k, int(self.vectorstore.index.ntotal))
        results = self.vectorstore.query(query, top_k=fetch_k)
        if is_library_summary(query):
            results = cover_sources(results)
        texts = [r["metadata"].get("text", "") for r in results if r.get("metadata")]
        sources = [
            r["metadata"].get("file_name")
            for r in results
            if r.get("metadata") and r["metadata"].get("file_name")
        ]
        context_blocks = []
        for r in results:
            meta = r.get("metadata") or {}
            label = meta.get("file_name") or meta.get("source") or "Unknown source"
            text = meta.get("text") or ""
            if text:
                context_blocks.append(f"[Source: {label}]\n{text}")

        context = "\n\n---\n\n".join(context_blocks)
        if not context:
            return {
                "query": query,
                "answer": (
                    "I couldn't find anything relevant in your knowledge base "
                    "(documents or notes). Upload/index sources, or ask me to "
                    "answer from general knowledge explicitly."
                ),
                "sources": [],
                "chunks_used": 0,
            }

        prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"Knowledge Context:\n{context}\n\n"
            f"User question:\n{query}\n\n"
            f"Answer (from knowledge context unless the user explicitly asked otherwise):"
        )
        response = self.llm.invoke(prompt)
        return {
            "query": query,
            "answer": response.content,
            "sources": sorted(set(s for s in sources if s)),
            "chunks_used": len(texts),
        }


def search_user_documents(user_id: str, query: str, top_k: int = 5) -> dict:
    from ingestion.pipeline import user_faiss_dir

    persist_dir = user_faiss_dir(user_id)
    faiss_path = os.path.join(persist_dir, "faiss.index")
    if not os.path.exists(faiss_path):
        raise FileNotFoundError(
            "No FAISS index found. Index your documents and notes via "
            "POST /knowledge-source/ingest first."
        )
    rag = RAGSearch(user_id=user_id)
    return rag.search_and_summarize(query, top_k=top_k)
