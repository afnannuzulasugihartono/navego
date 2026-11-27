# Agent architecture at a glance

Topology (from Team Topologies and the AWS supervisor model):

- operator: enabling + supervisor. Decomposes one outcome into one bounded ticket, judges the reply against live evidence, and does not do another lane's product work.
- engineer: stream-aligned product lane. One runtime change with its failing-before test, from source to deploy.
- sales-rep: stream-aligned revenue lane. One public surface per day, recorded the same day.
- onboarding-guide: stream-aligned activation lane. One command, one check, one real file.
- shared: the platform contracts, triggers, metrics and decision index used by all four.

Flow:

owner intention -> queue ticket -> operator assigns to one lane on one slot -> lane reply artifact -> operator judges live evidence -> approve or review -> status.md + economy.json + decisions.json

Product work uses a maker-checker loop: engineer reports, operator reviews in the same worker session, maximum three revisions, then approval or a fresh ticket. A positive buyer reply hands off from sales-rep to onboarding-guide with the proof block.

No subagent. One session per credential slot. Dispatcher order: money, then product, then measurement.

Authoritative sources are linked in docs/superpowers/specs/2026-11-27-agent-org-architecture-design.md.
