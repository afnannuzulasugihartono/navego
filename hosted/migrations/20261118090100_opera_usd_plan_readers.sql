-- USD plans for international buyers: the three plan readers learn the new names, the unlimited tiers, and the firm-shaped ones.
-- WHY the readers sit in one file: they are the contract a paired device and the dashboard ask about the same account, and they must not disagree about a quota when the midnight clock crosses a plan boundary.
-- WHY null means unlimited: usd-33 promises no daily cap, and "no cap" reads faster as null than as a billion.
-- The daily count adds two terms: rows in opera_commands (the hosted surface) and rows in opera_usage_reports (the local surface, reported at session end).

create or replace function public.opera_my_plan()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_plan text; v_status text; v_expires timestamptz;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'Not signed in.'); end if;
  select plan, status, expires_at into v_plan, v_status, v_expires from public.opera_account_plans where user_id = v_uid;
  if not found then
    v_plan := 'plan.usd-1';
    v_status := 'active';
    v_expires := null;
  elsif v_expires is not null and v_expires <= now() then
    v_plan := 'plan.usd-1';
    v_status := 'active';
    v_expires := null;
  end if;
  return jsonb_build_object(
    'ok', true,
    'plan', v_plan,
    'status', v_status,
    'expiresAt', v_expires,
    'dailyQuota', case v_plan
      when 'plan.usd-1' then 1000
      when 'plan.usd-3' then 3000
      when 'plan.usd-5' then 5000
      when 'plan.usd-7' then 7000
      when 'plan.usd-9' then 9000
      when 'plan.usd-17' then 17000
      when 'plan.usd-33' then null
      else 1000
    end,
    'usedToday', (
      select count(*)
      from public.opera_commands c
      join public.opera_devices d on d.id = c.device_id
      where d.user_id = v_uid
        and c.created_at >= date_trunc('day', now())
    ) + (
      select coalesce(sum(commands), 0)
      from public.opera_usage_reports
      where user_id = v_uid
        and created_at >= date_trunc('day', now())
    ),
    'sessionAllowance', case when v_plan in ('plan.usd-17', 'plan.usd-33') then 500 else 50 end,
    'rpm', null
  );
end $$;

revoke all on function public.opera_my_plan() from public, anon;
grant execute on function public.opera_my_plan() to authenticated, service_role;

