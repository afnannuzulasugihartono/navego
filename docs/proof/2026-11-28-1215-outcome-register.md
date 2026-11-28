# Run 57 — the two simplest unimplemented research items are now shipped

## Selection

RF-020 audited RF-001…RF-019 and ranked the backlog. Items 1 and 2 are machine-verifiable and reversible, so they are implementable without an owner-only path. Items 3–7 remain: wire the hourly automation to the executor, enable GitHub auto-merge, add decision-value checks to the research gate, collapse idle lanes, and the external outcomes.

## What changed

- `scripts/dev/agent-fleet/outcomes.ts` writes `docs/agent-roles/loop/outcomes.json` with schema `navego-outcomes-v1`: settled money and orders from the ledger, unanswered **dated** replies only, verified executor receipts, and answered tickets. `goal.ts` reads the register when a path is supplied and falls back to direct artefact derivation when it is missing or malformed. Two failing tests were written first and watched fail.
- `scripts/dev/agent-fleet/regressions.ts` groups three known failures into one gate: a README example must not count as a buyer, a queued message must not be called sent, and an owner buy click must not be called stranger traffic. Two failing tests were written first; the CLI was driven and all three checks passed.

`npm test` and `npm run check` exit 0.

## Boundary

No gate weakened, no payment touched, no auto-merge enabled, no lane removed. The register is a mirror of artefacts, not a second source of truth; if it drifts, the selector can still read the files directly.

## Money

Settled external revenue remains $0.00, 0 orders. This removes two internal failure modes, not a customer.
