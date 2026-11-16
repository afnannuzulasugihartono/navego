@last-edited: 2026-10-23 UTC+7.
@related: [`AGENTS.md`](../AGENTS.md) - [`../ARCHITECTURE.md`](../ARCHITECTURE.md) - [`api.md`](api.md) - [`product/browser-latency.md`](product/browser-latency.md)

# Naming

Three name spaces meet in this product, and each one is read by a different machine. The separator a name uses says which space it belongs to, so a name that arrives in a log, a stack trace or a model's tool list can be placed without being told.

The rule in one line: **a dot separates namespaces, an underscore separates words inside the transport and the database, and the MCP tool surface is one bare word per tool.**

## The three spaces

| Space | Shape | Example | Read by |
|---|---|---|---|
| MCP tool name | `one_word` → `oneword` | `status`, `tap`, `wait`, `scan` | the model, and the person reading a tool list |
| Wire method name | `namespace.action` | `tabs.list`, `page.click`, `browser.burst`, `page.wait_for` | the service worker, the bridge and the gateway |
| Postgres function and argument name | `snake_case` | `opera_claim_next_wait`, `p_device_name` | Postgres, and the edge functions that call it |

## Why the MCP tool names are one bare word

The tool name is the product's surface: it is the word a model types and the line a human reads in a tool list. It is one word for two reasons that are both mechanical rather than aesthetic.

**Two spaces need two names, and the tool gets the short one.** The dot is the namespace separator of the wire protocol underneath, where `page.click` and `tabs.list` name the method a tool ends up calling. A tool named `page.click` would be the transport wearing the product's name, and one line in a log would not say which layer had answered. The tool is the job (`tap`); the wire method is the mechanics (`page.click`).

**The model reads the word, not the schema.** An agent picks a tool by the word in its name and the line of description beside it. A multi-word name (`click_row`) gives the model two chances to mis-remember the tool — is it `click_row` or `click_row_by_name`? One word (`tap`) leaves nothing to guess, and the tool family reads as a human scans the list: `status`, `tabs`, `read`, `find`, `tap`, `type`, `shot`, `wait`.

An underscore survives JavaScript, TypeScript and SQL unquoted, so the wire protocol and Postgres keep it; the tool surface keeps nothing — one bare word, no separators at all.

The same reasoning is why the wire protocol uses an underscore *inside* a name as well: `page.wait_for`, not `page.waitfor` and not `page.wait-for`.

## Where each shape lives

The wire contract is one file, `extension/lib/protocol.ts`, and it is the source both the service worker and the Node tests read:

- `METHOD_SPECS` holds the dotted methods: `browser.ping`, `browser.burst`, `tabs.list`, `tabs.open`, `tabs.navigate`, `page.read`, `page.click`, `page.key`, `page.wait_for`.
- `BURST_ACTION_METHODS` maps a burst step's short verb to the dotted method it runs: `read` to `page.read`, `wait` to `page.wait_for`, `navigate` to `tabs.navigate`.

The tool surface is data, in one place:

- `local/tools.ts` — the local stdio server's tools; the only MCP surface in this tree.

The Postgres names are in the migrations, and the edge functions refuse anything that is not a bare identifier before it reaches the database: `hosted/functions/opera-agent-bridge/index.ts` rejects a function or argument name that fails `^[a-z_][a-z0-9_]*$`.

## What enforces it

The shapes are pinned by tests, so a name in the wrong shape fails a gate rather than reaching a user:

- `tests/docs/readme.test.mjs` reads the local tool names out of `local/tools.ts` and counts them against the number the README claims.
- `tests/extension/ax-observation.test.mjs` matches the local tools against the accessible-name allowlist the runtime answers.
- `docs/api.md` documents the gateway's `method` parameter and the pattern it must match, and `tests/docs/api-docs.test.mjs` fails when that document stops covering the routed paths.

## Adding a name

A new name belongs to exactly one of the three spaces, and the shape follows from the space rather than from taste.

A tool is named for the job the caller asks for, never for the method it sends: the surface calls it `tap`, and the mechanics (the CDP click, the burst, the settle) stay underneath with no wire method of their own, because it drives the browser over CDP directly. The hosted cloud surface, which once sent wire methods, is gone — a tool name belongs to this tree's job, and the wire method space is the extension's.

A new wire method is added to `METHOD_SPECS` in `extension/lib/protocol.ts` and nowhere else. That file is the one the service worker, the MCP server and the Node tests all read, which is why a second copy of the list has never been allowed to exist.

A new wire method is added to `METHOD_SPECS` in `extension/lib/protocol.ts` and nowhere else. That file is the one the service worker, the MCP server and the Node tests all read, which is why a second copy of the list has never been allowed to exist.
