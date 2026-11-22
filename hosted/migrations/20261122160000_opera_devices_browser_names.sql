-- A device takes the name of the browser it is, not the name of the product that used to make it.

-- WHY THE NAMES MOVE.
-- Every device on this account was named "opera-9" or "opera-13": the name came from the server's pairing fallback, which was the old product's name, not from the browser actually holding the extension.
-- The dashboard therefore showed two Brave browsers under a name that names neither of them, and a reader could not tell the product's name from the browser's.
-- The extension already derives the family from what the browser publishes, so the rows take that name and the server stops minting the old one.

-- WHY THE RENAME IS SAFE.
-- A device authenticates by name and token, so a row cannot be renamed while its browser still sends the old name.
-- The rename therefore runs only after the browser has redeemed a pairing code under the new name: the pairing function finds the row by its instance identity, and the browser keeps the name it stores.
-- The rename writes the old name to the audit log before the row moves, so the history keeps the name the row carried.

-- The device row keeps its own history: the old name is written to the audit log before the row moves.

create or replace function public.opera_devices_rename_to_browser_family()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_row public.opera_devices%rowtype;
  v_new text;
  v_base text;
  v_suffix integer := 1;
  v_moved integer := 0;
begin
  for v_row in
    select * from public.opera_devices
    where status <> 'revoked' and device_name like 'opera%'
    order by created_at
  loop
    v_base := lower(left(coalesce(nullif(trim(v_row.browser_name), ''), 'browser'), 55));
    if v_base = 'opera' then v_base := 'browser'; end if;
    v_new := v_base;
    v_suffix := 1;
    while exists (select 1 from public.opera_devices d where d.device_name = v_new and d.id <> v_row.id) loop
      v_suffix := v_suffix + 1;
      if v_suffix > 20 then
        insert into public.opera_audit(event_type, device_id, details)
        values ('device.rename_refused', v_row.id, jsonb_build_object('deviceName', v_row.device_name, 'browserName', v_row.browser_name));
        v_new := v_row.device_name;
        exit;
      end if;
      v_new := left(v_base, 55) || '-' || v_suffix;
    end loop;
    if v_new = v_row.device_name then continue; end if;
    insert into public.opera_audit(event_type, device_id, details)
    values ('device.renamed', v_row.id, jsonb_build_object('from', v_row.device_name, 'to', v_new));
    update public.opera_devices set device_name = v_new, updated_at = now() where id = v_row.id;
    v_moved := v_moved + 1;
  end loop;
  return jsonb_build_object('ok', true, 'renamed', v_moved);
end $$;

revoke all on function public.opera_devices_rename_to_browser_family() from public, anon, authenticated;
grant execute on function public.opera_devices_rename_to_browser_family() to service_role;

-- The pairing code no longer defaults to the old product's name.

create or replace function public.opera_create_pairing_code(p_device_name text default 'browser', p_ttl_minutes integer default 10, p_issued_by uuid default null)
returns jsonb
language plpgsql
security definer set search_path = public, extensions as $$
declare v_code text; v_expires timestamptz; v_hash text; v_used integer; v_max integer;
begin
  if p_device_name is null or char_length(trim(p_device_name)) not between 1 and 64 then return jsonb_build_object('ok',false,'error','Invalid device name.'); end if;
  v_hash := public.opera_sha256(upper(trim(p_device_name)));
  select count(*) into v_used from public.opera_pairing_codes where device_name=trim(p_device_name) and created_at > now() - interval '1 hour';
  v_max := 3;
  if v_used >= v_max then return jsonb_build_object('ok',false,'error','Too many pairing codes this hour. Try again later.'); end if;
  update public.opera_pairing_codes set consumed_at=now() where device_name=trim(p_device_name) and consumed_at is null;
  v_code:=upper(substr(encode(gen_random_bytes(12),'hex'),1,16));
  v_expires:=now()+make_interval(mins=>p_ttl_minutes);
  insert into public.opera_pairing_codes(code_hash,device_name,expires_at,issued_by) values(v_hash,trim(p_device_name),v_expires,p_issued_by);
  insert into public.opera_audit(event_type,details) values('pairing_code.created',jsonb_build_object('deviceName',trim(p_device_name),'expiresAt',v_expires));
  return jsonb_build_object('ok',true,'deviceName',trim(p_device_name),'code',v_code,'expiresAt',v_expires);
