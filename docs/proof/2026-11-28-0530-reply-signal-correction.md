# Run 49 — the selector's buyer-reply signal was false, and is now corrected (2026-11-28 05:30 WIB)

## What was observed

At the start of run 49 the selector reported `buyerRepliesWaiting: 1` and chose `answer-buyer`, outranking every other action. No buyer had replied. The only matching file was `docs/proof/outreach/replies/README.md`, which documents the format with the literal example `answered: no | yes`. A documentation example had been read as a waiting customer.

This is the exact failure mode the mission ladder warns about: a claim outran its evidence, and the loop would have spent a run answering nobody.

## What changed

`countUnanswered` in `scripts/dev/agent-fleet/goal.ts` now counts only dated reply files named `<ISO date>-<surface>.md`, and requires an exact `answered: no` line. Two failing tests were written first and watched fail: one with a README plus a real reply, one with only an ambiguous `no | yes` value. Both pass after the fix; all 13 tests in the file pass. The selector now reports `buyerRepliesWaiting: 0` and chooses `close-ticket`.

## Scope and money

No customer-facing code moved, no gate weakened, no owner-only path touched. Settled external revenue remains $0.00, 0 orders; score −82. The listing PR remains Open and no second public action was taken today.

## Next best action

The selector now sees reality. The next step is still not an internal proof: land one real inbound link on `punkpeye/awesome-mcp-servers#20598` and wait for a settled stranger payment.
