# Chosen plan crossed the sign-in tab boundary — 2026-11-28 02:24 WIB

## Bug found by driving

On 2026-11-28 the operator signed in through the live `/masuk` magic-link flow. The sign-in link from Gmail opened a **new tab** and landed on `/dashboard`. The chosen plan before sign-in was stored with `sessionStorage`, which is per-tab, so a buyer who picked a plan on `/harga`, went to `/masuk`, and followed a magic link would return to `/harga` with no plan remembered.

## Fix

`site/app/lib/checkout-intent.ts` now uses browser-local storage by default. The explicit storage parameter remains, so the existing tests for blocked storage still hold. A failing test was written first:

```text
the pending plan survives a magic link that opens a new tab
```

It failed while the default was `sessionStorage` and passes with `localStorage`.

## Verification

- `node --test tests/site/checkout-intent.test.ts`: 3/3 pass.
- `npm test`: exit 0; `npm run check`: exit 0.
- Site typecheck/build are part of the suite.

No payment was captured and no settlement was created. Settled external revenue remains $0.00, 0 orders.
