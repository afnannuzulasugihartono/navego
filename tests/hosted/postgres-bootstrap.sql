-- The hosted project grew from a predecessor that left public.loa_v3_config behind.
-- Two migrations of the 1.0.0 goal head read and write that table, and a later migration drops it; a fresh database needs it before the history can replay, so this baseline restores the shape those migrations touch.

create table if not exists public.loa_v3_config (
  key text primary key,
  value text not null default ''
);

-- The Supabase image ships the auth schema and auth.uid(), but GoTrue creates its tables when it boots.
-- The migration history reads them: foreign keys to auth.users, session identity in the transaction journal, consent revocation over refresh tokens.
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
