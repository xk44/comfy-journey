import os
import sys
import types
from fastapi.testclient import TestClient

os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["DISABLE_CSRF"] = "true"

# stub whisper before importing app
whisper_mod = types.ModuleType("whisper")
class DummyModel:
    def transcribe(self, path):
        return {"text": "hello world"}

def load_model(name):
    return DummyModel()

whisper_mod.load_model = load_model
whisper_mod._download = lambda model, download_root=None: None
sys.modules["whisper"] = whisper_mod
import fastapi.dependencies.utils as dep_utils
dep_utils.ensure_multipart_is_installed = lambda: None

from backend.models import init_db
from backend.server import app

init_db()
client = TestClient(app)

def test_transcribe_endpoint():
    resp = client.post("/api/transcribe", files={"file": ("a.webm", b"0")})
    assert resp.status_code == 200
    assert resp.json()["payload"]["text"] == "hello world"
