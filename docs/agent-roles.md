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
X may not edit `site/` if X is `sales-rep`; when another division's work
is needed, a handoff artifact (see conventions) carries the brief, and the work
happens in that role's own session, not borrowed.

## Roles (the team list to review)

Each role carries two names: the **division** it belongs to (a function a
company really runs) and the **agent id** the harness knows it by (a short
task-shaped name, the way the agent ecosystems name their agents). The id is
the entry key; the division says where the work belongs.

| agent id | division | scope (repo paths) | status |
|---|---|---|---|
| operator | Operations | docs/economy.json, docs/handoff.md, docs/proof | active |
| researcher | Research & Development | docs/research, docs/product, README.md | planned |
| sales-rep | Sales | README.md, docs/research/prospects.md, docs/product | planned |
| marketer | Marketing | site/** | planned |
| engineer | Engineering | extension/**, local/**, shared/**, docs/api.md, docs/agent-friendly.md | planned |
| release-engineer | Engineering | .github/**, scripts/release/**, scripts/pack/**, docs/releases, CHANGELOG.md, server.json | planned |
| finance-analyst | Finance | docs/economy.json, docs/proof/**, hosted/migrations, docs/handoff.md | planned |
| support-agent | Customer Support | docs/product/support.md, docs/product/navego-adoption.md, site/** (docs surface) | planned |
| onboarding-guide | Customer Success | docs/** (prose and definitions) | planned |
| ceo | Executive | docs/agent-roles.md, docs/agent-roles/registry.json, docs/agent-roles/status.md, docs/agent-roles/queue, docs/economy.json, docs/handoff.md | planned |

`support-agent` and `onboarding-guide` both hold `docs/product`; a written
handoff between them, not inheritance, moves work across. The divisions and
the naming are grounded in
[`docs/research/agent-roles.md`](research/agent-roles.md).

## The agent files (the entry point a harness reads)

A role is not only a document. Every role is an agent file the coding harness
reads at session start:

- `.opencode/agents/<role>.md` — the OpenCode project agent: the role body as
  the system prompt, and permissions that deny editing everything and allow
  editing only the role's scope paths. The scope is enforced by the harness,
  not by good intentions.
- `.claude/agents/<role>.md` — the same role for Claude Code.

Both are rendered from `docs/agent-roles/registry.json` by
`scripts/dev/generate-agent-roles.ts` (`npm run roles`, `npm run roles:check`),
so the register stays the one source and a hand-written copy cannot drift. The
gate `tests/tooling/agent-roles.test.ts` refuses a file that no longer matches
the register, and refuses a role whose permissions do not carry its scope.

The research that shaped this (what the harnesses document, and which part
backs which mechanism) is in
[`docs/research/agent-roles.md`](research/agent-roles.md), with its sources.

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

**One communication container** — `docs/agent-roles/status.md`. It is the shared line-per-role board every division reads: what is missing for a division, what can be upgraded, and the open upgrades. A session opens it, refreshes its own line, and proposes upgrades in the queue artifact below when it sees a gap it owns; nothing stays secret because it lived in a chat, since the status is a file.

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
