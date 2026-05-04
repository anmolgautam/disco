"""Stage 3: score the brief against all 10 personas and return an AdvPersonaFitMatrix."""

import json
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

from pydantic import ValidationError

from app.catalog import load_personas
from app.config import MAX_RETRIES, MAX_WORKERS, PROMPTS_DIR
from app.constants import SENSITIVITY_RANK
from app.hyperparameters import (
    PRICE_TIER_TO_EXPECTED_SENSITIVITY,
    STAGE_3_FIT_WEIGHTS,
)
from app.llm_caller import call_llm
from app.schemas import (
    AdvPersonaFitCell,
    AdvPersonaFitComponents,
    AdvPersonaFitLLMResponse,
    AdvPersonaFitMatrix,
    AdvPersonaFitReasons,
    CanonicalBrief,
    Persona,
)

logger = logging.getLogger("compose.stage_3")

SYSTEM_PROMPT = (PROMPTS_DIR / "stage_3_adv_persona_fit.txt").read_text()


def economic_fit(brief: CanonicalBrief, persona: Persona) -> float:
    expected = PRICE_TIER_TO_EXPECTED_SENSITIVITY.get(
        brief.price_tier.lower(),
        list(SENSITIVITY_RANK.keys()),
    )
    persona_sens = persona.price_sensitivity.lower()
    if persona_sens in expected:
        return 1.0
    persona_rank = SENSITIVITY_RANK.get(persona_sens, 2)
    expected_ranks = [SENSITIVITY_RANK.get(t, 2) for t in expected]
    closest = min(abs(persona_rank - r) for r in expected_ranks)
    max_distance = max(SENSITIVITY_RANK.values())
    return max(0.0, 1.0 - closest / max_distance)


def _format_brief(brief: CanonicalBrief) -> str:
    return (
        f"<brief>\n"
        f"product_or_service: {brief.product_or_service}\n"
        f"category: {brief.category}\n"
        f"subcategory_signals: {brief.subcategory_signals}\n"
        f"target_customer: {brief.target_customer}\n"
        f"value_props: {brief.value_props}\n"
        f"proof_or_features: {brief.proof_or_features}\n"
        f"positioning: {brief.positioning}\n"
        f"price_tier: {brief.price_tier}\n"
        f"business_model: {brief.business_model}\n"
        f"tone: {brief.tone}\n"
        f"constraints_or_risks: {brief.constraints_or_risks}\n"
        f"</brief>"
    )


def _format_persona(persona: Persona) -> str:
    return (
        f"<persona>\n"
        f"name: {persona.name}\n"
        f"age_range: {persona.age_range}\n"
        f"gender_skew: {persona.gender_skew}\n"
        f"description: {persona.description}\n"
        f"category_affinities: {persona.category_affinities}\n"
        f"price_sensitivity: {persona.price_sensitivity}\n"
        f"messaging_preferences: {persona.messaging_preferences}\n"
        f"disinterested_in: {persona.disinterested_in}\n"
        f"typical_aov_usd: {persona.typical_aov_usd}\n"
        f"</persona>"
    )


def call_llm_for_pair(brief: CanonicalBrief, persona: Persona) -> AdvPersonaFitLLMResponse:
    user_input = f"{_format_brief(brief)}\n\n{_format_persona(persona)}"
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        response = call_llm(SYSTEM_PROMPT, user_input)
        try:
            data = json.loads(response)
            return AdvPersonaFitLLMResponse(**data)
        except (json.JSONDecodeError, ValidationError) as e:
            last_error = e
            logger.warning("%s attempt %d/%d failed: %s: %s", persona.id, attempt, MAX_RETRIES, type(e).__name__, e)
    raise RuntimeError(f"LLM scoring failed for {persona.id}: {last_error}")


def score_pair(brief: CanonicalBrief, persona: Persona) -> AdvPersonaFitCell:
    econ = economic_fit(brief, persona)
    llm_response = call_llm_for_pair(brief, persona)
    s = llm_response.scores

    w = STAGE_3_FIT_WEIGHTS
    raw = (
        w["audience"] * s.audience
        + w["category"] * s.category
        + w["tone"] * s.tone
        + w["economic"] * econ
        - w["disinterest"] * s.disinterest
    )
    final = max(0.0, min(1.0, raw))

    economic_reason = (
        f"brief price_tier={brief.price_tier} vs persona price_sensitivity={persona.price_sensitivity}, "
        f"typical_aov=${persona.typical_aov_usd}"
    )

    return AdvPersonaFitCell(
        persona_id=persona.id,
        persona_name=persona.name,
        final_score=round(final, 3),
        components=AdvPersonaFitComponents(
            category=round(s.category, 3),
            audience=round(s.audience, 3),
            economic=round(econ, 3),
            tone=round(s.tone, 3),
            disinterest=round(s.disinterest, 3),
        ),
        reasons=AdvPersonaFitReasons(
            category_reason=s.category_reason,
            audience_reason=s.audience_reason,
            economic_reason=economic_reason,
            tone_reason=s.tone_reason,
            disinterest_reason=s.disinterest_reason,
            overall_thought=llm_response.overall_thought,
        ),
    )


def score_brief(brief: CanonicalBrief) -> AdvPersonaFitMatrix:
    personas = load_personas()
    cells: list[AdvPersonaFitCell] = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {pool.submit(score_pair, brief, p): p.id for p in personas}
        for fut in as_completed(futures):
            cells.append(fut.result())
    cells.sort(key=lambda c: c.final_score, reverse=True)
    return AdvPersonaFitMatrix(cells=cells)
