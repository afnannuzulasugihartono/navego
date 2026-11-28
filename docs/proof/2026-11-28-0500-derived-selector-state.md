# Full-automation research and the first structural fix (2026-11-28 05:00 WIB)

## Answer to the owner's question

No, this is not fully automatic. Wake-ups, lane dispatch and CI gates are automatic; the operator's decision and execution are not. `automation.list` shows active hourly, watchdog and three dispatcher automations (run counts 29, 242, 40/41/41); the dispatchers and watchdog are shell actions, but the hourly operator is a prompt that needs a model session.

## Research

RF-013 in `agents/shared/findings/` records six primary sources: Anthropic on workflows versus agents and on coding-agent verifiability, Anthropic on outcome graders and regression evals, Google SRE on eliminating toil, OpenAI on exit conditions and risk-rated tools, GitHub on built-in auto-merge, and METR on task horizon. The conclusion is that full automation needs a closed loop: derive state, choose one action, execute it, grade the outcome, repeat. Navego had the choice and the graders but not a general executor, and half its state inputs were typed by hand.

## What changed

`scripts/dev/agent-fleet/goal.ts` now derives all six state fields from artefacts the fleet already writes. Four fields that used to be typed into `docs/economy.json` each run are gone from that file: `days_since_settlement`, `buyer_replies_waiting`, `blocked_lanes`, `claim_drift`. The ledger now carries one static `mission.started_at` sourced from the earliest survival proof. The CLI output includes a `sources` object so any number can be traced to its file. A new register at `docs/proof/outreach/replies/README.md` defines how a buyer reply becomes a live signal.

Four failing tests were written first and watched fail; all 11 tests in the file pass afterwards. `npm test` and `npm run check` exit 0.

## Live output after the change

```
settledUsd 0, daysSinceSettlement 3, buyerRepliesWaiting 0,
openTickets 5, blockedLanes 2, claimDrift 0
action close-ticket / signal open-ticket
```

The two blocked lanes are now visible without anyone typing them. That is a finding, not a regression: the loop can no longer hide stale blocked work behind a zero.

## What this does not claim

No executor was built, no PR was auto-merged, and no deployment was triggered without a dispatch. Settled external revenue remains $0.00, 0 orders. The next structural step is the bounded executor for deterministic classes, then GitHub auto-merge for green PRs, with the gates untouched.
