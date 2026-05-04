"""Domain encodings. Fixed by definition, never learned and never changed across deploys."""

# Ordinal encoding (low to high). Used by economic-fit components to compute distance.
INCOME_RANK: dict[str, int] = {
    "low": 0,
    "mid": 1,
    "mid-high": 2,
    "high": 3,
}

# 0 = high sensitivity, 4 = low sensitivity. Same direction as INCOME_RANK
# (low income aligns with high price sensitivity), so identical ranks = aligned.
SENSITIVITY_RANK: dict[str, int] = {
    "high": 0,
    "medium-high": 1,
    "medium": 2,
    "low-medium": 3,
    "low": 4,
}
