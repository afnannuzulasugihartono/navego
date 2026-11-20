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

// THE JOB TOOLS ARE IMPORTED HERE AND NOT ROUTED THROUGH A DRIVER.
// A card, a manifest, a report line set and a wallet quote are work the server or the disk owns: they open no tab, read no page and need no browser to be running - the jobs live in job-tools.js, and their import site is for the same reason: opening a session would touch a browser the job does not need.

import './legacy-env-bootstrap.js';
import { randomUUID } from 'node:crypto';
import { BURST_INPUT_ACTIONS, normalizeBurst } from './burst.js';
import { leaseTab, releaseTab } from './bridge.js';

// THE SAME TIDY FUNCTION THE HOSTED SURFACE USES, AND WHY IT RIDES THE PACKAGE.
// The rejections that keep a model from wasting tokens on envelopes, transport keys and duplicated chain fields apply to the local stdio surface too - a rule that lives in one place stays consistent and changes for one reason.
// The copy is written at pack time (scripts/pack/pack-mcp.ts) because a path outside the package does not exist on the machine that runs the install: reading ../supabase at run time died with ENOENT for every installed user.

import { tidyForAi } from './tidy.js';
import { TOOLS } from './tools.js';
import { validateArguments } from './tool-schema.js';
import { runJobTools } from './job-tools.js';
import { runBrowserAction } from './browser-actions.js';

// The tool table lives in tools.js: the surface is data, and this file is the protocol that answers it.

export { TOOLS };

// decisions.json -> local-tool-schema-01

// Every branch below reads arguments the validator already proved, so the open-record assertion costs nothing a second check would buy.

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

const OWNER = `${process.env.OPERA_LABEL || 'driver'}-${randomUUID().slice(0, 8)}`;

// THE WINDOW IS TUNABLE AND DEFAULTS TO A MINUTE.
// A minute outlives any single call and still clears an agent that went quiet; a caller whose agents idle for longer can widen it, and one that wants a fast hand-over can narrow it.
// The window is read per call rather than held, so a change takes effect on the next claim without a restart.

const leaseWindow = () => {
  const ttl = Number(process.env.OPERA_LEASE_TTL_MS);
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

  const run = async (name: string, rawArgs: unknown): Promise<unknown> => {
    const tool = TOOLS.find((candidate) => candidate.name === name);
    if (!tool) throw new Error(`Unknown tool: ${name}`);
    const args = validateArguments(name, rawArgs === undefined ? {} : rawArgs, tool.inputSchema);

    // The burst is checked before a tab is resolved, so a malformed step list cannot touch a browser, and a caller learns which step was wrong before any page is changed.
    const burst = name === 'browser_run_steps' ? normalizeBurst(args) : null;

    const job = await runJobTools(name, args, { version: context.version });
    if (job.handled) return job.result;

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

    const browser = await runBrowserAction(name, args, {
      driver,
      driverFor,
      resolvedTab,
      afterAction,
      sessions,
      lease,
      owner: OWNER,
      fallback,
      browsers: context.browsers,
      burst,
      port: context.port
    });
    if (browser !== null) return browser;
    throw new Error(`tool ${name} is advertised without a branch - the table and the dispatcher disagree`);

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
            serverInfo: { name: 'opera', version: context.version ?? '0.0.0' },
            instructions: "Opera drives the user's real, signed-in browser: read pages, fill forms, run flows in the same tabs the user sees. Start with `read` to see the page (or `guide` if you do not know which tool to reach for), `wait` after an action that moves the page, and `run` for dependent steps. The session uses the person's accounts; passwords, one-time codes and payment data are refused — treat that as the answer, never retry around it. When a page asks something the person must answer, stop and ask."
          });
        }
        if (method === 'tools/list') return reply({ tools: TOOLS });
        if (method === 'tools/call') {
          const started = Date.now();
          const callName = isObject(params) ? String((params as JsonRecord).name ?? 'unknown') : 'unknown';
          try {
            const call = isObject(params) ? params : {};
            const out = await run(String(call.name ?? ''), call.arguments);
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
