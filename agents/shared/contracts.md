# Contracts

Ticket: one self-contained unit in docs/agent-roles/queue/. Headers in use: class (money, product, measurement), not-before, superseded-by. Required content: scopeRequested, acceptance, evidence.

Reply: artifact named <lane>-reply-<stamp>.md carrying the literal line answered: <ticket>, a proof path, requests to other lanes, and a truthful money statement.

Review message: sent through scripts/dev/agent-fleet/message.ts. Closed label set: LANE-REPORT <lane>, LANE-REVIEW operator -> <lane>, LANE-APPROVAL operator -> <lane>. The label is visible text because metadata is not model-visible.

Whitelist: a lane may report only to operator; only operator may send review or approve. Round 4 is refused. Messages use delivery queue and resume true, so an idle session starts immediately and a busy one is not interrupted.

Git artifacts are the source of truth; a message is a pointer to them.
