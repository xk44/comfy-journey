import os
import sys
import types
import time

os.environ["DATABASE_URL"] = "sqlite:///./test.db"

os.environ["DISABLE_CSRF"] = "true"
motor_module = types.ModuleType("motor")
motor_asyncio = types.ModuleType("motor.motor_asyncio")

class DummyClient:
    def __init__(self, *args, **kwargs):
        pass
    def get_database(self, name):
        return types.SimpleNamespace(
            parameter_mappings=types.SimpleNamespace(find=lambda: [], insert_one=lambda doc: None),
            workflow_mappings=types.SimpleNamespace(find=lambda: [], insert_one=lambda doc: None),
            action_mappings=types.SimpleNamespace(find=lambda: [], insert_one=lambda doc: None),
            civitai_key=types.SimpleNamespace(find_one=lambda q: None, update_one=lambda *a, **k: None),
        )

motor_asyncio.AsyncIOMotorClient = DummyClient
sys.modules["motor"] = motor_module
sys.modules["motor.motor_asyncio"] = motor_asyncio

from fastapi.testclient import TestClient
from backend.models import init_db
from backend.server import app

init_db()
client = TestClient(app)


def test_prompt_and_output_storage():
    resp = client.post("/api/generate", json={"prompt": "hello"})
    assert resp.status_code == 200
    job_id = resp.json()["payload"]["job_id"]
    time.sleep(1)

    p_resp = client.get("/api/relational/prompts")
    assert p_resp.status_code == 200
    prompts = p_resp.json()["payload"]
    assert any(p["id"] == job_id for p in prompts)

    o_resp = client.get("/api/relational/outputs")
    assert o_resp.status_code == 200
    outputs = o_resp.json()["payload"]
    assert any(o["prompt_id"] == job_id for o in outputs)
