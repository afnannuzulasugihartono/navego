// @last-edited: 2026-11-18 UTC+7.
// @title: paypal - order creation and webhook signature checking for the PayPal REST API.
// @state: env-driven environment (sandbox default, live via PAYPAL_ENV=live), three operations exposed for the billing function, and one verifier PayPal itself signs.
// @dependencies: edge runtime fetch.

// WHY THIS IS A MODULE AND NOT A STRING INSIDE navego-billing.
// The HTTP surface here is small but the signature care is not: a wrong header, a stale transmission, a mismatched webhook id, or a timing-broken comparison are all ways to make a forged USD claim look like a real one.
// One module houses one authority about how PayPal's endpoints answer so test harnesses can drive them and the rest does not re-implement token acquisition or the header names.

export interface PaypalEnvironment {
  base: string;
  environment: string;
  clientId: string;
  secret: string;
  webhookId: string;
}

// WHY globalThis AND NOT `Deno` OR `process` BY NAME.
// This module runs in Deno (the edge function) and in Node (the test suite), and referencing either runtime's global directly makes the other's type-check fail.
// Reading both through globalThis keeps one file that compiles in both and costs one cast.

const processEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
const denoEnv = (globalThis as { Deno?: { env?: { get(key: string): string | undefined } } }).Deno?.env;

function readEnv(key: string): string {
  try {
    return denoEnv?.get(key) ?? processEnv?.[key] ?? '';
  } catch {
    return '';
  }
}

export function paypalEnvironment(): PaypalEnvironment {
  const environment = readEnv('PAYPAL_ENV') || 'sandbox';
  const base = environment === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  return {
    base,
    environment,
    clientId: readEnv('PAYPAL_CLIENT_ID'),
    secret: readEnv('PAYPAL_SECRET'),
    webhookId: readEnv('PAYPAL_WEBHOOK_ID')
  };
}

export async function paypalAccessToken(env: PaypalEnvironment): Promise<string> {
  if (!env.clientId || !env.secret) throw new Error('paypal credentials are not set');
  const response = await fetch(`${env.base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: `Basic ${btoa(`${env.clientId}:${env.secret}`)}`
    },
    body: 'grant_type=client_credentials'
  });
  if (!response.ok) throw new Error(`paypal token refused: ${response.status}`);
  const body = await response.json() as { access_token?: string };
  if (!body.access_token) throw new Error('paypal token response carried no access_token');
  return body.access_token;
}

export interface PaypalOrderRequest {
  amountCents: number;
  currency: string;
  description: string;
  customId: string;
}

export async function createPaypalOrder(env: PaypalEnvironment, input: PaypalOrderRequest): Promise<{ id: string; approvalUrl?: string }> {
  const token = await paypalAccessToken(env);
  const response = await fetch(`${env.base}/v2/checkout/orders`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          value: (input.amountCents / 100).toFixed(2),
          currency_code: input.currency.toUpperCase()
        },
        description: input.description,
        custom_id: input.customId
      }],
      application_context: { brand_name: 'Navego' }
    })
  });
  const body = await response.json() as Record<string, unknown>;
  if (!response.ok || typeof body.id !== 'string') {
    throw new Error(`paypal order refused: ${JSON.stringify(body).slice(0, 500)}`);
  }
  const links = Array.isArray(body.links) ? body.links as Array<{ rel?: string; href?: string }> : [];
  const approval = links.find((l) => l.rel === 'approve')?.href;
  const result: { id: string; approvalUrl?: string } = { id: body.id };
  if (approval) result.approvalUrl = approval;
  return result;
}

export interface PaypalWebhookHeaders {
  'paypal-transmission-id'?: string;
  'paypal-transmission-sig'?: string;
  'paypal-transmission-time'?: string;
  'paypal-cert-url'?: string;
  'paypal-auth-algo'?: string;
}

export async function verifyPaypalWebhook(
  env: PaypalEnvironment,
  headers: PaypalWebhookHeaders,
  eventBody: unknown
): Promise<boolean> {
  if (!env.webhookId) return false;
  const transmissionId = headers['paypal-transmission-id'];
  const transmissionTime = headers['paypal-transmission-time'];
  const transmissionSig = headers['paypal-transmission-sig'];
  const certUrl = headers['paypal-cert-url'];
  const authAlgo = headers['paypal-auth-algo'];
  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) return false;
  const token = await paypalAccessToken(env);
  const response = await fetch(`${env.base}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      webhook_id: env.webhookId,
      webhook_event: eventBody
    })
  });
  if (!response.ok) return false;
  const body = await response.json() as Record<string, unknown>;
  return String(body.verification_status ?? '').toUpperCase() === 'SUCCESS';
}

export interface PaypalCaptureEvent {
  event_type?: string;
  resource?: { supplementary_data?: { related_ids?: { order_id?: string } } };
}

export async function capturePaypalOrder(env: PaypalEnvironment, orderId: string): Promise<Record<string, unknown>> {
  const token = await paypalAccessToken(env);
  const response = await fetch(`${env.base}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    method: 'GET',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }
  });
  if (!response.ok) throw new Error(`paypal order refused: ${response.status}`);
  return await response.json() as Record<string, unknown>;
}

export function planFromCustomId(customId: string | null | undefined): { plan: string; owner: string } | null {
  if (!customId) return null;
  const parts = customId.split(':');
  const plan = parts[0] ?? '';
  const rest = parts.slice(1).join(':');
  if (!plan || !rest) return null;
  if (!plan.startsWith('plan.')) return null;
  return { plan, owner: rest };
}
