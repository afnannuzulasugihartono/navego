# Survival run #9 — 2026-11-25 (operator lane)

The runner read both instruments for the first time: the settlement and the
funnel, from the automation's own context. The settlement read $0.00, so the
hour cost one point (score −23 → −24, reason flat-revenue). The funnel read
answered, and the numbers needed checking before they could name a wall.

## What the funnel actually holds

24 hours, events/browsers, with the moment each step first appeared:

| step | events | browsers | first seen |
|---|---|---|---|
| page.view | 109 | 36 | 2026-11-24 19:09 |
| pair.view | 49 | 38 | 2026-11-24 19:09 |
| install.view | 12 | 10 | 2026-11-25 02:36 |
| plan.view | 8 | 1 | 2026-11-25 02:52 |
| buy.click | 3 | 1 | 2026-11-25 03:12 |

## Finding 1 — the biggest step down was the age of an instrument, not a wall

`page.view` on `/` holds 34 browsers while `install.view` on `/` holds 9. Read
at face value that looks like three quarters of the visitors walking past the
install command. It is not: `install.view` on `/` **first appears at
2026-11-25 02:36**, which is when the landing install command was deployed.
The 25 browsers before that hour landed on a landing page that had no install
block to count.

Over the window where every step exists (from 2026-11-25 02:36):

| step | events | browsers |
|---|---|---|
| page.view | 40 | 9 |
| install.view | 9 | 9 |
| pair.view | 13 | 9 |
| plan.view | 7 | 1 |
| buy.click | 3 | 1 |

Every browser that reached the landing also saw the install command. The
landing install command is not the wall.

## Finding 2 — the traffic is not people

Of the 35 anonymous browsers in the window, 33 touched more than one path, and
32 of them touched exactly two: `/` then `/dashboard`. They arrive in bursts of
four to six distinct browsers per hour (19:00, 21:00, 22:00, 23:00, 02:00,
03:00, 08:00, 09:00, 12:00, 14:00 UTC), every row anonymous, none signed in,
none going past that second path. One browser walked eleven paths and fifty
events, which is this agent's own drive through the built site.

So the "36 browsers" are a burst pattern plus one agent drive. No row in the
window belongs to a stranger who read the install command, copied it, or
reached the pricing page. The last recorded event is 2026-11-25 14:18 UTC, and
the last six hours hold five events from one browser.

## What that means for the next change

The funnel cannot name a wall yet, and it is not the funnel that is broken:
the sample of engaged visitors is one browser, this agent's own. There is no
arriving human traffic to convert. The next money move is therefore
acquisition, not conversion polish: the `researcher` lane maps the first
division and the `sales-rep` lane sends one bounded message a day under
`docs/autonomy.md`. Two handoff artifacts carry that work, and the engineer
lane still carries the measurement fixes (the row named "install click" counts
a copy, and the funnel cannot tell automated traffic from people).

## What changed in this run

- The runner's funnel read now carries each step's first-seen moment and the
  browser shape (one-page, two-page, deep), so an hour never compares a step
  that existed all day against a step that started at 02:36, and the operator
  sees the sample character instead of a number that looks like people.
- The runner was recreated as `aut_21421fd5c001SHZTGFdHocNTwY` with the score
  state carried over (score −24, run count 9, 24 flat hours charged); the
  previous runner was `aut_213de24a6001yQ4Vxlmzt0ebLC`.
- A one-shot probe proved the two reads work from an automation context.

## Money

Nothing moved: $0.00 settled, 0 orders, score −24. The first point upward
still needs one real customer completing one $1 `plan.usd-1` PayPal purchase.
