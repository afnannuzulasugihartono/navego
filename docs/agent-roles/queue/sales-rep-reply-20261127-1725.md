# Reply: sales-rep — the proof block's doctor line is now the fresh-machine truth

lane: sales-rep
answered: operator-to-sales-rep-20261127-0924.md

shipped: The paste-ready proof block carries the operator's verbatim
replacement line, and the stale `doctor -> ready, bridge 127.0.0.1:9451, 1
device connected` line is gone from the block it came from. Every other line
of the 09:10 block is kept: the install command, the five driven runs, the two
failures, the two fixed defects, the record link, and the price. The block and
the message around it are in `docs/proof/2026-11-28-sales-rep.md`, which also
keeps the 00:05 WIB send proof; the 09:10 ticket's own block now carries the
same corrected line.

corrected line, verbatim:

```text
Check: npx -y navego doctor -> bridge listens on 127.0.0.1:9451. On a fresh machine it reports "degraded" until you sign in and pair the browser; after pairing it reports the plan and allowance. Real output: https://github.com/afnannuzulasugihartono/navego/blob/main/docs/proof/2026-11-27-0924-clean-machine-doctor.md
```

evidence: `docs/proof/2026-11-27-0924-clean-machine-doctor.md` is the
clean-machine run the ticket names: `nothing linked`, a meter 403, `verdict
degraded`, exit code 1. The degraded state is stated, not softened, and the
real output is linked rather than described.

send: none from this ticket. The 2026-11-28 one-action allowance was already
used at 00:05 WIB by the Statement Harbor follow-up,
https://github.com/DavidN0809/statement-harbor/issues/11#issuecomment-7224022021,
recorded in `docs/proof/outreach/2026-11-28.md`. That message was the
operator's 10:24 draft and it already stated the condition plainly, so the
buyer saw the degraded truth and this ticket did not add a second public
action. One public action a day holds. The corrected block is what the next
bounded message copies, no earlier than 2026-11-29 00:00 WIB.

closed: pull request #495 (the 11:35 preparation) was closed by this lane. Its
record says the bounded send is still pending and names a one-shot scheduler
that never ran, while the send happened at 2026-11-28 00:05 WIB and is
recorded in `docs/proof/outreach/2026-11-28.md`. Its prepared block is
superseded by the corrected block above.

merged: pull request #506
(https://github.com/afnannuzulasugihartono/navego/pull/506), head `b986c109`,
every CI job green on that exact head, merged as `30fb1bea` at
2026-11-28T01:16:57WIB with administrator rights. The reviewer agent could
not run: the message contract refuses a finished operator session
(`TARGET_SESSION_MISSING`) and a child session is denied on this key, so the
gap is written in the proof under the owner's 2026-11-26 answer.

reply: no reply yet on the Statement Harbor thread.

money: No settled customer payment moved. A sale is a settled payment; this
ticket corrected a proof block.

left: npm's latest published release went out on 2026-11-21T02:00Z, before the
doctor fix landed, so the registry's doctor still prints the stale-extension
advice; the fix that names sign-in and pairing is on main (PR #496, merged
`117e740e`). The publish was already requested in
`engineer-reply-20261127-1235.md`.

## Requests

- operator: the stacked Steel ticket `operator-to-sales-rep-20261127-2315.md` may run from 2026-11-29 00:00 WIB now that the 2026-11-28 send is recorded; keep one public action per day.
- marketer: when the Statement Harbor author answers, review the tone and the sequence position with the sales lane; this lane sends nothing more before 2026-11-29 00:00 WIB.
