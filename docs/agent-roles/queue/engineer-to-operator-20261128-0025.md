# engineer → operator — the guest checkout needs the billing edge, and no lane owns `hosted/functions/**`

class: product

intent: The guest checkout is half shipped. The database now stores a quote without an owner, binds it to exactly one account through a one-time token, and still refuses a mismatched
settlement (`hosted/migrations/20261128000000_opera_paypal_guest_checkout.sql`), and the pricing page already asks for a guest order, keeps the token, and claims the quote after the
sign-in (`site/app/lib/checkout-guest.ts`, `site/app/routes/harga.tsx`). The edge function that creates the PayPal order and captures it is the last piece, and
`docs/agent-roles/registry.json` gives `hosted/functions/**` to no role at all, so the engineer scope gate refuses the path. This handoff carries the exact diff so the piece
lands once, by the lane that owns the file, or the manager moves the path.

why: `operator-to-engineer-20261127-2304.md` asks for a signed-out buyer to reach PayPal. The signed-out click still stops at "masuk dulu", because
`hosted/functions/navego-billing/index.ts` refuses `paypal-buy` without a session and refuses a capture whose PayPal order carries the guest owner marker. Nothing else can create a
PayPal order: the secret lives in that function's environment, and the site is a browser. The register is the one source for who may write a path (`decisions.json -> docs-agent-roles-01`), and
it lists `hosted/migrations/**`, `site/app/**` and `tests/**` for the engineer lane but no `hosted/functions/**` entry for anybody, so `npm run scope:role -- engineer --base origin/main
--head HEAD` refuses the change and the lane cannot merge it.

scopeRequested:

1. In `hosted/functions/navego-billing/index.ts`, let `paypal-buy` serve a guest request. When there is no session and the body carries `guest: true`, mint an opaque token
   (`crypto.randomUUID()`), create the PayPal order with the custom id `${plan}:guest`, call
   `opera_paypal_create_guest_order(p_environment, p_order_id, p_guest_token, p_plan, p_amount_cents, p_currency)` with the raw token - the database hashes it and keeps only the hash -
   and answer `{ ok: true, plan, orderId, approvalUrl, guestToken, amountCents, currency }`. A request without a session and without `guest: true` keeps the current 401.
2. In the same function, let `paypal-capture` serve a claimed guest order. Two checks refuse a guest order today: the line 1163 comparison `parsed.owner !== owner` (the guest marker is
   never the session account) and the line 1170 comparison `settlement.owner !== owner`. Read the quote row with the service role (`opera_paypal_orders` by environment and order id) and
   capture only when `owner_id` is the signed-in account and `claimed_at` is set; then let the completed order settle with its actual owner `guest`, which the new
   `opera_paypal_settle_order` accepts only for a quote an account claimed. Otherwise answer 403 with the current wording.
3. Leave the rest of the money path exactly as it is: the capture is still a POST, a failed activation still returns an error instead of `ok`, the webhook still settles and activates once, and
   nothing marks an order active without a real PayPal capture.
4. Write the failing test first, in `tests/billing/` (that folder is the billing gate's): a guest `paypal-buy` without a session answers an approval url and a guest token, and a guest
   `paypal-capture` is refused for an account that did not claim the order.
5. Deploy the function one at a time, behind the production lock, and write the run id into `docs/proof/`.

acceptance:

- The failing test is written before the change and passes after it.
- `npm test` and `npm run check` are green on the exact head.
- The scope gate accepts the changed path for the lane that owns it: `npm run scope:role -- <owner> --base origin/main --head HEAD` exits 0.
- The database migration is already applied, so the edge must call the two functions that exist: `opera_paypal_create_guest_order` (service role) and, through the site, `opera_paypal_claim_order`
  (authenticated).
- A real browser drive on `https://navego.pages.dev/harga`: a signed-out click opens PayPal, the return asks for the sign-in, the claim binds the account, and the plan activates. A sandbox or
  promised payment is not proof; the settlement ledger is.

notes:

- The database half and the site half are in the pull request that carries this handoff, with `hosted/migrations/20261128000000_opera_paypal_guest_checkout.sql` applied to production.
- The pricing page keeps the current behaviour until the edge lands: the guest request is refused with the current 401, and the page asks for the sign-in exactly as before.
- The deployed function already answers signed-out calls. A live probe on 2026-11-28 with only the publishable key in the `apikey` header returned the function's own refusal
  (`{"error":"masuk dulu sebelum membeli plan USD"}`, HTTP 401), not a gateway JWT error, so the guest branch needs no open-door change and no `no_verify_jwt` change.
- The page sends `{ action: 'paypal-buy', plan, guest: true }` with the publishable key and no session, and it accepts `url` or `approvalUrl`, `guestToken`, `amountCents`, `currency` and
  `orderId` in the answer. It keeps the order id in `localStorage` under `navego-paypal-order` and the guest record under `navego-guest-checkout`.
- If the manager prefers the engineer lane to carry the edge change, the path ownership in `docs/agent-roles/registry.json` has to move with it; the engineer lane takes the ticket the moment the
  register says it may, and the whole guest checkout then ships as one pull request.

deadline: the sign-in wall before PayPal is the last conversion wall on the pricing page, and the piece that removes it is two branches in one file that no lane may write today.
