// @last-edited: 2026-11-15 UTC+7.
// @title: extension-onboarding - a stranger pairs the browser without reading the docs.
// @state: the popup carries the one-click door; the words are Indonesian first, English everywhere too.
// @dependencies: test, assert, fs.

// THIS FILE STAYS NAMED THE SAME: the test that locked the old paste-the-code flow locked the wrong thing - it taught the reader where to get a code instead of pairing in one click.
// The popup is where the promise is kept or broken, and the promise now is one click: the dashboard mints and delivers; the popup does not ask for a code at all.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../../', import.meta.url);
const read = (name: any) => fs.readFileSync(new URL(`extension/${name}`, root), 'utf8');
const i18n = read('lib/i18n.js');

test('the popup speaks Indonesian and carries the one-click door', () => {
  const html = read('popup.html');
  assert.match(html, /<html lang="id"/, 'the document language is declared Indonesian');
  assert.match(i18n, /Pasangkan browser ini/, 'the one-click row says what it does');
  assert.match(i18n, /Pair this browser/, 'and English carries the same promise');

  assert.match(read('popup.js'), /pairQuickButton[\s\S]{0,220}pair=1|pair=1[\s\S]{0,220}pairQuickButton/, 'the one-click door deep-links to the dashboard pair handoff');
  assert.doesNotMatch(html, /id="pairToggleButton"|id="pairSection"|id="pairButton"/, 'the manual pairing door is gone; the one-click door is the only door');
});

test('the popup status answers in every state of it, in both languages', () => {
  for (const label of ['Terhubung', 'Menghubungkan', 'Menyambung ulang', 'Memulai', 'Belum dipair']) {
    assert.ok(i18n.includes(label), `the status names ${label}`);
  }
  assert.match(i18n, /Connected/, 'and English is carried everywhere an Indonesian word is');
  assert.match(i18n, /Not paired/, 'including the not-paired refusal');

  assert.match(read('popup.js'), /SITE_ORIGIN/, 'the dashboard link follows the single source of truth');
});

test('the options page speaks Indonesian too', () => {
  const options = read('options.html');
  assert.match(options, /<html lang="id"/, 'the options document language is declared Indonesian');
});
