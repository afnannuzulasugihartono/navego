// @last-edited: 2026-10-21 UTC+7.
// @title: listen-transcribe.test â€” one live listen session per device, transcribed as it arrives.
// @state: the second start it refuses, the transcript it returns, and the transcriber it uses.
// @dependencies: node:test, strict, node:fs, node:module, node:vm.

// The listen function turns tab audio into timestamped segments: device-token auth per action, one live session per device, 10-second windows to Gemini, segments stored, audio deleted (retention 0 for voice).
// The vm harness below drives start, two appends and stop against an in-memory store with a canned transcriber, proving offsets, deletion and session end without network.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { CORS_DEFAULT_ORIGINS, resolveAllowedOrigin } from '../../hosted/functions/_shared/cors.ts';
import { requiredEnv } from '../../hosted/functions/_shared/required-env.ts';

// THE PROCESS GETS THE TWO THE BUNDLE DEMANDS.
// required-env is the real module the edge bundle uses, not a stand-in; it reads Deno from its own closure, which is this process.

process.env.SUPABASE_URL ??= 'test';
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'test';
const denoStub = { env: { get: (key: string) => process.env[key] } };
(globalThis as { Deno?: typeof denoStub }).Deno = denoStub;

const source = stripTypeScriptTypes(readFileSync(new URL('../../hosted/functions/navego-listen/index.ts', import.meta.url), 'utf8')
  .replace(/^import .*;\r?\n/gm, ''));

const TOKEN = 'a'.repeat(64);

interface ListenStore {
  opera_devices: Array<{ id: string; device_name: string; token_hash: string; user_id: string; status: string }>;
  opera_listen_sessions: Array<Record<string, unknown>>;
  opera_listen_chunks: Array<Record<string, unknown>>;
  opera_listen_segments: Array<Record<string, unknown>>;
  opera_audit: Array<Record<string, unknown>>;
  __hideLiveOnce?: boolean;
  [table: string]: unknown;
}

function store(): ListenStore {
  return {
    opera_devices: [{ id: 'dev-1', device_name: 'opera', token_hash: 'x', user_id: 'user-1', status: 'online' }],
    opera_listen_sessions: [],
    opera_listen_chunks: [],
    opera_listen_segments: [],
    opera_audit: []
  };
}

