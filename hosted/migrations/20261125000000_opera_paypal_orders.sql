-- One PayPal order is one quote, one settlement, and one plan activation.
-- The quote is stored when PayPal creates the order, the settlement compares the completed order with that quote, and the database claims the order before a plan changes.
-- The buyer can return from PayPal while the verified webhook arrives; both paths must still leave one sale and one activation.

create table if not exists public.opera_paypal_orders (
  id bigint generated always as identity primary key,
  environment text not null,
  order_id text not null,
  owner_id text,
  plan text,
  amount_cents integer not null,
  currency text not null,
  status text not null default 'created',
  has_quote boolean not null default false,
  source text,
  settled_at timestamptz,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint opera_paypal_orders_environment_check check (environment in ('live', 'sandbox')),
  constraint opera_paypal_orders_order_id_check check (char_length(order_id) between 1 and 128),
  constraint opera_paypal_orders_owner_id_check check (owner_id is null or owner_id ~ '^[0-9a-fA-F-]{36}$'),
  constraint opera_paypal_orders_plan_check check (plan is null or plan in ('plan.usd-1', 'plan.usd-3', 'plan.usd-5', 'plan.usd-7', 'plan.usd-9', 'plan.usd-17', 'plan.usd-33')),
  constraint opera_paypal_orders_amount_cents_check check (amount_cents > 0),
  constraint opera_paypal_orders_currency_check check (currency = 'USD'),
  constraint opera_paypal_orders_status_check check (status in ('created', 'settled', 'review', 'activated')),
  unique (environment, order_id)
);

alter table public.opera_paypal_orders enable row level security;
revoke all on public.opera_paypal_orders from public, anon, authenticated;
grant select, insert, update, delete on public.opera_paypal_orders to service_role;

comment on table public.opera_paypal_orders is 'One row per PayPal order: the quoted plan and amount, the completed settlement, and whether that order activated the plan.';

create or replace function public.opera_paypal_create_order(
  p_environment text,
  p_order_id text,
  p_owner_id text,
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
  v_owner_id text := lower(trim(p_owner_id));
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
  if v_owner_id is null or v_owner_id !~ '^[0-9a-fA-F-]{36}$' then
    return jsonb_build_object('ok', false, 'error', 'PayPal order owner is invalid');
  end if;
  if v_plan is null or v_plan not in ('plan.usd-1', 'plan.usd-3', 'plan.usd-5', 'plan.usd-7', 'plan.usd-9', 'plan.usd-17', 'plan.usd-33') then
    return jsonb_build_object('ok', false, 'error', 'unknown PayPal plan');
  end if;
  if p_amount_cents is null or p_amount_cents <= 0 or v_currency is null or v_currency <> 'USD' then
    return jsonb_build_object('ok', false, 'error', 'PayPal quote must be a positive USD amount');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_environment || ':' || p_order_id, 0));

  insert into public.opera_paypal_orders (environment, order_id, owner_id, plan, amount_cents, currency, status, has_quote, source)
  values (v_environment, v_order_id, v_owner_id, v_plan, p_amount_cents, v_currency, 'created', true, 'quote')
  on conflict (environment, order_id) do nothing;
  get diagnostics v_inserted = row_count;

  select * into v_existing
  from public.opera_paypal_orders
  where environment = v_environment and order_id = v_order_id;

  if v_existing.owner_id is distinct from v_owner_id
    or v_existing.plan is distinct from v_plan
    or v_existing.amount_cents is distinct from p_amount_cents
    or v_existing.currency is distinct from v_currency then
    return jsonb_build_object('ok', false, 'error', 'PayPal order id already carries another quote');
  end if;

  return jsonb_build_object('ok', true, 'created', v_inserted = 1, 'status', v_existing.status, 'orderId', v_order_id);
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
  if p_actual_amount_cents is null or p_actual_amount_cents <= 0 or v_actual_currency <> 'USD' then
    return jsonb_build_object('ok', false, 'error', 'PayPal settlement must be a positive USD amount');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_environment || ':' || p_order_id, 0));

  select * into v_order
  from public.opera_paypal_orders
  where environment = v_environment and order_id = v_order_id
  for update;

  if not found then
    v_new := true;
    insert into public.opera_paypal_orders (environment, order_id, owner_id, plan, amount_cents, currency, status, source, settled_at)
    values (v_environment, v_order_id, v_actual_owner_id, v_actual_plan, p_actual_amount_cents, v_actual_currency, 'review', v_source, now())
    on conflict (environment, order_id) do nothing;
    select * into v_order
    from public.opera_paypal_orders
    where environment = v_environment and order_id = v_order_id
    for update;
    v_status := 'review';
    v_reason := 'the completed order has no stored quote';
  elsif v_order.status = 'activated' then
    return jsonb_build_object('ok', true, 'status', 'activated', 'already', true, 'orderId', v_order_id);
  else
    if not v_order.has_quote then
      v_status := 'review';
      v_reason := 'the completed order has no stored quote';
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

  v_previous_status := v_order.status;
  if v_new or v_previous_status = 'created' then
    update public.opera_paypal_orders
    set status = v_status,
        source = v_source,
        settled_at = coalesce(settled_at, now()),
        updated_at = now()
    where id = v_order.id;

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
    );
  end if;

  return jsonb_build_object('ok', true, 'status', v_status, 'orderId', v_order_id, 'reason', v_reason);
end $$;

create or replace function public.opera_paypal_activate_order(
  p_environment text,
  p_order_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_environment text := lower(trim(p_environment));
  v_order_id text := trim(p_order_id);
  v_order public.opera_paypal_orders%rowtype;
  v_activation jsonb;
begin
  if v_environment is null or v_environment not in ('live', 'sandbox') then
    return jsonb_build_object('ok', false, 'error', 'unknown PayPal environment');
  end if;
  if v_order_id is null or v_order_id = '' then
    return jsonb_build_object('ok', false, 'error', 'PayPal order id is required');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_environment || ':' || p_order_id, 0));

  select * into v_order
  from public.opera_paypal_orders
  where environment = v_environment and order_id = v_order_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'PayPal order was not settled');
  end if;
  if v_order.status = 'activated' then
    return jsonb_build_object('ok', true, 'status', 'activated', 'already', true, 'orderId', v_order_id);
  end if;
  if v_order.status <> 'settled' then
    return jsonb_build_object('ok', false, 'status', v_order.status, 'error', 'PayPal order needs review before activation');
  end if;

  v_activation := public.opera_plan_activate_purchase(v_order.owner_id::uuid, v_order.plan);
  if coalesce((v_activation ->> 'ok')::boolean, false) = false then
    return jsonb_build_object('ok', false, 'status', v_order.status, 'error', coalesce(v_activation ->> 'error', 'plan activation failed'));
  end if;

  update public.opera_paypal_orders
  set status = 'activated',
      activated_at = now(),
      updated_at = now()
  where id = v_order.id;

  return jsonb_build_object('ok', true, 'status', 'activated', 'already', false, 'orderId', v_order_id, 'plan', v_order.plan);
end $$;

revoke all on function public.opera_paypal_create_order(text, text, text, text, integer, text) from public, anon, authenticated;
grant execute on function public.opera_paypal_create_order(text, text, text, text, integer, text) to service_role;
revoke all on function public.opera_paypal_settle_order(text, text, text, text, integer, text, text) from public, anon, authenticated;
grant execute on function public.opera_paypal_settle_order(text, text, text, text, integer, text, text) to service_role;
revoke all on function public.opera_paypal_activate_order(text, text) from public, anon, authenticated;
grant execute on function public.opera_paypal_activate_order(text, text) to service_role;
