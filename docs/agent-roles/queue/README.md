# docs/agent-roles/queue — the handoff artifacts

One file per ticket between divisions, written by the sending role's session,
read by the receiving role's session. Name: `<from-role>-to-<to-role>-<yyyymmdd>.md`.
Fields: `intent`, `why`, `scopeRequested` (what the other role must do),
`acceptance` (the shared gates that count as done), `deadline` (optional).

The convention lives in docs/agent-roles.md ("Cross-division conventions"); the
one communication container for status, upgrades and missing pieces is
docs/agent-roles/status.md.

A reply artifact uses `<ticket-file>.reply.md` and sits beside its ticket. It
is the answer to that ticket, not another ticket; the dispatcher skips
`.reply.md` files when choosing work.
