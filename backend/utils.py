import os
from fastapi.responses import JSONResponse
from typing import Any, Dict, Optional

DEBUG_MODE = os.environ.get("DEBUG", "false").lower() == "true"


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
