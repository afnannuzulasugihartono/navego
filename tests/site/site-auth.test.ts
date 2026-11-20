// @last-edited: 2026-11-19 UTC+7.
// @title: site-auth — one renewal per document, one rotation per refresh token.
// @state: concurrent callers share the in-flight refresh; a refused token clears the session; a network failure keeps it.
// @dependencies: node:test, strict, ../../site/app/lib/auth.ts.

import test from 'node:test';
import assert from 'node:assert/strict';

import { renewAccessToken } from '../../site/app/lib/auth.ts';

const ACCESS = 'opera-access-token';
const REFRESH = 'opera-refresh-token';

const withStore = (entries: Record<string, string>) => {
  const store = new Map(Object.entries(entries));
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key)
    }
  });
  return store;
};

const withFetch = (answer: () => Promise<Response>) => {
  const calls: Array<{ url: string; body: string }> = [];
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    value: async (url: string, init: RequestInit) => {
      calls.push({ url: String(url), body: String(init?.body ?? '') });
      return answer();
    }
  });
  return calls;
};

const tokenResponse = () => Promise.resolve(new Response(JSON.stringify({ access_token: 'fresh-access', refresh_token: 'fresh-refresh' }), {
  status: 200,
  headers: { 'content-type': 'application/json' }
}));

test('concurrent callers share one refresh request and one rotation', async () => {
  const store = withStore({ [ACCESS]: 'old-access', [REFRESH]: 'old-refresh' });
  const calls = withFetch(tokenResponse);

  const first = renewAccessToken();
  const second = renewAccessToken();
  assert.equal(first, second, 'the second caller joins the pending renewal instead of starting another');

  assert.deepEqual(await Promise.all([first, second]), ['fresh-access', 'fresh-access']);
  assert.equal(calls.length, 1, 'one refresh token was spent once');
  assert.equal(store.get(ACCESS), 'fresh-access');
  assert.equal(store.get(REFRESH), 'fresh-refresh');
});

test('a refused refresh token clears the session, and a network failure does not', async () => {
  const refused = withStore({ [ACCESS]: 'old-access', [REFRESH]: 'dead-refresh' });
  withFetch(() => Promise.resolve(new Response('{}', { status: 401 })));
  assert.equal(await renewAccessToken(), null);
  assert.equal(refused.get(REFRESH), undefined, 'a refusal is death for the stored session');

  const offline = withStore({ [ACCESS]: 'old-access', [REFRESH]: 'still-good' });
  withFetch(() => Promise.reject(new Error('offline')));
  assert.equal(await renewAccessToken(), null);
  assert.equal(offline.get(REFRESH), 'still-good', 'a network failure says nothing about the account');
});

test('a tab that waited for the lock serves the token another tab already stored', async () => {
  const store = withStore({ [ACCESS]: 'the-old-access', [REFRESH]: 'the-old-refresh' });
  const calls = withFetch(tokenResponse);
  const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      locks: {
        request: async (_name: string, run: () => Promise<string | null>) => {
          store.set(ACCESS, 'renewed-by-another-tab');
          return run();
        }
      }
    }
  });
  try {
    assert.equal(await renewAccessToken(), 'renewed-by-another-tab');
    assert.equal(calls.length, 0, 'this tab did not rotate a refresh token another tab had just replaced');
  } finally {
    if (original) Object.defineProperty(globalThis, 'navigator', original);
  }
});
