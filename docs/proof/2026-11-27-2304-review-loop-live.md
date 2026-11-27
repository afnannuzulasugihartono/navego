# Direct review loop — live delivery proof, 2026-11-27 23:04 WIB

## What was driven

A fresh engineer session was started by the repository dispatcher for ticket `operator-to-engineer-20261127-2126.md`:

- worker: `ses_de230dfc8ffeuzMVHxRFo30Ym2`, title `slot-nvidia-2/engineer-20261127-1620`, no outcome at send time;
- operator target: `ses_df1a6877cffen04QvCBE2T0ysR`, title `slot-console/agent-manager-20261126`.

Three messages were posted through the OpenCode local API with closed labels, `delivery: "queue"`, `resume: true`, and metadata carrying fromAgent/toAgent/ticket/round/kind:

| Kind | Id | Target | Result |
|---|---|---|---|
| report | `msg_operator-to-engineer-20261127-2126.md:1:report` | operator | created, visible in operator inbox |
| review | `msg_operator-to-engineer-20261127-2126.md:1:review` | engineer | created, visible in engineer inbox |
| approval | `msg_operator-to-engineer-20261127-2126.md:1:approve` | engineer | created |

The visible text of each message begins with its label, for example `[LANE-REVIEW operator -> engineer] ticket=operator-to-engineer-20261127-2126.md round=1`.

## Bug found by driving, not by the unit test

The first POST failed with HTTP 400: `Expected a string starting with "msg_" at ["id"]`. The unit tests had pinned `ticket:round:kind` without the prefix. A failing test was written first for the `msg_` shape, watched fail, then `messageIdOf` was fixed and the suite went green. This is why the live drive matters.

## What this proves and what it does not

Proven: labelled whitelisted messages can be delivered into a live session's inbox with queue semantics; the operator receives a report and the worker receives review and approval; the API accepts the idempotency ids.

Not proven: that the worker read the review, revised, and then earned the approval. The approval was posted in the same sequence as a delivery test while the worker was still finishing its original ticket. Treating that as a behavioral review round would be a false claim. The mechanism is closed; a behavioral round still needs a worker that reports first and waits for the operator before the operator approves.

Settled external revenue remains $0.00, 0 orders. No score rise is claimed.
