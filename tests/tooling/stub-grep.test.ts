// @last-edited: 2026-11-20 UTC+7.
// @title: stub-grep — the regression that a stub a reviewer can read is never shipped.
// @state: product code (shared/, local/, extension/, hosted/functions/) fails the stub scan.
// @dependencies: node:test, strict, node:fs, node:path, node:url, node:child_process.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../../', import.meta.url));
const PRODUCT_DIRS = ['shared', 'local', 'extension', 'hosted/functions'];

// The CLI entry is the product's front door: exiting with a status code is its job.
// The CLI entry and the package hook are entries whose exit status is the product's or the package manager's signal, not library behavior.

const EXCLUDED = ['local/bin/', 'local/postinstall.ts'];
const STUBS = ['todo!', 'unimplemented!', 'panic!', 'process.exit'];

const tracked = (): string[] => execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);

test('no product code carries a stub or a hard exit', () => {
  const offenders: string[] = [];
  for (const file of tracked()) {
    if (EXCLUDED.some((excluded) => file.startsWith(excluded))) continue;
    if (!PRODUCT_DIRS.some((dir) => file.startsWith(dir + '/'))) continue;
    const body = fs.readFileSync(path.join(root, file), 'utf8');
    for (const stub of STUBS) {
      if (body.includes(stub)) offenders.push(`${file} carries ${stub}`);
    }
  }
  assert.deepEqual(offenders, [], `the stub-grep regression found what it promises to catch:\n${offenders.join('\n')}`);
});
