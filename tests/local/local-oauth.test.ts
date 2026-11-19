// @last-edited: 2026-11-19 UTC+7.
// @title: local-oauth — the loopback callback accepts one request and survives the ones that are not it.
// @state: a stray callback is answered and ignored; the real one resolves; the timeout rejects when none arrives.
// @dependencies: node:test, strict, node:http, ../../local/oauth.js.

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

import { waitForCode } from '../../local/oauth.js';

const request = (port: number, path: string): Promise<{ status: number; body: string }> => new Promise((resolve, reject) => {
  const req = http.get({ host: '127.0.0.1', port, path }, (res) => {
    const chunks: Buffer[] = [];
    res.on('data', (chunk: Buffer) => chunks.push(chunk));
    res.on('end', () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf8') }));
  });
  req.on('error', reject);
});

const listen = () => {
  let announced: (port: number) => void = () => {};
  const ready = new Promise<number>((resolve) => { announced = resolve; });
  return { ready, onListening: (port: number) => announced(port) };
};

test('a stray callback answers 400 and the real one still signs in', async () => {
  const state = 'the-expected-state';
  const { ready, onListening } = listen();
  const result = waitForCode({ url: 'http://127.0.0.1/', state, open: () => {}, port: 0, timeoutMs: 5000, onListening });
  const port = await ready;

  const stray = await request(port, '/mcp/oauth/callback?code=stolen&state=wrong');
  assert.equal(stray.status, 400);
  assert.match(stray.body, /did not match/);

  const right = await request(port, `/mcp/oauth/callback?code=the-code&state=${encodeURIComponent(state)}`);
  assert.equal(right.status, 200);
  assert.equal(await result, 'the-code');
});

test('a callback with no code is refused and the listener keeps waiting', async () => {
  const state = 'kept';
  const { ready, onListening } = listen();
  const result = waitForCode({ url: 'http://127.0.0.1/', state, open: () => {}, port: 0, timeoutMs: 5000, onListening });
  const port = await ready;

  const empty = await request(port, `/mcp/oauth/callback?state=${encodeURIComponent(state)}`);
  assert.equal(empty.status, 400);
  const other = await request(port, '/another/path');
  assert.equal(other.status, 404);

  const right = await request(port, `/mcp/oauth/callback?code=still-here&state=${encodeURIComponent(state)}`);
  assert.equal(right.status, 200);
  assert.equal(await result, 'still-here');
});

test('a login nobody completes rejects at its timeout instead of hanging', async () => {
  const { ready, onListening } = listen();
  const result = waitForCode({ url: 'http://127.0.0.1/', state: 'never', open: () => {}, port: 0, timeoutMs: 20, onListening });
  await ready;
  await assert.rejects(result, /no sign-in completed/);
});
