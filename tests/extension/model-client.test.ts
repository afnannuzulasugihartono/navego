// @last-edited: 2026-10-25 UTC+7.
// @title: model-client.test — the device-local model compiler holds its gate and its bounds.
// @state: the config gate, the single destination, the call bound, the streamed answer assembled from deltas, and the key that never leaves.
// @dependencies: node:test, strict, extension-source.

import test from 'node:test';
import assert from 'node:assert/strict';
import { extensionSource } from '../helpers/extension-source.ts';
import { composeModelPlan, buildProbeRequest, endpointOk, MODEL_TIMEOUT_MS, MODEL_MAX_TOKENS } from '../../extension/lib/model-client.js';

interface FetchCall {
  readonly url: string;
  readonly init?: RequestInit | undefined;
}

interface Tracker {
  calls: FetchCall[];
}

const track = (): Tracker => ({ calls: [] });

const asResponse = (value: unknown): Response => value as Response;

const storageOf = (cfg: Record<string, unknown> = {}) => ({ get: async () => cfg, set: async () => {} });
const program = { root: { type: 'SEQUENCE', children: [{ type: 'COMMAND', method: 'page.find', arguments: { text: 'Skip' }, resultBinding: 'hit' }] } };
const fetchOk = (t: Tracker, body: unknown = program) => {
  t.calls = [];
  return async (url: string, init?: RequestInit) => {
    t.calls.push(init === undefined ? { url } : { url, init });
    return asResponse({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: JSON.stringify(body) } }] }) });
  };
};
const full = { modelEndpoint: 'https://llm.example.com/v1/chat/completions', modelName: 'm', modelKey: 'fixture-model-key-abc123' };
const target = { deviceId: 'opera', tabId: 1 };
const budgets = { astDepth: 12, browserCommandLeavesPerRun: 12 };

const sseResponse = (chunks: string[]) => {
  const encoder = new TextEncoder();
  let index = 0;
  const reader = {
    cancelled: false,
    read: async () => {
      const part = chunks[index];
      index += 1;
      return part === undefined ? { done: true as const } : { done: false as const, value: encoder.encode(part) };
    },
    cancel: async () => { reader.cancelled = true; }
  };
  return {
    ok: true, status: 200,
    headers: { get: (name: string) => (String(name).toLowerCase() === 'content-type' ? 'text/event-stream' : null) },
    body: { getReader: () => reader },
    reader
  };
};
const sseChunks = (text: string, { end = true }: { end?: boolean } = {}) => {
  const chunks = [text.slice(0, 8), text.slice(8, 20), text.slice(20)]
    .filter(Boolean)
    .map((part) => `data: ${JSON.stringify({ choices: [{ delta: { content: part } }] })}\n\n`);
  if (end) chunks.push('data: [DONE]\n\n');
  return chunks;
};

test('unconfigured device never fetches', async () => {
  const t = track();
  const out = await composeModelPlan({ storage: storageOf({}), fetchImpl: fetchOk(t) }, { goal: 'x', page: {}, target, budgets });
  assert.equal(out.ok, false);
  assert.ok('code' in out);
  assert.equal(out.code, 'MODEL_NOT_CONFIGURED');
  assert.deepEqual(t.calls, []);
});

test('http remote endpoint is refused before fetch', async () => {
  const t = track();
  const out = await composeModelPlan({ storage: storageOf({ ...full, modelEndpoint: 'http://evil.example.com/x' }), fetchImpl: fetchOk(t) }, { goal: 'x', page: {}, target, budgets });
  assert.equal(out.ok, false);
  assert.deepEqual(t.calls, []);
});

