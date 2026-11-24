-- Six steps decide whether Navego has a product or a museum piece, and nothing measured them.
-- decisions.json -> opera-funnel-01

-- WHY A TABLE AND NOT AN ANALYTICS SCRIPT.
-- The question is not "how many people visited" but "at which step did the ones who visited stop": the download click, the sign-in, the pairing, the first command, the first payment.
-- A pageview script answers the first and none of the others, and it lives in somebody else's dashboard where it cannot be joined to a device row.
-- So the site writes the step itself, next to the account and the device it belongs to, and the dashboard reads it back.

-- THE VISITOR IS NAMED BY A RANDOM ID IN THE BROWSER, NOT BY A COOKIE FROM THE SERVER.
-- This site has no cookie banner and should not need one: a random id in localStorage counts the steps of one browser and cannot follow anybody to another site.
-- It carries no email, no IP and no user agent, and it is stamped with auth.uid() only when the same browser is already signed in.

-- THE WRITE IS AN RPC SO THE TABLE CAN STAY CLOSED.
-- An insert policy on the table would let any visitor read every other row back; a security definer function that only inserts lets the page report a step and read nothing.
-- The summary is a second function, and it answers only the operator account, because a funnel is the one number that must not be public.

-- TWO GUARDS LIVE INSIDE THE WRITE.
-- The name is a closed list, so a typo in the site cannot fill the table with rows nobody can group.
-- One browser cannot report the same step twice in five seconds: a re-render is not a second visitor.

create table if not exists public.opera_funnel_events (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  name text not null,
  path text,
  anon_id text,
  user_id uuid,
  meta jsonb not null default '{}'::jsonb,
  constraint opera_funnel_events_name_len check (char_length(name) between 1 and 48),
  constraint opera_funnel_events_path_len check (path is null or char_length(path) <= 200),
  constraint opera_funnel_events_anon_len check (anon_id is null or char_length(anon_id) <= 64)
);

create index if not exists opera_funnel_events_name_created on public.opera_funnel_events (name, created_at desc);
create index if not exists opera_funnel_events_anon on public.opera_funnel_events (anon_id, created_at desc);

alter table public.opera_funnel_events enable row level security;

-- No select, insert or update policy: the table is reachable only through the two functions below.

revoke all on public.opera_funnel_events from anon, authenticated;
revoke all on sequence public.opera_funnel_events_id_seq from anon, authenticated;

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
    'page.view', 'install.view', 'install.click', 'plan.view', 'buy.click',
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

-- The funnel is read as counts per step per day, plus how many distinct browsers reached each step.
-- Distinct browsers is the number that matters at the top: a thousand pageviews from one machine is not a thousand people.
-- The window is clamped to a year, so a caller cannot ask for a range that scans the whole table.

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
           count(distinct anon_id)::int as browsers
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
           count(distinct user_id)::int as accounts
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
