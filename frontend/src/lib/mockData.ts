// Mock fixtures used by mockStream.ts to simulate a complete pipeline run.
// Modeled on the "premium dog food" example brief — the same canonical shape
// the real backend will return.

import type {
  AdvPersonaFitMatrix,
  AdvPubFitMatrix,
  CampaignConfig,
  CampaignRecommendation,
  CanonicalBrief,
  CreativeSet,
} from "../types";

// ---------------------------------------------------------------------------
// Stage 1 — Canonical Brief
// ---------------------------------------------------------------------------

export const MOCK_BRIEF: CanonicalBrief = {
  product_or_service: "premium dog food for senior dogs",
  category: "pet",
  subcategory_signals: ["pet_food", "senior_pets", "premium", "subscription"],
  target_customer:
    "older pet owners 35-60 who care deeply about pet health and longevity",
  value_props: ["joint health", "longevity", "vet-formulated nutrition"],
  proof_or_features: [
    "vet-formulated",
    "grain-free",
    "human-grade ingredients",
  ],
  positioning: "premium clinical",
  price_tier: "premium",
  business_model: "subscription",
  tone: "trustworthy and expert",
  constraints_or_risks: [
    "cheap-positioning publishers won't work",
    "avoid impulse-only channels",
  ],
  geo_intent: [],
  confidence: "high",
  assumptions: [
    "assumed premium positioning from vet-formulated and subscription cues",
  ],
  clarifying_questions: [],
};

// ---------------------------------------------------------------------------
// Stage 2 — Adv x Pub Fit Matrix (8 cells: 3 strong, 2 moderate, 3 weak)
// ---------------------------------------------------------------------------

