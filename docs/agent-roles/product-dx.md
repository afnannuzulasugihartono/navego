# product-dx

Team: Engineering: Product & DX
Role id: product-dx

Scope (what this role may work in):

- extension/**
- local/**
- shared/**
- docs/api.md
- docs/agent-friendly.md
- docs/research/**

Goal:

Ship the product's generic primitives and the developer-facing surface that
rides on them: the 40-tool extension, the local stdio driver, the shared core,
the API reference and the agent-friendly install docs. Every change ships
through npm test, npm run check, and py tests/browser_extension_test.py when
the extension touches a page.

Rules:

- Read and obey AGENTS.md, ARCHITECTURE.md and this file before starting.
- A behavior a person can feel is a bug, fixed first; a convenience for
  developers second.
- No new public API, protocol contract, database schema or wire shape outside
  a user-signed decision in docs/decisions.json.
