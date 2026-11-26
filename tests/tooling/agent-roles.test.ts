// @last-edited: 2026-11-26 UTC+7.
// @title: agent roles - the registry is the rule; a session's role and scope are enforced by this gate.
// @state: every role has a doc and both path lists, each implementation path has one work-scope owner, the scope gate refuses paths outside a role, every lane session runs that gate over the real diff, and generated permissions match the register.
// @dependencies: node:test, strict, node:fs, node:path, node:url.

// Roles are the door an automation-opened session walks through (docs/agent-roles.md).
// A role without a doc, a scope, or a scope that points at nothing is a session that cannot tell what it owns, so the register refuses to ship it.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { editResource, renderAgentFiles } from '../../scripts/dev/generate-agent-roles.ts';
import { checkRolesScope, checkRoleScope, scopePathMatches } from '../../scripts/verify/role-scope.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (name: string): unknown => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8')) as unknown;

interface Role {
  id: string;
  team: string;
  division: string;
  scopePaths: string[];
  communicationPaths: string[];
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
  if (p.includes('*')) {
    // every wildcard resolves when the directory chain up to it exists
    const chain = p.split('*')[0] ?? '';
    return fs.existsSync(path.join(root, chain.replace(/\/[^/]*$/, '')));
  }
  return false;
};

const docText = (p: string): string => fs.readFileSync(path.join(root, p), 'utf8');

const REQUIRED_COMMUNICATION_PATHS = [
  'docs/agent-roles/queue/**',
  'docs/agent-roles/status.md',
  'docs/proof/**',
];


// The divisions a company actually runs, read from the corporate titles and the functional structure (Wikipedia, Organizational structure and Chief executive officer, read 2026-11-25).
// A role that names no real division is a project label, and a project label is not a lane an agent can enter.

const COMPANY_DIVISIONS = [
  'Executive',
  'Operations',
  'Research & Development',
  'Sales',
  'Marketing',
  'Engineering',
  'Finance',
  'Customer Support',
  'Customer Success',
  'Product',
  'Legal & Compliance',
  'People',
  'Data & Analytics',
];

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
    assert.ok(COMPANY_DIVISIONS.includes(role.division), `${role.id} names the division ${role.division}, which is not a company division`);
    assert.ok(docText(role.doc).includes(`Division: ${role.division}`), `${role.id}'s doc does not name its division`);
    assert.ok(Array.isArray(role.communicationPaths) && role.communicationPaths.length >= 1, `${role.id} names the shared communication surface it may write`);
    for (const sharedPath of REQUIRED_COMMUNICATION_PATHS) {
      assert.ok(role.communicationPaths.includes(sharedPath), `${role.id} does not allow the shared communication path ${sharedPath}`);
    }
    assert.ok(role.communicationPaths.every((p) => resolves(p)), `${role.id} scopes a communication path that does not exist`);
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

test('every role is a real agent file the harness reads, and the files match the register', async () => {
  const { register } = load();
  const rendered = new Map(renderAgentFiles(register).map((file) => [file.path, file.content]));
  for (const role of register.roles) {
    for (const expected of [`.opencode/agents/${role.id}.md`, `.claude/agents/${role.id}.md`]) {
      const content = rendered.get(expected);
      assert.ok(content, `the generator does not render ${expected}`);
      const onDisk = fs.readFileSync(path.join(root, expected), 'utf8');
      assert.equal(onDisk, content, `${expected} drifted from docs/agent-roles/registry.json - run: node scripts/dev/generate-agent-roles.ts`);
    }
  }
});

test('the agent file denies editing outside the role scope and allows the scope', () => {
  const { register } = load();
  for (const role of register.roles) {
    const text = fs.readFileSync(path.join(root, `.opencode/agents/${role.id}.md`), 'utf8');
    assert.ok(text.startsWith('---\n'), `${role.id} opens with frontmatter`);
    assert.match(text, /- action: edit\n\s+resource: "\*"\n\s+effect: deny/, `${role.id} does not deny editing everything first`);
    for (const scopePath of role.scopePaths) {
      const resource = editResource(scopePath);
      assert.ok(text.includes(`resource: "${resource}"\n    effect: allow`), `${role.id} does not allow editing its scope path ${scopePath}`);
    }
    for (const sharedPath of role.communicationPaths) {
      const resource = editResource(sharedPath);
      assert.ok(text.includes(`resource: "${resource}"\n    effect: allow`), `${role.id} cannot write the shared communication surface ${sharedPath} - a lane that cannot report is a lane that cannot report`);
    }
  }
});

test('package.json exposes the role scope verifier', () => {
  const pkg = read('package.json') as { scripts: Record<string, string> };
  assert.equal(pkg.scripts['scope:role'], 'node scripts/verify/role-scope.ts');
});

