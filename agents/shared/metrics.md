# Active metrics

This file is a contract, not a dashboard. Five fields only. Everything else is a candidate until settled revenue exists.

## Why so few

- Google SRE, Service Level Objectives: choose a few indicators from what users care about, use distributions, never target 100%, do not adopt current performance as the target. https://sre.google/sre-book/service-level-objectives/
- Google SRE, Eliminating Toil: a metric that needs a human to fill it in repeatedly is toil, not measurement. https://sre.google/sre-book/eliminating-toil/
- DORA: metrics are a compass; Goodhart's law turns a quota into a gamed number. https://dora.dev/guides/dora-metrics-four-keys/
- FinOps: the goal is business value from technology, not cost-cutting for its own sake. https://www.finops.org/introduction/what-is-finops/
- OpenAI Evals platform shuts down 2026-11-30; keep the pattern (ground truth, grader, iterate), not the platform. https://platform.openai.com/docs/guides/evals

## The five fields

| Field | Definition | Source | Window | Owner | Action when bad |
|---|---|---|---|---|---|
| settled_usd | Sum of settled USD for external customers, one PayPal order id counted once | PayPal settlement log; mirrored in docs/economy.json revenue | 24h and 7d | operator | 7 days flat: stop architecture work, acquisition only |
| monthly_cost_usd | Sum of recurring, payer-assigned costs with their due dates | docs/economy.json costs | rolling month | operator | Negative gap: cut cost or change price, not add features |
| buy_to_settlement | Settled distinct order ids divided by browsers with buy.click | funnel events plus settlement log | 24h | sales and engineer | Zero with an external buyer: fix the checkout wall |
| public_actions_today | Count of public sends recorded for today; must be 0 or 1 | docs/proof/outreach dated file plus automation.list | calendar day, Asia/Jakarta | operator | Greater than 1: pause the lane and delete duplicate automations |
| fabricated_revenue_count | Owner payments, sandbox settlements, wallet balances, opened invoices counted as revenue; must be 0 | revenue verification in docs/economy.json | every run | operator | Greater than 0: retract the claim and write an incident |

No target is set yet. Baseline for seven days first. Targets require the owner's decision.

## Rules

1. Derive from events already in the repo or the funnel. If a human must type it, remove it.
2. One number, one action. A metric without an action is not kept.
3. Acted browsers, not page views. Buy clicks are not settlements.
4. Percentiles over averages when a latency or lead time is added later.
5. No SLO for incoming traffic; the market sets it, not the company.

## Candidates, deliberately not active

change lead time, deployment frequency, failed deployment recovery, change fail rate, rework rate, task success without reopen, review rounds to approval, postmortem count, eval freshness, token and span telemetry.

They stay here as names only. Activating one requires a written action it would trigger and proof that collecting it is not toil.
