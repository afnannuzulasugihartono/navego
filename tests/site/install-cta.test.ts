// @last-edited: 2026-11-25 UTC+7.
// @title: install-cta.test - the download page leads with the install that needs no Node or store.
// @state: the hero carries the PowerShell command, a successful copy records install intent, and copy failure is visible and announced.
// @dependencies: node:test, strict, node:fs.

// The page promised one command but made the visitor download a zip first, and the funnel recorded no install click.
// The hero now carries the command, its copy result is observable, and only a successful copy records the install step.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const source = fs.readFileSync(path.join(root, 'site', 'app', 'routes', 'unduh.tsx'), 'utf8');

test('the hero carries the one-command Windows install before the manual download', () => {
  const heroStart = source.indexOf('<section className="page-hero">');
  const heroEnd = source.indexOf('</section>', heroStart);
  assert.ok(heroStart >= 0 && heroEnd > heroStart, 'the download page must have a readable hero');
  const hero = source.slice(heroStart, heroEnd);
  assert.match(hero, /ONE_LINER/);
  assert.ok(hero.indexOf('ONE_LINER') < hero.indexOf('DOWNLOAD'), 'the command comes before the manual zip');
  assert.match(hero, /Salin perintah/);
});

test('a successful command copy records install intent and a failed copy is announced', () => {
  assert.match(source, /track\('install\.click', \{ browser: 'windows', artifact: 'powershell' \}\)/);
  assert.match(source, /role="status"/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /Gagal menyalin/);
});
