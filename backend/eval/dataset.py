"""Golden question set for retrieval and generation eval.

Answerable cases label a file or note, and optionally the paragraph
(``chunk_id`` and ``passage``). Edge cases can be unanswerable, ambiguous,
or about another user's documents.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field, model_validator

CaseKind = Literal["answerable", "unanswerable", "ambiguous", "other_user"]


class RelevantSource(BaseModel):
    file_name: str | None = None
    note_id: str | None = None
    chunk_id: str | None = None
    passage: str | None = None

    @model_validator(mode="after")
    def exactly_one_identity(self):
        file_name = (self.file_name or "").strip()
        note_id = (self.note_id or "").strip()
        if bool(file_name) == bool(note_id):
            raise ValueError("each relevant item needs exactly one of file_name or note_id")
        self.file_name = file_name or None
        self.note_id = note_id or None
        self.chunk_id = (self.chunk_id or "").strip() or None
        self.passage = (self.passage or "").strip() or None
        return self


class EvalCase(BaseModel):
    id: str = Field(min_length=1)
    query: str = Field(min_length=1)
    relevant: list[RelevantSource] = Field(default_factory=list)
    k: int | None = Field(default=None, ge=1)
    kind: CaseKind = "answerable"
    expected_facts: list[str] = Field(default_factory=list)
    forbidden_file_names: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def answerable_needs_a_source(self):
        if self.kind == "answerable" and not self.relevant:
            raise ValueError("answerable cases need a relevant source")
        return self


class GoldenDataset(BaseModel):
    cases: list[EvalCase] = Field(min_length=1)


def load_dataset(path: str | Path) -> GoldenDataset:
    dataset_path = Path(path)
    payload = json.loads(dataset_path.read_text(encoding="utf-8"))
    return GoldenDataset.model_validate(payload)
