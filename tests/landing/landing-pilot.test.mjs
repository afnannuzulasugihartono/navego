// @last-edited: 2026-11-15 UTC+7.
// @title: landing-pilot.test — the pilot page says what the pilot is, asks the three questions, and never claims a bank works.
// @state: the offer, the price, the three questions, the privacy line, the honest line, and the form that posts to the project's own function.
// @dependencies: node:test, strict, fs.

// WHY THIS PAGE HAS ITS OWN GATE: it is the page a stranger lands on from a post, so every number and every promise on it is a claim a buyer can hold us to.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../../', import.meta.url);
const read = (name) => fs.readFileSync(new URL(name, root), 'utf8');
const html = read('landing/pilot.html');
const script = read('landing/pilot.js');

test('the offer and the price are on the page, in the words the price list uses', () => {
  assert.match(html, /Rp99\.000/, 'the pilot price is stated');
  assert.match(html, /15 client-month/, 'the cap is stated');
  assert.match(html, /Rp 0|Rp0/i, 'a failed batch is not charged');
  assert.match(html, /diterima/i, 'the invoice waits for the buyer to accept the batch');
});

test('the page never names a bank as already working', () => {
  assert.match(html, /belum pernah diuji/i, 'the honest line says no portal is proven with them yet');
  assert.doesNotMatch(html, /BCA sudah bisa|Mandiri sudah bisa|sudah terbukti/i);
});

test('the three screening questions are asked, so the answer decides the build order', () => {
  assert.match(html, /portal/i);
  assert.match(html, /klien per bulan|Jumlah klien per bulan/i);
  assert.match(html, /melelahkan/i);
});

test('the privacy line names what is never asked for', () => {
  assert.match(html, /password/i);
  assert.match(html, /OTP/i);
  assert.match(html, /tidak pernah/i);
});

test('the form posts to the project\'s own function, not to a third party', () => {
  assert.match(script, /supabase\.co\/functions\/v1\/opera-agent-feedback/, 'the endpoint is the project function');
  assert.doesNotMatch(script, /formspree|googleapis|web3forms|mailto:/i, 'no outside form service');
  assert.match(html, /id="pilotForm"/, 'the form is on the page');
  assert.match(html, /name="contact"/, 'a way to reply is asked for');
  assert.match(html, /name="wantsSlot"/, 'the pilot opt-in is a checkbox, not a purchase');
});

test('the page says what it is not, so the two offers stay honest', () => {
  assert.match(html, /bukan langganan Kemudi/i);
  assert.match(html, /\.\/harga\.html/, 'and points at the agent product\'s own price page');
});

test('the page carries the door to the rest of the site and the map', () => {
  assert.ok(html.includes('href="./harga.html"'));
  assert.ok(read('landing/sitemap.xml').includes('https://opera-agent.pages.dev/pilot'), 'the sitemap lists the page');
  assert.ok(read('landing/_headers').includes('/pilot'), 'the headers cover the page');
});
