# Research: what roles a repository needs for agents

Read on 2026-11-25 from the sources below. Every line states what the source
says; nothing here is a preference invented by the agent. The roles Navego
implements live in `docs/agent-roles/registry.json`; this file is why they are
shaped that way.

## What the sources say

### OpenCode — project agents are files with scoped permissions

Source: https://opencode.ai/docs/agents

- A reusable agent is a Markdown file; project agents live in
  `.opencode/agents/<name>.md`, and a nested path becomes part of the agent id
  (`.opencode/agents/team/reviewer.md` → `team/reviewer`).
- The frontmatter carries `description`, `mode` (`primary`, `subagent` or
  `all`), `model`, `permissions`, `steps`, `hidden`, `color`, `disabled` and
  `request`; the Markdown body becomes the agent's system prompt.
- A permission rule is `action` + `resource` + `effect` (`allow`, `ask`,
  `deny`), the last matching rule wins, and the actions include `shell`,
  `edit`, `subagent`, `read`/`glob`/`grep`, `webfetch`/`websearch` and `skill`.
- The built-ins are `build` (primary), `plan` (primary), `general`
  (subagent) and `explore` (subagent).

### Claude Code — one role per file, scoped tools, own worktree

Source: https://code.claude.com/docs/en/sub-agents

- A custom subagent is a Markdown file with YAML frontmatter; project scope is
  `.claude/agents/`, user scope is `~/.claude/agents/`, and the file can sit in
  subfolders (identity comes from the `name` field).
- The frontmatter fields include `name`, `description`, `tools`,
  `disallowedTools`, `model`, `permissionMode`, `maxTurns`, `memory`
  (`user`/`project`/`local`), `isolation: worktree`, `skills`, `hooks`,
  `mcpServers` and `effort`.
- The `description` is what the parent reads to decide when to delegate, so it
  should be short; the body is the system prompt the subagent runs with.
- A subagent runs in its own context window; `isolation: worktree` gives it an
  isolated copy of the repository.

### Agent teams — a lead, a shared task list, and mailboxes

Source: https://code.claude.com/docs/en/agent-teams

- A team is one team lead plus teammates that are independent sessions; they
  coordinate through a shared task list and message each other directly.
- The shared task list holds tasks in `pending`, `in progress` and
  `completed`, and a task can depend on another, which leaves it `blocked`.
- Each agent has a mailbox: a JSON file at
  `~/.claude/teams/{team-name}/inboxes/{agent-name}.json`; a message is
  delivered only when the write to that inbox succeeds.
- A subagent definition can be reused as a teammate, and the definition's
  `tools`, `disallowedTools`, `model` and body then apply to that teammate.
- Hooks are the quality gate: `TeammateIdle`, `TaskCreated` and
  `TaskCompleted` run when a teammate goes idle or a task changes, and exiting
  with code 2 sends feedback and keeps the work going.
- A message from another agent never approves a permission prompt and never
  changes the receiving agent's configuration.

### Cross-session messaging — how one session reaches another

Source: https://code.claude.com/docs/en/cross-session-messaging

- A session can send a message to another session on the same machine (over a
  per-session socket or named pipe), to a session on another machine, or to a
  cloud session; the message is text, not the sender's history.
- The receiving session's inbound control is `accept`, `hold` or `refuse`, and
  the receiving session's own permission rules still apply to whatever the
  message asks for.
- Commands inside a message arrive as plain text and are never executed, and a
  message cannot be used to bypass a denial in the sending session.

### AGENTS.md — one instruction file, nearest one wins

Source: https://agents.md/

- AGENTS.md is an open format for guiding coding agents; the project root
  carries one, and a large monorepo adds nested AGENTS.md files per
  subproject; agents read the nearest file and the closest one takes
  precedence, while explicit user chat overrides everything.
- There are no required fields; the file is plain Markdown, and it is stewarded
  by the Agentic AI Foundation under the Linux Foundation.

## What Navego does with it

| Mechanism Navego uses | Backed by |
|---|---|
| Role as the entry point of a session: `.opencode/agents/<role>.md` with the role's own system prompt | OpenCode agents, Claude Code sub-agents |
| Scope enforced by the harness, not by good intentions: `edit` denied on `*` and allowed only on the role's scope paths | OpenCode agents (last matching rule wins) |
| The same role portable to Claude Code: `.claude/agents/<role>.md` with the same body | Claude Code sub-agents (`.claude/agents/` project scope) |
| One shared board every division reads and writes: `docs/agent-roles/status.md`; handoff artifacts in `docs/agent-roles/queue/` | Agent teams (shared task list + per-agent mailbox, as files a repository can hold) |
| Quality gate on completion: `npm test` and `npm run check`, plus the browser harness for extension work | Agent teams (hooks as the gate), AGENTS.md (gates listed in the instruction file) |
| One session never crosses a division: a session works its own scope and moves work through a handoff artifact | Cross-session messaging (a message never grants consent; the receiver's permissions still apply) |
| The role's own doc is read first, so the nearest file carries the rule | AGENTS.md (nearest AGENTS.md wins) |

## The naming: a company division, and an id an agent can be called by

Sources: https://en.wikipedia.org/wiki/Organizational_structure and
https://en.wikipedia.org/wiki/Chief_executive_officer (read 2026-11-25).

- A company is divided by function: the functional structure splits work into
  departments such as marketing, sales, finance, operations, information
  technology and human resources, and the divisional structure splits it by
  product or region. The same page lists the executive layer: chief executive
  officer, chief operating officer, chief financial officer, chief marketing
  officer, chief business officer, chief human resources officer, chief
  information officer, chief product officer, chief strategy officer.
- The CEO page says the same division names from the top down: the CEO is
  accountable for the decisions in operations, marketing, business development,
  finance and human resources, and the subordinate executives (COO, CFO, CSO,
  CMO, CBO) each carry a functional area.

So a role in this repository carries a **division** from that list, and the
**agent id** is the name a harness can call: the harness ecosystems name their
agents after the work (`reviewer`, `explainer`, `code-reviewer`,
`code-improver`, `debugger` in the documentation above), never after a
project. A Navego id that mixes a division with a project noun
(`growth-site`, `finance-economy`) is neither: it tells an agent neither which
division owns the work nor what kind of worker it is. Hence `marketer`
(Marketing), `finance-analyst` (Finance), `researcher` (R&D), `sales-rep`
(Sales), `support-agent` (Customer Support), `onboarding-guide` (Customer
Success), `engineer` and `release-engineer` (Engineering), `operator`
(Operations), `ceo` (Executive).

## Roles Navego keeps, and the roles it does not have yet

Kept (each with a division, a scope and a doc): `operator` (Operations),
`researcher` (Research & Development), `sales-rep` (Sales), `marketer`
(Marketing), `engineer` (Engineering), `release-engineer` (Engineering),
`finance-analyst` (Finance), `support-agent` (Customer Support),
`onboarding-guide` (Customer Success), `ceo` (Executive).

Not created yet, with the reason: no separate Legal & Compliance role (the
owner holds the consent and pricing decisions until there is a second party to
review), no separate People role (there is no hiring in this company yet), no
Data & Analytics role (the funnel read and the settlement read are part of
operator and finance-analyst), no separate Product role (the product decision
is the CEO's, the product work is the engineer's), no separate Design role
(the site's visual system is one file, `site/app/tokens.css`, with the
Marketing lane owning it). A role is added when a division has work the current lanes cannot
hold, and the CEO role (or the owner) re-scopes then.