test('every lane session runs the scope gate over its own diff before the merge', () => {
  const { register } = load();
  for (const role of register.roles) {
    for (const expected of [`.opencode/agents/${role.id}.md`, `.claude/agents/${role.id}.md`]) {
      const text = fs.readFileSync(path.join(root, expected), 'utf8');
      assert.ok(text.includes(`npm run scope:role -- ${role.id} --base`), `${expected} does not tell the lane to run the scope gate for ${role.id} - a lane that is told to check a path list it names itself can pass a diff it never looked at`);
      assert.ok(text.includes('--head HEAD'), `${expected} does not tell the lane which head to check`);
      assert.ok(text.includes('the base ref your pull request targets'), `${expected} pins one base ref, so a lane on a stacked pull request reads the whole stack instead of its own changes`);
    }
  }
});

test('the role scope gate refuses a changed path outside the named role scope', () => {
  const { register } = load();
  const result = checkRoleScope(register, 'engineer', [
    'extension/lib/protocol.ts',
    'docs/agent-roles/queue/engineer-to-ceo.md',
    'site/app/lib/funnel.ts',
  ]);
  assert.deepEqual(result.allowed, [
    'extension/lib/protocol.ts',
    'docs/agent-roles/queue/engineer-to-ceo.md',
  ]);
  assert.deepEqual(result.refused, ['site/app/lib/funnel.ts']);
});

test('two named lanes may share a communication path, but not a work scope', () => {
  const shared = checkRolesScope(
    {
      roles: [
        { id: 'operator', scopePaths: ['docs/proof'], communicationPaths: ['docs/agent-roles/queue/**'] },
        { id: 'engineer', scopePaths: ['extension/**'], communicationPaths: ['docs/agent-roles/queue/**'] },
      ],
    },
    ['operator', 'engineer'],
    ['docs/agent-roles/queue/operator-to-engineer-20261126-0725.md'],
  );
  assert.deepEqual(shared.refused, [], 'a shared communication path is allowed');
  assert.deepEqual(shared.ambiguous, [], 'a shared communication path is not a work-scope overlap');

  const overlap = checkRolesScope(
    {
      roles: [
        { id: 'marketer', scopePaths: ['site/**'], communicationPaths: [] },
        { id: 'support-agent', scopePaths: ['site/**'], communicationPaths: [] },
      ],
    },
    ['marketer', 'support-agent'],
    ['site/app/page.tsx'],
  );
  assert.deepEqual(overlap.refused, [], 'a work scope is still an owner');
  assert.deepEqual(overlap.ambiguous, ['site/app/page.tsx'], 'two work scopes on one path are ambiguous');
});

test('no two roles work scopes cover the same tracked file', () => {
  const { roles } = load();
  const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const shared = new Set(roles.flatMap((role) => role.communicationPaths));
  for (const file of tracked) {
    const owners = roles
      .filter((role) => role.scopePaths.some((scopePath) => scopePathMatches(file, scopePath)))
      .map((role) => role.id);
    if (owners.length === 0) continue;
    const workOwners = owners.filter((owner) => {
      const role = roles.find((candidate) => candidate.id === owner);
      return role ? !role.scopePaths.every((scopePath) => shared.has(scopePath)) : true;
    });
    assert.equal(workOwners.length <= 1, true, `${file} is claimed by ${workOwners.join(', ')} - a work scope has one owner`);
  }
});

test('the scope checker refuses an out-of-scope path when it is run with the real diff', () => {
  const script = path.join(root, 'scripts/verify/role-scope.ts');
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'role-scope-test-'));
  const run = (cwd: string, base: string, head: string, extra: string[] = []) => {
    return spawnSync(process.execPath, [script, 'engineer', '--base', base, '--head', head, ...extra], { cwd, encoding: 'utf8' });
  };
  try {
    execFileSync('git', ['init', '--quiet'], { cwd: sandbox });
    execFileSync('git', ['config', 'user.email', 'gate@example.test'], { cwd: sandbox });
    execFileSync('git', ['config', 'user.name', 'Gate'], { cwd: sandbox });
    execFileSync('git', ['checkout', '--quiet', '-b', 'base'], { cwd: sandbox });
    fs.mkdirSync(path.join(sandbox, 'extension/lib'), { recursive: true });
    fs.mkdirSync(path.join(sandbox, 'site/app/lib'), { recursive: true });
    fs.writeFileSync(path.join(sandbox, 'extension/lib/protocol.ts'), 'export const protocol = 1;\n');
    fs.writeFileSync(path.join(sandbox, 'site/app/lib/funnel.ts'), 'export const funnel = 1;\n');
    execFileSync('git', ['add', '.'], { cwd: sandbox });
    execFileSync('git', ['commit', '--quiet', '-m', 'first'], { cwd: sandbox });
    execFileSync('git', ['checkout', '--quiet', '-b', 'change'], { cwd: sandbox });
    fs.writeFileSync(path.join(sandbox, 'extension/lib/protocol.ts'), 'export const protocol = 2;\n');
    execFileSync('git', ['add', '.'], { cwd: sandbox });
    execFileSync('git', ['commit', '--quiet', '-m', 'in scope'], { cwd: sandbox });
    const allowed = run(sandbox, 'base', 'change');
    assert.equal(allowed.status, 0, 'an in-scope change passes the command');

    fs.writeFileSync(path.join(sandbox, 'site/app/lib/funnel.ts'), 'export const funnel = 2;\n');
    execFileSync('git', ['add', '.'], { cwd: sandbox });
    execFileSync('git', ['commit', '--quiet', '-m', 'out of scope'], { cwd: sandbox });
    const refused = run(sandbox, 'base', 'change');
    assert.equal(refused.status, 1, 'an out-of-scope change makes the command exit non-zero');
    assert.match(refused.stderr, /site\/app\/lib\/funnel\.ts/, 'the command names the refused path');

    const withPathList = run(sandbox, 'base', 'change', ['extension/lib/protocol.ts']);
    assert.equal(withPathList.status, 1, 'a caller-supplied path list cannot make the command pass');

    const empty = run(sandbox, 'change', 'change');
    assert.equal(empty.status, 1, 'an empty diff is a refusal, not a pass');
  } finally {
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
});

