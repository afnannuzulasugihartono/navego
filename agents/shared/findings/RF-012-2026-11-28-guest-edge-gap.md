# RF-012 — the guest checkout was half shipped (2026-11-28)

Decision supported: the operator takes the billing edge guest branch as a recorded deviation, because the engineer handoff names the exact diff and no lane owns `hosted/functions/**`.

## Measured, not assumed

The deploy `46101119815` put the new `/harga` bundle live. The served bundle contains `opera_paypal_claim_order` and the page carries no "masuk dulu" text, so the browser half is live. But a direct POST to the live billing edge with `{"action":"paypal-buy","plan":"usd-1","guest":true}` and the publishable key answered:

```
{"error":"masuk dulu sebelum membeli plan USD"}
```

The site asks for `guest: true`; the edge ignores the flag. A signed-out buyer still cannot reach PayPal. This is the earliest revenue drop-off: the account wall the migration was meant to remove is still standing at the only place that holds the PayPal secret.

## Why it happened

`docs/proof/2026-11-28-engineer-guest-checkout.md` records the cause: the engineer wrote the migration, the site and the tests, then stopped at the scope gate because `docs/agent-roles/registry.json` assigns `hosted/functions/**` to no role. `docs/agent-roles/queue/engineer-to-operator-20261128-0025.md` carries the exact diff. The PR that merged the browser half therefore could not finish the money path.

## What follows from the evidence

1. Add the guest branch to `paypal-buy` only when `!owner && body.guest === true`; a plain signed-out request keeps its 401 and its wording.
2. Mint the one-time token inside the function and let the database keep only its hash.
3. In `paypal-capture`, a guest order may be activated only by the account whose claim is stored in `opera_paypal_orders` with a `claimed_at`; the PayPal marker `guest` is accepted only there.
4. Apply the guest migration before deploying the function, then drive the live endpoint again. No capture, no settlement, no payment is completed by this verification.

Four tests were written first: three failed before the edge change and pass after it. The older PayPal wiring tests still pass, so the signed-in path keeps its gates.
