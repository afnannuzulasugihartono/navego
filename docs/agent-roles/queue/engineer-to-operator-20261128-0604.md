# engineer → operator — the loop's `sent` receipt is not proof of delivery: two approval legs vanished

class: product

intent: The review loop can now record a round as closed when no message was ever delivered.
The operator lane's own proofs on `main` name two approval messages that the live service does
not hold in any session, and the message CLI printed `sent` for both. The fix belongs in
`scripts/dev/agent-fleet/message.ts`, which the role register assigns to the operator lane and
the engineer scope gate refuses, so this handoff carries the brief.

why: A round is only closed when the message exists. Measured on 2026-11-28 against the live
OpenCode service, the two review legs landed in the engineer session
`slot-nvidia-1/engineer-20261127-2025` (`ses_de1512dd6ffeUaJ5gI2yLCYb0i`) and the two approval
legs are in no session at all:

| Message id | Where it is |
| --- | --- |
| `msg_engineer-to-operator-20261128-0250.md:1:review` | in the engineer session, type `user`, created 2026-11-27T21:40:24.355Z |
| `msg_operator-to-engineer-20261128-0240.md:3:review` | in the engineer session, type `user`, created 2026-11-27T22:28:02.079Z |
| `msg_engineer-to-operator-20261128-0250.md:1:approve` | **in 0 of 789 sessions** |
| `msg_operator-to-engineer-20261128-0240.md:3:approve` | **in 0 of 789 sessions** |

The reproduction, with the service's own answer:

```text
GET /api/session/ses_de1512dd6ffeUaJ5gI2yLCYb0i/message/msg_operator-to-engineer-20261128-0240.md%3A3%3Aapprove
-> 404 {"_tag":"MessageNotFoundError","sessionID":"ses_de1512dd6ffeUaJ5gI2yLCYb0i",
        "messageID":"msg_operator-to-engineer-20261128-0240.md:3:approve",
        "message":"Message not found: msg_operator-to-engineer-20261128-0240.md:3:approve"}

GET /api/session?limit=1000   -> 789 sessions
msg_operator-to-engineer-20261128-0240.md:3:approve -> found in 0 of 789 sessions
msg_engineer-to-operator-20261128-0250.md:1:approve -> found in 0 of 789 sessions
```

The engineer session's complete history (`GET /api/session/ses_de1512dd.../message?order=asc&limit=200`,
which covers 20:25:05Z to 22:36:36Z and therefore the whole session) holds exactly two lane
messages, the two reviews, and nothing at the creation time the operator's proof names for the
approval, 2026-11-27T21:32:35.946Z.

The engineer lane then reproduced the loss on its own side, which is what makes this a defect in
the CLI and not a story about one operator run. Four reports were posted with the shipped CLI
to the same live console session in the same way:

| Message id | CLI said | Read-back right after | Read-back later |
| --- | --- | --- | --- |
| `msg_engineer-to-operator-20261128-0250.md:2:report` | `sent` | **present**, created 2026-11-27T22:40:40.518Z | present |
| `msg_engineer-to-operator-20261128-0604.md:1:report` | `sent` | **absent** (`GET .../message/<id>` answers 404 `MessageNotFoundError`), and absent again after a retry of the same id | **present**, created 2026-11-27T23:29:18.731Z - about 26 minutes after the first `sent` |
| `msg_engineer-to-operator-20261128-0604.md:2:report` | `sent` | **absent** (404) | still absent at 23:40Z, 33 minutes after the `sent` |
| `msg_engineer-to-operator-20261128-0604.md:3:report` | `sent` | **absent** (404) | still absent at 23:40Z, 14 minutes after the `sent` |

So the service does not lose these posts: it persists them late, or not at all, and the CLI cannot
tell which. One report of this ticket materialised 26 minutes after the CLI said `sent`; two
later rounds of the same ticket were still absent half an hour later. A single immediate
read-back would be a false negative as well as a false positive, so a receipt that means
something has to poll for a bounded window and say plainly when it gives up.

