"""Stage 4: combine the brief, the Stage 2/3 matrices, and the precomputed affinity. No LLM."""

import json

from app.config import ARTIFACTS_DIR
from app.hyperparameters import (
    AFFINITY_THRESHOLD_FOR_REACH,
    SELECTION_PARAMS,
    TOP_REACHING_PUBS_PER_PERSONA,
)
from app.schemas import (
    AdvPersonaFitMatrix,
    AdvPubFitMatrix,
    CampaignRecommendation,
    CanonicalBrief,
    ExcludedPublisher,
    PersonaReach,
    PubReach,
    PublisherWithReach,
    SelectionThresholds,
)

# AFFINITY_LOOKUP[publisher_id][persona_id] is a float in [0, 1]. Loaded once at import.
_RAW = json.loads((ARTIFACTS_DIR / "affinity.json").read_text())
AFFINITY_LOOKUP: dict[str, dict[str, float]] = {}
for cell in _RAW["cells"]:
    AFFINITY_LOOKUP.setdefault(cell["publisher_id"], {})[cell["persona_id"]] = cell["final_score"]


def combine(
    brief: CanonicalBrief,
    pub_matrix: AdvPubFitMatrix,
    persona_matrix: AdvPersonaFitMatrix,
) -> CampaignRecommendation:
    confidence = (brief.confidence or "unknown").lower()
    k_pubs, k_personas, excl_score, excl_risk = SELECTION_PARAMS.get(
        confidence, SELECTION_PARAMS["unknown"]
    )

    top_pubs = pub_matrix.cells[:k_pubs]
    top_personas = persona_matrix.cells[:k_personas]

    top_pub_ids = {c.publisher_id for c in top_pubs}
    excluded: list[ExcludedPublisher] = []
    for c in pub_matrix.cells:
        if c.publisher_id in top_pub_ids:
            continue
        if c.components.risk > excl_risk:
            excluded.append(ExcludedPublisher(
                cell=c,
                exclusion_reason=f"high risk ({c.components.risk:.2f} > {excl_risk:.2f} threshold)",
            ))
        elif c.final_score < excl_score:
            excluded.append(ExcludedPublisher(
                cell=c,
                exclusion_reason=f"low fit ({c.final_score:.2f} < {excl_score:.2f} threshold)",
            ))

    def _enrich(pub) -> PublisherWithReach:
        reaches: list[PersonaReach] = []
        for p in top_personas:
            aff = AFFINITY_LOOKUP.get(pub.publisher_id, {}).get(p.persona_id, 0.0)
            if aff >= AFFINITY_THRESHOLD_FOR_REACH:
                reaches.append(PersonaReach(
                    persona_id=p.persona_id,
                    persona_name=p.persona_name,
                    affinity_score=round(aff, 3),
                ))
        reaches.sort(key=lambda r: r.affinity_score, reverse=True)
        return PublisherWithReach(cell=pub, top_personas_reached=reaches)

    enriched_pubs: list[PublisherWithReach] = [_enrich(pub) for pub in top_pubs]

    excluded_ids = {e.cell.publisher_id for e in excluded}
    borderline_pubs: list[PublisherWithReach] = [
        _enrich(c)
        for c in pub_matrix.cells
        if c.publisher_id not in top_pub_ids and c.publisher_id not in excluded_ids
    ]

    borderline_personas = persona_matrix.cells[k_personas:]

    # match_quality: did the catalog actually serve this brief? Detects the case where
    # the brief is well-formed but the catalog has no real fit (e.g. B2B SaaS in a
    # consumer DTC network). Compared against the same floor used to exclude others.
    top_score = top_pubs[0].final_score if top_pubs else 0.0
    if top_score >= 0.50:
        match_quality = "strong"
        match_quality_note = ""
    elif top_score >= excl_score:
        match_quality = "moderate"
        match_quality_note = (
            f"The catalog has adjacent inventory but no obvious fit. "
            f"Top publisher scored {top_score:.2f}, above our exclusion floor of "
            f"{excl_score:.2f} but below the strong-match threshold."
        )
    else:
        match_quality = "weak"
        match_quality_note = (
            f"Best available match scored {top_score:.2f}, below our usual fit floor "
            f"of {excl_score:.2f}. The current publisher catalog probably doesn't "
            f"carry the kind of inventory typical for this brief. "
            f"Showing closest matches anyway, but expect lower performance."
        )

    # Triangle joint score: brand-publisher fit, brand-persona fit, and publisher-persona
    # affinity. All three edges multiplied so cells are cross-row comparable.
    persona_pub_table: dict[str, list[PubReach]] = {}
    for p in top_personas:
        candidates: list[PubReach] = []
        for pub in top_pubs:
            aff = AFFINITY_LOOKUP.get(pub.publisher_id, {}).get(p.persona_id, 0.0)
            joint = pub.final_score * p.final_score * aff
            candidates.append(PubReach(
                publisher_id=pub.publisher_id,
                publisher_name=pub.publisher_name,
                joint_score=round(joint, 3),
            ))
        candidates.sort(key=lambda r: r.joint_score, reverse=True)
        persona_pub_table[p.persona_id] = candidates[:TOP_REACHING_PUBS_PER_PERSONA]

    return CampaignRecommendation(
        brief_summary=brief,
        recommended_publishers=enriched_pubs,
        borderline_publishers=borderline_pubs,
        excluded_publishers=excluded,
        recommended_personas=top_personas,
        borderline_personas=borderline_personas,
        persona_pub_table=persona_pub_table,
        selection_thresholds=SelectionThresholds(
            confidence_used=confidence,
            k_publishers=k_pubs,
            k_personas=k_personas,
            exclusion_score_floor=excl_score,
            exclusion_risk_ceiling=excl_risk,
        ),
        match_quality=match_quality,
        match_quality_note=match_quality_note,
        # Only surface clarifying questions on the low-confidence early-exit path.
        clarifying_questions=brief.clarifying_questions if confidence == "low" else [],
    )
