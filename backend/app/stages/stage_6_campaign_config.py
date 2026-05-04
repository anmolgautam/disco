"""Stage 6: assemble a CampaignConfig from the brief, recommendation, and creatives. No LLM."""

import math

from app.hyperparameters import BID_AMOUNTS_USD, DEFAULT_TOTAL_BUDGET_USD
from app.schemas import (
    BidStrategy,
    BudgetAllocation,
    CampaignConfig,
    CampaignRecommendation,
    CanonicalBrief,
    CreativeAssignment,
    CreativeSet,
    TargetingConfig,
)


def _bid_strategy(brief: CanonicalBrief) -> BidStrategy:
    # Subscription is checked first because LTV math (CPA) dominates the price_tier
    # signal. A premium subscription should still bid CPA, not CPM.
    bm = (brief.business_model or "unknown").lower()
    pt = (brief.price_tier or "unknown").lower()

    if bm == "subscription":
        return BidStrategy(
            bid_type="CPA",
            max_bid_usd=BID_AMOUNTS_USD["subscription_cpa"],
            rationale="Subscription business model. CPA optimizes for acquisition; LTV justifies a higher per-conversion cost than CPC/CPM bidding would target.",
        )

    if pt in ("luxury", "premium"):
        max_bid = BID_AMOUNTS_USD["luxury_cpm"] if pt == "luxury" else BID_AMOUNTS_USD["premium_cpm"]
        return BidStrategy(
            bid_type="CPM",
            max_bid_usd=max_bid,
            rationale=f"price_tier={pt} + one-time purchase. CPM bidding prioritizes brand-environment quality over per-click optimization, which aligns with premium positioning.",
        )

    if pt in ("mid", "value"):
        max_bid = BID_AMOUNTS_USD["mid_cpc"] if pt == "mid" else BID_AMOUNTS_USD["value_cpc"]
        return BidStrategy(
            bid_type="CPC",
            max_bid_usd=max_bid,
            rationale=f"price_tier={pt} + one-time purchase. CPC bidding optimizes for performance, every click is paid for, so unit economics stay tight.",
        )

    if pt == "budget":
        return BidStrategy(
            bid_type="CPC",
            max_bid_usd=BID_AMOUNTS_USD["budget_cpc"],
            rationale="price_tier=budget. CPC bidding with a low max_bid keeps unit economics tight on a low-margin product.",
        )

    return BidStrategy(
        bid_type="CPM",
        max_bid_usd=BID_AMOUNTS_USD["default_cpm"],
        rationale=f"Default safe CPM (price_tier={pt}, business_model={bm} did not match a specific lookup).",
    )


def _budget_allocation(
    recommendation: CampaignRecommendation,
    total_budget: float,
) -> list[BudgetAllocation]:
    # weight[pub] = fit_score * log10(monthly_impressions). Budget is proportional
    # to each publisher's share of total weight.
    pubs = recommendation.recommended_publishers
    if not pubs:
        return []

    weights: dict[str, float] = {}
    for pub_with in pubs:
        cell = pub_with.cell
        impressions = max(1, cell.monthly_impressions)
        weights[cell.publisher_id] = cell.final_score * math.log10(impressions)

    total_weight = sum(weights.values()) or 1.0
    allocations: list[BudgetAllocation] = []
    for pub_with in pubs:
        cell = pub_with.cell
        share = weights[cell.publisher_id] / total_weight
        allocations.append(BudgetAllocation(
            publisher_id=cell.publisher_id,
            publisher_name=cell.publisher_name,
            amount_usd=round(total_budget * share, 2),
            share_pct=round(share * 100, 1),
            rationale=(
                f"fit={cell.final_score:.2f} x log10(reach={cell.monthly_impressions:,}) "
                f"= weight {weights[cell.publisher_id]:.2f}"
            ),
        ))
    return allocations


def _creative_assignments(
    recommendation: CampaignRecommendation,
    creative_set: CreativeSet,
) -> list[CreativeAssignment]:
    creatives_by_persona = {c.persona_id: c for c in creative_set.creatives}
    persona_names_by_id = {p.persona_id: p.persona_name for p in recommendation.recommended_personas}

    assignments: list[CreativeAssignment] = []
    for persona_id, pub_reaches in recommendation.persona_pub_table.items():
        creative = creatives_by_persona.get(persona_id)
        if not creative:
            continue
        persona_name = persona_names_by_id.get(persona_id, persona_id)
        for pr in pub_reaches:
            assignments.append(CreativeAssignment(
                publisher_name=pr.publisher_name,
                persona_name=persona_name,
                creative_headline=creative.headline,
            ))
    return assignments


def assemble_config(
    brief: CanonicalBrief,
    recommendation: CampaignRecommendation,
    creative_set: CreativeSet,
    total_budget_usd: float = DEFAULT_TOTAL_BUDGET_USD,
) -> CampaignConfig:
    targeting = TargetingConfig(
        publishers=[p.cell.publisher_name for p in recommendation.recommended_publishers],
        personas=[p.persona_name for p in recommendation.recommended_personas],
        geos=brief.geo_intent or ["nationwide"],
    )

    return CampaignConfig(
        total_budget_usd=total_budget_usd,
        targeting=targeting,
        budget_allocation=_budget_allocation(recommendation, total_budget_usd),
        bid_strategy=_bid_strategy(brief),
        creative_assignments=_creative_assignments(recommendation, creative_set),
    )
