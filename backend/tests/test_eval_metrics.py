"""Retrieval metrics and golden-set scoring, with no embedding model."""

import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from eval.compare import compare_reports
from eval.dataset import load_dataset
from eval.generate import fact_recall
from ingestion.search import cover_sources, is_library_summary
from eval.metrics import score_at_k, score_paragraphs_at_k
from eval.run import evaluate, usable_hits, write_report

EXAMPLE = Path(__file__).resolve().parents[1] / "eval" / "golden.example.json"


def test_example_dataset_uses_indexed_file_names():
    dataset = load_dataset(EXAMPLE)
    names = {
        item.file_name
        for case in dataset.cases
        for item in case.relevant
        if item.file_name
    }
    assert "varanaasi.txt" in names
    assert "PCPD UNIT I NOTES-KINGSTON J.pdf" in names
    assert all(case.relevant for case in dataset.cases)


def test_dataset_rejects_a_label_with_both_identities(tmp_path):
    path = tmp_path / "bad.json"
    path.write_text(
        json.dumps(
            {
                "cases": [
                    {
                        "id": "both",
                        "query": "Where is the policy?",
                        "relevant": [{"file_name": "policy.pdf", "note_id": "n1"}],
                    }
                ]
            }
        ),
        encoding="utf-8",
    )
    with pytest.raises(ValidationError):
        load_dataset(path)


def test_perfect_top_hit():
    ranked = [{"file_name": "policy.pdf", "source_type": "file"}]
    relevant = [("file", "policy.pdf")]
    scores = score_at_k(ranked, relevant, 1)
    assert scores == {"recall": 1.0, "hit": 1.0, "precision": 1.0, "f1": 1.0, "mrr": 1.0}


def test_relevant_source_at_rank_two():
    ranked = [
        {"file_name": "other.pdf"},
        {"file_name": "policy.pdf"},
    ]
    relevant = [("file", "policy.pdf"), ("file", "handbook.pdf")]
    at_one = score_at_k(ranked, relevant, 1)
    assert at_one["recall"] == 0.0
    assert at_one["hit"] == 0.0
    assert at_one["precision"] == 0.0
    assert at_one["mrr"] == 0.0

    at_five = score_at_k(ranked, relevant, 5)
    assert at_five["recall"] == 0.5
    assert at_five["hit"] == 1.0
    assert at_five["precision"] == 1 / 5
    assert at_five["mrr"] == 0.5


def test_duplicate_chunks_count_once():
    ranked = [
        {"file_name": "policy.pdf"},
        {"file_name": "policy.pdf"},
        {"file_name": "other.pdf"},
    ]
    relevant = [("file", "policy.pdf")]
    scores = score_at_k(ranked, relevant, 3)
    assert scores["precision"] == 1 / 3
    assert scores["recall"] == 1.0
    assert scores["mrr"] == 1.0


def test_two_relevant_files_in_top_two():
    ranked = [{"file_name": "pricing.pdf"}, {"file_name": "enterprise-plan.docx"}]
    relevant = [("file", "pricing.pdf"), ("file", "enterprise-plan.docx")]
    scores = score_at_k(ranked, relevant, 2)
    assert scores["precision"] == 1.0
    assert scores["recall"] == 1.0
    assert scores["f1"] == 1.0


def test_empty_retrieval_is_zero():
    scores = score_at_k([], [("file", "policy.pdf")], 5)
    assert scores == {"recall": 0.0, "hit": 0.0, "precision": 0.0, "f1": 0.0, "mrr": 0.0}


def test_note_id_does_not_match_a_different_file_name():
    ranked = [{"file_name": "Note: Hello", "note_id": "n1", "source_type": "note"}]
    assert score_at_k(ranked, [("note", "n1")], 1)["hit"] == 1.0
    assert score_at_k(ranked, [("note", "other")], 1)["hit"] == 0.0
    assert score_at_k(ranked, [("file", "Note: Hello")], 1)["hit"] == 0.0


def test_padding_rows_are_not_hits():
    results = [
        {"index": -1, "distance": 0.0, "metadata": {"file_name": "policy.pdf"}},
        {"index": 0, "distance": 1.2, "metadata": {"file_name": "other.pdf"}},
    ]
    hits = usable_hits(results)
    assert len(hits) == 1
    assert hits[0]["metadata"]["file_name"] == "other.pdf"


