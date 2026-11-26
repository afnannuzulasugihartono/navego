// @last-edited: 2026-11-27 UTC+7.
// @title: funnel — the steps a stranger takes, written where the operator can read them.
// decisions.json -> site-install-cta-01, site-install-cta-02, site-funnel-steps-01, site-funnel-views-01
// @state: one random browser id, one whitelisted step name, and a fire-and-forget write that never blocks the page.
// @dependencies: none at runtime; the endpoint and the publishable key mirror auth.ts, and funnel.test.ts fails when the two drift apart.

// THE BROWSER REPORTS ITS OWN STEPS, because a pageview script cannot.
// The site cannot tell a download click from a pageview, and the dashboard cannot tell a pairing attempt from a pairing that worked.
// So each surface names the step it just reached, and the row lands beside the account and the device it belongs to.

// NOTHING HERE THROWS, because a measurement that breaks the page it measures is worse than no measurement.
// Every call is caught, capped and silent.

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
    return;
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

export type InstallSurface = 'landing' | 'download';

// The install view is the command on screen, not the page that carries it.
// The landing's install block and the download page's install block report it from where they render, so a page load that never showed the command writes no install row.

export function recordInstallView(surface: InstallSurface, path = currentPath()): void {
  track('install.view', { surface }, path);
}

// A pairing view is a visitor with a session.
// The dashboard route serves an anonymous probe as well, and that probe reached no human, so it writes no funnel step.

export function recordPairView(hasSession: boolean, path = currentPath()): void {
  if (!hasSession) return;
  track('pair.view', {}, path);
}

export function recordInstallCopy(surface: InstallSurface): void {
  track('install.click', { browser: 'windows', artifact: 'powershell', surface });
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
    return;
  }
}

// A pageview is counted once per path per browser session: a reload is the same visit, and a scroll is not a visit at all.
// The page load writes its own row and nothing else: the install view belongs to the rendered command, and the pairing view belongs to a visitor with a session.

export function trackView(path = currentPath()): void {
  const views = readJson(VIEW_KEY);
  const last = Number(views[path] ?? 0);
  const now = Date.now();
  if (Number.isFinite(last) && now - last < 30 * 60 * 1000) return;
  writeJson(VIEW_KEY, { ...views, [path]: now });
  track('page.view', { path }, path);
  if (path === '/harga') track('plan.view', {}, path);
}
