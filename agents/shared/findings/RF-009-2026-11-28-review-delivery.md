# RF-009 — review-loop delivery semantics (2026-11-28)

Decision supported: the CLI reads back every post, wakes a queued target, and makes dropped ids retryable.

Measured against the live OpenCode service, not assumed:

1. `POST /api/session/{id}/synthetic|prompt` returning success is not proof the message is in the session. A message can sit in `GET /api/session/{id}/inbox` and never become a `GET .../message/{id}` item.
2. A message with `delivery: queue` stays in the inbox while the target is busy. Patching that inbox item to `steer`, or posting a wake prompt, drains it into the message list.
3. Ids are idempotent at the API. A dropped id cannot be re-posted as a new message; retry needs a fresh suffix after cancelling the queued item (`--attempt 2` → `:r2`).
4. The correct target matters: `engineer → operator` messages live in the operator console session, not the engineer session. A wrong-target read looks like total loss.
5. A live console session can carry `outcome: succeeded` while still running; the process table line is `opencode.exe serve --service` with no session title. Liveness must use a fresh heartbeat plus that service line, not outcome alone.

Applied in scripts/dev/agent-fleet/message.ts with failing tests first: read-back by message then inbox, `DELIVERY_QUEUED`, `DELIVERY_UNVERIFIED`, wake-and-re-read, retry ids and checkout of stale queue items. Evidence chain: docs/proof/2026-11-28-0635-delivery-verified.md, docs/proof/2026-11-28-0710-retry-delivery.md and docs/proof/2026-11-28-0450-receipt-0250.md.
