# docs/agent-roles/queue - the handoff artifacts

One file per ticket between divisions, written by the sending role's session,
read by the receiving role's session. Name: `<from-role>-to-<to-role>-<yyyymmdd-HHMM>.md`,
where the timestamp is when the ticket was written (UTC). The dispatcher takes
the oldest ready ticket, and a ticket that moves money (a brief naming a
buyer, an outreach or a payment) goes before one that only sharpens
measurement, because AGENTS.md puts income above polish.

Fields: `class` (`money` for a brief that finds a buyer, an outreach or a
payment; `measurement` for a brief that only sharpens how the product is read),
`intent`, `why`, `scopeRequested` (what the other role must do), `acceptance`
(the shared gates that count as done), `deadline` (optional).

One ticket is one bounded piece of work: a brief that carries two unrelated
jobs is two tickets, because a lane that takes one job at a time is a lane
whose work can be checked.

## The loop

The manager writes the ticket; the lane writes the result. Nothing is carried
in a conversation, because a conversation is not a file the next session can
read. The full contract, including the liveness check, is in
[`../loop/README.md`](../loop/README.md).

1. **Assigned.** The manager writes `<manager>-to-<role>-<stamp>.md`.
2. **Working.** The lane writes `<role>-started-<stamp>.md` with
   `Ticket: <ticket file>`, `Slot: <slot>` and, when it has one, `Worker:
   <session title>`. The file is the claim; a lane without a claim is not
   working.
3. **Returned.** The lane writes a reply beside the ticket, named
   `<role>-reply-<stamp>.md` (the `-reply-` token is what the dispatcher reads),
   carrying the line `answered: <ticket file name>`. The line is what closes
   it: a reply that only mentions another ticket in passing does not close that
   ticket. The reply also names what was shipped, the evidence (gates, deploy
   run) and what it left.
4. **Closed.** The manager reads the reply, writes the outcome on
   `docs/agent-roles/status.md`, records it in `docs/proof/`, and only then
   chooses the next assignment.

A ticket whose lane has a started marker younger than two hours is still in
progress and is left alone; an older marker means the lane stalled, and the
ticket is released. A ticket with a reply beside it is closed.

## The liveness check

The watchdog (`scripts/dev/agent-fleet/watch.ts`, every ten minutes) reads the
process table, not the marker's age. A marker is working only while a live
`opencode.exe` carries `--worktree lane-<role>-<stamp>`. When the process is
gone and no reply exists, the marker is renamed to
`<role>-released-<stamp>.md` with the reason, and the ticket is ready for the
next lane worker. Three releases move the ticket to `blocked/`, where the
manager sees a repeated failure instead of a silent loop.

A failed process-table read is not evidence of death: the state is `unknown`
and nothing is released. The manager reads the live view in
`docs/agent-roles/loop/state.md`.

A reply artifact uses `<role>-reply-<stamp>.md` and sits beside its ticket. It
is the answer to that ticket, not another ticket; the dispatcher skips
`-reply-` files when choosing work, and the watchdog reads the `answered:` line
even when a reply is named like a ticket.
