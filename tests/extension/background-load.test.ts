// @last-edited: 2026-10-09 UTC+7.
// @title: background-load â€” the service worker graph actually loads.
// @state: imports the real extension/background.js under a chrome mock; the only test that can catch a broken export, a severed import, or an import cycle that will not evaluate.
// @dependencies: node:test, strict, extension/background.js.

import test from 'node:test';
import assert from 'node:assert/strict';

type ChromeListener = (...args: unknown[]) => unknown;
const listeners: Record<string, ChromeListener[]> = {};
function event(name: string) {
  const fns: ChromeListener[] = [];
  listeners[name] = fns;
  return {
    addListener: (fn: ChromeListener) => { fns.push(fn); },
    removeListener: (fn: ChromeListener) => {
      const i = fns.indexOf(fn); if (i >= 0) fns.splice(i, 1);
    },
  };
}

function listenerCount(name: string): number {
  const fns = listeners[name];
  assert.ok(fns, `${name} has a listener bucket`);
  return fns.length;
}

Reflect.set(globalThis, 'chrome', {
  debugger: { onDetach: event('debugger.onDetach') },
  tabs: {
    onCreated: event('tabs.onCreated'),
    onRemoved: event('tabs.onRemoved'),
    onUpdated: event('tabs.onUpdated'),
    onActivated: event('tabs.onActivated'),
  },
  runtime: {
    onMessage: event('runtime.onMessage'),
    onMessageExternal: event('runtime.onMessageExternal'),
    onInstalled: event('runtime.onInstalled'),
    onStartup: event('runtime.onStartup'),
  },
  alarms: {
    onAlarm: event('alarms.onAlarm'),
    create: async () => {},
  },
  storage: {
    onChanged: event('storage.onChanged'),
    local: { get: async () => ({}), set: async () => {} },
  },
});

// the loop is stopped before the file ends.
// Importing the worker graph is what starts the bridge poll, and a poll that keeps asking a port nobody is listening on keeps this process alive forever.
// The production loop is the point; in a test it is only something to switch off again.

const { stopBridgeLink } = await import('../../extension/worker/bridge-link.js');

test('the service worker module graph evaluates without throwing', async () => {
  await assert.doesNotReject(() => import('../../extension/background.js'),
    'importing background.js must not throw');
});

test.after(() => stopBridgeLink());

test('the load-time listeners actually registered', () => {

  assert.equal(listenerCount('runtime.onMessage'), 1, 'exactly one onMessage handler');
  assert.equal(listenerCount('tabs.onRemoved'), 3, 'pull, loops and bridge-link all drop their tab state');
  assert.equal(listenerCount('debugger.onDetach'), 1, 'the debugger detach handler registers');
  assert.equal(listenerCount('alarms.onAlarm'), 3, 'wake alarm, the bridge loop guard and the automatic update check');
  assert.equal(listenerCount('tabs.onActivated'), 1, 'the bridge retries sooner when the person switches tab');
  assert.ok(listenerCount('tabs.onCreated') >= 1, 'the tab-drag gate registers');
  assert.ok(listenerCount('runtime.onInstalled') >= 1, 'onInstalled registers');
});
