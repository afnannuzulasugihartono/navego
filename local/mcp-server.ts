// @last-edited: 2026-10-25 UTC+7.
// @title: mcp-server — the stdio MCP surface over the local driver.
// @state: 8 locks; the handshake, the advertised tools, and every way a call can fail without killing the server.
// @dependencies: ./statements.js, ./reports.js, ./documents.js, ./burst.js, ./tools.js, ./advice.js.

// THIS FILE EXISTS

// The driver runs in a process with no stdio contract, so nothing that speaks MCP can use it.
// This is that contract, and it is the whole difference between a driver that works on the machine it was written on and one that anyone can run with npx.

// there are no dependencies.
// The repository runs on stock Node with an empty dependency list, and a driver meant for other people's machines is the worst place to introduce an install step that can fail on someone else's network.
// MCP over stdio is newline-delimited JSON-RPC, which Node can do unaided.

// handle() is a plain function.
// A server that only exists as a process cannot be tested without spawning one, and a test that spawns a real browser fails on whoever else's machine runs it.
// So the protocol lives in a function that takes a request and returns a response, and the stdio wrapper below it stays thin enough to be obvious by reading.

// closing goes through the fallback driver.
// Routing close by its tab id would open a websocket to the tab being closed just to tear it down, and fail on a tab already half-dead.
// The fallback closes by id with no session at all, and both caches still drop what they hold for it.

const PROTOCOL_VERSION = '2024-11-05';

// THE STATEMENT JOB IS IMPORTED HERE AND NOT ROUTED THROUGH A DRIVER.
// A card and a manifest are disk work: they open no tab, read no page and need no browser to be running.
// Asking a driver for them would mean a statement job fails on a machine where the browser is closed, which is exactly when a bookkeeper wants to see what was delivered last month.
// For the same reason the statement, report and document calls answer before a tab is resolved inside run(): opening a session would touch a browser the job does not need.

import { randomUUID } from 'node:crypto';
import { statementCard, statementDelivered } from './statements.js';
import { reportFromFile } from './reports.js';
import { spreadsheetFromFile } from './spreadsheets.js';
import { deckFromFile } from './decks.js';
import { documentFromFile, documentDocxFromFile } from './documents.js';
import { detectGate, waitForGateClear, loginWithCredentials } from './gates.js';
import { captchaAllowed, solverSettings, solveImageCaptcha } from './captcha-solver.js';
import { BURST_INPUT_ACTIONS, normalizeBurst, runLocalBurst } from './burst.js';
import { resolveBridgeToken } from './bridge-token.js';
import { leaseTab, releaseTab, preferBridgeDevice } from './bridge.js';

// THE SAME TIDY FUNCTION THE HOSTED SURFACE USES, AND WHY IT RIDES THE PACKAGE.
// The rejections that keep a model from wasting tokens on envelopes, transport keys and duplicated chain fields apply to the local stdio surface too - a rule that lives in one place stays consistent and changes for one reason.
// The copy is written at pack time (scripts/pack/pack-mcp.ts) because a path outside the package does not exist on the machine that runs the install: reading ../supabase at run time died with ENOENT for every installed user.

import { tidyForAi } from './tidy.js';
import { TOOLS, STRAY_FILE_TAB } from './tools.js';
import { SERP_EXPRESSION } from './page-expressions.js';
import { parseBingSerp } from './bing-serp.js';
import { pairDevice, taskRefund, taskReserve, taskSettle, walletBalance, walletQuote, walletTopUp } from './wallet-client.js';

// The tool table lives in tools.js: the surface is data, and this file is the protocol that answers it.

export { TOOLS };

// THE ASSERTION IS AN OPEN RECORD.
// Every tool branch below reads arguments the tool schema already proved are shaped and typed.
// Narrowing fifty branches to verify the same promise would buy nothing; the documented exemption in types.ts is where that promise lives.

function requireArguments(args: Record<string, unknown> | null | undefined, required: string[]): asserts args is JsonRecord {
  for (const name of required) {
    if (args?.[name] === undefined || args?.[name] === null || args?.[name] === '') {
      throw new Error(`missing argument "${name}" - required by the tool schema`);
    }
  }
}

// A browser that closed mid-call must not take the server with it, because the next tool call is still worth trying.

