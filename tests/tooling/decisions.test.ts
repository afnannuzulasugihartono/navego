// @last-edited: 2026-11-19 UTC+7.
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
  file?: string;
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

// a recorded source points at the file that records the performance - release notes, proof records, the registry - never at a feeling a source nobody can check is a source nobody wrote: internet citations carry a URL any person can open, in-repo citations must resolve to files and lines here, user citations carry the date the owner said it, recorded citations carry a date or a resolvable path

const KINDS = new Set(['user', 'internet', 'repo', 'recorded']);

const REPO_EXTENSIONS = 'md|ts|tsx|js|mjs|cjs|json|jsonl|ya?ml|css|html|svg|txt|sql|py|toml|lock';

const allTrackedFiles = (): Set<string> => {
  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: new URL(root) }).toString('utf8').split('\0').filter(Boolean);
  const untracked = execFileSync('git', ['ls-files', '-z', '--others', '--exclude-standard'], { cwd: new URL(root) }).toString('utf8').split('\0').filter(Boolean);
  return new Set([...tracked, ...untracked]);
};

const pathTokens = (ref: string): string[] =>
  (ref.match(/[\w./-]+(?::\d+(?:-\d+)?)?/g) ?? [])
    .map((token) => token.trim())
    .filter((token) => {
      if (token.includes('/')) {
        const firstSegment = token.split('/').filter(Boolean)[0] ?? '';
        return !firstSegment.includes('.');
      }
      return new RegExp(`^[\\w-][\\w.-]*\\.(${REPO_EXTENSIONS})(?::\\d+(?:-\\d+)?)?$`).test(token);
    });

const resolvedPath = (token: string, tracked: Set<string>): { path: string; lineStart?: number | undefined; lineEnd?: number | undefined } | null => {
  const match = token.match(/^(.*?)(?::(\d+)(?:-(\d+))?)?$/);
  const bare = match?.[1] ?? token;
  if (!bare || bare === '.') return null;
  if (bare.includes('*')) return { path: bare };
  if (bare.endsWith('/')) {
    for (const file of tracked) {
      if (file.startsWith(bare)) return { path: bare };
    }
    return null;
  }
  if (tracked.has(bare)) return { path: bare, lineStart: match?.[2] ? Number(match[2]) : undefined, lineEnd: match?.[3] ? Number(match[3]) : match?.[2] ? Number(match[2]) : undefined };
  for (const file of tracked) {
    if (file === bare || file.endsWith('/' + bare)) {
      return { path: file, lineStart: match?.[2] ? Number(match[2]) : undefined, lineEnd: match?.[3] ? Number(match[3]) : match?.[2] ? Number(match[2]) : undefined };
    }
  }
  return null;
};

const lineCountCache = new Map<string, number>();
const lineCount = (file: string): number => {
  const cached = lineCountCache.get(file);
  if (cached !== undefined) return cached;
  const lines = fs.readFileSync(new URL(file, root), 'utf8').split('\n').length;
  lineCountCache.set(file, lines);
  return lines;
};

const checkSourceResolves = (id: string, ref: string, kind: string, tracked: Set<string>, requireAnchor = true): void => {
  const tokens = pathTokens(ref);
  for (const token of tokens) {
    const resolved = resolvedPath(token, tracked);
    assert.ok(resolved, `${id} cites ${token}, which does not exist in the repository - a source that resolves to nothing was never a source`);
    if (resolved.lineStart !== undefined) {
      const count = lineCount(resolved.path);
      assert.ok(resolved.lineEnd! <= count, `${id} cites ${resolved.path}:${resolved.lineEnd}, but the file has ${count} lines - the citation points past the end of the evidence`);
    }
  }
  if (requireAnchor && kind === 'recorded' && tokens.length === 0) {
    assert.match(ref, /\d{4}-\d{2}-\d{2}/, `${id} is a recorded decision with no resolvable path in its ref - it must at least carry the date the performance was measured`);
  }
};

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

// A citation names either id form; the date in a recorded source is not an id.

const ID = /\b(?:D[0-9]{2,}|(?=[a-z0-9-]*[a-z])[a-z0-9]+(?:-[a-z0-9]+)*-\d{2})\b/g;
const FILE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*-\d{2}$/;

