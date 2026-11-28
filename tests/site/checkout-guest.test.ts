// @last-edited: 2026-11-28 WIB.
// @title: checkout-guest.test - the guest checkout token is remembered, sent once, and dies with the claim.
// @state: one guest record is kept in browser-local storage, the claim posts the order, the token, the plan, the amount and the currency to the claim RPC, and a refusal comes back as a refusal.
// @dependencies: node:test, strict, ../../site/app/lib/checkout-guest.ts, ../../site/app/lib/auth.ts.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const modulePath = pathToFileURL(path.join(root, 'site', 'app', 'lib', 'checkout-guest.ts')).href;

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

type GuestModule = {
  PAYPAL_ENVIRONMENT: string;
  rememberGuestCheckout: (record: GuestRecord, storage?: StorageLike | null) => void;
  readGuestCheckout: (storage?: StorageLike | null) => GuestRecord | null;
  forgetGuestCheckout: (storage?: StorageLike | null) => void;
  claimGuestCheckout: (record: GuestRecord, endpoint: string, headers: Record<string, string>) => Promise<{ ok?: boolean; error?: string }>;
};

type GuestRecord = {
  orderId: string;
  token: string;
  plan: string;
  amountCents: number;
  currency: string;
};

async function guestModule(): Promise<GuestModule> {
  try {
    return await import(modulePath) as GuestModule;
  } catch {
    assert.fail('site/app/lib/checkout-guest.ts must expose the tested guest checkout store');
  }
}

function memoryStore(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); }
  };
}

const record: GuestRecord = {
  orderId: 'ORDER-GUEST-1',
  token: 'opaque-guest-token',
  plan: 'plan.usd-1',
  amountCents: 100,
  currency: 'USD'
};

test('the guest record is remembered, read back, and cleared', async () => {
  const { rememberGuestCheckout, readGuestCheckout, forgetGuestCheckout } = await guestModule();
  const storage = memoryStore();
  rememberGuestCheckout(record, storage);
  assert.deepEqual(readGuestCheckout(storage), record);
  forgetGuestCheckout(storage);
  assert.equal(readGuestCheckout(storage), null);
});

test('a broken record is read as no record, because a half-written claim buys nothing', async () => {
  const { readGuestCheckout } = await guestModule();
  const storage = memoryStore();
  storage.setItem('navego-guest-checkout', '{not json');
  assert.equal(readGuestCheckout(storage), null);
  storage.setItem('navego-guest-checkout', JSON.stringify({ orderId: 'ORDER-GUEST-2' }));
  assert.equal(readGuestCheckout(storage), null, 'a record without the token cannot claim anything');
});

test('blocked tab storage never breaks the pricing page', async () => {
  const { rememberGuestCheckout, readGuestCheckout, forgetGuestCheckout } = await guestModule();
  const blocked: StorageLike = {
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
    removeItem: () => { throw new Error('blocked'); }
  };
  assert.doesNotThrow(() => rememberGuestCheckout(record, blocked));
  assert.equal(readGuestCheckout(blocked), null);
  assert.doesNotThrow(() => forgetGuestCheckout(blocked));
});

test('the claim posts the order, the token, the plan, the amount and the currency with the session', async () => {
  const { claimGuestCheckout } = await guestModule();
  const seen: Array<{ url: string; init: RequestInit }> = [];
  const original = globalThis.fetch;
  (globalThis as unknown as { fetch: typeof fetch }).fetch = (async (url: string, init: RequestInit) => {
    seen.push({ url: String(url), init });
    return new Response(JSON.stringify({ ok: true, status: 'claimed' }), { status: 200 });
  }) as unknown as typeof fetch;
  try {
    const answer = await claimGuestCheckout(record, 'https://example.test/rpc/opera_paypal_claim_order', { apikey: 'the-key', authorization: 'Bearer the-session-token' });
    assert.equal(answer.ok, true);
    assert.equal(seen.length, 1);
    const call = seen[0];
    assert.ok(call);
    assert.equal(call.url, 'https://example.test/rpc/opera_paypal_claim_order');
    const headers = call.init.headers as Record<string, string>;
    assert.equal(headers.authorization, 'Bearer the-session-token', 'the claim carries the session of the account that claims');
    const body = JSON.parse(String(call.init.body)) as Record<string, unknown>;
    assert.equal(body.p_order_id, record.orderId);
    assert.equal(body.p_guest_token, record.token);
    assert.equal(body.p_plan, record.plan);
    assert.equal(body.p_amount_cents, record.amountCents);
    assert.equal(body.p_currency, record.currency);
    assert.equal(body.p_environment, 'live');
  } finally {
    (globalThis as unknown as { fetch?: typeof fetch }).fetch = original;
  }
});

test('a refused claim comes back as a refusal, never as a success', async () => {
  const { claimGuestCheckout } = await guestModule();
  const original = globalThis.fetch;
  (globalThis as unknown as { fetch: typeof fetch }).fetch = (async () =>
    new Response(JSON.stringify({ ok: false, error: 'PayPal order was already claimed' }), { status: 200 })) as unknown as typeof fetch;
  try {
    const answer = await claimGuestCheckout(record, 'https://example.test/rpc/opera_paypal_claim_order', { authorization: 'Bearer the-session-token' });
    assert.equal(answer.ok, false);
    assert.equal(answer.error, 'PayPal order was already claimed');
  } finally {
    (globalThis as unknown as { fetch?: typeof fetch }).fetch = original;
  }
});

test('the pricing page calls the claim with the project endpoint and the project headers', async () => {
  const { PAYPAL_ENVIRONMENT } = await guestModule();
  const harga = fs.readFileSync(path.join(root, 'site', 'app', 'routes', 'harga.tsx'), 'utf8');
  assert.match(harga, /`\$\{REST\}\/rpc\/opera_paypal_claim_order`/);
  assert.match(harga, /headersFor\(token\)/);
  assert.equal(PAYPAL_ENVIRONMENT, 'live');
  assert.doesNotMatch(harga, /sb_publishable_/, 'the pricing page takes the key from auth.ts instead of carrying a copy');
});

test('a signed-out click asks the billing edge for a guest order and keeps the token', () => {
  const harga = fs.readFileSync(path.join(root, 'site', 'app', 'routes', 'harga.tsx'), 'utf8');
  assert.match(harga, /action: 'paypal-buy', plan: planKind, guest: true/);
  assert.match(harga, /rememberGuestCheckout\(record\)/);
  assert.match(harga, /readGuestCheckout\(\)/);
  assert.match(harga, /forgetGuestCheckout\(\)/);
});

test('the return claims the quote before the capture runs', () => {
  const harga = fs.readFileSync(path.join(root, 'site', 'app', 'routes', 'harga.tsx'), 'utf8');
  const claim = harga.indexOf('claimGuestCheckout(guest,');
  const capture = harga.indexOf("action: 'paypal-capture'");
  assert.ok(claim > -1, 'the pricing page claims the quote');
  assert.ok(capture > -1, 'the pricing page still captures the order');
  assert.ok(claim < capture, 'the claim runs before the capture, or the capture would settle an order nobody owns');
});

test('a refused claim stops the return and never claims a settlement', () => {
  const harga = fs.readFileSync(path.join(root, 'site', 'app', 'routes', 'harga.tsx'), 'utf8');
  assert.match(harga, /if \(!claimed\.ok\) \{[\s\S]*?return;/);
  assert.doesNotMatch(harga, /status: 'active'/, 'the page never writes the activation itself');
});
