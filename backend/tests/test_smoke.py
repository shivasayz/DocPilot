"""Lightweight smoke tests for CI — no Mongo, no embeddings."""

from eval.metrics import relevant_keys, score_at_k
from main import get_health


def test_health_payload():
    assert get_health() == {"message": "Server is running"}


def test_recall_and_hit_at_k():
    ranked = [{"file_name": "a.pdf"}, {"file_name": "b.pdf"}, {"file_name": "c.pdf"}]
    relevant = relevant_keys([{"file_name": "a.pdf"}])
    scores = score_at_k(ranked, relevant, k=3)
    assert scores["hit"] == 1.0
    assert scores["recall"] == 1.0
    assert scores["precision"] > 0
