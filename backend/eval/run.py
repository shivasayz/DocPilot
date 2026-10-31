"""Score a user's FAISS index against a golden question set.

Run from the backend directory:

    python -m eval.run --user-id 6a5cba3f9ac7782576566239 --dataset eval/golden.json
    python -m eval.run --user-id 6a5cba3f9ac7782576566239 --dataset eval/golden.json --generate

Each run writes a timestamped JSON report under eval/reports/.
--save-baseline copies the summary to eval/baselines/retrieval.json.
"""

from __future__ import annotations

import argparse
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path

from eval.dataset import EvalCase, GoldenDataset, load_dataset
from eval.metrics import chunk_key, relevant_keys, score_at_k, score_paragraphs_at_k
from ingestion.chunk_ids import chunk_id_from_metadata

DEFAULT_KS = (1, 3, 5)
FAILURE_K = 5
REPORTS_DIR = Path(__file__).resolve().parent / "reports"
BASELINE_PATH = Path(__file__).resolve().parent / "baselines" / "retrieval.json"


def usable_hits(results: list[dict]) -> list[dict]:
    """Drop FAISS padding rows (index -1) that are not real neighbors."""
    return [item for item in results if item.get("index", 0) >= 0]


def evaluate(cases: list[EvalCase], retrieve, ks: tuple[int, ...] = DEFAULT_KS, generate=None) -> dict:
    """Score cases. ``retrieve(query, top_k)`` returns hits or ``(hits, timing)``."""
    query_reports = []
    for case in cases:
        top_k = max([*ks, case.k or 0])
        started = time.perf_counter()
        raw, timing = _split_retrieval(retrieve(case.query, top_k))
        retrieval_ms = (time.perf_counter() - started) * 1000
        hits = usable_hits(raw)
        ranked = [item.get("metadata") for item in hits]
        labels = [label.model_dump(exclude_none=True) for label in case.relevant]
        keys = relevant_keys(labels) if labels else []
        wanted = set(keys)
        paragraph_labels = [label for label in labels if label.get("chunk_id") or label.get("passage")]
        scores = {str(k): score_at_k(ranked, keys, k) for k in ks} if keys else {}
        chunk_scores = {str(k): score_paragraphs_at_k(ranked, paragraph_labels, k) for k in ks} if paragraph_labels else {}
        forbidden = {name.casefold() for name in case.forbidden_file_names}
        retrieved = []
        for rank, item in enumerate(hits, start=1):
            metadata = item.get("metadata") or {}
            key = chunk_key(metadata)
            paragraph_hit = any(
                score_paragraphs_at_k([metadata], [label], 1)["hit"] == 1.0 for label in paragraph_labels
            )
            retrieved.append(
                {
                    "rank": rank,
                    "chunk_id": (metadata.get("chunk_id") or None),
                    "file_name": metadata.get("file_name"),
                    "note_id": metadata.get("note_id"),
                    "source_type": metadata.get("source_type"),
                    "distance": item.get("distance"),
                    "matched_file": bool(key and key in wanted),
                    "matched_paragraph": paragraph_hit,
                }
            )
        for row, metadata in zip(retrieved, ranked):
            if metadata and not row["chunk_id"]:
                row["chunk_id"] = chunk_id_from_metadata(metadata)
        forbidden_hit = any((row.get("file_name") or "").casefold() in forbidden for row in retrieved)
        timing = {
            "embed_ms": timing.get("embed_ms"),
            "search_ms": timing.get("search_ms"),
            "retrieval_ms": timing.get("retrieval_ms", retrieval_ms),
            "generation_ms": None,
            "judge_ms": None,
            "end_to_end_ms": timing.get("retrieval_ms", retrieval_ms),
        }
        generation = None
        if generate is not None:
            generation = generate(case, hits)
            timing["generation_ms"] = generation.get("generation_ms")
            timing["judge_ms"] = generation.get("judge_ms")
            timing["end_to_end_ms"] = (timing["retrieval_ms"] or 0) + (generation.get("generation_ms") or 0) + (generation.get("judge_ms") or 0)
        query_reports.append(
            {
                "id": case.id,
                "kind": case.kind,
                "query": case.query,
                "relevant": labels,
                "retrieved": retrieved,
                "timing": timing,
                "latency_ms": timing["retrieval_ms"],
                "top1_l2_distance": hits[0].get("distance") if hits else None,
                "scores": scores,
                "chunk_scores": chunk_scores,
                "forbidden_hit": forbidden_hit,
                "generation": _generation_public(generation),
            }
        )

    answerable = [row for row in query_reports if row["kind"] == "answerable"]
    distances = [row["top1_l2_distance"] for row in answerable if row["top1_l2_distance"] is not None]
    summary = {
        "queries": len(query_reports),
        "answerable_queries": len(answerable),
        "zero_result_queries": sum(1 for row in query_reports if not row["retrieved"]),
        "forbidden_hits": sum(1 for row in query_reports if row["forbidden_hit"]),
        "mean_top1_l2_distance": _mean(distances),
        "mean_embed_ms": _mean(_timing_values(query_reports, "embed_ms")),
        "mean_search_ms": _mean(_timing_values(query_reports, "search_ms")),
        "mean_retrieval_ms": _mean(_timing_values(query_reports, "retrieval_ms")),
        "mean_generation_ms": _mean(_timing_values(query_reports, "generation_ms")),
        "mean_end_to_end_ms": _mean(_timing_values(query_reports, "end_to_end_ms")),
        "mean_latency_ms": _mean(_timing_values(answerable or query_reports, "retrieval_ms")),
        "at_k": {str(k): _mean_scores(answerable, k, "scores") for k in ks},
        "chunk_at_k": {str(k): _mean_scores([row for row in answerable if row["chunk_scores"]], k, "chunk_scores") for k in ks},
        "generation": _generation_summary(query_reports),
        "by_kind": _by_kind(query_reports),
    }
    failures = []
    for row in query_reports:
        file_recall = (row["scores"].get(str(FAILURE_K)) or {}).get("recall")
        chunk_recall = (row["chunk_scores"].get(str(FAILURE_K)) or {}).get("recall") if row["chunk_scores"] else None
        missed_file = row["kind"] == "answerable" and file_recall == 0
        missed_paragraph = row["kind"] == "answerable" and chunk_recall == 0
        if missed_file or missed_paragraph or row["forbidden_hit"]:
            failures.append(
                {
                    "id": row["id"],
                    "kind": row["kind"],
                    "query": row["query"],
                    "recall_at_5": file_recall,
                    "paragraph_recall_at_5": chunk_recall,
                    "forbidden_hit": row["forbidden_hit"],
                    "retrieved": row["retrieved"],
                }
            )
    return {"summary": summary, "queries": query_reports, "failures": failures}