def test_evaluate_reports_means_and_recall_at_5_failures(tmp_path):
    from eval.dataset import EvalCase, RelevantSource

    cases = [
        EvalCase(id="hit", query="refund window", relevant=[RelevantSource(file_name="policy.pdf")]),
        EvalCase(id="miss", query="unknown topic", relevant=[RelevantSource(file_name="missing.pdf")]),
    ]

    def retrieve(query, top_k):
        if query == "refund window":
            return [
                {"index": -1, "distance": 0.0, "metadata": {"file_name": "policy.pdf"}},
                {"index": 0, "distance": 0.4, "metadata": {"file_name": "other.pdf", "source_type": "file"}},
                {"index": 1, "distance": 0.8, "metadata": {"file_name": "policy.pdf", "source_type": "file"}},
            ][:top_k]
        return []

    report = evaluate(cases, retrieve)
    assert report["summary"]["queries"] == 2
    assert report["summary"]["zero_result_queries"] == 1
    assert report["summary"]["mean_top1_l2_distance"] == 0.4
    assert report["summary"]["at_k"]["1"]["recall"] == 0.0
    assert report["summary"]["at_k"]["5"]["recall"] == 0.5
    assert report["summary"]["at_k"]["5"]["mrr"] == 0.25
    assert [row["id"] for row in report["failures"]] == ["miss"]

    path = write_report(report, tmp_path)
    saved = json.loads(path.read_text(encoding="utf-8"))
    assert saved["failures"][0]["recall_at_5"] == 0.0


def test_library_summary_detects_the_chat_prompt():
    assert is_library_summary("Summarize my uploaded documents")
    assert not is_library_summary("Who is directing the film Varanasi?")


def test_paragraph_score_ignores_the_wrong_section_of_the_same_file():
    ranked = [
        {"file_name": "notes.pdf", "text": "SWOT means strengths and weaknesses."},
        {"file_name": "notes.pdf", "text": "Persona literally means a mask."},
    ]
    labels = [{"file_name": "notes.pdf", "chunk_id": "unused", "passage": "literally means a mask"}]
    assert score_at_k(ranked, [("file", "notes.pdf")], 1)["hit"] == 1.0
    paragraphs = score_paragraphs_at_k(ranked, labels, 1)
    assert paragraphs["hit"] == 0.0
    assert score_paragraphs_at_k(ranked, labels, 3)["hit"] == 1.0
    assert score_paragraphs_at_k(ranked, labels, 3)["recall"] == 1.0


def test_other_user_file_is_a_forbidden_hit():
    from eval.dataset import EvalCase, RelevantSource

    cases = [
        EvalCase(
            id="invoice",
            query="What is the invoice total?",
            kind="other_user",
            relevant=[],
            forbidden_file_names=["Macbook Invoice .pdf"],
        )
    ]

    def retrieve(query, top_k):
        return [{"index": 0, "distance": 0.2, "metadata": {"file_name": "Macbook Invoice .pdf", "text": "total 10"}}]

    report = evaluate(cases, retrieve)
    assert report["summary"]["forbidden_hits"] == 1
    assert report["failures"][0]["id"] == "invoice"


def test_fact_recall_counts_expected_facts_in_the_answer():
    assert fact_recall("Varanasi opens on April 7, 2027.", ["April 7, 2027", "Keeravani"]) == 0.5


def test_compare_reports_subtracts_baseline_recall():
    baseline = {"summary": {"at_k": {"5": {"recall": 1.0, "hit": 1.0, "precision": 0.2, "f1": 0.3, "mrr": 1.0}}}}
    current = {"summary": {"at_k": {"5": {"recall": 0.8, "hit": 1.0, "precision": 0.2, "f1": 0.3, "mrr": 1.0}}}}
    delta = compare_reports(baseline, current)
    assert delta["file"]["5"]["recall"] == pytest.approx(-0.2)


def test_edge_cases_load():
    dataset = load_dataset(Path(__file__).resolve().parents[1] / "eval" / "golden_edges.json")
    assert {case.kind for case in dataset.cases} == {"unanswerable", "ambiguous", "other_user"}


def test_cover_sources_keeps_a_lower_ranked_file():
    ranked = [
        {"metadata": {"file_name": "notes.pdf", "text": "personality"}},
        {"metadata": {"file_name": "notes.pdf", "text": "more personality"}},
        {"metadata": {"file_name": "varanaasi.txt", "text": "Varanasi releases in 2027"}},
    ]
    covered = cover_sources(ranked, max_per_source=1)
    names = [item["metadata"]["file_name"] for item in covered]
    assert names == ["notes.pdf", "varanaasi.txt"]
