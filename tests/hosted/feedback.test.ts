// @last-edited: 2026-11-15 UTC+7.
// @title: feedback.test — the pilot door: one answer in, one row stored, nothing else readable.
// @state: the handler accepts a POST with a name and a contact, stores the newest answer per contact, and refuses everything else with a named reason.
// @dependencies: node:test, strict, fs, module, vm, cors, required-env.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import { CORS_DEFAULT_ORIGINS, resolveAllowedOrigin } from '../../hosted/functions/_shared/cors.ts';
import { requiredEnv } from '../../hosted/functions/_shared/required-env.ts';

process.env.SUPABASE_URL ??= 'test';
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'test';
const denoStub = { env: { get: (key: string) => process.env[key] } };
(globalThis as { Deno?: typeof denoStub }).Deno = denoStub;

const source = stripTypeScriptTypes(
  readFileSync(new URL('../../hosted/functions/opera-agent-feedback/index.ts', import.meta.url), 'utf8')
    .replace(/^import\s+["']@supabase\/edge-runtime["'];?\s*$/m, '')
    .replace(/^import\s+\{[^}]*\}\s+from\s+["']@supabase\/supabase-js["'];?\s*$/m, '')
    .replace(/^import\s+\{[^}]*\}\s+from\s+["'][^"']*cors\.ts["'];?\s*$/m, '')
    .replace(/^import\s+\{[^}]*\}\s+from\s+["'][^"']*required-env\.ts["'];?\s*$/m, '')
);

function harness() {
  const stored: any = [];
  let handler: any = null;
  const client = {
    from(table: any) {
      return {
        upsert(row: any, options: any) {
          stored.push({ table, row, options });
          return {
            select() { return this; },
            async single() { return { data: { contact: row.contact, updated_at: row.updated_at }, error: null }; }
          };
        }
      };
    }
  };
  vm.runInNewContext(source, {
    createClient: () => client,
    CORS_DEFAULT_ORIGINS,
    resolveAllowedOrigin,
    requiredEnv,
    Deno: { env: { get: (key: any) => process.env[key] }, serve: (fn: any) => { handler = fn; } },
    Request,
    Response,
    URL,
    TextEncoder,
    TextDecoder,
    crypto
  });
  const post = (body: any, headers = {}) => handler(new Request('https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/opera-agent-feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://opera-agent.pages.dev', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  }));
  return { stored, post, raw: (req: any) => handler(req) };
}

test('an answer with a name and a contact is stored, one row per contact', async () => {
  const { stored, post } = harness();
  const response = await post({
    name: 'Sari',
    contact: '0812-3456-7890',
    firm: 'Firma Sari',
    portal: 'BCA KlikBCA',
    clients: '12',
    pain: 'download satu per satu',
    wantsSlot: true,
    source: 'pilot-page'
  });
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.contact, '0812-3456-7890');
  assert.equal(stored.length, 1);
  assert.equal(stored[0].table, 'opera_feedback');
  assert.equal(stored[0].options.onConflict, 'contact');
  assert.equal(stored[0].row.wants_slot, true);
  assert.equal(stored[0].row.portal, 'BCA KlikBCA');
});

test('a second answer from the same contact replaces the first', async () => {
  const { stored, post } = harness();
  await post({ name: 'Sari', contact: '0812-3456-7890', portal: 'BCA' });
  await post({ name: 'Sari', contact: '0812-3456-7890', portal: 'Mandiri' });
  assert.equal(stored.length, 2);
  assert.ok(stored.every((entry: any) => entry.options.onConflict === 'contact'));
  assert.equal(stored[1].row.portal, 'Mandiri');
});

test('an answer without a way to reply is refused, and nothing is stored', async () => {
  const { stored, post } = harness();
  const response = await post({ name: 'Sari', contact: '  ' });
  assert.equal(response.status, 400);
  assert.equal(stored.length, 0);
});

test('a body that is not an object, and a method that is not POST, are refused', async () => {
  const { post, raw } = harness();
  const notJson = await post('not json at all');
  assert.equal(notJson.status, 400);
  const get = await raw(new Request('https://x.test/functions/v1/opera-agent-feedback', { method: 'GET' }));
  assert.equal(get.status, 405);
});

test('only the site may post, and only the site gets the CORS answer', async () => {
  const { post } = harness();
  const ok = await post({ name: 'Sari', contact: '0812-3456-7890' });
  assert.equal(ok.headers.get('access-control-allow-origin'), 'https://opera-agent.pages.dev');
  const evil = await post({ name: 'Sari', contact: '0812-3456-7890' }, { origin: 'https://evil.example' });
  assert.equal(evil.headers.get('access-control-allow-origin'), null);
});

test('the fields are cut to the length the table holds, so a long answer cannot overflow the row', async () => {
  const { stored, post } = harness();
  const response = await post({ name: 'N'.repeat(400), contact: '0812-3456-7890', pain: 'x'.repeat(5000) });
  assert.equal(response.status, 201);
  assert.equal(stored[0].row.name.length, 120);
  assert.equal(stored[0].row.pain.length, 600);
});

test('the preflight answers 204 with no body, because a 204 with a body is refused by the runtime', async () => {
  const { raw } = harness();
  const preflight = await raw(new Request('https://x.test/functions/v1/opera-agent-feedback', {
    method: 'OPTIONS',
    headers: { origin: 'https://opera-agent.pages.dev', 'access-control-request-method': 'POST' }
  }));
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), 'https://opera-agent.pages.dev');
  assert.equal(preflight.headers.get('access-control-allow-methods'), 'POST, OPTIONS');
  assert.equal(await preflight.text(), '', 'a 204 carries no body at all');
});

test('the migration keeps the answers closed to every role but the service role', () => {
  const sql = readFileSync(new URL('../../hosted/migrations/20261115000000_opera_feedback.sql', import.meta.url), 'utf8');
  assert.match(sql, /create table if not exists public\.opera_feedback/);
  assert.match(sql, /constraint opera_feedback_contact_once unique \(contact\)/);
  assert.match(sql, /alter table public\.opera_feedback enable row level security/);
  assert.match(sql, /revoke all on table public\.opera_feedback from anon, authenticated/);
  assert.match(sql, /grant select, insert, update on table public\.opera_feedback to service_role/);
});
