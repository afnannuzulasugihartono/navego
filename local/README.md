# Navego

Drive your own browser from an MCP client, with no dependencies. One command:

```bash
npm i -g navego
```

| mode | what drives | what it needs |
|---|---|---|
| `navego local` | the everyday profile on this machine, over the loopback bridge | Node 20+, the extension, a paired device |
| `navego cloud` | the paired device's browser, through the hosted server | an account, an OAuth login, a paired device |
| `navego auth` | sign in once, keep the token beside this install | a browser, or `NAVEGO_MCP_TOKEN` |
| `navego doctor` | print what is connected and what the plan allows | nothing but this install |
| `navego failures` | print what broke on this machine: counts by tool and code, plus the agent's feedback notes | nothing but this install |
| `navego feedback` | record what the agent saw while driving — `navego feedback <tool> <note>` | nothing but this install |
| `navego economy` | read the money ledger, score decisions, keep the knowledge library, and ask whether a spend keeps the reserve | the repository, or `~/.navego/economy` |

`npx -y navego` is the published form of the package.

## Why this exists

The same action measured two ways on one machine:

| | round trip |
|---|---|
| through a cloud MCP function | ~380 ms |
| through this driver | under 1 ms |

It exists because Google Docs, Sheets and Slides all render to canvas. There is no
element to write to and no text to read back, so every action has to go through
browser-level input — and every action the editor silently ignores looks exactly
like one that worked. The recipes at the bottom are what was learned by driving,
not by reading documentation.

## Requirements

Node 20 or newer, the Navego extension on the everyday browser, and a paired
device for the meter. The bridge — not a debugging port — is the road: Chrome
refuses a debugging port on the Default profile, the extension cannot be driven
from a headless harness, and the everyday window is the one people actually use.

Load the extension from `extension/` (chrome://extensions, developer mode, load
unpacked; it persists in the profile) or install the signed CRX from the
download page. Pair the browser in the dashboard: the meter needs a paired
device to name whose allowance the session spends.

Then:

```bash
navego doctor
```

is the one command to reach for. It prints the bridge, the device, the
extension version, the plan, the quota, and the fix when something is degraded —
`ready` when everything is wired. `NAVEGO_BRIDGE_PORT` (default `9451`) names
the loopback port; `NAVEGO_HOME` names the paired device file's folder.
A dedicated, separate test profile with the extension pre-loaded is
`local\bin\navego-chrome.cmd` — on macOS and Linux the equivalent is one
Chrome invocation with `--load-extension`.

## The meter

The local drive is metered where it happens. At the start of a session the
bridge asks the cloud once (`session_open`, with the device credentials the
hello carries), then enforces the returned allowance locally: one command past
it answers `PLAN_LIMIT_REACHED` with the plan named. When the session ends, the
usage is reported once and folded into the same daily count the hosted surface
reads, so `plan.usd-1` carries 1.000 commands per day and 50 per session, and
`plan.usd-17` carries 17.000 per day and 500 per session, while `plan.usd-33`
carries no daily limit at all. Every USD plan carries no per-minute cap.
Cloud unreachable means the local drive
stops, with the reason named — an unmetered drive is not offered. The gate
lives in the bridge and in the hosted MCP, never in readable client code.

Trust boundary, stated plainly: the loopback socket admits this machine's
processes (any of them) as well as the extension — the CRX signature is the
only identity the origin check conveys, and local automation was always
possible on a local machine. What the meter bounds is the account's spend,
not who drives.

## Tools

The server advertises 40 tools, named for what they do and grouped by what they touch:

`browser_status`, `browser_focus_tab`, `browser_select_browser`,
`browser_list_tabs`, `browser_open_url`, `browser_close_tab`, `browser_read_page`,
`browser_search_web`, `browser_find_element`, `browser_click`,
`browser_hover`, `browser_press_key`, `browser_type_text`, `browser_scroll`,
`browser_run_steps`, `browser_wait_until`, `browser_upload_file`, `browser_drop_file`,
`browser_intercept_picker`, `browser_download_file`, `browser_list_menu`, `browser_walk_menu`,
`browser_get_guide`, `browser_screenshot`, `browser_read_dialog`, `browser_type_into_dialog`,
`browser_press_dialog_button`, `browser_check_gate`, `browser_login`, `browser_solve_captcha`.

`delivery_plan`, `delivery_record`.

`artifact_build`.

`wallet_pair_device`, `wallet_get_balance`, `wallet_get_price`, `wallet_add_funds`,
`wallet_hold_price`, `wallet_charge`, `wallet_refund`.

