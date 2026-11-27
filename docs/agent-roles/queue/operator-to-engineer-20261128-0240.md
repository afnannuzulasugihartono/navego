class: product

# operator → engineer — 2026-11-28 02:40 WIB (review-loop target liveness)

Deliverable: a runtime fix in the review loop, not a document.

## Defect

`resolveSessionId` in the planned scripts/dev/agent-fleet/message.ts treats any stored session `outcome` as death. In the live review loop, the operator console session `slot-console/agent-manager-20261126` was still running while its API record said `outcome: succeeded`. A report could not resolve it and failed with `TARGET_SESSION_MISSING`; the round was delivered only by bypassing the CLI and posting directly to the known id. The worker named this as still open in reply `engineer-reply-20261127-1620.md`.

The published `navego doctor` incident had the same shape: a process line or a stored field was treated as ground truth while the live heartbeat said otherwise.

## What to change

- Decide liveness from the session's own heartbeat (`time.updated`) and the absence of a running process, not from `outcome` alone.
- Keep refusing a session that is genuinely finished and stale; do not post into a dead context.
- Preserve idempotency id, label, whitelist, `delivery: queue` and `resume: true`.
- Write a failing test first: a session with `outcome: 'succeeded'` but an updatedMs inside the stale window must resolve as live; a session with the same outcome and an old heartbeat must not.

## Acceptance

- A test fails before the change and passes after.
- One live report→review→approve round using the CLI, with the target resolved by the CLI and no direct API bypass.
- npm test and npm run check green; PR merge by gate with the reviewer gap written if the reviewer cannot run.
- Record the exact session titles, message ids and delivery mode in docs/proof/.
- No approval is sent before the artifact is read.

Until this ships, the review loop mechanism is proven only with a direct API target; the CLI still fails closed on a live-but-marked-succeeded operator session.
