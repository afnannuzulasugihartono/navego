---
id: economy-loop-design
title: The Navego economy loop — what it may decide, what it may spend, and what it keeps
kind: design
source: https://github.com/afnannuzulasugihartono/navego
observed: 2026-11-24
---

# The Navego economy loop

## The objective

Run Navego as a self-sustaining business: sell Navego, take the money, keep enough of it to stay alive, spend the rest on the AI capability that raises what Navego can sell, and grow the cash and the knowledge together.

The objective is measured, not wished for. `navego economy status` reports arrived cash per currency, points, window revenue and cost, net, and runway.

## The loop

```text
research → offer → sell → revenue event → knowledge note
                     ↓
              spend decision → subscription event → better model
                     ↓
              more research and more sales
```

Every arrow writes something the next turn can read. Nothing in the loop depends on the agent remembering the last session.

## The parts

| Part | Where it lives | What it does |
|---|---|---|
| Money rules | `local/economy-core.ts` | Event shape, cash sum, points, spend gate, upgrade choice, objective summary |
| Ledger and knowledge | `local/economy-store.ts` | Append-only `ledger.jsonl`, Markdown knowledge notes, current subscription state |
| Command | `local/economy-cli.ts`, wired into `local/bin/navego.ts` | `navego economy status|record|note|knowledge|spend|subscription` |
| Records | `docs/economy/` | The ledger, the knowledge library, and the subscription state in the repository |

## The scoring rule

A decision earns **+10** when its revenue minus its cost is positive. A decision that spent money and brought none back is **−1**. A decision with no revenue and no cost is **−1** as well, because a decision that moved nothing did not earn its place. The total is the sum over decisions.

The rule is deliberately blunt. It cannot be talked into a good score.

## The money rule

Cash is the sum of the events. A correction is another event, never an edit.

Spend is allowed only when:

1. revenue in that currency actually arrived,
2. the balance in that currency is positive, and
3. the spend fits the spendable amount, which is half of the arrived cash by default.

The reserve exists because a loop that spends its whole balance on the first subscription has no second month.

## The upgrade rule

An upgrade candidate must carry a source for its price and a source for its capability. The best affordable candidate wins; a better candidate the reserve cannot carry is refused, and the current subscription stays.

The agent never buys a consumer subscription for unattended work when the provider's terms forbid automated access. Anthropic's consumer terms are the clearest example, and the knowledge note records it.

## What the agent may not do on its own

- Send bulk commercial email without the owner approving the send, the CAN-SPAM fields, and the opt-out path.
- Accept a contract, charge a card, book a meeting, or sign up for a service in the owner's name.
- Change the reserve fraction to make a spend fit.
- Write a knowledge note without a source and a date.

## Where the money is today

Measured on 2026-11-24: eight paid invoice rows, of which six are sandbox and one is the owner's own Rp 1.000 wallet top-up. The only sale to a named customer is Rp 5.000 for one delivered client-month. The loop therefore cannot buy a subscription yet, and the first job is more revenue, not a bigger model.

The measurement and the sources live in `docs/economy/knowledge/`.
