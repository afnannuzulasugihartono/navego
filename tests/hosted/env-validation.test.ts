// @last-edited: 2026-11-21 UTC+7.
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
  assert.match(source, /import \{ readJsonObject \} from "\.\.\/_shared\/request-body\.ts";/);
  assert.match(source, /const parsed = await readJsonObject\(req\);\s*return parsed\.ok \? parsed\.body : \{\};/);
});

test('navego-auth reads its required environment through requiredEnv', () => {
  const source = read('hosted/functions/navego-auth/index.ts');
  for (const name of ['SUPABASE_URL', 'SUPABASE_ANON_KEY']) {
    assert.match(source, new RegExp(`requiredEnv\\("${name}"\\)`), `navego-auth must validate ${name}`);
  }
});

test('every edge function reads the database environment through requiredEnv', () => {
  const dir = path.join(root, 'hosted', 'functions');
  const functions = fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== '_shared')
    .map((entry) => entry.name)
    .sort();
  assert.ok(functions.length >= 10, `the tree has the edge functions, found ${functions.length}`);

  for (const name of functions) {
    const source = fs.readFileSync(path.join(dir, name, 'index.ts'), 'utf8');
    assert.match(source, /requiredEnv\("SUPABASE_URL"\)/, `${name} must validate SUPABASE_URL instead of reading it as an empty string`);
    for (const variable of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
      assert.doesNotMatch(source, new RegExp(`Deno\\.env\\.get\\("${variable}"\\)`), `${name} must not read ${variable} behind the validator`);
      if (source.includes(variable)) {
        assert.match(source, new RegExp(`requiredEnv\\("${variable}"\\)`), `${name} must validate ${variable}`);
      }
    }
  }
});
