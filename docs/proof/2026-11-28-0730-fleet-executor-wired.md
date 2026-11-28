# Run 51 — the fleet can close what it can prove (2026-11-28 07:30 WIB)

## Selection

The selector chose `close-ticket` (`open-ticket`, 5 open, `buyerRepliesWaiting: 0`, `blockedLanes: 2`). RF-015 says the largest remaining manual touch is that the selector prints an action but no deterministic component performs it. This run closes that gap for the classes where the finish is already written in a file.

## What changed

- `scripts/dev/agent-fleet/executor.ts`: `executeNext` handles `close-ticket` only when a reply file contains `answered: <ticket>`. It writes a receipt naming both files into `docs/proof/`, and refuses to claim any payment, deployment or external message. Every other selected action returns `deferred` with an explicit reason — an external answer, a revenue path, an unblock, a claim drift or a code change needs a model or an owner.
- `scripts/dev/agent-fleet/research-gate.ts`: new `researchDispatchAllowed`. A research ticket whose gate verdict is not `run` is never dispatched.
- `scripts/dev/agent-fleet/dispatch.ts`: calls that gate after ticket selection, before opening a lane session. Non-research tickets are unaffected.

Four executor tests and one dispatch-gate test were written first and watched fail; all pass. Nine research-gate tests and the full suite pass. `npm test` and `npm run check` exit 0.

## Boundary

No gate was weakened. Merge and deploy still follow the existing workflows. The executor never sends an external message and never touches money. The reviewer gap remains written, not relabelled.

## Money

Settled external revenue remains $0.00, 0 orders; score −84. This is fleet plumbing, not customer income.
