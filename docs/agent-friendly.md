# Agent-friendly setup

How to wire navego into the agents you already use, copy-paste, one snippet per client. Every example is what the installed package supports today — nothing below asks for your password, your browser profile, or a cloud relay.

## What ships, and whether your client sees it

| client | status | tell the agent to call |
|---|---|---|
| OpenCode | ships in this repo — works today | `browser_get_guide` |
| Claude Code | add via `claude mcp add` (below) | `browser_get_guide` |
| Claude Desktop | add via config file (below) | `browser_get_guide` |
| Cursor | add `.cursor/mcp.json` (below) | `browser_get_guide` |
| Windsurf | add `mcp_config.json` (below) | `browser_get_guide` |
| Zed | add `context_servers` (below) | `browser_get_guide` |
| Cherry Studio | add server in settings (below) | `browser_get_guide` |
| any MCP client | same 3 commands | `browser_get_guide` |

Follow the one that matches your client, then run `browser_get_guide` — as the FIRST call. It returns the 44 tools as ready-to-use tasks, which is the right entry point regardless of which client you arrived from.

## One-time machine setup (every client)

```bash
npm i -g navego
navego auth     # sign in once; your token stays on this machine, never committed
navego doctor   # prints bridge, device, plan, quota — verdict yes/no and the one fix
```

## OpenCode

In `opencode.json` (or the TUI's add tool):

```json
{ "mcpServers": { "navego": { "command": "navego", "args": ["local"] } } }
```

Then ask anything that needs your own browser.

## Claude Code

```bash
claude mcp add navego -- npx -y navego local
```

Confirm with `claude mcp list` → `navego: Ready`. Then any task that needs your signed-in browser.

## Claude Desktop

`claude_desktop_config.json` (Settings → Developer → Local config file):

```json
{
  "mcpServers": {
    "navego": { "command": "navego", "args": ["local"] }
  }
}
```

## Cursor

`.cursor/mcp.json` at the project root:

```json
{ "mcpServers": { "navego": { "command": "navego", "args": ["local"] } } }
```

## Windsurf

`mcp_config.json` (Settings → Cascade):

```json
{ "mcpServers": { "navego": { "command": "navego", "args": ["local"] } } }
```

## Zed

`zed/settings.json`:

```jsonc
{
  "context_servers": {
    "navego": {
      "command": "navego",
      "args": ["local"]
    }
  }
}
```

## Cherry Studio

Settings → MCP → Add Server → stdio:

```
name: navego
command: navego
args: local
```

## The static-token path (no OAuth round-trip)

If you do not want the interactive `navego auth` (CI, containers, a machine without a display):

1. Create a device token in the dashboard → copy it once.
2. Set one env var: `OPERA_AGENT_MCP_TOKEN=<token>` — a static token wins over the OAuth login file.
3. `navego doctor` — it reports identity, bridge and quota before any agent asks.

## Rules of thumb that keep sessions sane

- One browser tab, one driver. `browser_tabs_list` → claim, never guess.
- Measure before you act: `browser_read_page` tells you whether `settled` is true, how many chars arrived, and which read path was used.
- Google Sheets / Docs render to canvas — there is no element to read back. Your read path returns pixels/commands; build with `artifact_*` / `delivery_*` instead of trying to write into the canvas.
- `PLAN_LIMIT_REACHED` means the plan is spent; upgrade in the dashboard or fall back to smaller tasks, never `--force`.
- `navego doctor` is the arbiter: `ready` / `degraded` / `blocked` and the one fix that applies.
