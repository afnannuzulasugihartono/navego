# Survival run #27 — 2026-11-26

The settlement read answered $0.00, so the hour cost one point (score −41 →
−42). The traffic that acted was **0 browsers and 0 buy clicks** in the last 24
hours: `page.view` 130 events / 70 browsers, `install.view` 61 / 60,
`pair.view` 79 / 54, `plan.view` 10 / 10, every row anonymous. A page load
without an action is a path probe, not a person.

## What changed

The dispatcher now asks the session list next to the process table, because the
run caught the loop's own gap. At 20:25 WIB the nvidia-1 worker started a
researcher session while the engineer session was still alive on that key: the
engineer's launcher process was gone, but the service kept its session, so the
process table said the slot was free. Two sessions on one key is the request
multiplication the owner sees as HTTP 429.

- **A slot is busy while any of its sessions is alive**, and it frees itself
  when the session goes silent, so a stale session cannot hold a key forever.
- **A lane is busy while its session spoke in the last thirty minutes**,
  whatever its marker says.
- The duplicate researcher session was stopped, so nvidia-1 holds one session
  again; the watchdog releases its marker and the next worker takes that
  ticket on a free key.

## The fleet right now

| lane | session | key | ticket |
|---|---|---|---|
| engineer | `slot-nvidia-1/engineer-20261126-1233` | nvidia-1 | `operator-to-engineer-20261125-2116.md` (install funnel) |
| ceo | `slot-nvidia-2/ceo-20261126-1233` | nvidia-2 | `researcher-to-ceo-20261126-0735.md` (the CI gate owner for OpenCode automation ids) |
| marketer | `slot-nvidia-3/marketer-20261126-1233` | nvidia-3 | `operator-to-marketer-20261126-1045.md` (install press and copy as two steps) |
| researcher | `slot-nvidia-1/researcher-20261126-1325` | nvidia-1 | `operator-to-researcher-20261126-0845.md` - stopped as the duplicate; the marker is released and the ticket waits for a free key |

## Verification

- `npm test` exits 0 and `npm run check` exits 0 on `main`; the fleet tests are
  20 (11 dispatch, 9 loop).
- The watchdog ran on `main`: `5 returned, 2 ready, 4 working`, and the state
  table was written to `docs/agent-roles/loop/state.md`.

## Money

$0.00 settled, 0 orders, score −42, and 0 browsers that acted. One outreach
message already went today (2026-11-26 03:56:27Z), so the rule sends no second
one today; tomorrow (2026-11-27) the sales lane sends the shortlist's row 1,
Agno, and that conversation turning into a trial is what settles the next
$1.
