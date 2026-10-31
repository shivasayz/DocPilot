"""Attach paragraph ids to a golden file using the user's indexed chunks.

    python -m eval.label_chunks --user-id <id> --dataset eval/golden.json

The paragraph is chosen by word overlap inside the labeled file, not by the
FAISS ranking, so the eval can still measure whether search finds that paragraph.
"""

from __future__ import annotations

import argparse
import json
import os
import pickle
import re
from pathlib import Path

from ingestion.chunk_ids import chunk_id_from_metadata

STOP = {
    "a", "an", "the", "of", "and", "or", "to", "in", "on", "for", "is", "are",
    "was", "were", "what", "which", "who", "how", "why", "when", "does", "do",
    "did", "with", "from", "that", "this", "those", "these", "be", "by", "as",
    "at", "it", "its", "about", "into", "their", "them", "his", "her",
}


def load_metadata(user_id: str) -> list[dict]:
    from eval.run import resolve_faiss_dir

    path = os.path.join(resolve_faiss_dir(user_id), "metadata.pkl")
    with open(path, "rb") as handle:
        return pickle.load(handle)


def label_dataset(payload: dict, metadata: list[dict]) -> dict:
    for case in payload.get("cases", []):
        if case.get("kind", "answerable") != "answerable":
            continue
        facts = []
        for label in case.get("relevant", []):
            chosen = _best_chunk(case.get("query", ""), label, metadata)
            if not chosen:
                continue
            passage = _passage(case.get("query", ""), chosen.get("text") or "")
            label["chunk_id"] = chunk_id_from_metadata(chosen)
            label["passage"] = passage
            if passage:
                facts.append(passage)
        if facts and not case.get("expected_facts"):
            case["expected_facts"] = facts
    return payload


def _best_chunk(query: str, label: dict, metadata: list[dict]) -> dict | None:
    file_name = label.get("file_name")
    note_id = label.get("note_id")
    candidates = []
    for item in metadata:
        if file_name and item.get("file_name") == file_name and not item.get("note_id"):
            candidates.append(item)
        elif note_id and str(item.get("note_id")) == str(note_id):
            candidates.append(item)
    if not candidates:
        return None
    wanted = _tokens(query)
    return max(candidates, key=lambda item: len(wanted & _tokens(item.get("text") or "")))


def _passage(query: str, text: str) -> str:
    wanted = _tokens(query)
    sentences = [part.strip() for part in re.split(r"(?<=[.?!])\s+", text) if part.strip()]
    if not sentences:
        return text[:180].strip()
    best = max(sentences, key=lambda sentence: len(wanted & _tokens(sentence)))
    return best[:240].strip()


def _tokens(text: str) -> set[str]:
    return {token for token in re.findall(r"[a-z0-9']+", text.lower()) if token not in STOP and len(token) > 2}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Label golden questions with indexed paragraph ids.")
    parser.add_argument("--user-id", required=True)
    parser.add_argument("--dataset", required=True)
    args = parser.parse_args(argv)
    dataset_path = Path(args.dataset)
    try:
        payload = json.loads(dataset_path.read_text(encoding="utf-8"))
        labeled = label_dataset(payload, load_metadata(args.user_id))
    except (FileNotFoundError, json.JSONDecodeError, OSError) as exc:
        print(exc)
        return 1
    dataset_path.write_text(json.dumps(labeled, indent=2) + "\n", encoding="utf-8")
    labeled_cases = sum(1 for case in labeled["cases"] if any(item.get("chunk_id") for item in case.get("relevant", [])))
    print(f"labeled {labeled_cases} cases in {dataset_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
