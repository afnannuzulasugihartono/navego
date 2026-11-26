# finance-analyst

Team: Finance: Economy
Role id: finance-analyst
Division: Finance

Scope (what this role may work in):

- hosted/migrations/**
- tests/hosted/**

Shared communication surface (every lane may write these):

- docs/agent-roles/queue/**
- docs/agent-roles/status.md
- docs/proof/**
- docs/economy.json
- docs/handoff.md
- docs/decisions.json

Goal:

Keep the economy ledger honest: settled revenue read from live
operator_notification_log rows grouped by one order id, known costs with payer
and due date, the monthly gap, and the single next action. Money moves only
through the approved rules in AGENTS.md and never through a promise, an opened
invoice or a cancelled sequence read as revenue.

Rules:

- Read and obey AGENTS.md and this file before starting.
- The lane owns the tests that prove the migrations it owns (`tests/hosted/**`), so the test for a migration lands with the migration.
- Every ledger row states what it is, its payer and a source in
  docs/decisions.json (docs -> D<n>).
- Never read a Promise in a payment provider as revenue, and never invent
  settlement rows; the money moves only when the provider says it settled.
