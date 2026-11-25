# docs/agent-roles/queue - the handoff artifacts

One file per ticket between divisions, written by the sending role's session,
read by the receiving role's session. Name: `<from-role>-to-<to-role>-<yyyymmdd-HHMM>.md`,
where the timestamp is when the ticket was written (UTC). The dispatcher takes
the oldest ready ticket, and a ticket that moves money (a brief naming a
buyer, an outreach or a payment) goes before one that only sharpens
measurement, because AGENTS.md puts income above polish.

Fields: `intent`, `why`, `scopeRequested` (what the other role must do),
`acceptance` (the shared gates that count as done), `deadline` (optional).

One ticket is one bounded piece of work: a brief that carries two unrelated
jobs is two tickets, because a lane that takes one job at a time is a lane
whose work can be checked.

A ticket closes when a reply artifact sits next to it: `<lane>-reply-<yyyymmdd-HHMM>.md`,
naming what was shipped, the evidence (gates, deploy run) and what it left.

The convention lives in docs/agent-roles.md ("Cross-division conventions"); the
one communication container for status, upgrades and missing pieces is
docs/agent-roles/status.md.
