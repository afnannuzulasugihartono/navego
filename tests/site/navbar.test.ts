// @last-edited: 2026-11-23 UTC+7.
// @title: navbar - one ordinary navigation bar, no chevron mega-panel.
// @state: product links stay inline on wide screens and one Menu button opens a scrollable list on small screens.
// @dependencies: node:test, strict, fs, path.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../site');
const chrome = fs.readFileSync(path.join(site, 'app/components/Chrome.tsx'), 'utf8');
const css = fs.readFileSync(path.join(site, 'app/brand.css'), 'utf8');

test('the chevron and its mega-panel are gone', () => {
  assert.doesNotMatch(chrome, /nav-notch|Tampilkan menu lengkap|nav-strip/);
  assert.doesNotMatch(css, /\.nav-notch|\.nav-strip/);
});

test('the bar carries the product, pricing, developer and article links', () => {
  assert.match(chrome, /<nav id="site-nav" className="nav-links" aria-label="Navigasi utama">/);
  for (const label of ['Fitur', 'Harga', 'Docs', 'Pasang MCP', 'Artikel']) {
    assert.match(chrome, new RegExp(`label: '${label}'`), `${label} is a first-level link`);
  }
  assert.match(chrome, /aria-current=\{current === item\.href \? 'page' : undefined\}/);
});

test('a small screen gets one labelled Menu button with real expanded state', () => {
  assert.match(chrome, /const \[menuOpen, setMenuOpen\] = useState\(false\)/);
  assert.match(chrome, /aria-expanded=\{menuOpen\}/);
  assert.match(chrome, /aria-controls="site-nav"/);
  assert.match(chrome, /className="nav-toggle"/);
  assert.match(chrome, />Menu</);
  assert.match(css, /\.nav-toggle \{ display: none;/);
  assert.match(css, /\.site-header\.nav-open \.nav-links \{ display: flex;/);
  assert.match(css, /\.nav-links \{[^}]*max-block-size: calc\(100dvh - 3\.25rem\);[^}]*overflow-y: auto;/);
});
