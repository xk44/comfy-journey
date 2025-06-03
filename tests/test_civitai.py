import asyncio
import types

import pytest

from backend.external_integrations import civitai


class DummyResponse:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        pass

    def json(self):
        return self._payload


class DummyClient:
    def __init__(self):
        self.calls = 0

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        pass

    async def get(self, *args, **kwargs):
        self.calls += 1
        return DummyResponse({"call": self.calls})


def test_fetch_json_caching(monkeypatch):
    async def run():
        client = DummyClient()
        monkeypatch.setattr(
            civitai, "httpx", types.SimpleNamespace(AsyncClient=lambda *a, **k: client)
        )
        civitai._CACHE.clear()
        civitai._last_request_time = 0.0

        data1 = await civitai.fetch_json("/foo")
        data2 = await civitai.fetch_json("/foo")

        assert client.calls == 1
        assert data1 == data2

    asyncio.run(run())


def test_cache_key_includes_api_key(monkeypatch):
    async def run():
        client = DummyClient()
        monkeypatch.setattr(
            civitai, "httpx", types.SimpleNamespace(AsyncClient=lambda *a, **k: client)
        )
        civitai._CACHE.clear()
        civitai._last_request_time = 0.0

        await civitai.fetch_json("/foo", api_key="AAA")
        await civitai.fetch_json("/foo", api_key="BBB")

        assert client.calls == 2

    asyncio.run(run())
