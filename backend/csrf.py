import secrets
import os
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

CSRF_HEADER = "x-csrf-token"
CSRF_COOKIE = "csrf_token"

class CSRFMiddleware(BaseHTTPMiddleware):
    """Simple CSRF protection via double-submit cookie."""

    def __init__(self, app, *, cookie_secure: bool = False):
        super().__init__(app)
        self.cookie_secure = cookie_secure

    async def dispatch(self, request: Request, call_next):
        if (
            request.method not in ("GET", "HEAD", "OPTIONS", "TRACE")
            and os.environ.get("DISABLE_CSRF", "false").lower() != "true"
        ):
            cookie = request.cookies.get(CSRF_COOKIE)
            header = request.headers.get(CSRF_HEADER)
            if not cookie or not header or cookie != header:
                return Response(status_code=400, content="Invalid CSRF token")
        response = await call_next(request)
        # Set token if missing
        if CSRF_COOKIE not in request.cookies:
            token = secrets.token_urlsafe(16)
            response.set_cookie(CSRF_COOKIE, token, secure=self.cookie_secure, httponly=False)
        return response
