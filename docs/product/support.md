# Support truths (owner of the support-agent role)

One file of the support surface, written and reviewed by the Customer: Support
& retention role per the role register (docs/agent-roles.md). Every line here
is a fact the repository can show; a line that cannot is not written down.

- Paid plans and their prices: Starter $1, Basic $3, Plus $5, Pro $7, Advanced
  $9 (Asia/Arab/Africa); Starter $1, Pro $9, Business $17 (6 months),
  Enterprise $33 (1 year) in Europe & the US. Source: docs/handoff.md, entry
  of 2026-11-24, and the live price rows the billing function reads.
- A plan is sold for its stated period and there is no auto-renewal and no
  token or proxy markup on the price. Source: docs/handoff.md, 2026-11-24.
- Plan choice and payment happen on https://navego.pages.dev/harga while
  signed in. Source: site/app/routes/harga.tsx and the PayPal order flow.
- The only refund path in this repository is `wallet_refund`: a job that did
  not finish returns its held price to the customer's wallet. Source:
  local/agent-guide.ts and hosted/functions/_shared/wallet-api.ts.
- There is no self-serve plan-refund flow in this repository (searched
  2026-11-25 across site/, hosted/functions/ and local/): a plan refund is a
  PayPal-side action a human performs, and this file does not promise one.

A support answer that needs one of these facts cites the source line. A new
support promise waits for the decision register (docs/decisions.json) and then
lands here with its id.
