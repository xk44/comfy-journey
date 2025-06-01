import os
import hmac
import hashlib
import base64
import time
from fastapi import Request, HTTPException, Depends
from typing import Any

try:  # Optional import to avoid dependency issues during testing
    from .auth import get_current_active_user, UserInDB
except Exception:  # pragma: no cover - fallback if auth deps missing
    get_current_active_user = lambda: None  # type: ignore
    UserInDB = Any  # type: ignore

CSRF_SECRET = os.environ.get("CSRF_SECRET", os.environ.get("SECRET_KEY", "secret"))
CSRF_TTL = int(os.environ.get("CSRF_TTL", "3600"))
CSRF_ENABLED = os.environ.get("CSRF_ENABLED", "false").lower() == "true"


def generate_csrf_token(session_id: str) -> str:
    ts = str(int(time.time()))
    data = f"{session_id}:{ts}".encode()
    sig = hmac.new(CSRF_SECRET.encode(), data, hashlib.sha256).digest()
    return base64.urlsafe_b64encode(data + b"." + sig).decode()


def validate_csrf_token(session_id: str, token: str) -> bool:
    try:
        decoded = base64.urlsafe_b64decode(token.encode())
        data, sig = decoded.rsplit(b".", 1)
        expected = hmac.new(CSRF_SECRET.encode(), data, hashlib.sha256).digest()
        if not hmac.compare_digest(expected, sig):
            return False
        sid, ts = data.decode().split(":")
        if sid != session_id:
            return False
        if time.time() - int(ts) > CSRF_TTL:
            return False
        return True
    except Exception:
        return False


async def csrf_protect(
    request: Request, current_user: UserInDB = Depends(get_current_active_user)
):
    if not CSRF_ENABLED or request.method in {"GET", "OPTIONS", "HEAD"}:
        return
    token = request.headers.get("X-CSRF-Token")
    if not token or not validate_csrf_token(current_user.id, token):
        raise HTTPException(status_code=403, detail="invalid_csrf_token")
