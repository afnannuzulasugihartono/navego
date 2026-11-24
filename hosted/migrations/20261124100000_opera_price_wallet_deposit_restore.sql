-- @last-edited: 2026-11-24 UTC+7.
-- @title: opera_price_wallet_deposit_restore - put the wallet top-up price row back.
-- @related: ["hosted/migrations/20261104120000_opera_wallet.sql"] - ["docs/economy.json"] - ["tests/billing/wallet-quote.test.ts"]

-- THE AUDIT THAT FOUND THIS: a live wallet-deposit invoice priced itself "not charged: no price for this kind" (invoice 1ec02bc3-7c1b-45a2-b864-837e95ba3b24:wallet-mwuhd3km, 2026-11-24) while today's funnel carried a buy click that could settle nothing.
-- The wallet migration of 2026-11-04 inserts this exact row with an upsert guard, so a deployed database that lacks it never ran that migration's price insert.
-- The restore is the same statement, narrowed to the one missing kind.

insert into public.opera_price_list (kind, unit, amount_cents, currency, active)
values
  ('wallet.deposit', 'wallet top-up', 1000000, 'IDR', true)
on conflict (kind) do update set
  unit = excluded.unit,
  amount_cents = excluded.amount_cents,
  currency = excluded.currency,
  active = excluded.active;
