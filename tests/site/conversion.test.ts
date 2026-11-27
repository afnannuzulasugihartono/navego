// @last-edited: 2026-11-24 UTC+7.
// @title: conversion - the page answers why a visitor should try, trust and buy Navego.
// @state: plan periods are explicit, downloadable proof is real, onboarding uses npx, and an English route is deployed.
// @dependencies: node:test, strict, fs, path.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../site');
const read = (file: string) => fs.readFileSync(path.join(site, file), 'utf8');

test('the pricing page names one-time plans and their real periods without the year-long contradiction', () => {
  const harga = read('app/routes/harga.tsx');
  assert.match(harga, /Harga yang bisa Anda hitung/);
  assert.match(harga, /Tidak ada perpanjangan otomatis/);
  assert.doesNotMatch(harga, /Sekali bayar\. Setahun penuh\./);
  assert.match(harga, /Kawasan berdaya beli rendah/);
  assert.match(harga, /Kawasan berdaya beli tinggi/);
  assert.match(harga, /sekali bayar, .*berlaku 1 bulan/);
  assert.match(harga, /berlaku 6 bulan/);
  assert.match(harga, /berlaku 1 tahun/);
});

test('a plan click answers under the clicked plan, not at the bottom of the page', () => {
  const harga = read('app/routes/harga.tsx');
  assert.match(harga, /setLastPlan\(planKey\)/);
  assert.match(harga, /lastPlan === planKey/);
  assert.match(harga, /planFeedback\(/);
  assert.match(harga, /buyPending === planKey/);
  assert.match(harga, /usd-\$\{slot\}-\$\{plan\.id\}/);
  assert.match(harga, /plan-announcer/);
  assert.match(harga, /!activePlanPresent && signedOut/);
  assert.match(harga, /!activePlanPresent && note/);
});

test('a chosen plan survives the sign-in round trip in this tab', () => {
  const harga = read('app/routes/harga.tsx');
  assert.match(harga, /rememberPendingPlan\(planKey\)/);
  assert.match(harga, /readPendingPlan\(\)/);
  assert.match(harga, /forgetPendingPlan\(\)/);
  assert.match(harga, /Lanjutkan plan pilihan Anda\. Klik Beli dengan PayPal/);
});

test('the homepage offers real artifacts instead of only a scripted demo', () => {
  const beranda = read('app/routes/beranda.tsx');
  assert.match(beranda, /Situs tanpa API\. Perintah jadi berkas\./);
  assert.match(beranda, /\/contoh\/laporan-keuangan-2026-09\.xlsx/);
  assert.match(beranda, /\/contoh\/rencana-pemasaran-2027\.docx/);
  assert.match(beranda, /\/contoh\/rencana-strategis-2027\.pptx/);
  assert.match(beranda, /Bukan screenshot\. Berkas yang bisa Anda buka\./);
});

test('onboarding starts with npx instead of a global install', () => {
  const mcp = read('app/routes/mcp.tsx');
  assert.match(mcp, /npx -y navego doctor/);
  assert.match(mcp, /npx -y navego local/);
  assert.match(mcp, /Tidak perlu install global/);
});

test('device geolocation is allowed only on the pricing origin', () => {
  const headers = read('public/_headers');
  assert.match(headers, /Permissions-Policy: [^\n]*geolocation=\(self\)/);
});

test('an English landing page is routable, linked, and covered by the same policy', () => {
  const en = read('app/routes/en.tsx');
  assert.match(en, /<main lang="en">/);
  assert.match(en, /real browser/);
  assert.match(en, /\/contoh\/laporan-keuangan-2026-09\.xlsx/);
  assert.match(read('app/routes.ts'), /\['en', '\.\/routes\/en\.tsx', 'en'\]/);
  assert.match(read('app/components/Chrome.tsx'), /href: '\/en', label: 'EN'/);
  const headers = read('public/_headers');
  assert.match(headers, /\/en\n/);
  assert.match(headers, /\/en\.html\n/);
});
