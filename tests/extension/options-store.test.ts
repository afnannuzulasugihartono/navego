// @last-edited: 2026-11-21 UTC+7.
// @title: options-store.test — the options the person set are the options the extension uses.
// @state: the stored defaults, the provider list, the reset that returns them, and the predecessor bridge URL migration.
// @dependencies: node:test, strict, options-store, endpoints.

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadOptions, saveBridgeUrl, saveLogLevel, saveModelEndpoint, saveModelKey, saveModelName, readModelConfig, MODEL_PROVIDERS, DEFAULT_PROVIDER_ID } from '../../extension/lib/options-store.js';
import { DEFAULT_BRIDGE_URL } from '../../extension/lib/endpoints.js';
import { PREDECESSOR_BRIDGE_SLUG, PREDECESSOR_BRIDGE_URL } from '../helpers/bridge-url-fixture.ts';

const fake = (seed: Record<string, unknown> = {}) => {
  const data: Record<string, unknown> = { ...seed };
  return {
    data,
    async get(keys: string[]) { const out: Record<string, unknown> = {}; for (const k of keys) out[k] = data[k]; return out; },
    async set(patch: Record<string, unknown>) { Object.assign(data, patch); }
  };
};

test('loadOptions returns defaults for empty storage', async () => {
  const loaded = await loadOptions(fake());
  assert.equal(loaded.bridgeUrl, DEFAULT_BRIDGE_URL);
  assert.equal(loaded.logLevel, 'warn');
});

test('saveBridgeUrl rejects non-https, empty resets to default', async () => {
  const s = fake();
  await assert.rejects(saveBridgeUrl(s, 'http://evil.example/hook'), /https/);
  await assert.rejects(saveBridgeUrl(s, 'not a url'), /https/);
  await saveBridgeUrl(s, '');
  assert.equal(s.data.bridgeUrl, DEFAULT_BRIDGE_URL);
  await saveBridgeUrl(s, 'https://my-bridge.example/hook');
  assert.equal(s.data.bridgeUrl, 'https://my-bridge.example/hook');
});

test('saveLogLevel accepts only the three levels', async () => {
  const s = fake();
  await saveLogLevel(s, 'debug');
  assert.equal(s.data.logLevel, 'debug');
  await assert.rejects(saveLogLevel(s, 'verbose'), /level/i);
  await assert.rejects(saveLogLevel(s, ''), /level/i);
});

test('stored values round-trip verbatim', async () => {
  const s = fake({ bridgeUrl: 'https://x.example/', logLevel: 'error' });
  const loaded = await loadOptions(s);
  assert.equal(loaded.bridgeUrl, 'https://x.example/');
  assert.equal(loaded.logLevel, 'error');
});

test('loadOptions migrates the predecessor bridge URL without changing storage', async () => {
  const s = fake({ bridgeUrl: PREDECESSOR_BRIDGE_URL });
  const loaded = await loadOptions(s);
  assert.equal(loaded.bridgeUrl, DEFAULT_BRIDGE_URL);
  assert.equal(s.data.bridgeUrl, PREDECESSOR_BRIDGE_URL);
});

test('loadOptions leaves the current and custom bridge URLs unchanged', async () => {
  const current = await loadOptions(fake({ bridgeUrl: DEFAULT_BRIDGE_URL }));
  assert.equal(current.bridgeUrl, DEFAULT_BRIDGE_URL);
  const custom = await loadOptions(fake({ bridgeUrl: 'https://bridge.example/custom' }));
  assert.equal(custom.bridgeUrl, 'https://bridge.example/custom');
});

test('loadOptions does not rewrite a predecessor slug without a path prefix', async () => {
  for (const stored of [PREDECESSOR_BRIDGE_SLUG, `https://${PREDECESSOR_BRIDGE_SLUG}`]) {
    const loaded = await loadOptions(fake({ bridgeUrl: stored }));
    assert.equal(loaded.bridgeUrl, stored);
  }
});

test('saveModelEndpoint accepts https and loopback, refuses remote http', async () => {
  const s = fake();
  await assert.rejects(saveModelEndpoint(s, 'http://model.example/v1'), /https/);
  await assert.rejects(saveModelEndpoint(s, 'ftp://model.example'), /https/);
  await saveModelEndpoint(s, 'https://api.example/v1');
  assert.equal(s.data.modelEndpoint, 'https://api.example/v1');
  await saveModelEndpoint(s, 'http://127.0.0.1:11434/v1');
  assert.equal(s.data.modelEndpoint, 'http://127.0.0.1:11434/v1');
});

test('saveModelName refuses an empty or oversized model name', async () => {
  const s = fake();
  await saveModelName(s, 'some-model-4b');
  assert.equal(s.data.modelName, 'some-model-4b');
  await assert.rejects(saveModelName(s, '   '), /model name/i);
  await assert.rejects(saveModelName(s, 'x'.repeat(200)), /model name/i);
});

test('an empty key clears it, which is how a user revokes it', async () => {
  const s = fake({ modelKey: 'sk-live-123' });
  await saveModelKey(s, '');
  assert.equal(s.data.modelKey, '');
  const cleared = await readModelConfig(s);
  assert.equal(cleared.configured, false);
  assert.equal(cleared.code, 'MODEL_NOT_CONFIGURED');
});

