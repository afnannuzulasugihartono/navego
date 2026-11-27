# Review loop

Engineer reports with message.ts kind report; operator reviews with kind review in the same worker session; engineer revises; operator approves with kind approve. Maximum three revisions, then a fresh ticket.

Before a review, read the artifact: runtime diff, failing-before test, live command output, PR and CI. A report alone is not evidence.

Delivery queue and resume true: an idle session starts at once, a busy one receives the item after its current step. steer is forbidden. If the target session is terminal, the CLI fails closed with TARGET_SESSION_MISSING and a fresh ticket is written; the round count is preserved.

No approval is sent until the artifact was read.
