# Audit of unimplemented research (2026-11-28 12:00 WIB)

## What was asked

The owner asked to check which research findings have not been implemented.

## What was checked

RF-001 through RF-019 were read against the repository: script files, registry, GitHub auto-merge setting (`false`), queue tickets and the public PR state. RF-020 records the full status table. Eight findings are done, four are partial, one is documented only, one is not formalised, and two public actions are queued rather than sent.

## The real backlog

1. Machine-readable outcome signals — no outcomes register exists; this caused the false buyer-reply signal.
2. One grouped regression gate for known real failures.
3. Wire the hourly automation to `executor.ts`.
4. Enable GitHub auto-merge for green PRs without weakening gates.
5. Add decision-value and constraint checks to `research-gate.ts`.
6. Collapse idle lanes — architectural, deliberate, not casual.
7. External outcomes: one inbound link, two stacked public actions, one settled stranger payment.

Nothing here was implemented in this run; the audit only names the work. `npm test` and `npm run check` are expected green. Settled external revenue remains $0.00, 0 orders.

## Boundary

An independent reviewer, automatic payment and another maintainer's merge decision are deliberately not implementable by the agent. Calling them done would be false.
