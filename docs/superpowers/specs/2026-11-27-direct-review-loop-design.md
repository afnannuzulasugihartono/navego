# @last-edited: 2026-11-27 UTC+7.
# @title: direct review loop - a lane reports to the operator, the operator reviews immediately, and the same worker session revises until approved.
# @state: design only. No implementation code is approved by this document.
# @dependencies: `scripts/dev/agent-fleet/dispatch.ts`, `docs/agent-roles/keys.json`, `docs/agent-roles/operator.md`, `docs/autonomy.md`.

# WHAT THIS IS FOR

A lane must be able to hand a finished piece of work to the operator **in the same minute**, the operator must be able to send a review back **to the same worker without losing its history**, and the exchange must repeat until the operator approves. The owner asked for this to behave like a subagent round trip without actually using a subagent: no child session on the same credential, because that request multiplication is what produced HTTP 429.

Success looks like one real round: engineer reports, operator reviews a specific part, engineer revises in the same session, operator approves. Every round is visible in the repository even if OpenCode's local session database disappears.

# NON-GOALS

- No `subagent` action in any agent file.
- No new credential, no new provider, no new paid dependency.
- No waiting for the next hourly operator run as the only way to receive a report.
- No fake approval: a round is approved only by the operator sending the explicit approval message after reading the artifact.
- The message is a notification and a pointer, never the only copy of the result.

# WHAT OPENCODE ALREADY PROVIDES

Verified against the running server's `openapi.json`:

- `POST /api/session/{id}/synthetic` — adds a message the agent reads as user input even though the user did not type it. It starts the agent unless `resume: false`; `delivery` is `steer` (before the next model call, even mid-work) or `queue` (after the current work finishes, one item at a time).
- `POST /api/session/{id}/prompt` — sends a user message to that session and starts its agent; returns once queued, not when the agent finishes.
- `GET /api/session?search=<title>` — resolves a session by title. Session IDs are ephemeral; titles are the stable handle.
- `GET /api/session/{id}/inbox` — lists undelivered items.
- `POST /api/experimental/session/{id}/wait` plus `GET /api/session/{id}/message` — waits for and reads the reply.
- `POST /api/session/{id}/fork` — a true child session with the parent's history. Not used here.

# COMPONENTS

## One script: `scripts/dev/agent-fleet/message.ts`

Three commands, one file, no new package:

```text
message.ts report  --ticket <file> --lane engineer --round N --summary "..." --proof <path>
message.ts review  --ticket <file> --lane engineer --round N --note "review bagian ini ..."
message.ts approve --ticket <file> --lane engineer --round N
```

Every command:

1. Resolves the target session from its **title**, never from a hardcoded ID: operator is the newest active session whose title starts with `slot-console`; a worker is the newest non-terminal session whose title starts with `slot-<credential>/<lane>-`.
2. Refuses a target whose `outcome` is `error` or `aborted`, or whose last heartbeat is older than the stale window already used by `watch.ts`. A dead session is not resurrected with a review; it produces a rejection and a fresh ticket.
3. Sends with an idempotency `id` of `<ticket>:<round>:<kind>` — a retry returns the original message instead of adding a second one.
4. Sends with `resume: true` so the receiving agent starts immediately, and `delivery: "queue"` so it does not interrupt work already in progress. `steer` is reserved for an explicit human override and is not used by the lane flow.
5. Writes one evidence line under `docs/proof/` with the resolved session titles, the message id, and the time. The message itself stays a pointer.

## One contract: the labelled message

The visible text always begins with a label, because `synthetic` is read as user input and must never be mistaken for the owner speaking:

```text
[LANE-REPORT engineer] ticket=operator-to-engineer-20261127-1200.md round=1
Ringkasan: ...
Bukti: docs/agent-roles/queue/engineer-reply-....md
Status: NEEDS_REVIEW
```

```text
[LANE-REVIEW operator -> engineer] ticket=... round=1
Review bagian ini: ...
Status: NEEDS_REVISION
```

