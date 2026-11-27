# @last-edited: 2026-11-27 UTC+7.
# @title: direct review loop amendment - non-interrupting delivery and a fresh worker when the old one is dead.
# @state: amendment to `2026-11-27-direct-review-loop-design.md`; the base design stays as history.
# @dependencies: `2026-11-27-direct-review-loop-design.md`.

The owner reviewed the design on 2026-11-27 and answered two points. These override the matching lines in the base design; nothing else changes.

## 1. Do not interrupt a running operator

The loop must behave like the hourly run: it must not cut into work already in progress. Every message therefore uses `delivery: "queue"` and `resume: true`.

- `queue` delivers after the receiving agent finishes its current step, one item at a time.
- `resume: true` starts an idle session immediately, so the answer still arrives in the same minute rather than waiting for the next hourly run.
- `delivery: "steer"` is forbidden in the lane loop. It is only available to a human explicitly overriding the rule.

The earlier wording "steer is reserved for an explicit human override" was already consistent with this; the amendment makes `queue + resume:true` the single default and removes any ambiguity about immediate-but-non-interrupting.

## 2. A dead worker session is replaced, not rejected

The base design said a review to a dead or errored worker session is refused and becomes a fresh ticket. The owner chose **open a new worker session** instead.

When the target worker session is missing, `error`, `aborted`, or older than the watchdog's stale window:

1. `message.ts` returns the reason and does not post to the dead session.
2. The operator asks the dispatcher to open a new session for the same lane and ticket, using the existing queue mechanism and the same credential slot rules.
3. The pending review is sent as the first message to that new session (`queue`, `resume:true`), with `round` unchanged so the loop bound still holds.
4. The old session ID and the new session ID are both written to `docs/proof/<date>-review-loop.md`. No message is silently dropped.

This keeps the loop moving without a new credential and without reviving a session whose history is gone. It does not relax the round limit: a replacement session still counts against the same ticket.
