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
