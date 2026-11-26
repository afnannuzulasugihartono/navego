// @last-edited: 2026-11-26 UTC+7.
// @title: role-scope - a changed path must belong to the named role's work scope or shared communication surface.
// @state: reads the one role register and refuses paths outside the named role's scopePaths and communicationPaths.
// @dependencies: node:fs, node:path, node:url, strict.

// The register is the one source for the paths a role may write; decisions.json -> docs-agent-roles-01, docs-agent-roles-07.

import fs from 'node:fs';
import path from 'node:path';
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

const scopePathMatches = (changedPath: string, scopePath: string): boolean => {
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

const readRegister = (): Register =>
  JSON.parse(fs.readFileSync(path.join(root, 'docs/agent-roles/registry.json'), 'utf8')) as Register;

const main = (): void => {
  const [roleId, ...changedPaths] = process.argv.slice(2);
  if (!roleId || changedPaths.length === 0) {
    console.error('usage: node scripts/verify/role-scope.ts <role-id> <changed-path> [changed-path ...]');
    process.exitCode = 2;
    return;
  }
  try {
    const result = checkRoleScope(readRegister(), roleId, changedPaths);
    if (result.refused.length > 0) {
      console.error(`role ${roleId} may not change:`);
      for (const changedPath of result.refused) console.error(`  ${changedPath}`);
      process.exitCode = 1;
      return;
    }
    console.log(`role ${roleId} may change all ${result.allowed.length} paths`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
};

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) main();
