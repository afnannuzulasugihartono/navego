// decisions.json -> site-checkout-intent-03

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

type PendingIntent = {
  planKey: string | null;
  orderId: string | null;
};

const PENDING_INTENT_KEY = 'navego-checkout-intent';

function intentStorage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function readIntent(storage: StorageLike | null): PendingIntent | null {
  try {
    const raw = storage?.getItem(PENDING_INTENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed as PendingIntent : null;
  } catch {
    return null;
  }
}

function writeIntent(intent: PendingIntent, storage: StorageLike | null): void {
  try {
    storage?.setItem(PENDING_INTENT_KEY, JSON.stringify(intent));
  } catch {
  }
}

export function rememberPendingPlan(planKey: string, storage: StorageLike | null = intentStorage()): void {
  writeIntent({ planKey, orderId: null }, storage);
}

export function rememberPendingOrder(orderId: string, storage: StorageLike | null = intentStorage()): void {
  if (!orderId) return;
  const current = readIntent(storage) ?? { planKey: null, orderId: null };
  writeIntent({ ...current, orderId }, storage);
}

export function readPendingPlan(storage: StorageLike | null = intentStorage()): string | null {
  return readIntent(storage)?.planKey ?? null;
}

export function readPendingOrderId(storage: StorageLike | null = intentStorage()): string | null {
  return readIntent(storage)?.orderId ?? null;
}

export function completePendingOrder(orderId: string, storage: StorageLike | null = intentStorage()): boolean {
  if (!orderId || readPendingOrderId(storage) !== orderId) return false;
  try {
    storage?.removeItem(PENDING_INTENT_KEY);
    return true;
  } catch {
    return false;
  }
}

export function signInPath(location: { pathname: string; search: string }): string {
  return `/?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`;
}
