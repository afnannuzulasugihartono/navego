// Navego's client-side auth + API helpers.
// No SDK, no secrets: the publishable key is public by design, the session lives in this browser's localStorage, and every call that carries identity goes to the project's Auth or REST host only.

export const PUBLISHABLE_KEY = 'sb_publishable_jAbS_QIQsmXQA-Rj8RWPcg_JVeBedJ6';
export const REST = 'https://nenmkmtvjremqphfqnfw.supabase.co/rest/v1';
export const AUTH_HOST = 'https://nenmkmtvjremqphfqnfw.supabase.co/auth/v1';
export const BILLING = 'https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/opera-agent-billing';
export const UPDATE_FN = 'https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/opera-agent-update';

const ACCESS_KEY = 'opera-agent-access-token';
const REFRESH_KEY = 'opera-agent-refresh-token';
const RETURNABLE = /^\.\/[A-Za-z0-9._~/?=&%-]*$/;

// WHY: ?next is attacker-controllable; only same-site relative paths pass.

export function getReturnTo(): string {
  const asked = new URLSearchParams(window.location.search).get('next') || '';
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
  const user = await response.json();
  const refreshed = user?.session?.refresh_token;
  if (refreshed) storeRefreshToken(refreshed);
  if (!user?.email) return { error: 'tanpa-email' };
  return { email: user.email as string };
}

// WHY offline and refusal differ: a network failure says nothing about the account and must not clear a stored session; only a refused refresh token is death.

export async function renewAccessToken(): Promise<string | null> {
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
  const renewed = await response.json().catch(() => null);
  if (!renewed?.access_token) return null;
  storeToken(renewed.access_token);
  if (renewed.refresh_token) storeRefreshToken(renewed.refresh_token);
  return renewed.access_token as string;
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
