// decisions.json -> site-checkout-intent-03

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const PENDING_PLAN_KEY = 'navego-checkout-plan';

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

export function forgetPendingPlan(storage: StorageLike | null = tabStorage()): void {
  try {
    storage?.removeItem(PENDING_PLAN_KEY);
  } catch {
  }
}
