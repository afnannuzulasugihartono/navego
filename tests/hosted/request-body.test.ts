// @last-edited: 2026-11-21 UTC+7.
// @title: request-body.test — one edge-runtime rule for JSON bodies, and each hosted refusal that follows it.
// @state: the helper's parsed-object result, its malformed and not-object refusals, and the seven function-specific 400 answers.
// @dependencies: node:test, strict, node:fs, node:module, node:vm, request-body, cors, required-env, sha256.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import { CORS_DEFAULT_ORIGINS, resolveAllowedOrigin } from '../../hosted/functions/_shared/cors.ts';
import { requiredEnv } from '../../hosted/functions/_shared/required-env.ts';
import { sha256 } from '../../hosted/functions/_shared/sha256.ts';
import { parseJsonObject, readJsonObject } from '../../hosted/functions/_shared/request-body.ts';

process.env.SUPABASE_URL ??= 'test';
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'test';
const denoStub = { env: { get: (key: string) => process.env[key] } };
(globalThis as { Deno?: typeof denoStub }).Deno = denoStub;

test('a plain object parses and keeps its fields', () => {
  const parsed = parseJsonObject('{"action":"start","count":2}');
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.deepEqual(parsed.body, { action: 'start', count: 2 });
});

test('null is refused as valid JSON that is not an object', () => {
  assert.deepEqual(parseJsonObject('null'), { ok: false, reason: 'not_object' });
});

test('an array is refused as valid JSON that is not an object', () => {
  assert.deepEqual(parseJsonObject('[1,2]'), { ok: false, reason: 'not_object' });
});

test('a string and a number are refused as valid JSON that is not an object', () => {
  assert.deepEqual(parseJsonObject('"hello"'), { ok: false, reason: 'not_object' });
  assert.deepEqual(parseJsonObject('42'), { ok: false, reason: 'not_object' });
});

test('malformed JSON is distinguished from valid JSON that is not an object', () => {
  assert.deepEqual(parseJsonObject('{not json'), { ok: false, reason: 'invalid_json' });
  assert.deepEqual(parseJsonObject(''), { ok: false, reason: 'invalid_json' });
});

test('the request reader returns the same result for a null body', async () => {
  const parsed = await readJsonObject(new Request('https://example.test/', { method: 'POST', body: 'null' }));
  assert.deepEqual(parsed, { ok: false, reason: 'not_object' });
});

type Handler = (req: Request) => Response | Promise<Response>;

interface Harness {
  post(raw: string, headers?: Record<string, string>): Promise<Response>;
}

function functionSource(name: string): string {
  return stripTypeScriptTypes(readFileSync(new URL(`../../hosted/functions/${name}/index.ts`, import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, ''));
}

function gatewayHarness(): Harness {
  const source = functionSource('navego-gateway');
  let handler: Handler = () => new Response(null, { status: 500 });
  vm.runInNewContext(source, {
    createClient: () => ({ auth: { getUser: async () => ({ data: { user: null }, error: null }) }, from: () => { throw new Error('no database read expected'); }, rpc: async () => ({ data: null, error: null }) }),
    CORS_DEFAULT_ORIGINS, resolveAllowedOrigin, requiredEnv, parseJsonObject,
    Deno: { env: { get: (key: string) => process.env[key] }, serve: (fn: Handler) => { handler = fn; } },
    Request, Response, URL, TextEncoder, TextDecoder, crypto
  });
  return {
    post: async (raw, headers = {}) => handler(new Request('https://example.test/functions/v1/navego-gateway/command', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: raw
    }))
  };
}

test('the gateway refuses a JSON null or array with INVALID_JSON and status 400', async () => {
  const h = gatewayHarness();
  for (const raw of ['null', '[]']) {
    const response = await h.post(raw);
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { ok: false, error: { code: 'INVALID_JSON', message: 'Body must be JSON.' } });
  }
});

function bridgeHarness(): Harness {
  const source = functionSource('navego-bridge');
  let handler: Handler = () => new Response(null, { status: 500 });
  vm.runInNewContext(source, {
    createClient: () => ({ rpc: async () => ({ data: null, error: null }) }),
    createEdgeLog: () => ({ error() {}, warn() {}, info() {} }),
    CORS_DEFAULT_ORIGINS, resolveAllowedOrigin, requiredEnv, sha256, parseJsonObject,
    isUpgradeRequest: () => false,
    serveDeviceSocket: () => ({ response: null }),
    gateVerdict: () => ({ ok: true }),
    Deno: { env: { get: (key: string) => process.env[key] }, serve: (fn: Handler) => { handler = fn; } },
    Request, Response, Headers, URL, TextEncoder, TextDecoder, crypto
  });
  return {
    post: async (raw, headers = {}) => handler(new Request('https://example.test/functions/v1/navego-bridge', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: raw
    }))
  };
}

