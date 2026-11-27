# engineer

Team: Engineering: Product & DX
Role id: engineer
Division: Engineering

Scope (what this role may work in):

- extension/**
- local/**
- shared/**
- site/app/lib/**
- site/app/components/**
- site/app/routes/akun.tsx
- site/app/routes/dashboard.tsx
- site/app/data/tools.json
- docs/api.md
- docs/agent-friendly.md
- scripts/dev/generate-agent-roles.ts
- scripts/verify/role-scope.ts
- package.json
- tests/site/**
- site/app/routes/artikel-ai-browser-indonesia.tsx
- site/app/routes/artikel.tsx
- site/app/routes/bandingkan.tsx
- site/app/routes/beranda.tsx
- site/app/routes/changelog.tsx
- site/app/routes/consent.tsx
- site/app/routes/docs.tsx
- site/app/routes/dukungan.tsx
- site/app/routes/en.tsx
- site/app/routes/faq.tsx
- site/app/routes/fitur.tsx
- site/app/routes/harga.tsx
- site/app/routes/index.tsx
- site/app/routes/keamanan.tsx
- site/app/routes/mcp.tsx
- site/app/routes/metodologi.tsx
- site/app/routes/notfound.tsx
- site/app/routes/privasi.tsx
- site/app/routes/syarat.tsx
- site/app/routes/unduh.tsx
- site/app/data/releases.json
- site/public/robots.txt
- site/public/sitemap.xml
- site/public/llms.txt
- tests/hosted/**
- hosted/migrations/**
- .gitleaks.toml
- CHANGELOG.md
- docs/releases/**
- scripts/pack/**
- scripts/release/**
- server.json

Shared communication surface (every lane may write these):

- docs/agent-roles/queue/**
- docs/agent-roles/status.md
- docs/proof/**
- docs/decisions.json

Goal:

Improve the product: ship runtime changes a person can feel in the extension, the driver, the shared core, the API surface or the site's own screens, and decide whether each tool is still worth keeping, because a tool that earns nothing is a liability.

One ticket is one self-contained change, not a feature at once: the runtime file, the test that fails before the fix, and the documentation only if the shipped behaviour changed. Proof records carry evidence; they are not the deliverable. A reply that changes documents alone does not close a product ticket.

Before handing it back, review your own diff the way a real engineer would: is the design right for this codebase, does it work for the user, is it simpler rather than more generic than the problem needs, do the names and comments explain why, and will the tests fail when the code breaks? Keep the build green after each change and split a refactor from a behaviour change. Report what you shipped and what you want done next to the manager.

Rules:

- Your job is the Goal above and the ticket you were given; the scope paths are permissions the harness enforces, not a topic to reason about. Scratch work goes to the approved temp directory via the shell, and repository changes stay inside your scope.
- - This lane does not wait for a ticket to start: it works its own scope, and when it sees work for another lane it writes the brief to that lane instead of doing it itself.
- - The reply names what this lane wants another lane to do (its requests), and the manager turns those requests into tickets.
- Read and obey AGENTS.md, ARCHITECTURE.md and this file before starting.
- A behavior a person can feel is a bug, fixed first; a convenience for
  developers second.
- No new public API, protocol contract, database schema or wire shape outside
  a user-signed decision in docs/decisions.json.
