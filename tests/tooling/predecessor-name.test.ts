// @last-edited: 2026-11-21 UTC+7.
// @title: predecessor-name - the predecessor product's name survives only where a reason says it must.
// @state: the files allowed to keep the old name, each with the reason, and the gate that refuses it everywhere else.
// @dependencies: node:test, strict, node:fs, node:child_process.

// The product was called Opera Agent before it was called Navego, and a name that lingers in a live surface is a name a reader cannot tell apart from the product.
// The history keeps its words because history is what happened, and the compatibility list keeps the one old name that an install from that era verifies its download against.
// Everything else is refused here, so the tree cannot drift back into two names.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));

// The predecessor's name in every spelling it ever had in the tree.

const OLD_NAME = /opera[\s_-]*agent/i;

// The files that may name it, each for one reason.

const ALLOWED_FILES: Array<{ path: string; why: string }> = [
  { path: 'hosted/migrations/', why: 'the applied history creates the predecessor schemas and calls its endpoints, and the rename migration is what moved them' },
  { path: 'docs/releases/', why: 'a release note describes the release that shipped, under the name that shipped' },
  { path: 'docs/superpowers/', why: 'a dated plan or spec is a record of what was designed then' },
  { path: 'CHANGELOG.md', why: 'the changelog is the record of the releases that shipped' },
  { path: 'docs/decisions.json', why: 'the register cites the registry and the tree as they stood when the decision was taken' },
  { path: 'docs/handoff.md', why: 'the handoff names the endpoints and jobs that carried the old name so the cleanup can be checked' },
  { path: 'tests/helpers/boundary-locks.ts', why: 'the re-pin notes say which name each pin rode' },
  { path: 'extension/lib/self-update.ts', why: 'the accepted manifest names are the one place an install from that era is still recognised' },
  { path: 'extension/lib/endpoints.ts', why: 'the compatibility migration must recognise the predecessor bridge slug stored by devices paired before the rename' },
  { path: 'site/worker/_worker.ts', why: 'the legacy domain redirect must name the old host so a request to it is sent to the canonical one' },
  { path: 'tests/billing/invoice-worker.test.ts', why: 'the test proves the legacy host redirects and the canonical host is served as itself' },
  { path: 'tests/release/self-update.test.ts', why: 'the test proves that an install from that era is still recognised' },
  { path: 'tests/tooling/predecessor-name.test.ts', why: 'this gate names the old product to say what it refuses' }
];

const isAllowedPath = (path: string): boolean => ALLOWED_FILES.some((entry) => path === entry.path || path.startsWith(entry.path));

const isText = (path: string): boolean => /\.(ts|js|mjs|cjs|json|md|yml|yaml|toml|txt|html|css|tsx|jsx|py|ps1|sh|sql|xml|svg|lock)$/i.test(path);

test('no live surface carries the predecessor product\'s name', () => {
  const tracked = execFileSync('git', ['-C', root, 'ls-files', '-z'], { encoding: 'utf8' })
    .split('\u0000')
    .filter((path) => path.length > 0);

  const offenders: string[] = [];
  for (const path of tracked) {
    if (!isText(path)) continue;
    if (isAllowedPath(path)) continue;
    let text: string;
    try {
      const bytes = readFileSync(join(root, path));
      if (bytes.subarray(0, 8000).includes(0)) continue;
      text = bytes.toString('utf8');
    } catch {
      continue;
    }
    for (const [index, line] of text.split(/\r?\n/).entries()) {
      if (OLD_NAME.test(line)) offenders.push(`${path}:${index + 1} ${line.trim().slice(0, 100)}`);
    }
  }

  assert.deepEqual(offenders, [], 'these lines still name the predecessor product outside the allowed list:\n' + offenders.join('\n'));
});

test('every allowed path exists and says why it keeps the old name', () => {
  for (const entry of ALLOWED_FILES) {
    assert.ok(entry.why.length > 20, `${entry.path} must say why it keeps the old name`);
    if (entry.path.endsWith('/')) continue;
    assert.ok(existsInTree(entry.path), `${entry.path} is allowed to name the old product but is not in the tree`);
  }
});

function existsInTree(path: string): boolean {
  try {
    execFileSync('git', ['-C', root, 'ls-files', '--error-unmatch', path], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
