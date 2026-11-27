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
- `communicationPaths` (the shared queue, status board and proof paths the role
  may write),
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
| operator | Operations | docs/economy.json, docs/handoff.md, docs/proof, docs/agent-roles/loop/**, docs/automations.md, docs/agent-roles/keys.json, docs/agent-roles/registry.json, docs/agent-roles.md, docs/agent-roles/*.md, scripts/dev/agent-fleet/**, scripts/dev/agent-worktree.ts, tests/tooling/agent-loop.test.ts, tests/tooling/agent-dispatch.test.ts, .opencode/agents/**, .claude/agents/**, tests/tooling/agent-roles.test.ts, docs/research/agent-roles.md | active |
| sales-rep | Sales | README.md, docs/prospects.md, docs/research/prospects.md | active |
| engineer | Engineering | extension/**, local/**, shared/**, site/app/lib/**, site/app/components/**, site/app/routes/akun.tsx, site/app/routes/dashboard.tsx, site/app/data/tools.json, docs/api.md, docs/agent-friendly.md, scripts/dev/generate-agent-roles.ts, scripts/verify/role-scope.ts, package.json, tests/site/**, site/app/routes/artikel-ai-browser-indonesia.tsx, site/app/routes/artikel.tsx, site/app/routes/bandingkan.tsx, site/app/routes/beranda.tsx, site/app/routes/changelog.tsx, site/app/routes/consent.tsx, site/app/routes/docs.tsx, site/app/routes/dukungan.tsx, site/app/routes/en.tsx, site/app/routes/faq.tsx, site/app/routes/fitur.tsx, site/app/routes/harga.tsx, site/app/routes/index.tsx, site/app/routes/keamanan.tsx, site/app/routes/mcp.tsx, site/app/routes/metodologi.tsx, site/app/routes/notfound.tsx, site/app/routes/privasi.tsx, site/app/routes/syarat.tsx, site/app/routes/unduh.tsx, site/app/data/releases.json, site/public/robots.txt, site/public/sitemap.xml, site/public/llms.txt, tests/hosted/**, hosted/migrations/**, .gitleaks.toml, CHANGELOG.md, docs/releases/**, scripts/pack/**, scripts/release/**, server.json | active |
| onboarding-guide | Customer Success | docs/install.md, docs/external-install.md, docs/agent-call.md, docs/product/support.md, docs/product/navego-adoption.md | active |

Every role's `communicationPaths` are `docs/agent-roles/queue/**`,
`docs/agent-roles/status.md`, `docs/proof/**` and `docs/decisions.json`.

Every path has exactly one work-scope owner: `operator` owns the economy ledger, the handoff record, the proof folder, the loop, the fleet tooling, the role register and the role documents, `sales-rep` owns the prospect list and the outreach record, `engineer` owns the product, the whole website, the tools, the migrations and the release plumbing, and `onboarding-guide` owns the first-run and support documents. The gate `tests/tooling/agent-roles.test.ts` refuses a register where two work scopes cover the same tracked file.

Four lanes, and no standing research/marketing/release/finance/support lane: their functions remain as bounded tickets for one of the four. The job descriptions are in [`docs/agent-roles/job-descriptions.md`](agent-roles/job-descriptions.md).

These paths are shared by design, and the handoff rule is what moves work
across them: every role may write the queue
(`docs/agent-roles/queue/**`), the board (`docs/agent-roles/status.md`), the
proof folder (`docs/proof/**`) and the decision register
(`docs/decisions.json`). A lane that needs another lane's work scope writes a
handoff artifact for that lane instead of editing the file.
The divisions and the naming are grounded in
[`docs/research/agent-roles.md`](research/agent-roles.md).

## The key roster (capacity split by credential)

`docs/agent-roles/keys.json` names every NVIDIA route the company runs on: the
personal/console one and each ordinary account. Each row carries the provider,
the model a worker uses, where the credential lives (the signed-in console
session, an environment variable, or a file outside this repository), the
session that slot owns, and the lanes it serves. The roster never holds a key.

One credential serves one worker process **and one session**: two accounts run
two lanes at the same time, each in its own worktree and its own session. **A
lane worker never runs inside the operator conversation** — that route spends
the conversation's own request budget, and NVIDIA answers at 40 requests per
minute, so the conversation keeps the console route and the workers take the
ordinary accounts, each with a bounded step limit. No two slots may run on the
same credential: the worker hashes each credential locally and refuses a slot
whose digest already belongs to another slot, so the proof shows two distinct
credentials without anyone holding one. Adding an account is one provider
entry, one roster row and one more worker. Two ordinary accounts are not two
credits: each account's own quota and the provider's terms apply.

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

**No subagents.** No role dispatches a subagent. Each lane runs on one
credential whose provider answers at 40 requests per minute, and a child
session multiplies requests against the same key; the observed result is HTTP
429 and a lane that stops mid-task. The generated agent files deny the
`subagent` action, and every role body says to do the work in the session.

**One communication container** — `docs/agent-roles/status.md`. It is the shared line-per-role board every division reads: what is missing for a division, what can be upgraded, and the open upgrades. A session opens it, refreshes its own line, and proposes upgrades in the queue artifact below when it sees a gap it owns; nothing stays secret because it lived in a chat, since the status is a file.

Handoff between divisions is one artifact per ticket, in
`docs/agent-roles/queue/`, named
`<from-role>-to-<to-role>-<yyyymmdd-HHMM>.md`, with these fields: `intent`,
`why`, `scopeRequested` (what the other role must do), `acceptance` (the shared
gates that count as done), `deadline` (optional). The receiving session reads
the queue, works, and answers by writing a reply artifact next to it. Handoff
is not delegation of a file: the receiving role runs its own session, inside
its own scope.

**The manager loop.** The `operator` role is the agent manager. It assigns one
ticket at a time, the lane claims it with a started marker and returns a reply
carrying `answered: <ticket>`, and the manager reads the reply, closes it on the
status board and in `docs/proof/`, and only then chooses the next ticket. The
queue is the memory: a conversation is not an assignment, and a chat message is
not a result. The contract is
[`agent-roles/loop/README.md`](agent-roles/loop/README.md).

The liveness check is the process table, not the marker's age: the watchdog
`scripts/dev/agent-fleet/watch.ts` runs every ten minutes, releases a marker
whose worker process is gone, and blocks a ticket after three releases. A
failed process-table read is `unknown`, not death, so nothing is released on a
failed read.

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
