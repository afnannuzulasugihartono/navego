# RF-006 — metrics for agents doing full business work (2026-11-27)

Decision supported: keep five derived metrics; no manual metric entry and no targets before a baseline.

| Source | What was taken |
|---|---|
| DORA, Four keys — https://dora.dev/guides/dora-metrics-four-keys/ | Change lead time, deployment frequency, failed deployment recovery, change fail rate, rework rate; speed and stability correlate; Goodhart's law. |
| Google SRE, Monitoring / SLO / Eliminating Toil — https://sre.google/sre-book/monitoring-distributed-systems/ | Four golden signals; symptom vs cause; few SLIs; a human touching normal operations is a bug. |
| FinOps Foundation — https://www.finops.org/introduction/what-is-finops/ | Business value from technology, not cost cutting as an end. |
| NIST AI RMF — https://www.nist.gov/itl/ai-risk-management-framework | GOVERN, MAP, MEASURE, MANAGE. |
| OWASP GenAI Top 10 — https://genai.owasp.org/llm-top-10/ | Prompt injection, sensitive disclosure, excessive agency, unbounded consumption. |
| OpenAI, Working with evals — https://platform.openai.com/docs/guides/evals | Ground truth plus grader plus iteration; platform deprecated 2026-11-30. |
| OpenTelemetry GenAI semconv — https://opentelemetry.io/docs/specs/semconv/gen-ai/ | Token/span conventions exist but adopting them now would add a new subsystem. |

Conclusion recorded in agents/shared/metrics.md: settled_usd, monthly_cost_usd, buy_to_settlement, public_actions_today, fabricated_revenue_count. Derived from existing events; no new daemon; targets only after seven days of real data. The other metrics stay candidates.
