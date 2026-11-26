# Survival run #26 — 2026-11-26

The settlement read answered $0.00, so the hour cost one point (score −40 →
−41). The traffic that acted was **0 browsers and 0 buy clicks** in the last 24
hours: `page.view` 118 events / 63 browsers, `install.view` 54 / 53,
`pair.view` 67 / 47, `plan.view` 11 / 10, every row anonymous. A page load
without an action is a path probe, not a person.

## What changed

Pull request #461 landed on `main` as `6df8ddb5`, and it carries the system the
owner asked for:

- **The operator is the agent manager.** It assigns one ticket at a time,
  reads the reply, closes it on the board and in the proof, and never does a
  lane's work.
- **The loop is a file.** The contract is in
  `docs/agent-roles/loop/README.md`, the live view in
  `docs/agent-roles/loop/state.md`, and the queue is the memory: a chat
  message is not an assignment and a conversation is not a result.
- **The automation checks whether a lane is off or still working.**
  `scripts/dev/agent-fleet/watch.ts` runs every ten minutes and reads two
  signals: the operating system's process table, and the lane session's own
  heartbeat. A lane is working only while a live `opencode.exe` carries
  `--worktree lane-<role>-<stamp>` and its session spoke in the last thirty
  minutes; a marker whose worker is gone, whose session ended in an error or
  whose session went silent is released, and three releases block the ticket.
- **No role dispatches subagents.** Every generated agent file denies the
  `subagent` action, and the state table counts the child sessions a lane
  dispatched - the ceo lane had run 5 and the engineer lane 4 on one key, the
  multiplication that ends in HTTP 429.
- **The dispatcher moved into the repository.**
  `scripts/dev/agent-fleet/dispatch.ts` reads the queue and the credential
  roster, takes the oldest ready ticket with the money ticket first, writes
  the started marker with the ticket, the slot and the session title, and
  starts the lane session detached. The automation is one line now, and a
  test reads the rule.
- **Three keys, three lanes.** The owner pointed at the signed-in account
  store, where three NVIDIA accounts already held three different keys; each
  one has its own key file outside the repository, its own provider entry, its
  own roster row and its own worker slot.

## Verification

- `npm test` exits 0 and `npm run check` exits 0 on the branch head; the
  release gates are green on `main`.
- Pull request #461: seven of seven CI checks and SonarCloud green on the
  exact head `e2c9fd8e`.
- The scope verifier over `origin/main...HEAD` with every role named allowed
  all 63 changed paths; the fleet tests are 17 (10 loop, 7 dispatch).
- The real scope gate now runs in every lane session: the generated agent files
  carry the command with the lane's own role id.
- The watchdog ran for real on `main`: five returned tickets, one released
  marker, and the state table written to `docs/agent-roles/loop/state.md`.
- Three lane sessions ran at once on three different keys:
  `slot-nvidia-1/engineer-20261126-1233`,
  `slot-nvidia-2/ceo-20261126-1233`,
  `slot-nvidia-3/marketer-20261126-1233`.

## The reviewer gap, stated plainly

The reviewer agent could not finish a pass on the final head: the NVIDIA key
answered HTTP 429 (the key was carrying a lane that had dispatched four
subagents) and the console provider answered "Free usage limit reached". The
owner was asked and answered: merge now on the operator's own review plus the
green CI. The three reviewer rounds that did run are answered in the branch
(ownership wording, the migration path, the acceptance summary, the evidence
claim, the rendered-doc gate, the silent generator skip, the scope ambiguity
and the work-scope overlap test).

## Money

$0.00 settled, 0 orders, score −41, and 0 browsers that acted. The next money
step is unchanged and still the first one: tomorrow's single outreach (the
shortlist's row 1, Agno), and that conversation turning into a trial that
settles a $1 `plan.usd-1` PayPal purchase.
