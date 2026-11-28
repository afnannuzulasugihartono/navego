# RF-002 — agent orchestration patterns (2026-11-27)

Decision supported: how the four active lanes coordinate without a fifth lane or a subagent.

| Source | What was taken |
|---|---|
| Team Topologies, Key Concepts — https://teamtopologies.com/key-concepts | Stream-aligned, enabling, complicated-subsystem and platform topologies; flow over structure. Maps to operator (enabling), three lane streams, research as a ticket, shared/ as platform. |
| Anthropic, Building effective agents — https://www.anthropic.com/engineering/building-effective-agents | Orchestrator-workers, evaluator-optimizer, ground truth at each step, human checkpoints, iteration caps and tool-interface documentation. |
| Microsoft Azure, AI Agent Orchestration Patterns — https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns | Use the least complex pattern; maker-checker needs explicit criteria and a cap; concurrent orchestration is wrong when quota is constrained. |
| AWS, multi-agent collaboration — https://docs.aws.amazon.com/bedrock/latest/userguide/agents-multi-agent-collaboration.html | Supervisor plus collaborators with minimally overlapping responsibilities. |
| DORA, Four keys — https://dora.dev/guides/dora-metrics-four-keys/ | Throughput and stability correlate; metrics are diagnostics, not quotas (Goodhart). |
| Google SRE, Monitoring / SLO / Eliminating Toil / Postmortem — https://sre.google/sre-book/monitoring-distributed-systems/ | Four golden signals; symptom vs cause; few SLIs; a human touching the system in normal operation is a bug; postmortems need action items and review. |
| FinOps Foundation — https://www.finops.org/introduction/what-is-finops/ | The goal is business value from technology, not cost cutting for its own sake. |
| Google Engineering Practices — https://google.github.io/eng-practices/review/developer/small-cls.html | Small self-contained change with its test; review design, user functionality, complexity, naming, comments that explain why. |
| OpenAI, Working with evals — https://platform.openai.com/docs/guides/evals | The durable pattern is ground truth plus grader plus iteration; the Evals platform itself shuts down 2026-11-30, so do not depend on it. |

Applied in the repo: one operator supervisor, manager-checker review loop capped at three rounds with `APPROVED`, money-first dispatch, one session per key, no subagent. Research is a bounded ticket, not a standing lane. Full design: docs/superpowers/specs/2026-11-27-agent-org-architecture-design.md.
