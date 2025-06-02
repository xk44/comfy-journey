import os
import sys
import types

os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["DISABLE_CSRF"] = "true"

# Stub motor client
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


def test_generate_with_image_mask():
    resp = client.post(
        "/api/generate",
        json={"prompt": "test", "init_image": "img", "mask": "msk"},
    )
    assert resp.status_code == 200
    data = resp.json()["payload"]
    assert "job_id" in data
