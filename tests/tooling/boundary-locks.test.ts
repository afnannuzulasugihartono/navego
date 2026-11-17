// @last-edited: 2026-10-09 UTC+7.
// @title: boundary-locks — every frozen hash is checked, not just the public surface.
// @state: pins the three lock arrays exported by helpers/boundary-locks.ts; a stale hash fails here instead of drifting silently.
// @dependencies: node:test, strict, node:crypto, promises, helpers/boundary-locks.ts.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  PUBLIC_SURFACE_LOCKS,
  OBSERVATION_STACK_LOCKS,
  RELEVANCE_STACK_LOCKS,
} from '../helpers/boundary-locks.ts';

function sha256Blob(bytes: Buffer) {

  const content = Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
  return createHash('sha256').update(Buffer.from(`blob ${content.length}\0`)).update(content).digest('hex');
}

const pairsOf = (locks: readonly string[][]): Array<[string, string]> => {
  const out: Array<[string, string]> = [];
  for (const pair of locks) {
    const [relativePath, expected] = pair;
    assert.ok(typeof relativePath === 'string' && typeof expected === 'string', 'each lock carries a path and a hash');
    out.push([relativePath, expected]);
  }
  return out;
};

const cases: Array<[string, readonly string[][], number]> = [
  ['public surface', PUBLIC_SURFACE_LOCKS, 3],
  ['observation stack', OBSERVATION_STACK_LOCKS, 3],
  ['relevance stack', RELEVANCE_STACK_LOCKS, 2],
];

for (const [label, locks, expectedSize] of cases) {
  test(`${label} pins stay byte-for-byte unchanged`, async () => {
    assert.equal(locks.length, expectedSize,
      `${label} lock lost or gained an entry; update this count deliberately, never by deletion`);
    for (const [relativePath, expected] of new Map<string, string>(pairsOf(locks))) {
      const bytes = await readFile(new URL(relativePath.replace(/^\.\.\//, '../../'), import.meta.url));
      assert.equal(sha256Blob(bytes), expected, `${relativePath} must remain byte-for-byte unchanged`);
    }
  });
}
