import os
import uuid
import json
import sys
import types

os.environ["DATABASE_URL"] = "sqlite:///./test.db"

# Stub motor to avoid dependency on MongoDB driver
motor_module = types.ModuleType("motor")
motor_asyncio = types.ModuleType("motor.motor_asyncio")


class DummyClient:
    def __init__(self, *args, **kwargs):
        pass

    def get_database(self, name):
        class DummyCollection:
            def __init__(self):
                self.data = {}

            async def insert_one(self, doc):
                self.data[doc.get("_id")] = doc

            def find(self):
                class Cursor:
                    def __init__(self, data):
                        self.data = data

                    async def to_list(self, limit):
                        return list(self.data.values())

                return Cursor(self.data)

            async def update_one(self, filt, update, upsert=False):
                _id = filt.get("_id")
                doc = self.data.get(_id, {})
                doc.update(update.get("$set", {}))
                self.data[_id] = doc

            async def delete_one(self, filt):
                self.data.pop(filt.get("_id"), None)

            async def find_one(self, filt):
                return self.data.get(filt.get("_id"))

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
from backend.server import app


init_db()
client = TestClient(app)


def test_action_crud():
    workflow_id = str(uuid.uuid4())
    wf_data = {
        "id": workflow_id,
        "name": "WF",
        "description": "",
        "data": {},
    }
    # create workflow in relational DB
    resp = client.post("/api/relational/workflows", json=wf_data)
    assert resp.status_code == 200

    action_data = {
        "button": "upscale",
        "name": "Upscale",
        "workflow_id": workflow_id,
        "parameters": {"scale": 2},
    }
    resp = client.post("/api/relational/actions", json=action_data)
    assert resp.status_code == 200
    payload = resp.json()["payload"]
    action_id = payload["id"]
    assert payload["button"] == "upscale"

    resp = client.get("/api/relational/actions")
    assert resp.status_code == 200
    assert len(resp.json()["payload"]) == 1

    update = {
        "id": action_id,
        "button": "zoom",
        "name": "Zoom",
        "workflow_id": workflow_id,
        "parameters": {"amount": 1.5},
    }
    resp = client.put(f"/api/relational/actions/{action_id}", json=update)
    assert resp.status_code == 200
    assert resp.json()["payload"]["button"] == "zoom"

    resp = client.delete(f"/api/relational/actions/{action_id}")
    assert resp.status_code == 200
    assert resp.json()["payload"]["message"] == "Action mapping deleted"
