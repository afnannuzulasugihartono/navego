# @last-edited: 2026-11-20 UTC+7.
# @title: backend-language-evaluation - the Rust/Go question, the GPT audit, and the decision.
# @state: decision recorded; Rust/Go deferred, not banned. Deno check and site typecheck are in CI; MCP tool arguments are validated at runtime (tool-schema, apply-migrations env, site auth responses), and the remaining boundaries are named below.
# @dependencies: docs/handoff.md, package.json, .github/workflows/ci.yml, ARCHITECTURE.md.

# Why this file exists

A ChatGPT audit (branch `main`) claimed:

1. Architecture gates block Rust/Go, which is why AI "refused" them.
2. Backend code is TypeScript/Deno, and TypeScript is not strict enough to prevent AI errors.
3. Therefore: Rust-first backend, TypeScript only in browser; Go as fallback.

That audit was generated against a stale branch (before the 2026-11-17 full migration of all `.mjs` to `.ts`), and its premises don't survive contact with the tree as it exists today. This file records the honest assessment so the next person does not have to re-litigate it from scratch.

# What the audit got right

- **`deno check` is not wired into CI** — closed 2026-11-19: `ci.yml` runs `deno check` on every `hosted/functions/*/index.ts` in the `deno-hosted` job.
- **Website `typecheck` is not an explicit CI step** — closed 2026-11-19: the `site` job runs `npm run typecheck --prefix site`.
- **Arithmetic on counts** — "844 entries", "221 .mjs" — are snapshots; the current tree differs (everything is `.ts` now, tests pass, `npm run check` is green).
- **Schema validation at system boundaries** — partially closed: `local/tool-schema.ts` validates every MCP tool call against the same `inputSchema` the client receives (required keys, types, bounds, enums, closed objects). Closed 2026-11-20: env vars at `scripts/release/apply-migrations.ts` (the `SUPABASE_ACCESS_TOKEN` shape, the `SUPABASE_PROJECT_REF` shape); site auth refresh responses at `site/app/lib/auth.ts` (access/refresh token shapes). Database row shapes proven by migration CHECK constraints and `tests/hosted/integration-postgres.test.ts`. Still open: hosted-function inputs and the site's fetch bodies. TypeScript's strictness is erased at runtime, so any boundary parsing JSON needs a validator, not just a type.
- **`CODEOWNERS` ownership is declared but branch protection/rulesets could not be verified programmatically** — closed 2026-11-20: `main` now requires the five CI jobs (`unit`, `site`, `deno-hosted`, `secret-scan`, `browser`) as required checks with `strict` verification, `enforce_admins` is on, force pushes and deletions are refused, dismiss-stale-approvals is on, and every pull request needs an approving review with code-owner sign-off on the gatekeeper surface (`tests/`, `scripts/`, `gates.lock` and the rest of `.github/`) - decisions.json -> docs-branch-protection-01.

# What the audit got wrong or outdated

