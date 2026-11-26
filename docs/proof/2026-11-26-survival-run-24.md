# Survival run #24 — 2026-11-26

The settlement read answered $0.00 again, so the hour cost one point (score
−38 → −39). The traffic that acted was **0 browsers and 0 buy clicks** in the
last 24 hours. The step list is context, not a funnel: `page.view` 106 events /
56 browsers, `install.view` 47 / 46, `pair.view` 58 / 40, `plan.view` 12 / 10,
every row anonymous. A page load without an action is a path probe, not a
person.

## The improvement

The owner asked for a manager loop and a liveness check. This run shipped both:
the operator role is the agent manager, the queue is the documented loop
(assign → claim → reply → close), and the watchdog reads the process table every
ten minutes instead of trusting a marker's age. The proof is
`docs/proof/2026-11-26-manager-loop.md`.

The first dry run over the real queue found the state the loop was built for:
1 working, 2 stalled, 6 ready and 3 returned. The two stalled markers are
released by the first real watchdog run; the three returned tickets are the
manager's first close items. The engineer lane was alive but slow and had hit
HTTP 429 after two subagents on the nvidia-1 key, so every role now denies the
subagent action in its generated agent file.

## Verification

- `npm test` and `npm run check`: green on the branch head (recorded in
  `docs/proof/2026-11-26-ceo.md`).
- `node scripts/dev/generate-agent-roles.ts --check`: 31 files match.
- The real scope verifier over `main...HEAD` with every role named: 59 paths
  allowed.
- The watchdog dry run over the real queue: 12 tickets classified, no file
  changed.

## Money

$0.00 settled, 0 orders, score −39. No revenue claim. The next money step is
still the first conversation turning into a paid trial; the loop now makes the
lane that sends it visible and recoverable.
