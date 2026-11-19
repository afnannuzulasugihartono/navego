// @last-edited: 2026-11-20 UTC+7.
// @title: env-validation — the hosted functions validate the environment and request body before feeding typed code.
// @state: the hosted functions read their required environment through requiredEnv before feeding typed code; navego-billing's request body is an object before any action reads it.
// @dependencies: node:test, strict, node:fs, node:path, node:url.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (file: string): string => fs.readFileSync(path.join(root, file), 'utf8');

test('navego-billing reads its required environment through requiredEnv', () => {
  const source = read('hosted/functions/navego-billing/index.ts');
  for (const name of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'BILLING_SECRET']) {
    assert.match(source, new RegExp(`requiredEnv\\("${name}"\\)`), `navego-billing must validate ${name}`);
  }
});

test('navego-billing parses the request body as an object before any action reads it', () => {
  const source = read('hosted/functions/navego-billing/index.ts');
  assert.match(source, /isRecord\(parsed\)\s*\?\s*parsed\s*:\s*\{\}/);
});

test('navego-auth reads its required environment through requiredEnv', () => {
  const source = read('hosted/functions/navego-auth/index.ts');
  for (const name of ['SUPABASE_URL', 'SUPABASE_ANON_KEY']) {
    assert.match(source, new RegExp(`requiredEnv\\("${name}"\\)`), `navego-auth must validate ${name}`);
  }
});