def write_report(report: dict, out_dir: str | Path = REPORTS_DIR) -> Path:
    destination = Path(out_dir)
    destination.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = destination / f"{stamp}.json"
    path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return path


def resolve_faiss_dir(user_id: str) -> str:
    from ingestion.pipeline import user_faiss_dir

    primary = user_faiss_dir(user_id)
    if os.path.isdir(primary):
        return primary
    backend_root = Path(__file__).resolve().parents[1]
    alternate = backend_root / "storage" / user_id / "faiss_store"
    if alternate.is_dir():
        return str(alternate)
    return primary


def build_retriever(user_id: str):
    from ingestion.vectorstore import FaissVectorStore

    persist_dir = resolve_faiss_dir(user_id)
    index_path = os.path.join(persist_dir, "faiss.index")
    if not os.path.exists(index_path):
        raise FileNotFoundError(
            f"No FAISS index for user {user_id}. Ingest first. Expected: {persist_dir}"
        )
    store = FaissVectorStore(persist_dir)
    store.load()

    def retrieve(query: str, top_k: int):
        return store.query_timed(query, top_k=top_k)

    return retrieve


def run_eval(
    user_id: str,
    dataset_path: str,
    out_dir: str | Path = REPORTS_DIR,
    edges_path: str | None = None,
    generate: bool = False,
    save_baseline: bool = False,
    limit: int | None = None,
) -> Path:
    dataset: GoldenDataset = load_dataset(dataset_path)
    cases = list(dataset.cases)
    if edges_path:
        cases.extend(load_dataset(edges_path).cases)
    if limit is not None:
        cases = cases[:limit]
    generator = None
    if generate:
        from eval.generate import GenerationEvaluator

        evaluator = GenerationEvaluator()

        def generator(case: EvalCase, hits: list[dict]) -> dict:
            return evaluator.evaluate(case.query, hits, case.expected_facts, case.kind)

    report = evaluate(cases, build_retriever(user_id), generate=generator)
    report["user_id"] = user_id
    report["dataset"] = str(dataset_path)
    report["edges"] = str(edges_path) if edges_path else None
    report["created_at"] = datetime.now(timezone.utc).isoformat()
    report["ks"] = list(DEFAULT_KS)
    path = write_report(report, out_dir)
    if save_baseline:
        save_baseline_report(report)
    return path


def save_baseline_report(report: dict, path: Path = BASELINE_PATH) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    kept = {
        "created_at": report.get("created_at"),
        "user_id": report.get("user_id"),
        "dataset": report.get("dataset"),
        "summary": report.get("summary"),
    }
    path.write_text(json.dumps(kept, indent=2), encoding="utf-8")
    return path


