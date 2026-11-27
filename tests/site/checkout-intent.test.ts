// @last-edited: 2026-11-28 UTC+7.
// @title: checkout-intent.test - a chosen plan survives sign-in, including a magic link opened in a new tab.
// @state: one pending plan key is remembered in browser-local storage, read on return, and cleared after an order opens.
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

test('the pending plan survives a magic link that opens a new tab', async () => {
  const { rememberPendingPlan, readPendingPlan } = await intentModule();
  const local = memoryStore();
  const tab = memoryStore();
  (globalThis as unknown as { localStorage: StorageLike }).localStorage = local;
  (globalThis as unknown as { sessionStorage: StorageLike }).sessionStorage = tab;
  try {
    rememberPendingPlan('asia:plan.usd-3');
    assert.equal(local.getItem('navego-checkout-plan'), 'asia:plan.usd-3', 'stored where a new tab can read it');
    assert.equal(tab.getItem('navego-checkout-plan'), null, 'not trapped in the original tab');
    assert.equal(readPendingPlan(), 'asia:plan.usd-3', 'the return tab reads the chosen plan');
  } finally {
    delete (globalThis as unknown as { localStorage?: StorageLike }).localStorage;
    delete (globalThis as unknown as { sessionStorage?: StorageLike }).sessionStorage;
  }
});
