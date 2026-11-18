// @last-edited: 2026-11-18 UTC+7.
// @title: chatgpt-plugin.test — the ChatGPT plugin bundle names the hosted files it serves.
// decisions.json -> D32 (one mark everywhere: component, favicon, badge, og-cover)
// @state: the manifest, the OpenAPI file and the OAuth authorization URL, all same-origin.
// @dependencies: node:test, strict, promises.

// The ChatGPT plugin bundle lets any ChatGPT user drive their own paired browser through OAuth: the manifest points at the hosted OpenAPI file, and the gateway accepts a Supabase user JWT alongside the device token, resolving the caller's own device by user_id.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);
const read = (name: any) => readFile(new URL(name, root), 'utf8');

test('the plugin bundle exists and names the hosted files', async () => {
  const manifest = JSON.parse(await read('site/public/chatgpt-plugin/ai-plugin.json'));
  assert.equal(manifest.schema_version, 'v1');
  assert.equal(manifest.name_for_model, 'navego_');
  assert.match(manifest.description_for_model, /read the envelope/i);
  assert.equal(manifest.auth?.type, 'oauth');
  assert.match(manifest.auth?.authorization_url || '', /supabase\.co\/auth\/v1\/authorize/);
  assert.equal(manifest.api?.type, 'openapi');
  assert.equal(manifest.api?.url, 'https://navego.pages.dev/chatgpt-plugin/openapi.json');
  assert.equal(manifest.logo_url, 'https://navego.pages.dev/icon.svg');
  const spec = JSON.parse(await read('site/public/chatgpt-plugin/openapi.json'));
  assert.equal(spec.openapi, '3.0.0');
  assert.ok(spec.paths?.['/command']?.post, 'the bundled spec serves /command');
});

test('the gateway accepts a user JWT and resolves the caller device', async () => {
  const source = await read('hosted/functions/navego-gateway/index.ts');

  assert.match(source, /await supabase\.auth\.getUser\(token\)/);
  assert.match(source, /\.from\("opera_devices"\)/);
  assert.match(source, /\.eq\("user_id", userId\)/);
  assert.match(source, /p_device_name: deviceName,/);
});

test('the plugin logo is the shipped mark', async () => {
  const icon = await read('site/public/icon.svg');
  assert.match(icon, /<svg[^>]*viewBox="0 0 240 240"/);
  assert.match(icon, /#233259/, 'the navy disc is the shipped mark');
  assert.match(icon, /#d8923f/, 'and the amber accent');
  assert.doesNotMatch(icon, /id="navego-chrome"/, 'the mark is flat ink now - no brushed chrome');
  assert.doesNotMatch(icon, /id="ring"/, 'the old iridescent ring is retired');
});
