-- A guest checkout is a quote with no owner, and one account may claim it once.
-- The claim token is stored as a hash, the claim binds the account before a settlement is judged, and a settlement still refuses a mismatch.
-- The PayPal order of a guest checkout carries the owner marker "guest", so a settlement can tell a guest order from an order an account already bought.
-- decisions.json -> hosted-paypal-guest-checkout-01

alter table public.opera_paypal_orders
  add column if not exists guest_token_hash text,
  add column if not exists claimed_at timestamptz;

comment on column public.opera_paypal_orders.guest_token_hash is 'The sha256 of the one-time guest checkout token, kept only until an account claims the order.';
comment on column public.opera_paypal_orders.claimed_at is 'When an account claimed a guest quote, and the quote stopped accepting a claim.';

create or replace function public.opera_paypal_create_guest_order(
  p_environment text,
  p_order_id text,
  p_guest_token text,
  p_plan text,
  p_amount_cents integer,
  p_currency text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_environment text := lower(trim(p_environment));
  v_order_id text := trim(p_order_id);
  v_token text := trim(p_guest_token);
  v_plan text := trim(p_plan);
  v_currency text := upper(trim(p_currency));
  v_inserted integer := 0;
  v_existing public.opera_paypal_orders%rowtype;
begin
  if v_environment is null or v_environment not in ('live', 'sandbox') then
    return jsonb_build_object('ok', false, 'error', 'unknown PayPal environment');
  end if;
  if v_order_id is null or v_order_id = '' then
    return jsonb_build_object('ok', false, 'error', 'PayPal order id is required');
  end if;
  if v_token is null or char_length(v_token) < 16 then
    return jsonb_build_object('ok', false, 'error', 'the guest checkout token is required');
  end if;
  if v_plan is null or v_plan not in ('plan.usd-1', 'plan.usd-3', 'plan.usd-5', 'plan.usd-7', 'plan.usd-9', 'plan.usd-17', 'plan.usd-33') then
    return jsonb_build_object('ok', false, 'error', 'unknown PayPal plan');
  end if;
  if p_amount_cents is null or p_amount_cents <= 0 or v_currency is null or v_currency <> 'USD' then
    return jsonb_build_object('ok', false, 'error', 'PayPal quote must be a positive USD amount');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_environment || ':' || v_order_id, 0));

  insert into public.opera_paypal_orders (environment, order_id, owner_id, plan, amount_cents, currency, status, has_quote, source, guest_token_hash)
  values (v_environment, v_order_id, null, v_plan, p_amount_cents, v_currency, 'created', true, 'guest-quote', public.opera_sha256(v_token))
  on conflict (environment, order_id) do nothing;
  get diagnostics v_inserted = row_count;

  select * into v_existing
  from public.opera_paypal_orders
  where environment = v_environment and order_id = v_order_id;

  if v_existing.plan is distinct from v_plan
    or v_existing.amount_cents is distinct from p_amount_cents
    or v_existing.currency is distinct from v_currency then
    return jsonb_build_object('ok', false, 'error', 'PayPal order id already carries another quote');
  end if;
  if v_existing.owner_id is not null then
    return jsonb_build_object('ok', false, 'error', 'PayPal order id already belongs to an account');
  end if;
  if v_existing.guest_token_hash is distinct from public.opera_sha256(v_token) then
    return jsonb_build_object('ok', false, 'error', 'PayPal order id already carries another guest token');
  end if;

  return jsonb_build_object('ok', true, 'created', v_inserted = 1, 'status', v_existing.status, 'orderId', v_order_id);
end $$;

create or replace function public.opera_paypal_claim_order(
  p_environment text,
  p_order_id text,
  p_guest_token text,
  p_plan text,
  p_amount_cents integer,
  p_currency text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_environment text := lower(trim(p_environment));
  v_order_id text := trim(p_order_id);
  v_token text := trim(p_guest_token);
  v_plan text := trim(p_plan);
  v_currency text := upper(trim(p_currency));
  v_owner uuid := auth.uid();
  v_order public.opera_paypal_orders%rowtype;
begin
  if v_owner is null then
    return jsonb_build_object('ok', false, 'error', 'sign in before claiming the order');
  end if;
  if v_environment is null or v_environment not in ('live', 'sandbox') then
    return jsonb_build_object('ok', false, 'error', 'unknown PayPal environment');
  end if;
  if v_order_id is null or v_order_id = '' then
    return jsonb_build_object('ok', false, 'error', 'PayPal order id is required');
  end if;
  if v_token is null or v_token = '' then
    return jsonb_build_object('ok', false, 'error', 'the guest checkout token is required');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_environment || ':' || v_order_id, 0));

  select * into v_order
  from public.opera_paypal_orders
  where environment = v_environment and order_id = v_order_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'PayPal order was not found');
  end if;
  if v_order.status <> 'created' then
    return jsonb_build_object('ok', false, 'error', 'PayPal order is no longer open for a claim');
  end if;
  if v_order.owner_id is not null or v_order.claimed_at is not null then
    return jsonb_build_object('ok', false, 'error', 'PayPal order was already claimed');
  end if;
  if v_order.guest_token_hash is null or v_order.guest_token_hash is distinct from public.opera_sha256(v_token) then
    return jsonb_build_object('ok', false, 'error', 'the guest checkout token does not match this order');
  end if;
  if v_order.plan is distinct from v_plan
    or v_order.amount_cents is distinct from p_amount_cents
    or v_order.currency is distinct from v_currency then
    return jsonb_build_object('ok', false, 'error', 'PayPal order no longer matches the quote');
  end if;

  update public.opera_paypal_orders
  set owner_id = v_owner::text,
      claimed_at = now(),
      guest_token_hash = null,
      updated_at = now()
  where id = v_order.id;

  return jsonb_build_object('ok', true, 'status', 'claimed', 'orderId', v_order_id, 'plan', v_order.plan);
