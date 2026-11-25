# Survival run #8 — 2026-11-25 (operator lane)

The hourly run that shipped the role system fired its first hour and found a
broken instrument in its own brief: the funnel read failed with
`COALESCE types text and uuid cannot be matched`, because the runner's query
mixed `anon_id` (text) with `user_id` (uuid). The settlement read was fine
(`0` orders, `$0.00`), so the score moved and the funnel did not.

## What the runner read

| read | result |
|---|---|
| settled revenue (`paypal-live`, grouped by order id, owner payments excluded) | 0 orders, $0.00 |
| score after this run | −23 (this run: −13, reason flat-revenue) |
| funnel, last 24 hours | unreadable at first (the type error above) |

The flat hours are real and the rule charged them: the previous runner failed
its reads and stayed down, and every completed hour without a balance change
costs one point. 10 hours were already charged; 13 more completed while the
runner was down, so the score went −10 → −23. No discount was invented for
the outage.

## The funnel, read correctly after the fix

| step | events | browsers |
|---|---|---|
| page.view | 109 | 40 |
| pair.view | 49 | 38 |
| install.view | 12 | 10 |
| plan.view | 8 | 1 |
| buy.click | 3 | 1 |

`install.click`, `signin.start`, `signin.ok`, `pair.start`, `pair.ok`,
`pair.fail`, `command.first` and `download.npm` recorded nothing in the
window.

## The finding that matters more than the numbers

`install.click` is recorded by `recordInstallCopy()` in
`site/app/lib/funnel.ts`: the event fires when the visitor **copies the
install command**, not when they press the install button. The dashboard
labels that row "Klik install" (`site/app/routes/dashboard.tsx`). So the
operator reads a copy metric under a click name, and a zero under that row
cannot be read as "nobody pressed install" — it can only be read as "nobody
copied the command in the last day". A step the site names one way and
measures another is a broken instrument, not a wall, and it was carried to the
lane that owns the site code as a handoff artifact.

The fix belongs to the engineer lane (site code and a migration that extends
the closed funnel name list), not to this run; this run's scope is the
operator's own files.

## What changed in this run

- The runner's funnel query reads `count(distinct anon_id)` the way the
  migration's own summary does, and a failed read now prints one short line
  instead of the whole JSON error.
- The runner was recreated as `aut_213de24a6001yQ4Vxlmzt0ebLC` with the score
  state carried over (score −23, run count 8, 23 flat hours charged). The
  previous runner was `aut_213a07660001wHhAZDmMjXb7o3`.
- The read was proven from an automation context with a one-shot probe
  (`probe: funnel read from automation context`), because the earlier failure
  was a connection fault in the automation's MCP context, not a wrong call
  form.

## Money

Nothing moved: $0.00 settled, 0 orders, score −23. The first point upward
still needs one real customer completing one $1 `plan.usd-1` PayPal purchase;
the next run reads that settlement row by itself and reports it.
