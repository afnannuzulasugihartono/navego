# @last-edited: 2026-11-27 UTC+7.
# @title: agent organisation architecture - one repo area for four lanes, with a selected orchestration pattern.
# @state: consolidated design spec. Supersedes `2026-11-27-agent-org-pattern-selection-design.md`. Awaiting owner review; no implementation approved.
# @dependencies: `docs/agent-roles/registry.json`, `docs/agent-roles/job-descriptions.md`, `docs/autonomy.md`, `docs/decisions.json`, `ARCHITECTURE.md`.

# WHY THIS EXISTS

The four active lanes - `operator`, `engineer`, `sales-rep`, `onboarding-guide` - have their mandates, prompts, contracts, triggers and evidence scattered across `docs/agent-roles/`, `docs/automations.md`, `docs/proof/`, automations and generated agent files. The owner asked for **one separate area at the root of the repository** that holds everything about the agent organisation, with a folder per agent and no mixing with product documentation.

This is the single consolidated spec: it defines the folder area **and** selects the orchestration pattern. It does not move `docs/proof/**`, change any gate, or add an agent.

# SOURCES (opened, not assumed)

1. Michael Nygard, *Documenting Architecture Decisions* (2011) - https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
   - Small modular decision records belong in version control with the code. Large documents are never maintained. A reversed decision is kept and marked superseded, not deleted.
2. Divio, *The Documentation System* and *About the structure* - https://documentation.divio.com/ , https://documentation.divio.com/structure/
   - Four distinct documentation functions: tutorial, how-to, reference, explanation. They naturally collapse; separating sections protects author and reader.
3. Team Topologies, *Key Concepts* - https://teamtopologies.com/key-concepts
   - Four team types: stream-aligned, enabling, complicated-subsystem, platform. Flow of work outranks org chart.
4. Anthropic, *Building effective agents* - https://www.anthropic.com/engineering/building-effective-agents
   - Orchestrator-workers, evaluator-optimizer, ground truth from the environment, human checkpoints, iteration limits, deliberate agent-computer interface design.
5. Microsoft Azure Architecture Center, *AI Agent Orchestration Patterns* (updated 2026-09-21) - https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns
   - Start with the right complexity level. Patterns: sequential, concurrent, group chat, handoff, magentic. Maker-checker requires clear acceptance criteria, an iteration cap and a fallback; group chat is limited to three agents; avoid concurrent when quota is constrained.
6. Amazon Web Services, *Use multi-agent collaboration with Amazon Bedrock Agents* - https://docs.aws.amazon.com/bedrock/latest/userguide/agents-multi-agent-collaboration.html
   - Hierarchical supervisor + collaborators; roles and responsibilities must be clearly designated and minimally overlapping.
7. DORA, *Four keys* - https://dora.dev/guides/dora-metrics-four-keys/
   - Throughput and stability are correlated, not traded. Metrics are diagnostics, not targets; Goodhart's law is called out.
8. Google SRE, *Monitoring Distributed Systems* - https://sre.google/sre-book/monitoring-distributed-systems/
   - Four golden signals; symptom versus cause; alerts must be actionable, low-noise, not require staring at a screen.
9. Google Engineering Practices - https://google.github.io/eng-practices/review/developer/small-cls.html , https://google.github.io/eng-practices/review/reviewer/looking-for.html
   - One self-contained change with its test; review design, user functionality, complexity, naming, comments and tests.

# CONSTRAINTS INHERITED FROM THIS REPOSITORY

- Four active lanes only: `operator`, `engineer`, `sales-rep`, `onboarding-guide`. Research was retired (`docs-agent-roles-13`) and lives as a bounded ticket, not a lane.
- No `subagent` action in any generated role file; one session per credential slot; dispatcher orders `money -> product -> measurement`.
- `docs/decisions.json` is the **single decision register**; `docs/proof/**` is the **record of real runs**. Neither is duplicated.
- `gates.lock`, boundary locks, `.github/CODEOWNERS` and workflows are owner-only and untouched by this design.
- `ARCHITECTURE.md` enumerates top-level entries; a new root folder needs one added row. Because the owner directly asked for a root-level agent area, that row is an owner-directed deviation and must be recorded in the decision register during implementation.

