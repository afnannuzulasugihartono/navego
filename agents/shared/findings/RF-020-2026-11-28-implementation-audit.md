# RF-020 — audit of research that is not yet implemented (2026-11-28)

## Question

The owner asked which research findings have not been implemented. This is a status audit of RF-001…RF-019 against files in the repository, not a new opinion.

## Method

Read every row of `agents/shared/findings/index.md`, read the "what was built / remaining work" section of each finding, then check the claimed artefact directly: script files, registry, GitHub setting, queue and public PR state. A finding is **done** only when the named artefact exists and its test passes; **partial** when the code exists but a wiring or follow-up remains; **not done** when no artefact exists; **blocked** when an owner-only or another person's decision is the gate.

## Status table

| RF | Recommendation | Status | Evidence |
|---|---|---|---|
| RF-001 | Steel outreach as the next prospect | **queued, not sent** | `operator-to-sales-rep-20261127-2315.md`, `not-before: 2026-11-29` |
| RF-002 | Four lanes, research as ticket, one session per key | **done** | `docs/agent-roles/registry.json`, role files, dispatcher |
| RF-003 | Collapse two homepages, lead with proof | **done** | 301s live, one homepage |
| RF-004 | Fix discovery: inbound link, query wording, answer content | **partial** | canonical fixed, answer page live and linked; inbound link still missing; Search Console owner-only |
| RF-005 | First division = AI-agent operators, four lanes | **done** | registry + `docs/research/prospects.md` |
| RF-006 | Five derived metrics, no targets before baseline | **done** | `agents/shared/metrics.md`, `docs/economy.json` |
| RF-007 | Risk register with guardrails | **done** | `agents/shared/risk-register.md`; settled payment still open |
| RF-008 | Classify buy clicks before calling them leads; pay-first ticket | **done** | `own-traffic.ts`, guest checkout shipped |
| RF-009 | Read-back, wake, retry in review loop | **done** | `scripts/dev/agent-fleet/message.ts` and its tests |
| RF-010 | State-driven operator selection | **done** | `goal.ts`, state-derived signals, tests |
| RF-011 | Mission ladder L0–L4 | **done** | `agents/operator/mission.md`, `goal.ts` |
| RF-012 | Guest billing edge | **done** | PR #539, live `paypal-buy` guest proof |
| RF-013 | Closed loop: executor, auto-merge, outcome graders, escalation | **partial** | `executor.ts` exists with close + auto-route; hourly automation still starts a model; `allow_auto_merge=false`; no outcome grader |
| RF-014 | Research gate before dispatch | **done** | `research-gate.ts`, `researchDispatchAllowed` wired into `dispatch.ts` |
| RF-015 | Fleet upgrade items 1–6 | **partial** | items 1–2 done; 3–5 not done; 6 is a written gap by design |
| RF-016 | Auto-route deferred actions; hard owner boundary | **done** | `executor.ts` routes five action classes, tickets idempotent per day |
| RF-017 | Weakness-hunting kept effective | **not formalised** | six rules are prose only; no steady-state metric or grouped regression gate |
| RF-018 | Topic-selection rule (decision, register, constraint, VoI) | **documented only** | `research-gate.ts` still checks ticket shape and duplicates, not the constraint or decision value |
| RF-019 | mcp.so as a second public surface | **queued, not sent** | `operator-to-sales-rep-20261128-1030.md`, `not-before: 2026-11-30` |

## The genuinely unimplemented items, ranked

1. **Machine-readable outcome signals** (RF-015 item 3, RF-013 item 3). No `outcomes.json` or equivalent exists; the selector still parses prose registers. This caused the false buyer-reply signal in run 49. Small, bounded, high value.
2. **One grouped regression gate for real failures** (RF-015 item 4, RF-017 item 3). Tests for false receipts, false buyer reply and own buy click exist but are scattered; no single gate every run must pass.
3. **Wire the hourly automation to the executor** (RF-013 item 1). `executor.ts` is not invoked by the hourly automation; a model still starts each run. Wiring it would remove the largest remaining manual touch for deterministic classes.
4. **GitHub auto-merge for green PRs** (RF-013 item 2). `allow_auto_merge` is `false`. This is a repository setting change, not new code; gates must stay intact.
5. **Topic selection inside the research gate** (RF-018). The gate cannot yet refuse a topic merely because no decision would change or the constraint is elsewhere.
6. **Collapse idle lanes** (RF-015 item 5). Registry still has four active lanes; sales-rep and onboarding-guide wait on a buyer and a maintainer. This is an architectural change and should not be done casually.
7. **External outcomes** (RF-004, RF-017, RF-019): the inbound link, a settled stranger payment, and the two stacked public actions. These are not code; they are waiting on time and, for Search Console/marketplace merge, on the owner.

## What is deliberately not "implemented"

An independent reviewer, automatic payment, automatic account review and another maintainer's merge decision. RF-016 records why. Writing those as done would be an excessive-agency claim.

## Money

Settled external revenue remains $0.00, 0 orders. This audit changes nothing about the score; it only names the next bounded work.
