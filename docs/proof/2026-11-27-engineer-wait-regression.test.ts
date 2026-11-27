// @last-edited: 2026-11-27 UTC+7.
// @title: engineer-wait-regression - a wait that never met its condition cannot claim the page settled.
// @state: text, row, url and stable waits report settled:false when their condition was not met.
// @dependencies: node:test, strict, ../../local/browser-actions.js.

import test from 'node:test';
import assert from 'node:assert/strict';
import { runBrowserAction } from '../../local/browser-actions.js';

const driver = (overrides = {}) => ({
  waitForText: async () => ({ text: 'the list never arrived' }),
  waitForRow: async () => ({ found: false }),
  waitForUrl: async () => ({ found: false, url: 'https://drive.google.com/drive/my-drive' }),
  waitForStill: async () => ({ still: false, checks: 3 }),
  ...overrides
});

const deps = (fake) => ({
  driver: fake,
  driverFor: async () => fake,
  resolvedTab: async () => null,
  afterAction: async (_driver, action) => action,
  sessions: new Map(),
  lease: { release: async () => true },
  owner: 'proof',
  fallback: null,
  browsers: undefined,
  burst: null,
  port: 0
});

test('every wait kind reports settled:false when it timed out', async () => {
  const cases = [
    ['browser_wait_until', { until: 'text', text: 'Download' }, 'found'],
    ['browser_wait_until', { until: 'row', role: 'row', name: 'Download' }, 'found'],
    ['browser_wait_until', { until: 'url', contains: '/file/' }, 'found'],
    ['browser_wait_until', { until: 'stable' }, 'still']
  ];
  for (const [name, args, verdict] of cases) {
    const out = await runBrowserAction(name, args, deps(driver()));
    assert.equal(out.settled, false, `${args.until} may not claim a settled page`);
    assert.equal(out[verdict], false, `${args.until} keeps its found/still verdict`);
  }
});

test('a wait that met its condition still reports settled:true', async () => {
  const hit = driver({
    waitForText: async () => ({ text: 'Download is here' }),
    waitForRow: async () => ({ found: true }),
    waitForUrl: async () => ({ found: true, url: 'https://drive.google.com/file/d/abc' }),
    waitForStill: async () => ({ still: true, checks: 2 })
  });
  for (const args of [
    { until: 'text', text: 'Download' },
    { until: 'row', role: 'row', name: 'Download' },
    { until: 'url', contains: '/file/' },
    { until: 'stable' }
  ]) {
    const out = await runBrowserAction('browser_wait_until', args, deps(hit));
    assert.equal(out.settled, true, `${args.until} that hit still skips a second settle`);
  }
});
