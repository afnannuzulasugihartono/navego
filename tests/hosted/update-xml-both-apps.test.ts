// @last-edited: 2026-11-17 UTC+7.
// @title: update-xml-both-apps.test — a bare manifest update_url still reaches the current build.
// @state: the two app entries the no-id answer carries, and the appid a browser request names.
// @dependencies: node:test, strict, promises, fs.

import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = await readFile(new URL('../../hosted/functions/navego-update/index.ts', import.meta.url), 'utf8');

// the shipped manifest's update_url has no ?id=, so the manual Update button and the first external-install check both arrive without an id.
// Answering only the legacy appid there made every current install stay on its old build forever.

test('update.xml without an id advertises both the legacy and the current app', () => {
  assert.ok(source.includes('function askedExtensionIds('), 'reads every id the caller named');
  assert.ok(source.includes('[LEGACY_EXTENSION_ID, CURRENT_EXTENSION_ID]'), 'answers both apps when none was named');
  assert.ok(source.includes('releases.map('), 'writes one <app> element per active release');
  assert.ok(source.includes('<app appid="${release.extension_id}">'), 'the appid travels in the XML');
});

test('Chrome-style x requests name the appid the browser is asking about', () => {
  assert.ok(source.includes('appid='), 'the id inside the browser update request is read');
  assert.ok(source.includes('const chromeRequest'), 'the x parameter is parsed, not ignored');
});
