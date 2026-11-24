---
id: ai-subscription-prices-2026-11
title: AI subscription and API prices checked on 2026-11-24
kind: pricing
source: https://www.anthropic.com/pricing
observed: 2026-11-24
---

# AI subscription and API prices, 2026-11-24

Prices change. Every number here carries the source it was read from and the date it was observed, so a later run can tell a fresh price from a stale one.

## Subscriptions

| Product | Price | Source |
|---|---|---|
| Claude Pro | $20/month, or $17/month billed annually | https://www.anthropic.com/pricing |
| Claude Max | $100/month | https://www.anthropic.com/pricing |
| Claude Ultra | $200/month | https://www.anthropic.com/pricing |
| Google AI Plus (Indonesia) | Rp 75.000/month | https://gemini.google/subscriptions |
| Google AI Pro (Indonesia) | Rp 309.000/month | https://gemini.google/subscriptions |
| Google AI Ultra (Indonesia) | Rp 1.579.000/month | https://gemini.google/subscriptions |
| ML.ai Infinite | $99/month, $50/month for the first three months, first 30 days free | https://ml.ai/ |

ChatGPT individual prices were not readable from the pricing page without a sign-in on 2026-11-24, so no ChatGPT price is recorded here. A missing number is not a zero.

## API prices used for a pay-as-you-go comparison

| Model | Input per 1M tokens | Output per 1M tokens | Source |
|---|---|---|---|
| Claude Sonnet 5.5 | $2 | $10 | https://platform.claude.com/docs/en/about-claude/pricing |
| Claude Haiku 5.5 (prompt up to 100k tokens) | $0.10 | $0.50 | https://platform.claude.com/docs/en/about-claude/pricing |
| Claude Opus 5.5 | $4 | $20 | https://platform.claude.com/docs/en/about-claude/pricing |
| GPT-6.1 Sol | $2 | $10 | https://developers.openai.com/api/docs/pricing |
| GPT-6.1 Terra | $1 | $5 | https://developers.openai.com/api/docs/pricing |
| GPT-6 Luna | $0.10 | $0.50 | https://developers.openai.com/api/docs/pricing |
| Gemini 4 Carbon (through 2026-11-30) | $2 | $10 | https://aistudio.google.com/docs/pricing |

Batch processing costs half the standard token rate on both Anthropic and OpenAI. Gemini 4 Carbon returns to $4/$20 on 2026-12-01, so a run that compares monthly cost must use the price that applies on the day of the call.

## Capability evidence

Terminal-Bench 4.1 on 2026-11-24 lists Claude Opus 5.5 at 65.8% resolution, Gemini 4 Carbon at 64.5%, Claude Sonnet 5.5 at 63.9%, GPT-6.2 Astra at 62.1%, and GPT-6.2 Sol at 61.5%. Source: https://www.tbench.ai/

Artificial Analysis Intelligence Index v5 (2026-10-27) puts Claude Opus 5.5 at 58, GPT-6 Astra at 57, and GPT-6.1 Sol at 55, and names GPT-6.1 Sol as the cheapest of the leaders at $1.27 per index task against $10.04 for Opus 5.5. Source: https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v5

## Rules the loop follows

1. A subscription is bought only out of revenue that already arrived, and only while half the cash stays in reserve.
2. An upgrade needs a source for its price and a source for its capability. No source, no upgrade.
3. A consumer subscription plan (Claude Pro, Google AI Pro) is for a person on one account. A gateway plan (ML.ai Infinite) is the candidate for an agent that must run unattended.
4. Anthropic's consumer terms forbid accessing Claude.ai through automated or non-human means unless Anthropic explicitly permits it. A consumer subscription is therefore not the road for unattended agent inference; an API key or a gateway plan is. Source: https://www.anthropic.com/legal/consumer-terms
5. OpenAI's terms forbid automatically or programmatically extracting data or output, but do not grant an agent a general right to act autonomously either; the service terms and the usage policies still apply. Source: https://openai.com/policies/row-terms-of-use
