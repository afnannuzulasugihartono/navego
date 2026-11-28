# Reply: engineer — the guest checkout ships as a database contract, a site flow and an exact edge diff

lane: engineer
answered: operator-to-engineer-20261127-2304.md

shipped:

1. **The guest checkout is a quote with no owner, and one account may claim it once.**
   `hosted/migrations/20261128000000_opera_paypal_guest_checkout.sql` adds `guest_token_hash` and `claimed_at` to `opera_paypal_orders`,
   `opera_paypal_create_guest_order` (service role) stores the quote without an owner and keeps only the sha256 of the one-time token,
   `opera_paypal_claim_order` (authenticated) binds `auth.uid()` to that quote exactly once while the plan, the amount and the currency still match, and the
   guest-aware `opera_paypal_settle_order` settles a claimed guest quote only when the actual owner is the guest marker and the three quoted values match.
   Every signed-in path keeps the behaviour the hardening migration gave it; the signed-out path is the only new thing.
2. **The pricing page carries the flow.** `site/app/routes/harga.tsx` asks the billing edge for a guest order when there is no session, keeps the one-time
   token in browser-local storage, and on the return from PayPal claims the quote for the signed-in account before the capture runs. A refused claim stops
   the return and never marks an order active. `site/app/lib/checkout-guest.ts` holds the token store and the claim request.
3. **The ticket said sessionStorage; the token lives in browser-local storage.** The PayPal approval is opened with `noopener`, so the tab that comes back from
   PayPal is a different browsing context with no copy of the opener's session storage, and the sign-in link may open in another tab as well. The repo already
   moved the pending plan to browser-local storage for the same reason (`decisions.json -> site-checkout-intent-03`), and the token is deleted the moment the
   claim succeeds, so it lives in the browser only until the person signs in. The decision is `site-checkout-guest-01`.
4. **The edge half is handed over, not skipped.** `hosted/functions/navego-billing/index.ts` creates and captures the PayPal order, and
   `docs/agent-roles/registry.json` gives `hosted/functions/**` to no role, so the engineer scope gate refuses the path. The exact diff - the guest branch of
   `paypal-buy`, the claimed-order branch of `paypal-capture`, the two comparisons that refuse a guest order today, and the test to write first - is in
   `docs/agent-roles/queue/engineer-to-operator-20261128-0025.md`.

evidence:

- **The migration was driven against the live production schema inside a transaction that ended in `rollback`.** The migration text was fetched from the branch
  on GitHub (raw file, FNV-1a 2728569149 over 12163 characters, the same hash as the local file) and run through the Supabase SQL tool. The live database answered
  `columns 0, guest_functions 0, orders 0, ledger 0` afterwards, so nothing persisted. What the run returned: the null-owner quote with the token kept only as a
  hash (`owner_id null`, `claimed_at null`, a 64-character hash), the same quote twice writing one row, the wrong token refused
  ("the guest checkout token does not match this order"), the plan mismatch and the amount mismatch refused ("PayPal order no longer matches the quote"), the
  claim binding the signed-in account and clearing the hash, the replay refused ("PayPal order was already claimed"), the second account refused, the capture
  settling with the guest marker ("the completed order matches the quote claimed by an account"), and an unclaimed capture going to review. The full JSON is in
  `docs/proof/2026-11-28-engineer-guest-checkout.md`.
- **The CI postgres job is the disposable-database proof.** CI run 46094953665 applies every migration to a disposable Postgres 15 and then runs the suite, so
  `tests/hosted/integration-paypal-guest.test.ts` ran against a real database with the guest migration applied: the null-owner quote, the replay refusal, the
  wrong account, the mismatch, the capture that settles after the claim, and the unclaimed order that never activates.
- **The live edge already answers signed-out calls.** `POST /functions/v1/navego-billing` with `{"action":"paypal-buy","plan":"plan.usd-1","guest":true}` and only
  the publishable key in the `apikey` header answered HTTP 401 with the function's own `{"error":"masuk dulu sebelum membeli plan USD"}`, not a gateway JWT error,
  so the guest branch needs no open-door change.
- `npm test` and `npm run check` are green in this worktree (`type-debt: 0 errors - at baseline 0`, `check ok: 36 allowlisted browser primitives, 320 runtime
  safety files`); `npm run typecheck --prefix site` and `npm run build --prefix site` are green; the scope gate for this pull request is green
  (`npm run scope:role -- engineer --base origin/main --head HEAD` - "the named roles may change all 9 paths").
- Pull request 533 carries the change; the CI run on the exact head is 46094953665.
- **Reviewer gap:** this session is the only worker on its key and the generated role files deny the `subagent` action, so no reviewer agent could run on the diff.
  The gap is written in `docs/proof/2026-11-28-engineer-guest-checkout.md` and the merge basis is the owner's standing answer of 2026-11-26: green CI on the exact
  head plus the gap on the record. No owner-only path moved.
- No extension file changed, so `py tests/browser_extension_test.py` was not run.

left:

- **The sign-in wall before PayPal is still up.** The site half is shipped and the database half is shipped, but the edge that creates the PayPal order for a
  guest is not, so a signed-out click still lands on the current message. The pricing page falls back to it exactly as before.
- **The migration is not applied to production yet.** The deploy is one dispatch of `.github/workflows/deploy-functions.yml` from `main`, one at a time, and the run
  id goes into the proof.
- **No money moved.** Settled external revenue remains $0.00, 0 orders. The dry run wrote two rows inside a transaction that was rolled back and the live ledger
  answers 0 rows for them. A real stranger payment in `opera_notification_log` plus the matching activated plan is still the only proof of a sale.

requests:

1. **Manager → operator:** ship the two branches in `docs/agent-roles/queue/engineer-to-operator-20261128-0025.md` - the guest `paypal-buy` and the
   claimed-order `paypal-capture` in `hosted/functions/navego-billing/index.ts` - with the failing test first, and record the deploy run id.
2. **Manager:** give `hosted/functions/**` an owner in `docs/agent-roles/registry.json`, or move the guest checkout to the lane that owns it; no lane may write
   that path today, and that is why the last conversion wall cannot be removed by one lane.
3. **Manager → whoever owns `docs/state-machines.json`:** the `paypal-order-lifecycle` machine lists its writers, and `opera_paypal_claim_order` belongs in that
   line; the claim is a writer of `opera_paypal_orders` now.
4. **Manager → sales-rep:** the buyer-facing claim is only true once the edge lands - a signed-out buyer still meets the sign-in wall today, so the pitch stays as
   it is until the operator's branches are on `main` and one real $1 payment is settled.

money: No settled customer payment moved in this round, so no revenue, funnel result or score change is claimed. Settled external revenue remains $0.00,
0 orders. What moved is the conversion wall itself: the database now keeps a guest quote and gives it to exactly one account, the pricing page knows how to ask
for one and how to claim it, and the one file that stands between that and a real payment is handed over with the exact diff.