def format_summary(report: dict) -> str:
    summary = report["summary"]
    lines = [
        f"queries: {summary['queries']}",
        f"answerable: {summary.get('answerable_queries', summary['queries'])}",
        f"zero results: {summary['zero_result_queries']}",
        f"forbidden hits: {summary.get('forbidden_hits', 0)}",
        f"mean top-1 L2 distance: {_fmt(summary['mean_top1_l2_distance'])}",
        f"embed ms: {_fmt(summary.get('mean_embed_ms'))}",
        f"search ms: {_fmt(summary.get('mean_search_ms'))}",
        f"retrieval ms: {_fmt(summary.get('mean_retrieval_ms'))}",
        f"generation ms: {_fmt(summary.get('mean_generation_ms'))}",
        f"end-to-end ms: {_fmt(summary.get('mean_end_to_end_ms'))}",
    ]
    lines.append("files")
    for k, scores in summary["at_k"].items():
        lines.append(_score_line(k, scores))
    if any(scores for scores in (summary.get("chunk_at_k") or {}).values()):
        lines.append("paragraphs")
        for k, scores in summary["chunk_at_k"].items():
            lines.append(_score_line(k, scores))
    generation = summary.get("generation") or {}
    if generation.get("scored"):
        lines.append(
            "generation  correctness={correctness}  faithfulness={faithfulness}  relevance={relevance}  abstained={abstained}".format(
                correctness=_fmt(generation.get("correctness")),
                faithfulness=_fmt(generation.get("faithfulness")),
                relevance=_fmt(generation.get("relevance")),
                abstained=_fmt(generation.get("abstained")),
            )
        )
    lines.append(f"failures: {len(report['failures'])}")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Evaluate retrieval against a golden question set.")
    parser.add_argument("--user-id", required=True)
    parser.add_argument("--dataset", required=True)
    parser.add_argument("--edges", default=None, help="Extra cases: unanswerable, ambiguous, other user.")
    parser.add_argument("--generate", action="store_true", help="Score Groq answers for correctness, faithfulness, and relevance.")
    parser.add_argument("--limit", type=int, default=None, help="Evaluate only the first N cases.")
    parser.add_argument("--save-baseline", action="store_true")
    parser.add_argument("--out-dir", default=str(REPORTS_DIR))
    args = parser.parse_args(argv)
    try:
        path = run_eval(
            args.user_id,
            args.dataset,
            args.out_dir,
            edges_path=args.edges,
            generate=args.generate,
            save_baseline=args.save_baseline,
            limit=args.limit,
        )
    except (FileNotFoundError, ValueError, json.JSONDecodeError) as exc:
        print(exc)
        return 1
    report = json.loads(path.read_text(encoding="utf-8"))
    print(format_summary(report))
    print(f"wrote {path}")
    if args.save_baseline:
        print(f"baseline {BASELINE_PATH}")
    return 0


def _mean(values: list[float]) -> float | None:
    if not values:
        return None
    return sum(values) / len(values)


def _mean_scores(rows: list[dict], k: int, field: str) -> dict[str, float | None]:
    key = str(k)
    names = ("recall", "hit", "precision", "f1", "mrr")
    present = [row for row in rows if key in (row.get(field) or {})]
    return {name: _mean([row[field][key][name] for row in present]) for name in names}


def _split_retrieval(result):
    if isinstance(result, tuple) and len(result) == 2:
        raw, timing = result
        return raw or [], timing or {}
    return result or [], {}


def _timing_values(rows: list[dict], name: str) -> list[float]:
    values = []
    for row in rows:
        value = (row.get("timing") or {}).get(name)
        if value is not None:
            values.append(value)
    return values


def _generation_public(generation: dict | None) -> dict | None:
    if not generation:
        return None
    return {
        "answer": generation.get("answer"),
        "scores": generation.get("scores"),
        "judge_error": generation.get("judge_error"),
    }


def _generation_summary(rows: list[dict]) -> dict:
    scored = [row["generation"]["scores"] for row in rows if row.get("generation") and row["generation"].get("scores")]
    if not scored:
        return {"scored": 0}
    return {
        "scored": len(scored),
        "correctness": _mean([row["correctness"] for row in scored if row.get("correctness") is not None]),
        "faithfulness": _mean([row["faithfulness"] for row in scored if row.get("faithfulness") is not None]),
        "relevance": _mean([row["relevance"] for row in scored if row.get("relevance") is not None]),
        "abstained": _mean([1.0 if row.get("abstained") else 0.0 for row in scored]),
        "fact_recall": _mean([row["fact_recall"] for row in scored if row.get("fact_recall") is not None]),
    }


def _by_kind(rows: list[dict]) -> dict:
    kinds: dict[str, int] = {}
    for row in rows:
        kinds[row["kind"]] = kinds.get(row["kind"], 0) + 1
    return kinds


def _score_line(k: str, scores: dict | None) -> str:
    scores = scores or {}
    return "k={k}  recall={recall}  hit={hit}  precision={precision}  f1={f1}  mrr={mrr}".format(
        k=k,
        recall=_fmt(scores.get("recall")),
        hit=_fmt(scores.get("hit")),
        precision=_fmt(scores.get("precision")),
        f1=_fmt(scores.get("f1")),
        mrr=_fmt(scores.get("mrr")),
    )


def _fmt(value: float | None) -> str:
    if value is None:
        return "n/a"
    return f"{value:.3f}"


if __name__ == "__main__":
    raise SystemExit(main())
