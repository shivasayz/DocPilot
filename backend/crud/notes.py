from bson import ObjectId
from db.connection import db

notes_collection = db["notes"]


async def create_note(doc: dict):
    result = await notes_collection.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    return doc


async def find_notes_by_user(user_id: str):
    cursor = notes_collection.find({"user_id": user_id}).sort("updated_at", -1)
    notes = []
    async for note in cursor:
        note["id"] = str(note["_id"])
        note.setdefault("pinned", False)
        note.setdefault("favorite", False)
        notes.append(note)
    return notes


async def find_note(note_id: str, user_id: str):
    note = await notes_collection.find_one({"_id": ObjectId(note_id), "user_id": user_id})
    if note:
        note["id"] = str(note["_id"])
        note.setdefault("pinned", False)
        note.setdefault("favorite", False)
    return note


async def update_note(note_id: str, user_id: str, update_data: dict):
    result = await notes_collection.update_one(
        {"_id": ObjectId(note_id), "user_id": user_id},
        {"$set": update_data},
    )
    if result.matched_count == 0:
        return None
    return await find_note(note_id, user_id)


async def delete_note(note_id: str, user_id: str):
    result = await notes_collection.delete_one({"_id": ObjectId(note_id), "user_id": user_id})
    return result.deleted_count > 0
