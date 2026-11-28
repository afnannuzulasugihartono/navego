# Round 3 delivered with a read-back receipt — 2026-11-28 07:10 WIB

## What the live check showed

The lane report measured `msg_engineer-to-operator-20261128-0604.md:1:report` and `:2:report` in the **engineer** session and found neither. Those messages are `engineer → operator`, so the correct target is the operator console session `ses_df1a6877cffen04QvCBE2T0ysR`. Read back there, both exist as type `user` messages. The wrong-target read produced a false "never stored" diagnosis.

## What was still broken

The first round-3 attempt existed only in the operator inbox. The fixed CLI did the right thing: it printed `sent:inbox`, then I patched the queued item to `steer` and woke the session; the message was consumed and then disappeared from both inbox and message list without a receipt.

## Fix shipped with TDD

`scripts/dev/agent-fleet/message.ts` now:

- rejects `inbox` as a success (`DELIVERY_QUEUED`);
- on a queued post, wakes the target session and reads back again;
- supports `--attempt 2`, which cancels stale queued ids and posts a fresh `:r2` id so a dropped id is retryable;
- prints `sent:message` only after the message endpoint returns that id.

Tests written first and watched fail:

```text
a queued but undelivered message is not reported as sent
a dropped id is retryable with a fresh id after cancelling the queued one
a queued delivery wakes the target and is re-read before success
```

15/15 message tests pass; `npm test` and `npm run check` exit 0.

## Real delivery

```text
msg_engineer-to-operator-20261128-0604.md:3:report:r2 sent:message ses_df1a6877cffen04QvCBE2T0ysR
GET /api/session/ses_df1a6877cffen04QvCBE2T0ysR/message/msg_...:3:report:r2 -> data.id present
```

Settled external revenue remains $0.00, 0 orders.
