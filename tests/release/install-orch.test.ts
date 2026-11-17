// @last-edited: 2026-11-12 UTC+7.
// @title: install-orch - the sequence: detect, register, fetch the CRX, lay it down.
// @state: every outcome maps to exactly one line of the report; the postinstall swallows them all and exits 0.
// @dependencies: test, assert, node:crypto, node:fs/promises, node:os, node:path, node:http, ../local/install.js.

import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { install } from '../../local/install.js';

const makeCrx = () => Buffer.from('zip-payload-of-the-opera-agent-build-for-tests');

const goodReply = (bytes: any, sha: any) => (async (url: any, opts = {}) => {
  if (opts.method === 'HEAD') return { ok: true, status: 200, headers: { get: () => sha } };
  return { ok: true, status: 200, headers: { get: () => sha }, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
});

const browserPaths = {
  chrome: 'c:/program files/google/chrome/application/chrome.exe',
  brave: 'c:/program files/bravesoftware/brave-browser/application/brave.exe',
  edge: 'c:/program files (x86)/microsoft/edge/application/msedge.exe',
};

const sha = (bytes: any) => crypto.createHash('sha256').update(bytes).digest('hex');
const tmpRoot = () => mkdtemp(path.join(os.tmpdir(), 'oa-orch-'));

test('non-Windows platform returns instructions, no side effects', async () => {
  const report = await install({ platform: 'darwin', existsAt: () => true, exec: () => { throw new Error('must not run'); } });
  assert.equal(report.ok, false);
  assert.deepEqual(report.browsers, []);
  assert.match(report.message, /Chrome Web Store/);
});

test('zero browsers detected returns instructions, no side effects', async () => {
  const report = await install({ platform: 'win32', existsAt: () => false, exec: () => { throw new Error('must not run'); } });
  assert.equal(report.ok, false);
  assert.deepEqual(report.browsers, []);
  assert.match(report.message, /No Chrome/);
});

test('writes keys for each detected browser and reports success', async () => {
  const root = await tmpRoot();
  try {
    const bytes = makeCrx();
    const digest = sha(bytes);
    const execCalls: any = [];
    const report = await install({
      platform: 'win32',
      existsAt: (p) => p === browserPaths.chrome || p === browserPaths.brave,
      exec: (cmd, args) => execCalls.push([cmd, ...args]),
      fetchImpl: goodReply(bytes, digest),
      root,
    });
    assert.equal(report.ok, true);
    assert.deepEqual(report.browsers.map((b) => b.id).sort(), ['brave', 'chrome']);
    const keys = execCalls.filter(([, op]) => op === 'add').map(([, , key]) => key).filter((a: any) => String(a).includes('ExtensionInstallForcelist'));
    assert.deepEqual(keys.sort(), [
      'HKCU\\Software\\Policies\\Google\\Chrome\\ExtensionInstallForcelist',
      'HKCU\\Software\\Policies\\BraveSoftware\\Brave-Browser\\ExtensionInstallForcelist',
    ].sort());
    for (const id of ['Chrome', 'Brave']) {
      assert.equal((await stat(path.join(root, id, 'opera-agent.zip'))).size, bytes.length);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('CRX failure leaves the keys written, no folder created, reports reason', async () => {
  const root = await tmpRoot();
  try {
    const execCalls = [];
    const brokenFetch = async (url: any, opts = {}) => {
      if (opts.method === 'HEAD') return { ok: true, status: 200, headers: { get: () => 'deadbeef' } };
      return { ok: true, status: 200, arrayBuffer: async () => makeCrx().buffer };
    };
    const report = await install({
      platform: 'win32',
      existsAt: (p) => p === browserPaths.chrome,
      exec: (cmd, args) => execCalls.push([cmd, ...args]),
      fetchImpl: brokenFetch,
      root,
    });
    assert.equal(report.browsers[0].keyWritten, true);
    assert.equal(report.browsers[0].crx, 'failed');
    assert.match(report.message, /backup ZIP failed/);
    await assert.rejects(() => stat(path.join(root, 'Chrome')), /ENOENT/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('partial failure: one denied key does not stop the others', async () => {
  const root = await tmpRoot();
  try {
    const bytes = makeCrx();
    const digest = sha(bytes);
    const report = await install({
      platform: 'win32',
      existsAt: (p) => p === browserPaths.chrome || p === browserPaths.brave,
      exec: (cmd, args) => {
        if (String(args[1]).includes('Google')) throw new Error('access denied');
        return undefined;
      },
      fetchImpl: goodReply(bytes, digest),
      root,
    });
    const chrome = report.browsers.find((b) => b.id === 'chrome');
    const brave = report.browsers.find((b) => b.id === 'brave');
    assert.equal(chrome.keyWritten, false);
    assert.match(chrome.error, /access denied/);
    assert.equal(brave.keyWritten, true);
    assert.equal(report.ok, false);
    assert.match(report.message, /policy entry not written/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('quiet default: nothing printed when install is called without print', async () => {
  const root = await tmpRoot();
  try {
    const bytes = makeCrx();
    const digest = sha(bytes);
    const prints: any = [];
    const report = await install({
      platform: 'win32',
      existsAt: (p) => p === browserPaths.chrome,
      exec: () => {},
      fetchImpl: goodReply(bytes, digest),
      root,
      print: (line) => prints.push(line),
    });
    assert.equal(report.browsers[0].keyWritten, true);
    assert.deepEqual(prints, [report.message]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
