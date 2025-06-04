import os
import sys
import types

os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["DISABLE_CSRF"] = "true"

# Stub motor client to avoid MongoDB dependency
motor_module = types.ModuleType("motor")
motor_asyncio = types.ModuleType("motor.motor_asyncio")


class DummyClient:
    def __init__(self, *args, **kwargs):
        pass

    def get_database(self, name):
        class DummyCollection:
            async def insert_one(self, doc):
                pass

            def find(self):
                class Cursor:
                    async def to_list(self, limit):
                        return []

                return Cursor()

            async def update_one(self, *args, **kwargs):
                pass

            async def delete_one(self, *args, **kwargs):
                pass

            async def find_one(self, filt):
                return None

        return types.SimpleNamespace(
            parameter_mappings=DummyCollection(),
            workflow_mappings=DummyCollection(),
            action_mappings=DummyCollection(),
            civitai_key=DummyCollection(),
        )


motor_asyncio.AsyncIOMotorClient = DummyClient
sys.modules["motor"] = motor_module
sys.modules["motor.motor_asyncio"] = motor_asyncio

from fastapi.testclient import TestClient
from backend.models import init_db
import backend.server as server

init_db()
client = TestClient(server.app)


def test_query_parameters_forwarded(monkeypatch):
    captured = {}

    async def dummy_fetch(endpoint, params=None, api_key=None):
        captured["endpoint"] = endpoint
        captured["params"] = params
        return {}

    monkeypatch.setattr(server, "civitai_fetch", dummy_fetch)

    resp = client.get(
        "/api/v1/images",
        params={
            "limit": 5,
            "page": 2,
            "sort": "Newest",
            "period": "Week",
            "username": "bob",
        },
    )
    assert resp.status_code == 200
    assert captured["endpoint"] == "/images"
    assert captured["params"]["limit"] == "5"
    assert captured["params"]["page"] == "2"
    assert captured["params"]["sort"] == "Newest"
    assert captured["params"]["period"] == "Week"
    assert captured["params"]["username"] == "bob"


def test_videos_forwarded(monkeypatch):
    captured = {}

    async def dummy_fetch(endpoint, params=None, api_key=None):
        captured["endpoint"] = endpoint
        captured["params"] = params
        return {}

    monkeypatch.setattr(server, "civitai_fetch", dummy_fetch)

    resp = client.get(
        "/api/v1/videos",
        params={"limit": 3, "page": 1, "sort": "Newest", "period": "Month"},
    )
    assert resp.status_code == 200
    assert captured["endpoint"] == "/videos"
    assert captured["params"]["limit"] == "3"
    assert captured["params"]["page"] == "1"
    assert captured["params"]["sort"] == "Newest"
    assert captured["params"]["period"] == "Month"


def test_models_forwarded(monkeypatch):
    captured = {}

    async def dummy_fetch(endpoint, params=None, api_key=None):
        captured["endpoint"] = endpoint
        captured["params"] = params
        return {}

    monkeypatch.setattr(server, "civitai_fetch", dummy_fetch)

    resp = client.get(
        "/api/v1/models",
        params={"limit": 10, "page": 3, "sort": "Highest Rated"},
    )
    assert resp.status_code == 200
    assert captured["endpoint"] == "/models"
    assert captured["params"]["limit"] == "10"
    assert captured["params"]["page"] == "3"
    assert captured["params"]["sort"] == "Highest Rated"


def test_model_detail_forwarded(monkeypatch):
    captured = {}

    async def dummy_fetch(endpoint, params=None, api_key=None):
        captured["endpoint"] = endpoint
        captured["params"] = params
        return {}

    monkeypatch.setattr(server, "civitai_fetch", dummy_fetch)

    resp = client.get("/api/v1/models/123", params={"versionId": "456"})
    assert resp.status_code == 200
    assert captured["endpoint"] == "/models/123"
    assert captured["params"]["versionId"] == "456"


def test_tags_forwarded(monkeypatch):
    captured = {}

    async def dummy_fetch(endpoint, params=None, api_key=None):
        captured["endpoint"] = endpoint
        captured["params"] = params
        return {}

    monkeypatch.setattr(server, "civitai_fetch", dummy_fetch)

    resp = client.get("/api/v1/tags", params={"query": "foo"})
    assert resp.status_code == 200
    assert captured["endpoint"] == "/tags"
    assert captured["params"]["query"] == "foo"