create or replace function public.opera_device_plan(p_device_name text, p_token_hash text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_found boolean; v_uid uuid; v_plan text; v_status text; v_expires timestamptz;
begin
  select exists(
    select 1 from public.opera_devices
    where device_name = trim(p_device_name) and token_hash = p_token_hash and status <> 'disabled'
  ) into v_found;
  if not v_found then return jsonb_build_object('ok', false, 'error', 'Unauthorized device.'); end if;
  select user_id into v_uid from public.opera_devices
    where device_name = trim(p_device_name) and token_hash = p_token_hash and status <> 'disabled';
  if v_uid is null then
    return jsonb_build_object('ok', true, 'userId', null, 'plan', 'plan.usd-1', 'status', 'active', 'dailyQuota', 1000, 'usedToday', 0, 'rpm', null, 'sessionAllowance', 50);
  end if;
  select plan, status, expires_at into v_plan, v_status, v_expires from public.opera_account_plans where user_id = v_uid;
  if not found then
    v_plan := 'plan.usd-1';
    v_status := 'active';
    v_expires := null;
  elsif v_expires is not null and v_expires <= now() then
    v_plan := 'plan.usd-1';
    v_status := 'active';
    v_expires := null;
  end if;
  return jsonb_build_object(
    'ok', true,
    'userId', v_uid,
    'plan', v_plan,
    'status', v_status,
    'expiresAt', v_expires,
    'dailyQuota', case v_plan
      when 'plan.usd-1' then 1000
      when 'plan.usd-3' then 3000
      when 'plan.usd-5' then 5000
      when 'plan.usd-7' then 7000
      when 'plan.usd-9' then 9000
      when 'plan.usd-17' then 17000
      when 'plan.usd-33' then null
      else 1000
    end,
    'usedToday', (
      select count(*)
      from public.opera_commands c
      join public.opera_devices d on d.id = c.device_id
      where d.user_id = v_uid
        and c.created_at >= date_trunc('day', now())
    )::integer
    + (
      select coalesce(sum(commands), 0)
      from public.opera_usage_reports
      where user_id = v_uid
        and created_at >= date_trunc('day', now())
    )::integer,
    'rpm', null,
    'sessionAllowance', case when v_plan in ('plan.usd-17', 'plan.usd-33') then 500 else 50 end
  );
end $$;

revoke all on function public.opera_device_plan(text, text) from public, anon, authenticated;
grant execute on function public.opera_device_plan(text, text) to service_role;

create or replace function public.opera_device_session_open(p_device_name text, p_token_hash text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_found boolean; v_uid uuid; v_device_id uuid; v_plan text; v_status text; v_expires timestamptz;
  v_quota integer; v_used bigint; v_allowance bigint;
begin
  select exists(
    select 1 from public.opera_devices
    where device_name = trim(p_device_name) and token_hash = p_token_hash and status <> 'disabled'
  ) into v_found;
  if not v_found then return jsonb_build_object('ok', false, 'error', 'Unauthorized device.'); end if;

  select user_id, id into v_uid, v_device_id from public.opera_devices
    where device_name = trim(p_device_name) and token_hash = p_token_hash and status <> 'disabled';

  if v_uid is null then
    return jsonb_build_object(
      'ok', true, 'userId', null, 'plan', 'plan.usd-1', 'status', 'active',
      'dailyQuota', 1000, 'usedToday', 0, 'sessionAllowance', 50, 'rpm', null);
  end if;

  select plan, status, expires_at into v_plan, v_status, v_expires from public.opera_account_plans where user_id = v_uid;
  if not found then
    v_plan := 'plan.usd-1';
    v_status := 'active';
    v_expires := null;
  elsif v_expires is not null and v_expires <= now() then
    v_plan := 'plan.usd-1';
    v_status := 'active';
    v_expires := null;
  end if;
  v_quota := case v_plan
    when 'plan.usd-1' then 1000
    when 'plan.usd-3' then 3000
    when 'plan.usd-5' then 5000
    when 'plan.usd-7' then 7000
    when 'plan.usd-9' then 9000
    when 'plan.usd-17' then 17000
    else null
  end;
  v_used := (
    select count(*)
    from public.opera_commands c
    join public.opera_devices d on d.id = c.device_id
    where d.user_id = v_uid
      and c.created_at >= date_trunc('day', now())
  ) + (
    select coalesce(sum(commands), 0)
    from public.opera_usage_reports
    where user_id = v_uid
      and created_at >= date_trunc('day', now())
  );

  if v_status <> 'active' then
    return jsonb_build_object(
      'ok', false, 'plan', v_plan,
      'message', format('plan %s is not active for this account', v_plan));
  end if;
  if v_quota is not null and v_used >= v_quota then
    return jsonb_build_object(
      'ok', false, 'plan', v_plan, 'dailyQuota', v_quota, 'usedToday', v_used,
      'message', format('today''s quota of %s commands for %s is used; resets tomorrow', v_quota, v_plan));
  end if;

  v_allowance := case when v_quota is null then 500 else least(case when v_plan in ('plan.usd-17') then 500 else 50 end, v_quota - v_used) end;
  return jsonb_build_object(
    'ok', true, 'userId', v_uid, 'plan', v_plan, 'status', v_status,
    'dailyQuota', v_quota, 'usedToday', v_used, 'sessionAllowance', v_allowance, 'rpm', null);
end $$;

revoke all on function public.opera_device_session_open(text, text) from public, anon, authenticated;
grant execute on function public.opera_device_session_open(text, text) to service_role;