function asText(value: unknown): { content: Array<{ type: string; text: string }> } {
  return { content: [{ type: 'text', text: JSON.stringify(isObject(value) ? tidyForAi(value) : value) }] };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// A FAILED TOOL ANSWERS THE WAY THE HOSTED WIRE ANSWERS.
// Both roads tell a model the same thing: the call came back and it says what failed.
// A JSON-RPC error reads as a broken protocol, and a client that treats it that way can end the session over a refusal the agent could act on.
// So a tool that failed answers as a tool result that says so: ok false, an error with a code and a message, and the advice for the next move in the same message.

// The caller passes the rows it last saw so a missing-row failure can name the nearest real one.

function toolFailure(error: unknown, context: AdviceContext = {}) {
  const message = withAdvice(error, context);
  const code = typeof (error as { code?: unknown } | null)?.code === 'string' ? String((error as { code: string }).code) : 'MCP_EXECUTION_ERROR';
  const payload = { ok: false, error: { code, message } };
  return {
    content: [{ type: 'text', text: JSON.stringify(tidyForAi(payload)) }],
    isError: true
  };
}

// THE COST RIDES INSIDE THE ANSWER AND NOT IN A BLOCK OF ITS OWN.
// An answer is one document: a cost that sits beside it has to be read as a second document, and the hosted wire carries no such block.
// So the cost is a fact of the answer, under elapsedMs, and both wires read facts the same way.

function withCost(out: unknown, elapsedMs: number): unknown {
  const envelope = isObject(out) ? out : {};
  const blocks = Array.isArray(envelope.content) ? envelope.content : [];
  for (let index = blocks.length - 1; index >= 0; index -= 1) {
    const block = blocks[index];
    if (!isObject(block) || block.type !== 'text') continue;
    let payload: unknown;
    try {
      payload = JSON.parse(String(block.text));
    } catch {
      continue;
    }
    if (!isObject(payload)) continue;
    const content = blocks.slice();
    content[index] = { type: 'text', text: JSON.stringify({ ...payload, elapsedMs }) };
    return { ...envelope, content };
  }
  return out;
}

// A PLAN IS BUILT FIELD BY FIELD.
// The server prices what it is told the job will produce, so an object passed straight through is an object a caller could widen with a price or an owner the server would then read.
// Three named fields are the whole vocabulary of a quote, and a fourth is refused by not being read.

function planFrom(args: JsonRecord): { artifact: string; estSteps: number; items?: number } {
  const plan: { artifact: string; estSteps: number; items?: number } = { artifact: String(args.artifact), estSteps: Number(args.estSteps) };
  if (typeof args.items === 'number') plan.items = args.items;
  return plan;
}

// THE AUTO PAGE IS A STATE LINE AND NOT THE ROWS.
// Measured on a real eight-call job: the actions alone spent 25,089 characters, because sixty rows and the page text rode along after every click, and most of that text was the part that did not move.
// An agent pays for that in tokens and in attention, and re-reads it a turn later.
// So the answer carries where the page is (url, title, how much text it holds, what has focus), how many rows it has, and the rows that changed.
// The rest is one deliberate scan away, which is a look the agent chose to take.

// A WAIT POLLS THE FULL READ.
// The point of waiting is to end on the same evidence an agent would read by hand — including the document on a Google Doc, which the bare page text does not hold.
// A wait that runs out of budget throws nothing: found:false comes back with the page as it stands, which is what the next decision needs.
// Bounds are clamped, not refused, because a wait budget is a safety property and the snapshot limit already set that precedent.

const AUTO_PAGE_LIMIT = 60;
const AUTO_ROWS = 8;

// THE FALLBACK STILL EXISTS.
// Every driver made by this tree has settle(), but a caller can hand the server its own driver, and a snapshot taken before a menu opened is a wrong answer.
// The fallback is the old fixed beat, used only when the driver cannot watch the page; the real path is the Node-polled settle in primitives, which ends after 32ms of quiet instead of always spending 120ms.

const SETTLE_FALLBACK_MS = 120;

// AN ACTION REPORTS THE PAGE IT LEFT BEHIND.
// An agent that has to ask for the page after every action spends two round trips on one decision — act, then look — and the look is the half that costs.
// Measured on the reference implementation: roughly thirty per cent of all tool calls were snapshots, almost all of them immediately after something the agent had just done.
// The reply therefore says where the page is, what changed, and how many rows are still one call away, so a decision costs one call without the answer carrying the whole page.

// ACTIONS REPORT WHAT CHANGED.
// The change set is computed against the last look at the same tab: rows that appeared, rows that moved, and a count of rows that left.
// Rows match by value — role, name and position — so duplicates collapse and a reshaped page reports itself as reshaped instead of listing sixty new rows.
// Only the first eight added or moved rows ride along: they are the ones worth acting on, and the count says what was held back.
// Keyed by driver object in a WeakMap, so a closed tab's last look is garbage instead of a leak.

// THE LOOK SETTLES FIRST.
// The snapshot used to run the instant the action's reply landed — and a menu that opens a frame later was already missed: proven live, the auto-page after clicking Insert held no menu rows while a snapshot a moment later held fifteen.
// The fix used to be 120ms of sleep because no cheaper signal existed.
// The page now watches itself with a MutationObserver, but the clock that reads that watcher lives in Node: a hidden tab clamps a page-side timer to seconds, measured 304ms to 1,009ms on a Google Doc, while a snapshot of the same page took 4ms.
// Node waits 8ms, asks how quiet the page has been, and stops after 32ms of quiet or 120ms total, so a background tab cannot turn the settle into a multi-second stall.
// Settling is still part of seeing, but it is measured instead of assumed.

type AxRow = Record<string, unknown>;
function diffElements(prev: AxRow[], curr: AxRow[]) {
  const key = (r: AxRow): string => `${r.role}|${r.name}|${r.x}|${r.y}`;
  const name = (r: AxRow): string => `${r.role}|${r.name}`;
  const prevExact = new Set(prev.map(key));
  const currExact = new Set(curr.map(key));
  const prevNames = new Set(prev.map(name));
  const currNames = new Set(curr.map(name));
  const addedAll = curr.filter((r) => !prevExact.has(key(r)) && !prevNames.has(name(r)));
  const movedAll = curr.filter((r) => !prevExact.has(key(r)) && prevNames.has(name(r)));
  const removed = prev.filter((r) => !currExact.has(key(r)) && !currNames.has(name(r))).length;
  if (prev.length === 0) return { added: curr.slice(0, 20), moved: [], removed: 0, reshaped: false };
  const total = Math.max(prev.length, curr.length);
  if ((addedAll.length + removed) / total > 0.5) {
    return { added: [], moved: [], removed, reshaped: true };
  }
  return { added: addedAll.slice(0, 20), moved: movedAll.slice(0, 20), removed, reshaped: false };
}

import { withAdvice } from './advice.js';
import { recordFailure } from './tool-failures.js';
import type { AdviceContext } from './advice.js';
import type { Driver, JsonRecord } from './types.js';
import type { SerpResult } from './bing-serp.js';


const lastAuto = new WeakMap<object, AxRow[]>();
const lastPage = new WeakMap<object, JsonRecord>();

// THE WINDOW LINE IS HELD PER DRIVER AND NOT PER CALL.
// afterAction builds the answer and the run that produced it are two different places; a driver is the one thing they share, and a tab's driver is exactly the scope where "what did this action do about the window" is a question with one answer.
// THE ANSWER SAYS SO.
// An action that silently brought the user's window forward would be an action that changed something nobody asked for; an action that silently could not would be one that reports a click nobody received.
// So every input answer carries one line - already in front, or the window it brought, or why it could not - and reading, capturing and asking carry nothing, because they did nothing to where the machine's attention was.

const windowSaid = new WeakMap<object, JsonRecord | null>();

const tabSaid = new WeakMap<object, JsonRecord | null>();

// THE ROWS ARE KEPT ONCE.
// Advice is written against the page as it stood a moment ago, not against one session's private cache: an agent that asked for a row on the tab it is driving is asking about the page it can see.
// Most recent read wins, and a failure before any read at all simply gets no advice about what was there.

let lastSeen: AxRow[] = [];

// A TAB THAT POINTS AT THE DROPPED FILE IS CLOSED.
// Chrome answers a drop no page accepted by doing the default thing: it opens the file.
// Measured live — every rejected drop left a `file://` tab behind, and every accepted drop left none — so a stray tab is also the honest signal that the page took the drop.
// It is closed and named, never hidden: a drop that did not land says so instead of leaving litter on the person's screen.

// THE BUDGETS ARE CLAMPED WHERE THEY ARE.
// A wait that is asked for in milliseconds and a wait that is asked for in hours both have to come back: an agent that asks for a minute and waits ten is not measuring the page, it is measuring its own typing.
// Bounds keep a wait a wait.

const budgetOf = (value: unknown, fallback: number, cap = 30000): number => {
  const asked = Number(value ?? fallback);
  return Number.isFinite(asked) ? Math.min(cap, Math.max(500, asked)) : fallback;
};

const gapOf = (value: unknown, fallback: number, min = 100): number => {
  const asked = Number(value ?? fallback);
  return Number.isFinite(asked) ? Math.min(5000, Math.max(min, asked)) : fallback;
};

const quietOf = (value: unknown, fallback: number): number => {
  const asked = Number(value ?? fallback);
  return Number.isFinite(asked) ? Math.min(5000, Math.max(50, asked)) : fallback;
};



const settleForLook = async (driver: Driver): Promise<void> => {
  if (typeof driver.settle === 'function') {
    const settled = await driver.settle().catch(() => null);
    if (isObject(settled) && settled.why !== 'failed' && settled.why !== 'no answer') return;
  }
  await new Promise<void>((resolve) => { setTimeout(() => resolve(), SETTLE_FALLBACK_MS); });
};

// AN ACTION CAN SAY IT ALREADY SETTLED.
// A wait or a chord-only stream has already watched the page go quiet, so settling again before the snapshot is the same 32ms paid twice.
// The action's own verdict is the evidence; the page look trusts it.

const afterAction = async (driver: Driver, action: unknown, limit?: number): Promise<unknown> => {
  if (!isObject(action) || action.settled !== true) await settleForLook(driver);
  const look = typeof driver.pageLook === 'function'
    ? await driver.pageLook({ limit: limit ?? AUTO_PAGE_LIMIT }).catch(() => null)
    : null;
  const lookRecord = isObject(look) ? look : {};
  const snapshot = driver.snapshot;
  const pageState = driver.pageState;
  const seen = Array.isArray(lookRecord.rows) ? lookRecord.rows as AxRow[] : (snapshot ? await snapshot(limit ?? AUTO_PAGE_LIMIT) as AxRow[] : []);
  const state = isObject(lookRecord.state)
    ? lookRecord.state
    : (pageState ? await pageState().catch(() => null) : null);
  const stateRecord = isObject(state) ? state : null;
  const prev = lastAuto.get(driver) ?? null;
  const prevState = lastPage.get(driver) ?? null;
  lastAuto.set(driver, seen);
  if (stateRecord) lastPage.set(driver, stateRecord);
  lastSeen = seen;
  const tab = tabSaid.get(driver) ?? null;
  const diff = diffElements(prev ?? [], seen);
  // A comparison needs both sides: the first action on a driver has no previous page, so url and textGrow are null rather than a difference against nothing.
  const bothStates = Boolean(prevState && stateRecord);
  return asText({
    action,
    ...(tab ? { tab } : {}),
    window: windowSaid.get(driver)?.window ?? null,
    page: {
      url: stateRecord?.url ?? null,
      title: stateRecord?.title ?? null,
      textChars: stateRecord?.textChars ?? null,
      rows: seen.length,
      focus: stateRecord?.focus ?? null
    },
    changed: {
      added: diff.added.slice(0, AUTO_ROWS),
      moved: diff.moved.slice(0, AUTO_ROWS),
      removed: diff.removed,
      reshaped: diff.reshaped,
      baseline: prev === null,
      url: bothStates && prevState !== null && stateRecord !== null && prevState.url === stateRecord.url ? 'same' : bothStates ? stateRecord?.url ?? null : null,
      textGrew: bothStates && prevState !== null && stateRecord !== null ? Number(stateRecord.textChars) - Number(prevState.textChars) : null
    }
  });
};

// "SOME BROWSER IS IN FRONT" WAS A LIE.
// This machine has Chrome and Brave on it, and the answer said focused true with Brave in front while the drive was on a Chrome tab - an agent that reads that would never learn that the window it is driving is somewhere else entirely.
// So the answer names which browser has the machine, and "focused" means the window in front is one holding a tab of ours.

// THE TITLES ARE THE EVIDENCE.
// Nothing in the bridge says which browser a tab belongs to, but the window in front carries the title of the page in it, and the tabs we drive carry their titles too.
// The one case this cannot tell is two windows showing the same page title, and it answers that with what it knows - the browser in front - rather than a yes it cannot back.

const windowTruth = (window: { platform?: string; foreground?: unknown; windows?: unknown[]; minimized?: unknown[]; why?: string }, browsers: Array<Record<string, unknown>> = [], tabs: Array<Record<string, unknown>> = []) => {
  const foreground = String(window?.foreground ?? '');
  const lower = foreground.toLowerCase();
  const browser = browsers.find((entry) => lower.endsWith(`- ${String(entry.name).toLowerCase()}`))?.name ?? '';
  const ours = foreground !== '' && tabs.some((page) => String(page?.title ?? '').length > 3 && lower.includes(String(page.title).toLowerCase()));
  return {
    focused: ours,
    browser,
    title: ours ? foreground : '',
    why: window?.why || (foreground === ''
      ? 'the machine did not say which window is in front'
      : ours ? '' : `${browser || 'another window'} is in front${browser ? `, and this tab is not in ${browser}` : ''}`)
  };
};

// THE TAB LOOKUP COMPARES TEXTUALLY.
// A Chrome tab id is a number, the tool schema says string, and an agent copies the id straight out of the tab list it was just handed.
// Comparing with === refused the id the product itself printed, which is how a drive that can see six tabs decides none of them is real.
// Ids are compared as text everywhere they cross a boundary.

// THE PORT IS ASKED FOR, NOT STORED.
// The pipe is chosen per call because a worker can wake up late, so a port captured at startup is a lie the moment after it.
// Measured on the user's own machine: the drive was already on the bridge, tabs returned the real tabs, and status still named the debugging port nothing was listening on — the kind of wrong answer that sends someone off to debug a port that was never in the way.

// THE LIST IS HERE AND NOT ON THE MCP SURFACE.
// The caller drives over whichever road the bridge holds; when that road is the loopback bridge, the health answer names the browsers linked to it by name and id.
// A remote road has no local bridge to ask, and the answer says so by carrying no devices field rather than an invented one.

const nextUtcMidnight = (): string => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString();
};

