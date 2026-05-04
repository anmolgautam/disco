from pydantic import BaseModel


class Audience(BaseModel):
    age_skew: str
    gender_split: dict[str, float]
    top_geos: list[str]
    income_tier: str


class Publisher(BaseModel):
    id: str
    name: str
    category: str
    subcategories: list[str]
    monthly_impressions: int
    avg_order_value_usd: float
    audience: Audience
    notes: str


class Persona(BaseModel):
    id: str
    name: str
    age_range: str
    gender_skew: str
    description: str
    category_affinities: list[str]
    price_sensitivity: str
    messaging_preferences: list[str]
    disinterested_in: list[str]
    typical_aov_usd: float


class CanonicalBrief(BaseModel):
    product_or_service: str | None
    category: str | None
    subcategory_signals: list[str]
    target_customer: str | None
    value_props: list[str]
    proof_or_features: list[str]
    positioning: str | None
    price_tier: str
    business_model: str
    tone: str | None
    constraints_or_risks: list[str]
    geo_intent: list[str]  # catalog vocab only: nationwide, US-East, US-Midwest, US-Northeast, US-South, US-West
    confidence: str
    assumptions: list[str]
    clarifying_questions: list[str]


class BriefExtractionResponse(BaseModel):
    thought: str
    extracted_brief: CanonicalBrief


class SemanticOverlapScores(BaseModel):
    category_overlap_reason: str
    category_overlap: float
    audience_text_overlap_reason: str
    audience_text_overlap: float
    messaging_overlap_reason: str
    messaging_overlap: float
    disinterest_penalty_reason: str
    disinterest_penalty: float


class SemanticScoresResponse(BaseModel):
    thought: str
    scores: SemanticOverlapScores


class AffinityComponents(BaseModel):
    category: float
    audience_numeric: float
    audience_text: float
    audience_combined: float
    economic: float
    messaging: float
    disinterest: float


class AffinityReasons(BaseModel):
    overall_thought: str
    category_overlap_reason: str
    audience_text_overlap_reason: str
    messaging_overlap_reason: str
    disinterest_penalty_reason: str


class AffinityCell(BaseModel):
    publisher_id: str
    publisher_name: str
    persona_id: str
    persona_name: str
    final_score: float
    components: AffinityComponents
    reasons: AffinityReasons


class AffinityArtifact(BaseModel):
    cells: list[AffinityCell]


# Field order in the LLM-facing models is load-bearing.
# Per-component reason comes BEFORE its score so the reasoning shapes the number
# (autoregressive). overall_thought comes LAST so it summarizes the scores rather
# than constraining them.
class AdvPubFitLLMScores(BaseModel):
    category_reason: str
    category: float
    audience_reason: str
    audience: float
    tone_reason: str
    tone: float
    risk_reason: str
    risk: float


class AdvPubFitLLMResponse(BaseModel):
    scores: AdvPubFitLLMScores
    overall_thought: str


class AdvPubFitComponents(BaseModel):
    category: float
    audience: float
    economic: float
    reach: float
    tone: float
    geo: float
    risk: float


class AdvPubFitReasons(BaseModel):
    category_reason: str
    audience_reason: str
    economic_reason: str
    reach_reason: str
    tone_reason: str
    geo_reason: str
    risk_reason: str
    overall_thought: str


class AdvPubFitCell(BaseModel):
    publisher_id: str
    publisher_name: str
    final_score: float
    components: AdvPubFitComponents
    reasons: AdvPubFitReasons
    monthly_impressions: int  # echoed from publisher; Stage 6 reads this for budget weighting


class AdvPubFitMatrix(BaseModel):
    cells: list[AdvPubFitCell]


class AdvPersonaFitLLMScores(BaseModel):
    category_reason: str
    category: float
    audience_reason: str
    audience: float
    tone_reason: str
    tone: float
    disinterest_reason: str
    disinterest: float


class AdvPersonaFitLLMResponse(BaseModel):
    scores: AdvPersonaFitLLMScores
    overall_thought: str


class AdvPersonaFitComponents(BaseModel):
    category: float
    audience: float
    economic: float
    tone: float
    disinterest: float


class AdvPersonaFitReasons(BaseModel):
    category_reason: str
    audience_reason: str
    economic_reason: str
    tone_reason: str
    disinterest_reason: str
    overall_thought: str


class AdvPersonaFitCell(BaseModel):
    persona_id: str
    persona_name: str
    final_score: float
    components: AdvPersonaFitComponents
    reasons: AdvPersonaFitReasons


class AdvPersonaFitMatrix(BaseModel):
    cells: list[AdvPersonaFitCell]


class PersonaReach(BaseModel):
    persona_id: str
    persona_name: str
    affinity_score: float


class PubReach(BaseModel):
    publisher_id: str
    publisher_name: str
    joint_score: float  # pub.final_score * persona.final_score * affinity[pub][persona]


class PublisherWithReach(BaseModel):
    cell: AdvPubFitCell
    top_personas_reached: list[PersonaReach]


class ExcludedPublisher(BaseModel):
    cell: AdvPubFitCell
    exclusion_reason: str


# Exposed on CampaignRecommendation so the UI can render dynamic copy
# (e.g. the empty-excluded explanation) using the real gates that ran.
class SelectionThresholds(BaseModel):
    confidence_used: str
    k_publishers: int
    k_personas: int
    exclusion_score_floor: float
    exclusion_risk_ceiling: float


class CampaignRecommendation(BaseModel):
    brief_summary: CanonicalBrief
    recommended_publishers: list[PublisherWithReach]
    borderline_publishers: list[PublisherWithReach]
    excluded_publishers: list[ExcludedPublisher]
    recommended_personas: list[AdvPersonaFitCell]
    borderline_personas: list[AdvPersonaFitCell]
    persona_pub_table: dict[str, list[PubReach]]
    selection_thresholds: SelectionThresholds
    # match_quality is "strong" | "moderate" | "weak" based on the top publisher's
    # final_score vs the exclusion floor. Frontend uses this to decide whether to
    # render a "best available, but the catalog doesn't really fit" banner.
    match_quality: str
    match_quality_note: str
    clarifying_questions: list[str]


# Stage 5 emits headline, body, cta, then reasoning. Reasoning AFTER is intentional:
# the creative is committed first and then justified, opposite of the score panels.
class Creative(BaseModel):
    persona_id: str
    persona_name: str
    headline: str
    body: str
    cta: str
    reasoning: str


class CreativeSet(BaseModel):
    creatives: list[Creative]


class TargetingConfig(BaseModel):
    publishers: list[str]
    personas: list[str]
    geos: list[str]


class BudgetAllocation(BaseModel):
    publisher_id: str
    publisher_name: str
    amount_usd: float
    share_pct: float
    rationale: str


class BidStrategy(BaseModel):
    bid_type: str
    max_bid_usd: float
    rationale: str


class CreativeAssignment(BaseModel):
    publisher_name: str
    persona_name: str
    creative_headline: str


class CampaignConfig(BaseModel):
    total_budget_usd: float
    targeting: TargetingConfig
    budget_allocation: list[BudgetAllocation]
    bid_strategy: BidStrategy
    creative_assignments: list[CreativeAssignment]
