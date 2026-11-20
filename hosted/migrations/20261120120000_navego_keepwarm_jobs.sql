-- The keepwarm jobs still carried the predecessor product's names and pointed at its endpoints.

-- opera-keepwarm-mcp called opera-agent-mcp, which was deleted with the hosted MCP surface on 2026-11-14, so the job failed every two minutes against a function that is not there.
-- opera-keepwarm-bridge called opera-agent-bridge, which was renamed to navego-bridge; the old slug still answers because the platform keeps an old deployment, so the job warmed a build nobody ships.

-- The mcp job is unscheduled: there is no hosted MCP to warm.
-- The bridge job is repointed at navego-bridge and renamed, so the edge isolate stays warm for the road that exists.

do $$
declare
  jid bigint;
begin
  for jid in select jobid from cron.job where jobname in ('opera-keepwarm-mcp', 'opera-keepwarm-bridge') loop
    perform cron.unschedule(jid);
  end loop;
end
$$;

select cron.schedule(
  'navego-keepwarm-bridge',
  '*/2 * * * *',
  $$SELECT net.http_post('https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/navego-bridge', '{"action":"heartbeat","token":"","deviceName":""}'::jsonb, '{}'::jsonb, '{"Content-Type": "application/json", "x-region": "ap-southeast-1"}'::jsonb, 8000);$$
);

-- The QRIS detector called the predecessor product's billing endpoint.
-- The platform still answers that slug from an old deployment, so the detector ran against a build nobody ships; it now calls the billing function that is deployed.

create or replace function public.opera_qris_detect_cron()
returns jsonb
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_token text;
  v_request_id bigint;
begin
  select decrypted_secret into v_token from vault.decrypted_secrets where name = 'opera_billing_token' limit 1;
  if v_token is null or v_token = '' then
    return jsonb_build_object('ok', false, 'why', 'opera_billing_token is not in vault');
  end if;
  v_request_id := net.http_post(
    url := 'https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/navego-billing',
    headers := jsonb_build_object('content-type', 'application/json', 'authorization', 'Bearer ' || v_token),
    body := jsonb_build_object('action', 'qris-detect')
  );
  return jsonb_build_object('ok', true, 'request_id', v_request_id);
end $$;

revoke all on function public.opera_qris_detect_cron() from public, anon, authenticated;
grant execute on function public.opera_qris_detect_cron() to service_role;