test('one bounded POST to the configured endpoint only, key never in body or result', async () => {
  const t = track();
  const out = await composeModelPlan({ storage: storageOf(full), fetchImpl: fetchOk(t) }, { goal: 'find skip', page: {}, target, budgets });
  assert.equal(out.ok, true);
  assert.equal(t.calls.length, 1);
  const firstCall = t.calls[0];
  assert.ok(firstCall);
  assert.equal(firstCall.url, full.modelEndpoint);
  assert.ok(firstCall.init);
  const sent = JSON.parse(firstCall.init.body as string);
  assert.equal(sent.model, 'm');
  assert.equal(sent.temperature, 0);
  assert.ok(!JSON.stringify(sent).includes('fixture-model-key-abc123'), 'key must not be in the body');
  const sentHeaders = firstCall.init.headers as Record<string, string>;
  assert.equal(sentHeaders.Authorization, 'Bearer fixture-model-key-abc123');
  assert.ok(!JSON.stringify(out).includes('fixture-model-key-abc123'), 'key must not be in the result');
});

test('non-conforming response is refused, never a program', async () => {
  const t = track();
  const bad = async (url: string) => { t.calls = [{ url }]; return asResponse({ ok: true, status: 200, json: async () => ({ choices: [] }) }); };
  const out = await composeModelPlan({ storage: storageOf(full), fetchImpl: bad }, { goal: 'x', page: {}, target, budgets });
  assert.equal(out.ok, false);
  assert.ok('code' in out);
  assert.equal(out.code, 'MODEL_BAD_RESPONSE');
});

test('a streamed answer is assembled from deltas and compiled', async () => {
  const t = track();
  let response: ReturnType<typeof sseResponse> | undefined;
  const fetchImpl = async (url: string, init?: RequestInit) => { t.calls = [{ url, init }]; const rawResponse = sseResponse(sseChunks(JSON.stringify(program))); response = rawResponse; return asResponse(rawResponse); };
  const out = await composeModelPlan({ storage: storageOf(full), fetchImpl }, { goal: 'find skip', page: {}, target, budgets });
  assert.equal(out.ok, true);
  const streamedCall = t.calls[0];
  assert.ok(streamedCall?.init);
  const sent = JSON.parse(streamedCall.init.body as string);
  assert.equal(sent.stream, true);
  assert.ok(response);
  assert.equal(response.reader.cancelled, true, 'the reader is released once [DONE] lands');
});

test('a stream that ends without [DONE] still compiles', async () => {
  const fetchImpl = async () => asResponse(sseResponse(sseChunks(JSON.stringify(program), { end: false })));
  const out = await composeModelPlan({ storage: storageOf(full), fetchImpl }, { goal: 'x', page: {}, target, budgets });
  assert.equal(out.ok, true);
});

test('keep-alive and unparsable stream lines are skipped, never fatal', async () => {
  const chunks = [
    ': keep-alive\n\n',
    'data: not-json\n\n',
    'data: {"choices":[{"delta":{}}]}\n\n',
    'data: {"error":{"message":"late"}}\n\n',
    ...sseChunks(JSON.stringify(program), { end: false }),
    'data: [DONE]\n\n'
  ];
  const fetchImpl = async () => asResponse(sseResponse(chunks));
  const out = await composeModelPlan({ storage: storageOf(full), fetchImpl }, { goal: 'x', page: {}, target, budgets });
  assert.equal(out.ok, true);
});

test('a server that ignores stream:true and answers plain JSON still compiles', async () => {
  const t = track();
  const fetchImpl = async (url: string, init?: RequestInit) => {
    t.calls = [{ url, init }];
    return asResponse({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ choices: [{ message: { content: JSON.stringify(program) } }] }) });
  };
  const out = await composeModelPlan({ storage: storageOf(full), fetchImpl }, { goal: 'x', page: {}, target, budgets });
  assert.equal(out.ok, true);
  const plainCall = t.calls[0];
  assert.ok(plainCall?.init);
  assert.equal(JSON.parse(plainCall.init.body as string).stream, true);
});

test('a stream without any text surfaces MODEL_BAD_RESPONSE', async () => {
  const fetchImpl = async () => asResponse(sseResponse(['data: {"choices":[{"delta":{}}]}\n\n', 'data: [DONE]\n\n']));
  const out = await composeModelPlan({ storage: storageOf(full), fetchImpl }, { goal: 'x', page: {}, target, budgets });
  assert.equal(out.ok, false);
  assert.ok('code' in out);
  assert.equal(out.code, 'MODEL_BAD_RESPONSE');
});

