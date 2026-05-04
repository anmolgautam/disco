"""Tunable scoring weights and thresholds.

These are the values you'd sweep when tuning the system. Grouped by stage so each
stage's full weight vector is readable in one block.
"""

# Stage 2: advertiser x publisher fit
# Weighted sum of components, with "risk" subtracted.
STAGE_2_FIT_WEIGHTS: dict[str, float] = {
    "category": 0.30,
    "audience": 0.20,
    "tone":     0.15,
    "economic": 0.15,
    "geo":      0.10,
    "reach":    0.10,
    "risk":     0.40,  # subtracted
}

# Returned by economic_fit and geo_fit when the brief carries no signal.
# Neutral midpoint instead of a confident 0 or 1.
STAGE_2_NEUTRAL_FALLBACK_SCORE = 0.7

# Float ideals (e.g. premium=2.5) let economic_fit score by distance instead of
# bucket-membership. Avoids the saturate-at-1.0 trap a wide bucket would create.
PRICE_TIER_TO_IDEAL_INCOME_RANK: dict[str, float] = {
    "budget":  0.0,
    "value":   0.5,
    "mid":     1.0,
    "premium": 2.5,
    "luxury":  3.0,
}

# reach_fit log scaling. monthly_impressions = 10**FLOOR maps to 0.0, and
# 10**(FLOOR+RANGE) maps to 1.0. Defaults: 1M to 0, 100M to 1.
REACH_LOG10_FLOOR = 6.0
REACH_LOG10_RANGE = 2.0


# Stage 3: advertiser x persona fit
STAGE_3_FIT_WEIGHTS: dict[str, float] = {
    "audience":    0.30,
    "category":    0.25,
    "tone":        0.25,
    "economic":    0.20,
    "disinterest": 0.45,  # subtracted
}

# For each price_tier, the persona price_sensitivity values that count as an
# expected match. Misses are scored by ordinal distance to the nearest expected.
PRICE_TIER_TO_EXPECTED_SENSITIVITY: dict[str, list[str]] = {
    "budget":  ["high"],
    "value":   ["high", "medium-high", "medium"],
    "mid":     ["medium", "medium-high"],
    "premium": ["low", "low-medium"],
    "luxury":  ["low"],
    "unknown": ["low", "low-medium", "medium", "medium-high", "high"],
}


# Affinity setup: precomputed publisher x persona, build time
AFFINITY_WEIGHTS: dict[str, float] = {
    "category":    0.40,
    "audience":    0.20,
    "economic":    0.20,
    "messaging":   0.20,
    "disinterest": 0.25,  # subtracted
}


# Stage 4: selection and exclusion gates
# Higher confidence narrows K and tightens exclusion. Low-confidence briefs cast a wider net.
# Tuple shape: (k_pubs, k_personas, exclusion_score_floor, exclusion_risk_ceiling).
SELECTION_PARAMS: dict[str, tuple[int, int, float, float]] = {
    "high":    (3, 3, 0.20, 0.60),
    "medium":  (4, 4, 0.15, 0.70),
    "low":     (5, 5, 0.10, 0.80),
    "unknown": (5, 5, 0.10, 0.80),
}

# A persona is reachable through a publisher if their precomputed affinity meets this floor.
AFFINITY_THRESHOLD_FOR_REACH = 0.5

# How many publishers to surface per persona in the reach table.
TOP_REACHING_PUBS_PER_PERSONA = 3


# Stage 6: campaign config defaults
DEFAULT_TOTAL_BUDGET_USD = 50000.0

# Max bid by (price_tier, bid_type) bucket. _bid_strategy picks one based on
# business_model and price_tier.
BID_AMOUNTS_USD: dict[str, float] = {
    "subscription_cpa": 50.0,
    "luxury_cpm":       25.0,
    "premium_cpm":      18.0,
    "mid_cpc":           2.50,
    "value_cpc":         1.50,
    "budget_cpc":        1.00,
    "default_cpm":      12.0,
}
