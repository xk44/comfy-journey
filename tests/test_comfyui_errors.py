import os
import sys
import types
import json
import importlib
from fastapi.testclient import TestClient

# Ensure stubbed motor client for DB
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["DISABLE_CSRF"] = "true"

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


def test_comfyui_error_logging(tmp_path, monkeypatch):
    os.environ["LOGS_DIR"] = str(tmp_path)
    # Reload modules so LOGS_DIR takes effect
    import backend.utils as utils
    importlib.reload(utils)
    import backend.server as server
    importlib.reload(server)

    client = TestClient(server.app)

    def fail_post(*args, **kwargs):
        raise RuntimeError("connection failed")

    monkeypatch.setattr(server.requests, "post", fail_post)

    resp = client.post("/api/comfyui/prompt", json={"prompt": "test"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is False

    log_path = tmp_path / "log_backend.txt"
    assert log_path.exists()
    with open(log_path, "r", encoding="utf-8") as fh:
        lines = fh.readlines()
    assert lines
    entry = json.loads(lines[-1])
    assert entry["method"] == "POST"
    assert entry["status"] == 500