`browser_status` names the paired browsers and `browser_select_browser` pins tab-less calls
(`browser_open_url` is the one that matters) to one of them until another switch says
otherwise; pass a slot number, a device name, or `any` to follow the first ready
browser again. Tab-scoped calls keep routing by their tab id either way.

`browser_run_steps` runs 1-8 dependent steps on one tab in a single call and reads the page
once at the end; the first failure stops the burst and keeps the steps that finished.
`browser_open_url` always opens its own tab, so a drive never navigates a page someone is
already reading. `browser_screenshot` is clipped to the viewport at one pixel per
clickable coordinate, so a coordinate read off a screenshot can be clicked as-is.
Actions answer with where the page stands and the rows that changed; `browser_find_element`
is the deliberate look at every row for a role.

Every answer is one flat document: `{ ok: true, ...facts }`, with the cost of the
call under `elapsedMs`. A refused tool answers the same way - `{ ok: false, error:
{ code, message } }` - with the next move in the message, so the local road reads
exactly like the hosted one.

`browser_download_file` writes a file to the folder the caller names and proves it by the file on
disk — a `.crdownload` is not a result, and two files landing at once is not a
result either: the newest of an ambiguous pair is somebody else's download, so the
answer names both and moves neither. Over the extension the browser's own folder is
watched instead of an armed one, because `chrome.debugger` refuses browser-level
commands there. The last two tools are the statement job: a
card that names the file before the drive, and a delivery that verifies it and adds the
client-month to a manifest. See the statement job in the price list migration under `hosted/migrations/`.

## The economy loop

`navego economy` is the money side of the agent: an append-only ledger, a knowledge library, and the rule that decides whether money may be spent.

```bash
navego economy status --days=30 --currency=USD
navego economy record --kind=revenue --amount=500000 --currency=IDR --decision=delivery-cv-melati --source=https://navego.pages.dev/harga
navego economy note --id=pricing-2026-11 --title="AI prices" --kind=pricing --source=https://www.anthropic.com/pricing --observed=2026-11-24 --body="Claude Pro is $20 a month"
navego economy knowledge
navego economy spend --amount=200000 --currency=IDR
navego economy subscription --current=free --currency=USD --capability=50 --capacity=50 --option='[{"id":"pro","label":"Pro $20","monthlyMinor":2000,"currency":"USD","capabilityScore":90,"capacityUnits":100,"source":"https://www.anthropic.com/pricing"}]'
```

The rules are plain. Cash is the sum of the events. A decision that brought money scores **+10**; a decision that brought none scores **−1**. Money may be spent only out of revenue that arrived, and only while half the cash stays in reserve. An upgrade needs a source for its price and a source for its capability.

The command decides and records. It never buys anything: a payment stays with the owner until the owner authorizes it. The records live in `docs/economy/` beside the code, or in `~/.navego/economy` on a machine with no repository.

## When a tool breaks

`navego failures` reads the append-only log the local road leaves behind: every tool
call that came back as an error lands in `$NAVEGO_AGENT_HOME/tool-failures.jsonl`
(default `~/.navego/tool-failures.jsonl`) with the tool, the code, the message
and the time it happened — the failure the tool answer cannot carry into the next
session now survives on the machine. `navego feedback <tool> <note>` appends what the
agent observed while driving, so the drive can leave a suggestion behind instead of
a shrug. The log stays local; nothing is sent anywhere, and deleting the file is
always safe — it is an observation channel, not a ledger. Read it any time:

```bash
navego failures            # counts by tool and code, plus every note
navego failures --tool=browser_read_page
navego failures --json     # for scripts
navego feedback browser_read_page "canvas editors block every docs drive"
```

## Recipes, measured

These are the rules that the three Google editors actually honour. Each one returns
success while doing nothing if you get it wrong, so there is no error to notice.

**Paragraph breaks are newlines inside the text, never a dispatched Enter.** The
editor ignores the key event entirely and merges every paragraph into one.

**Structure is applied before content.** A style applied to a paragraph that
already holds its text does not take; the same chord applied to an empty paragraph
does, and the heading appears in the outline.

**The first key event after a write is swallowed.** Send one harmless key before
the real one, or the real one is the one that disappears.

**A cell ignores inserted text until a character key opens it**, and the opening
character joins the value. Press a letter, press Backspace, then insert.

**Clearing removes text but not formatting.** The next paragraph inherits the old
bullets. Clear, toggle once, then write.

**A submenu opens on hover.** Move the pointer and settle there; a press closes the
menu instead.

## Licence

MIT
