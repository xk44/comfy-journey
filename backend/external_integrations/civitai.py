import os
import time
import hashlib
import requests
from typing import Any, Dict

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
