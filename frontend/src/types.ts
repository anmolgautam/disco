// TypeScript mirror of backend/app/schemas.py.
// Keep field names exactly aligned with the Pydantic models — the SSE payloads
// pass through verbatim. If the backend schema drifts, update this file too.

// ---- Stage 1: Canonical Brief ----------------------------------------------

export type Confidence = "high" | "medium" | "low";
export type Geo =
  | "nationwide"
  | "US-East"
  | "US-Midwest"
  | "US-Northeast"
  | "US-South"
  | "US-West";

export interface CanonicalBrief {
  product_or_service: string | null;
  category: string | null;
  subcategory_signals: string[];
  target_customer: string | null;
  value_props: string[];
  proof_or_features: string[];
  positioning: string | null;
  price_tier: string;
  business_model: string;
  tone: string | null;
  constraints_or_risks: string[];
  geo_intent: Geo[];
  confidence: Confidence;
  assumptions: string[];
  clarifying_questions: string[];
}

// ---- Stage 2: Adv x Pub Fit -------------------------------------------------

export interface AdvPubFitComponents {
  category: number;
  audience: number;
  economic: number;
  reach: number;
  tone: number;
  geo: number;
  risk: number;
}

export interface AdvPubFitReasons {
  category_reason: string;
  audience_reason: string;
  economic_reason: string;
  reach_reason: string;
  tone_reason: string;
  geo_reason: string;
  risk_reason: string;
  overall_thought: string;
}

export interface AdvPubFitCell {
  publisher_id: string;
  publisher_name: string;
  final_score: number;
  components: AdvPubFitComponents;
  reasons: AdvPubFitReasons;
  monthly_impressions: number;
}

export interface AdvPubFitMatrix {
  cells: AdvPubFitCell[];
}

// ---- Stage 3: Adv x Persona Fit --------------------------------------------

export interface AdvPersonaFitComponents {
  category: number;
  audience: number;
  economic: number;
  tone: number;
  disinterest: number;
}

export interface AdvPersonaFitReasons {
  category_reason: string;
  audience_reason: string;
  economic_reason: string;
  tone_reason: string;
  disinterest_reason: string;
  overall_thought: string;
}

export interface AdvPersonaFitCell {
  persona_id: string;
  persona_name: string;
  final_score: number;
  components: AdvPersonaFitComponents;
  reasons: AdvPersonaFitReasons;
}

export interface AdvPersonaFitMatrix {
  cells: AdvPersonaFitCell[];
}

// ---- Stage 4: Combine -------------------------------------------------------

export interface PersonaReach {
  persona_id: string;
  persona_name: string;
  affinity_score: number;
}

export interface PubReach {
  publisher_id: string;
  publisher_name: string;
  joint_score: number;
}

export interface PublisherWithReach {
  cell: AdvPubFitCell;
  top_personas_reached: PersonaReach[];
}

export interface ExcludedPublisher {
  cell: AdvPubFitCell;
  exclusion_reason: string;
}

export interface SelectionThresholds {
  confidence_used: string; // "high" | "medium" | "low" | "unknown"
  k_publishers: number;
  k_personas: number;
  exclusion_score_floor: number;
  exclusion_risk_ceiling: number;
}

export type MatchQuality = "strong" | "moderate" | "weak";

export interface CampaignRecommendation {
  brief_summary: CanonicalBrief;
  recommended_publishers: PublisherWithReach[];
  borderline_publishers: PublisherWithReach[]; // ranked below top-K but not flagged
  excluded_publishers: ExcludedPublisher[];
  recommended_personas: AdvPersonaFitCell[];
  borderline_personas: AdvPersonaFitCell[];   // ranked below top-K
  persona_pub_table: Record<string, PubReach[]>; // persona_id -> ranked pubs
  selection_thresholds: SelectionThresholds;  // gates Stage 4 applied
  match_quality: MatchQuality;                // catalog-fit signal driven by top score
  match_quality_note: string;                 // empty when strong, explanatory otherwise
  clarifying_questions: string[];
}

// ---- Stage 5: Creative ------------------------------------------------------

export interface Creative {
  persona_id: string;
  persona_name: string;
  headline: string;
  body: string;
  cta: string;
  reasoning: string;
}

export interface CreativeSet {
  creatives: Creative[];
}

// ---- Stage 6: Campaign Config ----------------------------------------------

export interface TargetingConfig {
  publishers: string[];
  personas: string[];
  geos: string[];
}

export interface BudgetAllocation {
  publisher_id: string;
  publisher_name: string;
  amount_usd: number;
  share_pct: number;
  rationale: string;
}

export interface BidStrategy {
  bid_type: "CPM" | "CPC" | "CPA";
  max_bid_usd: number;
  rationale: string;
}

export interface CreativeAssignment {
  publisher_name: string;
  persona_name: string;
  creative_headline: string;
}

export interface CampaignConfig {
  total_budget_usd: number;
  targeting: TargetingConfig;
  budget_allocation: BudgetAllocation[];
  bid_strategy: BidStrategy;
  creative_assignments: CreativeAssignment[];
}

// ---- SSE Event Protocol -----------------------------------------------------

export type StageId =
  | "extract_brief"
  | "adv_pub_fit"
  | "adv_persona_fit"
  | "combine"
  | "creative_writing"
  | "campaign_config";

export type StageStatus = "running" | "complete" | "error";

// Per-stage payload type discriminated by stage_id when status === "complete".
export type StagePayload =
  | { stage_id: "extract_brief"; payload: CanonicalBrief }
  | { stage_id: "adv_pub_fit"; payload: AdvPubFitMatrix }
  | { stage_id: "adv_persona_fit"; payload: AdvPersonaFitMatrix }
  | { stage_id: "combine"; payload: CampaignRecommendation }
  | { stage_id: "creative_writing"; payload: CreativeSet }
  | { stage_id: "campaign_config"; payload: CampaignConfig };

export interface StageEvent {
  stage_id: StageId;
  name: string;
  status: StageStatus;
  duration_ms?: number;
  payload?: unknown;
  error?: string;
}

export type DoneEvent =
  | {
      status: "complete";
      brief: CanonicalBrief;
      recommendation: CampaignRecommendation;
      creatives: CreativeSet;
      config: CampaignConfig;
    }
  | {
      status: "needs_clarification";
      brief: CanonicalBrief;
      clarifying_questions: string[];
    };

// ---- Frontend-only runtime state -------------------------------------------

export interface UIStageState {
  stage_id: StageId;
  name: string;
  status: "waiting" | "running" | "complete" | "error";
  duration_ms?: number;
  payload?: unknown;
  error?: string;
}

export const STAGES_DEFINITION: { stage_id: StageId; name: string }[] = [
  { stage_id: "extract_brief", name: "Understanding your brief" },
  { stage_id: "adv_pub_fit", name: "Scoring publishers" },
  { stage_id: "adv_persona_fit", name: "Selecting personas" },
  { stage_id: "combine", name: "Combining recommendations" },
  { stage_id: "creative_writing", name: "Writing creatives" },
  { stage_id: "campaign_config", name: "Assembling campaign config" },
];
