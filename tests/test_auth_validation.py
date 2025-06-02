import os
import sys
import types
from fastapi.testclient import TestClient

# stub jose before importing app
jose_module = types.ModuleType("jose")
jwt_sub = types.SimpleNamespace(encode=lambda *a, **k: "token", decode=lambda *a, **k: {})
jose_module.jwt = jwt_sub
jose_module.JWTError = Exception
sys.modules.setdefault("jose", jose_module)

import fastapi.dependencies.utils as dep_utils
dep_utils.ensure_multipart_is_installed = lambda: None

passlib_module = types.ModuleType("passlib")
context_sub = types.ModuleType("passlib.context")
class DummyCryptContext:
    def __init__(self, *args, **kwargs):
        pass
    def verify(self, plain, hashed):
        return plain == hashed
    def hash(self, pwd):
        return pwd
context_sub.CryptContext = DummyCryptContext
passlib_module.context = context_sub
sys.modules.setdefault("passlib", passlib_module)
sys.modules.setdefault("passlib.context", context_sub)

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
                self.data[doc.get("username")] = doc
            async def find_one(self, filt):
                return self.data.get(filt.get("username"))
        return types.SimpleNamespace(users=DummyCollection())

motor_asyncio.AsyncIOMotorClient = DummyClient
sys.modules["motor"] = motor_module
sys.modules["motor.motor_asyncio"] = motor_asyncio

import backend.auth as _auth
sys.modules.setdefault("auth", _auth)

from fastapi import FastAPI
from backend.models import init_db

app = FastAPI()
app.include_router(_auth.auth_router)

os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["DISABLE_CSRF"] = "true"

init_db()
client = TestClient(app)

def test_register_validation():
    payload = {"username": "ab", "password": "123", "name": "A"}
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 422

