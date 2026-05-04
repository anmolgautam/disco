# compose

A campaign-generation prototype for the Disco take-home. Advertiser describes their business in one line; the system streams back a ranked publisher list, persona-tuned creatives, and a machine-readable campaign config — with reasoning visible at every step.

## What I built

A 6-stage pipeline behind a streaming React UI. Backend is FastAPI with native SSE (FastAPI ≥0.135); frontend is React 19 + Vite + Tailwind + Motion. Provider-agnostic LLM caller (OpenAI default, Anthropic fallback).

**The triangle.** Three edges connect *advertiser*, *publisher*, *persona*. Two are scored at request time by LLM (adv↔pub, adv↔persona); the third (pub↔persona) is precomputed at build time into a 200-cell `affinity.json`. Stage 4 joins all three — top pubs enriched with the personas they reach, top personas enriched with the pubs that reach them. The split is the architectural bet: the slowest leg (catalog × catalog) is cached forever; only the brand-specific judgment hits the model live.

**Panels — algorithm in one line each:**

- **Campaign Brief** — one LLM call extracts a structured `CanonicalBrief`; bails to clarifying questions if `confidence == "low"`, saving ~30 LLM calls.
- **Selected Publishers** — 20 parallel LLM calls score each pub on 4 components, 3 more by rule (economic, reach, geo); weighted into `final_score`. Top K (3/4/5 by confidence) shown; rest collapse into a "silent middle" expand.
- **Excluded Publishers** — pubs that crossed `risk > T_risk` OR `final_score < T_score` (both T's are confidence-driven). Empty bucket renders a dynamic explanation using the gates that actually ran.
- **Selected Personas** — 10 parallel LLM calls, same per-component shape, 5 components. Top K shown.
- **Persona × Publisher Reach** — `joint_score = pub_fit × precomputed_affinity`, rendered as a matrix with intensity dots. This is the third edge of the triangle made visible.
- **Persona-Tuned Creatives** — one LLM call per top persona; emits headline, body, CTA, reasoning. Reason ordering is intentional: BEFORE-each-score in fit panels (reasoning shapes the number); AFTER for creatives (reasoning explains the choice).
- **Campaign Config** — pure rule-based, no LLM. Budget = `fit × log10(reach)` normalized across selected pubs; bid strategy from a `(price_tier, business_model)` lookup table.

## How to run

```bash
# backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
echo "OPENAI_API_KEY=sk-..." > .env   # or ANTHROPIC_API_KEY
uvicorn app.main:app --port 8000

# frontend (in another terminal)
cd frontend
npm install && npm run dev            # → http://localhost:5173
```

Vite proxies `/campaign` and `/healthz` to `:8000`. Set `VITE_USE_MOCK=true` to drive the UI from local fixtures without burning LLM credits.

## What I'd do next with another week

- **Response cache** keyed on (prompt-hash, brief-hash, catalog-version) — cuts iteration cost ~80%.
- **Real eval set**: 30 briefs with expected top-3 pubs + creative spot-checks; run on every prompt change.
- **Two-pass scoring** for catalog scaling: cheap model bulk-scores all 20 pubs, expensive model only re-scores the top 8 with reasoning. Same UI, ~half the cost at 20 pubs, sublinear at 200.
- **Move affinity to request-time** with a vector cache so editing personas/publishers doesn't require rerunning the setup script.
- **Auth + history** (currently rate-limit-only). Saves campaigns, lets the marketer iterate on the same brief across sessions.

## What I intentionally cut

- **No DB.** Stateless service. Persisting briefs/runs is infra weight without being asked for.
- **No `frequency_cap` or `pacing` in CampaignConfig.** Real ad-ops concepts but not in `GLOSSARY.md` — vocabulary creep.
- **No multi-tenant auth.** Rate-limit per IP (5 req / 30s) + provider spend cap is enough demo protection.
- **No DSP wire-up.** Assignment asks for the *config*; actually buying media is out of scope.
- **One creative per persona, not N variants × persona.** Spec says 3–5 creatives total.
- **No streaming-token UX inside a stage.** Stages emit complete payloads, not partial tokens — keeps the protocol simple, the UI honest, and parsers cheap.

## Hard vs. easy, and where the interesting work lives

**Easy.** Rule-based combination (Stage 4) and config assembly (Stage 6) are dict-lookups once you've decided the formula. SSE plumbing is one decorator with FastAPI's native `EventSourceResponse`. Card UIs and animations are well-paved territory.

**Hard.**

1. **Designing the score formula itself.** Picking the 7 components, assigning weights, handling out-of-distribution inputs. The original `economic_fit` was binary "in expected income_tier set → 1.0" and saturated at 1.0 across most pubs — killing the signal. Replaced with continuous distance from a single ideal rank. Easy to write code; hard to write a *defensible* formula.
2. **Output ordering for autoregressive reasoning.** Per-component reason BEFORE its score, `overall_thought` LAST. Get this wrong and the model justifies a number it's already committed to. This is a real shaping lever, not a stylistic choice.
3. **Confidence end-to-end.** Low-confidence brief bails at Stage 1; medium widens K, loosens exclusion gates; high tightens both. The frontend reads the *actual gates that ran* and explains the resulting empty-state ("no pub crossed score 0.15 or risk 0.70 for this medium-confidence brief") — instead of staring at a blank panel and assuming the system broke.
4. **The empty-state honesty problem.** Easy fix: force bottom-5 into the "excluded" bucket so the panel always has content. Right fix: explain *why* a bucket is empty using real numbers. The empty bucket is a signal, not a UI bug.

**Where the interesting engineering lives.** The whole system is a tradeoff between *cost* (LLM calls), *freshness* (every request hits the model), and *trust* (user needs to see WHY, not just WHAT). The triangle-fit architecture is how I made the tradeoff: adv↔pub and adv↔persona via LLM at request time (brand-specific, can't precompute), pub↔persona precomputed at build time (catalog × catalog, stable). Build-time affinity caches the slowest leg; request-time LLM does the judgment that can't be cached. That's the architectural bet — and it's what makes the per-request math fast enough to stream stage-by-stage instead of "loading…" for a minute.
