from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from db.connection import db
from schemas.notes import NoteCreate, NoteUpdate, NoteResponse
from core.jwt import get_current_user

notes_route = APIRouter()
notes_collection = db["notes"]


@notes_route.post("/", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(body: NoteCreate, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    doc = {
        "title": body.title,
        "content": body.content,
        "pinned": body.pinned,
        "favorite": body.favorite,
        "user_id": current_user["sub"],
        "created_at": now,
        "updated_at": now,
    }
    result = await notes_collection.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    return doc


@notes_route.get("/", response_model=list[NoteResponse])
async def get_notes(current_user: dict = Depends(get_current_user)):
    cursor = notes_collection.find({"user_id": current_user["sub"]}).sort("updated_at", -1)
    notes = []
    async for note in cursor:
        note["id"] = str(note["_id"])
        note.setdefault("pinned", False)
        note.setdefault("favorite", False)
        notes.append(note)
    return notes


@notes_route.get("/{note_id}", response_model=NoteResponse)
async def get_note(note_id: str, current_user: dict = Depends(get_current_user)):
    note = await notes_collection.find_one({"_id": ObjectId(note_id), "user_id": current_user["sub"]})
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    note["id"] = str(note["_id"])
    note.setdefault("pinned", False)
    note.setdefault("favorite", False)
    return note


@notes_route.patch("/{note_id}", response_model=NoteResponse)
async def update_note(note_id: str, body: NoteUpdate, current_user: dict = Depends(get_current_user)):
    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
    update_data["updated_at"] = datetime.now(timezone.utc)

    result = await notes_collection.update_one(
        {"_id": ObjectId(note_id), "user_id": current_user["sub"]},
        {"$set": update_data},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    note = await notes_collection.find_one({"_id": ObjectId(note_id)})
    note["id"] = str(note["_id"])
    note.setdefault("pinned", False)
    note.setdefault("favorite", False)
    return note


@notes_route.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(note_id: str, current_user: dict = Depends(get_current_user)):
    result = await notes_collection.delete_one({"_id": ObjectId(note_id), "user_id": current_user["sub"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
