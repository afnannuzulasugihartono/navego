-- The answers from the pilot page: what the market says before there is a customer.

-- WHY THIS TABLE EXISTS.
-- The pilot page asks three questions - which portal the clients use, how many clients a month, and which part wears them out - and the answers decide which bank gets built first.
-- An answer kept in somebody else's form service is an answer that disappears with that service, and the first three customers are worth keeping in the product's own database, beside the price list and the invoices they turn into.

-- WHY THE CONTACT IS THE IDENTITY.
-- A bookkeeper who answers twice - once from a phone, once from the desk - is one person with one need, not two leads.
-- So the newest answer replaces the older one and the first time we heard from them stays.

create table if not exists public.opera_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  contact text not null check (char_length(trim(contact)) between 3 and 160),
  name text not null check (char_length(trim(name)) between 1 and 120),
  firm text check (firm is null or char_length(firm) <= 120),
  portal text check (portal is null or char_length(portal) <= 160),
  clients text check (clients is null or char_length(clients) <= 40),
  pain text check (pain is null or char_length(pain) <= 600),
  wants_slot boolean not null default false,
  source text check (source is null or char_length(source) <= 40),
  user_agent text check (user_agent is null or char_length(user_agent) <= 200),
  constraint opera_feedback_contact_once unique (contact)
);

comment on table public.opera_feedback is 'One row per person who answered the pilot page: the contact is the identity, and the newest answer wins.';
comment on column public.opera_feedback.wants_slot is 'True when the answer says they want a pilot slot, which is the line between a note and a customer.';
comment on column public.opera_feedback.portal is 'The bank portal the clients use. The answers here decide which portal is built first.';

-- WHY NOBODY READS THIS TABLE DIRECTLY.
-- An answer holds a person's name and a way to reach them, so the anonymous and signed-in roles are closed out and only the service role - the function that writes them - may touch the rows.

alter table public.opera_feedback enable row level security;

revoke all on table public.opera_feedback from anon, authenticated;
grant select, insert, update on table public.opera_feedback to service_role;
