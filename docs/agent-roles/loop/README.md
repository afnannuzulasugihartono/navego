# The manager loop

The `operator` role is the agent manager. It assigns one bounded ticket at a
time, reads the reply, and closes the loop on the board. The queue is the
memory: a chat message is not an assignment, and a conversation is not a
result.

## States

| state | written by | meaning | next |
|---|---|---|---|
| assigned | manager | `<manager>-to-<role>-<stamp>.md` sits in the queue | the role's lane worker claims it |
| working | lane | `<role>-started-<stamp>.md` carries the ticket, the slot and the worker title | the lane writes a reply |
| returned | lane | `<role>-reply-<stamp>.md` carries `answered: <ticket>` | the manager reads and closes |
| closed | manager | the reply is named on `docs/agent-roles/status.md` and in `docs/proof/` | none |
| stalled | watchdog | the worker process is gone and no reply exists | the marker is released, the ticket returns to assigned |
| blocked | watchdog | three releases for one ticket | the manager narrows or escalates it |

## The liveness check

`scripts/dev/agent-fleet/watch.ts` runs every ten minutes. It reads the queue,
finds each started marker's lane and stamp, and asks the operating system for
the live `opencode.exe` command lines. A marker is working only while a process
carries `--worktree lane-<role>-<stamp>`. When the process is gone and the
reply is not there, the marker is renamed to `<role>-released-<stamp>.md` with
the reason, and the next lane worker (every hour at :25 and :35) dispatches the
ticket again. Three releases move the ticket to `queue/blocked/`, where the
manager sees it.

The check reads the process table, not the marker's age: an agent that dies two
minutes after it starts is released on the next ten-minute tick, not after two
hours. When the process table cannot be read, the state is `unknown` and
nothing is released - a failed read is not evidence of death.

## What the manager does every run

1. Read `docs/agent-roles/loop/state.md` and the queue.
2. For every `returned` ticket: read the reply, write the outcome on the status
   board and in `docs/proof/`, and name the next action. That closes the ticket.
3. For every `blocked` ticket: read the release notes, narrow the ticket or
   escalate it to the owner; do not re-dispatch the same text a fourth time.
4. Only then choose the next assignment.

The manager never does a lane's work. A lane never writes its own ticket or
closes its own ticket.
