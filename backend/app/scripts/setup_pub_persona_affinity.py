"""Precompute the publisher x persona affinity matrix at build time.

Writes artifacts/affinity.json, loaded at request time by Stage 4.

Usage:
    python -m app.scripts.setup_pub_persona_affinity          # all 200 pairs
    python -m app.scripts.setup_pub_persona_affinity 5        # smoke test: first 5 pairs
"""

import json
import logging
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

from pydantic import ValidationError
from tqdm import tqdm

from app.catalog import load_personas, load_publishers
from app.config import ARTIFACTS_DIR, MAX_RETRIES, MAX_WORKERS, PROMPTS_DIR
from app.constants import INCOME_RANK, SENSITIVITY_RANK
from app.hyperparameters import AFFINITY_WEIGHTS
from app.llm_caller import call_llm
from app.schemas import (
    AffinityArtifact,
    AffinityCell,
    AffinityComponents,
    AffinityReasons,
    Persona,
    Publisher,
    SemanticScoresResponse,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s", datefmt="%H:%M:%S")
logger = logging.getLogger("compose.setup")

SYSTEM_PROMPT = (PROMPTS_DIR / "setup_pub_persona_affinity.txt").read_text()
ARTIFACT_PATH = ARTIFACTS_DIR / "affinity.json"


def _parse_age_range(s: str) -> tuple[int, int]:
    m = re.match(r"(\d+)\s*-\s*(\d+)", s)
    if m:
        return int(m.group(1)), int(m.group(2))
    m = re.match(r"(\d+)\s*\+", s)
    if m:
        return int(m.group(1)), 100
    return 0, 100


def age_overlap(pub_age: str, persona_age: str) -> float:
    a, b = _parse_age_range(pub_age)
    c, d = _parse_age_range(persona_age)
    inter = max(0, min(b, d) - max(a, c))
    union = max(b, d) - min(a, c)
    return inter / union if union > 0 else 0.0


def gender_alignment(pub_split: dict[str, float], persona_skew: str) -> float:
    f = pub_split.get("female", 0.5)
    skew = persona_skew.lower()
    if "balanced" in skew:
        return 1.0 - abs(f - 0.5) * 2
    if "female" in skew:
        return f  # higher female share = better
    if "male" in skew:
        return 1.0 - f
    return 0.5


def aov_similarity(pub_aov: float, persona_aov: float) -> float:
    if pub_aov <= 0 or persona_aov <= 0:
        return 0.0
    return min(pub_aov, persona_aov) / max(pub_aov, persona_aov)


def income_price_alignment(income_tier: str, price_sens: str) -> float:
    # Both ranks go from 0 (low income, high sensitivity) to a high value (high income,
    # low sensitivity), so smaller rank distance means better alignment.
    t = INCOME_RANK.get(income_tier.lower(), 1)
    s = SENSITIVITY_RANK.get(price_sens.lower(), 2)
    max_rank = max(max(INCOME_RANK.values()), max(SENSITIVITY_RANK.values()))
    return 1.0 - abs(t - s) / max_rank


def audience_numeric_overlap(pub: Publisher, persona: Persona) -> float:
    age = age_overlap(pub.audience.age_skew, persona.age_range)
    gender = gender_alignment(pub.audience.gender_split, persona.gender_skew)
    return (age + gender) / 2


def economic_overlap(pub: Publisher, persona: Persona) -> float:
    aov = aov_similarity(pub.avg_order_value_usd, persona.typical_aov_usd)
    income_price = income_price_alignment(pub.audience.income_tier, persona.price_sensitivity)
    return (aov + income_price) / 2


def _format_pub(pub: Publisher) -> str:
    return (
        f"<publisher>\n"
        f"name: {pub.name}\n"
        f"category: {pub.category}\n"
        f"subcategories: {pub.subcategories}\n"
        f"notes: {pub.notes}\n"
        f"</publisher>"
    )


def _format_persona(persona: Persona) -> str:
    return (
        f"<persona>\n"
        f"name: {persona.name}\n"
        f"description: {persona.description}\n"
        f"category_affinities: {persona.category_affinities}\n"
        f"messaging_preferences: {persona.messaging_preferences}\n"
        f"disinterested_in: {persona.disinterested_in}\n"
        f"</persona>"
    )


def call_llm_for_pair(pub: Publisher, persona: Persona) -> SemanticScoresResponse:
    user_input = f"{_format_pub(pub)}\n\n{_format_persona(persona)}"
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        response = call_llm(SYSTEM_PROMPT, user_input)
        try:
            data = json.loads(response)
            return SemanticScoresResponse(**data)
        except (json.JSONDecodeError, ValidationError) as e:
            last_error = e
            logger.warning(
                "%s x %s attempt %d/%d failed: %s: %s",
                pub.id, persona.id, attempt, MAX_RETRIES, type(e).__name__, e,
            )
    raise RuntimeError(f"LLM scoring failed for {pub.id} x {persona.id}: {last_error}")


def score_pair(pub: Publisher, persona: Persona) -> AffinityCell:
    aud_num = audience_numeric_overlap(pub, persona)
    econ = economic_overlap(pub, persona)
    sem_response = call_llm_for_pair(pub, persona)
    sem = sem_response.scores

    aud_combined = (aud_num + sem.audience_text_overlap) / 2

    w = AFFINITY_WEIGHTS
    raw = (
        w["category"] * sem.category_overlap
        + w["audience"] * aud_combined
        + w["economic"] * econ
        + w["messaging"] * sem.messaging_overlap
        - w["disinterest"] * sem.disinterest_penalty
    )
    final = max(0.0, min(1.0, raw))

    return AffinityCell(
        publisher_id=pub.id,
        publisher_name=pub.name,
        persona_id=persona.id,
        persona_name=persona.name,
        final_score=round(final, 3),
        components=AffinityComponents(
            category=round(sem.category_overlap, 3),
            audience_numeric=round(aud_num, 3),
            audience_text=round(sem.audience_text_overlap, 3),
            audience_combined=round(aud_combined, 3),
            economic=round(econ, 3),
            messaging=round(sem.messaging_overlap, 3),
            disinterest=round(sem.disinterest_penalty, 3),
        ),
        reasons=AffinityReasons(
            overall_thought=sem_response.thought,
            category_overlap_reason=sem.category_overlap_reason,
            audience_text_overlap_reason=sem.audience_text_overlap_reason,
            messaging_overlap_reason=sem.messaging_overlap_reason,
            disinterest_penalty_reason=sem.disinterest_penalty_reason,
        ),
    )


def main():
    publishers = load_publishers()
    personas = load_personas()
    pairs = [(pub, persona) for pub in publishers for persona in personas]

    if len(sys.argv) > 1:
        limit = int(sys.argv[1])
        pairs = pairs[:limit]
        logger.info("SMOKE TEST: limiting to first %d pairs", limit)

    logger.info("scoring %d pairs with max_workers=%d", len(pairs), MAX_WORKERS)

    cells: list[AffinityCell] = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {pool.submit(score_pair, pub, persona): (pub.id, persona.id) for pub, persona in pairs}
        for fut in tqdm(as_completed(futures), total=len(futures), desc="affinity"):
            cells.append(fut.result())

    cells.sort(key=lambda c: (c.publisher_id, c.persona_id))
    artifact = AffinityArtifact(cells=cells)

    ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    ARTIFACT_PATH.write_text(artifact.model_dump_json(indent=2))
    logger.info("wrote %d cells to %s", len(cells), ARTIFACT_PATH)

    top = sorted(cells, key=lambda c: c.final_score, reverse=True)[:5]
    bottom = sorted(cells, key=lambda c: c.final_score)[:5]
    logger.info("top 5 affinities:")
    for c in top:
        logger.info("  %.3f  %s x %s", c.final_score, c.publisher_name, c.persona_name)
    logger.info("bottom 5 affinities:")
    for c in bottom:
        logger.info("  %.3f  %s x %s", c.final_score, c.publisher_name, c.persona_name)


if __name__ == "__main__":
    main()
