-- The Supabase image's superuser is supabase_admin; this file runs as that role, while the migrations run as postgres, as they do on the hosted project.

-- The hosted project grew from a predecessor that left public.loa_v3_config behind.
-- Two migrations of the 1.0.0 goal head read and write that table, and a later migration drops it; a fresh database needs it before the history can replay, so this baseline restores the shape those migrations touch.

create table if not exists public.loa_v3_config (
  key text primary key,
  value text not null default ''
);

-- GoTrue creates its tables when it boots, after migrations.
-- The history needs them first: foreign keys to auth.users, session identity in the transaction journal, consent revocation over refresh tokens.
-- These are the columns the SQL names, with the real types (uuid ids, timestamptz instants), so the replay exercises the same joins and updates production runs.

create table if not exists auth.users (
  id uuid primary key
);

create table if not exists auth.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  oauth_client_id uuid,
  not_after timestamptz
);

create table if not exists auth.refresh_tokens (
  session_id uuid,
  revoked boolean not null default false
);

create table if not exists auth.oauth_clients (
  id uuid primary key default gen_random_uuid(),
  client_name text
);

create table if not exists auth.oauth_consents (
  user_id uuid,
  client_id uuid,
  scopes text,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);

-- One migration records its own application in the Supabase migrations ledger, which the hosted platform creates before any project SQL runs.

create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (
  version text primary key,
  statements text[]
);
grant usage on schema supabase_migrations to postgres;
grant select, insert, update, delete on supabase_migrations.schema_migrations to postgres;

-- The migrations run as postgres: they grant select on auth.sessions to service_role, and several security definer functions read auth.uid().
-- On the hosted project postgres holds those privileges; here the superuser hands them over so the same statements mean the same thing.

create or replace function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

grant usage on schema auth to postgres;
grant select, insert, update, delete on all tables in schema auth to postgres with grant option;
grant execute on function auth.uid() to postgres;