test('loadOptions never hands the key back to the page, only that one is set', async () => {
  const s = fake({ modelEndpoint: 'https://api.example/v1', modelName: 'm', modelKey: 'sk-live-123' });
  const loaded = await loadOptions(s);
  assert.equal(loaded.modelKeySet, true);
  assert.equal('modelKey' in loaded, false);
  assert.equal(loaded.modelEndpoint, 'https://api.example/v1');
});

test('readModelConfig fails closed until all three are set', async () => {
  const s = fake({ modelEndpoint: 'https://api.example/v1', modelName: 'm' });
  const missing = await readModelConfig(s);
  assert.equal(missing.configured, false);
  assert.equal(missing.code, 'MODEL_NOT_CONFIGURED');
  await saveModelKey(s, 'sk-live-123');
  const ready = await readModelConfig(s);
  assert.equal(ready.configured, true);
  assert.equal(ready.endpoint, 'https://api.example/v1');
  assert.equal(ready.model, 'm');
  assert.equal(ready.key, 'sk-live-123');
});

test('loadOptions reports the default provider endpoint and model on empty storage', async () => {
  const s = fake();
  const loaded = await loadOptions(s);
  const provider = MODEL_PROVIDERS.find((entry) => entry.id === DEFAULT_PROVIDER_ID);
  assert.ok(provider);
  assert.equal(DEFAULT_PROVIDER_ID, 'nvidia');
  assert.equal(loaded.modelEndpoint, provider.endpoint);
  assert.equal(loaded.modelEndpoint, 'https://integrate.api.nvidia.com/v1/chat/completions');
  assert.equal(loaded.modelName, provider.defaultModel);
  assert.equal(loaded.modelName, 'meta/llama-3.2-11b-vision-instruct');
  assert.equal('modelEndpoint' in s.data, false);
  assert.equal('modelName' in s.data, false);
});

test('readModelConfig on empty storage misses only the user-supplied key', async () => {
  const result = await readModelConfig(fake());
  assert.equal(result.configured, false);
  assert.equal(result.code, 'MODEL_NOT_CONFIGURED');
  assert.deepEqual(result.missing, ['key']);
});

test('MODEL_PROVIDERS is frozen, and every listed endpoint passes its own rule', async () => {
  assert.equal(Object.isFrozen(MODEL_PROVIDERS), true);
  assert.deepEqual(MODEL_PROVIDERS.map((entry) => entry.id), ['nvidia', 'groq', 'ollama', 'lmstudio', 'custom']);
  const s = fake();
  for (const provider of MODEL_PROVIDERS) {
    assert.equal(Object.isFrozen(provider), true, `${provider.id} is frozen`);
    assert.equal(Object.isFrozen(provider.models), true, `${provider.id} models are frozen`);
    if (provider.endpoint) await saveModelEndpoint(s, provider.endpoint);
    for (const model of provider.models) {
      assert.equal(Object.isFrozen(model), true, `${model.id} is frozen`);
      assert.ok(model.id.length >= 1 && model.id.length <= 120);
      assert.ok(model.label.length >= 1);
    }
  }
});

test('the cloud providers name their exact endpoints and models', async () => {
  const byId = Object.fromEntries(MODEL_PROVIDERS.map((entry) => [entry.id, entry]));
  const nvidia = byId.nvidia;
  const groq = byId.groq;
  assert.ok(nvidia && groq);
  assert.equal(nvidia.endpoint, 'https://integrate.api.nvidia.com/v1/chat/completions');
  assert.deepEqual(nvidia.models.map((entry) => entry.id), [
    'meta/llama-3.2-11b-vision-instruct',
    'meta/llama-3.2-90b-vision-instruct'
  ]);
  assert.equal(nvidia.defaultModel, 'meta/llama-3.2-11b-vision-instruct');
  assert.equal(groq.endpoint, 'https://api.groq.com/openai/v1/chat/completions');
  assert.deepEqual(groq.models.map((entry) => entry.id), [
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
    'qwen/qwen3.8-27b'
  ]);
  assert.equal(groq.defaultModel, 'llama-3.1-8b-instant');
});

test('the local providers name loopback endpoints and guess no model name', async () => {
  const byId = Object.fromEntries(MODEL_PROVIDERS.map((entry) => [entry.id, entry]));
  const ollama = byId.ollama;
  const lmstudio = byId.lmstudio;
  const custom = byId.custom;
  assert.ok(ollama && lmstudio && custom);
  assert.equal(ollama.endpoint, 'http://127.0.0.1:11434/v1/chat/completions');
  assert.equal(lmstudio.endpoint, 'http://127.0.0.1:1234/v1/chat/completions');
  assert.deepEqual(ollama.models, []);
  assert.deepEqual(lmstudio.models, []);
  assert.equal(ollama.defaultModel, '');
  assert.equal(lmstudio.defaultModel, '');
  assert.equal(custom.endpoint, '');
  assert.equal(custom.defaultModel, '');
});

test('stored endpoint and model still override the provider defaults', async () => {
  const s = fake({ modelEndpoint: 'https://custom.example/v1', modelName: 'custom-model', modelKey: 'sk-live-123' });
  const loaded = await loadOptions(s);
  assert.equal(loaded.modelEndpoint, 'https://custom.example/v1');
  assert.equal(loaded.modelName, 'custom-model');
  const ready = await readModelConfig(s);
  assert.equal(ready.configured, true);
  assert.equal(ready.endpoint, 'https://custom.example/v1');
  assert.equal(ready.model, 'custom-model');
});
