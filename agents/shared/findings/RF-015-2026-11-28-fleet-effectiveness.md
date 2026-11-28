# RF-015 — what actually makes an agent fleet effective (2026-11-28)

## Question

The owner is the sole maintainer, has no team and no strong software-programming background, and uses agents as the workforce. How should the fleet be upgraded so it becomes effective rather than merely busy?

## Measured starting point

`automation.list` shows 29 operator runs, 242 watchdog runs and 40/41/41 dispatcher runs. PRs #531–#544 merged, `npm test` and `npm run check` green on each. Meanwhile GitHub shows Navego at 0 stars, 0 forks, 0 settled external payments, score −83, Google holding zero indexed pages, and listing PR #20598 still Open with 6 of 7 comments ours. **Throughput is high; outcome is zero.** The upgrade target is the gap between those two, not more agents.

## New sources

| Source | What was taken |
|---|---|
| Qian et al., ChatDev: Communicative Agents for Software Development, ACL 2024 — https://arxiv.org/abs/2307.07924 | Specialised agents are guided both in *what* to communicate (chat chain) and *how* (communicative dehallucination). Natural language helped system design; programming language helped debugging. Role specialisation alone is not enough — the communication protocol is part of the system. |
| Hong et al., MetaGPT: Meta Programming for A Multi-Agent Collaborative Framework — https://arxiv.org/abs/2308.00352 | Encoding Standardized Operating Procedures into prompt sequences lets agents verify intermediate results and reduces cascading hallucinations. An assembly line of roles produced more coherent solutions than naive chat chains. Our runbooks are SOPs in prose; the verification is not yet machine-enforced between steps. |
| Amershi et al., Guidelines for Human-AI Interaction, CHI 2019 — https://www.microsoft.com/en-us/research/publication/guidelines-for-human-ai-interaction/ | 18 guidelines validated with 49 design practitioners. Human-facing AI must make its state and limits legible. With one owner and no second reviewer, the interface between owner and fleet is the review surface; it must show what the agent did and what it did not do. |
| OpenTelemetry, GenAI semantic conventions — https://github.com/open-telemetry/semantic-conventions-genai | Spans, metrics and events for GenAI clients and MCP now have a dedicated convention repository. Observability is a first-class part of agent systems, not an afterthought. Our proof files are prose; the comparable machine-readable layer is missing. |
| Anthropic, Demystifying evals for AI agents — https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents | Grade the outcome, not the transcript; prefer deterministic graders; 20–50 tasks from real failures are enough to start; regression evals should stay near 100%. Our false receipts and false buyer-reply signal are exactly the real failures that should become regression tasks. |
| Microsoft, AI Agent Orchestration Patterns — https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns | Use the lowest complexity that works; deterministic routing when the next step is identifiable; maker-checker needs explicit acceptance criteria, an iteration cap and a fallback. |
| Google SRE, Eliminating Toil — https://sre.google/sre-book/eliminating-toil/ | Manual, repetitive work that leaves the system unchanged is a bug. A human touching normal operations is a bug until the system is redesigned. |

## Diagnosis

1. **The fleet has SOPs but no enforced handoffs.** `agents/*/runbook.md` and contracts describe roles; proof files are written by the same session that did the work. MetaGPT's finding applies: intermediate verification must be a step, not a hope.
2. **The selector decides but nobody deterministic executes.** `goal.ts` prints one action; a model still performs it. That is the largest remaining manual touch.
3. **The research gate is built but unused.** `research-gate.ts` has 8 passing tests and is not called by dispatch. A gate that is not wired is not a gate.
4. **Two lanes are structurally idle.** Sales-rep is blocked by a maintainer of another repo; onboarding-guide waits for a buyer who does not exist. With no team, four lanes create coordination cost without throughput.
5. **Observability is prose.** Proof files are readable by people but not by the selector. The false buyer-reply signal came from reading a README example; a machine-readable reply register would have been unambiguous.

## Upgrade order

1. **Executor for deterministic classes.** New `scripts/dev/agent-fleet/executor.ts`, driven by `goal.ts`: close answered tickets, mark blockers, prepare PR bodies, verify the live artefact. Each handler gets a test and an exit condition. Merge and deploy stay behind the existing gates.
2. **Wire the research gate into dispatch** so `skip` and `needs-human` never consume a model run.
3. **Machine-readable outcome signals.** Replace prose-only markers with a small JSON register for replies, receipts and settlements; the selector reads that, the proof file remains the human explanation. This is the OpenTelemetry lesson applied at our scale — no new subsystem, just one stable shape.
4. **Turn known failures into regression tasks** in the spirit of Anthropic's eval guidance: a README example must not count as a buyer; a queued message must not count as sent; a buy click must not count as revenue. Each already has a test; group them under one gate that every run must pass.
5. **Collapse idle lanes into tickets** until a buyer exists. Fewer roles, less coordination, same work.
6. **Keep the reviewer gap honest.** With one key and subagents denied, an independent reviewer cannot be manufactured. A scheduled separate session can read the evidence bundle; if it cannot run, write the gap. Never relabel self-review as review.

## What not to do

Add more features, add metrics without an action, ask for secrets or cash, weaken a gate to make CI green, or treat more PRs as progress. The score moves only when a stranger's money settles.

## Status

This finding changes no product code and no gate. Settled external revenue remains $0.00, 0 orders.