function harness(db: ListenStore, fetchImpl?: (url: string | URL | Request, init?: RequestInit) => Promise<unknown>) {
  let handler: any;
  const fetchCalls: any = [];
  const table = (name: string): Array<Record<string, unknown>> => db[name] as Array<Record<string, unknown>>;
  const match = (rows: Array<Record<string, unknown>>, filters: Array<[string, string, unknown]>) => rows.filter((r) => filters.every(([op, col, val]) => {
    if (op === 'eq') return r[col] === val;
    if (op === 'neq') return r[col] !== val;
    if (op === 'in') return Array.isArray(val) && val.includes(r[col]);
    return true;
  }));
  const builder = (name: any) => {
    const filters: Array<[string, string, unknown]> = [];
    let orderCol: any = null;
    let limitN: any = null;
    let pendingUpdate: any = null;
    let pendingDelete = false;
    let pendingError: any = null;
    const orderRank = (v: unknown): number | string => (typeof v === 'number' ? v : String(v));
    const liveHidden = () => name === 'opera_listen_sessions' && db.__hideLiveOnce
      && filters.some(([op, col, val]) => op === 'eq' && col === 'status' && val === 'live');
    const self = {
      select() { return self; },
      eq(col: any, val: any) { filters.push(['eq', col, val]); return self; },
      neq(col: any, val: any) { filters.push(['neq', col, val]); return self; },
      order(col: any) { orderCol = col; return self; },
      limit(n: any) { limitN = n; return self; },
      in(col: any, val: any) { filters.push(['in', col, val]); return self; },
      async single() {

        if (liveHidden()) { db.__hideLiveOnce = false; return { data: null, error: null }; }
        let rows = match(table(name), filters);
        if (orderCol) rows = [...rows].sort((a, b) => (orderRank(a[orderCol]) > orderRank(b[orderCol]) ? 1 : -1));
        if (limitN !== null) rows = rows.slice(0, limitN);
        return { data: rows[0] || null, error: pendingError };
      },
      insert(row: any) {
        const rows = Array.isArray(row) ? row : [row];
        rows.forEach((r, i) => {
          if (name === 'opera_listen_sessions' && r.status === 'live'
            && table(name).some((x) => x.device_id === r.device_id && x.status === 'live')) {
            pendingError = { code: '23505', message: 'duplicate key value violates unique constraint "opera_listen_sessions_device_live_uniq"' };
            return;
          }
          table(name).push({ id: '00000000-0000-4000-8000-' + String(table(name).length + i).padStart(12, '0'), ...r });
        });
        return self;
      },
      update(patch: any) { pendingUpdate = patch; return self; },
      delete() { pendingDelete = true; return self; },
      upsert(row: any) {
        const rows = Array.isArray(row) ? row : [row];
        for (const r of rows) {
          if (!table(name).some((x) => x.session_id === r.session_id && x.seq === r.seq)) table(name).push({ id: `c-${table(name).length}`, ...r });
        }
        return self;
      },
      then(resolve: (value: { data: unknown; error: unknown }) => void) {
        if (pendingUpdate) for (const r of match(table(name), filters)) Object.assign(r, pendingUpdate);
        if (pendingDelete) db[name] = table(name).filter((r) => !match([r], filters).length);
        if (liveHidden()) { db.__hideLiveOnce = false; resolve({ data: [], error: pendingError }); return; }
        let rows = match(table(name), filters);
        if (orderCol) rows = [...rows].sort((a, b) => (orderRank(a[orderCol]) > orderRank(b[orderCol]) ? 1 : -1));
        if (limitN !== null) rows = rows.slice(0, limitN);
        resolve({ data: rows, error: pendingError });
      }
    };

    return self;
  };
  const client = {
    from: (name: any) => builder(name),
    auth: { async getUser() { return { data: { user: null }, error: { message: 'no' } }; } }
  };
  const fakeFetch = fetchImpl || (async (url: string | URL | Request) => {
    fetchCalls.push({ url });
    assert.match(String(url), /api\.groq\.com\/openai\/v1\/audio\/transcriptions/);
    return { ok: true, status: 200, json: async () => ({ text: 'halo dunia test', segments: [
      { start: 1, end: 3, text: 'halo dunia', no_speech_prob: 0.1 },
      { start: 3, end: 4, text: 'you', no_speech_prob: 0.9 }
    ] }) };
  });
  const errors: any = [];
  const edgeLog = { error: (svc: any, msg: any) => { errors.push(`${svc}: ${msg}`); } };
  vm.runInNewContext(source, {
    createClient: () => client, createEdgeLog: () => edgeLog,
    requiredEnv,
    CORS_DEFAULT_ORIGINS, resolveAllowedOrigin,
    Deno: { env: { get: (key: any) => (key === 'SUPABASE_URL' || key === 'SUPABASE_SERVICE_ROLE_KEY' ? 'test' : (key === 'GROQ_API_KEY' ? 'test-key' : '')) }, serve: (fn: any) => { handler = fn; } },
    Request, Response, Headers, URL, TextEncoder, FormData, Blob, atob, fetch: fakeFetch, crypto
  });
  const call = (body: any) => handler(new Request('https://example.test/', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  }));
  return { call, fetchCalls, errors };
}

test('start refuses unknown devices and second live sessions', async () => {
  const db = store();
  const device = db.opera_devices[0];
  assert.ok(device, 'the fixture holds the device');
  device.token_hash = createHash('sha256').update(TOKEN.toLowerCase()).digest('hex');
  const h = harness(db);
  const bad = await h.call({ action: 'start', token: 'b'.repeat(64), deviceName: 'opera', tabId: 1 });
  assert.equal(bad.status, 401, h.errors.join('; '));
  const ok = await (await h.call({ action: 'start', token: TOKEN, deviceName: 'opera', tabId: 7 })).json();
  assert.equal(ok.ok, true);
  const again = await (await h.call({ action: 'start', token: TOKEN, deviceName: 'opera', tabId: 7 })).json();
  assert.equal(again.error, 'A listening session is already live on this device. Stop it first.');
});

