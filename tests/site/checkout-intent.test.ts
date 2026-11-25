// @last-edited: 2026-11-25 UTC+7.
// @title: checkout-intent.test - a chosen plan and its order survive sign-in and expire only after activation.
// @state: tab storage keeps the chosen card and order, preserves the full return path, and clears only the order that activated.
// @dependencies: node:test, strict, ../../site/app/lib/checkout-intent.ts.

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const modulePath = pathToFileURL(path.join(root, 'site', 'app', 'lib', 'checkout-intent.ts')).href;

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

type IntentModule = {
  rememberPendingPlan: (planKey: string, storage?: StorageLike) => void;
  readPendingPlan: (storage?: StorageLike) => string | null;
  rememberPendingOrder: (orderId: string, storage?: StorageLike) => void;
  readPendingOrderId: (storage?: StorageLike) => string | null;
  completePendingOrder: (orderId: string, storage?: StorageLike) => boolean;
  signInPath: (location: { pathname: string; search: string }) => string;
};

async function intentModule(): Promise<IntentModule> {
  try {
    return await import(modulePath) as IntentModule;
  } catch {
    assert.fail('site/app/lib/checkout-intent.ts must expose the tested pending-plan store');
  }
}

function memoryStore(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); }
  };
}

test('a pending plan and order clear only after the matching order activates', async () => {
  const { rememberPendingPlan, readPendingPlan, rememberPendingOrder, completePendingOrder } = await intentModule();
  const storage = memoryStore();
  rememberPendingPlan('asia:plan.usd-1', storage);
  rememberPendingOrder('ORDER-1', storage);
  assert.equal(readPendingPlan(storage), 'asia:plan.usd-1');
  assert.equal(completePendingOrder('ORDER-OTHER', storage), false, 'a different activation must not clear the pending plan');
  assert.equal(readPendingPlan(storage), 'asia:plan.usd-1');
  assert.equal(completePendingOrder('ORDER-1', storage), true);
  assert.equal(readPendingPlan(storage), null);
});

test('blocked tab storage never breaks the pricing page', async () => {
  const { rememberPendingPlan, readPendingPlan, rememberPendingOrder, completePendingOrder } = await intentModule();
  const blocked: StorageLike = {
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
    removeItem: () => { throw new Error('blocked'); }
  };
  assert.doesNotThrow(() => rememberPendingPlan('asia:plan.usd-1', blocked));
  assert.doesNotThrow(() => rememberPendingOrder('ORDER-1', blocked));
  assert.equal(readPendingPlan(blocked), null);
  assert.equal(completePendingOrder('ORDER-1', blocked), false);
});

test('the sign-in path preserves the complete checkout return, including the order token', async () => {
  const { signInPath } = await intentModule();
  assert.equal(signInPath({ pathname: '/harga', search: '' }), '/?next=%2Fharga');
  assert.equal(
    signInPath({ pathname: '/harga', search: '?checkout=success&token=ORDER-1' }),
    '/?next=%2Fharga%3Fcheckout%3Dsuccess%26token%3DORDER-1'
  );
});