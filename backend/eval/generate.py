"""Ask Groq with the retrieved context, then score the answer.

correctness: expected facts show up in the answer.
faithfulness: the answer stays inside the retrieved context.
relevance: the answer addresses the question.
"""

from __future__ import annotations

import json
import re
import time

from langchain_groq import ChatGroq

from env import GROQ_API_KEY, GROQ_MODEL

JUDGE_PROMPT = """You score a retrieval-augmented answer. Return JSON only, with no markdown.
Keys:
- correctness: 1 if the expected facts are covered, 0.5 if only some are, 0 if they are missing
- faithfulness: 1 if every claim is supported by the context, 0.5 if a minor claim is not, 0 if the answer invents facts
- relevance: 1 if the answer addresses the question, 0.5 if it is only partly about the question, 0 if it does not
- abstained: true if the answer says the knowledge base does not contain the answer

Expected facts:
{facts}

Question:
{query}

Context:
{context}

Answer:
{answer}
"""


def _context(hits: list[dict], limit: int = 12000) -> str:
    blocks = []
    used = 0
    for item in hits:
        metadata = item.get("metadata") or {}
        text = metadata.get("text") or ""
        if not text:
            continue
        label = metadata.get("file_name") or metadata.get("source") or "Unknown source"
        block = f"[Source: {label}]\n{text}"
        if used + len(block) > limit:
            break
        blocks.append(block)
        used += len(block)
    return "\n\n---\n\n".join(blocks)


def _json_object(text: str) -> dict:
    raw = text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1]
        raw = raw.rsplit("```", 1)[0]
    start = raw.find("{")
    end = raw.rfind("}")
    if start < 0 or end < start:
        raise ValueError("Judge did not return JSON")
    return json.loads(raw[start : end + 1])


def fact_recall(answer: str, facts: list[str]) -> float | None:
    cleaned = [fact.strip() for fact in facts if fact and fact.strip()]
    if not cleaned:
        return None
    haystack = answer.casefold()
    found = sum(1 for fact in cleaned if fact.casefold() in haystack)
    return found / len(cleaned)


def _abstained(answer: str) -> bool:
    text = answer.casefold()
    markers = (
        "could not find",
        "couldn't find",
        "not in the knowledge",
        "not in your knowledge",
        "do not contain",
        "does not contain",
        "no information",
    )
    return any(marker in text for marker in markers)


class GenerationEvaluator:
    def __init__(self, model: str = GROQ_MODEL):
        if not GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is not set in env.py")
        self.llm = ChatGroq(api_key=GROQ_API_KEY, model=model)

    def _invoke(self, prompt: str) -> str:
        for _attempt in range(6):
            try:
                return self.llm.invoke(prompt).content
            except Exception as exc:
                message = str(exc)
                if "429" not in message and "rate_limit" not in message:
                    raise
                match = re.search(r"try again in ([0-9.]+)s", message)
                time.sleep(float(match.group(1)) + 1 if match else 10)
        raise RuntimeError("Groq rate limit persisted")

    def evaluate(self, query: str, hits: list[dict], facts: list[str], kind: str) -> dict:
        context = _context(hits)
        started = time.perf_counter()
        if not context:
            answer = (
                "I couldn't find anything relevant in your knowledge base "
                "(documents or notes)."
            )
        else:
            prompt = (
                "Answer the question using only the knowledge context. "
                "If the context does not contain the answer, say so.\n\n"
                f"Knowledge Context:\n{context}\n\nQuestion:\n{query}"
            )
            answer = self._invoke(prompt)
        generation_ms = (time.perf_counter() - started) * 1000

        started = time.perf_counter()
        judge_error = None
        try:
            judged = _json_object(
                self._invoke(
                    JUDGE_PROMPT.format(
                        facts="\n".join(f"- {fact}" for fact in facts) or "(none)",
                        query=query,
                        context=context or "(empty)",
                        answer=answer,
                    )
                ).content
            )
        except (ValueError, json.JSONDecodeError, TypeError) as exc:
            judged = {}
            judge_error = str(exc)
        judge_ms = (time.perf_counter() - started) * 1000

        abstained = bool(judged.get("abstained")) or _abstained(str(answer))
        scores = {
            "correctness": _unit(judged.get("correctness")),
            "faithfulness": _unit(judged.get("faithfulness")),
            "relevance": _unit(judged.get("relevance")),
            "abstained": abstained,
            "fact_recall": fact_recall(str(answer), facts),
        }
        if kind in {"unanswerable", "other_user"}:
            scores["correctness"] = 1.0 if abstained else 0.0
        return {
            "answer": answer,
            "context_chars": len(context),
            "generation_ms": generation_ms,
            "judge_ms": judge_ms,
            "judge_error": judge_error,
            "scores": scores,
        }


def _unit(value) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return min(1.0, max(0.0, number))
