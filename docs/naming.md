@last-edited: 2026-11-16 UTC+7.
@related: [`AGENTS.md`](../AGENTS.md) - [`../ARCHITECTURE.md`](../ARCHITECTURE.md) - [`api.md`](api.md) - [`product/browser-latency.md`](product/browser-latency.md)

# Naming

Three name spaces meet in this product, and each one is read by a different machine. The separator a name uses says which space it belongs to, so a name that arrives in a log, a stack trace or a model's tool list can be placed without being told.

The rule in one line: **a dot separates namespaces, an underscore separates words inside the transport and the database, and every MCP tool name is a family prefix plus an explicit `verb_noun` for the job.**

## The three spaces

| Space | Shape | Example | Read by |
|---|---|---|---|
| MCP tool name | family prefix + `verb_noun` | `browser_find_element`, `artifact_build`, `wallet_get_price` | the model, and the person reading a tool list |
| Wire method name | `namespace.action` | `tabs.list`, `page.click`, `browser.burst`, `page.wait_for` | the service worker, the bridge and the gateway |
| Postgres function and argument name | `snake_case` | `opera_claim_next_wait`, `p_device_name` | Postgres, and the edge functions that call it |

## Why the family prefix is part of the name

The tool name is the product's surface: it is the word a model types and the line a human reads in a tool list. The prefix is not decoration — it must name the resource the tool actually touches.

**MCP clients show every server's tools in one flat list, and the list is the collision.** OpenCode ships a built-in `browser` MCP whose tools share this surface's first word; a tool called `read` is indistinguishable from another server's `read`. A fixed family prefix makes collisions impossible. Four families are used because thirteen of these tools never touch a tab: `browser_*` drives a page or window, `artifact_*` builds a file on disk, `delivery_*` plans or records a client-month, `wallet_*` moves money or account state. A `browser_` prefix on `wallet_charge` would be a false promise to an agent choosing by name.

The `verb_noun` half follows the same "the model reads the word, not the schema" rule the one-word law was built on: the remainder names the job, not the mechanics — `browser_find_element` finds, `browser_download_file` downloads, `browser_deliver`-shaped jobs never leak their method (`delivery_record` for the manifest write, not `browser_mark_manifest`). Names are lower snake, `[a-z0-9_]` only, because MCP tool names may only be `[a-zA-Z0-9_-]` — no dots, no hyphens: a dot already means the wire namespace one layer down.

An underscore survives JavaScript, TypeScript and SQL unquoted, so the wire protocol, Postgres and the tool surface all keep it. A mode is either a parameter named on the tool that has it, or a name of its own - `browser_find_element` carries its `mode` argument for the two ways to locate (rows by role, text by string); `browser_list_menu` and `browser_walk_menu` stay separate, and so do the three OS-dialog roads. The name says the shape of the answer.

## The surface

`local/tools.ts` — the local stdio server's tools; the only MCP surface in this tree. The forty tools, in four families (per `local/README.md`):

- Driving: `browser_status`, `browser_read_dialog`, `browser_select_browser`, `browser_list_tabs`, `browser_open_url`, `browser_close_tab`
- Reading: `browser_read_page`, `browser_search_web`, `browser_find_element`, `browser_screenshot`
- Acting: `browser_click`, `browser_hover`, `browser_press_key`, `browser_type_text`, `browser_scroll`, `browser_run_steps`, `browser_wait_until`
- Files: `browser_upload_file`, `browser_drop_file`, `browser_intercept_picker`, `browser_download_file`, `browser_list_menu`, `browser_get_guide`
- Delivering: `delivery_plan`, `delivery_record`, `artifact_build`, `browser_check_gate`, `browser_login`, `browser_solve_captcha`, `wallet_pair_device`, `wallet_get_balance`, `wallet_get_price`, `wallet_add_funds`, `wallet_hold_price`, `wallet_charge`, `wallet_refund`

## The same reasoning is why the wire protocol uses an underscore *inside* a name

`page.wait_for`, not `page.waitfor` and not `page.wait-for`.

## Where each shape lives

The wire contract is one file, `extension/lib/protocol.ts`, and it is the source both the service worker and the Node tests read:

- `METHOD_SPECS` holds the dotted methods: `browser.ping`, `browser.burst`, `tabs.list`, `tabs.open`, `tabs.navigate`, `page.read`, `page.click`, `page.key`, `page.wait_for`.
- `BURST_ACTION_METHODS` maps a burst step's short verb to the dotted method it runs: `read` to `page.read`, `wait` to `page.wait_for`, `navigate` to `tabs.navigate`.

The Postgres names are in the migrations, and the edge functions refuse anything that is not a bare identifier before it reaches the database: `hosted/functions/navego-bridge/index.ts` rejects a function or argument name that fails `^[a-z_][a-z0-9_]*$`.

