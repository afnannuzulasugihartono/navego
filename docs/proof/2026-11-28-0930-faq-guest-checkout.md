# Run 53 — the FAQ no longer contradicts the checkout (2026-11-28 09:30 WIB)

## What was observed

The selector chose `close-ticket`. Live guest checkout, the pricing copy and `/dukungan` were already aligned, but `/faq` still carried three answers from the account-wall era:

- *Apakah saya perlu akun?* — "To buy a plan and use Dashboard, yes".
- *Pembayaran dikonfirmasi tapi plan belum aktif?* — "activated automatically after PayPal", with no claim step.
- *Berapa harganya?* — "pay with PayPal and it activates immediately".

A buyer reading the FAQ would be told to create an account before paying and would not find the **Klaim pesanan saya** path that actually activates a guest order. This is a customer-visible contradiction, not a missing feature.

## What changed

The three answers now say: a buyer can pay without an account, then sign in and claim the order on `/harga`; Dashboard and device pairing still use an account; a pending order appears at the top of the pricing page; and a failed claim should be reported with the order ID. Two failing tests were written first and watched fail; both pass. `npm test` and `npm run check` exit 0.

## What this does not claim

No payment rail, gate or owner-only path changed. Settled external revenue remains $0.00, 0 orders; score −86. Correcting documentation does not create a buyer.

## Next best action

One bounded follow-up on the same listing thread on a day when no other public action has been sent, then stop. Only a settled stranger payment moves the score.
