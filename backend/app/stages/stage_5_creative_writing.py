"""Stage 5: generate one ad creative per top persona, in parallel."""

import json
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

from pydantic import ValidationError

from app.catalog import load_personas
from app.config import MAX_RETRIES, MAX_WORKERS, PROMPTS_DIR
from app.llm_caller import call_llm
from app.schemas import (
    AdvPersonaFitCell,
    CanonicalBrief,
    Creative,
    CreativeSet,
    Persona,
)

logger = logging.getLogger("compose.stage_5")

SYSTEM_PROMPT = (PROMPTS_DIR / "stage_5_creative_writing.txt").read_text()


def _format_brand(brief: CanonicalBrief) -> str:
    return (
        f"<brand>\n"
        f"product_or_service: {brief.product_or_service}\n"
        f"value_props: {brief.value_props}\n"
        f"proof_or_features: {brief.proof_or_features}\n"
        f"positioning: {brief.positioning}\n"
        f"tone: {brief.tone}\n"
        f"</brand>"
    )


def _format_persona(persona: Persona) -> str:
    return (
        f"<persona>\n"
        f"name: {persona.name}\n"
        f"description: {persona.description}\n"
        f"messaging_preferences: {persona.messaging_preferences}\n"
        f"disinterested_in: {persona.disinterested_in}\n"
        f"price_sensitivity: {persona.price_sensitivity}\n"
        f"</persona>"
    )


def call_llm_for_persona(brief: CanonicalBrief, persona: Persona) -> Creative:
    user_input = f"{_format_brand(brief)}\n\n{_format_persona(persona)}"
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        response = call_llm(SYSTEM_PROMPT, user_input)
        try:
            data = json.loads(response)
            return Creative(
                persona_id=persona.id,
                persona_name=persona.name,
                headline=data["headline"],
                body=data["body"],
                cta=data["cta"],
                reasoning=data["reasoning"],
            )
        except (json.JSONDecodeError, ValidationError, KeyError) as e:
            last_error = e
            logger.warning("%s attempt %d/%d failed: %s: %s", persona.id, attempt, MAX_RETRIES, type(e).__name__, e)
    raise RuntimeError(f"Creative generation failed for {persona.id}: {last_error}")


def write_creatives(brief: CanonicalBrief, top_personas: list[AdvPersonaFitCell]) -> CreativeSet:
    personas_by_id = {p.id: p for p in load_personas()}
    target_personas = [personas_by_id[c.persona_id] for c in top_personas]

    creatives: list[Creative] = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {pool.submit(call_llm_for_persona, brief, p): p.id for p in target_personas}
        for fut in as_completed(futures):
            creatives.append(fut.result())

    # Preserve the persona ranking order from Stages 3/4 (futures complete out of order).
    persona_order = {c.persona_id: i for i, c in enumerate(top_personas)}
    creatives.sort(key=lambda c: persona_order[c.persona_id])
    return CreativeSet(creatives=creatives)
