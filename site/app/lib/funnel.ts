// @last-edited: 2026-11-24 UTC+7.
// @title: funnel — the steps a stranger takes, written where the operator can read them.
// @state: one random browser id, one whitelisted step name, and a fire-and-forget write that never blocks the page.
// @dependencies: none at runtime; the endpoint and the publishable key mirror auth.ts, and funnel.test.ts fails when the two drift apart.

// WHY THE BROWSER REPORTS ITS OWN STEPS.
// The site cannot tell a download click from a pageview, and the dashboard cannot tell a pairing attempt from a pairing that worked.
// So each surface names the step it just reached, and the row lands beside the account and the device it belongs to.

// WHY NOTHING HERE THROWS.
// A measurement that breaks the page it measures is worse than no measurement: every call is caught, capped and silent.

// THE ID IS RANDOM AND LOCAL.
// It lives in localStorage, names one browser, and carries nothing else: no email, no IP, no fingerprint.
// Clearing site data changes the id, which undercounts a returning visitor; that is the trade this site makes to stay cookie-banner free.

// THE ENDPOINT IS WRITTEN HERE AND PINNED BY A TEST.
// Importing auth.ts would drag the whole session machinery into a tracker that must never be able to throw, and this module is also read by a Node test that resolves files literally.
// So the two literals live here and funnel.test.ts asserts they still equal PUBLISHABLE_KEY and `${REST}/rpc/opera_funnel_record`.
export const FUNNEL_ENDPOINT = 'https://nenmkmtvjremqphfqnfw.supabase.co/rest/v1/rpc/opera_funnel_record';
export const FUNNEL_KEY = 'sb_publishable_jAbS_QIQsmXQA-Rj8RWPcg_JVeBedJ6';

export type FunnelStep =
  | 'page.view'
  | 'install.view'
  | 'install.click'
  | 'plan.view'
  | 'buy.click'
  | 'pair.view'
  | 'pair.start'
  | 'pair.ok'
  | 'pair.fail';

const ID_KEY = 'navego-funnel-id';
const VIEW_KEY = 'navego-funnel-views';
const SENT_KEY = 'navego-funnel-sent';

type StoreLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem?: (key: string) => void;
};

// The site runs in a browser and this module is also read by the Node test project, which has no DOM lib.
const globals = globalThis as {
  crypto?: { randomUUID?: () => string };
  localStorage?: StoreLike;
  location?: { pathname?: string; search?: string };
  fetch?: typeof fetch;
};

function store(): StoreLike | null {
  try {
    return globals.localStorage ?? null;
  } catch {
    return null;
  }
}

function readJson(key: string): Record<string, unknown> {
  try {
    const raw = store()?.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function writeJson(key: string, value: Record<string, unknown>) {
  try {
    store()?.setItem(key, JSON.stringify(value));
  } catch {
    // A full or blocked storage means no measurement, never a broken page.
  }
}

export function funnelId(): string | null {
  const existing = store()?.getItem(ID_KEY);
  if (existing) return existing;
  let made: string | null = null;
  try {
    made = globals.crypto?.randomUUID?.() ?? null;
  } catch {
    made = null;
  }
  if (!made) {
    made = `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
  try {
    store()?.setItem(ID_KEY, made);
  } catch {
    return null;
  }
  return made;
}

export function currentPath(): string {
  const pathname = globals.location?.pathname ?? '';
  return pathname || '/';
}

export function track(name: FunnelStep, meta: Record<string, unknown> = {}, path = currentPath()): void {
  try {
    const fetchFn = globals.fetch;
    if (!fetchFn) return;
    const anon = funnelId();
    // The same step from the same browser in the same page is one step; a re-render is not a second visitor.
    const stamp = `${name}:${path}`;
    const sent = readJson(SENT_KEY);
    const now = Date.now();
    const previous = Number(sent[stamp] ?? 0);
    if (Number.isFinite(previous) && now - previous < 3000) return;
    writeJson(SENT_KEY, { ...sent, [stamp]: now });
    void fetchFn(FUNNEL_ENDPOINT, {
      method: 'POST',
      headers: { apikey: FUNNEL_KEY, authorization: `Bearer ${FUNNEL_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ p_name: name, p_path: path, p_anon: anon, p_meta: meta }),
      keepalive: true
    }).catch(() => null);
  } catch {
    // Never in the way of the page.
  }
}

// A pageview is counted once per path per browser session: a reload is the same visit, and a scroll is not a visit at all.
export function trackView(path = currentPath()): void {
  const views = readJson(VIEW_KEY);
  const last = Number(views[path] ?? 0);
  const now = Date.now();
  if (Number.isFinite(last) && now - last < 30 * 60 * 1000) return;
  writeJson(VIEW_KEY, { ...views, [path]: now });
  track('page.view', { path }, path);
  if (path === '/unduh') track('install.view', {}, path);
  if (path === '/harga') track('plan.view', {}, path);
}