# ORCHESTRATION PATTERN SELECTION

| Candidate | Verdict | Reason from the sources |
|---|---|---|
| Direct model call / single agent with tools | rejected | Four disjoint permission scopes and separate credentials are real security and capacity boundaries. |
| Sequential pipeline | partial | Fits ticket -> engineer -> reply -> board, but Azure says avoid it when backtracking is needed. |
| Concurrent / fan-out | rejected | One session per credential and 40 rpm per key; Azure says avoid when quota is constrained. |
| Group chat / roundtable | rejected | Three-agent limit, read-only assumption, shared thread - none match agents that edit code and send public messages. |
| **Supervisor + collaborators** | **selected as steady state** | AWS hierarchical model: one supervisor routes to specialists with minimally overlapping roles. |
| **Maker-checker / evaluator-optimizer** | **selected for operator <-> engineer** | Azure: maker produces, checker evaluates against clear criteria, returns feedback until approval or cap. |
| **Handoff / routing** | **selected for sales -> onboarding** | Azure: full control transfers to a specialist after a positive buyer reply, with a proof block rather than shared state. |

```text
operator (supervisor / enabling)
  |-- product work ------> engineer  --(report)--> operator --(review)--> engineer ... APPROVED
  |-- buyer conversation -> sales-rep --("yes" + proof block, handoff)--> onboarding-guide
  `-- evidence needed ---> research as a TICKET, never a collaborator agent
```

The supervisor never executes a collaborator's scope. The maker-checker loop has explicit criteria and a cap: approve, or three revisions, then a fresh ticket. Handoff is a queue artifact plus proof block, not a shared chat. The dispatcher is the only router; no concurrent lane work on one key.

Consequences: flow is visible, scopes disjoint, audit lives in git, capacity controlled. Costs: handoff adds latency and the supervisor can become a bottleneck; mitigations already present are the hourly operator run, the ten-minute watchdog, and dispatcher ticket ordering.

# FOLDER LAYOUT

```text
agents/
  README.md                  # reference/explanation: what this area is, ownership, links
  ARCHITECTURE.md            # reference/explanation: topology and contracts at a glance
  shared/
    contracts.md             # reference: ticket, reply, review message, approval
    triggers.md              # reference: cron, watchdog, dispatcher, send window
    metrics.md               # reference: golden signals + DORA diagnostics
    decisions.md             # explanation: ADR-style index pointing to docs/decisions.json
    research-ticket-template.md  # how-to: buy research without a standing lane
  operator/
    role.md                  # reference: orchestrator-evaluator mandate and scope
    runbook.md               # how-to: what the operator checks each run
    review-loop.md           # explanation: report -> review -> revise -> approve, max 3 rounds
  engineer/
    role.md                  # reference: product lane mandate and scope
    product-contract.md      # how-to: one runtime change + failing-before test
    review-checklist.md      # reference: adapted Google review checklist
  sales-rep/
    role.md                  # reference: one public surface per day
    outreach-policy.md       # how-to: consent, easy no, disclosure, one action/day
    proof-block.md           # reference: the only claims a buyer may receive
  onboarding-guide/
    role.md                  # reference: first five minutes
    first-win.md             # how-to: one command, one check, one real file
    handoff.md               # how-to: receiving an affirmative from sales
