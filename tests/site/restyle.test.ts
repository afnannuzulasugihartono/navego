// @last-edited: 2026-11-23 UTC+7.
// @title: restyle - one 2026 visual system across every Navego route.
// @state: the shared tokens, the dark product hero, and the same surface rules reach marketing, docs, auth and dashboard.
// @dependencies: node:test, strict, fs, path.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../site');
const css = fs.readFileSync(path.join(site, 'app/brand.css'), 'utf8');
const tokens = fs.readFileSync(path.join(site, 'app/tokens.css'), 'utf8');

test('the homepage hero is a dark product stage with fluid type and a real task demo', () => {
  assert.match(tokens, /--text-hero-fluid: clamp\(/);
  assert.match(css, /\.hero \{[^}]*background: var\(--navy-deep\);/);
  assert.match(css, /\.hero h1 \{[^}]*font-size: var\(--text-hero-fluid\);/);
  assert.match(css, /\.hero \.lede[^{]*\{[^}]*color: var\(--text-on-dark-muted\);/);
  assert.match(css, /\.demo-window \{[^}]*border-radius: var\(--radius-lg\);/);
});

test('page heroes, cards and section headings share the new visual language', () => {
  assert.match(css, /\.page-hero \{[^}]*background: linear-gradient\(180deg, var\(--panel\), var\(--ground\)\);/);
  assert.match(css, /\.section-head \{[^}]*grid-template-columns: minmax\(0, 1fr\) auto;/);
  assert.match(css, /\.tile, \.tile-xl, \.value-card, \.card, \.start-card \{[^}]*border-radius: var\(--radius-lg\);/);
  assert.match(css, /@media \(hover: hover\) \{[\s\S]*?\.tile:hover, \.tile-xl:hover, \.value-card:hover, \.card:hover, \.start-card:hover \{ transform: translateY\(-2px\);/);
});

test('docs, auth and dashboard are restyled by the same surface system', () => {
  assert.match(css, /\.docs-rail \{[^}]*border-radius: var\(--radius-lg\);/);
  assert.match(css, /\.auth-card \.card \{[^}]*border-radius: var\(--radius-lg\);/);
  assert.match(css, /\.app \{[^}]*border-radius: var\(--radius-lg\);/);
  assert.match(css, /\.app-main \{[^}]*background: var\(--panel\);/);
});

test('the FAQ and every animation expose the right state without forcing motion', () => {
  assert.match(css, /\.faq summary::after \{ content: '\+';/);
  assert.match(css, /\.faq details\[open\] summary::after \{ content: '-';/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\*, \*::before, \*::after \{[^}]*transition-duration: 0\.01ms !important;/);
});
