# @last-edited: 2026-11-17 UTC+7.
# @title: backend-language-evaluation - the Rust/Go question, the GPT audit, and the decision.
# @state: decision recorded; Rust/Go deferred, not banned. The real gaps are Deno check in CI and runtime-boundary validation.
# @dependencies: docs/handoff.md, package.json, .github/workflows/ci.yml, ARCHITECTURE.md.

# Why this file exists

A ChatGPT audit (branch `main`) claimed:

1. Architecture gates block Rust/Go, which is why AI "refused" them.
2. Backend code is TypeScript/Deno, and TypeScript is not strict enough to prevent AI errors.
3. Therefore: Rust-first backend, TypeScript only in browser; Go as fallback.

That audit was generated against a stale branch (before the 2026-11-17 full migration of all `.mjs` to `.ts`), and its premises don't survive contact with the tree as it exists today. This file records the honest assessment so the next person does not have to re-litigate it from scratch.

# What the audit got right

- **`deno check` is not wired into CI** for the Supabase/Deno functions under `hosted/functions/`. That is a real gap. Node's `npm run check` enforces `tsc --noEmit` on the local road; the hosted Deno road has an `edge-syntax` test that strips types and parses, which catches syntax errors but is **not** a substitute for `deno check`.
- **Website `typecheck` is not an explicit CI step** (it exists as a script, but the workflow does not call it out).
- **Arithmetic on counts** — "844 entries", "221 .mjs" — are snapshots; the current tree differs (everything is `.ts` now, tests pass, `npm run check` is green).
- **Schema validation at system boundaries** (Zod/Valibot for tool args, env vars, API bodies, database rows) is genuinely missing. TypeScript's strictness is erased at runtime, so any boundary parsing JSON needs a validator, not just a type.
- **`CODEOWNERS` ownership is declared but branch protection/rulesets could not be verified programmatically** — owner should verify GitHub branch protection includes the gatekeeper paths, and that the required status checks list matches.

# What the audit got wrong or outdated

- "AI refuses Rust because of `ARCHITECTURE.md`" — the gate does not forbid Rust or Go per se; it constrains the shape of the repo (root-level allowed directories, import direction, extra dependencies). Adding `backend/` with a Cargo workspace would need an architecture amendment, which is a deliberate product/architecture decision, not an accident of the tool.
- TypeScript strict is already strong in this tree: `tsconfig.base.json` already sets `strict`, `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noEmitOnError`. Product code compiles with zero errors.
- A full Rust port would not fix "AI ships stubbed logic" — AI can emit `todo!()` / `unimplemented!()` / empty `match` in Rust too. The wrong move is choosing a language to solve a process problem.
- Rust makes the **local agent** (the product on users' machines alongside their everyday browsers) harder to reason about for end-users (install, permissions, debugging) and harder to ship; the npm install path is already live (`npm i -g navego`) and the `navego doctor` flow works against it.
- "Rust-first" for a solo founder without backend engineers would consume months of solo runway for no revenue-facing improvement.

# What shipped between audit and this record

- All `.mjs` sources in the repo migrated to `.ts` (tests, scripts, helpers). The `biome` rule for `noExplicitAny` and `noTsIgnore` is pinned **error** in `biome.json`. `tsconfig.tooling.json` covers all scripts and tooling with strict settings; zero errors today.
- `tests/tooling/type-debt.ts` + `type-debt.lock` — the strict-TS debt in tests/legacy is **ratcheted**: it can go down, never up. Today's baseline is recorded.
- `npm run check` is green, `npm run types` is green, 286 tests green, `npm run check` covers the surface, `cargo`/Rust deliberately untouched.
- `@supabase/supabase-js`, `@supabase/edge-runtime` still **not** installed (no runtime need yet; hosted functions are tested against live production via Supabase CLI / dashboard).

# The decision

**Do not port any backend code to Rust or Go now.** Keep the architecture split:

- Browser extension, local driver, shared core, website — TypeScript strict, zero errors, gated.
- Hosted functions — TypeScript/Deno, strict, **will be wired into CI with `deno check`**.
- Runtime boundaries — JSON payloads validated with Zod/Valibot as they cross into the system.
- Architecture gates stay: `ARCHITECTURE.md` + `tests/tooling/architecture.test.ts` + `CODEOWNERS` + branch protection.

**Re-evaluate Rust/Go only when** one of these is true:

1. A dedicated backend engineer joins and owns a sidecar service.
2. Throughput, CPU, or memory constraints of the current stack are measurably blocking the product (unlikely at current user volume).
3. A native desktop app (not extension) is added to the roadmap and single-binary distribution becomes the constraint.

Until then, Rust/Go would solve a language problem for a product that has not yet solved a user problem.

# What we will do (in order)

1. Wire `deno check` (or `deno lint` + `deno check`) into CI for `hosted/functions/`.
2. Verify `site/` has an explicit `typecheck` script in CI, and add if missing.
3. Add Zod/Valibot-style runtime validation at the boundaries where JSON crosses into the system: MCP tool arguments, environment variables, API request bodies, and database row shapes before they are fed into typed code.
4. Grep regression for stubs: `todo!`, `unimplemented!`, `panic!` (panic used as normal control flow), `@ts-ignore`, `as any` without approval, `process.exit` in library code, silently swallowing errors.
5. Wire integration tests against a real Postgres for billing/wallet/invoice flows (Deno + Supabase local or testcontainers).
6. Keep `docs/handoff.md` updated with the cutover facts: npm `navego` published, repo renamed to `navego`, the CRX release live, `type-debt.lock` lineage recorded.

# What this file is not

- Not a commitment to migrate to Rust. It is a *re-evaluation trigger* list.
- Not a mandate to keep TypeScript forever. It is the statement that Rust/Go require the triggers above, not a vibes-based refactor.
- Not a criticism of Go. Go is a perfectly good language and would be the better first pick if/when we do split something out; this is not about language quality, it is about product timing.

# Closing the loop on the audit

The audit's value is that it forced the questions: Is the architecture too rigid? Is our type safety actually enforced? Are our edges validated at runtime? Are our gates wired into CI? The answer to each is now either "yes, verified" or "scheduled, not yet landed" — which is strictly better than what existed before the audit was commissioned. The next time someone asks "why not Rust?", the answer is in this file.
