-- The hosted project grew from a predecessor that left public.loa_v3_config behind.
-- Two migrations of the 1.0.0 goal head read and write that table, and a later migration drops it; a fresh database needs it before the history can replay, so this baseline restores the shape those migrations touch.

create table if not exists public.loa_v3_config (
  key text primary key,
  value text not null default ''
);
