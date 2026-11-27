// decisions.json -> site-checkout-intent-03 The sign-in link can open in a new tab, so the plan a buyer picked must live in browser-local storage, not in the tab that opened the link.

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const PENDING_PLAN_KEY = 'navego-checkout-plan';

function browserStorage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function rememberPendingPlan(planKey: string, storage: StorageLike | null = browserStorage()): void {
  try {
    storage?.setItem(PENDING_PLAN_KEY, planKey);
  } catch {
  }
}

export function readPendingPlan(storage: StorageLike | null = browserStorage()): string | null {
  try {
    return storage?.getItem(PENDING_PLAN_KEY) || null;
  } catch {
    return null;
  }
}

export function forgetPendingPlan(storage: StorageLike | null = browserStorage()): void {
  try {
    storage?.removeItem(PENDING_PLAN_KEY);
  } catch {
  }
}
