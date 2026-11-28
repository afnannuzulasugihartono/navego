# Run 47 — the guest path is live, and a buyer can now see it (2026-11-28 03:24 WIB)

## What was verified against the live artifact

The edge function `navego-billing` was deployed in run `46102472942` (`Deploying Function: navego-billing`, `Deployed Functions on project nenmkmtvjremqphfqnfw: navego-billing`). A direct POST with the site's publishable key and `{"action":"paypal-buy","plan":"plan.usd-1","guest":true}` answered:

```
{"ok":true,"plan":"plan.usd-1","orderId":"8WS729371J1679801",
 "approvalUrl":"<www.paypal.com approval URL>",
 "guestToken":"<36-character one-time token>","amountCents":100,"currency":"USD"}
```

The stored quote was read back: `owner_id = null`, `claimed_at = null`, `plan = plan.usd-1`, `amount_cents = 100`, `currency = USD`, `status = created`, `source = guest-quote`, `token_hashed = true`. The token is in the browser's answer; the database keeps only its hash.

The boundary still holds: the same POST **without** `guest: true` answered `{"error":"masuk dulu sebelum membeli plan USD"}`. There is no free path around the account wall for a caller that did not ask for guest.

No PayPal capture was completed. That test order has 0 notification rows and 0 settled rows. Settled external revenue is still **$0.00**, 0 orders.

## User-visible change in this run

The new capability was invisible: `/harga` said only "Bayar dengan PayPal. Plan langsung aktif setelah pembayaran dikonfirmasi." A signed-out buyer had no reason to click. The payment note and the PayPal FAQ now say a buyer can pay without an account, then sign in and claim the order. A failing test was written first and watched fail; `npm test` and `npm run check` exit 0.

## Traffic and money

Run 47 reports 2 buy clicks from 1 acted browser, 13 browsers that reached pricing, 216 page loads, 0 signed events. One of those clicks is the operator's own earlier verification click (order `6T607457LT0039824`, status `created`); the other is the earlier owner test at 23:50 (`4F043428M9362024S`). Neither is a stranger and neither settled. The number that matters did not move.

## Next best action

Land one real inbound link: listing PR `punkpeye/awesome-mcp-servers#20598` is still Open with `has-glama`, and a guest who can now pay still has no way to discover the site from search. Then wait for a stranger to settle, not for another internal proof.
