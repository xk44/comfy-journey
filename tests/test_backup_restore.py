import os
import sys
import types
import tarfile

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


def test_backup_and_restore(tmp_path):
    # create a parameter mapping
    resp = client.post(
        "/api/parameters",
        json={"code": "--b", "node_id": "1", "param_name": "b"},
    )
    assert resp.status_code == 200
    param_id = resp.json()["payload"]["id"]

    # create backup
    resp = client.get("/api/maintenance/backup")
    assert resp.status_code == 200
    backup_path = tmp_path / "backup.tar.gz"
    backup_path.write_bytes(resp.content)

    # remove mapping
    client.delete(f"/api/parameters/{param_id}")
    resp = client.get("/api/parameters")
    assert len(resp.json()["payload"]) == 0

    # restore
    data = backup_path.read_bytes()
    resp = client.post(
        "/api/maintenance/restore",
        data=data,
        headers={"Content-Type": "application/gzip"},
    )
    assert resp.status_code == 200
    resp = client.get("/api/parameters")
    ids = [p["id"] for p in resp.json()["payload"]]
    assert param_id in ids
