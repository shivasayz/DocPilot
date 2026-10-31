"""Compare a new eval report with a saved baseline.

    python -m eval.compare --baseline eval/baselines/retrieval.json --report eval/reports/<stamp>.json
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

REPORTS_DIR = Path(__file__).resolve().parent / "reports"
METRIC_NAMES = ("recall", "hit", "precision", "f1", "mrr")


def latest_report(directory: str | Path = REPORTS_DIR) -> Path:
    reports = sorted(Path(directory).glob("*.json"))
    if not reports:
        raise FileNotFoundError(f"No reports in {directory}")
    return reports[-1]


def compare_reports(baseline: dict, current: dict) -> dict:
    return {
        "baseline_created_at": baseline.get("created_at"),
        "current_created_at": current.get("created_at"),
        "file": _section_delta(baseline, current, "at_k"),
        "paragraph": _section_delta(baseline, current, "chunk_at_k"),
        "timing_ms": _timing_delta(baseline.get("summary", {}), current.get("summary", {})),
    }


def format_comparison(delta: dict) -> str:
    lines = ["Retrieval change versus baseline"]
    for section in ("file", "paragraph"):
        rows = delta.get(section) or {}
        if not rows:
            continue
        lines.append(section)
        for k, metrics in rows.items():
            parts = [f"k={k}"]
            for name in METRIC_NAMES:
                change = metrics.get(name)
                if change is None:
                    continue
                parts.append(f"{name} {change:+.3f}")
            lines.append("  " + "  ".join(parts))
    timing = delta.get("timing_ms") or {}
    if timing:
        lines.append("timing ms")
        for name, change in timing.items():
            if change is None:
                continue
            lines.append(f"  {name} {change:+.1f}")
    return "\n".join(lines)


def _section_delta(baseline: dict, current: dict, key: str) -> dict:
    before = (baseline.get("summary") or {}).get(key) or {}
    after = (current.get("summary") or {}).get(key) or {}
    delta = {}
    for k in sorted(set(before) | set(after), key=int):
        delta[k] = {
            name: _subtract((after.get(k) or {}).get(name), (before.get(k) or {}).get(name))
            for name in METRIC_NAMES
        }
    return delta


def _timing_delta(before: dict, after: dict) -> dict:
    names = ("mean_embed_ms", "mean_search_ms", "mean_retrieval_ms", "mean_generation_ms", "mean_end_to_end_ms")
    return {name: _subtract(after.get(name), before.get(name)) for name in names if before.get(name) is not None or after.get(name) is not None}


def _subtract(current, baseline):
    if current is None or baseline is None:
        return None
    return float(current) - float(baseline)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Compare an eval report with a baseline.")
    parser.add_argument("--baseline", required=True)
    parser.add_argument("--report", default=None)
    args = parser.parse_args(argv)
    try:
        report_path = Path(args.report) if args.report else latest_report()
        baseline = json.loads(Path(args.baseline).read_text(encoding="utf-8"))
        current = json.loads(report_path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError) as exc:
        print(exc)
        return 1
    print(format_comparison(compare_reports(baseline, current)))
    print(f"current {report_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
