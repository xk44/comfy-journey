"""Utilities for interacting with the Civitai API with caching and throttling."""

from __future__ import annotations

import asyncio
import json
import os
import time
from typing import Any, Dict, Optional, Tuple
import hashlib
import urllib.parse

import httpx

# Reusable HTTP client to avoid connection overhead
_HTTP_CLIENT: Optional[httpx.AsyncClient] = None


async def _get_client() -> httpx.AsyncClient:
    """Return a cached :class:`httpx.AsyncClient` instance."""
    global _HTTP_CLIENT
    if _HTTP_CLIENT is None or getattr(_HTTP_CLIENT, "is_closed", False):
        _HTTP_CLIENT = httpx.AsyncClient()
    return _HTTP_CLIENT

# Configuration via environment variables
BASE_URL = os.environ.get("CIVITAI_BASE_URL", "https://civitai.com/api/v1")
# Cache configuration
CACHE_TTL = float(os.environ.get("CIVITAI_CACHE_TTL", "60"))
MIN_INTERVAL = float(os.environ.get("CIVITAI_MIN_INTERVAL", "1"))
CACHE_DIR = os.environ.get("CIVITAI_CACHE_DIR")
if CACHE_DIR:
    os.makedirs(CACHE_DIR, exist_ok=True)

# In-memory cache
_CACHE: Dict[str, Tuple[float, Any]] = {}
_last_request_time = 0.0


def _cache_key(path: str, params: Optional[Dict[str, Any]], api_key: Optional[str]) -> str:
    """Return a deterministic cache key for the request including API key."""
    parts = [path]
    if params:
        parts.append(json.dumps(params, sort_keys=True, separators=(',', ':')))
    if api_key:
        digest = hashlib.sha256(api_key.encode()).hexdigest()[:8]
        parts.append(digest)
    return "?".join(parts)


async def fetch_json(
    path: str,
    *,
    params: Optional[Dict[str, Any]] = None,
    api_key: Optional[str] = None,
) -> Any:
    """Fetch JSON from the Civitai API respecting rate limits and caching."""

    global _last_request_time, _HTTP_CLIENT

    if not _CACHE:
        _HTTP_CLIENT = None

    key = _cache_key(path, params, api_key)
    now = time.monotonic()

    cached = _CACHE.get(key)
    if cached and now - cached[0] < CACHE_TTL:
        return cached[1]
    if CACHE_DIR:
        cache_file = os.path.join(CACHE_DIR, hashlib.sha256(key.encode()).hexdigest() + ".json")
        if os.path.exists(cache_file) and now - os.path.getmtime(cache_file) < CACHE_TTL:
            with open(cache_file, "r", encoding="utf-8") as fh:
                data = json.load(fh)
            _CACHE[key] = (now, data)
            return data

    wait = MIN_INTERVAL - (now - _last_request_time)
    if wait > 0:
        await asyncio.sleep(wait)

    headers = {}
    if api_key is None:
        api_key = os.environ.get("CIVITAI_API_KEY")
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    url = f"{BASE_URL}{path}"
    if params:
        query = urllib.parse.urlencode(params, doseq=True, quote_via=urllib.parse.quote)
        url = f"{url}?{query}"
    client = await _get_client()
    resp = await client.get(url, headers=headers, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    _last_request_time = time.monotonic()
    _CACHE[key] = (now, data)
    if CACHE_DIR:
        cache_file = os.path.join(CACHE_DIR, hashlib.sha256(key.encode()).hexdigest() + ".json")
        try:
            with open(cache_file, "w", encoding="utf-8") as fh:
                json.dump(data, fh)
        except Exception:
            pass
    return data


async def civitai_get(
    endpoint: str, params: Optional[Dict[str, Any]] | None = None
) -> Any:
    """Convenience wrapper around :func:`fetch_json` using the stored API key."""
    return await fetch_json(endpoint, params=params)


__all__ = ["fetch_json", "civitai_get"]
