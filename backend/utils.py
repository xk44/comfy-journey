import os
from fastapi.responses import JSONResponse
from typing import Any, Dict, Optional
from datetime import datetime
import json
import logging

DEBUG_MODE = os.environ.get("DEBUG", "false").lower() == "true"

# Path to log file for ComfyUI backend calls
LOG_PATH = os.environ.get("COMFY_LOG_PATH", "comfy_backend.log")


def api_response(payload: Any = None, *, success: bool = True, debug_info: Optional[Dict[str, Any]] = None, error: Optional[str] = None) -> JSONResponse:
    """Return a standardized API response."""
    body = {
        "success": success,
        "payload": payload,
    }
    if not success and error is not None:
        body["error"] = error
    if DEBUG_MODE and debug_info is not None:
        body["debug"] = debug_info
    return JSONResponse(content=body)


def log_backend_call(method: str, url: str, request_data: Any, response_data: Any, status_code: int, start_time: float) -> None:
    """Log a backend call with request/response data for debugging."""
    entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "method": method,
        "url": url,
        "request": request_data,
        "status": status_code,
        "response": response_data,
        "runtime_ms": round((datetime.utcnow().timestamp() - start_time) * 1000, 2),
    }
    logging.info(json.dumps(entry))
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry) + "\n")
    except Exception:
        logging.exception("Failed to write backend log")
