// @last-edited: 2026-11-26 UTC+7.
// @title: role-scope - a changed path must belong to a named role's work scope or shared communication surface.
// @state: reads the one role register and refuses paths outside the named roles' scopePaths and communicationPaths; the changed paths come from the diff itself, never from the caller.
// @dependencies: node:fs, node:path, node:child_process, node:url, strict.

// The register is the one source for the paths a role may write; decisions.json -> docs-agent-roles-01, docs-agent-roles-07.

// The changed paths are read from the diff the caller names (base...head).
// A caller that lists paths itself could list only the paths it is allowed to touch, so a path list is not accepted here: the diff is the evidence.
// A diff with no changed file is a refusal, not a pass, because an empty diff proves nothing.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));

export interface Role {
  id: string;
  scopePaths: string[];
  communicationPaths: string[];
}

export interface Register {
  roles: Role[];
}

export interface ScopeCheckResult {
  roleId: string;
  allowed: string[];
  refused: string[];
}

export interface MultiRoleCheckResult {
  owners: Array<{ path: string; owners: string[] }>;
  refused: string[];
  ambiguous: string[];
}

const normalizeRelativePath = (value: string): string | null => {
  const normalized = value.replace(/\\/g, '/').replace(/^\.\/+/, '');
  if (!normalized || normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized)) return null;
  if (normalized.split('/').some((segment) => segment === '..')) return null;
  return normalized.replace(/\/+$/, '');
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const globRegExp = (pattern: string): RegExp => {
  let source = '^';
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character !== '*') {
      source += escapeRegExp(character ?? '');
      continue;
    }
    if (pattern[index + 1] !== '*') {
      source += '[^/]*';
      continue;
    }
    if (pattern[index + 2] === '/') {
      source += '(?:.*/)?';
      index += 2;
      continue;
    }
    source += '.*';
    index += 1;
  }
  return new RegExp(`${source}$`);
};

export const scopePathMatches = (changedPath: string, scopePath: string): boolean => {
  const changed = normalizeRelativePath(changedPath);
  const pattern = normalizeRelativePath(scopePath);
  if (!changed || !pattern) return false;
  if (!pattern.includes('*')) return changed === pattern || changed.startsWith(`${pattern}/`);
  return globRegExp(pattern).test(changed);
};

export const checkRoleScope = (register: Register, roleId: string, changedPaths: string[]): ScopeCheckResult => {
  const role = register.roles.find((candidate) => candidate.id === roleId);
  if (!role) throw new Error(`unknown role: ${roleId}`);
  const allowed: string[] = [];
  const refused: string[] = [];
  for (const changedPath of changedPaths) {
    const inWorkScope = role.scopePaths.some((scopePath) => scopePathMatches(changedPath, scopePath));
    const inCommunicationScope = role.communicationPaths.some((communicationPath) => scopePathMatches(changedPath, communicationPath));
    if (inWorkScope || inCommunicationScope) allowed.push(changedPath);
    else refused.push(changedPath);
  }
  return { roleId, allowed, refused };
};

export const checkRolesScope = (register: Register, roleIds: string[], changedPaths: string[]): MultiRoleCheckResult => {
  const roles = roleIds.map((roleId) => {
    const role = register.roles.find((candidate) => candidate.id === roleId);
    if (!role) throw new Error(`unknown role: ${roleId}`);
    return role;
  });
  const owners: Array<{ path: string; owners: string[] }> = [];
  const refused: string[] = [];
  const ambiguous: string[] = [];
  for (const changedPath of changedPaths) {
    const pathOwners = roles
      .filter((role) => role.scopePaths.some((scopePath) => scopePathMatches(changedPath, scopePath))
        || role.communicationPaths.some((communicationPath) => scopePathMatches(changedPath, communicationPath)))
      .map((role) => role.id);
    owners.push({ path: changedPath, owners: pathOwners });
    if (pathOwners.length === 0) refused.push(changedPath);
    if (pathOwners.length > 1) ambiguous.push(changedPath);
  }
  return { owners, refused, ambiguous };
};

const readRegister = (): Register =>
  JSON.parse(fs.readFileSync(path.join(root, 'docs/agent-roles/registry.json'), 'utf8')) as Register;

export const changedPathsBetween = (base: string, head: string, cwd = process.cwd()): string[] => {
  // --no-renames keeps both sides of a move: a rename prints only its destination otherwise, and a lane could move another role's file into its own scope without the source path ever being checked.
  const output = execFileSync('git', ['diff', '--name-only', '--no-renames', `${base}...${head}`], { cwd, encoding: 'utf8' });
  return output.split('\n').map((line) => line.trim()).filter(Boolean);
};

const usage = (): void => {
  console.error('usage: node scripts/verify/role-scope.ts <role-id> [<role-id> ...] --base <ref> --head <ref>');
  console.error('the changed paths are read from the diff base...head; a path list is not accepted, because a caller could list only the paths it may touch.');
};

const main = (): void => {
  const args = process.argv.slice(2);
  const baseAt = args.indexOf('--base');
  const headAt = args.indexOf('--head');
  const roleIds = args.slice(0, baseAt < 0 ? args.length : baseAt).filter((value) => !value.startsWith('--'));
  const base = baseAt >= 0 ? args[baseAt + 1] : undefined;
  const head = headAt >= 0 ? args[headAt + 1] : undefined;
  if (roleIds.length === 0 || !base || !head) {
    usage();
    process.exitCode = 2;
    return;
  }
  let changedPaths: string[] = [];
  try {
    changedPaths = changedPathsBetween(base, head);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }
  if (changedPaths.length === 0) {
    console.error('the diff base...head changes no file, which proves nothing; refusing');
    process.exitCode = 1;
    return;
  }
  try {
    const register = readRegister();
    const result = checkRolesScope(register, roleIds, changedPaths);
    if (result.refused.length > 0) {
      console.error(`no named role may change:`);
      for (const changedPath of result.refused) console.error(`  ${changedPath}`);
      process.exitCode = 1;
      return;
    }
    if (result.ambiguous.length > 0) {
      console.error(`two named roles may change the same path:`);
      for (const changedPath of result.ambiguous) {
        const owner = result.owners.find((entry) => entry.path === changedPath);
        console.error(`  ${changedPath} (${owner?.owners.join(', ') ?? '?'})`);
      }
      process.exitCode = 1;
      return;
    }
    console.log(`the named roles may change all ${changedPaths.length} paths`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
};

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) main();
