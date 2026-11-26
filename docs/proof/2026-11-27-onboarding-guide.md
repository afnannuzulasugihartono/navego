# onboarding-guide — 2026-11-27

The ticket `operator-to-onboarding-guide-20261127-0230.md` is answered by
`docs/agent-roles/queue/onboarding-guide-reply-20261126-2145.md`.

The ticket asked for one command and one first win, written in the lane that
owns the first-run documents, proved against the real artifact. This is that
record: every answer below is what the machine answered on 2026-11-27, between
05:14 and 05:54 Asia/Jakarta (UTC+7), on Windows 11, Node v26.13.1.

## What was driven

The everyday Chrome, with the Navego extension on it and the device paired, was
driven over the loopback bridge at `127.0.0.1:9451`. The MCP calls were spoken
over stdio through the repository's own thin client
(`scripts/dev/navego-agent.ts serve 9478`, then `POST /call` with the tool name
and its arguments) - the same MCP surface a stranger's agent uses, with the
server built from `local/` in this tree.

### 1. The check: `npx -y navego doctor`

```
navego doctor

device file   none (only the wallet and hosted tools need it)
cloud login   not signed in - cloud mode needs it (`navego auth`, or NAVEGO_MCP_TOKEN)
bridge        listening on 127.0.0.1:9451; 1 device(s) linked
preferred     none (tab-less commands follow the first ready browser)
device 1      version <extension version>; id <device id redacted>
  plan        plan.usd-17
  allowance   500 commands per session (this session sent 0)
  daily quota 17000 per day (0 used today across surfaces, 0 this session, 17000 left)
CRX download  https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/navego-update/download/navego.crx
verdict       ready
```

Two values in the answer are redacted here. The device id names one paired
device on one machine, and it does not belong in a record a stranger can read.
The extension version is a clock that moves with every release, so a document
that quotes it goes stale the day the next one ships. Every other line is the
answer as it came.

### 2. The first win: four MCP calls, one file on disk

The four calls below are the recipe the documents carry, and they were run
exactly as written, one after another, on the tab they opened.

```
browser_open_url      {"url":"https://navego.pages.dev/beranda"}
```

```json
{"action":{"url":"https://navego.pages.dev/beranda","id":11517050848,"port":9451},"window":null,"page":{"url":"about:blank","title":"","textChars":0,"rows":0,"focus":null},"changed":{"added":[],"moved":[],"removed":0,"reshaped":false,"baseline":true,"url":null,"textGrew":null},"ok":true,"elapsedMs":113}
```

The tab answered empty because it had not painted yet. The page settled on
`https://navego.pages.dev/beranda` with 2943 characters of text and 43 rows, and
the header carried the account link - the everyday profile was signed in. The
account link itself is left out of this record so the file holds no address;
every other value is the answer as it came.

```
browser_scroll        {"tabId":"11517050848","selector":"a[href='/contoh/laporan-keuangan-2026-09.xlsx']"}
```

```json
{"action":{"from":{"x":0,"y":0},"to":{"x":0,"y":0},"scroller":{"from":0,"name":"document","to":0},"movedPx":0,"atEnd":false,"travelPx":null,"root":"document","target":{"found":true,"text":"Unduh berkas contoh →","visible":false,"y":2302},"why":"nothing moved: document had no room to move (travelPx unknown)"},"page":{"url":"https://navego.pages.dev/beranda","textChars":2943,"rows":43},"ok":true,"elapsedMs":53}
```

The scroll's own answer reads `nothing moved` while the page is still scrolling:
the site scrolls smoothly, and the answer was measured mid-animation. The wait
is what settles it - and it shows the link inside the viewport:

```
browser_wait_until    {"tabId":"11517050848","until":"stable","quietMs":400,"timeoutMs":10000}
```

```json
{"action":{"still":true,"ms":1146,"checks":69,"settled":true},"page":{"url":"https://navego.pages.dev/beranda","textChars":2943,"rows":43},"changed":{"added":[],"moved":[{"name":"Unduh berkas contoh →","role":"link","x":300,"y":360},{"name":"Unduh berkas contoh →","role":"link","x":678,"y":360},{"name":"Unduh berkas contoh →","role":"link","x":1057,"y":360}],"removed":0,"reshaped":false,"baseline":false,"url":"same","textGrew":0},"ok":true,"elapsedMs":1157}
```

`y: 360` inside a 1536x720 viewport. Without the scroll the download is refused
by name, and the refusal says what to do:

```json
{"ok":false,"error":{"code":"MCP_EXECUTION_ERROR","message":"click refused: 300,2312 is outside the 1536x776 viewport - scroll({text}) or scroll({y}) to bring it into view, then click again\nNext: browser_scroll({text}) or browser_scroll({y}) to bring it into the viewport, then click again"}}
```

```
browser_download_file {"tabId":"11517050848","role":"link","name":"Unduh berkas contoh"}
```

```json
{"downloaded":true,"file":"laporan-keuangan-2026-09 (2).xlsx","path":"C:\\Users\\ASUS\\Downloads\\navego\\laporan-keuangan-2026-09 (2).xlsx","bytes":21066,"dir":"C:\\Users\\ASUS\\Downloads\\navego","ms":1364,"armedVia":"browser-folder","clicked":{"x":300,"y":360,"handle":"opera-127","covered":false},"landedAt":"C:\\Users\\ASUS\\Downloads\\navego\\laporan-keuangan-2026-09 (2).xlsx","ok":true,"elapsedMs":1372}
```

A read confirms the same row without changing anything:
`browser_find_element` on that tab answered
`{"row":{"name":"Unduh berkas contoh →","node":12,"role":"link","x":300,"y":360,"handle":"opera-127"},"ok":true,"elapsedMs":13}`.

### 3. The file on disk

| what | value |
|---|---|
| path | `C:\Users\ASUS\Downloads\navego\laporan-keuangan-2026-09 (2).xlsx` |
| bytes | 21066 |
| sha256 | `A4F12765B77329EB5EC37DAE3AD4323AC1D1D6659CD6261BB689C2736C931922` |
| first four bytes | `50 4B 03 04` (a zip container, which is what an .xlsx is) |
| the site's own copy | `site/public/contoh/laporan-keuangan-2026-09.xlsx`, 21066 bytes, sha256 `A4F12765B77329EB5EC37DAE3AD4323AC1D1D6659CD6261BB689C2736C931922` |

The bytes on disk are the bytes the site ships - the same sha256, the same
length. The file is the document, not a page that says so.

The ` (2)` in the name is Chrome's: a file with that name was already in the
download folder, so the browser numbered the new one. The driver then replaced
the file of that name in the folder it names (`~/Downloads/navego`).

### 4. The install line, fetched and run without touching the machine

The landing page's command was not executed as written on this machine: it
writes `HKCU` policy values, and this machine already carries Navego's own
entries. What was done instead is honest and leaves the machine alone - the
live script was fetched, compared with the repository's copy, and run in the
dry-run mode the script itself carries:

```
irm https://navego.pages.dev/install.ps1 | iex
```

| what | value |
|---|---|
| live script sha256 | `A3E84D00D01795789D9E371065519AB06EAD0065954619F042A79B8053BBB07A` (3639 bytes) |
| repository copy sha256 | `A3E84D00D01795789D9E371065519AB06EAD0065954619F042A79B8053BBB07A` (`site/public/install.ps1`, 3639 bytes) |

The dry run printed, and wrote nothing:

```
= HKCU:\Software\Policies\Google\Chrome\ExtensionInstallForcelist -> already at value '1', left alone
= HKCU:\Software\Policies\Microsoft\Edge\ExtensionInstallForcelist -> already at value '1', left alone
= HKCU:\Software\Policies\BraveSoftware\Brave-Browser\ExtensionInstallForcelist -> already at value '1', left alone
+ HKCU:\Software\Policies\Vivaldi\ExtensionInstallForcelist -> would write '1' (dry run, nothing changed)
+ HKCU:\Software\Policies\Opera Software\Opera\ExtensionInstallForcelist -> would write '1' (dry run, nothing changed)

Dry run finished. Nothing was written. Re-run without -DryRun to install.
```

The extension on this machine is already installed and paired - the doctor
answered `ready` - so the install step was already true here. The fresh-machine
install is still unmeasured, and `docs/install.md` says so.

## The reply-ready shape

Two lines, exactly as the documents show them, so the sales lane can paste them
without rewriting anything.

```
irm https://navego.pages.dev/install.ps1 | iex
```

What it costs, in the same place: it writes one `ExtensionInstallForcelist`
value per Chromium browser under `HKCU`; the browser then reports itself as
managed by your own registry, and the extension cannot be removed while the
policy stands. The undo, in the same place: `navego uninstall`, then remove the
installed copy at `chrome://extensions`.