test('the bridge refuses a null body with its own 400 shape', async () => {
  const response = await bridgeHarness().post('null');
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { ok: false, error: 'Body must be JSON.' });
});

function listenHarness(): Harness {
  const source = functionSource('navego-listen');
  let handler: Handler = () => new Response(null, { status: 500 });
  vm.runInNewContext(source, {
    createClient: () => ({ from: () => { throw new Error('no database read expected'); } }),
    createEdgeLog: () => ({ error() {}, warn() {}, info() {} }),
    CORS_DEFAULT_ORIGINS, resolveAllowedOrigin, requiredEnv, readJsonObject,
    Deno: { env: { get: (key: string) => process.env[key] }, serve: (fn: Handler) => { handler = fn; } },
    Request, Response, Headers, URL, TextEncoder, TextDecoder, crypto
  });
  return {
    post: async (raw, headers = {}) => handler(new Request('https://example.test/functions/v1/navego-listen', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: raw
    }))
  };
}

test('the listen edge refuses a null body with its own 400 shape', async () => {
  const response = await listenHarness().post('null');
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { ok: false, error: 'Body must be JSON.' });
});

function runnerHarness(): Harness {
  const source = functionSource('navego-runner');
  let handler: Handler = () => new Response(null, { status: 500 });
  vm.runInNewContext(source, {
    createClient: () => ({ from: () => { throw new Error('no database read expected'); } }),
    createEdgeLog: () => ({ error() {}, warn() {}, info() {} }),
    commandFailure: () => ({ code: 'COMMAND_FAILED', message: 'Workflow command failed.', details: null }),
    CORS_DEFAULT_ORIGINS, resolveAllowedOrigin, requiredEnv, readJsonObject,
    Deno: { env: { get: (key: string) => process.env[key] }, serve: (fn: Handler) => { handler = fn; } },
    Request, Response, Headers, URL, TextEncoder, TextDecoder, crypto
  });
  return {
    post: async (raw, headers = {}) => handler(new Request('https://example.test/functions/v1/navego-runner', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: raw
    }))
  };
}

test('the runner refuses a null body with its own 400 shape', async () => {
  const response = await runnerHarness().post('null');
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { ok: false, error: 'Invalid runner request.' });
});

function ocrHarness(): Harness {
  const source = functionSource('navego-ocr');
  let handler: Handler = () => new Response(null, { status: 500 });
  vm.runInNewContext(source, {
    createClient: () => ({ from: () => ({ select: () => ({ eq: () => ({ neq: () => ({ limit: async () => ({ data: [{ id: 'dev-1' }] }) }) }) }) }), auth: { getUser: async () => ({ data: { user: null }, error: null }) } }),
    CORS_DEFAULT_ORIGINS, resolveAllowedOrigin, requiredEnv, readJsonObject,
    Deno: { env: { get: (key: string) => key === 'GROQ_API_KEY' ? 'test-key' : process.env[key] }, serve: (fn: Handler) => { handler = fn; } },
    Request, Response, Headers, URL, TextEncoder, TextDecoder, crypto,
    fetch: async () => { throw new Error('no OCR call expected'); }
  });
  return {
    post: async (raw, headers = {}) => handler(new Request('https://example.test/functions/v1/navego-ocr', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-navego-token': 'a'.repeat(64), ...headers }, body: raw
    }))
  };
}

test('the OCR edge refuses a null body with its own 400 shape', async () => {
  const response = await ocrHarness().post('null');
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { ok: false, error: 'body must be JSON' });
});

function feedbackHarness(): Harness {
  const source = functionSource('navego-feedback');
  let handler: Handler = () => new Response(null, { status: 500 });
  vm.runInNewContext(source, {
    createClient: () => ({ from: () => { throw new Error('no database write expected'); } }),
    CORS_DEFAULT_ORIGINS, resolveAllowedOrigin, requiredEnv, readJsonObject,
    Deno: { env: { get: (key: string) => process.env[key] }, serve: (fn: Handler) => { handler = fn; } },
    Request, Response, Headers, URL, TextEncoder, TextDecoder, crypto
  });
  return {
    post: async (raw, headers = {}) => handler(new Request('https://example.test/functions/v1/navego-feedback', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: raw
    }))
  };
}

test('the feedback door refuses a null body with its own 400 shape', async () => {
  const response = await feedbackHarness().post('null');
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { ok: false, error: 'The body was not an object.' });
});

test('the billing edge normalises a null body to the empty object and still refuses an unknown action', () => {
  const source = readFileSync(new URL('../../hosted/functions/navego-billing/index.ts', import.meta.url), 'utf8');
  assert.match(source, /import \{ readJsonObject \} from "\.\.\/_shared\/request-body\.ts";/);
  assert.match(source, /const parsed = await readJsonObject\(req\);\s*return parsed\.ok \? parsed\.body : \{\};/);
  assert.match(source, /return json\(\{ error: "unknown action" \}, 400, cors\);/);
});
