// @last-edited: 2026-11-13 UTC+7.
// @title: types-census - the runtime census counts the TypeScript sources, not only the .js.
// @state: a source carries its types beside it in the tree; the census scans the owned file, never the emitted copy.
// The list IS the judge: a gate that cannot see the .ts twins cannot fail on them.
// @dependencies: node:test, assert, child_process, url.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('../..', import.meta.url));
import path from 'node:path';
import fs from 'node:fs';

// THE SPAWN RETRIES ONCE AND THEN DUMPS EVIDENCE.
// A handful of fresh GitHub runner VMs has thrown a census whose spawn lost whole top-level directories between the build step and the test, with no code change anywhere; the gate is right to assert the sources, it just must not say nothing about what it saw.
// One retry separates a fluke from a real tree, and if both attempts lose the directory the test prints the directory itself so the next failure arrives with the runner's own eyes.

// THE MESSAGE IS COMPACT.
// The census list is ~300 files and ~12 KB; joining the whole list into the assertion message made the runner's own error print eat the end of it, so failures arrived without the tail that says WHICH files were lost.
// The assertion's power does not change — the same three includes() checks run on the same list — only the evidence does.
// The spawn also carries an explicit 64 MiB maxBuffer: a truncated stdout is the one thing that would make the includes() checks fail without any file missing, and it must not be able to happen silently.

const MAX_BUFFER = 64 * 1024 * 1024;

const census = () => {
  const listed = execFileSync(process.execPath, ['scripts/verify/check.ts', '--list'], { cwd: repo, encoding: 'utf8', maxBuffer: MAX_BUFFER });
  return listed.split(/\r?\n/).map((line) => line.replace(/\\/g, '/'));
};

const snapshot = () => {
  const out: Record<string, string[] | string> = {};
  for (const dir of ['local', 'shared']) {
    try {
      out[dir] = fs.readdirSync(path.join(repo, dir));
    } catch (error) {
      out[dir] = `readdir error: ${String(error)}`;
    }
  }
  return JSON.stringify(out);
};

const censusOrEvidence = () => {
  const first = census();
  const ok = first.includes('local/primitives.ts') && first.includes('shared/canonical-order.ts');
  if (ok) return first;
  const second = census();
  if (second.includes('local/primitives.ts') && second.includes('shared/canonical-order.ts')) return second;
  process.stderr.write(`types-census: the census lost these directories on this machine: ${snapshot()}\n`);
  return first;
};

test('the runtime census lists local/*.ts, not only .js', () => {
  const lines = censusOrEvidence();
  const near = () => {
    const tail = lines.slice(-8).join(', ');
    return `census returned ${lines.length} files; last: ${tail}`;
  };
  assert.ok(lines.includes('local/primitives.ts'), `the census lists the .ts sources: ${near()}`);
  assert.ok(!lines.some((line) => /^(local\/[^/]+|local\/bin\/[^/]+|local\/office\/[^/]+|local\/lib\/[^/]+)\.js$/.test(line)), `the census never lists the emitted local/*.js copies (found one): ${near()}`);
  assert.ok(!lines.some((line) => /^local\/.*\.d\.ts$/.test(line)), `the census never lists local type declarations as runtime files (found one): ${near()}`);
});

test('the runtime census lists shared/*.ts, not only .js', () => {
  const lines = censusOrEvidence();
  const near = () => {
    const tail = lines.slice(-8).join(', ');
    return `census returned ${lines.length} files; last: ${tail}`;
  };
  assert.ok(lines.includes('shared/canonical-order.ts'), `the census lists the .ts sources: ${near()}`);
  assert.ok(!lines.some((line) => /^shared\/[^/]+\.js$/.test(line)), `the census never lists the emitted shared/*.js copies (found one): ${near()}`);
});
