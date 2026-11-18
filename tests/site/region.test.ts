// @last-edited: 2026-11-18 UTC+7.
// @title: region.test - the two pricing bands, pinned so a region cannot drift into the wrong one.
// @state: the premium band is exactly the owner's cohort, everything else is affordable, and a bad country code answers null, never a coin toss.
// @dependencies: node:test, strict, ../../site/app/lib/region.ts.

import test from 'node:test';
import assert from 'node:assert/strict';

import { bandForCountry } from '../../site/app/lib/region.ts';

test('the premium cohort is exactly the owner’s: Europe, North America, Australia, New Zealand', () => {
  for (const code of ['DE', 'FR', 'IT', 'ES', 'PL', 'GB', 'NO', 'IS', 'CH', 'NL', 'SE', 'US', 'CA', 'AU', 'NZ', 'GI', 'LI', 'MC']) {
    assert.equal(bandForCountry(code), 'premium', `${code} is in the premium cohort`);
  }
});

test('Asia, Arabia, Africa and Latin America land in the affordable band', () => {
  for (const code of ['ID', 'MY', 'SG', 'PH', 'TH', 'VN', 'IN', 'CN', 'JP', 'KR', 'AE', 'SA', 'EG', 'NG', 'ZA', 'TR', 'RU', 'BR', 'MX', 'AR', 'CL']) {
    assert.equal(bandForCountry(code), 'affordable', `${code} is priced for the affordable band`);
  }
});

test('an unknown or malformed country is an honest unknown, not a guess', () => {
  assert.equal(bandForCountry(null), null);
  assert.equal(bandForCountry(undefined), null);
  assert.equal(bandForCountry(''), null);
  assert.equal(bandForCountry('XXX'), null);
  assert.equal(bandForCountry('id1'), null);
  assert.equal(bandForCountry('LV1'), null);
});
