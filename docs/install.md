# @last-edited: 2026-11-27 UTC+7.
# @title: install - one command turns an empty Windows machine into a browser that has Navego.
# @state: the first win was driven on 2026-11-27 on a machine that already carried Navego's own policy entries: the doctor answered `ready`, and three MCP calls drove the everyday Chrome to save the site's sample spreadsheet on disk, byte-equal to the file the site ships (the record: `docs/proof/2026-11-27-onboarding-guide.md`). The fresh-machine install is still unmeasured: the mechanism changed to the forcelist policy on 2026-11-15 and no throwaway profile has been driven since. The 2026-11-12 measurements applied to the classic-key route, which is retired with this change; they are preserved in git history, not carried forward as claims.
# @dependencies: `docs/external-install.md`, `docs/store/extension-forceinstall.reg`, `docs/store/extension-forceinstall-remove.reg`, `local/install.ts`, `local/postinstall.ts`, `local/registry.ts`, `local/bin/navego.ts`.

# THE FIRST WIN - ONE COMMAND, ONE RESULT

Two lines. The first is the command the landing page shows; the second is the
result you keep. The check and the first win were run on 2026-11-27 and the
record is
[`docs/proof/2026-11-27-onboarding-guide.md`](./proof/2026-11-27-onboarding-guide.md).
The install line was fetched live on the same day and run in the dry-run mode
its own script carries - it writes policy values, so it was not run as written
on the machine that did the drive.

## LINE 1 - THE INSTALL, AS THE LANDING PAGE SHOWS IT

```
irm https://navego.pages.dev/install.ps1 | iex
```

One line, unchanged from `site/app/lib/install-command.ts` and from the landing
page at https://navego.pages.dev/. The script it fetches was live on
2026-11-27 and byte-equal to `site/public/install.ps1` (sha256
`A3E84D00D01795789D9E371065519AB06EAD0065954619F042A79B8053BBB07A`). It writes
one `ExtensionInstallForcelist` value per Chromium browser under `HKCU` and
prints what it wrote.

**What it costs, in the same place:** the browser then reports itself as managed
by your own registry, and the extension cannot be removed from
`chrome://extensions` while the policy stands. A machine an administrator
manages keeps the administrator's answer; this command does not try to win
that.

**The undo, in the same place:** `navego uninstall` deletes exactly this
extension's policy values and the `%LOCALAPPDATA%\Navego` folder; the installed
copy itself is removed at `chrome://extensions` (`edge://`, `brave://`). The
script prints the same path when it runs.

The npm route does the same thing and brings the command with it: `npm i -g
navego` runs the install from the postinstall hook (never in CI, and
`NAVEGO_NO_INSTALL=1` opts out). On macOS and Linux the route is
[`docs/external-install.md`](./external-install.md).

## LINE 2 - THE FIRST WIN

The check first, so that the result means something:

```
npx -y navego doctor
```

It prints the bridge, the device, the extension version, the plan and the quota,
and ends with `verdict ready` when the everyday browser is wired. The run on
2026-11-27 answered (the device id and the extension version are the two values
redacted here and in the proof - run the doctor and read them yourself):

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

Then the win itself, in the agent that speaks to the local MCP server (`npx -y
navego local`; the wiring is in [`docs/agent-call.md`](./agent-call.md)):

```
browser_open_url      {"url":"https://navego.pages.dev/beranda"}
browser_scroll        {"tabId":"<tab>","selector":"a[href='/contoh/laporan-keuangan-2026-09.xlsx']"}
browser_download_file {"tabId":"<tab>","role":"link","name":"Unduh berkas contoh"}
```

`browser_open_url` answers with the tab id. The scroll brings the sample link
into the viewport - a click below the fold is refused, by name, so the link has
to be on screen first. The page scrolls smoothly, so the scroll's own answer can
read `nothing moved` while the page is still moving; the next read shows the
link inside the viewport. The download clicks it and waits until the file has
stopped growing. The answer on 2026-11-27 was:

```
{"downloaded":true,"file":"laporan-keuangan-2026-09 (2).xlsx","path":"C:\\Users\\<you>\\Downloads\\navego\\laporan-keuangan-2026-09 (2).xlsx","bytes":21066,"dir":"C:\\Users\\<you>\\Downloads\\navego","armedVia":"browser-folder","ok":true}
```

