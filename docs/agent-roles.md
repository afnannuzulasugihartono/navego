# Agent roles — one session, one role

Every automation that fires a session names a role, and the session works only
inside that role's scope until a handoff says otherwise. This file is the entry
point a new session reads first: its role, its scope, and the conventions every
division follows. The registry that holds the machine-readable part is
[`docs/agent-roles/registry.json`](agent-roles/registry.json).

## What a role is

A role is one line of the product's division, one automation's lane, one scope
path list. A session that opens for automation X works on X's scope only. A role
has:

- an `id` (kebab-case token, the entry key),
- a `team` (the division that owns it),
- `scopePaths` (the paths the role may touch),
- a `doc` (this role's markdown, which names the role id and says the scope),
- `automations` (the automations that open sessions for it),
- `status` (`active` while an automation runs it, `planned` otherwise).

The scope rule is the gate's job, and its source is this doc: a role's allowed
paths are what its `doc` lists, and nothing else. A session that begins in role
X may not edit `site/` if X is `growth-prospects`; when another division's work
is needed, a handoff artifact (see conventions) carries the brief, and the work
happens in that role's own session, not borrowed.

## Roles (the team list to review)

| role id | team | scope (repo paths) | status |
|---|---|---|---|
| survival-runner | Engineering: Survival | docs/economy.json, docs/handoff.md, docs/proof | active |
| growth-prospects | Growth: Prospecting & outreach | docs/research, docs/product, README.md | planned |
| growth-site | Growth: Site & marketing | site/** | planned |
| product-dx | Engineering: Product & DX | extension/**, local/**, shared/**, docs/api.md, docs/agent-friendly.md | planned |
| engineering-release | Engineering: Release | .github/**, scripts/release/**, scripts/pack/**, docs/releases, CHANGELOG.md, server.json | planned |
| finance-economy | Finance: Economy | docs/economy.json, docs/proof/**, hosted/migrations, docs/handoff.md | planned |
| support-retention | Customer: Support & retention | docs/product/support.md, docs/product/navego-adoption.md, site/** (docs surface) | planned |
| onboarding-docs | Customer: Onboarding docs | docs/** (prose and definitions) | planned |

`support-retention` and `onboarding-docs` both hold `docs/product`; a written
handoff between them, not inheritance, moves work across.

## Cross-division conventions (the one shared rule set)

Every division reads and writes the same three ledgers, so the product can be
assembled from many sessions without drifting:

1. **Decisions.** Every decision lands in [`docs/decisions.json`](decisions.json)
   with a source (`user`, `internet` URL, `repo` file, or `recorded` date) — the
   register gate refuses otherwise. Cite `decisions.json -> <id>` in code.
2. **Ledgers.** `docs/economy.json` moves only through the economy ledger rules
   (money out only via revenue or cost rows; a gap named in `monthly_gap_usd`).
3. **Product state.** `docs/handoff.md` is the rolling "what is true now, next
   step" record; a division writes its last state there when it ships.

Handoff between divisions is one artifact per ticket, in
`docs/agent-roles/queue/`, named `<from-role>-to-<to-role>-<yyyymmdd>.md`, with
these fields: `intent`, `why`, `scopeRequested` (what the other role must do),
`acceptance` (the shared gates that count as done), `deadline` (optional). The
receiving session reads the queue, works, and answers by writing a reply
artifact next to it. Handoff is not delegation of a file: the receiving role
runs its own session, inside its own scope.

Sessions start in their role. A session that was pointed at another division's
work records that deviation in the handoff artifact it writes; a session that
receives a queue file must read it first and keep the receiving role in scope.

## Entry point (the door an agent walks through)

1. Read this file and the session's role doc (`docs/agent-roles/<role-id>.md`).
2. Print or state the role id and the scope list before any work.
3. Work only inside the scope paths until a handoff artifact says otherwise.

## Gates

The quality bar is shared by all roles and enforced by the repo: `npm test`,
`npm run check`, and `py tests/browser_extension_test.py` when the extension
changes a page. The role gate (`tests/tooling/agent-roles.test.ts`) refuses a
role without a doc or scope, and this file's table must list every registry
role.
