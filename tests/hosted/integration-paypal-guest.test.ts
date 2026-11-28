// @last-edited: 2026-11-28 WIB.
// @title: integration-paypal-guest - the guest checkout proven against a disposable database.
// @state: asserts against the live database only when NAVEGO_TEST_DATABASE_URL is set - the ci.yml postgres job sets it after applying every migration; without it the test skips.
// @dependencies: node:test, strict, pg.

// The guest checkout is a promise the database keeps, not a promise the browser makes.
// A buyer may pay before there is an account, so the quote is stored without an owner and one account binds itself to it after signing in.
// The token that proves the claim is stored as a hash, so a leaked row cannot be replayed, and the settlement still refuses a mismatch.

// decisions.json -> hosted-paypal-guest-checkout-01

import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from 'pg';

const DATABASE_URL = process.env.NAVEGO_TEST_DATABASE_URL;

const OWNER = '00000000-0000-4000-8000-000000000011';
const OTHER = '00000000-0000-4000-8000-000000000012';
const ORDER_ID = 'ORDER-PAYPAL-GUEST';
const TOKEN = 'guest-checkout-token-for-the-integration-test';

const signInAs = async (client: Client, id: string | null): Promise<void> => {
  await client.query('select set_config($1, $2, false)', ['request.jwt.claim.sub', id ?? '']);
};

const claim = async (client: Client, token: string, plan: string, amount: number, currency: string) =>
  (await client.query(
    "select public.opera_paypal_claim_order('sandbox', $1, $2, $3, $4, $5) as answer",
    [ORDER_ID, token, plan, amount, currency]
  )).rows[0].answer;

test('a guest quote is claimed by one account and settles against a real capture', { skip: DATABASE_URL === undefined }, async () => {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query('delete from public.opera_notification_log where order_id = $1', [ORDER_ID]);
    await client.query('delete from public.opera_paypal_orders where environment = $1 and order_id = $2', ['sandbox', ORDER_ID]);
    await client.query('delete from public.opera_account_plans where user_id = any($1)', [[OWNER, OTHER]]);
    await client.query('insert into auth.users (id) values ($1), ($2) on conflict (id) do nothing', [OWNER, OTHER]);

    const quoted = (await client.query(
      "select public.opera_paypal_create_guest_order('sandbox', $1, $2, 'plan.usd-1', 100, 'USD') as answer",
      [ORDER_ID, TOKEN]
    )).rows[0].answer;
    assert.equal(quoted.ok, true, `the guest quote must be stored: ${JSON.stringify(quoted)}`);

    const row = (await client.query(
      'select owner_id, claimed_at, guest_token_hash, plan, amount_cents, currency from public.opera_paypal_orders where environment = $1 and order_id = $2',
      ['sandbox', ORDER_ID]
    )).rows[0];
    assert.equal(row.owner_id, null, 'a guest quote carries no owner before the claim');
    assert.equal(row.claimed_at, null, 'a guest quote is unclaimed before the claim');
    assert.match(row.guest_token_hash, /^[a-f0-9]{64}$/, 'the claim token is stored as a hash, never as the token itself');
    assert.equal(row.guest_token_hash.includes(TOKEN), false, 'the raw token is nowhere in the row');
    assert.equal(row.plan, 'plan.usd-1');
    assert.equal(row.amount_cents, 100);
    assert.equal(row.currency, 'USD');

    const quotedAgain = (await client.query(
      "select public.opera_paypal_create_guest_order('sandbox', $1, $2, 'plan.usd-1', 100, 'USD') as answer",
      [ORDER_ID, TOKEN]
    )).rows[0].answer;
    assert.equal(quotedAgain.ok, true, 'the same quote twice is the same quote');
    assert.equal(quotedAgain.created, false, 'the second quote writes no second row');

    await signInAs(client, OWNER);
    const wrongToken = await claim(client, 'another-token-that-never-bought-anything', 'plan.usd-1', 100, 'USD');
    assert.equal(wrongToken.ok, false, 'a token that did not open the order cannot claim it');
    assert.equal(wrongToken.error, 'the guest checkout token does not match this order');

    const mismatch = await claim(client, TOKEN, 'plan.usd-3', 100, 'USD');
    assert.equal(mismatch.ok, false, 'a claim for another plan is refused');
    assert.equal(mismatch.error, 'PayPal order no longer matches the quote');

    const wrongAmount = await claim(client, TOKEN, 'plan.usd-1', 300, 'USD');
    assert.equal(wrongAmount.ok, false, 'a claim for another amount is refused');
    assert.equal(wrongAmount.error, 'PayPal order no longer matches the quote');

    const claimed = await claim(client, TOKEN, 'plan.usd-1', 100, 'USD');
    assert.equal(claimed.ok, true, `the account that holds the token claims the order: ${JSON.stringify(claimed)}`);
    assert.equal(claimed.status, 'claimed');

    const claimedRow = (await client.query(
      'select owner_id, claimed_at, guest_token_hash from public.opera_paypal_orders where environment = $1 and order_id = $2',
      ['sandbox', ORDER_ID]
    )).rows[0];
    assert.equal(claimedRow.owner_id, OWNER, 'the claim binds the signed-in account');
    assert.ok(claimedRow.claimed_at, 'the claim is dated');
    assert.equal(claimedRow.guest_token_hash, null, 'the token dies with the claim');

    const replay = await claim(client, TOKEN, 'plan.usd-1', 100, 'USD');
    assert.equal(replay.ok, false, 'the token cannot be replayed');
    assert.equal(replay.error, 'PayPal order was already claimed');

    await signInAs(client, OTHER);
    const wrongAccount = await claim(client, TOKEN, 'plan.usd-1', 100, 'USD');
    assert.equal(wrongAccount.ok, false, 'another account cannot take a claimed order');
    assert.equal(wrongAccount.error, 'PayPal order was already claimed');
    await signInAs(client, OWNER);

    const settled = (await client.query(
      "select public.opera_paypal_settle_order('sandbox', $1, 'guest', 'plan.usd-1', 100, 'USD', 'integration') as answer",
      [ORDER_ID]
    )).rows[0].answer;
    assert.equal(settled.status, 'settled', `a real capture of the claimed order settles: ${JSON.stringify(settled)}`);

    const revenueRows = (await client.query(
      "select count(*)::int as count from public.opera_notification_log where environment = 'paypal-sandbox' and order_id = $1",
      [ORDER_ID]
    )).rows[0].count;
    assert.equal(revenueRows, 1, 'one claimed guest order writes one revenue event');

    const activated = (await client.query("select public.opera_paypal_activate_order('sandbox', $1) as answer", [ORDER_ID])).rows[0].answer;
    assert.equal(activated.status, 'activated', `the claimed order activates the plan: ${JSON.stringify(activated)}`);

    const plan = (await client.query('select plan from public.opera_account_plans where user_id = $1', [OWNER])).rows[0];
    assert.equal(plan.plan, 'plan.usd-1', 'the plan lands on the account that claimed the order');
    const otherPlan = (await client.query('select count(*)::int as count from public.opera_account_plans where user_id = $1', [OTHER])).rows[0].count;
    assert.equal(otherPlan, 0, 'the account that tried to steal the claim gets nothing');
  } finally {
    await client.query('delete from public.opera_notification_log where order_id = $1', [ORDER_ID]);
    await client.query('delete from public.opera_paypal_orders where environment = $1 and order_id = $2', ['sandbox', ORDER_ID]);
    await client.query('delete from public.opera_account_plans where user_id = any($1)', [[OWNER, OTHER]]);
    await client.query('delete from auth.users where id = any($1)', [[OWNER, OTHER]]);
    await client.end();
  }
});

