# @last-edited: 2026-11-15 UTC+7.
# @title: install - one command turns an empty Windows machine into a browser that has Kemudi.
# @state: unmeasured as of 2026-11-15 on this machine: the mechanism changed to the forcelist policy on that date and no throwaway profile has been driven since. The 2026-11-12 measurements applied to the classic-key route, which is retired with this change; they are preserved in git history, not carried forward as claims.
# @dependencies: `docs/external-install.md`, `docs/store/extension-forceinstall.reg`, `docs/store/extension-forceinstall-remove.reg`, `local/install.ts`, `local/postinstall.ts`, `local/registry.ts`, `local/bin/kemudi.ts`.

# WHAT THE COMMAND DOES

`kemudi install` (and `npm i -g kemudi`, via the postinstall hook):

1. Only on Windows. On any other OS it prints the Web Store path and exits 0.
2. Detects the Chromium browsers this machine carries - Chrome, Brave, Edge and Chrome for Testing - by probing the install paths each one lives at (`local/browsers.ts`, the same table the driver uses; no second list). Chrome for Testing has no canonical install path - it ships as pinned `chromium-<rev>` zips - so the probe is a one-level wildcard over the usual cache folders instead of an exact-path guess.
3. Writes one numbered `ExtensionInstallForcelist` policy entry per detected browser (`HKCU\Software\Policies\Google\Chrome\ExtensionInstallForcelist`, Edge and Brave paths analogous), each carrying `id;update-url`. A number is chosen against what is already in the list, and this extension's own entry is recognised at any number - foreign entries are never touched. The browser installs the extension itself on its next start; no UAC, no admin, no download dialog. **The extension cannot be disabled or removed while the policy entry stands.**
4. Creates `%LOCALAPPDATA%\OperaAgent\{Chrome,Brave,Edge}\` only for the browsers found, containing a **verified** copy of the build (`opera-agent.zip`, sha256 checked against the `x-opera-sha256` header of the public update endpoint before the bytes are written) plus a README that explains the whole mechanism and the manual fallback. Chrome for Testing is detected but deliberately not force-installed - no verified policy path exists for the test binary - and it gets no folder; load it unpacked instead.
5. Runs `kemudi doctor` and prints what remains human: sign in with `kemudi auth` (OAuth, one browser round trip), then click **Pasangkan browser ini** in the extension popup - the dashboard mints a single-use code and delivers it straight to the extension; nothing to type.

`npm i -g kemudi` performs the same install silently from the
`postinstall` hook, but only when installed globally, never in CI, and only
when `OPERA_AGENT_NO_INSTALL` is unset. `OPERA_AGENT_NO_INSTALL=1 npm i -g kemudi` opts out. The postinstall hook can never turn an npm install red.

# WHAT THE UNINSTALL DOES

`kemudi uninstall`, one command, maximum honesty:

1. Deletes this extension's entries from the three `ExtensionInstallForcelist` policy lists (Chrome, Brave, Edge) - exactly the values whose data names this extension, at whatever number they landed; a foreign entry is never deleted. **The browser stops forcing the extension, but the installed copy stays** until you remove it at `chrome://extensions` (`edge://`, `brave://`). Chrome for Testing entries are not written and not touched.
2. Deletes `%LOCALAPPDATA%\OperaAgent\` - the dedicated ChromeProfile, the verified build copies, the README, everything - unless `--keep-pair` is passed, in which case the paired-device file is the only thing kept.
3. Spawns a detached `npm uninstall -g kemudi`; the package removes itself after the process exits. If it cannot, the exact command to run is printed.
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
npm i -g kemudi            # or: npx kemudi install
kemudi auth                 # the one human step: sign in
# pair the device in the extension; that part takes one code and nothing else

...later...
kemudi uninstall           # one command, almost everything gone
# remove the copy at chrome://extensions if you want it fully gone
```
