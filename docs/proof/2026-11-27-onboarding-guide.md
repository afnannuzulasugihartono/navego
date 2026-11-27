# Onboarding guide proof — one command, one check, one first file

Date: 2026-11-27 (Asia/Jakarta, UTC+07:00)
Lane: onboarding-guide
Ticket: `operator-to-onboarding-guide-20261127-0230.md`

## What was driven

The live landing page at <https://navego.pages.dev/> was read on 2026-11-27 and showed this install command verbatim:

```text
irm https://navego.pages.dev/install.ps1 | iex
```

The same page showed the cost before the command: the browser reports itself as managed and the extension cannot be removed until the policy value is deleted. The public script at <https://navego.pages.dev/install.ps1> names the undo path in its final lines: delete the values it printed under `HKCU`, or run `navego uninstall` from the npm package.

The install command was not run against this machine's registry because it would change the browser policy for the operator's own everyday browser. The doctor and the first win below were run against the real installed extension and the real everyday Chrome.

## The check

Command:

```bash
npx -y navego doctor
```

Output:

```text
navego doctor

device file   none (only the wallet and hosted tools need it)
cloud login   not signed in - cloud mode needs it (`navego auth`, or NAVEGO_MCP_TOKEN)
bridge        listening on 127.0.0.1:9451; 1 device(s) linked
preferred     none (tab-less commands follow the first ready browser)
device 1      version <the installed release>; id a2a7d094-0d90-4474-a09e-68d2de681dfe
  plan        plan.usd-17
  allowance   500 commands per session (this session sent 0)
  daily quota 17000 per day (1916 used today across surfaces, 0 this session, 15084 left)
CRX download  https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/navego-update/download/navego.crx
verdict       ready
```

The verdict was `ready`: the extension was connected on the loopback bridge and the meter accepted the session.

## The first win

The local MCP server was started over stdio and driven against the live `https://navego.pages.dev/docs` page in the everyday Chrome through the extension. The exact calls were:

```text
browser_open_url {"url":"https://navego.pages.dev/docs"}
browser_scroll {"tabId":"11517050903","y":1500}
browser_download_file {"tabId":"11517050903","role":"link","name":"Laporan keuangan September 2026","dir":"C:\\Users\\ASUS\\Downloads\\navego","saveAs":"laporan-keuangan-2026-09.xlsx","timeoutMs":30000}
```

The download answer was:

```json
{"downloaded":true,"file":"laporan-keuangan-2026-09.xlsx","path":"C:\\Users\\ASUS\\Downloads\\navego\\laporan-keuangan-2026-09.xlsx","bytes":21066,"dir":"C:\\Users\\ASUS\\Downloads\\navego","ms":1531,"armedVia":"browser-folder","clicked":{"x":636,"y":163,"handle":"opera-1","covered":false},"landedAs":"laporan-keuangan-2026-09 (2).xlsx","landedAt":"C:\\Users\\ASUS\\Downloads\\laporan-keuangan-2026-09 (2).xlsx","ok":true,"elapsedMs":1565}
```

The file was then read from disk, not inferred from the answer:

```text
path=C:\Users\ASUS\Downloads\navego\laporan-keuangan-2026-09.xlsx
bytes=21066
sha256=a4f12765b77329eb5ec37dae3ad4323ac1d1d6659cd6261bb689c2736c931922
```

The repository copy that the live site serves, `site/public/contoh/laporan-keuangan-2026-09.xlsx`, hashed to the same value:

```text
sha256=a4f12765b77329eb5ec37dae3ad4323ac1d1d6659cd6261bb689c2736c931922
```

So the first win was driven, the file landed on disk, and the bytes matched the file the live site serves.

## Reply-ready lines

These are the same two lines shown in `docs/install.md`, `docs/external-install.md`, and `docs/agent-call.md`:

```text
irm https://navego.pages.dev/install.ps1 | iex
Open https://navego.pages.dev/docs and download the "Laporan keuangan September 2026" link as laporan-keuangan-2026-09.xlsx into Downloads/navego.
```

## Repository verification

- `npm test` — exit 0 on 2026-11-27.
- `npm run check` — exit 0 on 2026-11-27 (`check ok`).
- `npm run scope:role -- onboarding-guide --base origin/main --head HEAD` — exit 0; the verifier allowed all 6 changed paths.
- Branch: `agent/onboarding-guide-20261127-0125/first-win`.
- Pull request: <https://github.com/afnannuzulasugihartono/navego/pull/478>, merged at 2026-11-27T02:04:01Z as `ada0527e3c2298251b44fc40cb0cf11d7a297873`.

## The reviewer gate

The reviewer agent could not run on this lane. This session is the only worker on its key, and the instruction that opened it forbids a child session because a child multiplies requests against the same 40 rpm provider limit. Pull request #478 therefore has no reviewer finding and GitHub's review state remains `REVIEW_REQUIRED`.

The owner instruction that opened this lane requires the pull request and a merge by gate. `docs/autonomy.md` and `docs-autonomy-05` record the owner's answer for a reviewer that cannot run: green CI on the exact head, the lane's diff review, and this written gap carry the merge under the owner's direct instruction for this run. The lane's diff review read the six changed paths, found only the three onboarding documents, the proof, the reply, and the status line, and found no owner-only path: `gates.lock`, `tests/helpers/boundary-locks.ts`, `.github/CODEOWNERS`, and `.github/workflows/` are untouched.

CI run <https://github.com/afnannuzulasugihartono/navego/actions/runs/45925194374> was green on head `2471f48e`: unit, site, deno-hosted, secret-scan, browser, and postgres passed, and SonarCloud's quality gate passed with zero new issues. The final exact-head run, <https://github.com/afnannuzulasugihartono/navego/actions/runs/45925800483>, was green on head `41ccd3eb` with the same six CI jobs and SonarCloud green; pull request #478 then merged as `ada0527e3c2298251b44fc40cb0cf11d7a297873`.

## Money and scope

No money moved. This run measured the install path and the first result; it did not create a paid order, a plan, or a `paypal-live` settlement.
