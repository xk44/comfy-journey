import os
from fastapi.responses import JSONResponse
from typing import Any, Dict, Optional
from datetime import datetime
import json
import logging

DEBUG_MODE = os.environ.get("DEBUG", "false").lower() == "true"

# Directory to store log files
LOGS_DIR = os.environ.get("LOGS_DIR", "logs")
os.makedirs(LOGS_DIR, exist_ok=True)

# Paths to individual log files
LOG_BACKEND_PATH = os.path.join(LOGS_DIR, "log_backend.txt")
LOG_FRONTEND_PATH = os.path.join(LOGS_DIR, "log_frontend.txt")


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


def _write_log(entry: Dict[str, Any], path: str) -> None:
    """Write a single log entry as JSON to the given file."""
    try:
        with open(path, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry) + "\n")
    except Exception:
        logging.exception("Failed to write log to %s", path)


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
    _write_log(entry, LOG_BACKEND_PATH)


def log_frontend_event(event: Any) -> None:
    """Log a frontend event sent from the browser."""
    entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "event": event,
    }
    logging.info("Frontend: %s", json.dumps(event))
    _write_log(entry, LOG_FRONTEND_PATH)
