"""Stage 2: score the brief against all 20 publishers and return an AdvPubFitMatrix."""

import json
import logging
import math
from concurrent.futures import ThreadPoolExecutor, as_completed

from pydantic import ValidationError

from app.catalog import load_publishers
from app.config import MAX_RETRIES, MAX_WORKERS, PROMPTS_DIR
from app.constants import INCOME_RANK
from app.hyperparameters import (
    PRICE_TIER_TO_IDEAL_INCOME_RANK,
    REACH_LOG10_FLOOR,
    REACH_LOG10_RANGE,
    STAGE_2_FIT_WEIGHTS,
    STAGE_2_NEUTRAL_FALLBACK_SCORE,
)
from app.llm_caller import call_llm
from app.schemas import (
    AdvPubFitCell,
    AdvPubFitComponents,
    AdvPubFitLLMResponse,
    AdvPubFitMatrix,
    AdvPubFitReasons,
    CanonicalBrief,
    Publisher,
)

logger = logging.getLogger("compose.stage_2")

SYSTEM_PROMPT = (PROMPTS_DIR / "stage_2_adv_pub_fit.txt").read_text()

_MAX_INCOME_DISTANCE = max(INCOME_RANK.values())


def economic_fit(brief: CanonicalBrief, pub: Publisher) -> float:
    pt = (brief.price_tier or "unknown").lower()
    if pt not in PRICE_TIER_TO_IDEAL_INCOME_RANK:
        return STAGE_2_NEUTRAL_FALLBACK_SCORE
    ideal = PRICE_TIER_TO_IDEAL_INCOME_RANK[pt]
    pub_rank = INCOME_RANK.get(pub.audience.income_tier.lower(), 1)
    distance = abs(pub_rank - ideal)
    return max(0.0, 1.0 - distance / _MAX_INCOME_DISTANCE)


def reach_fit(pub: Publisher) -> float:
    if pub.monthly_impressions <= 0:
        return 0.0
    return max(0.0, min(1.0, (math.log10(pub.monthly_impressions) - REACH_LOG10_FLOOR) / REACH_LOG10_RANGE))


def geo_fit(extracted_geos: list[str], pub_geos: list[str]) -> float:
    if not extracted_geos:
        return STAGE_2_NEUTRAL_FALLBACK_SCORE
    pub_set = {g.lower() for g in pub_geos}
    matches = 0
    for g in extracted_geos:
        gl = g.lower()
        if gl in pub_set or any(gl in p or p in gl for p in pub_set):
            matches += 1
    return matches / len(extracted_geos)


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


def _format_publisher(pub: Publisher) -> str:
    a = pub.audience
    return (
        f"<publisher>\n"
        f"name: {pub.name}\n"
        f"category: {pub.category}\n"
        f"subcategories: {pub.subcategories}\n"
        f"audience: age_skew={a.age_skew}, gender_split={a.gender_split}, "
        f"income_tier={a.income_tier}, top_geos={a.top_geos}\n"
        f"notes: {pub.notes}\n"
        f"</publisher>"
    )


def call_llm_for_pair(brief: CanonicalBrief, pub: Publisher) -> AdvPubFitLLMResponse:
    user_input = f"{_format_brief(brief)}\n\n{_format_publisher(pub)}"
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        response = call_llm(SYSTEM_PROMPT, user_input)
        try:
            data = json.loads(response)
            return AdvPubFitLLMResponse(**data)
        except (json.JSONDecodeError, ValidationError) as e:
            last_error = e
            logger.warning("%s attempt %d/%d failed: %s: %s", pub.id, attempt, MAX_RETRIES, type(e).__name__, e)
    raise RuntimeError(f"LLM scoring failed for {pub.id}: {last_error}")


def score_pair(brief: CanonicalBrief, pub: Publisher) -> AdvPubFitCell:
    econ = economic_fit(brief, pub)
    reach = reach_fit(pub)
    llm_response = call_llm_for_pair(brief, pub)
    s = llm_response.scores
    geo = geo_fit(brief.geo_intent, pub.audience.top_geos)

    w = STAGE_2_FIT_WEIGHTS
    raw = (
        w["category"] * s.category
        + w["audience"] * s.audience
        + w["tone"] * s.tone
        + w["economic"] * econ
        + w["geo"] * geo
        + w["reach"] * reach
        - w["risk"] * s.risk
    )
    final = max(0.0, min(1.0, raw))

    geo_reason = (
        f"brief implies geos {brief.geo_intent}; publisher serves {pub.audience.top_geos}"
        if brief.geo_intent
        else "no geo intent in brief; neutral score applied"
    )
    economic_reason = (
        f"brief price_tier={brief.price_tier} vs publisher income_tier={pub.audience.income_tier}"
    )
    reach_reason = f"publisher monthly_impressions={pub.monthly_impressions:,}"

    return AdvPubFitCell(
        publisher_id=pub.id,
        publisher_name=pub.name,
        final_score=round(final, 3),
        components=AdvPubFitComponents(
            category=round(s.category, 3),
            audience=round(s.audience, 3),
            economic=round(econ, 3),
            reach=round(reach, 3),
            tone=round(s.tone, 3),
            geo=round(geo, 3),
            risk=round(s.risk, 3),
        ),
        reasons=AdvPubFitReasons(
            category_reason=s.category_reason,
            audience_reason=s.audience_reason,
            economic_reason=economic_reason,
            reach_reason=reach_reason,
            tone_reason=s.tone_reason,
            geo_reason=geo_reason,
            risk_reason=s.risk_reason,
            overall_thought=llm_response.overall_thought,
        ),
        monthly_impressions=pub.monthly_impressions,
    )


def score_brief(brief: CanonicalBrief) -> AdvPubFitMatrix:
    publishers = load_publishers()
    cells: list[AdvPubFitCell] = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {pool.submit(score_pair, brief, pub): pub.id for pub in publishers}
        for fut in as_completed(futures):
            cells.append(fut.result())
    cells.sort(key=lambda c: c.final_score, reverse=True)
    return AdvPubFitMatrix(cells=cells)
