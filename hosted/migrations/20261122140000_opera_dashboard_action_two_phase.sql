-- The dashboard's "run one action" button must reach a device that is actually awake, and it must be allowed to wait for the answer.

-- The enqueue and the wait cannot live in one function.
-- A SQL function runs inside one transaction, so the row the device is supposed to claim stays invisible to every other connection until the function returns, and the function returns only when its wait has already timed out.
-- The measured result was a command that expired unclaimed while the dashboard reported a timeout, on a browser that was awake and answering commands in about a tenth of a second.

-- The dashboard therefore asks for the command first and waits for the answer in a second call, and the two functions below are that pair.

-- The device order is the freshest heartbeat first, and the oldest one is only the fallback when nothing has checked in, so the refusal still names a device instead of pretending the account has none.

-- The wait reads a command only when it belongs to the caller's own account, so one account cannot wait on another account's command id.

create or replace function public.opera_start_on_my_device(
  p_method text,
  p_params jsonb default '{}'::jsonb,
  p_timeout_ms integer default null,
  p_request_id text default null
)
returns jsonb
language plpgsql security definer set search_path = public set statement_timeout = '10s' as $$
declare v_device public.opera_devices%rowtype; v_enqueue jsonb;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'error', 'Not signed in.'); end if;

  if not exists (select 1 from public.opera_methods where method = p_method and enabled) then
    return jsonb_build_object('ok', false, 'error', 'Unknown or disabled method.');
  end if;

  select * into v_device from public.opera_devices
  where user_id = auth.uid() and status <> 'disabled'
  order by (last_seen_at is not null and last_seen_at > now() - interval '90 seconds') desc,
           last_seen_at desc nulls last,
           created_at
  limit 1;
  if not found then return jsonb_build_object('ok', false, 'error', 'No paired device on this account.'); end if;

  if v_device.last_seen_at is null or v_device.last_seen_at < now() - interval '90 seconds' then
    return jsonb_build_object('ok', false, 'error', 'Device is offline. Open the extension so it can check in.');
  end if;

  v_enqueue := public.opera_enqueue(p_method, coalesce(p_params, '{}'::jsonb), p_timeout_ms, v_device.device_name, p_request_id);
  if not coalesce((v_enqueue ->> 'ok')::boolean, false) then return v_enqueue; end if;

  return v_enqueue || jsonb_build_object(
    'deviceName', v_device.device_name,
    'deferred', true,
    'next', 'opera_await_my_command'
  );
end $$;

create or replace function public.opera_await_my_command(
  p_command_id uuid,
  p_timeout_ms integer default null
)
returns jsonb
language plpgsql security definer set search_path = public set statement_timeout = '60s' as $$
declare v_wait integer; v_owned boolean;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'error', 'Not signed in.'); end if;

  select exists (
    select 1 from public.opera_commands c
    join public.opera_devices d on d.id = c.device_id
    where c.id = p_command_id and d.user_id = auth.uid()
  ) into v_owned;
  if not v_owned then return jsonb_build_object('ok', false, 'error', 'Command not found.'); end if;

  v_wait := least(greatest(coalesce(p_timeout_ms, 45000), 100), 55000);
  return public.opera_await(p_command_id, v_wait);
end $$;

alter function public.opera_await(uuid, integer) set statement_timeout = '60s';

drop function if exists public.opera_run_on_my_device(text, jsonb, integer, text);

grant execute on function public.opera_start_on_my_device(text, jsonb, integer, text) to authenticated;
grant execute on function public.opera_await_my_command(uuid, integer) to authenticated;

revoke execute on function public.opera_start_on_my_device(text, jsonb, integer, text) from public, anon;
revoke execute on function public.opera_await_my_command(uuid, integer) from public, anon;