test('a hung stream surfaces MODEL_TIMEOUT, never a hang', async () => {
  const fetchImpl = async () => asResponse({
    ok: true, status: 200,
    headers: { get: () => 'text/event-stream' },
    body: { getReader: () => ({ read: () => Promise.reject(Object.assign(new Error('timed out'), { name: 'TimeoutError' })), cancel: async () => {} }) }
  });
  const out = await composeModelPlan({ storage: storageOf(full), fetchImpl }, { goal: 'x', page: {}, target, budgets });
  assert.equal(out.ok, false);
  assert.ok('code' in out);
  assert.equal(out.code, 'MODEL_TIMEOUT');
});

test('probe carries no page content and no goal', () => {
  const probe = buildProbeRequest({ model: 'm' });
  assert.equal(probe.temperature, 0);
  assert.ok(JSON.stringify(probe).length < 300);
});

test('a hung endpoint surfaces MODEL_TIMEOUT, never a hang', async () => {
  const hanging = (): Promise<Response> => Promise.reject(Object.assign(new Error('timed out'), { name: 'TimeoutError' }));
  const out = await composeModelPlan({ storage: storageOf(full), fetchImpl: hanging }, { goal: 'x', page: {}, target, budgets });
  assert.equal(out.ok, false);
  assert.ok('code' in out);
  assert.equal(out.code, 'MODEL_TIMEOUT');
});
test('compiler bounds are pinned', () => {
  assert.equal(MODEL_TIMEOUT_MS, 30000);
  assert.equal(MODEL_MAX_TOKENS, 2000);
});

test('endpoint allowlist: https or loopback only', () => {
  assert.equal(endpointOk('https://llm.example.com/v1/chat/completions'), true);
  assert.equal(endpointOk('http://127.0.0.1:11434/v1/chat/completions'), true);
  assert.equal(endpointOk('http://evil.example.com/x'), false);
  assert.equal(endpointOk('not-a-url'), false);
});

test('background routes the options probe action to the compiler module', async () => {
  const bg = await extensionSource();
  assert.ok(bg.includes(`scope === 'opera-options'`));
  assert.ok(bg.includes(`action === 'testModel'`));
  assert.ok(bg.includes('buildProbeRequest'));
});

test('malformed endpoint refuses before fetch', async () => {
  const t = track();
  const out = await composeModelPlan({ storage: storageOf({ ...full, modelEndpoint: 'notaurl' }), fetchImpl: fetchOk(t) }, { goal: 'x', page: {}, target, budgets });
  assert.equal(out.ok, false);
  assert.ok('code' in out);
  assert.equal(out.code, 'MODEL_BAD_ENDPOINT');
  assert.deepEqual(t.calls, []);
});

test('non-timeout rejection surfaces MODEL_HTTP_ERROR, never MODEL_TIMEOUT', async () => {
  const boom = async () => { throw new Error('boom'); };
  const out = await composeModelPlan({ storage: storageOf(full), fetchImpl: boom }, { goal: 'x', page: {}, target, budgets });
  assert.equal(out.ok, false);
  assert.ok('code' in out);
  assert.equal(out.code, 'MODEL_HTTP_ERROR');
});

test('non-ok status surfaces MODEL_HTTP_ERROR with the status', async () => {
  const bad = async () => asResponse({ ok: false, status: 500 });
  const out = await composeModelPlan({ storage: storageOf(full), fetchImpl: bad }, { goal: 'x', page: {}, target, budgets });
  assert.equal(out.ok, false);
  assert.ok('code' in out && 'message' in out);
  assert.equal(out.code, 'MODEL_HTTP_ERROR');
  assert.equal(typeof out.message, 'string');
  assert.ok(String(out.message).includes('500'));
});
