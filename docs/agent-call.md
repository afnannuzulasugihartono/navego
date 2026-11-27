# Calling Navego

One road, one command: `navego local`. Local on the machine where the browser already is.

Install the extension on Windows with the command shown on the [live landing page](https://navego.pages.dev/), unchanged:

```powershell
irm https://navego.pages.dev/install.ps1 | iex
```

The [script source is public](https://github.com/afnannuzulasugihartono/navego/blob/main/site/public/install.ps1). Restart the browser after it runs.

**What it costs:** the browser reports itself as managed by your own user policy, and the extension cannot be removed while that policy value stands. **How to undo it:** delete the policy values the command prints under `HKCU`, or, if the npm package is installed, run `navego uninstall`. Removing the policy stops the forced install; the installed extension copy still has to be removed from the browser's extensions page.

The MCP driver itself needs no global install: the snippets below use `npx -y navego local`. `npm i -g navego` remains the global alternative, and its postinstall hook runs the Windows install automatically.

## The first real file

With the MCP client connected, paste this one line into the agent:

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

## The installer and the driver

`navego` is one command with one road: stdio on this machine,
driving the everyday browser through the loopback bridge — no cloud round trip
per command.

Point a client at it (OpenCode reads `.mcp.servers` in `~/.config/opencode/opencode.json`; Kilo Code reads the same shape under `mcpServers` in its settings JSON):

```json
{
  "mcp": {
    "servers": {
      "navego": {
        "type": "local",
        "command": "navego",
        "args": ["local"],
        "timeout": { "startup": 60000, "catalog": 60000, "execution": 600000 }
      }
    }
  }
}
```

| variable | default | meaning |
|---|---|---|
| `NAVEGO_BRIDGE_PORT` | `9451` | the loopback port the extension dials into |
| `NAVEGO_HOME` | `~/.navego` | where the paired device file lives |
| `NAVEGO_MCP_CONFIG_HOME` | platform config dir | where the OAuth token lives |
| `NAVEGO_MCP_TOKEN` | unset | a static token wins over the OAuth login |

### The meter, and what refuses you

The local drive is metered where it happens: the loopback bridge asks the
cloud once per session (`session_open`, with the device credentials the
extension's hello carries), counts locally, and refuses the session when the
cloud cannot be reached. A command past the session allowance answers
`PLAN_LIMIT_REACHED` with the plan named. The usage is reported when the
session ends, so the local road and the pairing account share one daily count —
`plan.usd-1` carries 1.000 commands per day and 50 per session;
`plan.usd-17` carries 17.000 and 500, and `plan.usd-33` carries no daily
limit; every USD plan carries no per-minute cap. The gate lives in the bridge — never in
readable client code. `npx -y navego doctor` prints the bridge, the device,
the extension version, the plan, and the quota.

`browser_status` answers with the port the drive is really on, so read it
first: `port: 9451` means the extension road. When a linked device's daily
quota is spent the device card carries `planExhaustedDevices` with the device
names, so a driver sees it before the next call is refused.

The server advertises 40 tools, named for the resource they touch and the job they do: `browser_*` drives a page or window, `artifact_*` builds a file, `delivery_*` records a client-month, `wallet_*` moves account state. `browser_get_guide()` returns them as tasks rather than a
list, and the full list is in [`local/README.md`](../local/README.md).

### The capture ladder

`browser_read_page` answers with measured text, and everything it says about the page
carries the number it measured, never an assumption: `settled` is true only
when two reads a beat apart agree the text has stopped moving (`settled: null`
means one sample cannot say; `browser_wait_until()` is the companion), and
`grewBy` names how many characters arrived between reads. The read walks a
ladder chosen from what the page measures as: the accessibility tree
first where a canvas covers the viewport, then the DOM, then a selection copy
(only with `allowCaretMove: true`), then a picture. Every step but the
selection copy asks nothing of the page, the answer names which step it used,
and a missing-but-needed step is reported as skipped with the reason. On a
canvas-rendered page the tree is cut at a depth cap, and `surface.truncated`
says so.

### The harness I use myself

`scripts/dev/navego-agent.ts` is the thin client I drive Navego through from an agent harness that has a shell but no Navego tool in its own catalog. `list` and `tabs` are lookups; `open-and-read <url> [text] [file]` opens one tab, waits for a real text, reads it and writes a screenshot in the **same process**, because a tab claim belongs to one driver lease — separate CLI processes collide on the claim. `batch <file.json>` runs a list of commands in one lease. Every write tool takes an explicit `tabId`: no default tab, because the everyday browser carries private tabs.

## The extension road

The extension in `extension/` opens a socket to this machine and carries CDP
both ways, so the everyday browser can be driven without a debugging port. The
socket is one WebSocket on `127.0.0.1:9451`.

1. Install the extension with the Windows command at the top of this guide.
   The archive is also on the site's download page, and `chrome://extensions`
   with developer mode on loads it unpacked.
2. Pair the browser in the dashboard — the meter needs a paired device to name
   the account the session belongs to.
3. Run `npx -y navego doctor`. It prints the bridge, the device, the
   extension version, the plan, and the quota; a `degraded` verdict names the
   one fix that applies.

### The record

`scripts/dev/extension-run.ts` drives a real browser through the extension and
writes what happened:

```bash
node scripts/dev/extension-run.ts
node --test tests/extension/extension-run.test.ts
```

- [`docs/proof/extension-run.md`](../docs/proof/extension-run.md) — the readable record.
- [`docs/proof/extension-run.jsonl`](../docs/proof/extension-run.jsonl) — one line per call.
- [`docs/proof/extension-portal.jpg`](../docs/proof/extension-portal.jpg) — the picture the run took.

The last recorded run carried seven calls over the bridge — `browser_status`,
`browser_open_url`, `browser_read_page`, `browser_find_element`, `browser_download_file`, `browser_screenshot`,
`browser_close_tab` — and the CSV it pulled down hashed equal to the file the portal
served. `tests/extension/extension-run.test.ts` re-hashes that fixture and compares it
with the hash in the record; it does not drive a browser again.

## Reply-ready lines

These are the two lines a buyer can act on without reading the repository:

```text
irm https://navego.pages.dev/install.ps1 | iex
Open https://navego.pages.dev/docs and download the "Laporan keuangan September 2026" link as laporan-keuangan-2026-09.xlsx into Downloads/navego.
```
