# RF-023 — an agent that names its own growth problem and checks its own result (2026-11-28)

## Question

The owner wants no human prompt for "why is the money still zero?". The agent should formulate the problem, research the cause, implement a change, and judge whether the output moved — effective if it did, still wrong if it did not.

## Sources

| Source | What was taken |
|---|---|
| The Lean Startup — https://theleanstartup.com/principles | Build–measure–learn and validated learning; progress is a measured change in the business driver, not activity. |
| PDCA — https://en.wikipedia.org/wiki/PDCA | Predict a result, act, compare actual to predicted, then start the next cycle with a better baseline. If the action did not change the outcome, it was not effective. |
| OODA — https://en.wikipedia.org/wiki/OODA_loop | Observe, orient, decide, act, with continuous feedback. The source itself warns the model is vague; it is used here only as a reminder to re-observe each turn. |
| A/B testing — https://en.wikipedia.org/wiki/A/B_testing | A test needs a defined measurable outcome and enough samples; small samples cannot establish that a difference is real. This matters here: about 10 pricing browsers a day is not enough to call a rise proof. |
| Anthropic, Demystifying evals — https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents | Grade outcomes with deterministic graders; keep real failures as regression tasks. |
| Google SRE, Postmortem Culture — https://sre.google/sre-book/postmortem-culture/ | A finding needs an action and review; an unreviewed postmortem might as well not exist. |
| RF-021 in this repo — the growth research loop | The loop is problem → evidence → finding → one task → implementation → live verification → re-measure. |

## What was implemented

`scripts/dev/agent-fleet/growth.ts`:

- `formulateProblem(state)` turns the metric gap into a question: zero settled dollars → "Why do zero strangers pay after N days?"; no pricing visitors → "Why does nobody reach pricing?"; real clicks but no settlement → "Why do buy clicks never settle into revenue?" The owner no longer has to ask.
- `judgeEffect(before, after)` returns `flat` for no change, `worse` for a drop, `effective` for a rise only when the baseline is at least 30, and `weak` for a rise on a tiny sample. A rise from 10 to 11 is **not** called effective.
- `growthTicket(...)` writes a research ticket with `decision`, `decision-change`, openable sources, a dated destination and `outreach: no`. The generated ticket was checked with `research-gate.ts` and returned verdict `run`.

Five failing tests were written first and watched fail; all pass. `npm test` and `npm run check` exit 0.

## Honest boundary

The agent can now name the problem and judge the outcome without being told. It still needs a model to read sources and synthesise a finding, and it still cannot invent a customer or create traffic. A/B testing needs a sample size our site does not have, so a "visitor naik" observation is labelled **weak**, not proof. Only a settled stranger payment changes the score.

## What remains

Wire `growth.ts` into the hourly automation so it proposes the ticket without a model deciding, and record the before/after metric in the same finding when a change ships. Until then the helper exists and is tested, but the hourly prompt still asks the operator to run it.

## Money

Settled external revenue remains $0.00, 0 orders.
