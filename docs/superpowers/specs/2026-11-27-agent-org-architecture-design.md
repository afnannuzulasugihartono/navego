# @last-edited: 2026-11-27 UTC+7.
# @title: agent organisation architecture - one repo area for the four agent lanes, their contracts, triggers and documents.
# @state: design spec, awaiting owner review. No implementation is approved by this document.
# @dependencies: `docs/agent-roles/registry.json`, `docs/agent-roles/job-descriptions.md`, `docs/autonomy.md`, `docs/decisions.json`, `ARCHITECTURE.md`.

# WHY THIS EXISTS

The four active lanes - `operator`, `engineer`, `sales-rep`, `onboarding-guide` - currently have their mandates, prompts, contracts, triggers and evidence scattered across `docs/agent-roles/`, `docs/automations.md`, `docs/proof/`, automations and generated agent files. The owner asked for **one separate area at the root of the repository** that holds everything about the agent organisation, with a folder per agent and no mixing with product documentation.

This spec defines that area. It does not move `docs/proof/**`, change any gate, or add an agent.

# SOURCES (opened, not assumed)

1. Michael Nygard, *Documenting Architecture Decisions* (2011) - https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
   - Small modular decision records belong in version control with the code. Large documents are never maintained. A reversed decision is kept and marked superseded, not deleted.
2. Divio, *The Documentation System* and *About the structure* - https://documentation.divio.com/ , https://documentation.divio.com/structure/
   - Four distinct documentation functions: tutorial, how-to, reference, explanation. They naturally collapse into one another; separating sections protects both author and reader.
3. Team Topologies, *Key Concepts* - https://teamtopologies.com/key-concepts
   - Four team types: stream-aligned, enabling, complicated-subsystem, platform. Flow of work outranks org chart.
4. Anthropic, *Building effective agents* - https://www.anthropic.com/engineering/building-effective-agents
   - Orchestrator-workers, evaluator-optimizer, ground truth from the environment, human checkpoints, iteration limits, and deliberate agent-computer interface design.
5. DORA, *Four keys* - https://dora.dev/guides/dora-metrics-four-keys/
   - Throughput and stability are correlated, not traded. Metrics are diagnostics, not targets; Goodhart's law is called out.
6. Google SRE, *Monitoring Distributed Systems* - https://sre.google/sre-book/monitoring-distributed-systems/
   - Four golden signals; symptom versus cause; alerts must be actionable, low-noise, and must not require staring at a screen.
7. Google Engineering Practices - https://google.github.io/eng-practices/review/developer/small-cls.html , https://google.github.io/eng-practices/review/reviewer/looking-for.html
   - One self-contained change with its test; review design, user functionality, complexity, naming, comments and tests.

# CONSTRAINTS INHERITED FROM THIS REPOSITORY

- Four active lanes only: `operator`, `engineer`, `sales-rep`, `onboarding-guide`. Research was retired (`docs-agent-roles-13`) and lives as a bounded ticket, not a lane.
- No `subagent` action in any generated role file; one session per credential slot; dispatcher orders `money -> product -> measurement`.
- `docs/decisions.json` is the **single decision register**; `docs/proof/**` is the **record of real runs**. Neither is duplicated.
- `gates.lock`, boundary locks, `.github/CODEOWNERS` and workflows are owner-only and untouched by this design.
- `ARCHITECTURE.md` enumerates top-level entries; a new root folder needs one added row. Because the owner directly asked for a root-level agent area, that row is an owner-directed deviation and must be recorded in the decision register during implementation.

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
    research-ticket-template.md  # how-to: how to buy research without a standing lane
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

Divio mapping: `README`/`ARCHITECTURE` and `*/role.md` are reference/explanation; `runbook`, `product-contract`, `outreach-policy`, `first-win`, `handoff` and `research-ticket-template` are how-to; `proof-block`, `metrics`, `contracts`, `triggers` and `decisions` are reference; `review-loop` and the `decisions` narrative are explanation. No single file mixes the four functions.

# ROLE TOPOLOGY (Team Topologies adapted)

