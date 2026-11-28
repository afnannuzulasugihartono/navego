# Proof (engineer lane): the guest checkout contract, driven against the live database and rolled back

date: 2026-11-28
lane: engineer
ticket: operator-to-engineer-20261127-2304.md
worker: this session, its own worktree (`sunny-tiger`), its own branch, no child session

The ticket asked for a runtime + migration change with tests: a signed-out buyer reaches PayPal, and after signing in one account claims the order exactly
once. The database half and the site half ship in this pull request. The edge function half - the file that creates and captures the PayPal order - lives in
`hosted/functions/navego-billing/index.ts`, and `docs/agent-roles/registry.json` gives `hosted/functions/**` to no role at all, so the engineer scope gate refuses
the path. That half is handed over in `docs/agent-roles/queue/engineer-to-operator-20261128-0025.md` with the exact diff.

## What shipped

- `hosted/migrations/20261128000000_opera_paypal_guest_checkout.sql`: `opera_paypal_create_guest_order` (service role) stores a quote with no owner and the
  sha256 of the one-time token, `opera_paypal_claim_order` (authenticated) binds `auth.uid()` to that quote once and clears the token hash, and the guest-aware
  `opera_paypal_settle_order` settles a claimed guest quote only when the actual owner is the guest marker and the plan, the amount and the currency match.
  Every signed-in path keeps the behaviour the hardening migration gave it.
- `site/app/lib/checkout-guest.ts`: the one-time token lives in browser-local storage and the claim is posted with the session in the request.
- `site/app/routes/harga.tsx`: a signed-out click asks the billing edge for a guest order, keeps the token, and the return claims the quote before the capture.
- `docs/decisions.json`: `hosted-paypal-guest-checkout-01` and `site-checkout-guest-01`.
- `hosted/migrations/ledger-map.json`: the new file is named as not yet applied; the entry moves to `applied-outside-ledger` when the deploy run proves it.

## The migration, driven against the live database and rolled back

The migration text was fetched from the branch on GitHub (raw file, FNV-1a 2728569149 over 12163 characters, the same hash as the local file) and run inside one
transaction against the production schema through the Supabase SQL tool. The transaction ended in `rollback`, so nothing persisted: after it, the live database
answered `columns 0, guest_functions 0, orders 0, ledger 0` for the guest columns, the two guest functions and the dry-run ids.

What the run returned:

```json
{"quote": {"ok": true, "created": true, "status": "created", "orderId": "DRYRUN-ORDER-1"},
 "row_after_quote": {"owner_id": null, "claimed_at": null, "plan": "plan.usd-1", "amount_cents": 100, "currency": "USD",
   "guest_token_hash": "49b422c9… (the sha256 of the dry-run token, truncated here)"},
 "quote_again": {"ok": true, "created": false},
 "claim_wrong_token": {"ok": false, "error": "the guest checkout token does not match this order"},
 "claim_plan_mismatch": {"ok": false, "error": "PayPal order no longer matches the quote"},
 "claim_amount_mismatch": {"ok": false, "error": "PayPal order no longer matches the quote"},
 "claim": {"ok": true, "status": "claimed", "plan": "plan.usd-1"},
 "row_after_claim": {"owner_id": "11111111-1111-4111-8111-111111111111", "claimed_at": "2026-11-28T01:39:37.529845+00:00", "guest_token_hash": null},
 "claim_replay": {"ok": false, "error": "PayPal order was already claimed"},
 "claim_other_account": {"ok": false, "error": "PayPal order was already claimed"},
 "settle_guest_marker": {"ok": true, "status": "settled", "reason": "the completed order matches the quote claimed by an account"},
 "row_after_settle": {"status": "settled", "owner_id": "11111111-1111-4111-8111-111111111111", "actual_owner_id": "guest",
   "actual_plan": "plan.usd-1", "amount_cents": 100, "currency": "USD"},
 "unclaimed_settle": {"ok": true, "status": "review", "reason": "the completed order has no stored quote"}}
```

That is every case the ticket named, against the live schema: the null-owner quote with the token kept only as a hash, the replay refusal, the wrong account,
the mismatch, and a capture that settles after the claim. The first attempt at this run was written by hand into the tool call and carried a typo
(`upper(trim(p_currency))` instead of `upper(trim(p_actual_currency))`) that the database caught at once with
`ERROR: 42703: column "p_currency" does not exist`. The committed file was always correct; the second run fetched the file from GitHub instead of being typed,
which is why the proof quotes the fetched bytes.

## The edge the site has to talk to

A signed-out probe of the live billing function, with only the publishable key in the `apikey` header and no session:

```text
POST https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/navego-billing
{"action":"paypal-buy","plan":"plan.usd-1","guest":true}
→ HTTP 401 {"error":"masuk dulu sebelum membeli plan USD"}
```

The function's own refusal, not a gateway JWT error: the deployed function already answers signed-out calls, so the guest branch needs no open-door change.

## The gates on the exact head

- `npm test` and `npm run check` are green in this worktree (`type-debt: 0 errors - at baseline 0`, `check ok: 36 allowlisted browser primitives, 320 runtime
  safety files`).
- `npm run typecheck --prefix site` and `npm run build --prefix site` are green.
- `npm run scope:role -- engineer --base origin/main --head HEAD` is green: "the named roles may change all 9 paths".
- The CI run on the exact head is 46096592842. The `postgres` job applies every migration to a disposable Postgres 15 and then runs the suite, so the
  integration test ran against a real database with the guest migration applied: `tests/hosted/integration-paypal-guest.test.ts`.

## The reviewer gap

This session is the only worker on its key and the generated role files deny the `subagent` action, so no reviewer agent could run on the diff. The merge basis
is the owner's standing answer of 2026-11-26: green CI on the exact head plus this gap on the record. No owner-only path moved (`gates.lock`,
`tests/helpers/boundary-locks.ts`, `.github/CODEOWNERS`, `.github/workflows/`).

## What is not proven

- No money moved. Settled external revenue remains $0.00, 0 orders. The dry run wrote two rows inside a transaction that was rolled back, and the live ledger
  answers 0 rows for them. A real stranger payment in `opera_notification_log` plus the matching activated plan is still the only proof of a sale.
- The sign-in wall before PayPal is still up, because the edge half is not shipped. The pricing page falls back to the current message until it lands.
- The migration was not applied to production by this session: the deploy is one dispatch of `.github/workflows/deploy-functions.yml` from `main`, one at a time,
  and the run id is recorded in the follow-up proof.
- No extension file changed, so `py tests/browser_extension_test.py` was not run.

## Next

1. Merge this pull request by the gate, then dispatch the deploy workflow for the migration alone and write the run id into this file.
2. The operator lane ships the two branches in `docs/agent-roles/queue/engineer-to-operator-20261128-0025.md`.
3. One real $1 stranger payment through the signed-out path, then read the `paypal-live` settlement row and the activated plan.
