// @last-edited: 2026-11-20 UTC+7.
// @title: product-name - the tree carries one product name, and every place that says otherwise says why.
// @state: the files allowed to keep the 1.x name, the tokens allowed inside them, and the gate that refuses a new one.
// @dependencies: node:test, strict, node:fs, node:child_process.

// The 2.0 release renamed the product from Navego to Opera.
// A rename that is only half-applied is worse than no rename: a reader sees two names and cannot tell which one the product answers to, and a caller sends the wrong header to the wrong function.

// The gate therefore names every place the old name is still allowed to live, and refuses it everywhere else.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));

// Live infrastructure the owner renames out of band: the Cloudflare Pages project and the GitHub repository.
// A link that points at a repository that does not exist is a broken link, so the address stays until the repository moves.
// The 1.x names that the 2.0 install still answers are allowed wherever they are read: the header, the environment prefix, the home directory and the command alias.

const ALLOWED_TOKENS = [
  'navego.pages.dev',
  'navego\\.pages\\.dev',
  'github.com/afnannuzulasugihartono/navego',
  'x-navego-token',
  'NAVEGO_',
  '.navego',
  '"navego"',
  "'navego'"
];

// The files that may name the 1.x product, each for one reason.

const ALLOWED_FILES: Array<{ path: string; why: string }> = [
  { path: 'CHANGELOG.md', why: 'the changelog is the record of the releases that shipped under the old name' },
  { path: 'docs/product/rebrand-kemudi.md', why: 'the research that chose the old name and the cutover it records' },
  { path: 'docs/releases/', why: 'each release note describes the release that shipped, under the name that shipped' },
  { path: 'docs/superpowers/plans/', why: 'a dated plan is a record of what was decided then' },
  { path: 'docs/superpowers/specs/', why: 'a dated spec is a record of what was designed then' },
  { path: 'hosted/migrations/', why: 'the applied history keeps its bytes; only the file label carries the new name' },
  { path: 'docs/handoff.md', why: 'the handoff names the packages and endpoints that are published under the 1.x name' },
  { path: 'docs/decisions.json', why: 'the register records the decisions that were taken under the old name' },
  { path: 'local/legacy-names.ts', why: 'the module that reads the 1.x names has to name them' },
  { path: 'local/legacy-env-bootstrap.ts', why: 'the module that adopts the 1.x environment has to name it' },
  { path: 'hosted/functions/_shared/legacy-auth.ts', why: 'the shared reader that accepts the 1.x header has to name it' },
  { path: 'local/package.json', why: 'the 1.x command stays as an alias of the 2.0 one' },
  { path: 'tests/helpers/boundary-locks.ts', why: 'the re-pin notes say which name each pin rode' },
  { path: 'tests/local/legacy-names.test.ts', why: 'the test proves the 1.x names still work, so it names them' },
  { path: 'tests/tooling/product-name.test.ts', why: 'this gate names the places it allows' },
  { path: '.github/ISSUE_TEMPLATE/config.yml', why: 'the issue tracker points at the repository, which still has its old name' }
];

const isAllowedPath = (path: string): boolean => ALLOWED_FILES.some((entry) => path === entry.path || path.startsWith(entry.path));

const isText = (path: string): boolean => /\.(ts|js|mjs|cjs|json|md|yml|yaml|toml|txt|html|css|tsx|jsx|py|ps1|sh|sql|xml|svg|lock)$/i.test(path);

test('no file outside the allowed list carries the old product name', () => {
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
    for (const token of ALLOWED_TOKENS) text = text.split(token).join('');
    if (/navego/i.test(text)) offenders.push(path);
  }

  assert.deepEqual(offenders, [], 'these files still carry the old product name outside the allowed list');
});

test('every allowed path exists, so the allowlist cannot rot into a free pass', () => {
  for (const entry of ALLOWED_FILES) {
    if (entry.path.endsWith('/')) continue;
    assert.ok(existsInTree(entry.path), `${entry.path} is allowed to carry the old name but is not in the tree`);
  }
});

test('every allowed path says why it keeps the old name', () => {
  for (const entry of ALLOWED_FILES) {
    assert.ok(entry.why.length > 20, `${entry.path} must say why it keeps the old name`);
  }
});

function existsInTree(path: string): boolean {
  return existsSync(join(root, path));
}
