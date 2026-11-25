// @last-edited: 2026-11-24 UTC+7.
// @title: funnel.test - the step is written once, named correctly, and never in the page's way.
// @state: a pageview counts once per session per path, the payload carries the step and the random browser id, and a blocked storage or a failed fetch is silent.
// @dependencies: node:test, strict, ../../site/app/lib/funnel.ts.

import test from 'node:test';
import assert from 'node:assert/strict';

const memory = new Map<string, string>();

const store = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  }
};

const VIEW_KEY = 'navego-funnel-views';
const SENT_KEY = 'navego-funnel-sent';

function readStore(key: string): Record<string, number> {
  return JSON.parse(memory.get(key) ?? '{}') as Record<string, number>;
}

function writeStore(key: string, value: Record<string, number>) {
  memory.set(key, JSON.stringify(value));
}

const sent: Array<{ url: string; body: Record<string, unknown> }> = [];

(globalThis as Record<string, unknown>).localStorage = store;
(globalThis as Record<string, unknown>).location = { pathname: '/harga' };

// Node's crypto is a getter-only global, so the deterministic id is defined over it rather than assigned.

Object.defineProperty(globalThis, 'crypto', { value: { randomUUID: () => 'browser-1' }, configurable: true });
(globalThis as Record<string, unknown>).fetch = async (url: string, init?: { body?: string }) => {
  sent.push({ url, body: JSON.parse(String(init?.body ?? '{}')) });
  return { ok: true, status: 204 } as Response;
};

const { FUNNEL_ENDPOINT, FUNNEL_KEY, track, trackView, currentPath } = await import('../../site/app/lib/funnel.ts');
const { PUBLISHABLE_KEY, REST } = await import('../../site/app/lib/auth.ts');

test('the tracker writes to the same project the rest of the site talks to', () => {
  assert.equal(FUNNEL_ENDPOINT, `${REST}/rpc/opera_funnel_record`);
  assert.equal(FUNNEL_KEY, PUBLISHABLE_KEY);
});

test('a pageview is written once per path per session, and a reload is not a second visitor', () => {
  memory.clear();
  sent.length = 0;
  trackView('/faq');
  trackView('/faq');
  assert.equal(sent.length, 1, 'one write for two reads of the same page');
  const [write] = sent;
  assert.match(write!.url, /\/rest\/v1\/rpc\/opera_funnel_record$/);
  assert.equal(write!.body.p_name, 'page.view');
  assert.equal(write!.body.p_path, '/faq');
  assert.equal(write!.body.p_anon, 'browser-1');
});

test('the landing page reports one page view and one gated install view', () => {
  memory.clear();
  sent.length = 0;
  trackView('/');
  trackView('/');
  assert.deepEqual(
    sent.map((write) => write.body.p_name),
    ['page.view', 'install.view']
  );
  assert.equal(sent[1]?.body.p_path, '/');
  assert.deepEqual(sent[1]?.body.p_meta, { surface: 'landing' });
});

test('the landing install view keeps the same thirty-minute gate as its page view', () => {
  memory.clear();
  sent.length = 0;
  trackView('/');
  sent.length = 0;
  const fourSecondsAgo = Date.now() - 4_000;
  const viewsInsideGate = readStore(VIEW_KEY);
  viewsInsideGate['/'] = Date.now() - 4 * 60_000;
  writeStore(VIEW_KEY, viewsInsideGate);
  const sentInsideGate = readStore(SENT_KEY);
  sentInsideGate['page.view:/'] = fourSecondsAgo;
  sentInsideGate['install.view:/'] = fourSecondsAgo;
  writeStore(SENT_KEY, sentInsideGate);
  trackView('/');
  assert.equal(sent.length, 0, 'a landing reload inside thirty minutes is not a new install view');
  const thirtyOneMinutesAgo = Date.now() - 31 * 60_000;
  const viewsOutsideGate = readStore(VIEW_KEY);
  viewsOutsideGate['/'] = thirtyOneMinutesAgo;
  writeStore(VIEW_KEY, viewsOutsideGate);
  const sentOutsideGate = readStore(SENT_KEY);
  sentOutsideGate['page.view:/'] = thirtyOneMinutesAgo;
  sentOutsideGate['install.view:/'] = thirtyOneMinutesAgo;
  writeStore(SENT_KEY, sentOutsideGate);
  trackView('/');
  assert.deepEqual(
    sent.map((write) => write.body.p_name),
    ['page.view', 'install.view']
  );
});

test('the download page reports both its view and the install step', () => {
  memory.clear();
  sent.length = 0;
  trackView('/unduh');
  assert.deepEqual(
    sent.map((write) => write.body.p_name),
    ['page.view', 'install.view']
  );
});

test('a click carries the step, the artifact and the browser that was clicked', () => {
  memory.clear();
  sent.length = 0;
  track('install.click', { browser: 'brave', artifact: 'crx' });
  assert.equal(sent.length, 1);
  assert.equal(sent[0]!.body.p_name, 'install.click');
  assert.deepEqual(sent[0]!.body.p_meta, { browser: 'brave', artifact: 'crx' });
  assert.equal(currentPath(), '/harga', 'the path is read at send time, not at import time');
});

test('the same step twice inside three seconds is one step', () => {
  memory.clear();
  sent.length = 0;
  track('pair.start', { name: 'browser' });
  track('pair.start', { name: 'browser' });
  assert.equal(sent.length, 1);
});

test('a failed write is caught, because measurement must never break the page it measures', () => {
  memory.clear();
  sent.length = 0;
  (globalThis as Record<string, unknown>).fetch = async () => {
    throw new Error('offline');
  };
  assert.doesNotThrow(() => track('plan.view'));
});
