-- The live surfaces that still carried the predecessor product's endpoints.

-- opera-keepwarm-mcp called opera-agent-mcp, which was deleted with the hosted MCP surface on 2026-11-14, so the job failed every two minutes against a function that is not there.
-- opera-keepwarm-bridge called opera-agent-bridge, which was renamed to navego-bridge; the old slug still answers because the platform keeps an old deployment, so the job warmed a build nobody ships.
-- The QRIS detector called opera-agent-billing, and the workflow starter called opera-agent-runner: both still answer from an old deployment, so both ran code nobody ships.

-- The mcp job is unscheduled: there is no hosted MCP to warm.
-- The bridge job is repointed at navego-bridge and renamed, so the edge isolate stays warm for the road that exists.
-- The detector and the starter are given the endpoints that are deployed, with the same secrets, the same bodies and the same answers.

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

create or replace function public.opera_start_workflow(
  p_name text,
  p_input jsonb default '{}'::jsonb,
  p_timeout_ms integer default 60000,
  p_device_name text default 'opera'
) returns jsonb
language plpgsql
security definer
set search_path=public,extensions,net
as $$
declare
  v_wf public.opera_workflows%rowtype;
  v_run public.opera_workflow_runs%rowtype;
  v_token text;
  v_timeout integer;
  v_request_id bigint;
begin
  select * into v_wf from public.opera_workflows where name=p_name and enabled=true;
  if not found then
    return jsonb_build_object('ok',false,'error',jsonb_build_object('code','WORKFLOW_NOT_FOUND','message','Workflow not found or disabled.'));
  end if;
  if not exists(select 1 from public.opera_devices where device_name=trim(p_device_name) and status<>'disabled') then
    return jsonb_build_object('ok',false,'error',jsonb_build_object('code','DEVICE_NOT_PAIRED','message','Device is not paired.'));
  end if;
  v_timeout:=least(greatest(coalesce(p_timeout_ms,60000),1000),120000);
  v_token:=encode(gen_random_bytes(24),'hex');
  insert into public.opera_workflow_runs(
    workflow_name,workflow_version,device_name,input,definition,context,status,timeout_ms,trigger_hash
  ) values (
    v_wf.name,v_wf.version,trim(p_device_name),coalesce(p_input,'{}'::jsonb),v_wf.definition,
    jsonb_build_object('input',coalesce(p_input,'{}'::jsonb),'vars','{}'::jsonb,'steps','{}'::jsonb),
    'queued',v_timeout,public.opera_sha256(v_token)
  ) returning * into v_run;

  select net.http_post(
    url := 'https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/navego-runner',
    body := jsonb_build_object('runId',v_run.id,'token',v_token),
    headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 5000
  ) into v_request_id;

  insert into public.opera_audit(event_type,workflow_name,details)
  values('workflow.started',v_wf.name,jsonb_build_object('runId',v_run.id,'version',v_wf.version,'requestId',v_request_id,'timeoutMs',v_timeout));

  return jsonb_build_object('ok',true,'runId',v_run.id,'status','queued','workflow',v_wf.name,'version',v_wf.version,'requestId',v_request_id);
end $$;
