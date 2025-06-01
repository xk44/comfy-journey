from __future__ import annotations

import os
import time
import hashlib
import requests
from typing import Any, Dict, Optional, Tuple

# Civitai base URL
CIVITAI_BASE_URL = os.environ.get("CIVITAI_BASE_URL", "https://civitai.com/api/v1")

# Caching and throttling configuration
CACHE_TTL = int(os.environ.get("CIVITAI_CACHE_TTL", "60"))  # seconds
MIN_REQUEST_INTERVAL = float(os.environ.get("CIVITAI_MIN_INTERVAL", "1"))  # seconds

# Internal state
_civitai_cache: Dict[str, Dict[str, Any]] = {}
_last_request_time = 0.0

def _cache_key(endpoint: str, params: Dict[str, Any]) -> str:
    """Generate a unique cache key for an endpoint and params."""
    base = endpoint + "?" + "&".join(f"{k}={v}" for k, v in sorted(params.items()))
    return hashlib.sha256(base.encode()).hexdigest()

def _get_api_key() -> str:
    """Return the Civitai API key from env or empty string."""
    return os.environ.get("CIVITAI_API_KEY", "")


def civitai_get(endpoint: str, params: Dict[str, Any] | None = None) -> Any:
    """Perform a GET request to the Civitai API with caching and throttling."""
    global _last_request_time
    params = params or {}
    key = _cache_key(endpoint, params)
    now = time.time()

    # Serve from cache if not expired
    cached = _civitai_cache.get(key)
    if cached and now - cached["time"] < CACHE_TTL:
        return cached["response"]

    # Throttle requests
    wait = MIN_REQUEST_INTERVAL - (now - _last_request_time)
    if wait > 0:
        time.sleep(wait)

    headers = {}
    api_key = _get_api_key()
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    resp = requests.get(f"{CIVITAI_BASE_URL}{endpoint}", params=params, headers=headers)
    resp.raise_for_status()
    data = resp.json()

    # Store in cache
    _civitai_cache[key] = {"time": time.time(), "response": data}
    _last_request_time = time.time()

    return data

"""Helpers for interacting with the Civitai API with caching and rate limiting."""

"""Lightweight helpers for interacting with the Civitai API.

This module adds a minimal caching layer and basic rate limiting so that
repeated requests do not overwhelm the external service.  It is intentionally
simple and stores data in memory only.
"""

import asyncio
import json

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