```text
[LANE-APPROVAL operator -> engineer] ticket=... round=2
Status: APPROVED
```

Labels are a closed set of `<lane>` ids from `docs/agent-roles/registry.json`: `operator`, `sales-rep`, `engineer`, `onboarding-guide`. The script refuses an unknown lane. `description` carries the short form (`engineer -> operator`, `operator -> engineer`), and `metadata` carries `fromAgent`, `toAgent`, `ticket`, `round`, `kind`. Metadata is not visible to the model, so the label in the text is mandatory, not decorative.

# DATA FLOW

```text
operator creates ticket (git, as today)
  -> dispatcher starts worker session S on slot nvidia-N (as today)
  -> worker finishes, writes reply artifact + proof in git
  -> worker: message.ts report  -> POST /api/session/{operator}/synthetic   [wakes operator]
  -> operator reads the artifact, then:
       OK     -> message.ts approve -> POST /api/session/{S}/prompt         [wakes worker]
       NOT OK -> message.ts review  -> POST /api/session/{S}/prompt         [wakes worker]
  -> worker revises in session S (history intact), reports round N+1
  -> stop on APPROVED or at round 4
```

The worker session is not closed and not replaced between review rounds. That is what keeps the context and avoids a second credential slot.

# TERMINATION AND BOUNDS

- Round 1 is the first report. Round 4 is the last permitted report; a review after round 4 is refused by the script and written as a rejection with a fresh ticket.
- `APPROVED` is only sent by the operator, only after the artifact was read, and is mirrored in `docs/agent-roles/status.md` and `docs/proof/`.
- Two negative reviews of the same point end the loop; the operator writes a new bounded ticket instead of arguing in messages.
- The hourly watchdog still owns stale-session cleanup; the message script never kills or forks a session.

# ERROR HANDLING

- Target session missing or dead: exit non-zero, write `docs/proof/<date>-review-loop-error.md`, and tell the caller to create a new ticket. No silent fallback to git-only will be described as "delivered".
- API refused (401/404/429): retry once with the same idempotency id; then stop. A 429 is not retried in a loop.
- Duplicate id: treat as success, print `already-delivered`.
- A report arriving while the operator is already working is queued, not steered; it is delivered when the current step ends.

# SECURITY

- Whitelist of permitted `(fromAgent -> toAgent)` pairs lives in `docs/agent-roles/keys.json`; a lane may report only to `operator`, and only `operator` may send `review` or `approve`.
- The operator treats any message whose label is missing or whose `fromAgent` does not match the label as untrusted input and answers with a rejection ticket.
- Messages contain paths, not file contents. The artifact in git is what gets reviewed.

# FILES THIS WILL TOUCH (implementation, not yet approved)

- `scripts/dev/agent-fleet/message.ts` — new.
- `scripts/dev/agent-fleet/dispatch.ts` — append the exact report command to the worker prompt.
- `docs/agent-roles/operator.md` and the generated `.opencode/agents/operator.md` — add the review-loop steps and the round limit.
- `docs/agent-roles/keys.json` — title patterns and permitted pairs.
- `docs/autonomy.md` and `docs/decisions.json` — the owner's decision and its source.
- `tests/tooling/agent-fleet-message.test.ts` — new.

No acceptance gate, `gates.lock`, workflow, or boundary lock is changed.

# TESTING

Unit tests (no live API): title resolution from a fixture session list, rejection of dead sessions, idempotency id format, closed label set, permitted-pair enforcement, round-4 refusal, and `queue`/`resume:true` flags on every send.

Proof of the real thing: one engineer report, one operator review naming a specific part, one revision in the same session, one approval, with session titles and message ids recorded in `docs/proof/`. `npm test`, `npm run check`, and `npm run roles:check` must pass.

# OPEN QUESTION FOR THE NEXT STAGE

The operator session title is `slot-console`; worker titles are `slot-<id>/<lane>-<stamp>`. If the owner wants a review to reach a lane whose worker session has already ended, the design refuses it and creates a fresh ticket. Confirm that behaviour during spec review.
