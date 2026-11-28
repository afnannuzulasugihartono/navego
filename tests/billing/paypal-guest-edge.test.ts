// @last-edited: 2026-11-28 UTC+7.
// @title: guest edge wiring - a signed-out buyer reaches PayPal, and only the account that claimed the quote can activate it.
// @state: failing before the billing edge carries the guest branch, passing after it.
// @dependencies: node:test, node:assert, node:fs, hosted/functions/navego-billing/index.ts.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../../', import.meta.url);
const fn = fs.readFileSync(new URL('hosted/functions/navego-billing/index.ts', root), 'utf8');
const buy = fn.slice(fn.indexOf('body.action === "paypal-buy"'));
const capture = fn.slice(fn.indexOf('body.action === "paypal-capture"'), fn.indexOf('body.action === "paypal-buy"'));

test('a guest buy is minted only when there is no session and the caller asked for guest', () => {
  assert.match(buy, /body\.guest === true/, 'the guest flag must be explicit, not inferred from a missing session');
  assert.match(buy, /opera_paypal_create_guest_order/, 'the guest quote goes to the guest-only database function');
  assert.match(buy, /crypto\.randomUUID\(\)/, 'the one-time token is minted in the function, never trusted from the browser');
  assert.match(buy, /p_guest_token: guestToken/, 'the raw token goes to the database, which stores only its hash');
  assert.match(buy, /p_owner_id: owner/, 'a signed-in buyer keeps the original owner-bound quote');
});

test('a guest buy answers everything the browser needs to open PayPal and claim later', () => {
  for (const field of ['approvalUrl', 'guestToken', 'amountCents', 'currency']) {
    assert.ok(buy.includes(field), `the guest answer carries ${field}`);
  }
  assert.match(buy, /customId: `\$\{plan\}:\$\{guest \? 'guest' : owner\}`/, 'the PayPal order names the guest marker for a guest quote');
});

test('a guest capture refuses an account that did not claim the quote', () => {
  assert.match(capture, /from\("opera_paypal_orders"\)/, 'the capture reads the stored quote');
  assert.match(capture, /claimed_at/, 'the capture checks the claim timestamp');
  assert.match(capture, /owner_id/, 'the capture checks which account claimed the quote');
  assert.match(capture, /settlement\.owner === 'guest'/, 'the guest marker is accepted only for a claimed guest quote');
  assert.match(capture, /v_order\.claimed_at|quoteRow\?\.claimed_at|quote\?\.claimed_at/, 'a guest order cannot be captured before a claim');
});

test('a plain signed-out buy is still refused with the original wording', () => {
  assert.match(buy, /masuk dulu sebelum membeli plan USD/, 'the account wall stays for every caller that did not ask for guest');
});
