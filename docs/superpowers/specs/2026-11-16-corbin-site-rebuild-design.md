# Design — Corbin: website rebuild (React + TypeScript + Vite, SSG) and the new brand

@last-edited: 2026-11-16 UTC+7.
@related: [`AGENTS.md`](../../../AGENTS.md) - [`ARCHITECTURE.md`](../../../ARCHITECTURE.md) - [`docs/handoff.md`](../../handoff.md)

## Context

The public site (`landing/`) is a flat set of ~16 hand-written HTML/CSS/JS files. The 2026-11-15 session (branch `agent/corbin/website/corbin`, worktree `D:\GitHub\opera-agent-corbin`) started a rebuild under a new brand: **Corbin**, the raven (Huginn & Muninn; "Corbin, the raven"). It scaffolded `landing/web-src/` (React 19 + Vite 8 + TypeScript) with a pilot homepage, a `Raven` component, an ink/bone/amber palette with Georgia type, wired `deploy-site.yml` to build it, and copied the legacy flat pages into `web-src/public/` to ride along until ported one by one. Nothing was committed.

On 2026-11-16 the owner approved, in session: the "**Lembar Spesifikasi**" visual direction (option C), a full redesign of all 16 surfaces including the dashboard, **Bahasa Indonesia only**, the **React Router v7 (framework mode, SSG)** toolchain, and the rename **Opera Agent → Corbin** on the website. The composition chosen is **A — Gagak di kartu nada** with a **reworked realistic raven** mark (it must read as an actual raven, not as abstract polygons).

## Scope

In scope:
- Rebuild the web app from scratch on React Router v7 framework mode with TypeScript strict, Vite underneath, React 19.
- Port all 16 surfaces with a full visual redesign to the new brand: `index` (sign-in), `beranda`, `fitur`, `harga`, `unduh`, `docs`, `mcp`, `studi`, `bukti`, `dukungan`, `privasi`, `syarat`, `404`, `akun`, `oauth/consent`, `dashboard` (the Supabase-backed app).
- Indonesian only; delete the i18n machinery and the EN toggle. Copy stays factual: 42 tool, Rp 99.000 / Rp 249.000, 1-klik pair, MV3, data tetap di device.
- Delete `landing/` once every route is ported and the gates are green; delete i18n/palette/demo machinery that the new build replaces.
- Rewrite `tests/landing/*` as `tests/site/*` asserting on the **build output**, per "proof of equal strength, never silence".
- Rewire `deploy-site.yml`: install + build `site/`, deploy `site/build/client`; keep `_worker.js` and `_headers` (the `/invoice` proxy and its policy) byte-compatible.
- Update `ARCHITECTURE.md` and this file's claims as the work lands.

Out of scope (needs its own decision):
- Renaming the product itself across the extension manifest, npm package, store listing, and release pipeline (`opera-agent-*` stays `opera-agent-*`). The rename applies to the public website surfaces.
- i18n re-introduction.

## Boundaries and repo rules

- All work happens in the existing worktree `D:\GitHub\opera-agent-corbin` on branch `agent/corbin/website/corbin`. The uncommitted 2026-11-15 seed (`landing/web-src/`, `deploy-site.yml`, `ARCHITECTURE.md` edits, `hero.png`, `Raven.tsx`, `palette.ts`) is absorbed: the RRv7 app is built in `site/` at the repo root; `Raven` is reimplemented as the realistic mark; `hero.png` is not carried over unless a page uses it; the `deploy-site.yml`/`ARCHITECTURE.md` edits are superseded by the wiring in this spec. The shared checkout is never touched.
- `.superpowers/` stays local; ensure it is gitignored in the branch.

## Architecture

- Root layout: `site/` — its own npm package (`corbin-site`), own lockfile, dependencies pinned. React 19, `react-router` (framework mode, `ssr: false`, `prerender` = all routes), TypeScript strict. `@vitejs` is driven by RR.
- `app/root.tsx` — HTML shell: `<html lang="id">`, Instrument Sans self-hosted from `site/public/fonts/` (the variable TTF already vendored at `extension/fonts/InstrumentSans-Variable.ttf` with its OFL license), tokens as CSS custom properties in `app/tokens.css`.
- `app/routes.ts` — explicit routes preserving the legacy flat URLs exactly: `/`, `/beranda.html`, `/fitur.html`, `/harga.html`, `/unduh.html`, `/docs.html`, `/mcp.html`, `/studi.html`, `/bukti.html`, `/dukungan.html`, `/privasi.html`, `/syarat.html`, `/akun.html`, `/404.html`, `/oauth/consent.html`, `/dashboard.html`. Every prerendered path writes `<name>.html`, so Cloudflare Pages keeps serving the exact URLs `sitemap.xml`, `robots.txt`, and external backlinks already use.
- `site/public/` carries `_worker.js` (unchanged, `/invoice` proxy), `_headers`, `robots.txt`, `sitemap.xml`, `icon.svg`, `fonts/`, legacy assets still referenced.
- Output `site/build/client` → `deploy-site.yml` runs `npm ci --prefix site && npm run build --prefix site` after the repo-wide gates, then `npx wrangler pages deploy site/build/client --project-name=opera-agent`. `/invoice` keeps working through `_worker.js` at the root of the deployed dir.
- Deploy stays manual (`workflow_dispatch`). The workflow lives under CODEOWNERS — the owner merges it.

## Brand and design language ("Lembar Spesifikasi × Corbin")

Tokens (flat fills only — no gradients, no glows, no hairline 1px rules, no eyebrows, no tracked-uppercase microcopy, no index numbering, one accent):

