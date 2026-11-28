// decisions.json -> site-checkout-guest-01

// THE TOKEN LIVES IN THE BROWSER AND NOT ON THE SERVER.
// The PayPal approval opens in a tab without an opener, and the sign-in link may open in another tab, so a tab-scoped copy never reaches the tab that signs in.
// The token dies with the claim, and the database keeps only its hash.

// THE ENDPOINT AND THE HEADERS COME FROM THE CALLER.
// The publishable key and the REST host live in auth.ts, and this module is also read by the Node test project, which resolves files literally.
// A second copy of the key in this file would be a third source for it and a secret the scanner has to be taught to ignore.

// THE PRICING PAGE SELLS ON THE LIVE PAYPAL RAIL, so the claim looks in the live environment.

export const PAYPAL_ENVIRONMENT = 'live';

export type GuestCheckout = {
  orderId: string;
  token: string;
  plan: string;
  amountCents: number;
  currency: string;
};

export type ClaimAnswer = {
  ok?: boolean;
  error?: string;
  status?: string;
};

const GUEST_KEY = 'navego-guest-checkout';

type StoreLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

// The site runs in a browser and this module is also read by the Node test project, which has no DOM lib.

const globals = globalThis as {
  localStorage?: StoreLike;
  fetch?: typeof fetch;
};

function store(): StoreLike | null {
  try {
    return globals.localStorage ?? null;
  } catch {
    return null;
  }
}

export function rememberGuestCheckout(record: GuestCheckout, target: StoreLike | null = store()): void {
  try {
    target?.setItem(GUEST_KEY, JSON.stringify(record));
  } catch {
  }
}

export function readGuestCheckout(target: StoreLike | null = store()): GuestCheckout | null {
  try {
    const raw = target?.getItem(GUEST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GuestCheckout> | null;
    if (!parsed || typeof parsed.orderId !== 'string' || typeof parsed.token !== 'string') return null;
    if (typeof parsed.plan !== 'string' || !Number.isFinite(Number(parsed.amountCents))) return null;
    return {
      orderId: parsed.orderId,
      token: parsed.token,
      plan: parsed.plan,
      amountCents: Number(parsed.amountCents),
      currency: typeof parsed.currency === 'string' ? parsed.currency : 'USD'
    };
  } catch {
    return null;
  }
}

export function forgetGuestCheckout(target: StoreLike | null = store()): void {
  try {
    target?.removeItem(GUEST_KEY);
  } catch {
  }
}

// THE CLAIM IS THE DATABASE'S DECISION, not the browser's.
// The account comes from the session token in the header, so a browser cannot claim an order for somebody else.

export function claimBody(record: GuestCheckout): Record<string, unknown> {
  return {
    p_environment: PAYPAL_ENVIRONMENT,
    p_order_id: record.orderId,
    p_guest_token: record.token,
    p_plan: record.plan,
    p_amount_cents: record.amountCents,
    p_currency: record.currency
  };
}

export async function claimGuestCheckout(
  record: GuestCheckout,
  endpoint: string,
  headers: Record<string, string>
): Promise<ClaimAnswer> {
  const fetchFn = globals.fetch;
  if (!fetchFn) return { ok: false, error: 'the browser cannot reach the claim' };
  try {
    const response = await fetchFn(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(claimBody(record))
    });
    const answer = await response.json().catch(() => null) as ClaimAnswer | null;
    if (!answer) return { ok: false, error: `HTTP ${response.status}` };
    return answer;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'network' };
  }
}
