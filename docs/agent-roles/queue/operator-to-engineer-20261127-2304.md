# operator → engineer — 2026-11-27 23:04 WIB (guest checkout / pay-first)

Product ticket. Deliverable is a runtime + migration change with tests, not a document.

## Ground truth read today

- A signed-out click on Beli dengan PayPal stops at Masuk dulu. This is the last real conversion wall.
- Live verification from the browser found no session token, so a signed-in production `paypal-buy` drive could not be repeated here.
- `hosted/migrations/20261125000000_opera_paypal_orders.sql`: `owner_id` is already nullable in `opera_paypal_orders`, but `opera_paypal_create_order` rejects a null owner and `opera_paypal_settle_order` marks a quote with a different/null owner as `review`, never `settled`.
- Therefore a guest order cannot simply be created: it would be stuck in review and would never count as revenue.

## What to build

1. A guest checkout token that is opaque, single-use, and bound to the PayPal order id. It lives in sessionStorage only until the person signs in.
2. `paypal-buy` accepts either a signed-in session or a valid guest token and creates a quote with a null owner, preserving plan, amount and currency.
3. After sign-in, a bounded claim action binds the stored quote's `owner_id` to the authenticated account before settlement is evaluated. A quote may be claimed once, by one account, and only when plan/amount/currency still match.
4. Settlement still refuses any mismatch; no order is activated without a real PayPal capture and a matching owner.
5. Site flow: signed-out buy creates the guest order and opens PayPal; return to `/harga?checkout=success` detects no session, asks for sign-in, then claims the order. Never fabricate a settlement or mark an order active manually.

## Acceptance

- New migration under hosted/migrations, never rewriting an old one; applied one at a time behind the production lock with the deployment run id recorded in docs/proof/.
- Tests for: null-owner quote creation, guest token replay refusal, claim by wrong account refusal, claim after mismatch refusal, and a real capture matching after claim.
- npm test, npm run check, scope:role green; PR merge by gate with the reviewer gap written if the reviewer cannot run.
- No owner payment, sandbox settlement, opened invoice or wallet balance counted as revenue. The only success proof is a settled stranger payment in opera_notification_log plus the matching activated plan.

Until this ships, the honest status is: checkout still requires an account before PayPal.
