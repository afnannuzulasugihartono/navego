// @last-edited: 2026-11-20 UTC+7.
// @title: swallowed-errors - every failure the product ignores is named, counted and frozen.
// @state: the known sites in tests/tooling/swallowed-errors.lock, one line each with the reason the failure is ignored.
// @dependencies: node:test, strict, node:fs, node:path, node:child_process.

// A caught-and-ignored failure is sometimes the right thing to do: a socket that is already closed, a recorder that already stopped, a stylesheet the page does not let us read.
// What is not acceptable is doing it silently, where the next reader cannot tell a deliberate choice from an oversight.
// So every empty catch in product code is listed here with the reason it exists, and the list can only shrink.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const LOCK = join(root, 'tests', 'tooling', 'swallowed-errors.lock');
const PRODUCT_DIRS = ['shared', 'local', 'extension', 'hosted/functions'];

interface Site {
  file: string;
  key: string;
  reason: string;
}

// The key is the code the catch belongs to, not its line number: a line number moves with every edit above it, a statement does not.
const siteKey = (file: string, lines: string[], index: number): string => {
  const line = (lines[index] ?? '').trim();
  const inline = /try\s*\{[^}]*\}\s*catch\s*(\([^)]*\))?\s*\{\s*\}/.exec(line);
  if (inline) return `${file} :: ${inline[0].replace(/\s+/g, ' ')}`;
  let body = index;
  while (body > 0 && (lines[body] ?? '').trim() === '') body -= 1;
  const opening = (lines[body] ?? '').trim();
  return `${file} :: ${opening.replace(/\s+/g, ' ')} :: ${line.replace(/\s+/g, ' ')}`;
};

const sitesIn = (file: string, body: string): Site[] => {
  const lines = body.split(/\r?\n/);
  const sites: Site[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const text = (lines[i] ?? '').trim();
    if (!/catch\s*(\([^)]*\))?\s*\{/.test(text)) continue;
    const inline = /catch\s*(\([^)]*\))?\s*\{\s*\}/.exec(text);
    if (inline) {
      sites.push({ file, key: siteKey(file, lines, i), reason: '' });
      continue;
    }
    const opens = /catch\s*(\([^)]*\))?\s*\{\s*$/.exec(text);
    if (!opens) continue;
    let j = i + 1;
    while (j < lines.length && (lines[j] ?? '').trim() === '') j += 1;
    if ((lines[j] ?? '').trim() === '}') sites.push({ file, key: siteKey(file, lines, i), reason: '' });
  }
  return sites;
};

const tracked = (): string[] => execFileSync('git', ['-C', root, 'ls-files', '-z'], { encoding: 'utf8' })
  .split('\u0000')
  .filter((path) => path.length > 0)
  .filter((path) => path.endsWith('.ts'))
  .filter((path) => PRODUCT_DIRS.some((dir) => path.startsWith(dir + '/')));

const inTree = (): Site[] => tracked().flatMap((file) => sitesIn(file, readFileSync(join(root, file), 'utf8')));

const inLock = (): Site[] => readFileSync(LOCK, 'utf8')
  .split(/\r?\n/)
  .filter((line) => line.trim().length > 0 && !line.trimStart().startsWith('#'))
  .map((line) => {
    const parts = line.split(' :: ');
    return { file: parts[0] ?? '', key: parts.slice(0, -1).join(' :: '), reason: parts[parts.length - 1] ?? '' };
  });

test('every failure the product ignores is listed with the reason it is ignored', () => {
  const tree = inTree();
  const lock = inLock();
  const listed = new Set(lock.map((site) => site.key));

  const unlisted = tree.filter((site) => !listed.has(site.key));
  assert.deepEqual(unlisted.map((site) => site.key), [],
    'these failures are ignored without a reason; add them to tests/tooling/swallowed-errors.lock with the reason, or stop ignoring them');
});

test('every listed failure still exists, so the list cannot excuse a failure that is gone', () => {
  const tree = new Set(inTree().map((site) => site.key));
  const stale = inLock().filter((site) => !tree.has(site.key));
  assert.deepEqual(stale.map((site) => site.key), [],
    'these entries name a failure the tree no longer has; remove them from the lock');
});

test('every listed reason says why the failure may be ignored', () => {
  const thin = inLock().filter((site) => site.reason.trim().length < 20);
  assert.deepEqual(thin.map((site) => site.key), [],
    'a reason that says nothing is not a reason');
});