// THE METER RIDES THE SAME READ.
// The bridge already knows each device's plan headroom; a caller that could only learn it after the first refused command would waste the very commands the check exists to protect.

const linkedDevices = async (port: number): Promise<{ devices: Array<Record<string, unknown>>; preferredSlot: number | null } | null> => {
  if (!Number.isInteger(port) || port <= 0) return null;
  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(1000), headers: { 'x-opera-bridge-token': resolveBridgeToken() } });
    if (!response.ok) return null;
    const health = (await response.json()) as { devices?: unknown[]; preferredSlot?: unknown } | null;
    if (!health || !Array.isArray(health.devices)) return null;
    const devices = health.devices.map((value) => {
      const device = isObject(value) ? value : {};
      const meter = isObject(device.meter) ? device.meter : null;
      return { name: device.deviceName ?? null, id: device.id ?? null, instanceId: device.instanceId ?? null, extensionVersion: device.extensionVersion ?? null, slot: device.slot ?? null, port, plan: meter ? { plan: meter.plan ?? null, allowance: Number(meter.allowance) || 0, dailyQuota: Number(meter.dailyQuota) || 0, usedToday: Number(meter.usedToday) || 0, remaining: Number(meter.remaining) || 0, resetsAt: nextUtcMidnight() } : null };
    });
    return { devices, preferredSlot: typeof health.preferredSlot === 'number' && Number.isInteger(health.preferredSlot) ? health.preferredSlot : null };
  } catch {
    return null;
  }
};

const livePort = async (context: { port?: unknown }): Promise<unknown> => (typeof context.port === 'function' ? await context.port() : context.port);

// EVERY ANSWER NAMES THE TAB IT HIT.
// An agent that named a tab rather than numbering it has to be told which tab that turned out to be, because the name it wrote is not an id and the answer is where the id belongs.

// A FAILURE CARRIES THE NEXT MOVE.
// A message that only names the problem sends an agent looking for the problem again, usually while the thing that caused it is closing.
// Measured on this product's own author: every one of these failures had the same two or three next moves, and they were rediscovered every single time.
// The rows the advice reads are the page as it stood a moment ago, so "what was there" is answered with evidence rather than a guess.

