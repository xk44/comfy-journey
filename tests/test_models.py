import os
import sys
import types

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


def test_get_models():
    resp = client.get("/api/models")
    assert resp.status_code == 200
    data = resp.json()["payload"]
    assert any(m["type"] == "SD1.5" for m in data)
