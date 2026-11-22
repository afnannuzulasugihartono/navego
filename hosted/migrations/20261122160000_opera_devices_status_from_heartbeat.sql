-- Derive the device status the account sees from the heartbeat, not from a stored column nothing maintains.

-- WHY THE READER DERIVES IT.
-- The stored status column was written to 'online' by the heartbeat and never written back down, so a browser that stopped checking in days ago still answered 'online'.
-- The dashboard then counted it as live, and the count on the account's own home page was false.
-- The heartbeat is the fact; the liveness is a reading of that fact, so the reading happens where the reader is: in opera_my_devices.

-- WHY NINETY SECONDS.
-- The window is the one the server already uses when it verifies a device before running a command on it (opera_verify_device and opera_run_on_my_device).
-- A device the server would refuse to drive is a device the account must see as offline, so both readers answer from the same threshold.

-- WHY THE STORED COLUMN STAYS.
-- Other functions read the column to decide whether a device may authenticate or be driven at all ('disabled' is a refusal, 'revoked' is a death).
-- This migration changes what a reader sees; it does not change what the column means.

create or replace function public.opera_my_devices()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'Not signed in.'); end if;
  return jsonb_build_object('ok', true, 'devices', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', d.id, 'name', d.device_name,
      'status', case
        when d.status = 'disabled' then 'disabled'
        when d.last_seen_at is null then 'offline'
        when d.last_seen_at > now() - interval '90 seconds' then 'online'
        else 'offline'
      end,
      'browserName', d.browser_name,
      'extensionVersion', d.extension_version, 'lastSeenAt', d.last_seen_at,
      'totalCommands', (select count(*) from public.opera_commands where device_id = d.id),
      'completedCommands', (select count(*) from public.opera_commands where device_id = d.id and status = 'completed'),
      'commands', coalesce((
        select jsonb_agg(jsonb_build_object(
          'method', c.method, 'status', c.status, 'provider', c.provider,
          'createdAt', c.created_at, 'completedAt', c.completed_at
        ) order by c.created_at desc)
        from (select * from public.opera_commands where device_id = d.id order by created_at desc limit 10) c
      ), '[]'::jsonb)
    ) order by d.created_at)
    from public.opera_devices d where d.user_id = v_uid and d.status <> 'revoked'
  ), '[]'::jsonb));
end $$;

revoke all on function public.opera_my_devices() from public;
grant execute on function public.opera_my_devices() to authenticated, service_role;