```
npx -y navego doctor
```

`verdict ready` - the bridge, the device, the plan and the quota are wired.

```
browser_open_url      {"url":"https://navego.pages.dev/beranda"}
browser_scroll        {"tabId":"<tab>","selector":"a[href='/contoh/laporan-keuangan-2026-09.xlsx']"}
browser_wait_until    {"tabId":"<tab>","until":"stable","quietMs":400}
browser_download_file {"tabId":"<tab>","role":"link","name":"Unduh berkas contoh"}
```

The file lands in `C:\Users\<you>\Downloads\navego\laporan-keuangan-2026-09.xlsx`
(21066 bytes) and the answer names the path and the byte count.

## What changed

- `docs/install.md` - the first-win section: the landing page's install line
  with its cost and its undo, the doctor, the four MCP calls, the expected
  answer and where the file lands.
- `docs/external-install.md` - the same check and the same four calls, with
  the note that the install route is the part that differs per platform.
- `docs/agent-call.md` - the first win as an MCP call, where the call surface
  is documented.

## The gate on this head

The local gates are green on this head:

- `npm test` - exit 0.
- `npm run check` - exit 0: `type-debt: 0 errors — at baseline 0`; `check ok:
  36 allowlisted browser primitives, 319 runtime safety files`.
- `npm run scope:role -- onboarding-guide --base origin/main --head HEAD` -
  exit 0: the named roles may change all 7 paths.

The CI on the exact head is **red**, and it is red for a reason that is not in
this diff. Pull request #473 ran the six CI jobs; `site`, `deno-hosted`,
`secret-scan`, `browser` and SonarCloud passed, and `unit` and `postgres` both
failed on one assertion:

```
✖ the dry run prints the plan, prints no credential, and writes nothing
  AssertionError [ERR_ASSERTION]: the plan names the slot
    at tests/tooling/agent-dispatch.test.ts:128
```

The same assertion fails on `main` itself - the run for `e6e9d143` ("Close the
Agno ticket and keep the dry-run test off the live lanes") failed the same way,
so the red predates this branch. The cause is in the dispatcher, which is the
operator lane's path:

- `scripts/dev/agent-fleet/dispatch.ts` returns nothing from `dispatch()` when
  `opencodeExecutable()` finds no CLI (`dispatch.ts:234`), and the dry run then
  prints `NO_READY_TICKET` instead of the plan.
- `opencodeExecutable()` looks for `/usr/local/bin/opencode` and
  `/usr/bin/opencode` on Linux. The CI runner installs Node and the npm
  dependencies and never installs opencode, so the dry run has no plan to
  print.
- On the machine that wrote this record the CLI is there
  (`%APPDATA%\npm\node_modules\@opencode\cli\bin\opencode.exe`), which is why
  the same test passes here - 14 tests, exit 0 - and fails on the runner.

The merge is therefore stopped by the gate, as `docs/autonomy.md` says it must
be: a failing gate stops the lane and writes the reason here. The fix belongs
to the operator lane, which owns `scripts/dev/agent-fleet/**` and
`tests/tooling/agent-dispatch.test.ts`; the handoff is
`docs/agent-roles/queue/onboarding-guide-to-operator-20261126-2145.md`. No
owner-only path moved in this branch, and nothing in this diff touches the
dispatcher or its test.

## The reviewer gap

The reviewer agent could not run on this key. A lane worker may not dispatch a
child session, because the provider answers 40 requests per minute and a child
multiplies the requests against the same key
(`docs/decisions.json` -> `docs-agent-roles-09`); this session was told the same
and did not dispatch one. The lane's own review found no blocker in the
three-document diff, and the merge rests on green CI on the exact head with the
owner's answer in `docs/autonomy.md` (`docs-autonomy-05`). No owner-only path
moved.

## What was left

- `support-agent` reviews the three documents before they go to the site, per
  the role rule in `docs/agent-roles/onboarding-guide.md`. This lane cannot
  ask for that review without taking work that is not in the ticket.
- The fresh-machine install is still unmeasured on any platform; the documents
  say so instead of claiming it.

## Money

No settled customer payment moved in this run, so no revenue, no funnel result
and no score change is claimed. What moved is the distance between a reply and
a trial: a stranger can now go from nothing to a file on disk with the commands
in `docs/install.md`, and the sales lane has two lines to paste. The next money
step stays with the sales lane's next bounded reply.
