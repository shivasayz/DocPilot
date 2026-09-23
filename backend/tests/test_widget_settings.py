"""Widget settings stay scoped to the JWT subject and never take user_id from the body."""

from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.testclient import TestClient
from pymongo.errors import DuplicateKeyError

import services.widget_settings as widget_service
from api.widget_settings import router
from core.jwt import get_current_user
from crud import widget_settings as widget_crud


class FakeCollection:
    def __init__(self):
        self.docs = {}

    async def create_index(self, *args, **kwargs):
        return "user_id_1"

    async def find_one(self, query):
        doc = self.docs.get(query["user_id"])
        return dict(doc) if doc else None

    async def insert_one(self, doc):
        if doc["user_id"] in self.docs:
            raise DuplicateKeyError("duplicate user_id")
        self.docs[doc["user_id"]] = dict(doc)

    async def update_one(self, query, update):
        doc = self.docs.get(query["user_id"])
        if not doc:
            return type("Result", (), {"matched_count": 0})()
        doc.update(update["$set"])
        return type("Result", (), {"matched_count": 1})()


def make_client(user_id: str) -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/api/v1/widget")
    app.dependency_overrides[get_current_user] = lambda: {"sub": user_id, "email": f"{user_id}@example.com"}
    return TestClient(app)


def setup_function():
    widget_crud.widget_settings = FakeCollection()
    widget_service._indexes_ready = False


def test_get_creates_defaults_for_authenticated_user():
    client = make_client("user-a")
    response = client.get("/api/v1/widget/settings")
    assert response.status_code == 200
    body = response.json()
    assert body["widget_enabled"] is True
    assert body["auto_start"] is False
    assert body["theme"] == "dark"
    assert body["position"] == "bottom-right"
    assert body["auto_sync"] is True
    assert body["keyboard_shortcut"] == "CommandOrControl+Shift+A"
    assert body["notifications_enabled"] is True
    assert "user_id" not in body
    assert widget_crud.widget_settings.docs["user-a"]["user_id"] == "user-a"


def test_put_updates_only_the_authenticated_user():
    client_a = make_client("user-a")
    client_b = make_client("user-b")

    created = client_a.get("/api/v1/widget/settings")
    assert created.status_code == 200

    updated = client_a.put(
        "/api/v1/widget/settings",
        json={"theme": "light", "position": "top-left", "user_id": "user-b"},
    )
    assert updated.status_code == 200
    assert updated.json()["theme"] == "light"
    assert updated.json()["position"] == "top-left"

    stored = widget_crud.widget_settings.docs["user-a"]
    assert stored["user_id"] == "user-a"
    assert stored["theme"] == "light"
    assert isinstance(stored["updated_at"], datetime)
    assert stored["updated_at"].tzinfo == timezone.utc

    other = client_b.get("/api/v1/widget/settings")
    assert other.status_code == 200
    assert other.json()["theme"] == "dark"
    assert other.json()["position"] == "bottom-right"
    assert "user-b" in widget_crud.widget_settings.docs


def test_put_rejects_empty_body_and_invalid_theme():
    client = make_client("user-a")
    empty = client.put("/api/v1/widget/settings", json={})
    assert empty.status_code == 400

    invalid = client.put("/api/v1/widget/settings", json={"theme": "neon"})
    assert invalid.status_code == 422


def test_missing_token_is_rejected():
    app = FastAPI()
    app.include_router(router, prefix="/api/v1/widget")
    client = TestClient(app)
    response = client.get("/api/v1/widget/settings")
    assert response.status_code in (401, 403)
