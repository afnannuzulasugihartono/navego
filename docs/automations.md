# The automation fleet

The automations that open sessions, the role each one serves, and the liveness
rule that keeps a dead lane from stopping the queue. The role register
(`docs/agent-roles/registry.json`) names the manager's automations; this file
names the whole fleet so a reader of the repository can see what is running
without opening the harness.

| automation | id | role | schedule (Asia/Jakarta) | what it does |
|---|---|---|---|---|
| hourly survival and growth | `aut_2164ffcfd001KHx72ub2lmEtrT` | `operator` (manager) | every hour at :24:30 | reads the settlement and the funnel, scores the hour, reads `docs/agent-roles/loop/state.md`, closes returned tickets, and chooses one bounded improvement |
| fleet watchdog | `aut_2176da47e001Cmh2bDVBUDj5Nn` | `operator` (manager) | every 10 minutes | runs `scripts/dev/agent-fleet/watch.ts`: classifies every ticket from the process table and the lane session's heartbeat, releases a marker whose worker is gone or silent, blocks a ticket after three releases, counts the child sessions a lane dispatched, and writes `docs/agent-roles/loop/state.md` |
| lane worker nvidia-1 | `aut_2170b6a95001RcA1lTHorG1lGH` | the ticket's lane | every hour at :25 | takes the oldest ready ticket (money before measurement), writes a started marker, and opens the lane session on the nvidia-1 slot |
| lane worker nvidia-2 | `aut_2170b6a9e001VklUCpVJA69dKX` | the ticket's lane | every hour at :35 | the same dispatch on the nvidia-2 slot, so two lanes run at once without sharing a credential |

The dispatch logic lives in the repository, not in the harness:
`scripts/dev/agent-fleet/dispatch.ts` reads the queue and the credential
roster, takes the oldest ready ticket, writes the started marker with the
ticket, the slot and the session title, and starts the lane session detached.
The lane prompt it sends asks for the reply that carries `answered: <ticket>`
and forbids subagents, because a child session multiplies requests on the same
40 rpm key.

The lane workers never dispatch a ticket whose lane has a started marker
younger than two hours, and they skip a ticket whose reply carries
`answered: <ticket>`. The watchdog is the faster signal: it checks the
operating system's process table and the lane session's own heartbeat every
ten minutes, so a worker that dies two minutes after it starts is released on
the next tick instead of holding the ticket for two hours.

## Retired

These are kept so a reader can see what was replaced, not as live capacity:

| automation | id | why it is off |
|---|---|---|
| lane worker nvidia-1 (unscoped) | `aut_21624dbdf001Y3bi1s0M32O11k` | replaced by the scoped worker that carries the scope gate |
| lane worker nvidia-2 (unscoped) | `aut_21624dbeb0018q7GAYE5YywqsS` | replaced by the scoped worker that carries the scope gate |
| hourly survival and growth (first) | `aut_21421fd5c001SHZTGFdHocNTwY` | recreated when the Supabase tool name changed; the score state was carried over |
