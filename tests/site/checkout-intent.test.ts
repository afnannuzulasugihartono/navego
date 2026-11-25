// @last-edited: 2026-11-25 UTC+7.
// @title: checkout-intent.test - a chosen plan survives the sign-in round trip in this tab.
// @state: one pending plan key is remembered, read once the session returns, and cleared after an order opens.
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
  forgetPendingPlan: (storage?: StorageLike) => void;
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

test('a pending plan is remembered and cleared after the order opens', async () => {
  const { rememberPendingPlan, readPendingPlan, forgetPendingPlan } = await intentModule();
  const storage = memoryStore();
  rememberPendingPlan('asia:plan.usd-1', storage);
  assert.equal(readPendingPlan(storage), 'asia:plan.usd-1');
  forgetPendingPlan(storage);
  assert.equal(readPendingPlan(storage), null);
});

test('blocked tab storage never breaks the pricing page', async () => {
  const { rememberPendingPlan, readPendingPlan, forgetPendingPlan } = await intentModule();
  const blocked: StorageLike = {
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
    removeItem: () => { throw new Error('blocked'); }
  };
  assert.doesNotThrow(() => rememberPendingPlan('asia:plan.usd-1', blocked));
  assert.equal(readPendingPlan(blocked), null);
  assert.doesNotThrow(() => forgetPendingPlan(blocked));
});