// Navego's client-side auth + API helpers.
// No SDK, no secrets: the publishable key is public by design, the session lives in this browser's localStorage, and every call that carries identity goes to the project's Auth or REST host only.

// decisions.json -> site-auth-01, site-session-state-01

export const PUBLISHABLE_KEY = 'sb_publishable_jAbS_QIQsmXQA-Rj8RWPcg_JVeBedJ6';
export const REST = 'https://nenmkmtvjremqphfqnfw.supabase.co/rest/v1';
export const AUTH_HOST = 'https://nenmkmtvjremqphfqnfw.supabase.co/auth/v1';
export const BILLING = 'https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/navego-billing';
export const UPDATE_FN = 'https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/navego-update';

const ACCESS_KEY = 'navego-access-token';
const REFRESH_KEY = 'navego-refresh-token';
const EMAIL_KEY = 'navego-session-email';
const SESSION_EVENT = 'navego:session';
const RETURNABLE = /^\.\/[A-Za-z0-9._~/?=&%#-]*$/;
const SAME_SITE_RETURNABLE = /^\/(?!\/)[A-Za-z0-9._~/?=&%#-]*$/;

// ?next is attacker-controllable, so only same-site paths pass: a relative path, or a root-relative path on this origin.
// The dashboard and the OAuth consent page hand each other root-relative paths such as /dashboard?pair=1#pairing, so a rule that accepted only ./... silently turned every pairing and consent request into "open the dashboard".

// decisions.json -> site-auth-return-path-01

export function safeReturnPath(asked: string): string | null {
  const value = String(asked || '').trim();
  if (!value) return null;
  if (RETURNABLE.test(value)) return value;
  if (SAME_SITE_RETURNABLE.test(value)) return value;
  return null;
}

// The site runs in a browser, and this module is also read by the Node test project, which has no DOM lib; the cast names the globals it needs.

type LockManagerLike = { request: (name: string, run: () => Promise<string | null>) => Promise<string | null> };
type EventTargetLike = {
  addEventListener: (name: string, run: (event: Event) => void) => void;
  removeEventListener: (name: string, run: (event: Event) => void) => void;
};
const browserGlobals = globalThis as {
  location?: { search?: string };
  navigator?: { locks?: LockManagerLike };
  window?: EventTargetLike & { dispatchEvent: (event: Event) => boolean };
  localStorage?: { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void; removeItem: (key: string) => void };
};

export function getReturnTo(): string {
  const asked = new URLSearchParams(browserGlobals.location?.search ?? '').get('next') || '';
  return safeReturnPath(asked) || './dashboard';
}

export function getStoredToken(): string | null {
  try {
    return browserGlobals.localStorage?.getItem(ACCESS_KEY) ?? null;
  } catch {
    return null;
  }
}

export function storeToken(token: string | null) {
  try {
    if (token) browserGlobals.localStorage?.setItem(ACCESS_KEY, token);
    else browserGlobals.localStorage?.removeItem(ACCESS_KEY);
  } catch {
  }
}

export function getRefreshToken(): string | null {
  try {
    return browserGlobals.localStorage?.getItem(REFRESH_KEY) ?? null;
  } catch {
    return null;
  }
}

export function storeRefreshToken(token: string | null) {
  try {
    if (token) browserGlobals.localStorage?.setItem(REFRESH_KEY, token);
    else browserGlobals.localStorage?.removeItem(REFRESH_KEY);
  } catch {
  }
}

export function clearSession() {
  storeToken(null);
  storeRefreshToken(null);
  storeEmail(null);
  announceSession(null);
}

// The email is a comfort, not the authority: the token is proved against the auth host before it counts.
// A remembered email without a token is a leftover, not a session: the browser that lost the token lost the session with it.

export function getStoredEmail(): string | null {
  try {
    if (!browserGlobals.localStorage?.getItem(ACCESS_KEY)) return null;
    return browserGlobals.localStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
}

export function storeEmail(email: string | null) {
  try {
    if (email) browserGlobals.localStorage?.setItem(EMAIL_KEY, email);
    else browserGlobals.localStorage?.removeItem(EMAIL_KEY);
  } catch {
  }
}

// Every tab learns the change, so a sign-in in one tab flips the header in the others without a reload.

export function announceSession(email: string | null) {
  try {
    browserGlobals.window?.dispatchEvent(new CustomEvent(SESSION_EVENT, { detail: email }));
  } catch {
  }
}

export function onSessionChange(run: (email: string | null) => void): () => void {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<string | null>).detail;
    // A storage event from another tab carries the key that changed, not the account; the stored email answers it.
    if (typeof detail !== 'string') {
      run(getStoredEmail());
      return;
    }
    run(detail);
  };
  browserGlobals.window?.addEventListener(SESSION_EVENT, handler);
  browserGlobals.window?.addEventListener('storage', handler);
  return () => {
    browserGlobals.window?.removeEventListener(SESSION_EVENT, handler);
    browserGlobals.window?.removeEventListener('storage', handler);
  };
}

export async function proveSession(accessToken: string): Promise<{ email?: string; error?: string | number }> {
  const response = await fetch(`${AUTH_HOST}/user`, {
    headers: { apikey: PUBLISHABLE_KEY, authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) return { error: response.status };
  const user = await response.json() as { email?: unknown; session?: { refresh_token?: unknown } } | null;
  const refreshed = user?.session?.refresh_token;
  if (typeof refreshed === 'string' && refreshed.length > 0) storeRefreshToken(refreshed);
  if (typeof user?.email !== 'string' || user.email.length === 0) return { error: 'tanpa-email' };
  storeEmail(user.email);
  return { email: user.email };
}

// offline and refusal differ here: a network failure says nothing about the account and must not clear a stored session; only a refused refresh token is death.

// decisions.json -> site-auth-01

// A refresh token rotates, so two refreshes at once turn the second one into a stolen-token refusal that clears the session.

const REFRESH_LOCK = 'navego-token-refresh';

// The renewal answer carries the account; storing it keeps the header honest without a second round trip.

async function renewOnce(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  let response: Response;
  try {
    response = await fetch(`${AUTH_HOST}/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: PUBLISHABLE_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
  } catch {
    return null;
  }
  if (response.status === 400 || response.status === 401) {
    clearSession();
    return null;
  }
  if (!response.ok) return null;
  const renewed = await response.json().catch(() => null) as { access_token?: unknown; refresh_token?: unknown; user?: { email?: unknown } } | null;
  if (typeof renewed?.access_token !== 'string' || renewed.access_token.length === 0) return null;
  storeToken(renewed.access_token);
  if (typeof renewed.refresh_token === 'string' && renewed.refresh_token.length > 0) storeRefreshToken(renewed.refresh_token);
  if (typeof renewed.user?.email === 'string' && renewed.user.email.length > 0) storeEmail(renewed.user.email);
  return renewed.access_token;
}

const withRefreshLock = async (run: () => Promise<string | null>): Promise<string | null> => {
  const locks = browserGlobals.navigator?.locks;
  return locks && typeof locks.request === 'function' ? locks.request(REFRESH_LOCK, run) : run();
};

let renewal: Promise<string | null> | null = null;

export function renewAccessToken(): Promise<string | null> {
  if (renewal) return renewal;
  const seen = getStoredToken();
  renewal = withRefreshLock(async () => {
    // Another tab may have renewed while this one waited for the lock; its token is the fresh one, and rotating again would refuse the refresh token it just stored.
    const current = getStoredToken();
    if (current && current !== seen) return current;
    return renewOnce();
  }).finally(() => {
    renewal = null;
  });
  return renewal;
}

// Prove the stored session, renewing once via the refresh token when the access token aged out.

export async function ensureSession(): Promise<string | null> {
  const stored = getStoredToken();
  if (stored) {
    const proof = await proveSession(stored).catch(() => ({}));
    if (proof && 'email' in proof) return stored;
  }
  return renewAccessToken();
}

// The account behind the stored session, proved once and then remembered.
// The header asks this on every page, so it answers from the stored email first and only proves the token when the email is missing.

export async function sessionAccount(): Promise<string | null> {
  const stored = getStoredToken();
  if (!stored) return null;
  const remembered = getStoredEmail();
  if (remembered) return remembered;
  const proof = await proveSession(stored).catch(() => ({}));
  if (proof && 'email' in proof) return proof.email ?? null;
  const renewed = await renewAccessToken();
  if (!renewed) return null;
  const afterRenewal = await proveSession(renewed).catch(() => ({}));
  return afterRenewal && 'email' in afterRenewal ? afterRenewal.email ?? null : null;
}

export function headersFor(token: string) {
  return { apikey: PUBLISHABLE_KEY, authorization: `Bearer ${token}`, 'content-type': 'application/json' };
}