## What enforces it

The shapes are pinned by tests, so a name in the wrong shape fails a gate rather than reaching a user:

- `tests/docs/readme.test.ts` reads the local tool names out of `local/tools.ts` and counts them against the number the README claims.
- `tests/extension/ax-observation.test.ts` matches the local tools against the accessible-name allowlist the runtime answers.
- `docs/api.md` documents the gateway's `method` parameter and the pattern it must match, and `tests/docs/api-docs.test.ts` fails when that document stops covering the routed paths.

## Adding a name

A new name belongs to exactly one of the three spaces, and the shape follows from the space rather than from taste.

A tool is named for the job the caller asks for, never for the method it sends. A tool is `browser_` plus the job: `browser_get_guide` reads the guide, never `browser_docs`; a job that spans steps still gets one name. The mechanics (the CDP click, the burst, the settle) stay underneath with no wire method of their own, because it drives the browser over CDP directly. The hosted cloud surface, which once sent wire methods, is gone — a tool name belongs to this tree's job, and the wire method space is the extension's.

A new wire method is added to `METHOD_SPECS` in `extension/lib/protocol.ts` and nowhere else. That file is the one the service worker, the MCP server and the Node tests all read, which is why a second copy of the list has never been allowed to exist.`local/tools.ts` - the local stdio server's tools; the only MCP surface in this tree. The forty tools, in four families (per `local/README.md`):

- Browser (30): `browser_status`, `browser_focus_tab`, `browser_select_browser`, `browser_list_tabs`, `browser_open_url`, `browser_close_tab`, `browser_read_page`, `browser_search_web`, `browser_find_element`, `browser_click`, `browser_hover`, `browser_press_key`, `browser_type_text`, `browser_scroll`, `browser_run_steps`, `browser_wait_until`, `browser_upload_file`, `browser_drop_file`, `browser_intercept_picker`, `browser_download_file`, `browser_list_menu`, `browser_walk_menu`, `browser_get_guide`, `browser_screenshot`, `browser_read_dialog`, `browser_type_into_dialog`, `browser_press_dialog_button`, `browser_check_gate`, `browser_login`, `browser_solve_captcha`
- Delivery (2): `delivery_plan`, `delivery_record`
- Artifact (1): `artifact_build`
- Wallet (7): `wallet_pair_device`, `wallet_get_balance`, `wallet_get_price`, `wallet_add_funds`, `wallet_hold_price`, `wallet_charge`, `wallet_refund`

## The same reasoning is why the wire protocol uses an underscore *inside* a name

`page.wait_for`, not `page.waitfor` and not `page.wait-for`.

## Where each shape lives

The wire contract is one file, `extension/lib/protocol.ts`, and it is the source both the service worker and the Node tests read:

- `METHOD_SPECS` holds the dotted methods: `browser.ping`, `browser.burst`, `tabs.list`, `tabs.open`, `tabs.navigate`, `page.read`, `page.click`, `page.key`, `page.wait_for`.
- `BURST_ACTION_METHODS` maps a burst step's short verb to the dotted method it runs: `read` to `page.read`, `wait` to `page.wait_for`, `navigate` to `tabs.navigate`.

The Postgres names are in the migrations, and the edge functions refuse anything that is not a bare identifier before it reaches the database: `hosted/functions/navego-bridge/index.ts` rejects a function or argument name that fails `^[a-z_][a-z0-9_]*$`.

## What enforces it

The shapes are pinned by tests, so a name in the wrong shape fails a gate rather than reaching a user:

- `tests/docs/readme.test.ts` reads the local tool names out of `local/tools.ts` and counts them against the number the README claims.
- `tests/extension/ax-observation.test.ts` matches the local tools against the accessible-name allowlist the runtime answers.
- `docs/api.md` documents the gateway's `method` parameter and the pattern it must match, and `tests/docs/api-docs.test.ts` fails when that document stops covering the routed paths.

## Adding a name

A new name belongs to exactly one of the three spaces, and the shape follows from the space rather than from taste.

A tool is named for the job the caller asks for, never for the method it sends. A tool is `browser_` plus the job: `browser_get_guide` reads the guide, never `browser_docs`; a job that spans steps still gets one name. The mechanics (the CDP click, the burst, the settle) stay underneath with no wire method of their own, because it drives the browser over CDP directly. The hosted cloud surface, which once sent wire methods, is gone — a tool name belongs to this tree's job, and the wire method space is the extension's.

A new wire method is added to `METHOD_SPECS` in `extension/lib/protocol.ts` and nowhere else. That file is the one the service worker, the MCP server and the Node tests all read, which is why a second copy of the list has never been allowed to exist.
