# @last-edited: 2026-11-15 UTC+7.
# @title: external install - the extension installs and updates without the Chrome Web Store, on Windows, macOS and Linux.
# @state: paths and flags are written to the vendor documentation as of 2026-11-15; Windows forcelist route verified as data only - no throwaway profile has been driven since this file was written. The 2026-11-12 measurement in `docs/registry-install.md` is the evidence for the classic external route.
# @dependencies: `docs/store/extension-forceinstall.reg`, `docs/store/extension-forceinstall-remove.reg`, `docs/store/ofgemipoobcnbjkfanmofjbdonjapmgl.json`, `docs/store/opera-agent-managed.json`, `docs/registry-install.md`, `docs/install.md`.

# WHAT THIS IS

Three ways to get the extension into a browser without a store review, all of them riding the same signed CRX behind one URL:

`https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/opera-agent-update/update.xml?id=ofgemipoobcnbjkfanmofjbdonjapmgl`

- **Route A, external extension** - the browser installs what the metadata says to install and keeps it up to date from the same URL. The person keeps control: the extension can be disabled or removed, exactly like a normal install.
- **Route B, force install policy** - the browser installs it silently, the person cannot turn it off, and it reinstalls on the next start. For machines the person owns, where they want zero steps after one double-click.
- **Route C, stores** - Edge Add-ons (free) or the Chrome Web Store (one-time $5), if an account is ever created there. Out of scope for this file.

Updates ride the same file in both routes: every start, the browser re-reads `update.xml`, and a newly published build arrives without anyone asking. **No route on this page involves choosing a folder** - the folder flow is the developer-mode fallback and lives in `docs/install.md`.

# BEFORE YOU START

Check the update URL answers and says the current version (measured 2026-11-15: `1.6.52`):

```
curl -I "https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/opera-agent-update/update.xml?id=ofgemipoobcnbjkfanmofjbdonjapmgl"
```

If it does not answer `200` with an `X-Opera-Version` header, nothing on this page will produce an extension.

# WINDOWS

**Route A (classic, no policy, user keeps control)** - `docs/store/extension-registry-install.reg` writes the external-extension keys; see `docs/registry-install.md` for the measured evidence.

**Route B (force install, silent)** - double-click `docs/store/extension-forceinstall.reg`, or:

```
reg import extension-forceinstall.reg
```

It writes one string value, `1`, under `ExtensionInstallForcelist` for Chrome, Edge and Brave, each carrying `id;update-url`. Then restart the browser. Verify:

- `chrome://extensions` shows Opera Agent, installed, enabled, and the button to remove it is greyed out.
- `chrome://policy` (or `brave://policy`, `edge://policy`) lists the `ExtensionInstallForcelist` policy with the entry above, marked as set by the user.

What Route B costs you, stated once and honestly:

1. The browser starts reporting itself as managed - by you, via your own registry. `chrome://policy` says `ExtensionInstallForcelist` is set. That is the policy system doing exactly what it was designed for.
2. The extension cannot be disabled or removed while the policy stands. Removing the policy (below) does not remove the extension; it removes the protection. The extension then stays until you remove it at `chrome://extensions`.
3. On a machine that is actually managed (school, company), the administrator's policy wins: your HKCU write is either refused or overridden, and no file in this repository will override an administrator. That is the wall you hit at school, not a bug to fix.
4. Value `1` is used. If `ExtensionInstallForcelist` already carries entries of your own, merge them into a single list instead of overwriting - one value per entry, next free number.

Removal: double-click `docs/store/extension-forceinstall-remove.reg` (deletes exactly value `1`, never your own), restart the browser, then remove the extension at `chrome://extensions` if you want it gone.

# MACOS

`defaults` writes user-level preferences; no administrator rights are needed for Route B. Route A needs a folder copy the user owns.

**Route A (external extension, no admin):**

```
DIR_CHROME="$HOME/Library/Application Support/Google/Chrome/External Extensions"
DIR_EDGE="$HOME/Library/Application Support/Microsoft Edge/External Extensions"
mkdir -p "$DIR_CHROME" "$DIR_EDGE"
cp docs/store/ofgemipoobcnbjkfanmofjbdonjapmgl.json "$DIR_CHROME/"
cp docs/store/ofgemipoobcnbjkfanmofjbdonjapmgl.json "$DIR_EDGE/"
```

