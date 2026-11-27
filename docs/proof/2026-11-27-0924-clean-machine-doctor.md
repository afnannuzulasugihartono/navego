# Clean-machine doctor evidence — 2026-11-27 09:24 UTC

Command run from the isolated worktree `D:\GitHub\navego-run31-download-verification`, which has no cloud login and no paired device file:

```text
$ npx -y navego doctor
navego doctor

device file   none (only the wallet and hosted tools need it)
cloud login   not signed in - cloud mode needs it (`navego auth`, or NAVEGO_MCP_TOKEN)
bridge        listening on 127.0.0.1:9451; nothing linked
meter         the meter could not be reached: the cloud answered 403
preferred     none (tab-less commands follow the first ready browser)
CRX download  https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/navego-update/download/navego.crx
verdict       degraded: the meter refused the session; update the extension to the current release and reload it
```

Exit code: 1.

## What this means

- `npx -y navego doctor` runs and the bridge listens on the documented port. The install path is not broken.
- `verdict ready` and "1 device terhubung" are **states after sign-in and pairing**, not what a fresh machine prints. A buyer who copies the current first-screen line gets the output above and sees a mismatch.
- The 403 is a refusal from the meter for this unauthenticated, unpaired machine. It is not evidence that a paying customer's flow is broken; it is evidence that the site's unconditional claim is wrong.

## Live claim checked

`https://navego.pages.dev/` currently renders:

> `npx -y navego doctor` → `ready`; bridge `127.0.0.1:9451`, 1 device terhubung.

Checked 2026-11-27T09:24Z against the deployed page at `main` `9afbb9ee`.

## Use

Sales must paste the conditional form in the ticket `operator-to-sales-rep-20261127-0910.md` replacement, not the old unconditional line. Engineering owns the site copy change; the manager does not edit `site/` in this operator run.
