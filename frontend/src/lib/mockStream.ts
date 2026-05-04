// Mock SSE stream that simulates a real ~45s pipeline run.
// Drop-in replacement for the future real EventSource — same event shape.
//
// Event protocol (matches the locked SSE protocol in engineering.md):
//   event: 'stage' { stage_id, name, status: 'running' | 'complete', duration_ms?, payload? }
//   event: 'done'  { status: 'complete', brief, recommendation, creatives, config }

import type { CanonicalBrief, DoneEvent, StageEvent, StageId } from "../types";
import {
  MOCK_BRIEF,
  MOCK_CONFIG,
  MOCK_CREATIVES,
  MOCK_PERSONA_MATRIX,
  MOCK_PUB_MATRIX,
  MOCK_RECOMMENDATION,
} from "./mockData";

// Toggle for development convenience — divides all timings by 10 (~5s full run).
export const FAST_MODE = false;
const SCALE = FAST_MODE ? 0.1 : 1;

type Yielded =
  | { event: "stage"; data: StageEvent }
  | { event: "done"; data: DoneEvent };

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms * SCALE));
}

const NAMES: Record<StageId, string> = {
  extract_brief: "Understanding your brief",
  adv_pub_fit: "Scoring publishers",
  adv_persona_fit: "Selecting personas",
  combine: "Combining recommendations",
  creative_writing: "Writing creatives",
  campaign_config: "Assembling campaign config",
};

const PAYLOAD_BY_STAGE: Record<StageId, unknown> = {
  extract_brief: MOCK_BRIEF,
  adv_pub_fit: MOCK_PUB_MATRIX,
  adv_persona_fit: MOCK_PERSONA_MATRIX,
  combine: MOCK_RECOMMENDATION,
  creative_writing: MOCK_CREATIVES,
  campaign_config: MOCK_CONFIG,
};

function runningEvent(stage_id: StageId): Yielded {
  return {
    event: "stage",
    data: { stage_id, name: NAMES[stage_id], status: "running" },
  };
}

function completeEvent(stage_id: StageId, duration_ms: number): Yielded {
  return {
    event: "stage",
    data: {
      stage_id,
      name: NAMES[stage_id],
      status: "complete",
      duration_ms,
      payload: PAYLOAD_BY_STAGE[stage_id],
    },
  };
}

/**
 * The mock async generator. Awaits realistic timings between events so the
 * UI gets to render its in-progress states.
 */
export async function* mockCampaignStream(
  _brief: string
): AsyncGenerator<Yielded, void, unknown> {
  // Stage 1 — extract brief (~1.2s)
  yield runningEvent("extract_brief");
  await sleep(1200);
  yield completeEvent("extract_brief", 1200);

  // Stages 2 + 3 — parallel, different durations.
  // Pub fit takes ~14s, persona fit takes ~8s. Persona finishes first.
  yield runningEvent("adv_pub_fit");
  yield runningEvent("adv_persona_fit");

  await sleep(8000);
  yield completeEvent("adv_persona_fit", 8000);

  await sleep(6000); // 8000 + 6000 = 14000 total since they started together
  yield completeEvent("adv_pub_fit", 14000);

  // Stage 4 — combine (~50ms)
  yield runningEvent("combine");
  await sleep(50);
  yield completeEvent("combine", 50);

  // Stage 5 — creative writing (~12s)
  yield runningEvent("creative_writing");
  await sleep(12000);
  yield completeEvent("creative_writing", 12000);

  // Stage 6 — campaign config (~5ms)
  yield runningEvent("campaign_config");
  await sleep(5);
  yield completeEvent("campaign_config", 5);

  // Final done event with the full assembled result.
  const done: Yielded = {
    event: "done",
    data: {
      status: "complete",
      brief: MOCK_BRIEF as CanonicalBrief,
      recommendation: MOCK_RECOMMENDATION,
      creatives: MOCK_CREATIVES,
      config: MOCK_CONFIG,
    },
  };
  yield done;
}

/**
 * Mock for the low-confidence branch — bails after Stage 1 with clarifying
 * questions. Used by state #5 testing later.
 */
export async function* mockClarifyingStream(
  _brief: string
): AsyncGenerator<Yielded, void, unknown> {
  yield runningEvent("extract_brief");
  await sleep(1100);

  const lowConfBrief: CanonicalBrief = {
    ...MOCK_BRIEF,
    product_or_service: null,
    category: null,
    subcategory_signals: [],
    target_customer: null,
    value_props: [],
    proof_or_features: [],
    positioning: null,
    price_tier: "unknown",
    business_model: "unknown",
    tone: null,
    constraints_or_risks: [],
    geo_intent: [],
    confidence: "low",
    assumptions: [],
    clarifying_questions: [
      "What specific product or service do you offer?",
      "Who is the primary target customer?",
      "What problem do you solve or what outcome do customers get?",
      "Are there any concrete features, credentials, or proof points we can use?",
    ],
  };

  yield {
    event: "stage",
    data: {
      stage_id: "extract_brief",
      name: NAMES.extract_brief,
      status: "complete",
      duration_ms: 1100,
      payload: lowConfBrief,
    },
  };

  yield {
    event: "done",
    data: {
      status: "needs_clarification",
      brief: lowConfBrief,
      clarifying_questions: lowConfBrief.clarifying_questions,
    },
  };
}
