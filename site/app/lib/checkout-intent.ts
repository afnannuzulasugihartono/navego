// decisions.json -> site-checkout-intent-03

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const PENDING_PLAN_KEY = 'navego-checkout-plan';
const PENDING_ORDER_KEY = 'navego-checkout-order';

function tabStorage(): StorageLike | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}

export function rememberPendingPlan(planKey: string, storage: StorageLike | null = tabStorage()): void {
  try {
    storage?.setItem(PENDING_PLAN_KEY, planKey);
  } catch {
  }
}

export function readPendingPlan(storage: StorageLike | null = tabStorage()): string | null {
  try {
    return storage?.getItem(PENDING_PLAN_KEY) || null;
  } catch {
    return null;
  }
}

export function rememberPendingOrder(orderId: string, storage: StorageLike | null = tabStorage()): void {
  if (!orderId) return;
  try {
    storage?.setItem(PENDING_ORDER_KEY, orderId);
  } catch {
  }
}

export function readPendingOrderId(storage: StorageLike | null = tabStorage()): string | null {
  try {
    return storage?.getItem(PENDING_ORDER_KEY) || null;
  } catch {
    return null;
  }
}

export function completePendingOrder(orderId: string, storage: StorageLike | null = tabStorage()): boolean {
  if (!orderId || readPendingOrderId(storage) !== orderId) return false;
  try {
    storage?.removeItem(PENDING_ORDER_KEY);
    storage?.removeItem(PENDING_PLAN_KEY);
    return true;
  } catch {
    return false;
  }
}

export function signInPath(location: { pathname: string; search: string }): string {
  return `/?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`;
}