export const MOCK_PUB_MATRIX: AdvPubFitMatrix = {
  cells: [
    {
      publisher_id: "pawline",
      publisher_name: "Pawline",
      final_score: 0.681,
      monthly_impressions: 4_800_000,
      components: {
        category: 0.92,
        audience: 0.78,
        economic: 1.0,
        reach: 0.34,
        tone: 0.82,
        geo: 0.7,
        risk: 0.05,
      },
      reasons: {
        category_reason:
          "Pawline is a pet-care-only publisher with strong subcategory overlap on senior pet content and subscription commerce.",
        audience_reason:
          "Audience skews 35-55, high-income pet owners with established care routines — direct match for the brief's target.",
        economic_reason:
          "brief price_tier=premium vs publisher income_tier=high — full match",
        reach_reason: "publisher monthly_impressions=4,800,000",
        tone_reason:
          "Editorial voice is calm, ingredient-focused, vet-cited — supports trustworthy and expert tone naturally.",
        geo_reason:
          "no geo intent in brief; neutral score applied",
        risk_reason:
          "Premium long-form pet editorial; no impulse channels or mass-market deal voice present.",
        overall_thought:
          "Pawline is the most direct fit in the catalog — a premium, vet-cited pet-care environment whose audience already values longevity and ingredient quality. The category match is near-perfect; reach is moderate but the audience quality compensates. Recommended top placement.",
      },
    },
    {
      publisher_id: "ruffco",
      publisher_name: "Ruffco",
      final_score: 0.612,
      monthly_impressions: 62_000_000,
      components: {
        category: 0.85,
        audience: 0.62,
        economic: 0.85,
        reach: 0.89,
        tone: 0.55,
        geo: 0.7,
        risk: 0.12,
      },
      reasons: {
        category_reason:
          "Pet-focused publisher with broad coverage including senior pet wellness segments.",
        audience_reason:
          "Audience trends slightly younger and more value-conscious than the brief's target, but pet ownership signal is strong.",
        economic_reason:
          "brief price_tier=premium vs publisher income_tier=mid-high — close match",
        reach_reason: "publisher monthly_impressions=62,000,000",
        tone_reason:
          "More casual and community-driven editorial; partial fit for the trustworthy-expert tone.",
        geo_reason: "no geo intent in brief; neutral score applied",
        risk_reason:
          "Some lifestyle/listicle content adjacency — minor but acceptable risk for a premium brand.",
        overall_thought:
          "Ruffco offers strong category fit with a much larger audience than Pawline, balancing premium positioning against scale. Tone is the weakest dimension but not disqualifying. A solid second placement that drives volume on top of Pawline's quality.",
      },
    },
    {
      publisher_id: "daily_form",
      publisher_name: "Daily Form",
      final_score: 0.534,
      monthly_impressions: 4_200_000,
      components: {
        category: 0.45,
        audience: 0.7,
        economic: 0.85,
        reach: 0.32,
        tone: 0.78,
        geo: 0.7,
        risk: 0.1,
      },
      reasons: {
        category_reason:
          "Wellness adjacent rather than pet-specific, but the audience overlaps with health-conscious pet owners.",
        audience_reason:
          "Audience is 30-50, high-income, evidence-minded — matches the brief's wellness optimizer overlap.",
        economic_reason:
          "brief price_tier=premium vs publisher income_tier=mid-high — close match",
        reach_reason: "publisher monthly_impressions=4,200,000",
        tone_reason:
          "Science-forward editorial voice fits the vet-formulated, evidence-based positioning well.",
        geo_reason: "no geo intent in brief; neutral score applied",
        risk_reason:
          "Wellness publisher with claims-aware editorial; appropriate environment for vet-cited claims.",
        overall_thought:
          "Daily Form reaches the wellness-optimizer persona that pet-only publishers miss. Category alignment is indirect but the audience and tone fit make it a complementary third placement that broadens persona coverage.",
      },
    },
    {
      publisher_id: "pantrygood",
      publisher_name: "Pantrygood",
      final_score: 0.402,
      monthly_impressions: 10_400_000,
      components: {
        category: 0.4,
        audience: 0.55,
        economic: 0.7,
        reach: 0.62,
        tone: 0.5,
        geo: 0.7,
        risk: 0.18,
      },
      reasons: {
        category_reason:
          "Grocery and pantry adjacency — pet food has presence but isn't the editorial focus.",
        audience_reason:
          "Family-shopper audience overlaps somewhat with pet owners but skews household-purchase rather than premium-pet-specific.",
        economic_reason:
          "brief price_tier=premium vs publisher income_tier=mid — partial match",
        reach_reason: "publisher monthly_impressions=10,400,000",
        tone_reason:
          "Practical, value-conscious tone — partial fit but not the trustworthy-expert voice the brief wants.",
        geo_reason: "no geo intent in brief; neutral score applied",
        risk_reason:
          "Grocery context can dilute premium positioning — minor risk.",
        overall_thought:
          "Pantrygood drives reach but at the cost of premium framing. A possible expansion publisher if the campaign needs more volume; not first-tier.",
      },
    },
    {
      publisher_id: "velvetline",
      publisher_name: "Velvetline",
      final_score: 0.328,
      monthly_impressions: 6_800_000,
      components: {
        category: 0.25,
        audience: 0.48,
        economic: 0.85,
        reach: 0.5,
        tone: 0.55,
        geo: 0.7,
        risk: 0.22,
      },
      reasons: {
        category_reason:
          "Beauty and lifestyle focus — minimal direct pet category alignment.",
        audience_reason:
          "Affluent female-skewed audience could include premium-pet buyers but isn't a pet-buyer-specific signal.",
        economic_reason:
          "brief price_tier=premium vs publisher income_tier=high — strong match",
        reach_reason: "publisher monthly_impressions=6,800,000",
        tone_reason:
          "Polished editorial voice; partial fit for trustworthy-expert.",
        geo_reason: "no geo intent in brief; neutral score applied",
        risk_reason:
          "Lifestyle context is fine but not particularly relevant — wasted impressions risk.",
        overall_thought:
          "Velvetline has the right income tier but the wrong category. Audience overlap is speculative rather than evidenced. Likely better held back.",
      },
    },
    {
      publisher_id: "heartfoot",
      publisher_name: "Heartfoot",
      final_score: 0.197,
      monthly_impressions: 2_800_000,
      components: {
        category: 0.15,
        audience: 0.35,
        economic: 0.5,
        reach: 0.22,
        tone: 0.4,
        geo: 0.7,
        risk: 0.3,
      },
      reasons: {
        category_reason:
          "Activewear and fitness — no meaningful pet category overlap.",
        audience_reason:
          "Younger fitness-focused audience does not align with the brief's 35-60 senior-dog-owner target.",
        economic_reason:
          "brief price_tier=premium vs publisher income_tier=mid — partial match",
        reach_reason: "publisher monthly_impressions=2,800,000",
        tone_reason:
          "Performance-driven editorial; weak tone fit for trustworthy-expert pet care.",
        geo_reason: "no geo intent in brief; neutral score applied",
        risk_reason:
          "Audience mismatch creates wasted impressions and weakens premium positioning.",
        overall_thought:
          "Heartfoot is the wrong audience and the wrong context. Below the recommended-publisher threshold.",
      },
    },
    {
      publisher_id: "trailhaus",
      publisher_name: "TrailHaus",
      final_score: 0.142,
      monthly_impressions: 3_200_000,
      components: {
        category: 0.1,
        audience: 0.32,
        economic: 0.85,
        reach: 0.26,
        tone: 0.4,
        geo: 0.7,
        risk: 0.4,
      },
      reasons: {
        category_reason:
          "Outdoor and hiking content — no pet category overlap.",
        audience_reason:
          "Active outdoor enthusiasts aren't a meaningful pet-food audience.",
        economic_reason:
          "brief price_tier=premium vs publisher income_tier=high — strong match",
        reach_reason: "publisher monthly_impressions=3,200,000",
        tone_reason:
          "Long-form expedition editorial; tone is wrong axis entirely.",
        geo_reason: "no geo intent in brief; neutral score applied",
        risk_reason:
          "Premium adjacency but category mismatch dominates the assessment.",
        overall_thought:
          "TrailHaus has premium audience quality but the category fit is fundamentally absent. Excluded.",
      },
    },
    {
      publisher_id: "marlowe",
      publisher_name: "Marlowe & Co.",
      final_score: 0.076,
      monthly_impressions: 8_400_000,
      components: {
        category: 0.18,
        audience: 0.5,
        economic: 0.85,
        reach: 0.55,
        tone: 0.4,
        geo: 0.7,
        risk: 0.85,
      },
      reasons: {
        category_reason:
          "Luxury fashion and editorial — no pet content category alignment.",
        audience_reason:
          "Luxury-leaning audience could overlap with premium pet buyers, but the editorial context isn't pet-relevant.",
        economic_reason:
          "brief price_tier=premium vs publisher income_tier=high — match",
        reach_reason: "publisher monthly_impressions=8,400,000",
        tone_reason:
          "Editorial fashion voice — wrong tone axis for vet-formulated pet care.",
        geo_reason: "no geo intent in brief; neutral score applied",
        risk_reason:
          "Brief constraint flags impulse-only and luxury-fashion-adjacent placements as off-strategy. High risk of brand dilution.",
        overall_thought:
          "Marlowe matches on income tier but actively conflicts with the brief's stated constraints. Excluded for risk, not just fit.",
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Stage 3 — Adv x Persona Fit Matrix (5 cells)
// ---------------------------------------------------------------------------

export const MOCK_PERSONA_MATRIX: AdvPersonaFitMatrix = {
  cells: [
    {
      persona_id: "pet_parent",
      persona_name: "The Pet Parent",
      final_score: 0.738,
      components: {
        category: 0.95,
        audience: 0.82,
        economic: 0.85,
        tone: 0.78,
        disinterest: 0.05,
      },
      reasons: {
        category_reason:
          "Direct match — premium pet food is the persona's core purchase category.",
        audience_reason:
          "Persona age range 32-58 and emotional pet-care signal align with the brief's target customer description.",
        economic_reason:
          "Persona's typical AOV supports premium pricing without resistance.",
        tone_reason:
          "Trustworthy-expert tone is the persona's preferred messaging style for pet care.",
        disinterest_reason:
          "Persona's disinterested_in list (cheap, mass-market) does not conflict with the brief.",
        overall_thought:
          "The Pet Parent is the bullseye persona — every dimension aligns. Strongest creative anchor for the campaign.",
      },
    },
    {
      persona_id: "wellness_optimizer",
      persona_name: "The Wellness Optimizer",
      final_score: 0.685,
      components: {
        category: 0.7,
        audience: 0.72,
        economic: 0.95,
        tone: 0.85,
        disinterest: 0.08,
      },
      reasons: {
        category_reason:
          "Wellness category overlaps with vet-formulated pet nutrition through evidence-based positioning.",
        audience_reason:
          "Optimizer profile (research-driven, high-income, ingredient-aware) maps strongly onto premium pet buyers.",
        economic_reason:
          "Low price sensitivity — pays for evidence-backed quality.",
        tone_reason:
          "Evidence-cited, science-forward tone is the persona's strongest preference.",
        disinterest_reason:
          "No conflicts with the persona's disinterests around novelty or unsupported claims.",
        overall_thought:
          "Wellness Optimizer extends the campaign beyond pet-only buyers into the broader health-conscious audience. Strong second persona.",
      },
    },
    {
      persona_id: "affluent_classic",
      persona_name: "The Affluent Classic",
      final_score: 0.612,
      components: {
        category: 0.55,
        audience: 0.78,
        economic: 1.0,
        tone: 0.72,
        disinterest: 0.12,
      },
      reasons: {
        category_reason:
          "Premium pet food fits the persona's pattern of buying quality across categories, even if pets aren't the core focus.",
        audience_reason:
          "Affluent 45-65 audience overlaps with the brief's older pet-owner segment.",
        economic_reason:
          "Highest income tier — premium pricing is well within range.",
        tone_reason:
          "Quiet, considered messaging matches the persona's preference for understated quality.",
        disinterest_reason:
          "Mild conflict on flashy or trend-driven framing; the brief's clinical positioning avoids this.",
        overall_thought:
          "Affluent Classic completes the persona triangle — captures the older, premium-buying segment that values quality over novelty.",
      },
    },
    {
      persona_id: "busy_parent",
      persona_name: "The Busy Parent",
      final_score: 0.421,
      components: {
        category: 0.45,
        audience: 0.55,
        economic: 0.65,
        tone: 0.42,
        disinterest: 0.18,
      },
      reasons: {
        category_reason:
          "Some pet ownership overlap but family-priorities dominate spend allocation.",
        audience_reason:
          "Audience overlaps with pet-owning parents but isn't pet-purchase-specific.",
        economic_reason:
          "Premium pricing creates friction against family budget tradeoffs.",
        tone_reason:
          "Persona prefers convenience-led messaging; trustworthy-expert is a partial fit at best.",
        disinterest_reason:
          "Mild conflict — premium framing can read as luxury, which the persona deprioritizes.",
        overall_thought:
          "Busy Parent is a possible secondary audience but not a top-three pick for this brief.",
      },
    },
    {
      persona_id: "convenience_first",
      persona_name: "The Convenience-First Millennial",
      final_score: 0.382,
      components: {
        category: 0.4,
        audience: 0.5,
        economic: 0.6,
        tone: 0.45,
        disinterest: 0.2,
      },
      reasons: {
        category_reason:
          "Subscription commerce overlaps strongly, but pet-food specifically is a smaller share of the persona's purchases.",
        audience_reason:
          "Younger urban-millennial profile partially overlaps with pet-owning DTC subscribers.",
        economic_reason:
          "Medium price sensitivity — premium pricing requires justification.",
        tone_reason:
          "Convenience-first messaging is preferred; trustworthy-expert tone needs adaptation.",
        disinterest_reason:
          "Persona's disinterest in slow fulfillment or multi-step purchase doesn't conflict directly.",
        overall_thought:
          "Convenience-First Millennial is a stretch for premium pet food specifically — better fit for mid-tier subscription pet brands.",
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Stage 4 — Recommendation (combines pubs + personas + affinity)
// ---------------------------------------------------------------------------

export const MOCK_RECOMMENDATION: CampaignRecommendation = {
  brief_summary: MOCK_BRIEF,
  recommended_publishers: [
    {
      cell: MOCK_PUB_MATRIX.cells[0],
      top_personas_reached: [
        { persona_id: "pet_parent", persona_name: "The Pet Parent", affinity_score: 0.87 },
        { persona_id: "affluent_classic", persona_name: "The Affluent Classic", affinity_score: 0.71 },
      ],
    },
    {
      cell: MOCK_PUB_MATRIX.cells[1],
      top_personas_reached: [
        { persona_id: "pet_parent", persona_name: "The Pet Parent", affinity_score: 0.78 },
        { persona_id: "wellness_optimizer", persona_name: "The Wellness Optimizer", affinity_score: 0.62 },
      ],
    },
    {
      cell: MOCK_PUB_MATRIX.cells[2],
      top_personas_reached: [
        { persona_id: "wellness_optimizer", persona_name: "The Wellness Optimizer", affinity_score: 0.91 },
        { persona_id: "affluent_classic", persona_name: "The Affluent Classic", affinity_score: 0.55 },
      ],
    },
  ],
  borderline_publishers: [
    { cell: MOCK_PUB_MATRIX.cells[3], top_personas_reached: [] },
    { cell: MOCK_PUB_MATRIX.cells[4], top_personas_reached: [] },
  ],
  excluded_publishers: [
    { cell: MOCK_PUB_MATRIX.cells[5], exclusion_reason: "low fit (0.20 < 0.20 score threshold)" },
    { cell: MOCK_PUB_MATRIX.cells[6], exclusion_reason: "low fit (0.14 < 0.20 score threshold)" },
    { cell: MOCK_PUB_MATRIX.cells[7], exclusion_reason: "high risk (0.85 > 0.60 risk threshold)" },
  ],
  recommended_personas: MOCK_PERSONA_MATRIX.cells.slice(0, 3),
  borderline_personas: MOCK_PERSONA_MATRIX.cells.slice(3, 5),
  selection_thresholds: {
    confidence_used: "high",
    k_publishers: 3,
    k_personas: 3,
    exclusion_score_floor: 0.20,
    exclusion_risk_ceiling: 0.60,
  },
  persona_pub_table: {
    pet_parent: [
      { publisher_id: "pawline", publisher_name: "Pawline", joint_score: 0.59 },
      { publisher_id: "ruffco", publisher_name: "Ruffco", joint_score: 0.48 },
      { publisher_id: "daily_form", publisher_name: "Daily Form", joint_score: 0.32 },
    ],
    wellness_optimizer: [
      { publisher_id: "daily_form", publisher_name: "Daily Form", joint_score: 0.51 },
      { publisher_id: "pawline", publisher_name: "Pawline", joint_score: 0.41 },
      { publisher_id: "ruffco", publisher_name: "Ruffco", joint_score: 0.38 },
    ],
    affluent_classic: [
      { publisher_id: "pawline", publisher_name: "Pawline", joint_score: 0.48 },
      { publisher_id: "ruffco", publisher_name: "Ruffco", joint_score: 0.21 },
      { publisher_id: "daily_form", publisher_name: "Daily Form", joint_score: 0.18 },
    ],
  },
  match_quality: "strong",
  match_quality_note: "",
  clarifying_questions: [],
};

// ---------------------------------------------------------------------------
// Stage 5 — Creatives (one per top persona)
// ---------------------------------------------------------------------------

export const MOCK_CREATIVES: CreativeSet = {
  creatives: [
    {
      persona_id: "pet_parent",
      persona_name: "The Pet Parent",
      headline: "Senior dogs deserve vet-formulated daily care.",
      body:
        "Made for older dogs, our premium food is vet-formulated to support senior health with nutrition tailored to their stage of life — so every bowl feels like a careful choice for someone you love.",
      cta: "Read the Formula",
      reasoning:
        "The headline centers on \"senior dogs\" because this persona shops as a caring pet parent — the phrase \"deserve\" leans into emotional connection without becoming sentimental. The body leads with vet-formulated nutrition because the persona reads labels and trusts veterinary credentials. \"Read the Formula\" matches research-driven buying behavior; she wants to inspect what she's purchasing before committing. I deliberately avoided bargain language and generic best-dog-food claims, both flagged in the persona's disinterested_in list.",
    },
    {
      persona_id: "wellness_optimizer",
      persona_name: "The Wellness Optimizer",
      headline: "Senior nutrition, optimized by veterinary expertise.",
      body:
        "Vet-formulated nutrition tailored to older dogs, built to support senior health with the same evidence-minded standards you use for your own routine — plus recurring delivery that keeps the plan consistent.",
      cta: "See the Formula",
      reasoning:
        "The headline borrows the persona's optimization mindset, using \"optimized\" and \"veterinary expertise\" to connect senior dog food to her science-backed approach. The body leads with the strongest proof point — vet-formulated, evidence-minded — and adds recurring delivery as a consistency benefit, not the main hook. \"See the Formula\" fits her evidence-seeking buying mode. I avoided novelty and trend language, both explicit turnoffs.",
    },
    {
      persona_id: "affluent_classic",
      persona_name: "The Affluent Classic",
      headline: "Senior nutrition. Quietly expert. Built to last.",
      body:
        "Vet-formulated for older dogs, our premium food supports the health that helps good years stay good. No fads, no flash — just quality nutrition made for a companion who has earned the very best.",
      cta: "Discover the Formula",
      reasoning:
        "The headline frames \"feel better\" as something considered rather than fashionable, matching the persona's preference for understated quality. The body uses the language of longevity and trust — quietly dependable, lasting. \"Discover the Formula\" matches a higher-AOV, low-price-sensitivity buyer who isn't being rushed. I deliberately avoided trendy language, loud aesthetics, and influencer-style social proof, all named in her disinterested_in list.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Stage 6 — Campaign Config
// ---------------------------------------------------------------------------

export const MOCK_CONFIG: CampaignConfig = {
  total_budget_usd: 50000,
  targeting: {
    publishers: ["Pawline", "Ruffco", "Daily Form"],
    personas: ["The Pet Parent", "The Wellness Optimizer", "The Affluent Classic"],
    geos: ["nationwide"],
  },
  budget_allocation: [
    {
      publisher_id: "pawline",
      publisher_name: "Pawline",
      amount_usd: 17767,
      share_pct: 35.5,
      rationale:
        "fit=0.68 x log10(reach=4,800,000) = weight 4.56",
    },
    {
      publisher_id: "ruffco",
      publisher_name: "Ruffco",
      amount_usd: 18443,
      share_pct: 36.9,
      rationale: "fit=0.61 x log10(reach=62,000,000) = weight 4.73",
    },
    {
      publisher_id: "daily_form",
      publisher_name: "Daily Form",
      amount_usd: 13790,
      share_pct: 27.6,
      rationale: "fit=0.53 x log10(reach=4,200,000) = weight 3.54",
    },
  ],
  bid_strategy: {
    bid_type: "CPA",
    max_bid_usd: 50,
    rationale:
      "Subscription business model. CPA optimizes for acquisition; LTV justifies a higher per-conversion cost than CPC/CPM bidding would target.",
  },
  creative_assignments: [
    { publisher_name: "Pawline", persona_name: "The Pet Parent", creative_headline: "Senior dogs deserve vet-formulated daily care." },
    { publisher_name: "Ruffco", persona_name: "The Pet Parent", creative_headline: "Senior dogs deserve vet-formulated daily care." },
    { publisher_name: "Daily Form", persona_name: "The Pet Parent", creative_headline: "Senior dogs deserve vet-formulated daily care." },
    { publisher_name: "Pawline", persona_name: "The Wellness Optimizer", creative_headline: "Senior nutrition, optimized by veterinary expertise." },
    { publisher_name: "Ruffco", persona_name: "The Wellness Optimizer", creative_headline: "Senior nutrition, optimized by veterinary expertise." },
    { publisher_name: "Daily Form", persona_name: "The Wellness Optimizer", creative_headline: "Senior nutrition, optimized by veterinary expertise." },
    { publisher_name: "Pawline", persona_name: "The Affluent Classic", creative_headline: "Senior nutrition. Quietly expert. Built to last." },
    { publisher_name: "Ruffco", persona_name: "The Affluent Classic", creative_headline: "Senior nutrition. Quietly expert. Built to last." },
    { publisher_name: "Daily Form", persona_name: "The Affluent Classic", creative_headline: "Senior nutrition. Quietly expert. Built to last." },
  ],
};
