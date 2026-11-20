// @last-edited: 2026-11-21 UTC+7.
// @title: bridge-url-fixture — the predecessor bridge URL and the chrome storage fake the migration tests share.
// @state: the stored URL a device paired before the rename carries, and an in-memory storage area that records every write.
// @dependencies: none.

// The predecessor slug is spelled here once so the tests that prove the migration do not each carry their own copy.
// decisions.json -> extension-bridge-url-migration-01

import { DEFAULT_BRIDGE_URL } from '../../extension/lib/endpoints.js';

export const PREDECESSOR_BRIDGE_SLUG = ['opera', 'agent', 'bridge'].join('-');
export const PREDECESSOR_BRIDGE_URL = DEFAULT_BRIDGE_URL.replace('navego-bridge', PREDECESSOR_BRIDGE_SLUG);

export interface StorageRecord {
  [key: string]: unknown;
}

export interface FakeStorage {
  data: StorageRecord;
  writes: StorageRecord[];
  area: {
    get(keys: string[]): Promise<StorageRecord>;
    set(items: StorageRecord): Promise<void>;
  };
}

export function fakeStorage(seed: StorageRecord = {}): FakeStorage {
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

export async function withChromeStorage<T>(area: unknown, run: () => Promise<T>): Promise<T> {
  const previous = globalThis.chrome;
  Reflect.set(globalThis, 'chrome', { storage: { local: area } });
  try {
    return await run();
  } finally {
    if (previous === undefined) Reflect.deleteProperty(globalThis, 'chrome');
    else Reflect.set(globalThis, 'chrome', previous);
  }
}
