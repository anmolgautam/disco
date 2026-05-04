# compose

## What I built

compose takes a one-line advertiser brief and gives you back the publishers worth running on, the shopper personas worth talking to, ad copy written for each persona, and a campaign config. Every score comes with a reason, so you can argue with it instead of trusting a black box.

## How to run

**Live demo:** `https://disco-production-6f42.up.railway.app/` — gated by HTTP Basic Auth, credentials shared separately.

**Run it locally:** create `backend/.env` with at minimum `ANTHROPIC_API_KEY=sk-ant-...` (or `OPENAI_API_KEY=sk-...` to use the OpenAI path). Optional: `LLM_PROVIDER` (defaults to `anthropic`, falls back to whichever key is set), and `AUTH_USERNAME` + `AUTH_PASSWORD` to enable the Basic Auth gate (leave both unset for open local dev).

```bash
# backend
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000

# frontend (separate terminal)
cd frontend && npm install && npm run dev   # http://localhost:5173
```

Vite proxies `/campaign` and `/healthz` to `:8000`. Set `VITE_USE_MOCK=true` in `frontend/.env.local` to drive the UI off local fixtures without burning LLM credits.

## Algorithm

Behind the scenes, the model is a **triangle**: how well the brand fits each publisher, how well it resonates with each shopper persona, and which personas actually read which publishers. The first two depend on the brief and are figured out per request; the third only depends on the catalog, so it's precomputed once and reused.

The pipeline runs in six stages:

1. **Read the brief.** Pull out what the brand actually is category, audience, price tier, tone. If the brief is too vague, ask follow-up questions instead of guessing.
2. **Rank publishers.** For each publisher, judge fit on category, audience, tone, risk, income match, reach, and geo.
3. **Rank personas.** Same idea does this brand resonate with this kind of shopper?
4. **Combine.** Pick the strongest publishers and personas, then map which personas actually live on which publishers.
5. **Write the ads.** One headline and body and CTA per selected persona, written for them specifically.
6. **Assemble the config.** Split the budget across publishers (more reach and better fit gets a bigger share), pick a bid strategy, and produce the final campaign config. (Assumed budget as 50,000$ and split it across as percentage share)

## What I'd do next

1. **Reduce LLM dependency.** Today the LLM rescores every publisher and persona on every request. With another week a cheap similarity check would shortlist candidates first, and the LLM would only step in for the survivors and the ad copy. Almost ~80% cost cut and this scales the catalog from 20 to 1000+.
2. **Build an eval set.** Today every prompt change is a guess. There is no way to tell if a tweak helped or hurt the rankings. With another week I would hand label around 30 briefs with their expected top 3 publishers and run them automatically on every change. This will help me catch any regression.

## What I intentionally cut

The aim was to focus on the core algorithm and prove the approach works. To do this, I broke the process into atomic stages and pulled every lerned parameters value into a hyperparameters file, so tomorrow when there is real data, these values can be replaced with from a trained ML or DL model.

Two things this meant cutting for now.

1. **Production grade backend and frontend.** No async queue, no retries on LLM calls, no structured tracing. The system runs cleanly for one user at low concurrency. A real deployment needs queue-based processing so a long brief survives a closed browser, plus observability and retries for network failures. Cut to keep the time on algorithm depth.
2. **Learned weights instead of hand-tuned ones.** Several formulas use weights I picked by intuition. How much category overlap counts versus audience overlap. Where to flag a publisher as too risky. Where reach saturation kicks in. They live in a hyperparameters file by design so a ML/DL model can replace them later. These values will e determined when I have access to actual data and outcome data .

## What's hard, what's easy, and where the interesting work lives

The easy part was the generative part. Writing prompts for headlines, body copy, and CTAs. LLMs are genuinely excellent at this when given the right context. Get a tight brief, the right persona, the right tone, and the model will write you something good.

The hard part is gathering that "right context". Which publishers are worth considering, which personas actually fit this brand, which combination of those two should the headline and content be written for. This is the recommendation layer, and it is where the real engineering lives. The LLM at the end is doing the easy job. Everything before it is what makes the output worth reading.

At scale this gets harder still. The publisher and persona scorers would need to be trained from real outcome data instead of called fresh from an LLM every request. The publisher and persona affinity matrix cannot be precomputed for a million by million catalog and would need clustering or on demand computation. And the LLM steps that stay, reading the brief and writing the creative, cost too much at API rates at volume, so a self-hosted or fine-tuned model becomes necessary.

That is the bet behind the triangle structure and the atomic stages. Not because pipelines are easier to implement, but because every layer that narrows the candidate set before the LLM sees it is where the system earns its quality, and every layer is also where it can be replaced with something cheaper as scale demands.
