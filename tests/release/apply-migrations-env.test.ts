// @last-edited: 2026-11-20 UTC+7.
// @title: apply-migrations env validation - refuse a missing or malformed credential before the first request.
// @state: the script exits 2 naming the problem when SUPABASE_ACCESS_TOKEN is unset or shorter than eight characters, or when SUPABASE_PROJECT_REF is set to a non-20-character reference; with a well-formed token and no files it reaches the usage message.
// @dependencies: node:test, strict, node:child_process, node:path, node:url.

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const script = path.join(root, 'scripts', 'release', 'apply-migrations.ts');

const run = (overrides: { SUPABASE_ACCESS_TOKEN?: string; SUPABASE_PROJECT_REF?: string }): { status: number | null; stderr: string } => {
  const env: NodeJS.ProcessEnv = { ...process.env };
  delete env.SUPABASE_ACCESS_TOKEN;
  delete env.SUPABASE_PROJECT_REF;
  if (overrides.SUPABASE_ACCESS_TOKEN !== undefined) env.SUPABASE_ACCESS_TOKEN = overrides.SUPABASE_ACCESS_TOKEN;
  if (overrides.SUPABASE_PROJECT_REF !== undefined) env.SUPABASE_PROJECT_REF = overrides.SUPABASE_PROJECT_REF;
  const result = spawnSync(process.execPath, [script], { env, encoding: 'utf8', timeout: 30000 });
  return { status: result.status, stderr: String(result.stderr) };
};

test('a missing token is refused before anything is sent', () => {
  const result = run({});
  assert.equal(result.status, 2);
  assert.match(result.stderr, /SUPABASE_ACCESS_TOKEN is not set or too short/);
});

test('a short token is refused the same way', () => {
  const result = run({ SUPABASE_ACCESS_TOKEN: 'ab' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /SUPABASE_ACCESS_TOKEN is not set or too short/);
});

test('a malformed project reference is refused before any request', () => {
  const result = run({ SUPABASE_ACCESS_TOKEN: 'sbp_validtoken123456', SUPABASE_PROJECT_REF: 'BADREF' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /SUPABASE_PROJECT_REF is malformed/);
});

test('well-formed credentials reach the usage message (no files given)', () => {
  const result = run({ SUPABASE_ACCESS_TOKEN: 'sbp_validtoken123456' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /usage: node scripts\/release\/apply-migrations\.ts/);
});