**Where the result lands:** `C:\Users\<you>\Downloads\navego\` - the folder the
tool names by default, and `dir` moves it somewhere else. The bytes on disk
hashed equal to the sample the site ships,
`site/public/contoh/laporan-keuangan-2026-09.xlsx` (sha256
`A4F12765B77329EB5EC37DAE3AD4323AC1D1D6659CD6261BB689C2736C931922`, 21066
bytes), so the file is the document and not a page that says so. Chrome appends
` (2)` to the name when a file with that name is already in the download
folder, and the driver moves the file into the folder it names under that
name.

# WHAT THE COMMAND DOES

`navego install` (and `npm i -g navego`, via the postinstall hook):

1. Only on Windows. On any other OS it prints the Web Store path and exits 0.
2. Detects the Chromium browsers this machine carries - Chrome, Brave, Edge and Chrome for Testing - by probing the install paths each one lives at (`local/browsers.ts`, the same table the driver uses; no second list). Chrome for Testing has no canonical install path - it ships as pinned `chromium-<rev>` zips - so the probe is a one-level wildcard over the usual cache folders instead of an exact-path guess.
3. Writes one numbered `ExtensionInstallForcelist` policy entry per detected browser (`HKCU\Software\Policies\Google\Chrome\ExtensionInstallForcelist`, Edge and Brave paths analogous), each carrying `id;update-url`. A number is chosen against what is already in the list, and this extension's own entry is recognised at any number - foreign entries are never touched. The browser installs the extension itself on its next start; no UAC, no admin, no download dialog. **The extension cannot be disabled or removed while the policy entry stands.**
4. Creates `%LOCALAPPDATA%\Navego\{Chrome,Brave,Edge}\` only for the browsers found, containing a **verified** copy of the build (`navego.zip`, sha256 checked against the `x-opera-sha256` header of the public update endpoint before the bytes are written) plus a README that explains the whole mechanism and the manual fallback. Chrome for Testing is detected but deliberately not force-installed - no verified policy path exists for the test binary - and it gets no folder; load it unpacked instead.
5. Runs `navego doctor` and prints what remains human: sign in with `navego auth` (OAuth, one browser round trip), then click **Pasangkan browser ini** in the extension popup - the dashboard mints a single-use code and delivers it straight to the extension; nothing to type.

`npm i -g navego` performs the same install silently from the
`postinstall` hook, but only when installed globally, never in CI, and only
when `NAVEGO_NO_INSTALL` is unset (`NAVEGO_NO_INSTALL=1` still works). `NAVEGO_NO_INSTALL=1 npm i -g navego` opts out. The postinstall hook can never turn an npm install red.

# WHAT THE UNINSTALL DOES

`navego uninstall`, one command, maximum honesty:

1. Deletes this extension's entries from the three `ExtensionInstallForcelist` policy lists (Chrome, Brave, Edge) - exactly the values whose data names this extension, at whatever number they landed; a foreign entry is never deleted. **The browser stops forcing the extension, but the installed copy stays** until you remove it at `chrome://extensions` (`edge://`, `brave://`). Chrome for Testing entries are not written and not touched.
2. Deletes `%LOCALAPPDATA%\Navego\` - the dedicated ChromeProfile, the verified build copies, the README, everything - unless `--keep-pair` is passed, in which case the paired-device file is the only thing kept.
3. Spawns a detached `npm uninstall -g navego`; the package removes itself after the process exits. If it cannot, the exact command to run is printed.
4. Prints the one thing it cannot script away: removing the installed copy at `chrome://extensions`, or copies installed the manual developer-mode way (`Load unpacked`).

# WHAT IT IS NOT

- Not a tampering tool: Secure Preferences are never edited; the install goes through the policy mechanism the browsers document.
- Not a store replacement: browsers and machines under an administrator's policy keep the administrator's answer. HKCU forcelist entries are user-level, but an actual managed machine wins - that is what the school profile case is.
- Not an auto-pairing flow and not an auto sign-in; OAuth is the human's to give, deliberately, and pairing is one click in the popup or the dashboard.
- Not a promise about macOS or Linux: the Windows policy keys do not exist there; the command says so and exits 0. The equivalent policies for macOS and Linux are documented in [`docs/external-install.md`](./external-install.md).
- Not reversible by deleting the policy alone: the installed copy stays until you remove it in the browser. The policy is the protection, not the install.

# THE PATHS, MEASURED

| Path | Outcome | Evidence |
|---|---|---|
| Not Windows | prints Web Store path, exits 0, touches nothing | unit test |
| No Chrome/Brave/Edge found | prints the missing browser, exits 0, touches nothing | unit test |
| Key write denied for one browser | the others still complete; install exits 1; postinstall exits 0 | unit test |
| Zip fetch fails / hash mismatch | no folder written, policy entry still written, reason printed, install exits 1 | unit test |
| Fresh Windows machine, browser starts after install | extension installs itself and cannot be disabled | not yet driven - see @state |
| Policy entries deleted, browser starts | the extension is not reinstalled or enforced anymore; the copy stays until removed in the browser | not yet driven - see @state |
| Developer-mode (Load unpacked) copy | not visible to the policy; one click at `chrome://extensions` removes it | known browser behaviour |

# THE TWO COMMANDS

```
npm i -g navego            # or: npx navego install
navego auth                 # the one human step: sign in
# pair the device in the extension; that part takes one code and nothing else

...later...
navego uninstall           # one command, almost everything gone
# remove the copy at chrome://extensions if you want it fully gone
```