| Role | Value |
|---|---|
| ground (paper) | `#f4f1e9` |
| card / tone step | `#e7e3d5` |
| ink (text, blocks) | `#16161a` |
| ink-soft | `#262630`, `#1f1f29` |
| muted | `#55524a` / `#3f3f38` |
| accent (amber) | `#d8923f` — eye of the raven, single small accents; never a fill field |
| primary action | ink block `#16161a`, paper text |

Rules:
- One face — Instrument Sans (variable). Headline weight 800, tracking −0.03em; body 400/500. Indonesian copy; statements are paragraphs, not display type.
- Two heavy rules (2px ink) frame the page header and the facts strip — thick document rules, not hairlines. Depth comes from tone steps and filled blocks.
- Headlines ≤ 2 lines at every width; one primary action per screen; one full-weight h1 per page; every section has a heading.
- The raven mark: realistic profile head-and-shoulders, unified silhouette (near-straight forehead → culmen → hooked tip; deep gonys; ricti nasal bristles; lanceolate throat hackles), ink on card for the hero form, reversed paper-on-ink for the 24 px icon form; iris `#d8923f`. Favicon and app icons derive from the reversed form. Wordmark: lowercase `corbin`, letterspaced, always with the mark.
- House rules apply: no gradients, no shadow-on-rest, no glass, no pill badges, no emoji, no fake numbers; software shows its own interface (popup embed / command log fragment, `data-ui`); every page carries real content end to end (no lorem, no invented proof — no fake customers, quotes, metrics).

Composition (validated in the visual companion): **A — Gagak di kartu nada**: hero with the giant `Corbin.` wordmark left, subline "Asisten AI di browser Anda.", one line of support, CTA block + plan note, the raven in a bone card right, facts strip along the bottom (42 tool · 1 klik pairing · MV3 Chrome·Edge·Brave · Data tetap di device).

## Pages

All Indonesian, each with its own redesign but one grammar:

1. `beranda` — hero (A), claims-with-proof sections: how it works (bicara → halaman bergerak), features (42 tool), harga summary, pair CTA, FAQ. Real dashboard/popup fragment as the live product picture.
2. `fitur` — the 42 tools grouped (baca/ketik/klik/isi/kirim/data), the surface profile, the local bridge; no per-site gadgets claim.
3. `harga` — dua cara membayar: isi saldo QRIS mulai Rp10.000 (plan.pilot gratis, 200 perintah/hari) / plan.firm Rp249.000 / 30 hari (5000/hari, 500/sesi, tidak otomatis diperpanjang); metering honest (harga tetap sebelum mulai, kembali penuh bila gagal, maks 10 aksi). FAQ ported.
4. `unduh` — per-browser cards (Chrome/Edge/Brave/Firefox? — only what the repo actually ships: CRX/zip + "Pasang dari dashboard" 1-klik pair), requirements, "other downloads".
5. `docs` — local docs; keep markdown rendering; docs index the same topics as before.
6. `mcp` — the MCP surface for OpenCode (local loopback driver; hosted MCP deleted 2026-11-14 — the page must not claim a hosted endpoint exists).
7. `studi` — case studies; only real, previously-published cases; otherwise honest "belum ada studi yang bisa dipublikasikan".
8. `bukti` — proof: real shipped runs from `docs/proof/`; no invented testimonials.
9. `dukungan` — support/dukungan page, same jobs as before.
10. `privasi`, `syarat` — legal, copy ported.
11. `404` — raven reversed, "Halaman ini tidak ada." + links.
12. `index` — sign-in: split "brand panel | magic-link card", Google/GitHub buttons + magic link; no password.
13. `akun` — account page.
14. `oauth/consent` — consent screen.
15. `dashboard` — the app, full redesign, same functions as the vanilla build:
    Ringkasan (plan card, quota, checklist), Device (list, pairing status, pair CTA), Riwayat (search/filter/status), Tabel (query, filter, pagination, CSV export, 5.000-row cap), Sesi dengar, Saldo (balance, top-up, wallet status), Aksi (run actions), Operator (konsol table list), auth gate + sign-out, pair deep-link handling. Supabase JS via the same project URL/anon key already in the vanilla file; env via build-time `import.meta.env`.

## Test and gate strategy

- `tests/site/*.test.mjs` (node:test): parse `site/build/client/**/*.html` after `npm run build --prefix site`; assert per page: exactly one h1, every `<section>` has a heading, no `data-i18n`/`i18n.js` remnants, required claims present per page (harga contains the two prices, unduh the browser names, index the magic-link copy, dashboard's script presence), `_headers`/`_worker.js` copied, `sitemap.xml` paths ⊆ prerendered routes.
- `landing-i18n` retires with a replacement assertion (no EN dictionary, no lang toggle in build output).
- `npm test` and `npm run check` stay green; `biome` continues to gate JS/TS the same way.
- Browser drive: `py` (not `python`) with Playwright — open the preview build, check the hero, nav, CTA, dashboard sign-in gate at 1440/768/390 px; screenshots to `.taste-skill/` if the inspector runs; screenshots otherwise live under `C:\Users\ASUS\AppData\Local\Temp\opencode\`.
- No claim ships above what ran: "builds", "renders", "drives" are separate sentences.

## Rollback

`deploy-site.yml` deploys manually; rolling back = re-dispatch with the old workflow or `wrangler pages deploy` against the pre-change `landing/` directory, which stays intact until this branch merges. The CRX/update pipeline is untouched.
