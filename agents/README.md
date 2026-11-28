# Agents

One area of this repository for the agent organisation: four active lanes, their contracts, triggers, metrics and working documents. It is not a new product and it is not a fifth lane.

Active lanes: operator, engineer, sales-rep, onboarding-guide. Research is retired as a lane and is bought as a bounded ticket from shared/research-ticket-template.md.

The generated agent files still take their Goal from docs/agent-roles/<lane>.md. Folders here are the human-readable operating guides; this keeps scripts/dev/generate-agent-roles.ts and its gate untouched. See docs/superpowers/specs/2026-11-27-agent-org-architecture-design.md for the design and the known gaps.

Ground truth lives in docs/proof/** and the single decision register in docs/decisions.json. Messages between sessions are notifications and pointers, never the source of truth. Dated research summaries from any lane live in shared/findings/, indexed by shared/findings/index.md.
