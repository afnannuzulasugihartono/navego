# Send-window and support-form verification — 2026-11-28 00:26 WIB

## Statement Harbor send

Ground truth read from the live thread and automation state:

- `docs/proof/outreach/2026-11-28.md` records the send at 00:05 WIB (2026-11-27T17:05:49Z) with comment id `7224022021` and URL `https://github.com/DavidN0809/statement-harbor/issues/11#issuecomment-7224022021`.
- `GET repos/DavidN0809/statement-harbor/issues/11/comments` returns two comments, both by `afnannuzulasugihartono`: the first from 2026-11-26T03:56:27Z and the prepared follow-up from 2026-11-27T17:05:49Z. **No third comment and no external reply.**
- The recorded UTF-8 SHA-256 of the intended body and the API-verified body are both `d1a19aec82c1e8a87922759f2cbb74d682c24426091fbaf77899a75abe0ce510`.
- Automation state: `aut_21da41d0e00169pXbvWR0WLUYL` status `done`, `runCount: 1`, `lastOutcome: fired`; the three former duplicate automations remain paused with `runCount: 0`.

So exactly one bounded public action occurred on 2026-11-28 and it was recorded the same day. No reply is claimed.

## Support form preflight

The form shipped on `/dukungan` was checked beyond the DOM. A real browser preflight to the edge function:

```text
OPTIONS https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/navego-feedback
Origin: https://navego.pages.dev
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type
```

returned `HTTP/1.1 204 No Content`, `Access-Control-Allow-Origin: https://navego.pages.dev`, `access-control-allow-headers: content-type`, `access-control-allow-methods: POST, OPTIONS`. This closes the specific failure mode recorded in the edge function comments: a 204 with a body would break the browser preflight.

No fake feedback row was written; only the preflight was exercised.

## Money

Settled external revenue remains $0.00, 0 orders. A public comment is not a trial, a customer, or revenue. Score is −70 at this run.
