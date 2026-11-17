# @last-edited: 2026-11-15 UTC+7.
# @title: external install - the extension installs and stays, without the Chrome Web Store, on Windows, macOS and Linux.
# @state: paths and flags are written to the vendor documentation as of 2026-11-15; the same day the route was chosen (owner decision, single route), and nothing here has been driven end to end on any machine yet.
# @dependencies: `docs/store/extension-forceinstall.reg`, `docs/store/extension-forceinstall-remove.reg`, `docs/store/opera-agent-managed.json`, `docs/install.md`.

# WHAT THIS IS

One route, one story: the extension is **force-installed by policy** and cannot be disabled while the policy stands. It rides the same signed CRX behind one URL:

`https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/opera-agent-update/update.xml?id=ofgemipoobcnbjkfanmofjbdonjapmgl`

There is no second, gentler path in this repository. The classic external-key route was retired on 2026-11-15 by the owner's decision; the artifacts live in git history, not in the tree.

Updates ride the same URL: every browser start, the browser re-reads `update.xml`, and a newly published build arrives without anyone asking. **No path on this page involves choosing a folder** - the folder flow is the developer-mode fallback in `docs/install.md`.

# BEFORE YOU START

Check the update URL answers and carries the version the tree now reads (measured 2026-11-15):

```
curl -I "https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/opera-agent-update/update.xml?id=ofgemipoobcnbjkfanmofjbdonjapmgl"
```

If it does not answer `200` with an `X-Opera-Version` header, nothing on this page will produce an extension.

# WINDOWS

**Force install, no admin, per user** - double-click `docs/store/extension-forceinstall.reg`, or:

```
reg import extension-forceinstall.reg
```

It writes one numbered `ExtensionInstallForcelist` entry per browser (Chrome, Edge, Brave) under HKCU, each carrying `id;update-url`. The number is whatever is next free at the time; on a fresh machine that is `1`. Then restart the browser. Verify:

- `chrome://extensions` shows Navego, installed, enabled, and the button to remove it is greyed out.
- `chrome://policy` (or `brave://policy`, `edge://policy`) lists the `ExtensionInstallForcelist` policy, set by the user.

If you already had your own forcelisted extension(s), do not double-click an unmodified copy blindly - the file writes `1`, and if somebody else already owns `1` it gets overwritten. In that case run `navego install` instead: it finds the next free number and never touches a foreign entry.

Removal, in order of least to most surgical:

1. `navego uninstall` - finds this extension's own entries by their id at whatever number they landed and deletes exactly those.
2. `docs/store/extension-forceinstall-remove.reg` - deletes exactly value `1` of the three policies. Only correct when `1` is ours (a fresh machine), as installed by the `.reg` file unmodified.
3. Then restart the browser and, if you want the installed copy gone too, remove it at `chrome://extensions` (`edge://`, `brave://`).

What the route costs you, stated once and honestly:

1. The browser starts reporting itself as managed - by you, via your own registry. `chrome://policy` says `ExtensionInstallForcelist` is set.
2. The extension cannot be disabled or removed while the policy stands. Removing the policy does not remove the installed copy; it removes the protection.
3. On a machine that is actually managed (school, company), the administrator's policy wins. Your HKCU write is either refused or overridden, and no file in this repository will override an administrator. That is what the school profile case is.
4. Chrome for Testing is not covered: no verified HKCU policy path exists for the test binary, and writing one would be a guess. Load it unpacked instead.

# MACOS

`defaults` writes user-level preferences; no administrator rights are needed.

```
U="ofgemipoobcnbjkfanmofjbdonjapmgl;https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/opera-agent-update/update.xml?id=ofgemipoobcnbjkfanmofjbdonjapmgl"
defaults write com.google.Chrome ExtensionInstallForcelist -array "$U"
defaults write com.microsoft.Edge ExtensionInstallForcelist -array "$U"
defaults write com.brave.Browser ExtensionInstallForcelist -array "$U"
```

Restart the browser. Verify with `defaults read com.google.Chrome ExtensionInstallForcelist` and at `chrome://policy`.

Removal: `defaults delete com.google.Chrome ExtensionInstallForcelist` (deletes the whole array - if you had your own entries, write them back afterwards), restart, then remove the extension at `chrome://extensions` if you want it gone.

Notes, honestly: the browser reports managed while the array stands; Brave honors the same defaults mechanism but verify at `brave://policy` rather than trusting the default domain of a fork; on company Macs under a configuration profile, the administrator's profile wins.

# LINUX

Managed policy files are JSON in a directory the browser reads at start; this route needs root. There is no per-user forcelist directory for Chrome on Linux.

```
sudo mkdir -p /etc/opt/chrome/policies/managed
sudo cp docs/store/opera-agent-managed.json /etc/opt/chrome/policies/managed/opera-agent.json
# Edge:
sudo mkdir -p /etc/opt/microsoft/edge/policies/managed
sudo cp docs/store/opera-agent-managed.json /etc/opt/microsoft/edge/policies/managed/opera-agent.json
```

The file carries `ExtensionInstallForcelist` with the same `id;update-url` entry. Restart the browser; verify at `chrome://policy`. Brave's policy directory varies by distribution (`/etc/brave/policies/managed` on most); verify with `brave://policy` rather than guessing.

Removal: `sudo rm /etc/opt/chrome/policies/managed/opera-agent.json` (or the Edge equivalent), restart, then remove the extension at `chrome://extensions`.

# WHAT IS TRUE, AND WHAT IS NOT

- One route exists here, and it is the strict one: force install, enforced reinstall, no disable button while the policy stands. The gentle route does not exist in this repository anymore.
- Route choice was the owner's decision on 2026-11-15; the reason is one story to document, one thing to test, one command that cannot half-work.
- Nothing on this page has been driven end to end. The mechanism is documented by the vendors (Chrome "Use alternative installation methods", Microsoft Learn "Alternate distribution options"); this file repeats their instructions, not measurements.
- Neither route works on a machine whose administrator policy forbids external installs - the school profile case. A personal profile, or not at all.
- Updates are re-checked at browser start, not live. A published CRX reaches a machine on its next restart cycle.
- Removing the policy stops the protection, not the extension. The installed copy stays until you remove it in the browser.