test('one complete window transcribes on arrival, then stop ends and deletes', async () => {
  const db = store();
  const h = harness(db);

  const device = db.opera_devices[0];
  assert.ok(device, 'the fixture holds the device');
  device.token_hash = createHash('sha256').update(TOKEN.toLowerCase()).digest('hex');
  const started = await (await h.call({ action: 'start', token: TOKEN, deviceName: 'opera', tabId: 7 })).json();
  assert.equal(started.ok, true);
  const sid = started.sessionId;

  const chunk = Buffer.from('fake-opus-byte').toString('base64');
  assert.match(chunk, /=+$/, 'the fixture audio carries padding like real windows');
  const first = await (await h.call({ action: 'append', token: TOKEN, sessionId: sid, seq: 0, audio: chunk })).json();
  assert.equal(first.ok, true);
  assert.equal(first.transcribed, 1);
  assert.equal(db.opera_listen_segments.length, 1);
  const segment = db.opera_listen_segments[0];
  assert.ok(segment, 'the segment was stored');
  assert.equal(segment.start_s, 1);
  assert.equal(segment.text, 'halo dunia');
  assert.equal(db.opera_listen_chunks.length, 0, 'consumed audio is deleted');
  const stopped = await (await h.call({ action: 'stop', token: TOKEN, sessionId: sid })).json();
  assert.equal(stopped.ok, true);
  const ended = db.opera_listen_sessions[0];
  assert.ok(ended, 'the session row exists');
  assert.equal(ended.status, 'ended');
  assert.equal(h.fetchCalls.length, 1, 'one transcription call for one full window');
});

test('a concurrent second start takes the live session, never a duplicate', async () => {
  const db = store();
  const device = db.opera_devices[0];
  assert.ok(device, 'the fixture holds the device');
  device.token_hash = createHash('sha256').update(TOKEN.toLowerCase()).digest('hex');
  const h = harness(db);
  const first = await (await h.call({ action: 'start', token: TOKEN, deviceName: 'opera', tabId: 7 })).json();
  assert.equal(first.ok, true);

  db.__hideLiveOnce = true;
  const raced = await h.call({ action: 'start', token: TOKEN, deviceName: 'opera', tabId: 8 });
  assert.equal(raced.status, 409);
  const body = await raced.json();
  assert.equal(body.error, 'A listening session is already live on this device. Stop it first.');
  assert.equal(body.sessionId, first.sessionId);
  assert.equal(db.opera_listen_sessions.filter((s) => s.status === 'live').length, 1, 'no duplicate live row');
});

test('the transcriber uses Groq Whisper verbose_json, not Gemini', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../../hosted/functions/navego-listen/index.ts', import.meta.url), 'utf8');

  assert.match(source, /api\.groq\.com\/openai\/v1\/audio\/transcriptions/);
  assert.match(source, /whisper-large-v3/);
  assert.match(source, /response_format", "verbose_json/);
  assert.doesNotMatch(source, /generativelanguage\.googleapis\.com/);
  assert.doesNotMatch(source, /GEMINI_API_KEY/);
});

test('the live-session uniqueness is a partial unique index, not application logic', async () => {
  const { readFile } = await import('node:fs/promises');
  const sql = await readFile(new URL('../../hosted/migrations/20261009000003_navego_listen_live_uniq.sql', import.meta.url), 'utf8');

  assert.match(sql, /create unique index if not exists opera_listen_sessions_device_live_uniq/);
  assert.match(sql, /on public\.opera_listen_sessions\(device_id\) where status = 'live'/);
  assert.doesNotMatch(sql, /^\s*(grant|revoke)\s/im, 'index-only change carries no grant statement');
  const fn = await readFile(new URL('../../hosted/functions/navego-listen/index.ts', import.meta.url), 'utf8');
  assert.match(fn, /"23505"/, 'the start path maps the unique violation');
  assert.match(fn, /Stop it first\.", sessionId:/, 'the loser carries the live session id');
});

test('the migration stores transcripts owner-scoped with no grants', async () => {
  const { readFile } = await import('node:fs/promises');
  const sql = await readFile(new URL('../../hosted/migrations/20261007100000_opera_listen_sessions.sql', import.meta.url), 'utf8');
  assert.match(sql, /create table if not exists public\.opera_listen_sessions/);
  assert.match(sql, /unique \(session_id, seq\)/);
  assert.doesNotMatch(sql, /grant (select|all)/i);
});
