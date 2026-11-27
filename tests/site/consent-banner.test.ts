// @last-edited: 2026-11-27 UTC+7.
// @title: consent-banner.test - the cookie bar is a compact bar, not a sheet over the first screen.
// @state: the copy shares the row with the buttons on a wide screen, the small screen stacks tighter, and the facts stay.
// @dependencies: node:test, strict, node:fs.

// The bar was a fixed sheet that covered the bottom 141 px of a 1440 px first screen and 192 px of a 390 px one, so it hid the price on /harga and the five-run proof on /.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const chrome = fs.readFileSync(path.join(root, 'site', 'app', 'components', 'Chrome.tsx'), 'utf8');
const css = fs.readFileSync(path.join(root, 'site', 'app', 'components', 'consent-banner.css'), 'utf8');

test('the copy shares the row with the buttons, so the bar stays one row on a wide screen', () => {
  assert.match(chrome, /<p className="consent-copy">/);
  assert.match(css, /\.consent-banner \.consent-copy \{[^}]*flex: 1 1 18rem;/);
  assert.match(css, /\.consent-banner \.consent-copy \{[^}]*min-width: 0;/);
});

test('the small screen stacks tighter instead of covering more of the page', () => {
  assert.match(css, /@media \(max-width: 640px\) \{[\s\S]*?\.consent-banner \.consent-copy \{ flex: 1 1 100%; \}/);
  assert.match(css, /@media \(max-width: 640px\) \{[\s\S]*?\.consent-banner \.consent-inner \{[^}]*gap: var\(--s-2\);[^}]*padding-block: var\(--s-2\);/);
});

test('the facts the bar states do not change', () => {
  assert.match(chrome, /navego_consent/);
  assert.match(chrome, /navego_region/);
  assert.match(chrome, /oa_device_id/);
  assert.match(chrome, /Tidak ada analytics, iklan, atau pelacakan/);
  assert.match(chrome, /to="\/privasi#cookie">Detail di Kebijakan Privasi/);
  assert.match(chrome, />Accept cookies<\/button>/);
  assert.match(chrome, />Tolak<\/button>/);
});
