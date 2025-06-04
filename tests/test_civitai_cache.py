import os
import types
import asyncio
import hashlib

from backend.external_integrations import civitai

class DummyResponse:
    def __init__(self, data):
        self._data = data
    def raise_for_status(self):
        pass
    def json(self):
        return self._data

class DummyClient:
    def __init__(self):
        self.calls = 0
    async def get(self, *args, **kwargs):
        self.calls += 1
        return DummyResponse({"call": self.calls})

async def run(tmpdir, client):
    civitai._CACHE.clear()
    civitai._last_request_time = 0.0
    civitai.CACHE_DIR = tmpdir
    os.makedirs(tmpdir, exist_ok=True)
    civitai._HTTP_CLIENT = client
    data1 = await civitai.fetch_json("/foo")
    data2 = await civitai.fetch_json("/foo")
    assert data1 == data2
    assert client.calls == 1
    key = civitai._cache_key("/foo", None, None)
    cached_path = os.path.join(tmpdir, hashlib.sha256(key.encode()).hexdigest()+".json")
    assert os.path.exists(cached_path)


def test_disk_cache(tmp_path, monkeypatch):
    client = DummyClient()
    monkeypatch.setattr(civitai, "httpx", types.SimpleNamespace(AsyncClient=lambda *a, **k: client))
    asyncio.run(run(str(tmp_path), client))
