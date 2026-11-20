// @last-edited: 2026-11-21 UTC+7.
// @title: bridge-url-migration.test — a paired device leaves the predecessor bridge deployment once.
// @state: the worker config reader's bridge URL migration and its persistence in local storage.
// @dependencies: node:test, strict, worker/utils, bridge-url-fixture.

// The worker owns the one-time persistence of the compatibility rewrite; the Options page only reads the normalized value.

import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_BRIDGE_URL } from '../../extension/lib/endpoints.js';
import { getConfig } from '../../extension/worker/utils.js';
import { fakeStorage, PREDECESSOR_BRIDGE_SLUG, PREDECESSOR_BRIDGE_URL, withChromeStorage } from '../helpers/bridge-url-fixture.ts';

test('the worker migrates and persists a predecessor bridge URL', async () => {
  const storage = fakeStorage({ bridgeUrl: PREDECESSOR_BRIDGE_URL });
  const config = await withChromeStorage(storage.area, getConfig);
  assert.equal(config.bridgeUrl, DEFAULT_BRIDGE_URL);
  assert.deepEqual(storage.writes, [{ bridgeUrl: DEFAULT_BRIDGE_URL }]);
  assert.equal(storage.data.bridgeUrl, DEFAULT_BRIDGE_URL);

  const nextConfig = await withChromeStorage(storage.area, getConfig);
  assert.equal(nextConfig.bridgeUrl, DEFAULT_BRIDGE_URL);
  assert.deepEqual(storage.writes, [{ bridgeUrl: DEFAULT_BRIDGE_URL }]);
});

test('the worker leaves current and custom bridge URLs unchanged and writes nothing', async () => {
  for (const bridgeUrl of [DEFAULT_BRIDGE_URL, 'https://bridge.example/custom']) {
    const storage = fakeStorage({ bridgeUrl });
    const config = await withChromeStorage(storage.area, getConfig);
    assert.equal(config.bridgeUrl, bridgeUrl);
    assert.deepEqual(storage.writes, []);
  }
});

test('the worker does not rewrite a predecessor slug without a path prefix', async () => {
  for (const bridgeUrl of [PREDECESSOR_BRIDGE_SLUG, `https://${PREDECESSOR_BRIDGE_SLUG}`]) {
    const storage = fakeStorage({ bridgeUrl });
    const config = await withChromeStorage(storage.area, getConfig);
    assert.equal(config.bridgeUrl, bridgeUrl);
    assert.deepEqual(storage.writes, []);
  }
});
