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

## Whose traffic is it?

The hourly read counts an acted browser, and our own checkout tests are acted
browsers too. On 2026-11-26 the only acted traffic in 24 hours was the
operator's own signed-in test: a live $1 PayPal order created at 14:48:15Z for
the operator account, with two buy clicks from the same browser. A manager that
reads "1 acted browser, 2 buy clicks" as a lead is chasing its own tail.

`scripts/dev/agent-fleet/own-traffic.ts` settles it before anyone acts: it
reads the acted events, the live PayPal orders and the operator accounts, and
names the stranger browsers and our own. A buy click whose order belongs to an
operator account, within half a minute of the click, is our own test drive; the
revenue read already excludes operator payments for the same reason.

The read needs the rows, so the manager fetches them (the settlement read has
the same tables) and runs:

```
node --experimental-strip-types scripts/dev/agent-fleet/own-traffic.ts \
  --acted <acted.json> --orders <orders.json> --operators <operators.json>
```

## The liveness check

`scripts/dev/agent-fleet/watch.ts` runs every ten minutes. It reads two
signals: the operating system's process table, and the session list of the
running OpenCode service.

- A lane is **working** while a live `opencode.exe` carries
  `--worktree lane-<role>-<stamp>` and the lane's session spoke in the last
  thirty minutes.
- A lane is **stalled** when the process is gone, when its session ended in an
  error, or when its session went silent for thirty minutes. The marker is
  renamed to `<role>-released-<stamp>.md` with the reason, and the next lane
  worker dispatches the ticket again.
- Three releases move the ticket to `queue/blocked/`, where the manager sees a
  repeated failure instead of a silent loop.
- A failed read is **unknown**: an unreadable process table or session list
  releases nothing, because a failed read is not evidence of death.

The check reads the session's own heartbeat, not the marker's age: an agent
that dies two minutes after it starts is released on the next ten-minute tick,
and an agent that sits alive on a provider error while its session stops
moving is released too.

The table also counts the **child sessions** a lane dispatched. A lane that
dispatches subagents multiplies requests against the same 40 rpm key, which
ends in HTTP 429; every generated agent file denies the `subagent` action, and
the count in the state table is how the manager sees a lane that ignored it.

## What the manager does every run

1. Read `docs/agent-roles/loop/state.md` and the queue, then form one judgment
   about the company: what is wrong, the better way, and the live evidence.
   That judgment becomes a ticket for the lane that owns it.
2. For every `returned` ticket: read the reply, write the outcome on the status
   board and in `docs/proof/`, and name the next action. That closes the ticket.
3. **Every request a lane names becomes a ticket** for the lane that owns it.
   A lane that finishes its work says what it wants done next (the `requests`
   section of its reply); the manager turns each request into one bounded
   ticket for the owning lane, or answers why not. The lane does not wait for
   permission to keep working, and it does not do another lane's work itself.
4. For every `blocked` ticket: read the release notes, narrow the ticket or
   escalate it to the owner; do not re-dispatch the same text a fourth time.
5. Only then choose the next assignment.

The manager never does a lane's work. A lane never writes its own ticket or
closes its own ticket.

## The lanes

Four lanes, and no chief-executive lane: the agent manager owns the register,
the briefs and the decisions, so a separate executive hop only cost a session
and a round trip. Each lane has a mandate it acts on, not only reports:

| lane | what it owns | what it decides on its own |
|---|---|---|
| `operator` (agent manager) | the register, the briefs, the ledger, the proofs, the fleet | what the company works on next, and who gets it |
| `sales-rep` | one public conversation a day, the prospect list | the message, and how to turn an answer into a trial |
| `engineer` | the product, the whole website, the tools and the release plumbing | whether each tool is still worth keeping, and what to fix first |
| `onboarding-guide` | the first-run and support documents | the first win a new user sees, and how they get there |

Research, marketing, release, finance and support are functions, not lanes: the
manager writes them as tickets for one of the four. Their job descriptions are
in `docs/agent-roles/job-descriptions.md`.