// A PAGE WITH NO FILE INPUT IS A FAILURE AND NOT AN ANSWER.
// Measured live on Google Docs: upload returned inputFound: false as a successful tool call, so an agent reading it as "done" moved on with nothing in the document - and the road in, a drop, was nowhere in the answer.
// The page is perfectly reachable; it simply has no input to fill.
// So it fails, names that, and carries the drop with it.

// A NAMED TAB IS NAVIGATED AND NOT OPENED.
// Measured live on this machine: `goto` with a tabId answered "driver.open is not a function", because a per-tab driver has no way to open anything - and a caller who names a tab means "this tab goes here", not "open one more".
// So a named tab is navigated and says which tab it moved.

// THESE TOOLS CHECK THE WINDOW AND THE OTHERS DO NOT.
// A click, a key, text typed, a file dropped and a menu walked all have to reach a page that is listening, and a page behind another window is not listening - measured live, with Google Docs taking the keys and dropping them while every answer said the click was delivered.
// Reading, capturing and asking change nothing about where the machine's attention is, so they do not pay for the check, and a drive that is only looking never steals the human's focus.

// THE WINDOW THAT GETS BROUGHT FORWARD IS THE ONE HOLDING THE TAB.
// With two browser windows open, a check that brings an arbitrary one forward leaves the tab in the same place as before and the answer says it fixed something.
// The tab's own title is the piece that identifies its window, and the call is best-effort: a driver that cannot see windows says so and the action still goes out.

// A TAB MAY BE NAMED AS WELL AS NUMBERED.
// Measured live on this product's own author: an agent that copies an eight-digit id wrong is told "No page target", and the number is the one thing it cannot check - it cannot read a digit back off a screenshot, but it can read a title.
// So a tabId that is not a number is looked for by title or address, and a name that fits two tabs is refused with both of them, because picking one and saying nothing is how a drive ends up typing into the wrong document.

const INPUT_TOOLS = new Set(['browser_click', 'browser_hover', 'browser_type_text', 'browser_press_key', 'browser_upload_file', 'browser_drop_file', 'browser_list_menu', 'browser_walk_menu', 'browser_download_file', 'browser_login', 'browser_solve_captcha']);

// THE OWNER IS A LABEL AND A NUMBER.
// The label is what a refusal reads back to an agent that can go and drive another tab, and the number keeps two agents that share a label from sharing one claim.

const OWNER = `${process.env.NAVEGO_LABEL || 'driver'}-${randomUUID().slice(0, 8)}`;

// THE WINDOW IS TUNABLE AND DEFAULTS TO A MINUTE.
// A minute outlives any single call and still clears an agent that went quiet; a caller whose agents idle for longer can widen it, and one that wants a fast hand-over can narrow it.
// The window is read per call rather than held, so a change takes effect on the next claim without a restart.

const leaseWindow = () => {
  const ttl = Number(process.env.NAVEGO_LEASE_TTL_MS);
  return Number.isFinite(ttl) && ttl > 0 ? ttl : undefined;
};

// The bridge answers its lease calls over HTTP as a JSON record; this adapter names the two fields the server reads.

const bridgeLease: NonNullable<McpContext['lease']> = {
  claim: async (tabId, owner, ttlMs) => {
    const answer = await leaseTab(tabId, owner, ttlMs);
    const holder = isObject(answer.holder) ? answer.holder : null;
    return {
      granted: answer.granted === true,
      holder: holder ? {
        owner: typeof holder.owner === 'string' ? holder.owner : undefined,
        expiresAt: typeof holder.expiresAt === 'number' ? holder.expiresAt : undefined
      } : null
    };
  },
  release: (tabId, owner) => releaseTab(tabId, owner ?? '')
};

export interface McpContext {
  driver?: Driver | null;
  lease?: {
    claim(tabId: unknown, owner: string, ttlMs?: number | undefined): Promise<{ granted?: boolean; holder?: { owner?: string | undefined; expiresAt?: number | undefined } | null }>;
    release(tabId: unknown, owner?: string | undefined): Promise<unknown>;
  };
  port?: unknown;
  resolveTab?: () => Promise<unknown[]>;
  open?: (arg: Record<string, unknown>) => Promise<Driver>;
  sessionOptions?: Record<string, unknown>;
  version?: string | undefined;
  browsers?: Array<Record<string, unknown>>;
}

