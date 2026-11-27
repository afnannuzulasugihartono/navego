# finance-analyst - started 20261127-0145

Ticket: engineer-to-finance-analyst-20261126-1233.md. Slot: nvidia-3. Worker: slot-nvidia-3/finance-analyst-20261127-0145.

## The one production operation this lane is about to run

One operation, and it is the only one while it runs: the migration
`hosted/migrations/20261127014500_opera_funnel_install_press_probe.sql` is
applied from the main checkout (`D:\GitHub\navego`) with
`node scripts/release/apply-migrations.ts`, and the ledger row that names it is
written with the same migration repair the two earlier hand-applied files use.
The lane holds no second production operation until it finishes and writes the
evidence to `docs/proof/2026-11-27-finance-analyst.md`.

The production lock is not a file yet (`docs/autonomy.md` §3), so this marker is
the announcement `docs/concurrent-agents.md` asks for before the operation.
