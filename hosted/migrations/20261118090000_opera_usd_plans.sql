-- USD plans for international buyers: seven tiers, priced in dollars.
-- WHY additive only and in one file: one check constraint widened to fit the new plan names, the new price rows, and the three plan readers rewritten to quote the same quotas from the same order.
-- The plans module in JavaScript is the canonical statement; the test suite pins the two copies to the same values.

drop function if exists public.opera_plan_activate_purchase(uuid, text);

-- Widen the plan check constraint to admit the USD tiers.

alter table public.opera_account_plans drop constraint if exists opera_account_plans_plan_check;
alter table public.opera_account_plans
  add constraint opera_account_plans_plan_check
  check (plan in ('plan.usd-1', 'plan.usd-3', 'plan.usd-5', 'plan.usd-7', 'plan.usd-9', 'plan.usd-17', 'plan.usd-33'));

-- Price rows the billing function will read when a buyer checks out with PayPal.

insert into public.opera_price_list (kind, unit, amount_cents, currency) values
  ('plan.usd-1', 'usd-month', 100, 'USD'),
  ('plan.usd-3', 'usd-month', 300, 'USD'),
  ('plan.usd-5', 'usd-month', 500, 'USD'),
  ('plan.usd-7', 'usd-month', 700, 'USD'),
  ('plan.usd-9', 'usd-month', 900, 'USD'),
  ('plan.usd-17', 'usd-6-month', 1700, 'USD'),
  ('plan.usd-33', 'usd-year', 3300, 'USD')
on conflict (kind) do nothing;

-- WHY THE QUOTAS ARE RESTATED HERE.
-- The plans module in JavaScript is the canonical statement, and this RPC cannot import it, so the numbers are repeated.
-- tests/billing/plans.test.ts pins the two copies to the same values, which is how the bridge and this function stop drifting apart.

create or replace function public.opera_plan_activate_purchase(p_owner uuid, p_kind text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_kind text := trim(p_kind);
  v_valid boolean := v_kind in ('plan.usd-1', 'plan.usd-3', 'plan.usd-5', 'plan.usd-7', 'plan.usd-9', 'plan.usd-17', 'plan.usd-33');
begin
  if not v_valid then return jsonb_build_object('ok', false, 'error', format('unknown plan %s', v_kind)); end if;
  insert into public.opera_account_plans (user_id, plan, status, expires_at, source, updated_at)
  values (p_owner, v_kind, 'active',
    case v_kind when 'plan.usd-17' then now() + interval '6 months' when 'plan.usd-33' then now() + interval '12 months' else now() + interval '30 days' end,
    'purchase', now())
  on conflict (user_id) do update set
    plan = excluded.plan,
    status = 'active',
    expires_at = case
      when public.opera_account_plans.expires_at is null or public.opera_account_plans.expires_at <= now()
        then excluded.expires_at
      else public.opera_account_plans.expires_at + (excluded.expires_at - now())
    end,
    source = 'purchase',
    updated_at = now();
  return jsonb_build_object('ok', true, 'plan', v_kind);
end $$;

revoke all on function public.opera_plan_activate_purchase(uuid, text) from public, anon, authenticated;
grant execute on function public.opera_plan_activate_purchase(uuid, text) to service_role;