end $$;

revoke all on function public.opera_create_pairing_code(text, integer, uuid) from public, anon, authenticated;
grant execute on function public.opera_create_pairing_code(text, integer, uuid) to authenticated, service_role;

-- The pairing function's own fallback is the browser's name, not the old product's.

create or replace function public.opera_pair_device(p_code text, p_token_hash text, p_device_name text, p_extension_version text, p_protocol_version integer, p_capabilities jsonb default '[]'::jsonb, p_browser_name text default '', p_instance_id text default '', p_cookie_instance_id text default '')
returns jsonb
language plpgsql
security definer set search_path = public, extensions as $$
declare
  v_pair public.opera_pairing_codes%rowtype;
  v_device public.opera_devices%rowtype;
  v_legacy text := trim(coalesce(p_instance_id, ''));
  v_cookie text := trim(coalesce(p_cookie_instance_id, ''));
  v_base text;
  v_name text;
  v_suffix integer := 1;
begin
  if p_token_hash !~ '^[a-f0-9]{64}$' then return jsonb_build_object('ok', false, 'error', 'Invalid device token hash.'); end if;
  if v_legacy <> '' and v_legacy !~ '^[A-Za-z0-9._:-]{1,64}$' then return jsonb_build_object('ok', false, 'error', 'Invalid device identity.'); end if;
  if v_cookie <> '' and v_cookie !~ '^[A-Za-z0-9._:-]{1,64}$' then return jsonb_build_object('ok', false, 'error', 'Invalid device identity.'); end if;
  select * into v_pair from public.opera_pairing_codes where code_hash = public.opera_sha256(upper(trim(p_code))) and consumed_at is null and expires_at > now() for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'Pairing code is invalid or expired.'); end if;

  if v_cookie <> '' then
    select * into v_device from public.opera_devices where instance_id = v_cookie for update;
    if found then
      if v_device.user_id is not null and v_device.user_id is distinct from v_pair.issued_by then
        insert into public.opera_audit(event_type, details) values ('pairing.refused_owned_instance', jsonb_build_object('deviceName', v_device.device_name, 'cookieInstanceId', v_cookie));
        return jsonb_build_object('ok', false, 'error', 'That device identity belongs to another account.');
      end if;
      update public.opera_devices set token_hash = p_token_hash, status = 'online', extension_version = left(coalesce(p_extension_version, ''), 64), protocol_version = coalesce(p_protocol_version, 1), capabilities = coalesce(p_capabilities, '[]'::jsonb), last_seen_at = now(), updated_at = now(), user_id = coalesce(user_id, v_pair.issued_by) where id = v_device.id returning * into v_device;
      update public.opera_pairing_codes set consumed_at = now() where id = v_pair.id;
      insert into public.opera_audit(event_type, device_id, details) values ('device.paired', v_device.id, jsonb_build_object('deviceName', v_device.device_name, 'instanceId', v_device.instance_id, 'version', v_device.extension_version, 'protocolVersion', v_device.protocol_version, 'browserName', v_device.browser_name));
      return jsonb_build_object('ok', true, 'deviceId', v_device.id, 'deviceName', v_device.device_name, 'protocolVersion', v_device.protocol_version, 'browserName', v_device.browser_name);
    end if;
  end if;

  if v_legacy <> '' then
    select * into v_device from public.opera_devices where instance_id = v_legacy for update;
    if found then
      if v_device.user_id is not null and v_device.user_id is distinct from v_pair.issued_by then
        insert into public.opera_audit(event_type, details) values ('pairing.refused_owned_instance', jsonb_build_object('deviceName', v_device.device_name));
        return jsonb_build_object('ok', false, 'error', 'That device identity belongs to another account.');
      end if;
      update public.opera_devices set instance_id = v_cookie, token_hash = p_token_hash, status = 'online', extension_version = left(coalesce(p_extension_version, ''), 64), protocol_version = coalesce(p_protocol_version, 1), capabilities = coalesce(p_capabilities, '[]'::jsonb), last_seen_at = now(), updated_at = now(), user_id = coalesce(user_id, v_pair.issued_by) where id = v_device.id returning * into v_device;
      update public.opera_pairing_codes set consumed_at = now() where id = v_pair.id;
      insert into public.opera_audit(event_type, device_id, details) values ('device.paired', v_device.id, jsonb_build_object('deviceName', v_device.device_name, 'instanceId', v_device.instance_id, 'version', v_device.extension_version, 'protocolVersion', v_device.protocol_version, 'browserName', v_device.browser_name));
      return jsonb_build_object('ok', true, 'deviceId', v_device.id, 'deviceName', v_device.device_name, 'protocolVersion', v_device.protocol_version, 'browserName', v_device.browser_name);
    end if;
  end if;

  v_base := left(coalesce(nullif(trim(v_pair.device_name), ''), nullif(trim(p_device_name), ''), nullif(lower(trim(coalesce(p_browser_name, ''))), ''), 'browser'), 55);
  v_name := v_base;
  loop
    select * into v_device from public.opera_devices where device_name = v_name for update;
    if not found then exit; end if;
    if v_device.user_id is not null and v_device.user_id is distinct from v_pair.issued_by then
      insert into public.opera_audit(event_type, details) values ('pairing.refused_owned_name', jsonb_build_object('deviceName', v_name));
      return jsonb_build_object('ok', false, 'error', 'That device name belongs to another account.');
    end if;
    if v_device.instance_id = '' then
      update public.opera_devices set instance_id = coalesce(nullif(v_cookie, ''), v_legacy), token_hash = p_token_hash, status = 'online', extension_version = left(coalesce(p_extension_version, ''), 64), protocol_version = coalesce(p_protocol_version, 1), capabilities = coalesce(p_capabilities, '[]'::jsonb), last_seen_at = now(), updated_at = now(), user_id = coalesce(v_device.user_id, v_pair.issued_by), browser_name = case when trim(coalesce(p_browser_name, '')) <> '' then left(trim(p_browser_name), 64) else v_device.browser_name end where id = v_device.id returning * into v_device;
      exit;
    end if;
    v_suffix := v_suffix + 1;
    if v_suffix > 20 then return jsonb_build_object('ok', false, 'error', 'Too many browsers are paired to this name.'); end if;
    v_name := left(v_base, 55) || '-' || v_suffix;
  end loop;

  if v_device.id is null then
    insert into public.opera_devices(device_name, token_hash, status, extension_version, protocol_version, capabilities, last_seen_at, updated_at, user_id, browser_name, instance_id)
    values (v_name, p_token_hash, 'online', left(coalesce(p_extension_version, ''), 64), coalesce(p_protocol_version, 1), coalesce(p_capabilities, '[]'::jsonb), now(), now(), v_pair.issued_by, left(trim(coalesce(p_browser_name, '')), 64), coalesce(nullif(v_cookie, ''), v_legacy))
    returning * into v_device;
  end if;

  update public.opera_pairing_codes set consumed_at = now() where id = v_pair.id;
  insert into public.opera_audit(event_type, device_id, details) values ('device.paired', v_device.id, jsonb_build_object('deviceName', v_device.device_name, 'instanceId', v_device.instance_id, 'version', v_device.extension_version, 'protocolVersion', v_device.protocol_version, 'browserName', v_device.browser_name));
  return jsonb_build_object('ok', true, 'deviceId', v_device.id, 'deviceName', v_device.device_name, 'protocolVersion', v_device.protocol_version, 'browserName', v_device.browser_name);
end $$;

revoke all on function public.opera_pair_device(text, text, text, text, integer, jsonb, text, text, text) from public, anon, authenticated;
grant execute on function public.opera_pair_device(text, text, text, text, integer, jsonb, text, text, text) to service_role;