```

Divio mapping: `README`/`ARCHITECTURE` and `*/role.md` are reference/explanation; `runbook`, `product-contract`, `outreach-policy`, `first-win`, `handoff` and `research-ticket-template` are how-to; `proof-block`, `metrics`, `contracts`, `triggers` and `decisions` are reference; `review-loop` and the `decisions` narrative are explanation. No file mixes the four functions.

# ROLE TOPOLOGY (Team Topologies adapted)

| Lane | Topology | Why |
|---|---|---|
| operator | enabling + supervisor | makes other lanes able to work; does not do their product work |
| engineer | stream-aligned (product) | runtime change a person can feel, from source to deploy |
| sales-rep | stream-aligned (revenue) | one public surface -> conversation -> possible trial |
| onboarding-guide | stream-aligned (activation) | "yes" -> one command -> one real file |
| research | complicated-subsystem, on demand | ticket only; no role file, no automation, no key |
| `shared/` | platform | contracts, triggers, metrics, decision index used by all lanes |

# COMMUNICATION CONTRACT

```text
owner intention
  -> queue ticket (class, not-before, superseded-by, scopeRequested, acceptance, evidence)
  -> operator assigns to one lane on one slot
  -> lane reply artifact ("answered:", proof path, requests:, money truth)
  -> operator judges against live ground truth, then:
       approve  -> done
       revise   -> same worker session, max 3 rounds
  -> status.md + economy.json + decisions.json
