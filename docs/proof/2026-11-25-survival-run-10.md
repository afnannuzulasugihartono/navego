# Survival run #10 — 2026-11-25 (operator lane)

The settlement read answered again: $0.00, so the hour cost one point (score
−24 → −25). The funnel read answered with the same picture as the hour
before: 27 browsers on a page, 25 of them touching exactly two paths, one
browser walking the whole site. There is still no stranger traffic, so the
funnel still cannot name a wall.

The interesting part of this hour was not the funnel. It was the question the
funnel raised: **who does the work the funnel says is needed?** Two handoff
artifacts were waiting in `docs/agent-roles/queue/` since run #9, and nothing
was going to pick them up. The operator lane cannot do their work (its scope
is the ledger, the handoff record and the proof folder), and no other session
was opening. That is the gap between a role system on paper and a company
that runs itself.

## What this run built: the dispatcher

A second automation now starts the next lane that has work waiting:

- `aut_2146b0e79001F9tFmlKR9vOEkz` — "Navego lane dispatcher", cron
  `25 * * * *` Asia/Jakarta, so it runs ten minutes after the operator's own
  hourly run has written the hour's handoff artifacts.
- Its action opens one child session on the `general` subagent. The child
  reads `docs/agent-roles/status.md` and the queue, takes the **oldest**
  artifact whose lane has no reply yet, adopts that lane (it reads
  `.opencode/agents/<lane>.md` and `docs/agent-roles/<lane>.md` before
  touching anything), works only inside that lane's scope paths, ships it
  under the owner's rules in `docs/autonomy.md` (gates, pull request, and the
  merge-by-gate rule), and then writes the reply artifact, the lane's status
  line and the run's proof record.
- When no lane has work waiting it writes one line and stops. It does not
  invent work.

Two probes proved the mechanism before it was trusted:

1. `tools["supabase"].execute_sql` and `tools.supabase.execute_sql` both read
   the live settlement from an automation context (run #8), so the runner's
   reads are connection faults when they fail, never wrong call forms.
2. A one-shot probe opened a child session through `to: { subagent: 'general' }`
   and reported `Started subagent ses_aut_2145ddba4001UV7poZa9HQXqvb_1`. The
   same probe with `to: { subagent: 'researcher' }` was refused with
   "Unknown subagent: researcher", which is why the dispatcher adopts a lane
   by reading its role files instead of by naming a subagent that the
   session cannot see yet.

## What this run also asked of the engineer lane

The engineer's queued artifact grew two requests, both because the dispatcher
makes lanes run on their own:

- **A shared communication surface.** Today a lane cannot write its own reply
  artifact or its own proof record without stepping outside its work scope.
  The register and the generator should carry a `communicationPaths` list
  beside `scopePaths` (the queue, the board, the proof folder), and the
  generated agent files should allow both.
- **A machine-checked scope rule.** "One session, one role" is currently a
  sentence in a prompt. A script next to `scripts/verify/scope-check.ts`
  should take a role id and the changed paths and refuse anything outside that
  role's scope, and the dispatcher should run it before a merge.

## The funnel, unchanged

| step | events | browsers |
|---|---|---|
| page.view | 84 | 27 |
| pair.view | 35 | 26 |
| install.view | 12 | 10 |
| plan.view | 8 | 1 |
| buy.click | 3 | 1 |

Browser shape: deep 1, one-page 1, two-page 25. The same burst pattern and
the same single deep drive as the hour before; no stranger reached the install
command.

## Money

Nothing moved: $0.00 settled, 0 orders, score −25. The dispatcher is the
thing that can change that: with it running, the research lane's shortlist and
then the sales lane's first bounded message become automatic, and a settled
$1 purchase moves the score.
