# Research: does finding weaknesses improve product quality? (2026-11-28 10:00 WIB)

## Answer

Yes for correctness, reliability and security; no for customer value. RF-017 records six sources. Chaos Engineering says to find weaknesses before customers and automate the search; OSS-Fuzz reports 10,000+ vulnerabilities and 36,000 bugs fixed; SRE says an unreviewed postmortem might as well not exist; Anthropic turns real failures into 20–50 deterministic regression tasks; DORA warns that making a metric a target invites gaming.

## Our own evidence

Real defects were found and fixed — canonical markup, the guest edge, a false buyer-reply signal, an unreachable claim, stale FAQ answers — each with a failing test first and green CI. Yet GitHub shows 0 stars, Google 0 indexed pages, listing PR remains OPEN, and settled external revenue $0.00. All findings were internal; none came from a customer. So the practice raised technical quality but did not create demand.

## What follows

Keep the practice, but define the steady state as settled money, a stranger's first result and a return visit. Only count a weakness with a preventive action and an owner. Convert real failures into a small regression suite. Stop when the evidence says the behaviour is already right.

## Money

Settled external revenue remains $0.00, 0 orders; score −86.
