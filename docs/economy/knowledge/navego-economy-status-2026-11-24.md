---
id: navego-economy-status-2026-11-24
title: Navego's measured economic state on 2026-11-24
kind: status
source: https://github.com/afnannuzulasugihartono/navego
observed: 2026-11-24
---

# Navego's measured economic state, 2026-11-24

Read from the production Supabase project behind `navego.pages.dev` on 2026-11-24.

## Money already received

| Row | Status | Provider | Currency | Amount | Line |
|---|---|---|---|---|---|
| `Toko Sinar Jaya:2026-09` | paid | manual | IDR | Rp 5.000 | one delivered client-month, CV Melati, 3 pages |
| `Uji Sandbox:2027-04` … `Uji Sandbox:2027-09` | paid | Midtrans | IDR | Rp 99.000 each | `plan.pilot`, sandbox |
| wallet top-up `wallet-mw1uup2e` | paid | QRIS self | IDR | Rp 1.000 | owner top-up, settled by hand after a real GoPay QRIS payment |

Eight paid rows exist. Six are sandbox plan rows and one is an owner wallet top-up. The only sale to a named customer is **Toko Sinar Jaya, Rp 5.000**, for one delivered client-month.

Total paid rows are Rp 599.000, but Rp 594.000 of that is sandbox and Rp 1.000 is the owner's own top-up. Real external revenue measured today is **Rp 5.000**.

## What is not revenue

- The Midtrans and QRIS invoice rows that are still open are requests for money, not money.
- The six paid `plan.pilot` rows are the sandbox simulator, so they prove the payment path and nothing about demand.
- The 14 paired devices and 1.611 usage reports prove activity, not willingness to pay.

## The funnel measured today

`opera_funnel_events` holds 27 rows, all from 2026-11-24: 9 page views of `/`, 6 of `/dashboard`, 6 pair views, 1 `/harga` page view, 1 `plan.view`, and 1 `buy.click`. No paid USD invoice exists. The checkout button was clicked once and no PayPal plan was activated.

## The offer still on sale

The live price list has seven active USD plans: `plan.usd-1` ($1/month), `plan.usd-3`, `plan.usd-5`, `plan.usd-7`, `plan.usd-9`, `plan.usd-17` ($17 for six months), and `plan.usd-33` ($33 for one year). The retired IDR plans `plan.pilot` and `plan.firm` are inactive. The `statement.client_month` line is still active at Rp 10.000 while the customer who received one client-month was invoiced Rp 5.000 under the older row.

## What this means for the loop

1. The loop cannot buy an AI subscription yet. With Rp 5.000 of real revenue and a 50% reserve, the spendable amount is Rp 2.500.
2. The cheapest useful step is not an AI upgrade. It is more revenue from the offer that already works.
3. The knowledge library must carry the price of every offer and every subscription, with its source and date, so the loop compares like with like.
4. Every decision that spends money and brings none back is minus. The only decision measured today that earned is the statement delivery to Toko Sinar Jaya.
5. The owner's ML.ai account is the capability budget the loop can already reach: one routine, **Review navego**, trigger `github`. The key is stored in OMP's credential store under provider `mlai` and works against `https://code.ml.ai`. See `mlai-integration-2026-11-24.md`.
6. ML.ai Infinite costs $99/month ($50/month for the first three months, first 30 days free). That is far above today's spendable amount, so the plan is the target the loop grows toward, not a purchase the loop can make now.
