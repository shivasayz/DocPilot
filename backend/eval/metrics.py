"""Retrieval metrics over a ranked list of chunk metadata.

A source is ``("file", file_name)`` or ``("note", note_id)``. Notes match on
``note_id`` only. Duplicate chunks of the same source count once.
"""

from __future__ import annotations

from ingestion.chunk_ids import chunk_id_from_metadata

SourceKey = tuple[str, str]


def relevant_keys(labels: list[dict]) -> list[SourceKey]:
    keys: list[SourceKey] = []
    for label in labels:
        note_id = label.get("note_id")
        file_name = label.get("file_name")
        if note_id:
            key: SourceKey = ("note", str(note_id))
        elif file_name:
            key = ("file", str(file_name))
        else:
            raise ValueError("relevant item needs file_name or note_id")
        if key not in keys:
            keys.append(key)
    return keys


def chunk_key(metadata: dict | None) -> SourceKey | None:
    if not metadata:
        return None
    note_id = metadata.get("note_id")
    if note_id:
        return ("note", str(note_id))
    file_name = metadata.get("file_name")
    if file_name:
        return ("file", str(file_name))
    return None


def matched_sources(ranked_metadata: list[dict | None], relevant: list[SourceKey], k: int) -> list[SourceKey]:
    found: list[SourceKey] = []
    wanted = set(relevant)
    for metadata in ranked_metadata[:k]:
        key = chunk_key(metadata)
        if key and key in wanted and key not in found:
            found.append(key)
    return found


def recall_at_k(ranked_metadata: list[dict | None], relevant: list[SourceKey], k: int) -> float:
    if not relevant or k <= 0:
        return 0.0
    return len(matched_sources(ranked_metadata, relevant, k)) / len(relevant)


def hit_at_k(ranked_metadata: list[dict | None], relevant: list[SourceKey], k: int) -> float:
    if k <= 0:
        return 0.0
    return 1.0 if matched_sources(ranked_metadata, relevant, k) else 0.0


def precision_at_k(ranked_metadata: list[dict | None], relevant: list[SourceKey], k: int) -> float:
    if k <= 0:
        return 0.0
    return len(matched_sources(ranked_metadata, relevant, k)) / k


def f1_at_k(ranked_metadata: list[dict | None], relevant: list[SourceKey], k: int) -> float:
    precision = precision_at_k(ranked_metadata, relevant, k)
    recall = recall_at_k(ranked_metadata, relevant, k)
    if precision + recall == 0:
        return 0.0
    return 2 * precision * recall / (precision + recall)


def mrr_at_k(ranked_metadata: list[dict | None], relevant: list[SourceKey], k: int) -> float:
    if k <= 0:
        return 0.0
    wanted = set(relevant)
    for rank, metadata in enumerate(ranked_metadata[:k], start=1):
        key = chunk_key(metadata)
        if key and key in wanted:
            return 1.0 / rank
    return 0.0


def score_at_k(ranked_metadata: list[dict | None], relevant: list[SourceKey], k: int) -> dict[str, float]:
    return {
        "recall": recall_at_k(ranked_metadata, relevant, k),
        "hit": hit_at_k(ranked_metadata, relevant, k),
        "precision": precision_at_k(ranked_metadata, relevant, k),
        "f1": f1_at_k(ranked_metadata, relevant, k),
        "mrr": mrr_at_k(ranked_metadata, relevant, k),
    }


def _passage_in_text(passage: str, text: str) -> bool:
    return bool(passage) and passage.casefold() in text.casefold()


def chunk_matches_label(metadata: dict | None, label: dict) -> bool:
    """A paragraph matches when its id or its text matches the golden label."""
    if not metadata:
        return False
    wanted_id = label.get("chunk_id")
    passage = (label.get("passage") or "").strip()
    if not wanted_id and not passage:
        return False
    if wanted_id and chunk_id_from_metadata(metadata) == wanted_id:
        return True
    return _passage_in_text(passage, metadata.get("text") or "")


def matched_paragraphs(ranked_metadata: list[dict | None], labels: list[dict], k: int) -> list[int]:
    found: list[int] = []
    for position, metadata in enumerate(ranked_metadata[:k]):
        if any(chunk_matches_label(metadata, label) for label in labels):
            found.append(position)
    return found


def paragraph_recall_at_k(ranked_metadata: list[dict | None], labels: list[dict], k: int) -> float:
    labeled = [label for label in labels if label.get("chunk_id") or (label.get("passage") or "").strip()]
    if not labeled or k <= 0:
        return 0.0
    found = 0
    for label in labeled:
        if any(chunk_matches_label(metadata, label) for metadata in ranked_metadata[:k]):
            found += 1
    return found / len(labeled)


def paragraph_hit_at_k(ranked_metadata: list[dict | None], labels: list[dict], k: int) -> float:
    if k <= 0:
        return 0.0
    return 1.0 if matched_paragraphs(ranked_metadata, labels, k) else 0.0


def paragraph_precision_at_k(ranked_metadata: list[dict | None], labels: list[dict], k: int) -> float:
    if k <= 0:
        return 0.0
    return len(matched_paragraphs(ranked_metadata, labels, k)) / k


def paragraph_mrr_at_k(ranked_metadata: list[dict | None], labels: list[dict], k: int) -> float:
    if k <= 0:
        return 0.0
    for rank, metadata in enumerate(ranked_metadata[:k], start=1):
        if any(chunk_matches_label(metadata, label) for label in labels):
            return 1.0 / rank
    return 0.0


def score_paragraphs_at_k(ranked_metadata: list[dict | None], labels: list[dict], k: int) -> dict[str, float]:
    precision = paragraph_precision_at_k(ranked_metadata, labels, k)
    recall = paragraph_recall_at_k(ranked_metadata, labels, k)
    f1 = 0.0 if precision + recall == 0 else 2 * precision * recall / (precision + recall)
    return {
        "recall": recall,
        "hit": paragraph_hit_at_k(ranked_metadata, labels, k),
        "precision": precision,
        "f1": f1,
        "mrr": paragraph_mrr_at_k(ranked_metadata, labels, k),
    }
