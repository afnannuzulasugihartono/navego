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
const landing = fs.readFileSync(path.join(root, 'site', 'app', 'routes', 'index.tsx'), 'utf8');
const copySource = fs.readFileSync(path.join(root, 'site', 'app', 'components', 'CopyCommand.tsx'), 'utf8');
const funnelSource = fs.readFileSync(path.join(root, 'site', 'app', 'lib', 'funnel.ts'), 'utf8');
const dashboardSource = fs.readFileSync(path.join(root, 'site', 'app', 'routes', 'dashboard.tsx'), 'utf8');
const css = fs.readFileSync(path.join(root, 'site', 'app', 'brand.css'), 'utf8');

test('the hero carries the one-command Windows install before the manual download', () => {
  const heroStart = source.indexOf('<section className="page-hero">');
  const heroEnd = source.indexOf('</section>', heroStart);
  assert.ok(heroStart >= 0 && heroEnd > heroStart, 'the download page must have a readable hero');
  const hero = source.slice(heroStart, heroEnd);
  assert.match(hero, /WINDOWS_INSTALL_COMMAND/);
  assert.ok(hero.indexOf('WINDOWS_INSTALL_COMMAND') < hero.indexOf('DOWNLOAD'), 'the command comes before the manual zip');
  assert.match(hero, /Salin perintah/);
});

test('the landing hero can copy the Windows install without another page', () => {
  assert.match(landing, /WINDOWS_INSTALL_COMMAND/);
  assert.doesNotMatch(landing, /recordInstallView\('landing'\)/);
  assert.match(funnelSource, /recordInstallView\('landing', path\)/);
  assert.match(landing, /recordInstallCopy\('landing'\)/);
  assert.match(landing, /Salin perintah/);
  assert.doesNotMatch(landing, /aria-label="Masuk ke Navego"/);
  assert.match(landing, /tidak bisa dicabut/);
  assert.match(landing, /hapus nilai policy/i);
  const branchStart = landing.indexOf("{phase === 'form' ? (");
  const branchEnd = landing.indexOf(') : null}', branchStart);
  const disclosure = landing.indexOf('Di Windows, perintah ini');
  const copy = landing.indexOf('<CopyCommand');
  assert.ok(branchStart >= 0 && branchEnd > branchStart, 'the anonymous phase branch must exist');
  assert.ok(disclosure > branchStart && copy > disclosure && copy < branchEnd, 'the disclosure and command belong to the anonymous phase only');
});

test('the operator funnel names the install steps by what they measure', () => {
  assert.match(dashboardSource, /\['install\.view', 'Tampilan install'\]/);
  assert.match(dashboardSource, /\['install\.click', 'Klik install'\]/);
  assert.doesNotMatch(dashboardSource, /Halaman unduh dilihat/);
  assert.doesNotMatch(dashboardSource, /Klik unduhan/);
});

test('a successful command copy records install intent and a failed copy is announced', () => {
  assert.match(source, /recordInstallCopy\('download'\)/);
  assert.match(copySource, /role="status"/);
  assert.match(copySource, /aria-live="polite"/);
  assert.match(copySource, /Gagal menyalin/);
});

test('every command stays inside a narrow screen and the primary states its real cost', () => {
  assert.match(css, /(^|\n)\.command-row \{ inline-size: 100%;/);
  assert.doesNotMatch(css, /\.page-hero \.command-row/);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.command-row \{ display: grid;/);
  assert.match(css, /grid-template-columns: 1fr/);
  assert.match(source, /tidak bisa dicabut/);
  assert.match(source, /Tutup lalu buka browser/);
});
