# Send-window check — 2026-11-27 22:25 WIB

## Ground truth found

- The single active send automation is `aut_21c67fa57001ZR943uV03CZdqJ` at **2026-11-28 00:01 Asia/Jakarta**. The other three Statement Harbor automations remain paused, so one bounded public action is still the rule.
- Its prompt instructs the worker to post the body file `C:\Users\ASUS\AppData\Local\Temp\opencode\statement-harbor-20261128-comment.md` verbatim.
- That file was **missing**. It had been in the approved scratch directory; the disk cleanup performed earlier this evening (1.38 GB of files older than two hours removed to make the test suite runnable) removed it. Without this check, the 00:01 send would have had to improvise its text or fail.
- GitHub issue https://github.com/DavidN0809/statement-harbor/issues/11 still has exactly one comment, ours, from 2026-11-26T03:56:27Z. No external reply exists, so the send condition in the ticket holds.

## What changed

Restored the exact body from the authoritative draft `docs/proof/2026-11-27-statement-harbor-followup-draft.md`. The restored file is 1957 bytes and contains the corrected doctor sentence:

> npx -y navego doctor reports the bridge on 127.0.0.1:9451 and says "degraded" until the browser is paired and signed in; after pairing it reports the plan and allowance.

It also contains the measured 2-of-5 PDF result (578,104 bytes), the two public proof URLs, the $1 one-month price, one concrete authenticated-document use case, an easy no, and the disclosure that the sender maintains Navego. No new claim was added.

## Verified

- File exists with 1957 bytes at the exact path the automation names.
- Only one send automation is active; three are paused.
- No external reply on the issue, so the condition "issue still open, no external reply" is true.

## Follow-up: the body now lives in the repo

Because temp is scratch space, the exact body was moved to `docs/proof/outreach/drafts/2026-11-28-statement-harbor.md` and the single active automation was recreated with that repo path. New id: `aut_21da41d0e00169pXbvWR0WLUYL`, still `2026-11-28T00:01` Asia/Jakarta, same target session. The old temp-based automation was deleted. A future disk cleanup can no longer remove the message before the send.
