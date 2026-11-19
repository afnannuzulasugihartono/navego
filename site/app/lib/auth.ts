// Navego's client-side auth + API helpers.
// No SDK, no secrets: the publishable key is public by design, the session lives in this browser's localStorage, and every call that carries identity goes to the project's Auth or REST host only.

export const PUBLISHABLE_KEY = 'sb_publishable_jAbS_QIQsmXQA-Rj8RWPcg_JVeBedJ6';
export const REST = 'https://nenmkmtvjremqphfqnfw.supabase.co/rest/v1';
export const AUTH_HOST = 'https://nenmkmtvjremqphfqnfw.supabase.co/auth/v1';
export const BILLING = 'https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/navego-billing';
export const UPDATE_FN = 'https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/navego-update';

const ACCESS_KEY = 'navego-access-token';
const REFRESH_KEY = 'navego-refresh-token';
const RETURNABLE = /^\.\/[A-Za-z0-9._~/?=&%-]*$/;

// ?next is attacker-controllable, so only same-site relative paths pass.

// The site runs in a browser, and this module is also read by the Node test project, which has no DOM lib; the cast names the two globals it needs.

type LockManagerLike = { request: (name: string, run: () => Promise<string | null>) => Promise<string | null> };
const browserGlobals = globalThis as {
  location?: { search?: string };
  navigator?: { locks?: LockManagerLike };
};

export function getReturnTo(): string {
  const asked = new URLSearchParams(browserGlobals.location?.search ?? '').get('next') || '';
  return RETURNABLE.test(asked) ? asked : './dashboard.html';
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(ACCESS_KEY, token);
    else localStorage.removeItem(ACCESS_KEY);
  } catch {
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function storeRefreshToken(token: string | null) {
  try {
    if (token) localStorage.setItem(REFRESH_KEY, token);
    else localStorage.removeItem(REFRESH_KEY);
  } catch {
  }
}

export function clearSession() {
  storeToken(null);
  storeRefreshToken(null);
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
  return { email: user.email };
}

// offline and refusal differ here: a network failure says nothing about the account and must not clear a stored session; only a refused refresh token is death.

// decisions.json -> site-auth-01

// A refresh token rotates, so two refreshes at once turn the second one into a stolen-token refusal that clears the session.

const REFRESH_LOCK = 'navego-token-refresh';

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
  const renewed = await response.json().catch(() => null) as { access_token?: unknown; refresh_token?: unknown } | null;
  if (typeof renewed?.access_token !== 'string' || renewed.access_token.length === 0) return null;
  storeToken(renewed.access_token);
  if (typeof renewed.refresh_token === 'string' && renewed.refresh_token.length > 0) storeRefreshToken(renewed.refresh_token);
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

export function headersFor(token: string) {
  return { apikey: PUBLISHABLE_KEY, authorization: `Bearer ${token}`, 'content-type': 'application/json' };
}
