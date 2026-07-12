from fastapi import APIRouter, Depends, status
from schemas.notes import NoteCreate, NoteUpdate, NoteResponse
from services.notes import create_user_note, get_user_notes, get_user_note, update_user_note, delete_user_note
from core.jwt import get_current_user

router = APIRouter()


@router.post("/", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(body: NoteCreate, current_user: dict = Depends(get_current_user)):
    return await create_user_note(body, current_user["sub"])


@router.get("/", response_model=list[NoteResponse])
async def get_notes(current_user: dict = Depends(get_current_user)):
    return await get_user_notes(current_user["sub"])


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(note_id: str, current_user: dict = Depends(get_current_user)):
    return await get_user_note(note_id, current_user["sub"])


@router.patch("/{note_id}", response_model=NoteResponse)
async def update_note(note_id: str, body: NoteUpdate, current_user: dict = Depends(get_current_user)):
    return await update_user_note(note_id, current_user["sub"], body)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(note_id: str, current_user: dict = Depends(get_current_user)):
    await delete_user_note(note_id, current_user["sub"])
