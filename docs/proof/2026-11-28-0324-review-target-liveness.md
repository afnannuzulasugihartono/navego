# Review-loop target liveness fixed — 2026-11-28 03:24 WIB

## Defect

`resolveSessionId` rejected any session whose stored `outcome` was non-null. The live operator console session was still running while its API record said `outcome: succeeded`, so a report could not be targeted and failed with `TARGET_SESSION_MISSING`. The round had to be delivered by direct API call with a known id.

## Fix

`resolveSessionId(titlePrefix, sessions, now, staleMs)` now treats a fresh heartbeat as liveness. An outcome alone no longer means dead; a session whose `updatedMs` is older than the stale window is still refused. Defaults keep existing callers working.

A failing test was written first:

```text
a just-finished session with a fresh heartbeat still receives the review
```

It failed while `outcome` alone decided liveness and passes after the change. The older test for stale sessions still passes.

## Live proof through the CLI

```text
node scripts/dev/agent-fleet/message.ts --kind report --from engineer --to operator \
  --ticket operator-to-engineer-20261128-0240.md --round 1 \
  --text 'pointer to ...'

msg_operator-to-engineer-20261128-0240.md:1:report sent ses_df1a6877cffen04QvCBE2T0ysR
```

The CLI itself resolved the live operator session `slot-console/agent-manager-20261126`; no direct API bypass was used. Labels, whitelist, idempotency id, `delivery: queue` and `resume: true` remain in force.

## Gates

- `node --test tests/tooling/agent-fleet-message.test.ts`: 7/7 pass.
- `npm test`: exit 0; `npm run check`: exit 0.

Settled external revenue remains $0.00, 0 orders. This is a reliability fix, not revenue.
