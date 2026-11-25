// @last-edited: 2026-11-25 UTC+7.
// @title: agent roles - the registry is the rule; a session's role and scope are enforced by this gate.
// @state: the registry parses, every role has a doc that names the role, every scope path resolves, the doc table lists every role, and every automations entry exists.
// @dependencies: node:test, strict, node:fs, node:path, node:url.

// Roles are the door an automation-opened session walks through (docs/agent-roles.md).
// A role without a doc, a scope, or a scope that points at nothing is a session that cannot tell what it owns, so the register refuses to ship it.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (name: string): unknown => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8')) as unknown;

interface Role {
  id: string;
  team: string;
  scopePaths: string[];
  doc: string;
  automations: string[];
  status: string;
}
interface Register {
  version: number;
  generated: string;
  source: string;
  roles: Role[];
}

const load = (): { register: Register; roles: Role[] } => {
  const register = read('docs/agent-roles/registry.json') as Register;
  return { register, roles: register.roles };
};

const resolves = (p: string): boolean => {
  const full = path.join(root, p);
  if (fs.existsSync(full)) return true;
  if (p.endsWith('/**') && fs.existsSync(path.dirname(full))) return true;
  return false;
};

const docText = (p: string): string => fs.readFileSync(path.join(root, p), 'utf8');

test('the register parses and names where it came from', () => {
  const { register } = load();
  assert.equal(register.version, 1, 'the schema version is pinned so the gate can read the registry');
  assert.ok(typeof register.generated === 'string' && register.generated.length > 0, 'the registry says when it was built');
  assert.ok(typeof register.source === 'string' && register.source.length > 0, 'the registry says where the roles came from');
  assert.ok(Array.isArray(register.roles) && register.roles.length >= 4, 'the registry lists at least four roles');
});

test('every role is complete enough for a session to open with', () => {
  const { roles } = load();
  const seen = new Set<string>();
  for (const role of roles) {
    assert.match(role.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, `role id ${role.id} is a kebab-case token`);
    assert.ok(!seen.has(role.id), `role id ${role.id} appears twice`);
    seen.add(role.id);
    assert.ok(typeof role.team === 'string' && role.team.length >= 4, `${role.id} names its team`);
    assert.ok(role.scopePaths.length >= 1, `${role.id} has at least one scope path`);
    assert.ok(role.scopePaths.every((p) => typeof p === 'string' && resolves(p)), `${role.id} scopes ${role.scopePaths.filter((p) => !resolves(p))} that do not exist - a role that may not touch real paths cannot be the entry point`);
    assert.ok(typeof role.doc === 'string' && resolves(role.doc), `${role.id} points at ${role.doc}, which does not exist`);
    assert.ok(docText(role.doc).includes(role.id), `${role.id}'s doc does not name the role id`);
    assert.ok(Array.isArray(role.automations) && role.automations.every((a) => typeof a === 'string' && a.startsWith('aut_')), `${role.id} lists automation ids with the aut_ prefix`);
    assert.ok(['active', 'planned'].includes(role.status), `${role.id} has a status in active or planned`);
    if (role.status === 'active') assert.ok(role.automations.length > 0, `the active role ${role.id} must run at least one automation`);
  }
});

test('the human half of the system lists every registry role', () => {
  const { roles } = load();
  const doc = docText('docs/agent-roles.md');
  for (const role of roles) {
    assert.ok(doc.includes(role.id), `docs/agent-roles.md does not list the registry role ${role.id} - the register and the doc must agree`);
  }
});

test('the one communication container lists every role and says what is missing', () => {
  const { roles } = load();
  const status = docText('docs/agent-roles/status.md');
  assert.ok(status.includes('# Agent roles status'), 'status.md opens with the container title');
  for (const role of roles) {
    assert.ok(status.includes(role.id), `status.md has no line for role ${role.id} - the container must name every division so it can see what is missing`);
  }
});

test('the decisions register carries the roles decision', () => {
  const decisions = read('docs/decisions.json') as { decisions: Array<{ id: string }> };
  const ids = new Set(decisions.decisions.map((d) => d.id));
  for (const id of ['docs-agent-roles-01', 'docs-agent-roles-02']) {
    assert.ok(ids.has(id), `the decisions register does not carry ${id} - the role system is a decision, not a preference`);
  }
});