| Lane | Topology | Why |
|---|---|---|
| operator | enabling + orchestrator | makes other lanes able to work; does not do their product work |
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
- A review message carries a closed label set: `[LANE-REPORT <lane>]`, `[LANE-REVIEW operator -> <lane>]`, `[LANE-APPROVAL operator -> <lane>]`. The label is in the visible text because metadata is not model-visible.
- Messages are notifications and pointers. Git artifacts are the source of truth.
- `docs/proof/**` stays where it is: it records what actually happened, not how a lane should work.

# TRIGGERS AND CAPACITY

- Operator hourly run: `aut_2164ffcfd001KHx72ub2lmEtrT` (1 hour, Asia/Jakarta).
- Watchdog: `aut_2176da47e001Cmh2bDVBUDj5Nn` (10 minutes).
- Dispatchers: `:25`, `:35`, `:45` via the repository `dispatch.ts`, one credential each.
- One public send per day; the Statement Harbor send has exactly one active automation.
- Terminal session outcome frees a lane; `not-before` and `superseded-by` prevent starvation; money tickets first, then product.
- Production operations (migrations, edge deploys, CRX signing) stay behind one lock, outside this area.

# OBSERVABILITY

Black-box (what a buyer sees): first-screen claim versus real `doctor` output, click-to-PayPal path, 390/1440 layout, public listing PR state.

White-box (what the operator sees): queue markers, session heartbeats, process table, dispatcher dry-run, CI checks.

Golden signals adapted:
- traffic = browsers that acted, not page probes;
- errors = buy clicks without settlement, claims without proof, tickets without replies;
- latency = ticket -> verified reply -> deploy;
- saturation = busy slots, rpm per key, disk nearing the floor.

DORA metrics are read as diagnostics for the engineer lane (change lead time, deployment frequency, failed deployment recovery, change fail rate, rework rate), never as quotas.

# GUARDRAILS AND STOP CONDITIONS

- One bounded public action per day; public business contacts only; easy no; disclosure; no invented claims.
- Two negative replies stop a recipient; three refusals stop the lane until the owner says otherwise.
- No self-payment, sandbox settlement, wallet balance or opened invoice counted as revenue.
- Review loop ends on `APPROVED` or at round four; a missing/failed reviewer is written as a gap, not retried indefinitely.
- A dead worker session is replaced by a new session for the same ticket; the round count does not reset.

# MIGRATION FROM THE CURRENT TREE

- Copy, do not delete: the operative mandates from `docs/agent-roles/<lane>.md` become `agents/<lane>/role.md`; generated agent files still source their Goal from the existing role docs until a later decision moves the generator. This spec does **not** change that wiring.
- `docs/decisions.json` keeps every decision; `agents/shared/decisions.md` only indexes and explains them.
- `docs/proof/**`, `docs/automations.md` and `docs/agent-roles/loop/state.md` stay where they are; `agents/shared/triggers.md` explains them and links to them.
- `ARCHITECTURE.md` gains one row for `agents/` in the implementation stage, with the owner's request recorded as source.

# TESTING AND PROOF

- Documentation/hygiene gates: `npm test`, `npm run check`, `npm run roles:check`; the architecture gate must name every new directory.
- No acceptance gate is weakened; ticket headers and review labels are additive.
- The real proof of this architecture is one full cycle: operator ticket -> engineer runtime diff + test -> operator review -> approval -> sales send -> onboarding first win -> a settled stranger payment (which alone moves the score).

# OUT OF SCOPE

- No new lane, no revival of research as a standing role, no `subagent`.
- No change to billing, protocols, public API, or the decision register in this design stage.
- No renaming of `sales-rep` or `onboarding-guide`; the owner chose to keep both names.

# OPEN ITEM FOR IMPLEMENTATION PLANNING

How to keep generated agent files (`/.opencode/agents/`, `/.claude/agents/`) consistent once a lane's Goal lives in `agents/<lane>/role.md`: either keep `docs/agent-roles/<lane>.md` as the generated source and link to the new folder, or change `scripts/dev/generate-agent-roles.ts` to read the new area. The owner must choose before implementation.