test('generated permissions allow exactly the work and communication lists', () => {
  const { register } = load();
  for (const role of register.roles) {
    const text = fs.readFileSync(path.join(root, `.opencode/agents/${role.id}.md`), 'utf8');
    const rules = [...text.matchAll(/  - action: edit\n    resource: "([^"]+)"\n    effect: (allow|deny)/g)]
      .map((match) => ({ resource: match[1], effect: match[2] }));
    assert.deepEqual(rules, [
      { resource: '*', effect: 'deny' },
      ...role.scopePaths.map((scopePath) => ({ resource: editResource(scopePath), effect: 'allow' })),
      ...role.communicationPaths.map((sharedPath) => ({ resource: editResource(sharedPath), effect: 'allow' })),
    ], `${role.id} has edit permissions outside its work and communication lists`);
  }
});

test('the research that shaped the roles is in the tree with its sources', () => {
  const research = docText('docs/research/agent-roles.md');
  for (const source of ['https://opencode.ai/docs/agents', 'https://code.claude.com/docs/en/sub-agents', 'https://code.claude.com/docs/en/agent-teams', 'https://agents.md/']) {
    assert.ok(research.includes(source), `docs/research/agent-roles.md does not cite ${source} - a role claim without its source is a guess`);
  }
});

test('no agent file is left behind by a renamed role', () => {
  const { roles } = load();
  const owned = new Set(roles.flatMap((role) => [`${role.id}.md`]));
  for (const folder of ['.opencode/agents', '.claude/agents']) {
    const full = path.join(root, folder);
    if (!fs.existsSync(full)) continue;
    for (const name of fs.readdirSync(full)) {
      assert.ok(owned.has(name), `${folder}/${name} is an agent file no role owns - a lane an agent can still enter`);
    }
  }
});

test('the credential roster gives every slot its own credential and its own session', () => {
  const roster = read('docs/agent-roles/keys.json') as {
    version: number;
    slots: Array<{ id: string; provider: string; model: string; credential: string; session: string; serves: string[]; status: string; runsLaneWorkers: boolean }>;
  };
  assert.equal(roster.version, 1, 'the roster schema version is pinned');
  assert.ok(roster.slots.length >= 2, 'the roster carries at least two credential slots');
  const credentials = new Set<string>();
  const sessions = new Set<string>();
  let workerSlots = 0;
  for (const slot of roster.slots) {
    assert.ok(slot.id.length > 0, 'a slot names itself');
    assert.ok(slot.provider.length > 0, `${slot.id} names its provider`);
    assert.match(slot.model, /^[a-z0-9-]+\//, `${slot.id} names its model as provider/model`);
    assert.ok(slot.credential.length > 0, `${slot.id} says where its credential lives`);
    assert.ok(slot.session.length > 0, `${slot.id} names the session it owns`);
    assert.ok(Array.isArray(slot.serves) && slot.serves.length > 0, `${slot.id} names the lanes it serves`);
    assert.ok(['ready', 'pending'].includes(slot.status), `${slot.id} has a status in ready or pending`);
    assert.ok(!credentials.has(slot.credential), `${slot.id} shares its credential source with another slot - two slots must never run on the same credential`);
    assert.ok(!sessions.has(slot.session), `${slot.id} shares its session with another slot - one credential serves one session`);
    if (slot.runsLaneWorkers) workerSlots += 1;
    credentials.add(slot.credential);
    sessions.add(slot.session);
  }
  assert.ok(workerSlots >= 1, 'at least one slot runs lane workers');
  const text = fs.readFileSync(path.join(root, 'docs/agent-roles/keys.json'), 'utf8');
  assert.ok(!/nvapi-[A-Za-z0-9_-]{20,}/.test(text), 'the roster must not hold a credential value');
});

test('the decisions register carries the roles decision', () => {
  const decisions = read('docs/decisions.json') as { decisions: Array<{ id: string }> };
  const ids = new Set(decisions.decisions.map((d) => d.id));
  for (const id of ['docs-agent-roles-01', 'docs-agent-roles-02']) {
    assert.ok(ids.has(id), `the decisions register does not carry ${id} - the role system is a decision, not a preference`);
  }
});
