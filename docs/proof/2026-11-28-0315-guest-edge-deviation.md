# Operator deviation — the guest billing edge, 2026-11-28 03:15 WIB

## Why the operator is writing product code in this run

`docs/agent-roles/registry.json` assigns `hosted/migrations/**`, `site/app/**` and `tests/**` to the engineer lane but assigns `hosted/functions/**` to no role. The engineer lane proved the database and browser halves and handed over the exact edge diff in `docs/agent-roles/queue/engineer-to-operator-20261128-0025.md`. The manager therefore takes this one bounded file as a recorded deviation, with the source written into `docs/decisions.json -> hosted-guest-edge-01`. No other lane work moved.

## Evidence that the deviation is needed

Live POST to `navego-billing` with the publishable key and `{"action":"paypal-buy","plan":"usd-1","guest":true}` answered `{"error":"masuk dulu sebelum membeli plan USD"}`. The live `/harga` bundle already asks for `guest: true` and carries the claim endpoint. A signed-out buyer is stopped at the only component that holds the PayPal secret. This is a customer-visible revenue defect, not a document gap.

## What changed

- `hosted/functions/navego-billing/index.ts`: `paypal-buy` serves a guest order only when there is no session and `guest === true`; a new `crypto.randomUUID()` token is passed raw to `opera_paypal_create_guest_order` and the answer carries `approvalUrl`, `guestToken`, `amountCents` and `currency`. The signed-in path and its price checks are untouched.
- `paypal-capture`: a guest order carrying the `guest` marker is captured only after `opera_paypal_orders` shows that `owner_id` is the signed-in account and `claimed_at` is set; the settle call accepts the `guest` marker only for that claimed quote. Every other order keeps the original owner check.
- `tests/billing/paypal-guest-edge.test.ts`: written first and watched fail (3 of 4), then green; the older `paypal-wiring.test.ts` still passes.

`npm test` and `npm run check` exit 0.

## What this proof does not claim

No PayPal payment was captured, no order was settled, and no revenue rose. Settled external revenue remains $0.00, 0 orders. The migration must be applied before this function is deployed; a deployment without the migration would only turn the wall into a 502. The endpoint must be driven again after both production operations.
