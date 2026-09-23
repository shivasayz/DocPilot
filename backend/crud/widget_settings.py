from pymongo.errors import DuplicateKeyError

from db.connection import db

widget_settings = db["widget_settings"]

DEFAULTS = {
    "widget_enabled": True,
    "auto_start": False,
    "theme": "dark",
    "position": "bottom-right",
    "auto_sync": True,
    "keyboard_shortcut": "CommandOrControl+Shift+A",
    "notifications_enabled": True,
}

PUBLIC_FIELDS = tuple(DEFAULTS.keys())


def public_settings(doc: dict) -> dict:
    return {key: doc.get(key, DEFAULTS[key]) for key in PUBLIC_FIELDS}


async def ensure_indexes() -> None:
    await widget_settings.create_index("user_id", unique=True)


async def find_by_user(user_id: str) -> dict | None:
    return await widget_settings.find_one({"user_id": user_id})


async def insert_for_user(doc: dict) -> dict:
    try:
        await widget_settings.insert_one(doc)
        return doc
    except DuplicateKeyError:
        existing = await find_by_user(doc["user_id"])
        if existing is None:
            raise
        return existing


async def update_for_user(user_id: str, update_data: dict) -> dict | None:
    result = await widget_settings.update_one(
        {"user_id": user_id},
        {"$set": update_data},
    )
    if result.matched_count == 0:
        return None
    return await find_by_user(user_id)
