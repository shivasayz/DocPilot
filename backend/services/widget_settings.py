from datetime import datetime, timezone

from fastapi import HTTPException, status

from crud.widget_settings import (
    DEFAULTS,
    ensure_indexes,
    find_by_user,
    insert_for_user,
    public_settings,
    update_for_user,
)
from schemas.widget_settings import WidgetSettingsUpdate

_indexes_ready = False


async def _ready() -> None:
    global _indexes_ready
    if _indexes_ready:
        return
    await ensure_indexes()
    _indexes_ready = True


async def get_widget_settings(user_id: str) -> dict:
    """Return this user's settings, creating defaults on first read."""
    await _ready()
    doc = await find_by_user(user_id)
    if doc:
        return public_settings(doc)

    now = datetime.now(timezone.utc)
    created = await insert_for_user(
        {
            **DEFAULTS,
            "user_id": user_id,
            "created_at": now,
            "updated_at": now,
        }
    )
    return public_settings(created)


async def update_widget_settings(user_id: str, body: WidgetSettingsUpdate) -> dict:
    """Update only the authenticated user's document."""
    await _ready()
    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    await get_widget_settings(user_id)
    update_data["updated_at"] = datetime.now(timezone.utc)
    doc = await update_for_user(user_id, update_data)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Widget settings not found")
    return public_settings(doc)
