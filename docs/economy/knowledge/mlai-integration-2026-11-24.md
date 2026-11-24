---
id: mlai-integration-2026-11-24
title: ML.ai is the unattended gateway in the loop, and its key already works
kind: integration
source: https://code.ml.ai/docs/reference/api
observed: 2026-11-24
---

# ML.ai in the loop, measured on 2026-11-24

## What the key does

The key the owner supplied starts with `mlai_sk_`. It authenticates against ML AI Code at `https://code.ml.ai`, and the account answers:

- `GET /api/routines` → 200, one routine: **Review navego**, id `f1751e68-d607-4538-aade-8b9501bba259`, trigger `github`.
- `GET /api/health` → 200, with the database, auth, billing, sandbox and the model routes (`model:pixis`, `model:forge`, `model:gateway`) all reporting `ok`.

The key lives in OMP's credential store under provider `mlai` (`omp token mlai`), so it is never written into this repository and never printed into a transcript.

## What the agent can reach from OMP

The tool `mlai_routine` in OMP's user tool folder does two things:

1. `action=list` — lists the account's routines with their ids and triggers.
2. `action=run` — starts one routine by id. It refuses without `confirm:true`, because a run spends the ML.ai account, and it accepts an `idempotency-key` so a retried call returns the earlier run instead of starting another.

The routine that already exists is a GitHub-triggered review of Navego. That is the shape the loop wants: the agent hands work to ML.ai, ML.ai opens the pull request, and the owner reviews the merge.

## Why this is the subscription candidate

- ML.ai Infinite is a coding-agent plan at $99/month ($50/month for the first three months, first 30 days free), not a consumer chat subscription. Source: https://ml.ai/
- Anthropic's consumer terms forbid automated or non-human access to Claude.ai unless Anthropic permits it, so Claude Pro cannot be the unattended road. Source: https://www.anthropic.com/legal/consumer-terms
- The API is a routine trigger with an idempotency key and a bounded input (up to 256 KB), which fits the loop's rule that the agent prepares the work and the account runs it.

## The rules the loop keeps

1. The ML.ai account is the agent's own capability budget. A run counts as a cost event in the ledger, with `decisionId` naming the routine.
2. The key stays in OMP's credential store. It is never copied into `docs/economy/`, into a commit, or into a knowledge note.
3. A run is started only when the owner asked for that work. `mlai_routine run` refuses without `confirm:true` for the same reason `navego economy spend` refuses when the reserve is short.
4. The result of a run (the pull request, the diff) is the evidence that the cost produced value. A run with no usable result is minus.
