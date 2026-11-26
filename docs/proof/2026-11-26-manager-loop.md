# Manager loop — 2026-11-26

The owner asked two things: the operator should be the agent manager, and the
manager and every role need a documented feedback loop that does not depend on
a conversation; the automation should check whether a lane is off or still
working, because an agent can fail or time out and stop suddenly.

## What shipped

- **The manager role.** `operator` keeps its id so the hourly runner and the
  queue names keep working, and its team becomes `Agent Management: fleet,
  ledger and proofs`. Its scope now carries the loop, the fleet document, the
  watchdog and the worktree tool beside the ledger and the proofs.
- **The loop.** The manager writes a ticket, the lane claims it with a started
  marker, the lane returns a reply carrying `answered: <ticket>`, and the
  manager closes it on `docs/agent-roles/status.md` and in `docs/proof/`. The
  contract and the state table are in `docs/agent-roles/loop/`.
- **The liveness check.** `scripts/dev/agent-fleet/watch.ts` runs every ten
  minutes, reads the operating system's process table, and treats a lane as
  working only while a live `opencode.exe` carries
  `--worktree lane-<role>-<stamp>`. A marker whose process is gone is renamed
  to a released marker with the reason; three releases block the ticket. A
  failed process-table read is `unknown`, not death.
- **No subagents.** Every generated agent file denies the `subagent` action
  and every role body says to do the work in the session. A lane runs on one
  credential whose provider answers at 40 requests per minute; a child session
  multiplies requests on the same key, and the observed result is HTTP 429.
- **The scope gate is honest.** The verifier reads the diff with
  `--no-renames`, refuses an empty diff, refuses a caller-supplied path list,
  and treats a shared communication path as shared while only two work scopes
  on one path are ambiguous.

## The live state at 2026-11-26T10:40Z and 11:35Z

The first dry run over the real queue read 12 tickets: 1 working, 2 stalled, 6
ready and 3 returned.

- **stalled:** `engineer-to-ceo-20261126-0501.md` (started 05:25) and
  `operator-to-researcher-20261126-0845.md` (started 06:25). The first real
  watchdog run releases both markers, so the next lane worker can pick the
  tickets up.
- **returned:** the two researcher replies and the sales-rep reply. These are
  the manager's first close items: the manager reads them, writes the outcome
  on the board and in the proof, and only then chooses new work.

The second read added the session heartbeat and the child-session count, and
it changed the reading of the engineer ticket:

- The ceo lane's session (`ses_de9af8506ffewqDNLEA5SX9dqf`) had dispatched
  **5 child sessions**, and the engineer lane's session
  (`ses_de941a686ffeAHIYipszqv8tAR`) had dispatched **4**. That is the
  request multiplication the owner saw as HTTP 429, now counted in the
  manager's table and denied in every generated agent file.
- Both lane sessions went silent for more than thirty minutes while their
  worker processes stayed alive: the engineer session ended with the outcome
  `succeeded` and never wrote the reply that closes its ticket. The process
  table alone would have called it working for hours; the session heartbeat
  calls it stalled, and the watchdog releases the marker.

## Verification

- `node --test tests/tooling/agent-loop.test.ts`: 8 pass.
- `node --test tests/tooling/agent-roles.test.ts`: 18 pass, including the
  rendered documents and table, the work-scope overlap check, the subagent
  deny in every generated agent file, and the shared communication path.
- `node scripts/dev/generate-agent-roles.ts --check`: 31 files match.
- The real scope verifier over `main...HEAD` with every role named: 59 paths
  allowed.
- `npm test` and `npm run check`: see the final run record below.

## Money

$0.00 settled, 0 orders, no revenue claim. The loop moves work, not money.
