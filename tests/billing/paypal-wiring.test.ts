// @last-edited: 2026-11-24 UTC+7.
// @title: paypal-wiring — the PayPal checkout is session-gated, reads only active USD prices, and activates only after PayPal itself answers SUCCESS.
// @state: the buy action refuses without a session and without a known plan, the webhook refuses without a verified signature, activation names exactly the USD plans, and the returning tab can still name the order it was sent back with.
// @dependencies: node:test, strict, node:fs.

// THE WIRING IS PINNED AS TEXT.
// This is the money path the site's Beli dengan PayPal buttons reach, and a refactor that drops the session check, trusts an unverified webhook, or silently widens the plan list turns a $1 purchase into a free account.
// The module tests drive the HTTP doors; this file pins the order of the gates inside the function itself.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../../', import.meta.url);
const fn = fs.readFileSync(new URL('hosted/functions/navego-billing/index.ts', root), 'utf8');
const harga = fs.readFileSync(new URL('site/app/routes/harga.tsx', root), 'utf8');

test('the buy action demands a signed-in owner before any plan is named', () => {
  const buy = fn.slice(fn.indexOf('body.action === "paypal-buy"'));
  const session = buy.indexOf('sessionOrNull(req)');
  const price = buy.indexOf('from("opera_price_list")');
  assert.ok(session > 0, 'the buy action checks the session');
  assert.ok(price > session, 'the price is read only after the session exists');
});

test('the buy action sells exactly the USD plans and only active price rows', () => {
  const buy = fn.slice(fn.indexOf('body.action === "paypal-buy"'));
  assert.match(buy, /\.eq\("active", true\)/, 'a retired plan is not sellable');
  assert.match(buy, /if \(!USD_PLANS\.includes\(plan\)\)/, 'an unknown plan is refused by name');
});

test('a webhook that fails verification is refused before any plan is activated', () => {
  const webhook = fn.indexOf('looksLikePaypalWebhook');
  const verify = fn.indexOf('verifyPaypalWebhook', webhook);
  const activate = fn.indexOf('opera_paypal_activate_order', webhook);
  assert.ok(webhook > 0 && verify > webhook, 'the signature is checked inside the webhook branch');
  assert.ok(activate > verify, 'activation happens only after verification returned true');
  assert.match(fn, /the paypal webhook signature was not recognised/, 'a forged webhook is refused by name');
});

test('checkout capture verifies the owner and does not pretend a failed activation worked', () => {
  assert.match(fn, /body.action === "paypal-capture"/);
  assert.match(fn, /readPaypalOrder/);
  assert.match(fn, /capturePaypalOrder/);
  assert.match(fn, /const owner = await sessionOrNull\(req\)/);
  assert.match(fn, /parsed\.owner !== owner/);
  assert.match(fn, /opera_paypal_activate_order/);
});

test('one PayPal order is settled once and activated once', () => {
  const capture = fn.slice(fn.indexOf('body.action === "paypal-capture"'), fn.indexOf('body.action === "paypal-buy"'));
  const captureSettle = capture.indexOf('opera_paypal_settle_order');
  const captureActivation = capture.indexOf('opera_paypal_activate_order');
  assert.ok(captureSettle > 0, 'the capture path settles the order');
  assert.ok(captureActivation > captureSettle, 'the settlement is durable before activation claims success');
  assert.ok((capture.match(/readPaypalOrder/g) || []).length >= 2, 'capture re-reads the completed order before it trusts the amount');

  const webhook = fn.slice(fn.indexOf('looksLikePaypalWebhook'), fn.indexOf('looksLikeNotification'));
  const webhookSettle = webhook.indexOf('opera_paypal_settle_order');
  const webhookActivation = webhook.indexOf('opera_paypal_activate_order');
  assert.ok(webhookSettle > 0, 'the verified webhook settles the same order');
  assert.ok(webhookActivation > webhookSettle, 'the webhook settles the order before activation');
  const missingOrder = webhook.indexOf('if (!order)');
  assert.ok(missingOrder > 0, 'the webhook refuses an order it could not read');

  const buy = fn.slice(fn.indexOf('body.action === "paypal-buy"'));
  assert.match(buy, /opera_paypal_create_order/);
  assert.doesNotMatch(fn, /recordPaypalSettlement/);
});

test('the tab PayPal returns to can name the order it was sent back with', () => {
  const finish = harga.slice(harga.indexOf('async function finishCheckout'));
  assert.match(finish, /get\('token'\)/, 'the order id PayPal appends to return_url is read');
  assert.match(harga, /localStorage\.setItem\('navego-paypal-order'/, 'the order id survives into the tab PayPal opens');
  assert.doesNotMatch(harga, /sessionStorage\.\w+Item\('navego-paypal-order'/, 'a per-tab store cannot hold the order for the returning tab');
  assert.doesNotMatch(harga, /Popup diblokir browser/, 'a tab opened with noopener is not a blocked popup');
});

test('the USD plan names in the function match the seven tiers', () => {
  for (const plan of ['plan.usd-1', 'plan.usd-3', 'plan.usd-5', 'plan.usd-7', 'plan.usd-9', 'plan.usd-17', 'plan.usd-33']) {
    assert.match(fn, new RegExp(plan.replace(/\./g, '\\.')), `${plan} is in the function's allowlist`);
  }
});