The filename must stay exactly `ofgemipoobcnbjkfanmofjbdonjapmgl.json`; the browser reads the id from the filename. Restart Chrome or Edge.

For all users on one machine (administrator password required): copy the same file into `/Library/Application Support/Google/Chrome/External Extensions/` or `/Library/Application Support/Microsoft Edge/External Extensions/`, with the directory owned by `root`, group `admin` or `wheel`, not group/world writable, and free of symbolic links - and keep the file itself read-only.

**Route B (force install, no admin):**

```
U="ofgemipoobcnbjkfanmofjbdonjapmgl;https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/opera-agent-update/update.xml?id=ofgemipoobcnbjkfanmofjbdonjapmgl"
defaults write com.google.Chrome ExtensionInstallForcelist -array "$U"
defaults write com.microsoft.Edge ExtensionInstallForcelist -array "$U"
defaults write com.brave.Browser ExtensionInstallForcelist -array "$U"
```

Restart the browser. Verify with `defaults read com.google.Chrome ExtensionInstallForcelist` and at `chrome://policy`.

Removal: `defaults delete com.google.Chrome ExtensionInstallForcelist` (deletes the whole array), restart, then remove the extension at `chrome://extensions` if you want it gone.

Notes on Route B for macOS, honestly: the browser reports managed while the array stands; Chrome's documented behavior is to reinstall the extension at every start; the array carries only this extension, and `defaults delete` restores the prior state. Brave honors the same defaults mechanism; verify at `brave://policy` rather than trusting the default domain of a fork.

# LINUX

**Route A (external extension):** the system directory requires root; there is no per-user external-extensions folder for Chrome on Linux (Edge has one).

```
sudo mkdir -p /opt/google/chrome/extensions
sudo cp docs/store/ofgemipoobcnbjkfanmofjbdonjapmgl.json /opt/google/chrome/extensions/
# Edge, user-level, no root:
mkdir -p "$HOME/.config/microsoft-edge/External Extensions"
cp docs/store/ofgemipoobcnbjkfanmofjbdonjapmgl.json "$HOME/.config/microsoft-edge/External Extensions/"
# Edge, all users, root:
sudo mkdir -p /usr/share/microsoft-edge/extensions
sudo cp docs/store/ofgemipoobcnbjkfanmofjbdonjapmgl.json /usr/share/microsoft-edge/extensions/
```

**Route B (force install, root):** managed policy files are JSON in a directory the browser reads at start.

```
sudo mkdir -p /etc/opt/chrome/policies/managed
sudo cp docs/store/opera-agent-managed.json /etc/opt/chrome/policies/managed/opera-agent.json
# Edge:
sudo mkdir -p /etc/opt/microsoft/edge/policies/managed
sudo cp docs/store/opera-agent-managed.json /etc/opt/microsoft/edge/policies/managed/opera-agent.json
```

Restart the browser; verify at `chrome://policy`. Brave's policy directory varies by distribution (`/etc/brave/policies/managed` on most); verify with `brave://policy` rather than guessing.

Removal: delete the placed file (`sudo rm /etc/opt/chrome/policies/managed/opera-agent.json` or remove the `.json` from the external extensions folder), restart, then remove the extension at `chrome://extensions`.

# WHAT IS TRUE, AND WHAT IS NOT

- Both routes ride the same signed CRX and the same update URL; nothing here trusts a third party, and the CRX is checked by the browser itself against the key baked into the manifest.
- Route A on Windows is measured (throwaway profiles, 2026-11-12); everything else on this page is written from vendor documentation and has not been driven end to end by this project yet. Brave's per-user behavior on everyday profiles is known to be stricter than Chrome's - if the extension shows installed but disabled on Brave, that is the browser asking, and the person enabling it in `brave://extensions` is the supported answer.
- Neither route works on a machine whose administrator policy forbids external installs. The school profile case is that case. Route around it with a personal profile, or not at all - do not expect a file to win that fight.
- Updates are re-checked at browser start, not live. A published CRX reaches a machine on its next restart cycle, and the extension pull flow (`extension.update`) reaches an already-running browser when the machine asks for it.
- Removing Route B's policy stops the protection, not the extension. That asymmetry is the point of the route.
- Chrome for Testing is a test binary and is deliberately absent from Route B; the registry installer covers it as it covers the rest, because test binaries are what it exists for.
