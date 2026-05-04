"""Pipeline runner. run_events() yields SSE-shaped dicts consumed by the API layer."""

import logging
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Iterator

from app.config import STAGE_PARALLELISM_WORKERS
from app.stages.stage_1_extract_brief import extract_brief
from app.stages.stage_2_adv_pub_fit import score_brief as score_pubs
from app.stages.stage_3_adv_persona_fit import score_brief as score_personas
from app.stages.stage_4_combine import combine
from app.stages.stage_5_creative_writing import write_creatives
from app.stages.stage_6_campaign_config import assemble_config

logger = logging.getLogger("compose.pipeline")


def _stage_event(stage_id: str, status: str, payload: Any = None, duration_ms: int | None = None) -> dict:
    out: dict = {"type": "stage", "stage_id": stage_id, "status": status}
    if payload is not None:
        out["payload"] = payload.model_dump() if hasattr(payload, "model_dump") else payload
    if duration_ms is not None:
        out["duration_ms"] = duration_ms
    return out


def run_events(oneliner: str) -> Iterator[dict]:
    logger.info("stage_1 extract_brief: start")
    yield _stage_event("extract_brief", "running")
    t0 = time.perf_counter()
    brief = extract_brief(oneliner).extracted_brief
    dt = int((time.perf_counter() - t0) * 1000)
    logger.info("stage_1 extract_brief: done in %dms (confidence=%s)", dt, brief.confidence)
    yield _stage_event("extract_brief", "complete", payload=brief, duration_ms=dt)

    # On a low-confidence brief, return clarifying questions instead of guessing.
    # Saves ~30 LLM calls and avoids generating noise downstream.
    if brief.confidence == "low":
        logger.info("low-confidence brief: returning clarifying_questions and skipping stages 2-6")
        yield {
            "type": "done",
            "status": "needs_clarification",
            "brief": brief.model_dump(),
            "clarifying_questions": brief.clarifying_questions,
        }
        return

    logger.info("stage_2 + stage_3: scoring 20 publishers + 10 personas in parallel")
    yield _stage_event("adv_pub_fit", "running")
    yield _stage_event("adv_persona_fit", "running")
    t0 = time.perf_counter()
    with ThreadPoolExecutor(max_workers=STAGE_PARALLELISM_WORKERS) as pool:
        pub_future = pool.submit(score_pubs, brief)
        persona_future = pool.submit(score_personas, brief)
        pub_matrix = pub_future.result()
        persona_matrix = persona_future.result()
    dt = int((time.perf_counter() - t0) * 1000)
    logger.info("stage_2 + stage_3: done in %dms", dt)
    yield _stage_event("adv_pub_fit", "complete", payload=pub_matrix, duration_ms=dt)
    yield _stage_event("adv_persona_fit", "complete", payload=persona_matrix, duration_ms=dt)

    logger.info("stage_4 combine: start")
    yield _stage_event("combine", "running")
    t0 = time.perf_counter()
    recommendation = combine(brief, pub_matrix, persona_matrix)
    dt = int((time.perf_counter() - t0) * 1000)
    logger.info(
        "stage_4 combine: done in %dms (%d selected, %d borderline, %d excluded)",
        dt,
        len(recommendation.recommended_publishers),
        len(recommendation.borderline_publishers),
        len(recommendation.excluded_publishers),
    )
    yield _stage_event("combine", "complete", payload=recommendation, duration_ms=dt)

    logger.info("stage_5 creative_writing: generating %d creatives", len(recommendation.recommended_personas))
    yield _stage_event("creative_writing", "running")
    t0 = time.perf_counter()
    creative_set = write_creatives(brief, recommendation.recommended_personas)
    dt = int((time.perf_counter() - t0) * 1000)
    logger.info("stage_5 creative_writing: done in %dms", dt)
    yield _stage_event("creative_writing", "complete", payload=creative_set, duration_ms=dt)

    logger.info("stage_6 campaign_config: start")
    yield _stage_event("campaign_config", "running")
    t0 = time.perf_counter()
    config = assemble_config(brief, recommendation, creative_set)
    dt = int((time.perf_counter() - t0) * 1000)
    logger.info("stage_6 campaign_config: done in %dms", dt)
    yield _stage_event("campaign_config", "complete", payload=config, duration_ms=dt)

    yield {
        "type": "done",
        "status": "complete",
        "brief": brief.model_dump(),
        "recommendation": recommendation.model_dump(),
        "creatives": creative_set.model_dump(),
        "config": config.model_dump(),
    }
