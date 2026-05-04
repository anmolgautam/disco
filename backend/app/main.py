import asyncio
import logging
from collections.abc import AsyncIterable

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.sse import EventSourceResponse, ServerSentEvent

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

from app.config import CORS_ALLOW_ORIGIN_REGEX, CORS_ALLOW_ORIGINS, RATE_LIMIT
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


class CampaignRequest(BaseModel):
    brief: str = Field(..., min_length=1, max_length=4000)


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.post("/campaign", response_class=EventSourceResponse)
@limiter.limit(RATE_LIMIT)
async def campaign(request: Request, body: CampaignRequest) -> AsyncIterable[ServerSentEvent]:
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
