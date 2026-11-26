# Survival run #28 — 2026-11-26

The settlement read answered $0.00, so the hour cost one point (score −42 →
−43). The traffic that acted was **0 browsers and 0 buy clicks** in the last 24
hours: `page.view` 135 events / 73 browsers, `install.view` 65 / 64,
`pair.view` 83 / 57, `plan.view` 9 / 9, every row anonymous. A page load
without an action is a path probe, not a person.

## What the loop closed

The engineer lane finished its ticket and **merged its work into `main`**
(`0ad6aa69 Merge the funnel ticket's split into the briefs that own it`, pull
request #463, green on the exact head `6b38ec2e`), with the reply
`engineer-reply-20261126-1233.md` carrying `answered:
operator-to-engineer-20261125-2116.md`.

The watchdog had already released that ticket: the merge landed on the remote
while the local checkout was still behind it, so the local queue held no answer
and the lane's marker looked stale. A ticket answered on the remote that a
stale checkout reads as unanswered is a ticket sent to be done twice.

**The fix:** the loop reads the answers from `origin/main` before it releases
anything, and the dispatcher never re-dispatches an answered ticket. The
release note carries its correction, so the record says why it was wrong and
what changed.

## The three briefs the engineer wrote

The split landed as three ready briefs, one owner each:

| brief | lane | what it asks for |
|---|---|---|
| `engineer-to-marketer-20261126-1233.md` | marketer | the press as its own step, the copy row labelled for what it counts, and every record able to say whether the visitor was a person or an automated drive, with the referrer |
| `engineer-to-finance-analyst-20261126-1233.md` | finance-analyst | one new migration that teaches `opera_funnel_record` the press step and lets the operator's read separate automated drives from people |
| `engineer-to-ceo-20261126-1233.md` | ceo | the one register change that gives the test folders an owner: no role's `scopePaths` cover `tests/site/**` or `tests/hosted/**`, so the two lanes that hold the funnel work cannot write the test their acceptance asks for |

This is the earliest funnel step (install press and copy measured apart) and
the person's first impression of the product's measurement, split so each lane
writes inside its own scope.

## The fleet right now

| lane | session | key | state |
|---|---|---|---|
| marketer | `slot-nvidia-3/marketer-20261126-1233` | nvidia-3 | working (install press and copy) |
| ceo | `slot-nvidia-2/ceo-20261126-1233` | nvidia-2 | working (the CI gate owner for OpenCode automation ids) |
| researcher | `slot-nvidia-1/researcher-20261126-1325` | nvidia-1 | working (the shortlist's eight reviewer fixes) |

One session per key, no subagents, and the three new briefs wait for the next
free key.

## Verification

- `npm test` exits 0 and `npm run check` exits 0 on `main`; the fleet tests are
  22 (12 dispatch, 10 loop).
- The watchdog ran on `main`: `6 returned, 5 ready, 3 working`, and the state
  table was written to `docs/agent-roles/loop/state.md`.

## Money

$0.00 settled, 0 orders, score −43, and 0 browsers that acted. One outreach
message already went today (2026-11-26 03:56:27Z), so the rule sends no second
one today; tomorrow (2026-11-27) the sales lane sends the shortlist's row 1,
Agno, and that conversation turning into a trial is what settles the next $1.
