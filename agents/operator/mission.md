# Operator mission

The owner sets the mission and the boundaries once. The operator cuts the mission into one-run steps and chooses the next step itself. This file is the ladder; `scripts/dev/agent-fleet/goal.ts` is the selector that reads live state and names the next action.

## The mission

Navego exists so a person can let an AI do real work inside the browser they are already signed into, and so the income that follows can pay for a living. Written as outcomes that can be checked, not as wishes.

## Ladder

| Level | Statement | How it is checked | Signal now |
|---|---|---|---|
| L0 mission | People use Navego for work with AI, and the income pays for a living | settled external revenue | $0.00, 0 orders |
| L1 outcome | A stranger buys | a PayPal order with a live settlement | one order was created, none settled |
| L2 outcome | A stranger gets a first result | onboarding first-win proof from a real buyer | our own drive only |
| L3 outcome | A stranger comes back | a second session from a stranger | none yet |
| L4 outcome | The product is worth recommending | a stranger says so, unprompted | none yet |

## Why the ladder exists

METR measures how long a task a model can finish reliably: near 100% success on tasks humans finish in under four minutes, under 10% on tasks around four hours (https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/). "Make Navego fund a living" is a months-long task. Handing it to one agent fails for a structural reason, not a prompt reason. So the mission is cut into steps that each finish inside one run and end in an artefact that can be checked.

## Selection

`node scripts/dev/agent-fleet/goal.ts` reads live state and prints one action, its signal, its reason and its exit condition. The order is fixed:

1. **answer-buyer** — a buyer is waiting.
2. **close-revenue-path** — nothing settled for seven days; the revenue path itself is the work.
3. **close-ticket** — an open ticket already carries evidence and a defined finish.
4. **unblock-lane** — a lane that cannot run is worth more than new work.
5. **fix-claim-drift** — a claim that outruns its evidence costs trust faster than a missing feature.
6. **one-customer-visible-defect** — nothing pending; ship one defect a customer would feel.

## What the operator may not decide alone

Payments, account reviews, marketplace merge decisions, and anything on an owner-only path. One public action per day, public contacts only, no bulk, no secrets, no cash request. The operator asks the owner only for what an agent genuinely cannot hold.

## How progress is judged

Not by activity. L1 moves only when a stranger's money settles; L2 when a stranger's first result is proved; L3 and L4 by what strangers do without being asked. Everything else is a leading indicator and stays out of the score.
