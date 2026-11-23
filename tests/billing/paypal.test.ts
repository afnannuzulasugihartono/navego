// @last-edited: 2026-11-18 UTC+7.
// @title: paypal.test — the two HTTP doors to PayPal, pinned before a real account rides them.
// @state: the environment is env-driven (sandbox default, live via PAYPAL_ENV), the token request is refused without credentials, an order carries the exact amount and custom id, and a webhook is trusted only when PayPal's own verifier says SUCCESS.
// @dependencies: node:test, strict, ../hosted/functions/_shared/paypal.ts.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  paypalEnvironment,
  paypalAccessToken,
  createPaypalOrder,
  readPaypalOrder,
  capturePaypalOrder,
  verifyPaypalWebhook,
  planFromCustomId,
  type PaypalEnvironment
} from '../../hosted/functions/_shared/paypal.ts';

const ENV_KEYS = ['PAYPAL_ENV', 'PAYPAL_CLIENT_ID', 'PAYPAL_SECRET', 'PAYPAL_WEBHOOK_ID'];

function withEnv(values: Record<string, string | undefined>, fn: () => void) {
  const saved: Record<string, string | undefined> = {};
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    if (values[key] === undefined) delete process.env[key];
    else process.env[key] = values[key];
  }
  try {
    fn();
  } finally {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
}

function stubFetch(respond: (url: string, init: RequestInit) => Response): () => void {
  const original = globalThis.fetch;
  const calls: Array<{ url: string; init: RequestInit }> = [];
  globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
    const url = String(input);
    const safeInit = (init ?? {}) as RequestInit;
    calls.push({ url, init: safeInit });
    return respond(url, safeInit);
  }) as typeof fetch;
  return () => {
    globalThis.fetch = original;
    void calls;
  };
}

