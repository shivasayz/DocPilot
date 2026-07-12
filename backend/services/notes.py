from datetime import datetime, timezone
from fastapi import HTTPException, status
from crud.notes import create_note, find_notes_by_user, find_note, update_note, delete_note
from schemas.notes import NoteCreate, NoteUpdate


async def create_user_note(body: NoteCreate, user_id: str) -> dict:
    now = datetime.now(timezone.utc)
    doc = {
        "title": body.title,
        "content": body.content,
        "pinned": body.pinned,
        "favorite": body.favorite,
        "user_id": user_id,
        "created_at": now,
        "updated_at": now,
    }
    return await create_note(doc)


async def get_user_notes(user_id: str) -> list:
    return await find_notes_by_user(user_id)


async def get_user_note(note_id: str, user_id: str) -> dict:
    note = await find_note(note_id, user_id)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note


async def update_user_note(note_id: str, user_id: str, body: NoteUpdate) -> dict:
    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
    update_data["updated_at"] = datetime.now(timezone.utc)

    note = await update_note(note_id, user_id, update_data)
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note


async def delete_user_note(note_id: str, user_id: str):
    deleted = await delete_note(note_id, user_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
