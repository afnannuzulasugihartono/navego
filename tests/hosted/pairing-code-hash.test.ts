// @last-edited: 2026-11-23 UTC+7.
// @title: pairing-code-hash - the pairing code is random, and its hash is the hash of that code.
// @state: the last migration that defines opera_create_pairing_code keeps the issuer rules and hashes v_code, never the device name.
// @dependencies: node:test, strict, fs, path.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const migrations = path.join(root, 'hosted/migrations');

function latestDefinition(): { file: string; sql: string } {
  const files = fs.readdirSync(migrations).filter((file) => file.endsWith('.sql')).sort();
  for (const file of [...files].reverse()) {
    const sql = fs.readFileSync(path.join(migrations, file), 'utf8');
    const start = sql.indexOf('create or replace function public.opera_create_pairing_code');
    if (start < 0) continue;
    const end = sql.indexOf('end $$;', start);
    assert.ok(end > start, `${file}: the pairing function has an end`);
    return { file, sql: sql.slice(start, end + 7) };
  }
  throw new Error('no migration defines opera_create_pairing_code');
}

test('the stored pairing-code hash is the hash of the random code, not of the device name', () => {
  const { file, sql } = latestDefinition();
  assert.match(sql, /public\.opera_sha256\(v_code\)/, `${file}: the code_hash insert must hash the random v_code`);
  assert.doesNotMatch(sql, /opera_sha256\(upper\(trim\(p_device_name\)\)\)/, `${file}: hashing the device name makes the second code for that name violate opera_pairing_codes_code_hash_key`);
});

test('the fix keeps the per-account rate limit and the ownership fence', () => {
  const { file, sql } = latestDefinition();
  assert.match(sql, /v_issuer := case when auth\.uid\(\) is not null then auth\.uid\(\) else p_issued_by end/, `${file}: the issuer comes from the signed-in account first`);
  assert.match(sql, /where issued_by = v_issuer and created_at > now\(\) - interval '1 hour'/, `${file}: the rate limit is per issuing account`);
  assert.match(sql, /That device name belongs to another account\./, `${file}: another account's device name cannot be taken`);
});
