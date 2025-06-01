import sys
import types
import json
import os

os.environ["DATABASE_URL"] = "sqlite:///./test.db"

os.environ["DISABLE_CSRF"] = "true"
motor_module = types.ModuleType("motor")
motor_asyncio = types.ModuleType("motor.motor_asyncio")

class DummyClient:
    def __init__(self, *args, **kwargs):
        pass
    def get_database(self, name):
        return types.SimpleNamespace()

motor_asyncio.AsyncIOMotorClient = DummyClient
sys.modules["motor"] = motor_module
sys.modules["motor.motor_asyncio"] = motor_asyncio

from fastapi.testclient import TestClient
from backend.models import init_db
from backend.server import app

init_db()
client = TestClient(app)

def test_upload_workflow():
    wf_json = {"nodes": {"1": {"id": "1"}}}
    payload = {"name": "test.json", "data": wf_json}
    resp = client.post("/api/relational/workflows/upload", json=payload)
    assert resp.status_code == 200
    data = resp.json()["payload"]
    assert data["name"] == "test.json"

