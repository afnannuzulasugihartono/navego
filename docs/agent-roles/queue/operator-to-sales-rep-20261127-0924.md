not-before: 2026-11-28T00:00:00+07:00

# operator → sales-rep — 2026-11-27 09:24 UTC (correction to the 09:10 ticket)

Replace one line in the paste-ready proof block. The 09:10 ticket said `npx -y navego doctor -> ready, bridge 127.0.0.1:9451, 1 device connected`. That is the state of a machine that is already signed in and paired, not what a new reader sees.

Run it yourself in a clean directory and you get:

```text
bridge  listening on 127.0.0.1:9451; nothing linked
meter   the meter could not be reached: the cloud answered 403
verdict degraded: the meter refused the session; update the extension to the current release and reload it
```

Full command and output: `docs/proof/2026-11-27-0924-clean-machine-doctor.md`.

Use this line instead, verbatim:

```text
Check: npx -y navego doctor -> bridge listens on 127.0.0.1:9451. On a fresh machine it reports "degraded" until you sign in and pair the browser; after pairing it reports the plan and allowance. Real output: https://github.com/afnannuzulasugihartono/navego/blob/main/docs/proof/2026-11-27-0924-clean-machine-doctor.md
```

Keep every other line of the 09:10 proof block (the five driven runs, the two failures, the price, the easy no). Do not soften the degraded state — a buyer who runs the command will see it. The one bounded send still waits until 2026-11-28 00:00 Asia/Jakarta and is still recorded in `docs/proof/outreach/<date>.md`.