test('a guest order that nobody claimed never settles', { skip: DATABASE_URL === undefined }, async () => {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  const orderId = 'ORDER-PAYPAL-GUEST-UNCLAIMED';
  const token = 'guest-checkout-token-for-the-unclaimed-order';
  try {
    await client.query('delete from public.opera_notification_log where order_id = $1', [orderId]);
    await client.query('delete from public.opera_paypal_orders where environment = $1 and order_id = $2', ['sandbox', orderId]);

    const quoted = (await client.query(
      "select public.opera_paypal_create_guest_order('sandbox', $1, $2, 'plan.usd-1', 100, 'USD') as answer",
      [orderId, token]
    )).rows[0].answer;
    assert.equal(quoted.ok, true);

    const settled = (await client.query(
      "select public.opera_paypal_settle_order('sandbox', $1, 'guest', 'plan.usd-1', 100, 'USD', 'integration') as answer",
      [orderId]
    )).rows[0].answer;
    assert.equal(settled.status, 'review', 'a capture without a claim goes to review');

    const activated = (await client.query("select public.opera_paypal_activate_order('sandbox', $1) as answer", [orderId])).rows[0].answer;
    assert.equal(activated.ok, false, 'an unclaimed order never activates a plan');

    const shortToken = (await client.query(
      "select public.opera_paypal_create_guest_order('sandbox', $1, 'short', 'plan.usd-1', 100, 'USD') as answer",
      ['ORDER-PAYPAL-GUEST-SHORT']
    )).rows[0].answer;
    assert.equal(shortToken.ok, false, 'a token too short to be opaque is refused');

    await client.query('delete from public.opera_notification_log where order_id = $1', [orderId]);
    await client.query('delete from public.opera_paypal_orders where environment = $1 and order_id = $2', ['sandbox', orderId]);
    await client.query('delete from public.opera_paypal_orders where environment = $1 and order_id = $2', ['sandbox', 'ORDER-PAYPAL-GUEST-SHORT']);
  } finally {
    await client.query('delete from public.opera_notification_log where order_id = $1', [orderId]);
    await client.query('delete from public.opera_paypal_orders where environment = $1 and order_id = $2', ['sandbox', orderId]);
    await client.query('delete from public.opera_paypal_orders where environment = $1 and order_id = $2', ['sandbox', 'ORDER-PAYPAL-GUEST-SHORT']);
    await client.end();
  }
});
