-- The funnel counts a press and a copy as two steps, and the operator's read must tell a probe from a person.
-- decisions.json -> site-funnel-steps-01

-- A PRESS IS A STEP OF ITS OWN.
-- The row named install.click counted a copy of the command, so a zero under the install row read as "nobody pressed install" while the copy event fired instead.
-- The closed name list keeps every name it has and gains install.press next to install.click, so one browser reports one of each and a zero under the press row means presses and not copies.

-- THE SUMMARY CARRIES THE SPLIT.
-- The browsers that walked two paths in bursts and the agent's own drives landed in the same rows as anyone's, so the read needs to say which rows were an automated drive.
-- The rows per name and per day do not move, so the dashboard's existing read keeps working, and a row with no probe key is a person.

create or replace function public.opera_funnel_record(
  p_name text,
  p_path text default null,
  p_anon text default null,
  p_meta jsonb default '{}'::jsonb
)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_name text; v_path text; v_anon text;
begin
  v_name := lower(trim(coalesce(p_name, '')));
  if v_name not in (
    'page.view', 'install.view', 'install.click', 'install.press', 'plan.view', 'buy.click',
    'signin.start', 'signin.ok', 'pair.view', 'pair.start', 'pair.ok', 'pair.fail',
    'command.first', 'download.npm'
  ) then
    return;
  end if;
  v_path := left(nullif(trim(coalesce(p_path, '')), ''), 200);
  v_anon := left(nullif(trim(coalesce(p_anon, '')), ''), 64);
  if exists (
    select 1 from public.opera_funnel_events
    where name = v_name and anon_id is not distinct from v_anon and path is not distinct from v_path
      and created_at > now() - interval '5 seconds'
  ) then
    return;
  end if;
  insert into public.opera_funnel_events(name, path, anon_id, user_id, meta)
  values (v_name, v_path, v_anon, auth.uid(), coalesce(p_meta, '{}'::jsonb));
end;
$$;

revoke all on function public.opera_funnel_record(text, text, text, jsonb) from public;
grant execute on function public.opera_funnel_record(text, text, text, jsonb) to anon, authenticated;

-- The counts per name and per day stay where they were, so the dashboard reads the numbers it read yesterday.
-- probe_events counts the rows whose meta says the visit was an automated drive, and probe_browsers counts the browsers behind those rows.

create or replace function public.opera_funnel_summary(p_days integer default 30)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_days integer; v_steps jsonb; v_totals jsonb; v_first timestamptz; v_last timestamptz;
begin
  if not exists (select 1 from public.opera_operator where user_id = auth.uid()) then
    return jsonb_build_object('ok', false, 'error', 'Only the operator account may read the funnel.');
  end if;
  v_days := least(greatest(coalesce(p_days, 30), 1), 365);
  select
    coalesce(jsonb_agg(row_to_json(step) order by step.name, step.day desc), '[]'::jsonb)
  into v_steps
  from (
    select name,
           to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day,
           count(*)::int as events,
           count(distinct anon_id)::int as browsers,
           (count(*) filter (where meta->>'probe' = 'true'))::int as probe_events,
           (count(distinct anon_id) filter (where meta->>'probe' = 'true'))::int as probe_browsers
    from public.opera_funnel_events
    where created_at > now() - make_interval(days => v_days)
    group by 1, 2
  ) step;
  select coalesce(jsonb_agg(row_to_json(total) order by total.name), '[]'::jsonb)
  into v_totals
  from (
    select name,
           count(*)::int as events,
           count(distinct anon_id)::int as browsers,
           count(distinct user_id)::int as accounts,
           (count(*) filter (where meta->>'probe' = 'true'))::int as probe_events,
           (count(distinct anon_id) filter (where meta->>'probe' = 'true'))::int as probe_browsers
    from public.opera_funnel_events
    where created_at > now() - make_interval(days => v_days)
    group by 1
  ) total;
  select min(created_at), max(created_at) into v_first, v_last
  from public.opera_funnel_events where created_at > now() - make_interval(days => v_days);
  return jsonb_build_object('ok', true, 'days', v_days, 'totals', v_totals, 'steps', v_steps, 'first', v_first, 'last', v_last);
end;
$$;

revoke all on function public.opera_funnel_summary(integer) from public;
grant execute on function public.opera_funnel_summary(integer) to authenticated;
