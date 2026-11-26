// @last-edited: 2026-11-25 UTC+7.
// @title: generate-agent-roles - renders the role agent files from the one role register.
// @state: the OpenCode and Claude Code agent files are written from docs/agent-roles/registry.json, and --check refuses a tree whose files drifted from the register.
// @dependencies: node:fs, node:path, node:url.

// The register is the one source for who the roles are and what they may touch (docs/agent-roles/registry.json).
// The agent files are what a coding harness actually reads at session start, so they are rendered from that register instead of written by hand: a hand-written copy drifts the moment a scope changes, and a drifted scope is an agent editing everything.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));

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

export const readRegister = (): Register =>
  JSON.parse(fs.readFileSync(path.join(root, 'docs/agent-roles/registry.json'), 'utf8')) as Register;

const isDirectory = (relative: string): boolean => {
  try {
    return fs.statSync(path.join(root, relative)).isDirectory();
  } catch {
    return false;
  }
};

export const editResource = (scopePath: string): string => {
  if (scopePath.endsWith('/**') || scopePath.endsWith('/*') || scopePath.includes('*')) return scopePath;
  return isDirectory(scopePath) ? `${scopePath}/**` : scopePath;
};

const oneLine = (text: string): string => text.split('\n').map((line) => line.trim()).filter(Boolean).join(' ');

const goalLine = (text: string): string => {
  const lines = text.split('\n');
  const goalAt = lines.findIndex((line) => line.trim() === 'Goal:');
  if (goalAt < 0) return '';
  const body: string[] = [];
  for (const line of lines.slice(goalAt + 1)) {
    if (!line.trim()) {
      if (body.length > 0) break;
      continue;
    }
    body.push(line.trim());
  }
  return oneLine(body.join(' '));
};

const scopeBlock = (role: Role): string => {
  const work = role.scopePaths.map((scopePath) => `- ${scopePath}`).join('\n');
  const shared = role.communicationPaths.map((sharedPath) => `- ${sharedPath}`).join('\n');
  return `Scope (what this role may work in):\n\n${work}\n\nShared communication surface (every lane may write these):\n\n${shared}`;
};

export const renderRoleDocuments = (register: Register): Array<{ path: string; content: string }> => {
  const files: Array<{ path: string; content: string }> = [];
  for (const role of register.roles) {
    const current = fs.readFileSync(path.join(root, role.doc), 'utf8');
    const start = current.indexOf('Scope (what this role may work in):');
    const end = current.indexOf('\n\nGoal:', start);
    if (start < 0 || end < 0) continue;
    files.push({ path: role.doc, content: current.slice(0, start) + scopeBlock(role) + current.slice(end) });
  }
  const rolesDocPath = 'docs/agent-roles.md';
  const rolesDoc = fs.readFileSync(path.join(root, rolesDocPath), 'utf8');
  const tableStart = rolesDoc.indexOf('| agent id | division | scope (repo paths) | status |');
  const tableEnd = rolesDoc.indexOf('\n\n', tableStart);
  if (tableStart >= 0 && tableEnd > tableStart) {
    const rows = register.roles.map((role) => `| ${role.id} | ${role.division} | ${role.scopePaths.join(', ')} | ${role.status} |`);
    const header = '| agent id | division | scope (repo paths) | status |\n|---|---|---|---|';
    files.push({ path: rolesDocPath, content: rolesDoc.slice(0, tableStart) + header + '\n' + rows.join('\n') + rolesDoc.slice(tableEnd) });
  }
  return files;
};

export const renderAgentFiles = (
  register: Register,
  documents?: Map<string, string>,
): Array<{ path: string; content: string }> => {
  const files: Array<{ path: string; content: string }> = [];
  for (const role of register.roles) {
    const docBody = (documents?.get(role.doc) ?? fs.readFileSync(path.join(root, role.doc), 'utf8')).trimEnd();
    const goal = goalLine(docBody);
    const firstSentence = goal.split(/(?<=\.)\s/)[0] ?? goal;
    const description = `${role.id} - ${role.division}. ${firstSentence}`.slice(0, 200);
    const permissions = [
      '  - action: read',
      '    resource: "*"',
      '    effect: allow',
      '  - action: edit',
      '    resource: "*"',
      '    effect: deny',
      ...role.scopePaths.map((scopePath) => `  - action: edit\n    resource: "${editResource(scopePath)}"\n    effect: allow`),
      ...role.communicationPaths.map((sharedPath) => `  - action: edit\n    resource: "${editResource(sharedPath)}"\n    effect: allow`),
    ].join('\n');
    const body = [
      `Role id: ${role.id}`,
      `Division: ${role.division}`,
      `Team: ${role.team}`,
      '',
      `You work only inside this role's scope: ${role.scopePaths.join(', ')}.`,
      `You may also write the shared communication surface: ${role.communicationPaths.join(', ')} — the queue (handoff artifacts), the board, and the proof folder.`,
      'Work outside both goes through a handoff artifact in docs/agent-roles/queue/, written for the role that owns that scope.',
      'The shared board for what is missing and what can be upgraded is docs/agent-roles/status.md; refresh your line there.',
      'The shared gates before a claim of done: npm test and npm run check, plus py tests/browser_extension_test.py when the extension changes inside a page.',
      '',
      docBody,
    ].join('\n');

    files.push({
      path: `.opencode/agents/${role.id}.md`,
      content: `---\ndescription: ${JSON.stringify(description)}\nmode: all\nsteps: 120\npermissions:\n${permissions}\n---\n\n${body}\n`,
    });
    files.push({
      path: `.claude/agents/${role.id}.md`,
      content: `---\nname: ${role.id}\ndescription: ${JSON.stringify(description)}\n---\n\n${body}\n`,
    });
  }
  return files;
};

const main = (): void => {
  const register = readRegister();
  // The role documents are rendered first and their content is handed to the agent renderer: a renderer that reads the old document from disk writes an agent file one scope behind the register, and the check then fails on the file the same run wrote.
  const roleDocuments = renderRoleDocuments(register);
  const documents = new Map(roleDocuments.map((file) => [file.path, file.content]));
  const files = [...renderAgentFiles(register, documents), ...roleDocuments];
  const check = process.argv.includes('--check');
  const drifted: string[] = [];
  for (const file of files) {
    const full = path.join(root, file.path);
    const current = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
    if (current === file.content) continue;
    if (check) {
      drifted.push(file.path);
      continue;
    }
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, file.content);
    console.log(`wrote ${file.path}`);
  }
  // A renamed role leaves an agent file behind that no role owns, and an agent file nobody owns is a lane an agent can still enter, so the stale file goes.
  const rendered = new Set(files.map((file) => file.path));
  for (const folder of ['.opencode/agents', '.claude/agents']) {
    const full = path.join(root, folder);
    if (!fs.existsSync(full)) continue;
    for (const name of fs.readdirSync(full)) {
      const relative = `${folder}/${name}`;
      if (rendered.has(relative)) continue;
      if (check) {
        drifted.push(relative);
        continue;
      }
      fs.rmSync(path.join(full, name));
      console.log(`removed stale ${relative}`);
    }
  }
  if (check && drifted.length > 0) {
    console.error(`role agent files drifted from the register: ${drifted.join(', ')}`);
    console.error('run: node scripts/dev/generate-agent-roles.ts');
    process.exitCode = 1;
    return;
  }
  if (check) console.log(`role agent files match the register: ${files.length} files`);
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
