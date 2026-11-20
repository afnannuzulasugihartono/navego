// @last-edited: 2026-11-21 UTC+7.
// @title: bridge-url-migration.test — a paired device leaves the predecessor bridge deployment once.
// @state: the worker config reader's bridge URL migration and its persistence in local storage.
// @dependencies: node:test, strict, worker/utils.

// The worker owns the one-time persistence of the compatibility rewrite; the Options page only reads the normalized value.

import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_BRIDGE_URL } from '../../extension/lib/endpoints.js';
import { getConfig } from '../../extension/worker/utils.js';

type StorageRecord = Record<string, unknown>;

const PREDECESSOR_BRIDGE_SLUG = ['opera', 'agent', 'bridge'].join('-');
const PREDECESSOR_BRIDGE_URL = DEFAULT_BRIDGE_URL.replace('navego-bridge', PREDECESSOR_BRIDGE_SLUG);

function storageWith(seed: StorageRecord = {}) {
  const data: StorageRecord = { ...seed };
  const writes: StorageRecord[] = [];
  return {
    data,
    writes,
    area: {
      async get(keys: string[]) {
        const result: StorageRecord = {};
        for (const key of keys) result[key] = data[key];
        return result;
      },
      async set(items: StorageRecord) {
        writes.push({ ...items });
        Object.assign(data, items);
      }
    }
  };
}

function withChrome<T>(area: unknown, run: () => Promise<T>): Promise<T> {
  const previous = globalThis.chrome;
  Reflect.set(globalThis, 'chrome', { storage: { local: area } });
  return run().finally(() => {
    if (previous === undefined) Reflect.deleteProperty(globalThis, 'chrome');
    else Reflect.set(globalThis, 'chrome', previous);
  });
}

test('the worker migrates and persists a predecessor bridge URL', async () => {
  const storage = storageWith({ bridgeUrl: PREDECESSOR_BRIDGE_URL });
  const config = await withChrome(storage.area, getConfig);
  assert.equal(config.bridgeUrl, DEFAULT_BRIDGE_URL);
  assert.deepEqual(storage.writes, [{ bridgeUrl: DEFAULT_BRIDGE_URL }]);
  assert.equal(storage.data.bridgeUrl, DEFAULT_BRIDGE_URL);

  const nextConfig = await withChrome(storage.area, getConfig);
  assert.equal(nextConfig.bridgeUrl, DEFAULT_BRIDGE_URL);
  assert.deepEqual(storage.writes, [{ bridgeUrl: DEFAULT_BRIDGE_URL }]);
});

test('the worker leaves current and custom bridge URLs unchanged and writes nothing', async () => {
  for (const bridgeUrl of [DEFAULT_BRIDGE_URL, 'https://bridge.example/custom']) {
    const storage = storageWith({ bridgeUrl });
    const config = await withChrome(storage.area, getConfig);
    assert.equal(config.bridgeUrl, bridgeUrl);
    assert.deepEqual(storage.writes, []);
  }
});

test('the worker does not rewrite a predecessor slug without a path prefix', async () => {
  const bridgeUrl = `https://${PREDECESSOR_BRIDGE_SLUG}`;
  const storage = storageWith({ bridgeUrl });
  const config = await withChrome(storage.area, getConfig);
  assert.equal(config.bridgeUrl, bridgeUrl);
  assert.deepEqual(storage.writes, []);
});
