// @last-edited: 2026-11-18 UTC+7.
// @title: decisions - the register is the rule; a value in code nobody can source is a bug nobody can fix.
// @state: the register validates, the references in the repo resolve to real decisions, and no comment opens with a WHY prefix - the reason stands on its own.
// @dependencies: node:test, strict, node:fs.

// This gate is the enforcement half of docs/decisions.json.
// Every value in the repo either cites a decision (decisions.json -> D<n>) or is an ordinary expression of one; nothing gets to be a number or a string that answers to nobody.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

interface Source {
  kind: string;
  ref: string;
  also?: string;
}
interface Decision {
  id: string;
  scope: string;
  decision: string;
  source: Source;
}
interface Register {
  version: number;
  generated: string;
  source: string;
  note?: string;
  decisions: Decision[];
}

const root = new URL('../../', import.meta.url);
const read = (name: string): Register => JSON.parse(fs.readFileSync(new URL(name, root), 'utf8')) as Register;

const KINDS = new Set(['user', 'internet', 'repo']);

// The acceptance surface is not swept and not judged here: the pins define the judge.
// Every exclusion below is named on purpose - a silent exclusion is how the rule dies.
// gates.lock and .gitleaks.toml and .github are Layer 1/2 owner territory (the pins judge; they are not judged).
// The frozen public contract is byte-pinned by tests/helpers/boundary-locks.ts - comment churn there re-pins the public contract.
// hosted/migrations is history that has been applied; the applied past is not rewritten.

const EXCLUDED = new Set([
  'gates.lock',
  '.gitleaks.toml',
  '.github/CODEOWNERS',
  '.github/workflows/ci.yml',
  'scripts/verify/check.ts',
  'scripts/verify/scope.ts',
  'scripts/verify/scope-check.ts',
  'tests/helpers/boundary-locks.ts',
  'tests/helpers/canonical-source-hash.ts',
  'tests/helpers/comment-format.ts',
  'tests/docs/comment-format.test.ts',
  'tests/docs/comment-claims.test.ts',
  'tests/tooling/hygiene.test.ts',
  'tests/tooling/structure-gates.test.ts',
  'tests/tooling/boundary-locks.test.ts',
  'extension/lib/protocol.ts',
  'shared/secret-pattern.ts',
  'hosted/functions/_shared/cors.ts',
  'extension/manifest.json',
  'extension/content.ts',
  'extension/background.ts',
  'shared/reactive-vm.ts',
  'shared/reactive-vm-control-flow.ts',
  'shared/reactive-vm-collect.ts',
  'shared/multi-signal-relevance.ts',
  'shared/delta-first-observation.ts'
]);

// The file set is what git lists, exactly the set a person would ship - a gitignored build twin (extension/background.js, local/*.js) is machine-local state and not the repository.

const CODE_EXTENSIONS = new Set(['.css', '.ts', '.tsx', '.js', '.mjs', '.html', '.svg', '.py', '.sql', '.yml', '.toml']);

// git is the ground the set stands on; if it is missing the gate says so instead of the whole file crashing at import.
// Every comment in a file that carries a decisions.json citation points at one or more D-numbers; a citation line names them all.

const listCodeFiles = (): string[] => {
  let tracked: string[], untracked: string[];
  try {
    tracked = execFileSync('git', ['ls-files', '-z'], { cwd: new URL(root) }).toString('utf8').split('\0').filter(Boolean);
    untracked = execFileSync('git', ['ls-files', '-z', '--others', '--exclude-standard'], { cwd: new URL(root) }).toString('utf8').split('\0').filter(Boolean);
  } catch {
    throw new Error('decisions gate: git is required to read the file set - run npm test from inside the repository checkout');
  }
  const inRepoScope = (file: string) => !EXCLUDED.has(file) && !file.startsWith('hosted/migrations/') && !file.startsWith('.github/');
  return [...tracked, ...untracked].filter(inRepoScope).filter((file) => CODE_EXTENSIONS.has(path.extname(file)));
};

const ID = /D[0-9]{2,}/g;

test('the register parses and names where it came from', () => {
  const register = read('docs/decisions.json');
  assert.equal(register.version, 1, 'the schema version is pinned so the gate can read old registers');
  assert.ok(typeof register.generated === 'string' && register.generated.length > 0, 'the register says when it was built');
  assert.ok(typeof register.source === 'string' && register.source.length > 0, 'the register says where the sweep came from');
  assert.ok(Array.isArray(register.decisions) && register.decisions.length >= 30, 'the sweep found at least 30 decisions, found none or too few - if this falls below 30, decisions are being made without the register');
});

test('every decision is complete enough to act on', () => {
  const register = read('docs/decisions.json');
  const seen = new Set<string>();
  for (const d of register.decisions) {
    assert.match(d.id, /^D[0-9]{2,}$/, `id ${d.id} is a D-number`);
    assert.ok(!seen.has(d.id), `id ${d.id} appears twice`);
    seen.add(d.id);
    assert.ok(typeof d.scope === 'string' && d.scope.length > 0, `${d.id} names a scope`);
    assert.ok(typeof d.decision === 'string' && d.decision.length >= 24, `${d.id} says the decision, at enough length to be checkable`);
    assert.ok(KINDS.has(d.source?.kind), `${d.id} has a kind the gate understands: user, internet or repo - found ${d.source?.kind}`);
    assert.ok(typeof d.source.ref === 'string' && d.source.ref.length >= 8, `${d.id} carries a real source, not a placeholder`);
    if (d.source.kind === 'internet') {
      assert.match(d.source.ref, /^https?:\/\//, `${d.id} cites an internet source with a URL - got ${d.source.ref}`);
    }
    if (d.source.also) assert.ok(typeof d.source.also === 'string' && d.source.also.length >= 8, `${d.id} keeps any additional source stated, not bare`);
  }
});

test('every decisions.json reference in the repo resolves to a registered decision', () => {
  const register = read('docs/decisions.json');
  const ids = new Set(register.decisions.map((d) => d.id));
  const referenced = new Set<string>();
  for (const file of listCodeFiles()) {
    const text = fs.readFileSync(new URL(file, root), 'utf8');
    for (const line of text.split('\n')) {
      if (!line.includes('decisions.json')) continue;
      for (const match of line.matchAll(ID)) referenced.add(match[0]);
    }
  }
  assert.ok(referenced.size >= 1, 'at least one code file cites the register - it is wired in, not decorative');
  for (const id of referenced) {
    assert.ok(ids.has(id), `code references ${id}, which the register does not carry - either register it with a source or drop the reference`);
  }
});

test('no comment in the repo opens with a WHY prefix - the reason stands on its own', () => {
  for (const file of listCodeFiles()) {
    const text = fs.readFileSync(new URL(file, root), 'utf8');
    for (const [index, line] of text.split('\n').entries()) {
      assert.doesNotMatch(line, /^\s*(\/\/|\/\*|\*)\s*WHY\b/i, `${file}:${index + 1} opens a comment with WHY - write the reason directly, e.g. "the banner hangs off the footer because every page ends there"`);
    }
  }
});
