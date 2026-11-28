// @last-edited: 2026-11-28 UTC+7.
// @title: Google verification file is served from the site root and is never edited.
// @state: failing before the verification file is placed in site/public, passing after it.
// @dependencies: node:test, node:assert, node:fs.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const file = new URL('../../site/public/googleeff3efb1a2e4c74e.html', import.meta.url);

test('the downloaded verification file lands byte for byte at the public root', () => {
  const content = fs.readFileSync(file, 'utf8');
  assert.equal(content, 'google-site-verification: googleeff3efb1a2e4c74e.html');
});