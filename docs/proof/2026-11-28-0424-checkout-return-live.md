# Live checkout-return verification — 2026-11-28 04:24 WIB

## What was driven

After deploying the localStorage fix from run #40, the live `/harga` page was read in a signed-in browser:

1. Before the test: a session token was present in localStorage; no pending plan was stored.
2. The known plan key `navego-checkout-plan` was set to `asia:plan.usd-3` and the page was reloaded.
3. After the reload: the page showed **"Lanjutkan plan pilihan Anda. Klik Beli dengan PayPal."** and the "Masuk dulu" wall was absent for that signed-in browser.

The test plan was removed from localStorage afterwards and the browser tab closed, so no checkout state was left behind.

## Why this matters

The original defect was that a buyer's chosen plan lived in `sessionStorage` of the tab that opened the magic link; the sign-in link opened a new tab, so the plan was lost on return. The live read now confirms the return path sees the plan and resumes checkout.

This is a verification of a shipped fix, not a new change. Settled external revenue remains $0.00, 0 orders, and no payment was captured.