const envOf = (overrides: Partial<PaypalEnvironment> = {}): PaypalEnvironment => ({
  base: 'https://api-m.sandbox.paypal.com',
  environment: 'sandbox',
  clientId: 'client',
  secret: 'secret',
  webhookId: 'WEBHOOK-1',
  ...overrides
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

test('the environment defaults to sandbox, and PAYPAL_ENV=live selects the live hosts', () => {
  withEnv({ PAYPAL_ENV: undefined, PAYPAL_CLIENT_ID: 'id', PAYPAL_SECRET: 'sec', PAYPAL_WEBHOOK_ID: 'wid' }, () => {
    const env = paypalEnvironment();
    assert.equal(env.environment, 'sandbox');
    assert.equal(env.base, 'https://api-m.sandbox.paypal.com');
  });
  withEnv({ PAYPAL_ENV: 'live', PAYPAL_CLIENT_ID: 'id', PAYPAL_SECRET: 'sec', PAYPAL_WEBHOOK_ID: 'wid' }, () => {
    const env = paypalEnvironment();
    assert.equal(env.environment, 'live');
    assert.equal(env.base, 'https://api-m.paypal.com');
  });
});

test('the token door refuses to open without credentials, and names PayPal refusing', async () => {
  await assert.rejects(paypalAccessToken(envOf({ clientId: '', secret: '' })), /credentials are not set/);
  const unrestore = stubFetch(() => jsonResponse({ error: 'invalid_client' }, 401));
  try {
    await assert.rejects(paypalAccessToken(envOf()), /refused: 401/);
  } finally {
    unrestore();
  }
});

test('an order carries the amount in dollars, the currency, and the custom id', async () => {
  const bodies: string[] = [];
  const unrestore = stubFetch((url, init) => {
    if (url.endsWith('/v1/oauth2/token')) return jsonResponse({ access_token: 'tok-1' });
    if (url.endsWith('/v2/checkout/orders')) {
      bodies.push(String(init.body));
      return jsonResponse({ id: 'ORDER-1', links: [{ rel: 'approve', href: 'https://paypal.test/approve' }] });
    }
    return jsonResponse({}, 404);
  });
  try {
    const out = await createPaypalOrder(envOf(), { amountCents: 1700, currency: 'USD', description: 'Navego Business', customId: 'plan.usd-17:owner-1' });
    assert.equal(out.id, 'ORDER-1');
    assert.equal(out.approvalUrl, 'https://paypal.test/approve');
    const body = JSON.parse(bodies[0] ?? '{}');
    assert.equal(body.intent, 'CAPTURE');
    assert.equal(body.purchase_units[0].amount.value, '17.00');
    assert.equal(body.purchase_units[0].amount.currency_code, 'USD');
    assert.equal(body.purchase_units[0].custom_id, 'plan.usd-17:owner-1');
  } finally {
    unrestore();
  }
});

test('an order refused by PayPal throws instead of minting a broken approval url', async () => {
  const unrestore = stubFetch((url) => {
    if (url.endsWith('/v1/oauth2/token')) return jsonResponse({ access_token: 'tok-1' });
    return jsonResponse({ name: 'INVALID_RESOURCE_ID' }, 422);
  });
  try {
    await assert.rejects(createPaypalOrder(envOf(), { amountCents: 100, currency: 'USD', description: 'x', customId: 'plan.usd-1:o' }), /paypal order refused/);
  } finally {
    unrestore();
  }
});

test('capture posts to the order capture endpoint, while read fetches the order for its owner custom id', async () => {
  const seen: Array<{ url: string; method?: string }> = [];
  const unrestore = stubFetch((url, init) => {
    seen.push({ url, method: init.method ?? '' });
    if (url.endsWith('/v1/oauth2/token')) return jsonResponse({ access_token: 'tok-1' });
    if (url.endsWith('/v2/checkout/orders/ORDER-1/capture')) return jsonResponse({ id: 'ORDER-1', status: 'COMPLETED' });
    if (url.endsWith('/v2/checkout/orders/ORDER-1')) return jsonResponse({ id: 'ORDER-1', purchase_units: [{ custom_id: 'plan.usd-1:owner-1' }] });
    return jsonResponse({}, 404);
  });
  try {
    const read = await readPaypalOrder(envOf(), 'ORDER-1');
    const captured = await capturePaypalOrder(envOf(), 'ORDER-1');
    const units = read.purchase_units as Array<{ custom_id?: string }>;
    assert.equal(units[0]?.custom_id, 'plan.usd-1:owner-1');
    assert.equal(captured.status, 'COMPLETED');
    assert.equal(seen.find((call) => call.url.endsWith('/capture'))?.method, 'POST');
    assert.equal(seen.find((call) => call.url.endsWith('/v2/checkout/orders/ORDER-1'))?.method, 'GET');
  } finally {
    unrestore();
  }
});

test('a webhook is trusted only when PayPal answers SUCCESS on the verify call', async () => {
  const headers = {
    'paypal-transmission-id': 'tx',
    'paypal-transmission-time': '2026-11-18T00:00:00Z',
    'paypal-transmission-sig': 'sig',
    'paypal-cert-url': 'https://paypal.test/cert',
    'paypal-auth-algo': 'SHA256withRSA'
  };
  for (const verdict of ['SUCCESS', 'FAILURE']) {
    const unrestore = stubFetch((url) => {
      if (url.endsWith('/v1/oauth2/token')) return jsonResponse({ access_token: 'tok-1' });
      return jsonResponse({ verification_status: verdict });
    });
    try {
      assert.equal(await verifyPaypalWebhook(envOf(), headers, { event_type: 'PAYMENT.CAPTURE.COMPLETED' }), verdict === 'SUCCESS');
    } finally {
      unrestore();
    }
  }
});

test('a webhook with no configured id, or missing headers, is refused without a network call', async () => {
  assert.equal(await verifyPaypalWebhook(envOf({ webhookId: '' }), {}, {}), false);
  const unrestore = stubFetch(() => {
    throw new Error('no network call may happen');
  });
  try {
    assert.equal(await verifyPaypalWebhook(envOf(), { 'paypal-transmission-id': 'tx' }, {}), false);
  } finally {
    unrestore();
  }
});

test('a webhook whose verify call fails is refused, never assumed', async () => {
  const unrestore = stubFetch((url) => {
    if (url.endsWith('/v1/oauth2/token')) return jsonResponse({ access_token: 'tok-1' });
    return jsonResponse({}, 500);
  });
  try {
    const headers = {
      'paypal-transmission-id': 'tx',
      'paypal-transmission-time': 't',
      'paypal-transmission-sig': 's',
      'paypal-cert-url': 'c',
      'paypal-auth-algo': 'a'
    };
    assert.equal(await verifyPaypalWebhook(envOf(), headers, {}), false);
  } finally {
    unrestore();
  }
});

test('planFromCustomId reads the plan and owner, tolerates colons in the owner, and rejects garbage', () => {
  assert.deepEqual(planFromCustomId('plan.usd-17:owner-1'), { plan: 'plan.usd-17', owner: 'owner-1' });
  assert.deepEqual(planFromCustomId('plan.usd-1:owner:with:colons'), { plan: 'plan.usd-1', owner: 'owner:with:colons' });
  assert.equal(planFromCustomId('no-plan-here'), null);
  assert.equal(planFromCustomId('notplan.x:owner'), null);
  assert.equal(planFromCustomId(null), null);
  assert.equal(planFromCustomId(undefined), null);
});
