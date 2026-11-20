// @last-edited: 2026-11-20 UTC+7.
// @title: legacy-names - the 1.x names a 2.0 install still answers.
// @state: the environment adoption, the home fallback, and the token header fallback, each proven.
// @dependencies: node:test, strict, ../../local/legacy-names.js.

// The 2.0 release renames the product, and a rename that breaks a working install is a release nobody wants.
// These three are the places a 1.x install can still be carrying its name, and each has to keep working for one major.

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { adoptLegacyEnv, homeFile, tokenFromHeaders, ENV_PREFIX, LEGACY_ENV_PREFIX } from '../../local/legacy-names.js';

test('a 1.x environment variable configures the 2.0 name', () => {
  const env: NodeJS.ProcessEnv = { NAVEGO_BRIDGE_PORT: '9451', NAVEGO_CLOUD_URL: 'https://example.test' };
  const adoption = adoptLegacyEnv(env);

  assert.equal(env.OPERA_BRIDGE_PORT, '9451');
  assert.equal(env.OPERA_CLOUD_URL, 'https://example.test');
  assert.deepEqual(adoption.adopted.sort(), ['OPERA_BRIDGE_PORT', 'OPERA_CLOUD_URL']);
});

test('the canonical name wins when both are set', () => {
  const env: NodeJS.ProcessEnv = { NAVEGO_BRIDGE_PORT: '9451', OPERA_BRIDGE_PORT: '9500' };
  adoptLegacyEnv(env);

  assert.equal(env.OPERA_BRIDGE_PORT, '9500', 'a 2.0 install that names the canonical variable is not overruled by the 1.x one');
});

test('an empty legacy variable is not adopted as a value', () => {
  const env: NodeJS.ProcessEnv = { NAVEGO_BRIDGE_PORT: '' };
  const adoption = adoptLegacyEnv(env);

  assert.equal(env.OPERA_BRIDGE_PORT, '');
  assert.deepEqual(adoption.adopted, ['OPERA_BRIDGE_PORT']);
});

test('the prefixes are the two names of the same thing', () => {
  assert.equal(ENV_PREFIX, 'OPERA_');
  assert.equal(LEGACY_ENV_PREFIX, 'NAVEGO_');
});

test('a pair in the 1.x home is still found', () => {
  const home = path.join('C:', 'Users', 'someone');
  const legacy = path.join(home, '.navego', 'device.json');
  const choice = homeFile(home, 'device.json', (candidate) => candidate === legacy);

  assert.equal(choice.file, legacy);
  assert.equal(choice.legacy, true);
});

test('the 2.0 home wins when it holds the file', () => {
  const home = path.join('C:', 'Users', 'someone');
  const canonical = path.join(home, '.opera', 'device.json');
  const choice = homeFile(home, 'device.json', (candidate) => candidate === canonical || candidate === path.join(home, '.navego', 'device.json'));

  assert.equal(choice.file, canonical);
  assert.equal(choice.legacy, false);
});

test('a home with neither file names the canonical path', () => {
  const home = path.join('C:', 'Users', 'someone');
  const choice = homeFile(home, 'device.json', () => false);

  assert.equal(choice.file, path.join(home, '.opera', 'device.json'));
  assert.equal(choice.legacy, false);
});

test('the token header is read under the 2.0 name first', () => {
  const headers = new Map([
    ['x-opera-token', 'new-token'],
    ['x-navego-token', 'old-token']
  ]);
  const read = (name: string) => headers.get(name) ?? null;

  assert.equal(tokenFromHeaders({ get: read }), 'new-token');
});

test('the 1.x token header is still read', () => {
  const headers = new Map([['x-navego-token', ' old-token ']]);
  const read = (name: string) => headers.get(name) ?? null;

  assert.equal(tokenFromHeaders({ get: read }), 'old-token');
});

test('a request with no token header carries no token', () => {
  assert.equal(tokenFromHeaders({ get: () => null }), null);
  assert.equal(tokenFromHeaders({ get: () => '   ' }), null);
});