end $$;

create or replace function public.opera_paypal_settle_order(
  p_environment text,
  p_order_id text,
  p_actual_owner_id text,
  p_actual_plan text,
  p_actual_amount_cents integer,
  p_actual_currency text,
  p_source text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_environment text := lower(trim(p_environment));
  v_order_id text := trim(p_order_id);
  v_actual_owner_id text := nullif(lower(trim(p_actual_owner_id)), '');
  v_actual_plan text := nullif(trim(p_actual_plan), '');
  v_actual_currency text := upper(trim(p_actual_currency));
  v_source text := left(trim(p_source), 80);
  v_order public.opera_paypal_orders%rowtype;
  v_inserted integer := 0;
  v_new boolean := false;
  v_previous_status text;
  v_status text;
  v_reason text;
begin
  if v_environment is null or v_environment not in ('live', 'sandbox') then
    return jsonb_build_object('ok', false, 'error', 'unknown PayPal environment');
  end if;
  if v_order_id is null or v_order_id = '' then
    return jsonb_build_object('ok', false, 'error', 'PayPal order id is required');
  end if;
  if p_actual_amount_cents is null or p_actual_amount_cents <= 0 or v_actual_currency is null or v_actual_currency <> 'USD' then
    return jsonb_build_object('ok', false, 'error', 'PayPal settlement must be a positive USD amount');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_environment || ':' || v_order_id, 0));

  select * into v_order
  from public.opera_paypal_orders
  where environment = v_environment and order_id = v_order_id
  for update;

  if not found then
    insert into public.opera_paypal_orders (
      environment,
      order_id,
      owner_id,
      plan,
      amount_cents,
      currency,
      status,
      has_quote,
      source,
      settled_at,
      actual_owner_id,
      actual_plan
    ) values (
      v_environment,
      v_order_id,
      null,
      null,
      p_actual_amount_cents,
      v_actual_currency,
      'review',
      false,
      v_source,
      now(),
      v_actual_owner_id,
      v_actual_plan
    )
    on conflict (environment, order_id) do nothing;
    get diagnostics v_inserted = row_count;
    v_new := v_inserted = 1;

    select * into v_order
    from public.opera_paypal_orders
    where environment = v_environment and order_id = v_order_id
    for update;
    v_status := 'review';
    v_reason := 'the completed order has no stored quote';
  elsif v_order.status = 'activated' then
    return jsonb_build_object('ok', true, 'status', 'activated', 'already', true, 'orderId', v_order_id);
  else
    v_previous_status := v_order.status;
    if v_previous_status = 'review' then
      v_status := 'review';
      v_reason := 'the completed order already needs review';
    elsif not v_order.has_quote then
      v_status := 'review';
      v_reason := 'the completed order has no stored quote';
    elsif v_order.claimed_at is not null then
      if v_actual_owner_id is distinct from 'guest'
        or v_order.plan is distinct from v_actual_plan
        or v_order.amount_cents is distinct from p_actual_amount_cents
        or v_order.currency is distinct from v_actual_currency then
        v_status := 'review';
        v_reason := 'the completed order does not match the quote claimed by an account';
      else
        v_status := 'settled';
        v_reason := 'the completed order matches the quote claimed by an account';
      end if;
    elsif v_order.owner_id is distinct from v_actual_owner_id
      or v_order.plan is distinct from v_actual_plan
      or v_order.amount_cents is distinct from p_actual_amount_cents
      or v_order.currency is distinct from v_actual_currency then
      v_status := 'review';
      v_reason := 'the completed order does not match its stored quote';
    else
      v_status := 'settled';
      v_reason := 'the completed order matches its stored quote';
    end if;
  end if;

  if v_new or v_previous_status = 'created' then
    update public.opera_paypal_orders
    set status = v_status,
        source = v_source,
        settled_at = coalesce(settled_at, now()),
        actual_owner_id = v_actual_owner_id,
        actual_plan = v_actual_plan,
        updated_at = now()
    where id = v_order.id;
  end if;

  if v_new or v_previous_status = 'created' then
    insert into public.opera_notification_log (
      order_id,
      transaction_status,
      status_code,
      gross_amount,
      signature_field,
      accepted,
      why,
      environment,
      user_agent
    ) values (
      v_order_id,
      'paid',
      '200',
      to_char(p_actual_amount_cents::numeric / 100, 'FM999999990.00'),
      v_source,
      true,
      left('PayPal ' || v_environment || ' settlement: ' || v_reason, 300),
      'paypal-' || v_environment,
      'navego-billing/paypal'
    )
    on conflict (environment, order_id)
      where accepted = true and transaction_status = 'paid' and environment like 'paypal-%'
      do nothing;
  end if;

  return jsonb_build_object('ok', true, 'status', v_status, 'orderId', v_order_id, 'reason', v_reason);
end $$;

revoke all on function public.opera_paypal_create_guest_order(text, text, text, text, integer, text) from public, anon, authenticated;
grant execute on function public.opera_paypal_create_guest_order(text, text, text, text, integer, text) to service_role;
revoke all on function public.opera_paypal_claim_order(text, text, text, text, integer, text) from public, anon;
grant execute on function public.opera_paypal_claim_order(text, text, text, text, integer, text) to authenticated;
revoke all on function public.opera_paypal_settle_order(text, text, text, text, integer, text, text) from public, anon, authenticated;
grant execute on function public.opera_paypal_settle_order(text, text, text, text, integer, text, text) to service_role;
