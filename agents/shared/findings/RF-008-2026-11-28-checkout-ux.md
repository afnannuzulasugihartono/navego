# RF-008 — checkout and payment UX research (2026-11-28)

Decision supported: classify acted traffic before calling it a lead, and keep the pay-first ticket open.

| Source | What was taken |
|---|---|
| Baymard, Cart & Checkout Usability — https://baymard.com/research/checkout-usability | 70.19% average cart abandonment; checkout design is often the sole cause; 65% of benchmarked sites are mediocre or worse. |
| NN/G, How Users Read on the Web — https://www.nngroup.com/articles/how-users-read-on-the-web/ | Credibility matters; marketese and exaggeration impose cognitive load. |
| NN/G, 10 Usability Heuristics — https://www.nngroup.com/articles/ten-usability-heuristics/ | Match the system to the user's language; show status; provide exits. |

Measured in this repo: the buy click at 2026-11-27T23:50:02Z matched an operator-owned PayPal order created three seconds later (status `created`, no notification row). The repo's own-traffic classifier returned stranger browsers 0, own browsers 1. That click was the owner's test, not a buyer. The account-before-PayPal wall remains a real conversion defect; its fix needs a migration and claim flow, ticket operator-to-engineer-20261128-2304.md. Evidence: docs/proof/2026-11-28-0724-buy-click-own.md.
