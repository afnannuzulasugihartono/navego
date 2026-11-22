-- The dashboard's "run one action" button must reach a device that is actually awake, and it must be allowed to wait for the answer.

-- WHY the device order changed: opera_run_on_my_device picked the owner's oldest device, so an account with a long device history always landed on a browser that had stopped checking in.
-- The dashboard then answered "Device is offline" while a healthy device was online seconds earlier.
-- The candidates are now ordered by the freshest heartbeat, and the oldest one is only the fallback when nothing has checked in, so the refusal still names a device instead of pretending the account has none.

-- WHY the statement timeout moved: this function waits for the device's answer, and the caller's role carried an eight-second statement timeout, so every call died with "canceling statement due to statement timeout" before a browser could answer.
-- The function now carries its own one-minute budget, which is longer than the 55-second await ceiling it can ask for.

create or replace function public.opera_run_on_my_device(
  p_method text,
  p_params jsonb default '{}'::jsonb,
  p_timeout_ms integer default null,
  p_request_id text default null
)
returns jsonb
language plpgsql security definer set search_path = public set statement_timeout = '60s' as $$
declare v_device public.opera_devices%rowtype; v_enqueue jsonb; v_command_id uuid; v_wait integer;
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
  v_command_id := (v_enqueue ->> 'commandId')::uuid;
  v_wait := least(greatest(coalesce(p_timeout_ms, 45000), 500), 55000);
  return public.opera_await(v_command_id, v_wait);
end $$;

grant execute on function public.opera_run_on_my_device(text, jsonb, integer, text) to authenticated;

revoke execute on function public.opera_run_on_my_device(text, jsonb, integer, text) from public, anon;
