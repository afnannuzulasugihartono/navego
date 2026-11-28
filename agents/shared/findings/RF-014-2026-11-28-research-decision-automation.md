# RF-014 — automating the decision to research (2026-11-28)

Decision supported: a deterministic gate decides whether a research ticket runs, before any agent is dispatched.

## The question

The owner asked for credible sources on automating decisions for research agents. The useful distinction is between **doing** research and **deciding whether to do it**. The second is mostly deterministic and should not consume a model run.

## Sources

| Source | What was taken |
|---|---|
| Anthropic, Building effective agents — https://www.anthropic.com/engineering/building-effective-agents | Routing classifies an input and directs it to a specialised downstream task; orchestrator-workers are justified for search tasks that gather and analyse information from multiple sources, where subtasks are not predictable. Simple composable patterns beat complex frameworks. |
| Microsoft, AI Agent Orchestration Patterns — https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns | When the next step is identifiable from the initial input, use **deterministic routing or a simpler dispatcher that does not take an agent decision**. Maker-checker loops need explicit acceptance criteria, an iteration cap and a fallback. Concurrency is wrong under quota limits. |
| Anthropic, Demystifying evals for AI agents — https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents | Research-agent grading combines groundedness (claims supported by sources), coverage (key facts present) and source quality (authoritative, not merely first retrieved). Grade the outcome, not the transcript. Prefer deterministic graders; 20-50 real failures are enough to start. |
| OpenAI, Introducing deep research — https://openai.com/index/introducing-deep-research/ | A research agent learns to plan and execute a multi-step trajectory, backtracking as information arrives. OpenAI notes it can hallucinate, struggles to separate authoritative sources from rumours, and has weak confidence calibration. The 2026 update added restriction of web search to trusted sites and real-time interruption. |
| Google SRE, Eliminating Toil — https://sre.google/sre-book/eliminating-toil/ | Manual, repetitive, automatable work that leaves the system unchanged is a bug. Human judgment is not a valid excuse when better design removes the need for it. |
| OpenAI, A practical guide to building agents — https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf | Explicit exit conditions per run; guardrails added from real failures; high-risk actions stay behind human thresholds. |

## Design implemented

`scripts/dev/agent-fleet/research-gate.ts` turns a research ticket into a verdict before dispatch:

- `run` — a decision is named, at least one `https://` source is listed, the reading date is fresh, the destination is a valid `RF-<number>-<ISO date>-<slug>.md`, and no recent finding answered the same decision from the same URL.
- `skip` — the ticket asks for outreach, or a recent finding already covers the decision and source.
- `needs-human` — the ticket is incomplete: no decision, no public URL, no valid date, or no numbered destination.

Seven failing tests were written first and watched fail, then all pass. The CLI prints the ticket, the number of prior findings and the verdict with its reasons; exit codes are 0/1/2 so an automation can branch on them. The ticket template now requires the gate to run before dispatch.

## What is deliberately not automated

The gate does not judge whether a source is *authoritative*, whether a synthesis is *complete*, or whether the finding is *true*. Those remain model-and-human work, graded by the outcome checks described above. Automating them with a string match would be a claim that outruns the evidence. The gate removes only the decisions that are already certain from the ticket itself.
