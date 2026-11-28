# RF-013 — is Navego autonomous yet, and what full automation actually needs (2026-11-28)

## Honest answer

**No.** The triggers and the gates are automatic; the decision and most execution still pass through a model session that I start by hand each hour.

| Layer | State | Evidence |
|---|---|---|
| Wake-up | automatic | `automation.list`: hourly operator prompt, 10-minute watchdog, three dispatcher crons at :25/:35/:45 |
| Lane dispatch | automatic | dispatcher automations are `shell` actions with `runCount` 40/41/41 |
| Verification and merge | semi-automatic | CI gates green on PRs, but I push the merge and trigger the deploy |
| Next-action selection | now deterministic | `scripts/dev/agent-fleet/goal.ts` reads live state and prints one action with its exit condition |
| Execution of that action | manual | I still write the test, the code, the proof, the PR body, and the deploy dispatch |

## What the research says

| Source | Finding that applies here |
|---|---|
| Anthropic, Building effective agents — https://www.anthropic.com/engineering/building-effective-agents | Explicit distinction: **workflows** are LLM-and-tool paths orchestrated by predefined code; **agents** dynamically direct their own process. Most successful systems use simple composable patterns, not complex frameworks. Coding agents work because solutions are verifiable by automated tests, feedback comes from the environment, and success can be measured objectively. Human review remains important for broader requirements. |
| Anthropic, Demystifying evals for AI agents — https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents | Grade the **outcome** (final state in the environment), not the transcript. Prefer deterministic graders where possible. 20-50 tasks drawn from real failures are enough to start. Regression evals should stay near 100%; capability evals graduate into regressions when they saturate. A task that fails at pass@100 is usually a broken task, not a weak agent. |
| Google SRE, Eliminating Toil — https://sre.google/sre-book/eliminating-toil/ | "If a human operator needs to touch your system during normal operations, you have a bug." Toil is manual, repetitive, automatable, tactical, without enduring value, and grows O(n). Do not excuse human judgment as necessary if better design would remove the need for it. |
| OpenAI, A practical guide to building agents — https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf | Every run needs explicit exit conditions; add guardrails from real failures; rate tools by reversibility and financial impact; humans intervene at failure thresholds and high-risk actions. |
| GitHub, Managing auto-merge — https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-auto-merge-for-pull-requests-in-your-repository | Auto-merge is a built-in GitHub capability: a PR merges once all required checks pass. Our repo does not use it; the operator pushes `main` by hand after reading CI. |
| METR, Measuring AI ability to complete long software tasks — https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/ | Success collapses as task length grows; cut the mission into one-run steps (already done in `agents/operator/mission.md`). |

## Why the loop is not closed

A closed autonomous loop needs four things: derive state, choose one action, execute it, grade the outcome, then repeat without a person in the middle. Navego has (1) partly, (2) as of this run, and (4) in `npm test`/`npm run check`/CI. What is missing is (3): an executor that takes the selector's output and performs the deterministic classes of work.

A second blocker was hidden in (1): four selector signals — `days_since_settlement`, `buyer_replies_waiting`, `blocked_lanes`, `claim_drift` — were typed into `docs/economy.json` by me each run. That is exactly the toil SRE describes: a machine could derive them from artefacts the fleet already writes. A loop whose input a human types is not autonomous.

## What changed in this run

`readMissionState` now derives every signal:

- settled money and the days since settlement from `revenue.settled_usd` and `revenue.last_settled_at`, falling back to a one-time `mission.started_at` set from the earliest survival proof;
- open tickets from the queue, with answered and blocked tickets excluded;
- blocked lanes from the generated `docs/agent-roles/loop/state.md`;
- buyer replies from `docs/proof/outreach/replies/` files marked `answered: no`;
- claim drift from `claim-drift-*` files in the queue that have no answer.

The CLI prints `state`, `sources` and the chosen action, so the derivation is auditable. Four failing tests were written first and watched fail; `npm test` and `npm run check` exit 0.

## The remaining work, in order

1. **Executor for deterministic classes.** Wire the hourly automation to run the selector and then a bounded executor: close answered tickets, unblock stale lanes, check CI and merge green PRs, trigger site/function deploys, verify the live artefact, and write proof. Every class needs an explicit exit condition and a refusal path.
2. **Automatic merge and deploy.** GitHub auto-merge and the existing deploy workflows make this a configuration job, not a new system. Do not weaken the gates to get it.
3. **Outcome graders for the agent classes.** Keep deterministic tests as the primary grader; grade the final state (settled order, live page, gate result), not the transcript. Add the real failures we already had — false receipts, stale status — as regression tasks.
4. **Escalation, not permission.** The model should be woken only for genuinely novel work and for the owner-only boundary (payments, account reviews, marketplace merge decisions). That is the point where "automatic" legitimately stops.

Full automation is a property of the loop, not of the prompt. Until an executor closes step (3), calling this autonomous would be a claim that outruns the evidence.