export function createMcpServer(context: McpContext) {
  const sessions = new Map<unknown, Driver>();
  const fallback = context.driver ?? null;
  const lease = context.lease ?? bridgeLease;

  const driverFor = async (tabId: unknown, { background = false }: { background?: boolean } = {}): Promise<Driver> => {
    if (!tabId) {
      if (!fallback) throw new Error('no driver is attached to this server');
      return fallback;
    }

    // THE CLAIM IS ASKED BEFORE ANYTHING IS OPENED.
    // A tab another agent holds would still take the click, and the answer would land in the wrong document with nothing naming the interference.
    // Asking first turns that into a sentence the second agent can act on: who holds the tab, until when, and which other tabs are free.
    // THE KEY IS THE RESOLVED TAB ID AND NOT THE TEXT THE CALLER TYPED: one agent naming a tab by its title and another naming the same tab by its id are one tab, and a claim keyed by the text let both hold it at once.
    // THE CLAIM IS ASKED EVEN FOR A CACHED SESSION: a cached session is a socket, not a permission.

    const held = await lease.claim(String(tabId), OWNER, leaseWindow());
    if (!held?.granted) {
      const until = new Date(Number(held?.holder?.expiresAt) || 0);
      throw new Error(`tab ${tabId} is driven by ${held?.holder?.owner ?? 'another agent'} until ${until.toISOString()}. Drive another tab, or wait for the claim to lapse.`);
    }

    const known: unknown[] = context.resolveTab ? await context.resolveTab() : [];
    if (known.length && !known.some((id) => String(id) === String(tabId))) {
      throw new Error(`No page target ${tabId}. Open pages: ${known.join(' | ')}`);
    }
    if (!sessions.has(tabId)) {
      if (typeof context.open !== 'function') throw new Error('the injected driver cannot open sessions');
      sessions.set(tabId, await context.open({ ...(context.sessionOptions ?? {}), targetId: tabId, ...(background ? { background: true } : {}) }));
    }
    const opened = sessions.get(tabId);
    if (!opened) throw new Error(`the session for tab ${String(tabId)} was not opened`);
    return opened;
  };

const namedTab = async (wanted: unknown): Promise<JsonRecord | null> => {
  const text = String(wanted ?? '').trim().toLowerCase();
  if (text === '') return null;
  if (!fallback) return null;
  const pages = await fallback.tabs().then((list) => (list as JsonRecord[])).catch(() => [] as JsonRecord[]);
  const hits = pages.filter((page) => String(page.title ?? '').toLowerCase().includes(text)
    || String(page.url ?? '').toLowerCase().includes(text));
  if (hits.length === 1) return hits[0] ?? null;
  if (hits.length > 1) {
    throw new Error(`"${String(wanted)}" is ${hits.length} tabs: ${hits.map((page) => `${String(page.id)} ${String(page.title)}`).join(' | ')}. Name it more closely, or use its id.`);
  }
  return null;
};

const resolvedTab = async (tabId: unknown): Promise<{ id: string; title: string; named: boolean } | null> => {
  if (tabId === undefined || tabId === null || tabId === '') return null;
  const asText_ = String(tabId);
  if (!fallback) return null;
  const pages = await fallback.tabs().then((list) => (list as JsonRecord[])).catch(() => [] as JsonRecord[]);
  const exact = pages.find((page) => String(page.id) === asText_);
  if (exact) return { id: asText_, title: String(exact.title ?? ''), named: false };
  if (/^\d+$/.test(asText_)) return null;
  const hit = await namedTab(asText_);
  return hit ? { id: String(hit.id), title: String(hit.title ?? ''), named: true } : null;
};

// THE WINDOW MATCH HAS TO BE TEXT.
// Measured through this server on this machine: the guard turns the match into text to pick a window off the taskbar, and a promise sent as the match became "[object Promise]", so a minimized browser was never brought back.
// The tab's title is the piece its window carries, and a call that names no tab drives the tab the driver is attached to, whose page knows its own title.

const pageTitle = async (driver: Driver): Promise<string> => {
  const state = await driver.pageState().catch(() => null);
  return String(isObject(state) ? state.title ?? '' : '');
};

const windowMatch = async (tab: JsonRecord | null, driver: Driver): Promise<string> => (tab ? String(tab.title ?? '') : pageTitle(driver));

  const run = async (name: string, args: JsonRecord): Promise<unknown> => {
    requireArguments(args, TOOLS.find((t) => t.name === name)?.inputSchema.required ?? []);

    // The burst is checked before a tab is resolved, so a malformed step list cannot touch a browser, and a caller learns which step was wrong before any page is changed.
    const burst = name === 'browser_run_steps' ? normalizeBurst(args) : null;

    if (name === 'delivery_plan') {
      return asText(statementCard({
        client: args.client,
        portal: args.portal,
        period: args.period,
        url: args.url ?? null,
        root: args.root ?? null,
        ext: args.ext ?? 'pdf'
      }));
    }
    if (name === 'delivery_record') {
      return asText(statementDelivered({
        client: args.client,
        portal: args.portal,
        period: args.period,
        path: args.path,
        balance: args.balance ?? null,
        manifest: args.manifest ?? null,
        replace: args.replace === true
      }));
    }
    if (name === 'artifact_build_report') {
      return asText(reportFromFile({
        source: args.source,
        client: args.client,
        title: args.title,
        period: args.period,
        periodColumn: args.periodColumn ?? null,
        groupBy: args.groupBy,
        valueColumn: args.valueColumn,
        out: args.out ?? null
      }));
    }
    if (name === 'artifact_build_workbook') {
      return asText(spreadsheetFromFile({
        source: args.source,
        client: args.client,
        title: args.title,
        period: args.period,
        periodColumn: args.periodColumn ?? null,
        groupBy: args.groupBy,
        valueColumn: args.valueColumn,
        out: args.out ?? null
      }));
    }
    if (name === 'artifact_build_slides') {
      return asText(deckFromFile({
        source: args.source,
        out: args.out ?? null,
        report: args.report ?? null
      }));
    }
    if (name === 'artifact_build_document') {
      const plan = documentFromFile({
        source: args.source,
        out: null
      });
      const written = documentDocxFromFile({
        source: args.source,
        out: args.out ?? null
      });
      return asText({ ...written, plan: plan.out, planVerified: plan.verified });
    }

    // THESE CALLS NEVER RESOLVE A TAB.
    // A wallet lives on the server, so a wallet call that needed a tab would refuse to answer with the browser closed — which is exactly when a person checks their balance or pays for the last job.
    // The plan is assembled from named fields rather than passed through, so a caller cannot smuggle a price or an owner into the object the server prices.

    if (name === 'wallet_pair_device') {
      return asText(await pairDevice({ code: args.code, deviceName: args.deviceName, version: context.version }));
    }
    if (name === 'wallet_get_balance') return asText(await walletBalance());
    if (name === 'wallet_add_funds') return asText(await walletTopUp());
    if (name === 'wallet_get_price') return asText(await walletQuote(planFrom(args)));
    if (name === 'wallet_hold_price') return asText(await taskReserve(planFrom(args)));
    if (name === 'wallet_charge') {
      return asText(await taskSettle({
        reservationId: args.reservationId,
        artifactHash: args.artifactHash,
        actionsActual: typeof args.actionsActual === 'number' ? args.actionsActual : null
      }));
    }
    if (name === 'wallet_refund') {
      return asText(await taskRefund({ reservationId: args.reservationId, reason: args.reason ?? null }));
    }

    const tab = name === 'browser_close_tab' ? null : await resolvedTab(args?.tabId);
    const driver = await driverFor(name === 'browser_close_tab' ? null : (tab ? tab.id : args?.tabId));
    const wantsFront = INPUT_TOOLS.has(name)
      || (burst?.steps.some((step: JsonRecord) => BURST_INPUT_ACTIONS.includes(step.action)) ?? false);
    const front = wantsFront && typeof driver.ensureFront === 'function'
      ? await driver.ensureFront({ match: await windowMatch(tab, driver) })
      : null;

    // A DEAF PAGE STOPS THE ACTION.
    // Measured live on this machine: two windows can carry one page title, and the window that comes forward may not be the one holding this tab.
    // The guard now confirms the page hears input after a restore; when it does not, sending the keystroke anyway is the silent loss this product exists to remove.
    const frontRecord = isObject(front) ? front : null;
    if (frontRecord?.blocked) {
      throw new Error(`refused: ${String(frontRecord.window)}. Nothing was sent, because input into a window that cannot hear it is lost without a word. Bring the window back with front, or name the tab, then try again.`);
    }
    windowSaid.set(driver, frontRecord);
    tabSaid.set(driver, tab);

    switch (name) {
      case 'browser_status': {
        const window = await driver.windowState();
        const pages = await driver.tabs().then((list) => (list as JsonRecord[])).catch(() => [] as JsonRecord[]);
        const live = Number(await livePort(context));
        const linked = await linkedDevices(live);
        const devices = linked?.devices ?? null;
        const exhausted = devices?.filter((d) => isObject(d.plan) && Number(d.plan.remaining) <= 0).map((d) => d.name);
        return asText({
          browsers: context.browsers,
          port: live,
          ...(devices ? { devices } : {}),
          ...(linked ? { preferredSlot: linked.preferredSlot } : {}),
          ...(exhausted?.length ? { planExhausted: true, planExhaustedDevices: exhausted } : {}),
          window: windowTruth(isObject(window) ? window : {}, context.browsers, pages)
        });
      }
      case 'browser_focus_tab': {
        const tab = await resolvedTab(args.tabId);
        if (!tab) throw new Error(`no tab matching ${args.tabId}`);
        const tabDriver = await driverFor(tab.id);
        const fronted = await tabDriver.front().catch(() => false);
        const win = typeof tabDriver.windowState === 'function'
          ? await tabDriver.windowState().catch(() => null)
          : null;
        const truth = windowTruth(isObject(win) ? win : {}, context.browsers, [tab]);
        return asText({
          tabId: tab.id,
          title: String(tab.title ?? ''),
          fronted: fronted === true,
          focused: truth.focused,
          browser: truth.browser,
          why: truth.why,
          ok: fronted === true
        });
      }
      case 'browser_focus_window':
        return asText(await driver.focusWindow(args.match ?? ''));
      case 'browser_read_dialog':
        return asText(await driver.dialogState());
      case 'browser_type_into_dialog':
        if (!args.text) throw new Error('browser_type_into_dialog needs text');
        return asText(await driver.dialogType(String(args.text)));
      case 'browser_press_dialog_button':
        if (!args.name) throw new Error('browser_press_dialog_button needs name — the button, e.g. Open or Cancel');
        return asText(await driver.dialogPress(String(args.name)));      case 'browser_list_tabs':
        return asText(await driver.tabs());
      case 'browser_select_browser':
        return asText(await preferBridgeDevice(args.device));
      case 'browser_open_url': {
        const opened = await driver.open(args.url);
        // THE LOOK AFTER THE OPEN READS THE TAB THAT WAS OPENED.
        // The fallback driver keeps whatever page it was last pointed at, so reading through it after a bridge-opened tab read a chrome:// extensions page and failed instead of answering - the tab had opened fine, and the agent was told otherwise.
        // The per-tab driverFor names the new tab by its own id, so the look after the open sees the page the caller asked for.
        const openedId = isObject(opened) ? opened.id : null;
        const openedDriver = openedId === null || openedId === undefined ? driver : await driverFor(String(openedId));
        return afterAction(openedDriver, opened);
      }
      case 'browser_close_tab': {
        const out = await driver.close(args.tabId);
        void sessions.get(args.tabId)?.close?.();
        sessions.delete(args.tabId);
        await lease.release(args.tabId, OWNER).catch(() => null);
        return asText(out);
      }
      case 'browser_read_page':
        return asText(await driver.read({ allowCaretMove: args.allowCaretMove === true }));
      // THE SETTLE IS ASKED FOR, BOUNDED AND OPTIONAL.
      // tabs.open already waits for the tab's load event, but load and settled-for-readers are different facts: Bing renders its cards server-side, and the first innerText read is only as fresh as whatever the page did after DOMContentLoaded.
      // The optional call keeps a fake session in the tests working while the real one measures quiet before the read.
      case 'browser_search_web': {
        const query = String(args.query ?? '').trim();
        if (!query) throw new Error('search needs a non-empty query string.');
        const pages = Math.min(3, Math.max(1, Math.floor(Number(args.pages) || 1)));
        const firstUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
        // ONE TAB AND WHY IT IS ALWAYS CLOSED.
        // The everyday browser is visible while an agent works: the search walks at most three pages in one background tab (foreground on the direct-CDP fallback, which cannot order one) and closes it on every exit path; what remains is one structured answer.
        const withDeadline = <T>(promise: Promise<T>, ms: number, what: string): Promise<T> => {
          let timer: ReturnType<typeof setTimeout> | undefined;
          const clock = new Promise<never>((_resolve, reject) => {
            timer = setTimeout(() => reject(new Error(`${what} did not answer in ${ms}ms - the browser may be busy or asleep; the search tab was closed either way.`)), ms);
          });
          return Promise.race([
            promise.then(
              (value) => { if (timer) clearTimeout(timer); return value; },
              (error: unknown) => { if (timer) clearTimeout(timer); throw error; }
            ),
            clock
          ]);
        };
        let tabId = '';
        let failure = null;
        let closeFailed = false;
        let answer: JsonRecord | null = null;
        const opener = fallback ?? driver;
        try {
          const opened = await opener.open(firstUrl);
          tabId = String(isObject(opened) ? opened.id ?? '' : '');
          if (!tabId) throw new Error('the search tab could not be confirmed; the browser may be asleep - check status - and the open may have happened without this process hearing back; tabs shows whether a Bing tab is sitting there.');
          const searchDriver = await driverFor(tabId, { background: true });
          // THE TAB IS ASKED WHERE IT IS BEFORE IT IS READ.
          // A background tab at about:blank reports zero rows and zero changes, which is the most still a page can be, so the old wait reported "settled" immediately and the Bing read ran before Bing loaded - every search answered count: 0.
          // Waiting for the url to carry bing.com/search closes the race, and a page that never reaches it is refused by name instead of answered with silence.
          if (typeof searchDriver.waitForUrl === 'function') {
            const loaded = (await searchDriver.waitForUrl({ contains: 'bing.com/search', timeoutMs: 8000 }).catch(() => null)) as { found?: unknown } | null;
            if (!loaded || loaded.found !== true) {
              throw new Error('the search tab did not reach Bing within 8 seconds; the everyday browser may throttle or discard background tabs - open a visible Bing search or retry');
            }
          }
          // THE WAIT IS ON THE PAGE, NOT ON A STILL FRAME.
          // A background tab at about:blank reports zero rows and zero changes, which is the most still a page can be, so a stillness pass answered before Bing had rendered and the read came back with count: 0.
          // The poll asks the page how many characters of text it actually carries; a page that never reaches them is refused by name, not answered with silence.
          const rawBudget = Number(args.timeoutMs ?? 10000);
          const contentBudgetMs = Number.isFinite(rawBudget) ? Math.min(30000, Math.max(1000, rawBudget)) : 10000;
          if (typeof searchDriver.pageState === 'function') {
            const contentDeadline = Date.now() + contentBudgetMs;
            for (;;) {
              // A meter refusal or any hard page error is propagated as it is: an agent whose budget is spent must read the reason, not a timer's.
              const probe = (await searchDriver.pageState().catch((error: unknown) => { throw error; })) as { textChars?: unknown; title?: unknown } | null;
              const chars = Number(probe?.textChars ?? 0);
              if (Number.isFinite(chars) && chars >= 500) break;
              if (Date.now() >= contentDeadline) {
                throw new Error(`the Bing results page did not render within ${Math.round(contentBudgetMs / 1000)} seconds; the everyday browser may throttle background tabs - open a Bing search in a visible tab or retry`);
              }
              await new Promise((resolve) => setTimeout(resolve, 150));
            }
          }
          const merged: SerpResult[] = [];
          let currentFirst = 1;
          let truncated = false;
          let textTruncated = false;
          let fetched = 0;
          let pageUrl = firstUrl;
          let pageTitle = '';
          for (let page = 0; page < pages; page += 1) {
            if (page > 0) await withDeadline(searchDriver.navigate(`${firstUrl}&first=${currentFirst}`), 25000, 'navigating to the next results page');
            const raw = await withDeadline(Promise.resolve().then(() => searchDriver.evaluate(SERP_EXPRESSION)), 15000, 'reading the results page');
            const serp = isObject(raw) ? raw : {};
            const parsed = parseBingSerp({ text: String(serp.text ?? ''), links: Array.isArray(serp.links) ? serp.links as Array<Record<string, unknown>> : [] }, { currentFirst });
            merged.push(...parsed.results);
            fetched += 1;
            truncated = parsed.nextFirst !== null;
            textTruncated = textTruncated || serp.truncated === true;
            if (fetched === 1) {
              pageUrl = String(serp.url ?? firstUrl);
              pageTitle = String(serp.title ?? '');
            }
            if (parsed.nextFirst === null) break;
            currentFirst = parsed.nextFirst;
          }
          const seen = new Set();
          const results: Array<SerpResult & { rank: number }> = [];
          for (const result of merged) {
            if (seen.has(result.url)) continue;
            seen.add(result.url);
            results.push({ ...result, rank: results.length + 1 });
          }
          answer = { ok: true, kind: 'browser_search_web', page: { url: pageUrl, title: pageTitle }, search: { query, engine: 'bing', pages: fetched, count: results.length, truncated, ...(textTruncated ? { textTruncated: true } : {}), results } };
        } catch (error: unknown) {
          failure = error;
        } finally {
          if (tabId) {
            void sessions.get(tabId)?.close?.();
            sessions.delete(tabId);
            await lease.release(tabId, OWNER).catch(() => null);
            await opener.close(tabId).then(() => { closeFailed = false; }).catch(() => { closeFailed = true; });
          }
        }
        if (failure) {
          if (closeFailed) {
            const message = failure instanceof Error ? failure.message : String(failure);
            throw new Error(message + ' The search tab may still be open on the browser; check tabs.');
          }
          throw failure;
        }
        if (closeFailed && answer) answer.tabClosed = false;
        return asText(answer);
      }
      case 'browser_find_text': {
        if (!args.text) throw new Error('browser_find_text needs text');
        return asText(await driver.find(String(args.text)));
      }
      case 'browser_find_element': {
        if (!args.role) throw new Error('browser_find_element needs role — e.g. menuitem');
        if (args.name) return asText({ row: await driver.resolve(args.role, args.name) });
        const snapshot = await driver.snapshot(args.limit) as Array<Record<string, unknown>>;
        return asText({ rows: snapshot.filter((row) => row.role === args.role) });
      }      case 'browser_click': {
        if (args.role || args.name) {
          if (!args.role) throw new Error('click by row needs role — e.g. menuitem');
          if (!args.name) throw new Error('click by row needs name — the row name, exact first, substring after');
          return afterAction(driver, await driver.clickRow(args.role, args.name));
        }
        return afterAction(driver, args.at
          ? await driver.clickFraction(args.at)
          : await driver.click(args.x, args.y, args.handle ?? null));
      }
      case 'browser_hover':
        return afterAction(driver, await driver.hover(args.x, args.y));
      case 'browser_press_key':
        return afterAction(driver, await driver.key(args.key, args.modifiers ?? []));
      case 'browser_type_text':
        return afterAction(driver, args.atEnd === true ? await driver.append(args.text) : await driver.type(args.text));
      case 'browser_scroll':
        return afterAction(driver, await driver.scroll({
          y: args.y,
          end: args.end === true,
          text: args.text,
          selector: args.selector
        }));
      case 'browser_run_steps':
        if (!burst) throw new Error('run reached the run without its normalized steps');
        return afterAction(driver, await runLocalBurst({
          driver,
          steps: burst.steps,
          timeoutMs: burst.timeoutMs
        }));
      case 'browser_wait_until': {
        const until = String(args.until ?? 'text');
        if (until === 'text') {
          if (!args.text) throw new Error('wait until=text needs text — the text to watch for');
          const started = Date.now();
          const rawTimeout = Number(args.timeoutMs ?? 8000);
          const timeoutMs = Number.isFinite(rawTimeout) ? Math.min(30000, Math.max(500, rawTimeout)) : 8000;
          const rawGap = Number(args.intervalMs ?? 100);
          const intervalMs = Number.isFinite(rawGap) ? Math.min(5000, Math.max(50, rawGap)) : 100;
          const absent = args.absent === true;
          const state = await driver.waitForText(String(args.text), { timeoutMs, intervalMs, absent });
          const read = isObject(state) ? state : {};
          const includes = String(read.text ?? '').includes(String(args.text));
          return afterAction(driver, { found: includes !== absent, ms: Date.now() - started, settled: true });
        }
        if (until === 'row') {
          if (!args.role) throw new Error('wait until=row needs role — e.g. menuitem');
          if (!args.name) throw new Error('wait until=row needs name — the row name, exact first, substring after');
          const rowOut = await driver.waitForRow({
            role: args.role,
            name: args.name,
            absent: args.absent === true,
            timeoutMs: budgetOf(args.timeoutMs, 10000, 60000),
            intervalMs: gapOf(args.intervalMs, 50, 50)
          });
          return afterAction(driver, { ...(isObject(rowOut) ? rowOut : {}), settled: true });
        }
        if (until === 'url') {
          if (!args.contains && !args.matches) throw new Error('wait until=url needs contains or matches');
          const urlOut = await driver.waitForUrl({
            contains: typeof args.contains === 'string' ? args.contains : null,
            matches: typeof args.matches === 'string' ? args.matches : null,
            timeoutMs: Math.min(Math.max(Number(args.timeoutMs) || 8000, 500), 60000)
          });
          return afterAction(driver, { ...(isObject(urlOut) ? urlOut : {}), settled: true });
        }
        if (until === 'stable') {
          const stillOut = await driver.waitForStill({
            timeoutMs: budgetOf(args.timeoutMs, 8000),
            quietMs: quietOf(args.quietMs, 120)
          });
          return afterAction(driver, { ...(isObject(stillOut) ? stillOut : {}), settled: true });
        }
        throw new Error(`wait until must be text, row, url or stable — got: ${until}`);
      }

      case 'browser_get_guide':
        return asText(await driver.guide(args.topic));
      case 'browser_list_menu':
        return asText(await driver.menuTree({ limit: args.limit }));
      case 'browser_walk_menu': {
        const path = Array.isArray(args.path) ? args.path : [];
        if (path.length === 0) throw new Error('browser_walk_menu needs a path of menu names, e.g. ["Insert","Image"]');
        return afterAction(driver, await driver.openMenu({
          path,
          clickLeaf: args.clickLeaf === true,
          limit: args.limit
        }));
      }      case 'browser_upload_file': {
        const uploaded = await driver.upload({ filename: args.filename, data: args.data ?? null, path: args.path ?? null });
        if (isObject(uploaded) && uploaded.inputFound === false) {
          throw new Error(`upload: inputFound: false - ${args.filename} went nowhere: the page has no file input to fill`);
        }
        return afterAction(driver, uploaded);
      }
      case 'browser_drop_file': {
        const browser = fallback ?? driver;
        const before = new Set((await browser.tabs() as JsonRecord[]).map((tab) => String(tab.id)));
        const dropped = await driver.dropFile({
          x: args.x,
          y: args.y,
          filename: args.filename,
          data: args.data ?? null,
          path: args.path ?? null
        });
        const strays = (await browser.tabs() as JsonRecord[]).filter((tab) => !before.has(String(tab.id)));
        let openedInstead = false;
        for (const tab of strays) {
          if (!String(tab.url ?? '').startsWith(STRAY_FILE_TAB)) continue;
          openedInstead = true;
          await browser.close(String(tab.id)).catch(() => null);
        }
        return afterAction(driver, { ...(isObject(dropped) ? dropped : {}), openedInstead });
      }
      case 'browser_intercept_picker':
        return asText(await driver.interceptFileChooser(args.enabled === true));
      case 'browser_download_file':
        return asText(await driver.download({
          handle: args.handle ?? null,
          role: args.role ?? null,
          name: args.name ?? null,
          x: args.x,
          y: args.y,
          dir: args.dir ?? null,
          saveAs: args.saveAs ?? null,
          timeoutMs: args.timeoutMs
        }));
      case 'browser_screenshot': {
        const shotRaw = await driver.captureSized(args.fullPage === true ? { fullPage: true } : {});
        const shot: JsonRecord = isObject(shotRaw) ? shotRaw : {};
        return {
          content: [
            { type: 'image', data: shot.data, mimeType: 'image/jpeg' },
            { type: 'text', text: JSON.stringify({ viewport: shot.viewport, dpr: shot.dpr, image: shot.image, note: shot.note }) }
          ]
        };
      }
      case 'browser_check_gate': {
        const action = String(args.action ?? 'detect');
        if (action === 'detect') {
          return asText(await detectGate(driver as unknown as import('./gates.js').GateDriver));
        }
        if (action === 'wait') {
          // The drive's verbs accept unknown arguments; the gate driver's narrow surface is the same object at runtime.
          const out = await waitForGateClear(driver as unknown as import('./gates.js').GateDriver, {
            timeoutMs: budgetOf(args.timeoutMs, 30000, 300000),
            intervalMs: gapOf(args.intervalMs, 500, 50)
          });
          return afterAction(driver, { ...out, settled: true });
        }
        throw new Error(`check_gate action must be detect or wait — got: ${action}`);
      }
      case 'browser_login': {
        const out = await loginWithCredentials(driver as unknown as import('./gates.js').GateDriver, {
          credentialsPath: args.credentialsPath,
          timeoutMs: budgetOf(args.timeoutMs, 30000),
          intervalMs: gapOf(args.intervalMs, 500, 50)
        });
        return afterAction(driver, out);
      }
      case 'browser_solve_captcha': {
        const settings = solverSettings(process.env);
        if (!settings.configured) {
          throw new Error('captcha is opt-in and no solver is configured: set NAVEGO_CAPTCHA_API_URL, NAVEGO_CAPTCHA_API_KEY and NAVEGO_CAPTCHA_DOMAINS, or let the person solve it and use portal.');
        }
        const gate = await detectGate(driver as unknown as import('./gates.js').GateDriver);
        if (!captchaAllowed(settings, gate.url)) {
          throw new Error(`captcha refuses ${gate.url || 'this page'}: its host is not in NAVEGO_CAPTCHA_DOMAINS, and the allowlist is what makes the spend the person's decision.`);
        }
        const image = gate.fields.captchaImage[0];
        const field = gate.fields.captchaInput[0];
        if (!image) throw new Error('captcha found no captcha image on this page; a widget is solved in the browser, not by a solver.');
        if (!field) throw new Error('captcha found a captcha image but no field to type the answer into.');
        const shotRaw = await driver.ask('Page.captureScreenshot', {
          format: 'png',
          clip: { x: image.left, y: image.top, width: image.width, height: image.height, scale: 1 }
        });
        const shot: JsonRecord = isObject(shotRaw) ? shotRaw : {};
        const solved = await solveImageCaptcha({
          baseUrl: settings.baseUrl,
          apiKey: settings.apiKey,
          image: shot.data,
          timeoutMs: budgetOf(args.timeoutMs, 60000)
        });
        await driver.click(field.x, field.y);
        await driver.type(solved.text);
        return afterAction(driver, { solved: true, chars: solved.text.length, taskId: solved.taskId });
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  };

  return {
    async close() {
      for (const session of sessions.values()) void session.close?.();
      sessions.clear();
    },
    async handle(request: unknown) {
      const envelope = isObject(request) ? request : {};
      const { id, method, params } = envelope;
      const reply = (result: unknown) => ({ jsonrpc: '2.0', id, result });
      const fail = (message: string) => ({ jsonrpc: '2.0', id, error: { code: -32000, message } });

      try {
        if (method === 'initialize') {
          return reply({
            protocolVersion: PROTOCOL_VERSION,
            capabilities: { tools: {} },
            serverInfo: { name: 'navego', version: context.version ?? '0.0.0' },
            instructions: "Navego drives the user's real, signed-in browser: read pages, fill forms, run flows in the same tabs the user sees. Start with `read` to see the page (or `guide` if you do not know which tool to reach for), `wait` after an action that moves the page, and `run` for dependent steps. The session uses the person's accounts; passwords, one-time codes and payment data are refused — treat that as the answer, never retry around it. When a page asks something the person must answer, stop and ask."
          });
        }
        if (method === 'tools/list') return reply({ tools: TOOLS });
        if (method === 'tools/call') {
          const started = Date.now();
          const callName = isObject(params) ? String((params as JsonRecord).name ?? 'unknown') : 'unknown';
          try {
            const call = isObject(params) ? params : {};
            const out = await run(String(call.name ?? ''), isObject(call.arguments) ? call.arguments : {});
            return reply(withCost(out, Date.now() - started));
          } catch (error: unknown) {
            const code = typeof (error as { code?: unknown } | null)?.code === 'string' ? String((error as { code: string }).code) : 'MCP_EXECUTION_ERROR';
            recordFailure({ tool: callName, code, message: String((error as Error)?.message ?? error) });
            return reply(toolFailure(error, { rows: lastSeen }));
          }
        }

        if (typeof method === 'string' && method.startsWith('notifications/')) return undefined;
        return fail(`Unknown method: ${String(method)}`);
      } catch (error: unknown) {
        return fail(withAdvice(error, { rows: lastSeen }));
      }
    }
  };
}

// the loop is line based and never awaits a parse.
// MCP stdio frames are newline-delimited JSON, so a line that is not yet complete is not a frame, and a malformed one must be reported rather than thrown, because a throwing read loop ends the session over one bad message.

// the dispatch carries a rejection handler and a void.
// Without the handler a single rejected handle ends the process on an unhandled rejection, taking down a whole session over one bad call.
// SonarCloud caught that on this file and it was right: the handler is not decoration.
// The void then says the reply is deliberately not awaited, because an event loop has nothing else to wait for.

export function startStdio({ input = process.stdin, output = process.stdout, context }: { input?: NodeJS.ReadableStream; output?: NodeJS.WritableStream; context: McpContext }) {
  const server = createMcpServer(context);
  let buffer = '';

  input.setEncoding('utf8');
  input.on('data', (chunk: string | Buffer) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const text = line.trim();
      if (!text) continue;
      let request: JsonRecord;
      try {
        request = JSON.parse(text) as JsonRecord;
      } catch {
        output.write(`${JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } })}\n`);
        continue;
      }
      void Promise.resolve(server.handle(request))
        .catch((error: unknown) => ({ jsonrpc: '2.0', id: request.id ?? null, error: { code: -32603, message: String((error as Error)?.message ?? error) } }))
        .then((response: unknown) => {
          if (response) output.write(`${JSON.stringify(response)}\n`);
        });
    }
  });

  return server;
}
