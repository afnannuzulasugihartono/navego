// @last-edited: 2026-11-27 UTC+7.
// @title: hero-cta.test - the public first screen is measured proof backed by real files, not a swappable template.
// @state: the hero carries the command and honest five-run result with a real screenshot; no account card shares the first screen.
// @dependencies: node:test, strict, node:fs.

// The owner called the old first screen a swappable template: the promise was shown, but neither the product nor a measured result was.
// The landing page now shows the command, the run record and real artifacts, with no account card taking the place of the product.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const source = fs.readFileSync(path.join(root, 'site', 'app', 'routes', 'index.tsx'), 'utf8');
const footer = fs.readFileSync(path.join(root, 'site', 'app', 'components', 'Chrome.tsx'), 'utf8');

const heroOf = (text: string): string => {
  const start = text.indexOf('<section className="page-hero"');
  const end = text.indexOf('</section>', start);
  assert.ok(start >= 0 && end > start, 'the landing page must have a readable hero');
  return text.slice(start, end);
};

test('the lede is a sentence, with no action hidden inside it', () => {
  const hero = heroOf(source);
  const lede = hero.match(/<p className="lede">[\s\S]*?<\/p>/);
  assert.ok(lede, 'the hero must still explain the product in one place');
  assert.doesNotMatch(lede[0] ?? '', /<Link/, 'an inline link in the lede breaks across lines at 1440 px');
});

test('the first screen carries the command beside the honest run result', () => {
  const hero = heroOf(source);
  assert.match(hero, /WINDOWS_INSTALL_COMMAND/);
  assert.match(hero, /npx -y navego doctor/);
  assert.match(hero, /2 dari 5/);
  assert.match(hero, /578\.104 byte/);
  assert.match(hero, /%PDF-1\.5/);
  assert.match(hero, /3 dari 5/);
  assert.match(hero, /Dua yang gagal kehabisan jatah sesi bersama/);
  assert.match(hero, /ZIP diterima sebagai/);
  assert.match(hero, /docs\/proof\/2026-11-27-engineer\.md/);
});

test('a real screenshot of the extension is on the first screen', () => {
  assert.match(source, /popupProof from '.*docs\/store\/screenshots\/popup-pair-1280x800\.png'/);
  const hero = heroOf(source);
  assert.match(hero, /<img className="proof-shot" src=\{popupProof\}/);
  assert.match(hero, /href=\{POPUP_SHOT\}/);
});

test('the public hero stays an artifact: no account card, only a dashboard way back', () => {
  const hero = heroOf(source);
  assert.doesNotMatch(hero, /Masuk atau daftar/);
  assert.doesNotMatch(source, /magicEmail/);
  assert.match(hero, /to="\/dashboard">Buka dashboard<\/Link>/);
  assert.ok(source.indexOf('id="bukti-title"') > source.indexOf('</section>'), 'the proof section follows the hero');
});

test('real files, facts and limits back the claim', () => {
  assert.match(source, /portalProof from '.*docs\/proof\/extension-portal\.jpg'/);
  assert.match(source, /\/contoh\/laporan-keuangan-2026-09\.xlsx/);
  assert.match(source, /\/contoh\/rencana-pemasaran-2027\.docx/);
  assert.match(source, /\/contoh\/rencana-strategis-2027\.pptx/);
  assert.match(source, /npm navego \{VERSION\}/);
  assert.match(source, /Batas jujur: belum Firefox atau Safari/);
  assert.match(footer, /MIT, npm navego, repo publik/);
});

test('the install command, price link and honest limits survive', () => {
  const hero = heroOf(source);
  assert.match(hero, /WINDOWS_INSTALL_COMMAND/);
  assert.match(hero, /Salin perintah/);
  assert.match(hero, /to="\/harga">Lihat harga<\/Link>/);
  assert.match(hero, /macOS dan Linux: <Link to="\/unduh">unduh \.zip<\/Link>/);
  assert.match(hero, /tidak bisa dicabut/);
  assert.match(hero, /hapus nilai policy/i);
});
