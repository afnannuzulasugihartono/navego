-- A pairing code is random, and code_hash is the hash of that code, never the hash of the device name.
-- decisions.json -> hosted-pairing-code-01

-- 20261122160000_opera_devices_browser_names.sql replaced this whole function to change only its default name.
-- That replacement hashed upper(trim(p_device_name)) into code_hash: the second code for one name violated opera_pairing_codes_code_hash_key, and opera_pair_device could never redeem the code because it hashes the code.
-- The issuer-first rate limit and the ownership fence from 20261007030000 are restored verbatim with the browser default.

create or replace function public.opera_create_pairing_code(p_device_name text default 'browser', p_ttl_minutes integer default 10, p_issued_by uuid default null)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare v_code text; v_expires timestamptz; v_issuer uuid; v_recent integer; v_name text;
begin
  if p_device_name is null or char_length(trim(p_device_name)) not between 1 and 64 then return jsonb_build_object('ok', false, 'error', 'Invalid device name.'); end if;
  v_name := trim(p_device_name);
  p_ttl_minutes := least(greatest(coalesce(p_ttl_minutes, 10), 1), 60);
  v_issuer := case when auth.uid() is not null then auth.uid() else p_issued_by end;
  if exists (select 1 from public.opera_devices where device_name = v_name and user_id is not null and user_id is distinct from v_issuer) then
    insert into public.opera_audit(event_type, details) values ('pairing_code.name_taken', jsonb_build_object('issuer', v_issuer));
    return jsonb_build_object('ok', false, 'error', 'That device name belongs to another account.');
  end if;
  if v_issuer is not null then
    select count(*) into v_recent
    from public.opera_pairing_codes
    where issued_by = v_issuer and created_at > now() - interval '1 hour';
    if v_recent >= 5 then
      insert into public.opera_audit(event_type, details) values ('pairing_code.rate_limited', jsonb_build_object('issuer', v_issuer, 'recent', v_recent));
      return jsonb_build_object('ok', false, 'error', 'Too many pairing codes this hour. Try again later.');
    end if;
  end if;
  update public.opera_pairing_codes set consumed_at = now() where device_name = v_name and issued_by is not distinct from v_issuer and consumed_at is null;
  v_code := upper(substr(encode(gen_random_bytes(12), 'hex'), 1, 16));
  v_expires := now() + make_interval(mins => p_ttl_minutes);
  insert into public.opera_pairing_codes(code_hash, device_name, expires_at, issued_by)
  values (public.opera_sha256(v_code), v_name, v_expires, v_issuer);
  insert into public.opera_audit(event_type, details) values ('pairing_code.created', jsonb_build_object('deviceName', v_name));
  return jsonb_build_object('ok', true, 'deviceName', v_name, 'code', v_code, 'expiresAt', v_expires);
end $$;

grant execute on function public.opera_create_pairing_code(text, integer, uuid) to authenticated;
revoke execute on function public.opera_create_pairing_code(text, integer, uuid) from public, anon;
