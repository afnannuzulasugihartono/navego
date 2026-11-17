// @last-edited: 2026-11-15 UTC+7.
// @title: registry - the one place a policy gets written, and the one it removes.
// @state: HKCU only; a failing registry must not take the process down with it.
// @dependencies: test, assert, ../local/registry.js.

import test from 'node:test';
import assert from 'node:assert/strict';
import { writeExtensionKey, deleteExtensionKey, parseForcelistEntries, EXTENSION_ID, UPDATE_URL } from '../../local/registry.js';

const KEYS = {
  chrome: 'HKCU\\Software\\Policies\\Google\\Chrome\\ExtensionInstallForcelist',
  brave: 'HKCU\\Software\\Policies\\BraveSoftware\\Brave-Browser\\ExtensionInstallForcelist',
  edge: 'HKCU\\Software\\Policies\\Microsoft\\Edge\\ExtensionInstallForcelist',
};

const ENTRY = `${EXTENSION_ID};${UPDATE_URL}`;
const queryOut = (entries: Array<[number, string]>) => entries.map(([number, data]) => `    ${number}    REG_SZ    ${data}`).join('\r\n');
const absent = () => { const e = new Error('Unable to find the specified registry key.') as Error & { status: number }; e.status = 1; throw e; };

test('fresh machine: writes value 1 for each vendor, nothing deleted', () => {
  for (const [vendor, key] of Object.entries(KEYS)) {
    const calls: string[][] = [];
    const result = writeExtensionKey({ vendor, exec: (cmd, args) => { calls.push([cmd, ...args]); if (args[0] === 'query') absent(); return ''; } });
    assert.equal(result.ok, true, vendor);
    assert.equal(result.value, '1');
    assert.deepEqual(calls[0], ['reg', 'query', key]);
    assert.deepEqual(calls[calls.length - 1], ['reg', 'add', key, '/v', '1', '/t', 'REG_SZ', '/d', ENTRY, '/f'], vendor);
  }
});

test('a foreign entry keeps its number; ours takes the next free one', () => {
  const calls: string[][] = [];
  const result = writeExtensionKey({
    vendor: 'chrome',
    exec: (cmd, args) => {
      calls.push([cmd, ...args]);
      if (args[0] === 'query') return queryOut([[1, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1;https://example.com/ext.crx']]);
      return '';
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.value, '2');
  const deletes = calls.filter(([, op]) => op === 'delete');
  assert.deepEqual(deletes, [], 'the foreign entry must not be touched');
  assert.ok(calls.some(([, op, key, v]) => op === 'add' && v === '/v' && key === KEYS.chrome));
});

test('re-converges: own stale entry is deleted and rewritten at the next free number', () => {
  const calls: string[][] = [];
  const result = writeExtensionKey({
    vendor: 'edge',
    exec: (cmd, args) => {
      calls.push([cmd, ...args]);
      if (args[0] === 'query') return queryOut([[1, 'foreign-id;https://example.com/other.crx'], [3, ENTRY]]);
      return '';
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.value, '2');
  assert.ok(calls.some(([, op, key, , number]) => op === 'delete' && key === KEYS.edge && number === '3'), 'own stale entry deleted');
  assert.ok(calls.some(([, op, key, , number]) => op === 'add' && key === KEYS.edge && number === '2'), 'entry rewritten at next free number');
});

test('parseForcelistEntries reads CRLF output and ignores junk lines', () => {
  const out = 'HKEY_CURRENT_USER\\Software\\Policies\\Google\\Chrome\\ExtensionInstallForcelist\r\n\r\n    1    REG_SZ    first;value\r\n    12    REG_SZ    second;value\r\noops\r\n';
  assert.deepEqual(parseForcelistEntries(out), [
    { number: 1, data: 'first;value' },
    { number: 12, data: 'second;value' },
  ]);
});

test('chromeForTesting has no policy path - unknown vendor, nothing executed', () => {
  const calls: string[] = [];
  const result = writeExtensionKey({ vendor: 'chromeForTesting', exec: (cmd) => { calls.push(cmd); return ''; } });
  assert.equal(result.ok, false);
  assert.ok(result.error);
  assert.match(result.error, /unknown vendor/);
  assert.deepEqual(calls, []);
});

test('unknown vendor fails cleanly, nothing executed', () => {
  const calls: string[] = [];
  const result = writeExtensionKey({ vendor: 'firefox', exec: (cmd) => { calls.push(cmd); return ''; } });
  assert.equal(result.ok, false);
  assert.ok(result.error);
  assert.match(result.error, /unknown vendor/);
  assert.deepEqual(calls, []);
});

test('add failure returns ok:false with the message, foreign entries untouched', () => {
  const calls: string[][] = [];
  const result = writeExtensionKey({
    vendor: 'brave',
    exec: (cmd, args) => {
      calls.push([cmd, ...args]);
      if (args[0] === 'query') return '';
      throw new Error('access denied');
    },
  });
  assert.equal(result.ok, false);
  assert.ok(result.error);
  assert.match(result.error, /access denied/i);
  assert.equal(calls.filter(([, op]) => op === 'delete').length, 0);
});

test('uninstall deletes exactly our entries, never a foreign one', () => {
  const calls: string[][] = [];
  const result = deleteExtensionKey({
    vendor: 'chrome',
    exec: (cmd, args) => {
      calls.push([cmd, ...args]);
      if (args[0] === 'query') return queryOut([[1, 'foreign-id;https://example.com/other.crx'], [2, ENTRY], [7, ENTRY]]);
      return '';
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.deleted, 2);
  const deletes = calls.filter(([, op]) => op === 'delete').map(([, , , , number]) => number);
  assert.deepEqual(deletes, ['2', '7']);
});

test('uninstall with the key absent is a clean no-op', () => {
  const result = deleteExtensionKey({ vendor: 'edge', exec: absent });
  assert.equal(result.ok, true);
  assert.equal(result.deleted, 0);
});

test('unknown vendor on delete fails cleanly, nothing executed', () => {
  const calls: string[] = [];
  const result = deleteExtensionKey({ vendor: 'safari', exec: (cmd) => { calls.push(cmd); return ''; } });
  assert.equal(result.ok, false);
  assert.ok(result.error);
  assert.match(result.error, /unknown vendor/);
  assert.deepEqual(calls, []);
});

test('extension id is the pinned one', () => assert.equal(EXTENSION_ID, 'ofgemipoobcnbjkfanmofjbdonjapmgl'));
