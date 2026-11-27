# @last-edited: 2026-11-27 UTC+7.
# @title: external install - the extension installs and stays, without the Chrome Web Store, on Windows, macOS and Linux.
# @state: the Windows command below was checked against the live landing page on 2026-11-27, and the first-win download was driven in the everyday Chrome through the extension. The macOS and Linux policy writes, and a fresh-profile install on every platform, have not been driven end to end on a machine.
# @dependencies: `docs/store/extension-forceinstall.reg`, `docs/store/extension-forceinstall-remove.reg`, `docs/store/navego-managed.json`, `docs/install.md`, `docs/agent-call.md`, `docs/proof/2026-11-27-onboarding-guide.md`.

# WHAT THIS IS

One route, one story: the extension is **force-installed by policy** and cannot be disabled while the policy stands. It rides the same signed CRX behind one URL:

`https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/navego-update/update.xml?id=ofgemipoobcnbjkfanmofjbdonjapmgl`

There is no second, gentler path in this repository. The classic external-key route was retired on 2026-11-15 by the owner's decision; the artifacts live in git history, not in the tree.

Updates ride the same URL: every browser start, the browser re-reads `update.xml`, and a newly published build arrives without anyone asking. **No path on this page involves choosing a folder** - the folder flow is the developer-mode fallback in `docs/install.md`.

# BEFORE YOU START

Check the update URL answers and carries the version the tree now reads (measured 2026-11-15):

```
curl -I "https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/navego-update/update.xml?id=ofgemipoobcnbjkfanmofjbdonjapmgl"
```

If it does not answer `200` with an `X-Opera-Version` header, nothing on this page will produce an extension.

# WINDOWS

The fastest Windows route is the command shown on the [live landing page](https://navego.pages.dev/), unchanged:

```powershell
irm https://navego.pages.dev/install.ps1 | iex
```

The [script source is public](https://github.com/afnannuzulasugihartono/navego/blob/main/site/public/install.ps1). It writes one per-user policy value for each Chromium browser it finds; restart the browser afterwards.

**What it costs:** the browser reports itself as managed by your own user policy, and the extension cannot be removed while that policy value stands. **How to undo it:** delete the policy values the command prints under `HKCU`, or, if the npm package is installed, run `navego uninstall`. Removing the policy stops the forced install; the installed extension copy still has to be removed from the browser's extensions page.

The same policy can be written from the repository file instead. **Force install, no admin, per user** - double-click `docs/store/extension-forceinstall.reg`, or:

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
U="ofgemipoobcnbjkfanmofjbdonjapmgl;https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/navego-update/update.xml?id=ofgemipoobcnbjkfanmofjbdonjapmgl"
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
sudo cp docs/store/navego-managed.json /etc/opt/chrome/policies/managed/navego.json
# Edge:
sudo mkdir -p /etc/opt/microsoft/edge/policies/managed
sudo cp docs/store/navego-managed.json /etc/opt/microsoft/edge/policies/managed/navego.json
```

The file carries `ExtensionInstallForcelist` with the same `id;update-url` entry. Restart the browser; verify at `chrome://policy`. Brave's policy directory varies by distribution (`/etc/brave/policies/managed` on most); verify with `brave://policy` rather than guessing.

Removal: `sudo rm /etc/opt/chrome/policies/managed/navego.json` (or the Edge equivalent), restart, then remove the extension at `chrome://extensions`.

# THE FIRST WIN AFTER INSTALL

Connect an MCP client to the local server with `npx -y navego local` (the exact client configuration is in [`docs/agent-call.md`](./agent-call.md)), then paste this one line into the agent:

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

That exact path was driven in the everyday Chrome through the extension on 2026-11-27, and the workbook's SHA-256 was `a4f12765b77329eb5ec37dae3ad4323ac1d1d6659cd6261bb689c2736c931922`, equal to the workbook the live site serves. The record is [`docs/proof/2026-11-27-onboarding-guide.md`](./proof/2026-11-27-onboarding-guide.md).

# WHAT IS TRUE, AND WHAT IS NOT

- One route exists here, and it is the strict one: force install, enforced reinstall, no disable button while the policy stands. The gentle route does not exist in this repository anymore.
- Route choice was the owner's decision on 2026-11-15; the reason is one story to document, one thing to test, one command that cannot half-work.
- The policy-install path on macOS and Linux, and a fresh-profile install on every platform, has not been driven end to end. The first-win download above was driven in the everyday Chrome through the extension. The policy mechanism itself is documented by the vendors (Chrome "Use alternative installation methods", Microsoft Learn "Alternate distribution options"); this file repeats their instructions, not measurements.
- Neither route works on a machine whose administrator policy forbids external installs - the school profile case. A personal profile, or not at all.
- Updates are re-checked at browser start, not live. A published CRX reaches a machine on its next restart cycle.
- Removing the policy stops the protection, not the extension. The installed copy stays until you remove it in the browser.
