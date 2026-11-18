// @last-edited: 2026-11-18 UTC+7.
// @title: decisions - the register is the rule; a value in code nobody can source is a bug nobody can fix.
// @state: the register validates, the references in the site resolve to real decisions, and no decision carries a WHY-prefix comment - the reason stands on its own.
// @dependencies: node:test, strict, node:fs.

// This gate is the enforcement half of docs/decisions.json.
// Every value in the site either cites a decision (decisions.json -> D<n>) or is an ordinary expression of one; nothing gets to be a number or a string that answers to nobody.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

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
const REF = /decisions\.json\s*->\s*(D[0-9]{2,})/g;

const SKIP = new Set(['node_modules', 'build', '.react-router', '.wrangler', 'coverage']);

const walk = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of fs.readdirSync(new URL(dir, root), { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
};

const CODE_EXTENSIONS = new Set(['.css', '.ts', '.tsx', '.js', '.mjs', '.html', '.svg']);
const codeFiles = walk('site').filter((file) => CODE_EXTENSIONS.has(path.extname(file)));

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

test('every decisions.json reference in the site resolves to a registered decision', () => {
  const register = read('docs/decisions.json');
  const ids = new Set(register.decisions.map((d) => d.id));
  const referenced = new Set<string>();
  for (const file of codeFiles) {
    const text = fs.readFileSync(new URL(file, root), 'utf8');
    for (const match of text.matchAll(REF)) {
      const id = match[1];
      if (id) referenced.add(id);
    }
  }
  assert.ok(referenced.size >= 1, 'at least one code file cites the register - it is wired in, not decorative');
  for (const id of referenced) {
    assert.ok(ids.has(id), `code references ${id}, which the register does not carry - either register it with a source or drop the reference`);
  }
});

test('no comment in the site opens with a WHY prefix - the reason stands on its own', () => {
  for (const file of codeFiles) {
    const text = fs.readFileSync(new URL(file, root), 'utf8');
    for (const [index, line] of text.split('\n').entries()) {
      assert.doesNotMatch(line, /^\s*(\/\/|\/\*|\*)\s*WHY\b/i, `${file}:${index + 1} opens a comment with WHY - write the reason directly, e.g. "the banner hangs off the footer because every page ends there"`);
    }
  }
});