```

- A ticket is one self-contained unit. `class` is `money`, `product`, or `measurement`.
- Review messages use a closed label set: `[LANE-REPORT <lane>]`, `[LANE-REVIEW operator -> <lane>]`, `[LANE-APPROVAL operator -> <lane>]`. Labels live in visible text because metadata is not model-visible.
- Messages are notifications and pointers. Git artifacts are the source of truth.
- `docs/proof/**` stays where it is: it records what actually happened, not how a lane should work.

# TRIGGERS AND CAPACITY

- Operator hourly run: `aut_2164ffcfd001KHx72ub2lmEtrT` (1 hour, Asia/Jakarta).
- Watchdog: `aut_2176da47e001Cmh2bDVBUDj5Nn` (10 minutes).
- Dispatchers: `:25`, `:35`, `:45` via repository `dispatch.ts`, one credential each.
- One public send per day; the Statement Harbor send has exactly one active automation.
- Terminal session outcome frees a lane; `not-before` and `superseded-by` prevent starvation; money first, then product.
- Production operations (migrations, edge deploys, CRX signing) stay behind one lock, outside this area.

# OBSERVABILITY

Black-box (buyer view): first-screen claim versus real `doctor` output, click-to-PayPal path, 390/1440 layout, public listing PR state.

White-box (operator view): queue markers, session heartbeats, process table, dispatcher dry-run, CI checks.

Golden signals adapted: traffic = browsers that acted, not page probes; errors = buy clicks without settlement, claims without proof, tickets without replies; latency = ticket -> verified reply -> deploy; saturation = busy slots, rpm per key, disk nearing the floor.

DORA metrics are diagnostics for the engineer lane (change lead time, deployment frequency, failed deployment recovery, change fail rate, rework rate), never quotas.

# GUARDRAILS AND STOP CONDITIONS

- One bounded public action per day; public business contacts only; easy no; disclosure; no invented claims.
- Two negative replies stop a recipient; three refusals stop the lane until the owner says otherwise.
- No self-payment, sandbox settlement, wallet balance or opened invoice counted as revenue.
- Review loop ends on `APPROVED` or at round four; a missing/failed reviewer is written as a gap, not retried indefinitely.
- A dead worker session is replaced by a new session for the same ticket; the round count does not reset.

# MIGRATION FROM THE CURRENT TREE

- Copy, do not delete: operative mandates from `docs/agent-roles/<lane>.md` become `agents/<lane>/role.md`; generated agent files still source their Goal from existing role docs until a later decision moves the generator. This spec does **not** change that wiring.
- `docs/decisions.json` keeps every decision; `agents/shared/decisions.md` only indexes and explains them.
- `docs/proof/**`, `docs/automations.md` and `docs/agent-roles/loop/state.md` stay where they are; `agents/shared/triggers.md` explains and links to them.
- `ARCHITECTURE.md` gains one row for `agents/` during implementation, with the owner's request recorded as source.
- The separate pattern-selection spec is superseded by this document and removed; its reasoning and sources are preserved above.

# TESTING AND PROOF

- Gates: `npm test`, `npm run check`, `npm run roles:check`; architecture gate must name every new directory.
- No acceptance gate is weakened; ticket headers and review labels are additive.
- Proof of the pattern is one full observed cycle: operator ticket -> engineer runtime diff and failing-before test -> operator review and approval -> sales one bounded public message -> onboarding first win -> a settled stranger payment. No step may be replaced by a report lacking a live artifact.

# OUT OF SCOPE

- No new lane, no revival of research as a standing role, no `subagent`.
- No change to billing, protocols, public API, or the decision register in this design stage.
- No renaming of `sales-rep` or `onboarding-guide`; the owner chose to keep both names.

# KNOWN GAPS

Found by re-reading the live repository against OWASP GenAI Top 10 (https://genai.owasp.org/llm-top-10/), NIST AI RMF (https://www.nist.gov/itl/ai-risk-management-framework), and Google SRE postmortem culture (https://sre.google/sre-book/postmortem-culture/). These are open holes, not shipped work.

| Priority | Gap | Evidence | Source that names the risk |
|---|---|---|---|
| P0 | The maker-checker loop is design only: `scripts/dev/agent-fleet/message.ts` does not exist and no `synthetic`/`LANE-REPORT` call is wired. | file check | Azure maker-checker needs criteria, cap and fallback |
| P0 | A buyer must create an account before PayPal; click -> "Masuk dulu"; 2 buy clicks, 0 settlements after 34 runs. | live `/harga`, `docs/economy.json` | NIST MEASURE - a metric without an outcome is not management |
| P0 | Every architectural improvement so far still leaves settled revenue at $0.00. | ledger | survival rule: only a stranger's settled payment moves the score |
| P1 | No sender whitelist for `/synthetic` messages to the operator; a lane report can be read as user input (OWASP LLM01/LLM06). | no `metadata.fromAgent` check in the tree | OWASP prompt injection, excessive agency |
| P1 | Generated agent files still source their Goal from `docs/agent-roles/<lane>.md`, not from `agents/<lane>/role.md`. | `generate-agent-roles.ts` | Divio - do not mix reference and how-to |
| P1 | `hosted/functions/navego-feedback` exists but no form reaches it; `/dukungan` asks for a personal Gmail address. | route grep | NIST GOVERN - a channel with no front door is not a channel |
| P1 | No blameless postmortem exists for the dispatcher starvation, four duplicate automations, or the stale `doctor` claim. | no `*postmortem*` proof file | SRE - no postmortem left unreviewed |
| P2 | No AI risk register: 173 decisions record *why*, not risk, likelihood, owner or mitigation. | decision count | NIST MAP/MANAGE |
| P2 | DORA/golden signals are described but not stored as weekly diagnostics in the ledger. | `docs/economy.json` | DORA - measure as a compass, never a target |
| P2 | `agents/` is not created, `ARCHITECTURE.md` has no row for it, and `research-ticket-template.md` does not exist. | path check | Nygard - decisions must live in the repo with the code |

Already closed and not to be reopened: four lanes only, research retired, no `subagent`, one session per key, `not-before`/`superseded-by` ticket headers, terminal-session lane release, `money -> product -> measurement` ordering, one active send automation, `untrustedContent: true` on page reads, one decision register, proof files as ground truth.

Recommended closing order: (1) implement `message.ts` with labelled, whitelisted sender metadata - this closes both the P0 review loop and the P1 injection hole; (2) remove the account-before-PayPal wall; (3) add a feedback form posting to `navego-feedback`; (4) write one blameless postmortem for the dispatcher starvation and duplicate automations; (5) only then create `agents/`, the risk register and the weekly diagnostics.

# OPEN ITEM FOR IMPLEMENTATION PLANNING

How to keep generated agent files consistent once a lane's Goal lives in `agents/<lane>/role.md`: either keep `docs/agent-roles/<lane>.md` as the generated source and link to the new folder, or change `scripts/dev/generate-agent-roles.ts` to read the new area. The owner must choose before implementation.