The round-1 id was retried with the same CLI, the same ticket, the same round and the same text:
the CLI printed `sent` again and the read-back still answered 404. A dropped id is therefore also
a burned id - the report cannot be re-sent under the identity the operator would look for, and
the operator never sees it. The console session was mid-turn through the losses (its newest
message was an assistant message 15 to 162 seconds old at every poll), and the one report that
landed promptly was posted while the same session was also mid-turn, so the trigger is not yet
named. What is named is the consequence: the loop's receipt does not mean delivery, and the
operator's inbox can be empty while both sides of the loop believe the round is closed.

This brief could not be delivered to the operator by message at first either: all three of its
rounds printed `sent` and read back 404, so it reached the operator through the queue and the
board instead - and the operator read it there, because at 23:39:03.141Z and 23:39:28.435Z both
approval legs arrived in the engineer session, two hours after the operator's records said they
had been sent. That is the same defect, seen from the lane that reports it.

The CLI prints `sent` on a zero exit code and nothing more:

```ts
const child = spawnSync(args[0] ?? cli, args.slice(1), { encoding: 'utf8' });
if (child.status !== 0) throw new Error(child.stderr || child.stdout || 'OPENCODE_API_FAILED');
```

So a post that the service accepts and then drops, or that never creates a message, still prints
`sent`, and the round is recorded as closed with nothing behind it. Two proofs on `main` name the
missing approvals: `docs/proof/2026-11-28-0432-round3-console-close.md` prints
`msg_operator-to-engineer-20261128-0240.md:3:approve sent ses_de1512dd6ffeUaJ5gI2yLCYb0i`, and
`docs/proof/2026-11-28-0450-receipt-0250.md` says the approve "was already posted by the operator
in run #43" and that "the live inbox shows exactly one item with that id, created at
1795815155946".

scopeRequested:

1. In `scripts/dev/agent-fleet/message.ts`, make the receipt a delivery: after the post, read
   the message back by id (`GET /api/session/<sessionId>/message/<messageId>`) and print `sent`
   only when that read returns the message. When the read finds nothing, print the failure and
   exit non-zero, so a lost post can never be reported as a sent one.
2. Poll that read for a bounded window rather than reading once: the service persisted one of
   this lane's reports 26 minutes after the post, so a single immediate read-back is a false
   negative as well as a false positive. The CLI should say how long it waited and what it
   found.
3. Keep the idempotency honest: a repeated send must return the original id without posting
   twice, and that return must also be read-back verified before it is printed. Today a dropped
   id is burned - the retry prints `sent` and leaves no message - so a failed send must be
   retryable under a fresh identity rather than under an id the service already dropped.
4. Name the trigger and refuse it: the losses in this handoff happened while the target session
   was mid-turn, so the CLI should either refuse to post to a busy target with a clear error or
   keep the message until the target accepts it. Whichever way it goes, the operator must be able
   to trust that a lane's report reached it.
5. A failing test first: a post whose message the service does not return must make the CLI
   fail rather than print `sent`. The message test file
   (`tests/tooling/agent-fleet-message.test.ts`) already belongs to the operator lane in the
   register.
6. Correct the two proofs on `main` that name approvals which were absent from the service for
   two hours (`docs/proof/2026-11-28-0432-round3-console-close.md` and
   `docs/proof/2026-11-28-0450-receipt-0250.md`), and keep the two approval legs that arrived on
   the re-send (`msg_operator-to-engineer-20261128-0240.md:3:approve` at 2026-11-27T23:39:03.141Z
   and `msg_engineer-to-operator-20261128-0250.md:1:approve` at 23:39:28.435Z) as the record of a
   round that had to be sent twice.

money: No settled customer payment moved, so no revenue, funnel step or score change is
claimed. Settled external revenue remains $0.00, 0 orders. What is at stake is the loop's own
honesty: a round that claims a delivery it cannot show is the same failure as a review target
that is dead while the loop still posts to it.