// A FILE-BASED ID IS THE NEW FORM, AND IT MUST NAME THE FILE IT GOVERNS.
// The user asked for decision ids derived from the file so a reader can find the rule from the path and two agents adding rules do not race for the next D-number.
// The D-numbers stay because they are cited across the tree; the new form is enforced on everything added from 2026-11-19 onward.

const isLegacyId = (id: string): boolean => /^D[0-9]{2,}$/.test(id);

test('the register parses and names where it came from', () => {
  const register = read('docs/decisions.json');
  assert.equal(register.version, 1, 'the schema version is pinned so the gate can read old registers');
  assert.ok(typeof register.generated === 'string' && register.generated.length > 0, 'the register says when it was built');
  assert.ok(typeof register.source === 'string' && register.source.length > 0, 'the register says where the sweep came from');
  assert.ok(Array.isArray(register.decisions) && register.decisions.length >= 30, 'the sweep found at least 30 decisions, found none or too few - if this falls below 30, decisions are being made without the register');
});

// THE REGISTER COVERS THE PRODUCT, NOT ONLY THE PAGE.
// The user asked for decisions and sources across the website, database, MCP surface and extension; a scope prefix with no decision means one part of Opera is answering to nobody.

test('the register covers every part of the product the user named', () => {
  const register = read('docs/decisions.json');
  const scopes = register.decisions.map((d) => d.scope);
  for (const area of ['web/', 'database/', 'mcp/', 'extension/', 'hosted/', 'agent/']) {
    assert.ok(
      scopes.some((scope) => scope.startsWith(area)),
      `the register carries no decision for ${area} - the website, database, MCP, extension, hosted functions and agent surface each need a sourced decision`
    );
  }
});

test('every decision is complete enough to act on', () => {
  const register = read('docs/decisions.json');
  const seen = new Set<string>();
  const tracked = allTrackedFiles();
  for (const d of register.decisions) {
    assert.ok(isLegacyId(d.id) || FILE_ID.test(d.id), `id ${d.id} is a D-number or a file-based id such as local-canvas-01`);
    assert.ok(!seen.has(d.id), `id ${d.id} appears twice`);
    seen.add(d.id);
    if (!isLegacyId(d.id)) {
      assert.ok(typeof d.file === 'string' && d.file.length > 0, `${d.id} is file-based and must name its file`);
      assert.ok(resolvedPath(d.file, tracked), `${d.id} names ${d.file}, which does not exist - a file-based id that points at no file answers to nobody`);
      assert.equal(d.file.split('/')[0], d.id.split('-')[0], `${d.id} says ${d.file} is its file, but the id's first segment names another part of the tree`);
    }
    assert.ok(typeof d.scope === 'string' && d.scope.length > 0, `${d.id} names a scope`);
    assert.ok(typeof d.decision === 'string' && d.decision.length >= 24, `${d.id} says the decision, at enough length to be checkable`);
    assert.ok(KINDS.has(d.source?.kind), `${d.id} has a kind the gate understands: user, internet, repo or recorded - found ${d.source?.kind}`);
    assert.ok(typeof d.source.ref === 'string' && d.source.ref.length >= 8, `${d.id} carries a real source, not a placeholder`);
    if (d.source.kind === 'internet') {
      assert.match(d.source.ref, /^https?:\/\//, `${d.id} cites an internet source with a URL - got ${d.source.ref}`);
      assert.ok(d.source.ref.length >= 30, `${d.id} cites a URL with nothing said about it - a bare link convinces nobody`);
    }
    if (d.source.kind === 'user') {
      assert.match(d.source.ref, /user \d{4}-\d{2}-\d{2}/, `${d.id} is kind=user without the date the owner said it, e.g. user 2026-11-19 - a dated quote can be found again in the conversation`);
    }
    if (d.source.kind === 'repo' || d.source.kind === 'recorded') {
      checkSourceResolves(d.id, d.source.ref, d.source.kind, tracked);
    }
    if (d.source.also) {
      assert.ok(typeof d.source.also === 'string' && d.source.also.length >= 8, `${d.id} keeps any additional source stated, not bare`);
      if (d.source.kind === 'repo' || d.source.kind === 'recorded') {
        checkSourceResolves(`${d.id} (also)`, d.source.also, d.source.kind, tracked, false);
      }
    }
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
