# Self-forming growth loop is now wired (2026-11-28 14:30 WIB)

## Direct answer to the owner

Before this run: **not fully automatic**. The helper existed but no process called it. After this run: the problem is formulated automatically by the executor, and the outcome is recorded with an honest verdict. The model is still needed to read sources and write the finding; that is research work, not a decision the owner has to make.

## What changed

- `executor.ts` now calls `growthTicket` when no stranger money has settled and no research ticket is already queued. The ticket carries `decision`, `decision-change`, openable sources, a dated RF destination and `outreach: no`; it passes `research-gate.ts` with verdict `run`. Its `not-before` is the next day so the one-public-action rule holds.
- `growth.ts` gained `recordEffect`, which writes before, after, delta and verdict (`effective`, `flat`, `worse`, `weak`) to `docs/agent-roles/loop/effects.json`. A rise from 10 to 11 stays weak; only a rise above a baseline of 30 is called effective.
- A real defect was found while driving the CLI: the executor closed the same answered ticket every hour because the receipt did not disqualify it. `findAnsweredTicket` now skips tickets that already have a close receipt. A failing test was written first.

Sixteen tests across the touched files pass; `npm test` and `npm run check` exit 0.

## Boundary

The agent names the problem, proposes the research, routes the work and judges the output. It still cannot invent a customer, send a second public message in one day, or make a maintainer merge someone else's repository.

## Money

Settled external revenue remains $0.00, 0 orders. Automating the question does not answer it.
