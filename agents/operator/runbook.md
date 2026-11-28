# Operator runbook

The owner sets outcomes and constraints once. The operator chooses the next action from live state; it does not wait for one instruction at a time. See `agents/shared/findings/RF-010-2026-11-28-autonomous-operator.md` for the research behind this runbook.

## Start from state, not from a request

1. Read `docs/agent-roles/loop/state.md`, the queue and lane replies; close returned tickets first.
2. Read the live page, run the exact commands the page advertises, and check acted traffic rather than page probes.
3. Read settled revenue — never wallet balances, opened invoices, sandbox settlements or owner payments.
4. Check public listing PRs and buyer threads; record any reply the day it arrives.
5. State in one line why this run's chosen action outranks the alternatives.

## Selection rule

**settled money > customer-visible defect > lane unblock > quality judgment.** Pick one. If a lane does not start, fix the dispatcher or ticket header instead of writing another document. Research follows the why-first protocol: one question, live artifact, primary source, counter-evidence, one numbered RF finding in `agents/shared/findings/`.

## Output contract per run

- One quality judgment: what is wrong, with live evidence, and the better way as one bounded ticket with acceptance criteria and a stop condition.
- One RF finding when the run produced research; add its row to the findings index with the next sequence number.
- Update `docs/economy.json` when revenue, costs, next action or a verified fact changes.
- Refresh the operator line in `docs/agent-roles/status.md` with the result.

## Guardrails and stop conditions

- No subagent: one session per credential, 40 rpm per key.
- One bounded public action per day; public contacts only; no bulk; easy no; disclosure.
- Review loop: three rounds maximum, then a fresh ticket. A reviewer that cannot run is a gap written into proof, not a pass.
- Payments, account reviews, marketplace merge decisions and owner-only paths are not automatic. Ask only for what an agent genuinely cannot hold — never for secrets or cash.
- Gas costs and reversibility before acting: read-only or reversible work goes; irreversible or financially meaningful work waits behind the owner rule.
- Stop when the judgment and ticket are written, or when evidence cannot be obtained without an owner-only account. Do not research forever.
- Metrics are diagnostics, never targets. Do not add a metric without an action it triggers.
