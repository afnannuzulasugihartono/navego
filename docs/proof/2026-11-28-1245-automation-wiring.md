# Run 58 — hourly automation, auto-merge and the research value check (2026-11-28 12:45 WIB)

## What the owner asked

Implement what can be implemented from the RF-020 backlog: hourly automation wiring, auto-merge, the value check, and idle lanes; then state the plan for Steel and mcp.so.

## Hourly automation

There is no automation update tool, only create/delete/pause/resume. I recreated the hourly automation with **the exact state object** from the old one (`runCount 55`, `score -88`, `flatHoursCharged 88`), inserted one prompt line that runs `outcomes.ts`, `regressions.ts` and `executor.ts` first, and deleted the old id only after the new one was verified active.

- old `aut_2164ffcfd001KHx72ub2lmEtrT` → new `aut_2222337f9001cNsfBZkQ9m7Aig`
- exactly one active automation with the hourly name; the inserted executor line is present in its code
- live docs and registry updated to the new id; generated role files regenerated (`roles:check` = 13 files)

If the executor reports `executed=true`, the run records the receipt and stops. If `deferred`, the action is already routed to an idempotent lane ticket and the model works that ticket instead of choosing again.

## Auto-merge

`allow_auto_merge` was `false`; it is now `true`. This does **not** weaken the gate: branch protection still requires one approving review, code-owner review and six status checks (`unit`, `site`, `deno-hosted`, `secret-scan`, `browser`, `postgres`). Our current release flow still pushes a verified branch to `main`; PRs must be set with `gh pr merge --auto` to use the new setting.

## Research value check

`research-gate.ts` now requires a `decision-change:` line. A ticket without it returns `needs-human` with reason "value of information is zero". The ticket template carries the requirement. Two tests were added; all 11 pass.

## Idle lanes — deliberately not collapsed

Sales-rep still owns the stacked Steel and mcp.so actions. Onboarding-guide has one open ticket (`operator-to-onboarding-guide-20261127-0230.md`). Turning either lane into a ticket would strand those items. The lane collapse stays on the register with a written reason; it is not safe work for this run.

## Steel and mcp.so plan

- Steel public enterprise form: `not-before 2026-11-29T00:00:00+07:00` — one bounded form submission, recorded the same day.
- mcp.so public submit form: `not-before 2026-11-30T00:00:00+07:00` — one bounded submission, recorded the same day.
- Each gets one message only; a buyer reply outranks both. Neither is sent today because the one-public-action allowance for 2026-11-28 is spent.

## Money

Settled external revenue remains $0.00, 0 orders. Wiring and settings do not create a buyer.
