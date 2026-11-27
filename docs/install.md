# @last-edited: 2026-11-27 UTC+7.
# @title: install - one command turns an empty Windows machine into a browser that has Navego.
# @state: the Windows command below was checked against the live landing page on 2026-11-27; `npx -y navego doctor` and the first-win download were driven in the everyday Chrome through the extension. A fresh Windows profile has not yet driven the policy install, so the browser-managed behaviour remains vendor-documented rather than measured.
# @dependencies: `docs/external-install.md`, `docs/agent-call.md`, `docs/proof/2026-11-27-onboarding-guide.md`, `docs/store/extension-forceinstall.reg`, `docs/store/extension-forceinstall-remove.reg`, `local/install.ts`, `local/postinstall.ts`, `local/registry.ts`, `local/bin/navego.ts`.

# THE FIRST FIVE MINUTES

## 1. Install the extension on Windows

This is the command shown on the [live landing page](https://navego.pages.dev/), unchanged:

```powershell
irm https://navego.pages.dev/install.ps1 | iex
```

The [script source is public](https://github.com/afnannuzulasugihartono/navego/blob/main/site/public/install.ps1), so it can be read before it runs. It writes one per-user browser policy value for each Chromium browser it finds; restart the browser afterwards, and Navego appears enabled in the extensions page.

**What it costs:** the browser reports itself as managed by your own user policy, and the extension cannot be removed while that policy value stands. **How to undo it:** delete the policy values the command prints under `HKCU`, or, if the npm package is installed, run `navego uninstall`. Removing the policy stops the forced install; the installed extension copy still has to be removed from the browser's extensions page.

## 2. Check that it works here

Node.js 22 or newer is required. No global npm install is needed for this check:

```bash
npx -y navego doctor
```

A working machine answers with a verdict like this (measured on 2026-11-27; the device count can differ):

```text
bridge        listening on 127.0.0.1:9451; 1 device(s) linked
verdict       ready
```

`ready` means the extension is connected and the meter accepted the session. If the verdict is not `ready`, the doctor names the one fix that applies; do that one thing and run the command again.

## 3. Get the first real file

Point the MCP client at the local server with `npx -y navego local`; the exact client configuration is in [`docs/agent-call.md`](./agent-call.md). Then paste this one line into the agent:

```text
Open https://navego.pages.dev/docs and download the "Laporan keuangan September 2026" link as laporan-keuangan-2026-09.xlsx into Downloads/navego.
```

The result lands in the `Downloads/navego` folder in the person's home directory, for example `C:\Users\<you>\Downloads\navego\laporan-keuangan-2026-09.xlsx`. The download answer is the proof, not the click:

```text
downloaded: true
file: laporan-keuangan-2026-09.xlsx
path: C:\Users\<you>\Downloads\navego\laporan-keuangan-2026-09.xlsx
bytes: 21066
```

The exact tool calls behind that one line are `browser_open_url` for `https://navego.pages.dev/docs`, `browser_scroll` by 1500 pixels, then `browser_download_file` for the link named `Laporan keuangan September 2026`. The drive happened in the everyday Chrome through the extension on 2026-11-27; the downloaded workbook's SHA-256 was `a4f12765b77329eb5ec37dae3ad4323ac1d1d6659cd6261bb689c2736c931922`, equal to the workbook the live site serves. The commands, output, hash, and file location are recorded in [`docs/proof/2026-11-27-onboarding-guide.md`](./proof/2026-11-27-onboarding-guide.md).

## Reply-ready lines

These are the two lines a buyer can act on without reading the repository:

```text
irm https://navego.pages.dev/install.ps1 | iex
Open https://navego.pages.dev/docs and download the "Laporan keuangan September 2026" link as laporan-keuangan-2026-09.xlsx into Downloads/navego.
```

# THE INSTALLER IN DETAIL

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
