# Triggers and capacity

- Operator survival run: every 1 hour, Asia/Jakarta.
- Fleet watchdog: every 10 minutes.
- Lane dispatchers: :25, :35, :45, one NVIDIA key each, through scripts/dev/agent-fleet/dispatch.ts.
- Public outreach: one bounded action per day; exactly one send automation is active, the rest paused.
- Terminal session outcome frees its lane; not-before and superseded-by stop ticket starvation; money tickets go first, then product, then the rest.
- Migrations, edge deploys and CRX signing stay behind one production lock.

Live automation ids and schedules are recorded in docs/automations.md and verified with automation.list. Do not assume a trigger is active without reading it.
