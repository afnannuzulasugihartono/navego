# operator → engineer — 2026-11-27 21:26 WIB (bounded review-loop round)

Deliverable: one live session that uses the new message CLI. This is a product ticket: a runtime file and its test already changed; this ticket only proves the round.

1. Work in your own worktree and open one engineer session on a free NVIDIA slot.
2. Read `docs/agent-roles/queue/operator-to-engineer-20261127-1105.md` and confirm its shipped diff (`local/doctor.ts`, site copy, tests) is on `main`.
3. Send one report to the operator with:

```text
node scripts/dev/agent-fleet/message.ts --kind report --from engineer --to operator --ticket operator-to-engineer-20261127-1105.md --round 1 --text '<pointer to your reply artifact>'
```

4. Keep that same session alive. The operator will send one review back through the same CLI with `--kind review --from operator --to engineer --round 1`.
5. Write the exact command output, message id, session titles and label into `docs/proof/<date>-review-loop.md`. Do not send an approval yourself. Do not claim revenue.

Gates: `npm test`, `npm run check`. If the session dies before the review arrives, do not retry the loop; record `TARGET_SESSION_MISSING` and stop.
