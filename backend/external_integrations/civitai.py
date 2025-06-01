"""Lightweight helpers for interacting with the Civitai API.

This module adds a minimal caching layer and basic rate limiting so that
repeated requests do not overwhelm the external service.  It is intentionally
simple and stores data in memory only.
"""

from __future__ import annotations

import asyncio
import json
import time
from typing import Any, Dict, Optional, Tuple

import httpx

__all__ = ["fetch_json"]


_CACHE: Dict[str, Tuple[float, Any]] = {}
_CACHE_TTL = 60.0  # seconds

_RATE_LIMIT = 1.0  # seconds between requests
_last_request_time = 0.0

BASE_URL = "https://civitai.com/api/v1"


def _cache_key(path: str, params: Optional[Dict[str, Any]]) -> str:
    if not params:
        return path
    # json.dumps with sort_keys gives deterministic ordering
    return f"{path}?{json.dumps(params, sort_keys=True, separators=(',', ':'))}"


async def fetch_json(
    path: str, *, params: Optional[Dict[str, Any]] = None, api_key: Optional[str] = None
) -> Any:
    """Fetch JSON data from the Civitai API with caching and throttling."""

    global _last_request_time
    key = _cache_key(path, params)
    now = time.monotonic()

    # Return cached result if valid
    cached = _CACHE.get(key)
    if cached and now - cached[0] < _CACHE_TTL:
        return cached[1]

    # Throttle requests
    wait = _RATE_LIMIT - (now - _last_request_time)
    if wait > 0:
        await asyncio.sleep(wait)

    headers = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    url = f"{BASE_URL}{path}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()

    _last_request_time = time.monotonic()
    _CACHE[key] = (now, data)
    return data

