# Installing Opera with an agent

This file is for AI agents that install Opera on behalf of a person. If you are the person reading this in a terminal: `npm i -g opera-agent`, then `opera doctor --json` to see where you stand.

## What Opera is

Opera is an MCP server (`opera` on npm) plus a Manifest V3 browser extension running inside the person's own signed-in browser. It reads pages, fills forms, clicks, and saves real files. Pages never go to a cloud session; credentials never leave the browser. It is not a hosted proxy, and it does not use per-site gadgets.

## Requirements

- Node.js 22 or newer
- A Chromium-family browser (Chrome, Edge, Opera), signed into the person's own account
- Windows, macOS, or Linux
- No API keys for local browser control. `opera auth` (a one-time sign-in) is only needed for the cloud meter and the hosted tools.

## Install

```bash
npm i -g opera-agent
opera doctor --json
```

`opera doctor --json` prints one object:

```json
{
  "ready": false,
  "port": 9451,
  "deviceFile": null,
  "cloudLogin": "none",
  "bridge": { "ok": false, "devices": [], "linked": false, "refusal": null, "preferredSlot": null },
  "problems": ["start the everyday browser with the Opera extension installed"],
  "crxUrl": "https://…/download/opera.crx"
}
```

- `ready: true` and exit code 0 means the driver sees a browser that carries the extension and the meter accepts the session. Done.
- `ready: false` and exit code 1: read `problems[]` and do exactly that one thing, then re-run. `problems[0]` is always the single blocking fix.

## Attaching the extension

The extension is an MV3 build. Ways to attach it, in order of preference:

1. `opera install` — registers the extension with policy on Chromium browsers on this Windows machine (managed install, no Web Store).
2. Web Store install — pending Chrome Web Store publication; until then, install the CRX from the release (`crxUrl` in the doctor output, or the repository's release page) into the browser's extensions page.
3. Developer load — for tinkering only: build from source with `npm run build:extension` and load `extension/` as an unpacked extension.

## Verifying in an MCP client

Point the client's MCP config at the package, for example:

```json
{ "mcpServers": { "opera": { "command": "npx", "args": ["-y", "opera"] } } }
```

Then call `browser_get_guide` first; every other tool answers faster and safer with it. Ask for `browser_list_tabs` to see whether the extension and bridge agree with each other.

## Uninstall

```bash
opera uninstall
```

Removes the policy keys, the Opera folder, and the npm package. It prints everything it cannot remove instead of failing silently.

## Ground rules for agents

- Claim a tab before driving it; never touch `chrome://`, password fields, or payment dialogs.
- Read before acting: snapshot the page, then click or type.
- `PLAN_LIMIT_REACHED` means stop and tell the person, not retry.
