import asyncio
import logging
import os
import secrets
from collections.abc import AsyncIterable
from pathlib import Path
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.sse import EventSourceResponse, ServerSentEvent
from fastapi.staticfiles import StaticFiles

# Configure root logging once for the whole app.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import (
    AUTH_ENABLED,
    AUTH_PASSWORD,
    AUTH_USERNAME,
    CORS_ALLOW_ORIGIN_REGEX,
    CORS_ALLOW_ORIGINS,
    RATE_LIMIT,
)
from app.pipeline import run_events

logger = logging.getLogger("compose.api")

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="compose", version="0.1.0")
app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS,
    allow_origin_regex=CORS_ALLOW_ORIGIN_REGEX,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(_request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limited",
            "message": f"Too many requests. {exc.detail}. Try again shortly.",
        },
    )


# Basic Auth gate. When AUTH_ENABLED is False (env vars unset) the dependency
# is a no-op, so local dev keeps working without configuring credentials.
_security = HTTPBasic(auto_error=False)


def require_auth(
    credentials: Annotated[HTTPBasicCredentials | None, Depends(_security)],
) -> None:
    if not AUTH_ENABLED:
        return
    # Note: WWW-Authenticate: Basic is intentionally omitted. Including it would
    # trigger the browser's native HTTP-auth prompt on top of our custom UI.
    # The frontend AuthGate handles 401 itself.
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )
    user_ok = secrets.compare_digest(credentials.username, AUTH_USERNAME or "")
    pass_ok = secrets.compare_digest(credentials.password, AUTH_PASSWORD or "")
    if not (user_ok and pass_ok):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )


if not AUTH_ENABLED:
    logger.warning(
        "AUTH_USERNAME / AUTH_PASSWORD not set, /campaign is unauthenticated. "
        "Set both env vars in production.",
    )


class CampaignRequest(BaseModel):
    brief: str = Field(..., min_length=1, max_length=4000)


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.get("/auth/check")
def auth_check(_: Annotated[None, Depends(require_auth)] = None):
    """Cheap authenticated GET so the login UI can validate creds before storing them."""
    return {"ok": True}


@app.post("/campaign", response_class=EventSourceResponse)
@limiter.limit(RATE_LIMIT)
async def campaign(
    request: Request,
    body: CampaignRequest,
    _: Annotated[None, Depends(require_auth)] = None,
) -> AsyncIterable[ServerSentEvent]:
    brief = body.brief.strip()
    logger.info("campaign request received (brief len=%d)", len(brief))
    loop = asyncio.get_running_loop()

    # The pipeline is synchronous and makes blocking LLM HTTP calls. Run it in a
    # worker thread and bridge each yielded event back to this coroutine via a queue.
    queue: asyncio.Queue = asyncio.Queue()
    SENTINEL: object = object()

    def producer():
        try:
            for ev in run_events(brief):
                asyncio.run_coroutine_threadsafe(queue.put(ev), loop).result()
        except Exception as e:  # noqa: BLE001
            logger.exception("pipeline failed")
            err = {"type": "error", "message": f"{type(e).__name__}: {e}"}
            asyncio.run_coroutine_threadsafe(queue.put(err), loop).result()
        finally:
            asyncio.run_coroutine_threadsafe(queue.put(SENTINEL), loop).result()

    producer_task = loop.run_in_executor(None, producer)

    try:
        while True:
            ev = await queue.get()
            if ev is SENTINEL:
                break
            yield ServerSentEvent(event=ev["type"], data=ev)
    finally:
        await producer_task


# Serve the built frontend (production). In dev the directory does not exist
# and we skip the mount; Vite handles the UI on its own port.
# STATIC_DIR can be overridden via env, otherwise defaults to ../static relative
# to the backend (matches the Dockerfile layout).
_STATIC_DIR = Path(os.getenv("STATIC_DIR", Path(__file__).resolve().parent.parent / "static"))
if _STATIC_DIR.is_dir():
    # SPA fallback: any unknown GET path returns index.html so client-side routes work.
    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str):
        target = _STATIC_DIR / full_path
        if full_path and target.is_file():
            return FileResponse(target)
        return FileResponse(_STATIC_DIR / "index.html")

    app.mount("/", StaticFiles(directory=_STATIC_DIR, html=True), name="static")
    logger.info("serving frontend from %s", _STATIC_DIR)
else:
    logger.info("no static dir at %s, frontend served separately", _STATIC_DIR)