- "AI refuses Rust because of `ARCHITECTURE.md`" — the gate does not forbid Rust or Go per se; it constrains the shape of the repo (root-level allowed directories, import direction, extra dependencies). Adding `backend/` with a Cargo workspace would need an architecture amendment, which is a deliberate product/architecture decision, not an accident of the tool.
- TypeScript strict is already strong in this tree: `tsconfig.base.json` already sets `strict`, `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noEmitOnError`. Product code compiles with zero errors.
- A full Rust port would not fix "AI ships stubbed logic" — AI can emit `todo!()` / `unimplemented!()` / empty `match` in Rust too. The wrong move is choosing a language to solve a process problem.
- Rust makes the **local agent** (the product on users' machines alongside their everyday browsers) harder to reason about for end-users (install, permissions, debugging) and harder to ship; the npm install path is already live (`npm i -g opera`) and the `opera doctor` flow works against it.
- "Rust-first" for a solo founder without backend engineers would consume months of solo runway for no revenue-facing improvement.

# What shipped between audit and this record

- All `.mjs` sources in the repo migrated to `.ts` (tests, scripts, helpers). The `biome` rule for `noExplicitAny` and `noTsIgnore` is pinned **error** in `biome.json`. `tsconfig.tooling.json` covers all scripts and tooling with strict settings; zero errors today.
- `tests/tooling/type-debt.ts` + `type-debt.lock` — the strict-TS debt in tests/legacy is **ratcheted**: it can go down, never up. Today's baseline is recorded.
- `npm run check` is green, `npm run types` is green, 286 tests green, `npm run check` covers the surface, `cargo`/Rust deliberately untouched.
- `@supabase/supabase-js`, `@supabase/edge-runtime` still **not** installed (no runtime need yet; hosted functions are tested against live production via Supabase CLI / dashboard).

# The decision

**Do not port any backend code to Rust or Go now.** Keep the architecture split:

- Browser extension, local driver, shared core, website — TypeScript strict, zero errors, gated.
- Hosted functions — TypeScript/Deno, strict, wired into CI with `deno check`.
- Runtime boundaries — MCP tool arguments validated in `local/tool-schema.ts`; env vars validated at `scripts/release/apply-migrations.ts`; site auth refresh responses validated at `site/app/lib/auth.ts`; database row shapes proven by migration CHECK constraints and the postgres integration test. The hosted-function inputs remain open.
- Architecture gates stay: `ARCHITECTURE.md` + `tests/tooling/architecture.test.ts` + `CODEOWNERS` + branch protection.

**Re-evaluate Rust/Go only when** one of these is true:

1. A dedicated backend engineer joins and owns a sidecar service.
2. Throughput, CPU, or memory constraints of the current stack are measurably blocking the product (unlikely at current user volume).
3. A native desktop app (not extension) is added to the roadmap and single-binary distribution becomes the constraint.

Until then, Rust/Go would solve a language problem for a product that has not yet solved a user problem.

# What we will do (in order)

1. Keep `deno check` and the site `typecheck` in CI as required status checks — done 2026-11-19: all five jobs are required on `main`.
2. Extend runtime validation to the remaining boundaries (hosted-function inputs, the site's fetch bodies) before they are fed into typed code - the env vars, the site auth responses and the database row shapes are closed (2026-11-20).
3. Require an owner review on the gatekeeper paths (`gates.lock`, `.github/`, the boundary locks) — closed 2026-11-20: decisions.json -> docs-branch-protection-01; `gh api` now requires an approving review with code-owner sign-off on `tests/`, `scripts/`, `gates.lock` and the rest of `.github/` on `main`.
4. Grep regression for stubs — done for the crisp ones: `tests/tooling/stub-grep.test.ts` (todo!, unimplemented!, panic!, process.exit in library code) and `scripts/audit/audit-cheats.ts` bans @ts-ignore, as any and require() in product code; `tests/tooling/no-explicit-any.test.ts` holds as any in tests. 'Silently swallowing errors' remains open.
5. Wire integration tests against a real Postgres for billing/wallet/invoice flows — closed 2026-11-20: `tests/hosted/integration-postgres.test.ts` + the `postgres` job in `ci.yml`: every migration applies under `ON_ERROR_STOP` to a disposable Postgres, then the test asserts the opera_commands lifecycle check and the billing RLS are real - decisions.json -> ci-postgres-integration-01. Full billing/wallet/invoice flow tests against a live Supabase project still need the project's `DATABASE_URL`/`ACCESS_TOKEN` wired as secrets.
6. Keep `docs/handoff.md` updated with the cutover facts: npm `opera` published, repo renamed to `opera`, the CRX release live, `type-debt.lock` lineage recorded.

# What this file is not

- Not a commitment to migrate to Rust. It is a *re-evaluation trigger* list.
- Not a mandate to keep TypeScript forever. It is the statement that Rust/Go require the triggers above, not a vibes-based refactor.
- Not a criticism of Go. Go is a perfectly good language and would be the better first pick if/when we do split something out; this is not about language quality, it is about product timing.

# Closing the loop on the audit

The audit's value is that it forced the questions: Is the architecture too rigid? Is our type safety actually enforced? Are our edges validated at runtime? Are our gates wired into CI? The answer to each is now either "yes, verified" or "scheduled, not yet landed" — which is strictly better than what existed before the audit was commissioned. The next time someone asks "why not Rust?", the answer is in this file.
