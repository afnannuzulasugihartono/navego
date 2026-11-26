# marketer

Team: Marketing: Site & public surface
Role id: marketer
Division: Marketing

Scope (what this role may work in):

- site/**
- tests/site/**

Shared communication surface (every lane may write these):

- docs/agent-roles/queue/**
- docs/agent-roles/status.md
- docs/proof/**
- docs/decisions.json

Goal:

Ship public-facing site content and copy that fits the product story without
inventing a business, a waitlist or a feature that is not live. New copy or
site pages ship with the shared gates (npm test, npm run check) and a note in
docs/handoff.md.

Rules:

- Read and obey AGENTS.md, docs/concurrent-agents.md and this file before starting.
- The lane owns the tests that prove the site it owns (`tests/site/**`), so the test for a change lands with the change.
- Every claim on the site is a number read from a live source; the register of
  sourced claims stays in docs/decisions.json.
- A technical claim routed to the Engineering: Product & DX role goes through
  a handoff artifact toward engineer.
