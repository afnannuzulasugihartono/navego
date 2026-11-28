# Decision automation for research (2026-11-28 05:15 WIB)

## Answer

Automating research decisions does not mean letting a model decide everything. It means moving the decisions that are already certain from the ticket itself into code, so a model is never dispatched to discover them. RF-014 records six primary sources: Anthropic on routing and orchestrator-workers, Microsoft on deterministic routing versus handoff, Anthropic on research-agent graders (groundedness, coverage, source quality), OpenAI on deep-research limitations and trusted-site restriction, Google SRE on toil, and OpenAI on exit conditions and risk thresholds.

## What changed

`scripts/dev/agent-fleet/research-gate.ts` reads a research ticket and returns:

- **run** — a decision is named, an `https://` source exists, the date is fresh, the destination is `RF-<number>-<ISO date>-<slug>.md`, and no recent finding answered the same decision from the same URL;
- **skip** — the ticket asks for outreach, or a recent finding already covers it;
- **needs-human** — the ticket is incomplete.

Seven failing tests were written first and watched fail; all pass after implementation. The CLI was driven against a real ticket file with the live findings index (14 prior findings) and returned `run` with empty reasons. Exit codes are 0/1/2 so an automation can branch without parsing prose. The research ticket template now requires the gate before dispatch.

## Boundary

The gate does not decide whether a source is authoritative or a synthesis is complete. OpenAI's own deep-research note says those systems can still hallucinate and misjudge source quality, so automating them with a string match would be false confidence. Those decisions stay with the agent and human review.

## Money

Settled external revenue remains $0.00, 0 orders. This is automation of decision plumbing, not a customer payment.
