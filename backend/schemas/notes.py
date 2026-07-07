from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NoteCreate(BaseModel):
    title: str
    content: str
    pinned: bool = False
    favorite: bool = False


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    pinned: Optional[bool] = None
    favorite: Optional[bool] = None


class NoteResponse(BaseModel):
    id: str
    title: str
    content: str
    pinned: bool
    favorite: bool
    user_id: str
    created_at: datetime
    updated_at: datetime
