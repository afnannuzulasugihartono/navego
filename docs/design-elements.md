# Corbin — every element, with its reason

@last-edited: 2026-11-16 UTC+7.
@state: the Web 2.0 pass is complete for beranda, chrome, and the demo player; the dashboard is inventoried, its claims data-driven.
@related: [`AGENTS.md`](../AGENTS.md) · [`ARCHITECTURE.md`](../ARCHITECTURE.md) · [`docs/design-references.md`](design-references.md)

A page earns its pixels or loses them. This file is the inventory: every text element, button, card, tile, strip and rule on the 16 surfaces, with the reason it exists and the decision taken. Format per entry: `element — reason — decision` (K=keep, C=cut).

Two house rules do the audit's heavy lifting: no element may sell what the product cannot prove, and no element ships for decoration alone.

## Site chrome (all pages)

- Brand mark (chrome raven medallion: metal silhouette, iridescent ring, lit amber eye, one lens flare) + wordmark `corbin` in chrome gradient — the identity; one raven, one name, drawn in the millennium's own metal — K.
- Version pill `v1.6.54` — the era's "beta" tag carrying the true version; pinned by the suite, never invented — K.
- Nav: `Fitur` `Harga` `Docs` — the three doors a new reader needs before installing; everything else reachable from those three or the footer — K.
- Nav CTA `Pasang corbin` — one action, always visible, the product's reason to exist — K.
- Footer `Produk` (Fitur/Harga/Unduh/Docs/MCP) — deep links a curious reader wants after the fold — K.
- Footer `Legal` (Dukungan/Privasi/Syarat) — required routing, never in nav — K.
- Footer tagline `Huginn & Muninn — Odin's ravens. Browser Anda, atas perintah Anda.` — the name's meaning; without it, the raven is only a picture — K.
- Footer badge `88×31` — the era's link-me button, drawn as our own mark so other sites can link us the 2001 way; it carries no third party's claim — K.
- Footer bar `© 2026 Corbin — private, local, signed.` — ownership + the three-word security story; `Privasi · Syarat · Dukungan` — legal mirror of the nav for readers at the bottom — K.

## beranda

- h1 `Corbin.` — the name as a chrome-gradient glyph (Arial Black italic, `#ffffff → #d8ecff → #8fd8ff → #ffffff`) with an aqua halo; one loud line, the millennium way to say one thing — K.
- Kicker `Ekstensi browser` — the category in three words; answers "apa ini?" before the name does — K.
- CTA `Pasang corbin` (magenta gel, glowing) + `Pelajari →` (chrome) — the one action and its door — K.
- Plan note `plan.pilot gratis — 200 perintah/hari, 50 per sesi.` — priced honestly from the published pilot quota; the cost before the click — K.
- Starburst `Pasang gratis!` — one per page; the claim is the pricing FAQ's own first sentence (`Pasang gratis`), nothing invented — K.
- Framed plate `Corvus corax — setelah Naumann, 1874 · public domain` — chrome frame with aqua rim light around an ink engraving — K.
- Facts ticker pill `56 tool · 36 primitive · 6 izin · MV3 Chrome·Edge·Brave · Data tetap di device` — same five falsifiable claims, now chrome with magenta numerals — K.
- `Coba Corbin.` + `Klik. Lihat ia bekerja.` — the demo's frame, two short lines — K.
- `Corbin Player` (the film) — chrome bezel, aqua LCD status strip, round aqua play button; plays the real Sinar Jaya September run: same CSV, same totals, a download that really exists — K.
- `Fungsinya.` + `Baca halaman. Tulis halaman. Kirim hasilnya.` — the three verbs, three lines, light panel — K.
- `Cara ia bekerja.` + `Lima hal, satu arah: selesai.` + 5 feature rows — each row names a capability the suite pins — K.
- `Harganya. Tidak kejutan.` + 3 plan cards — money stated before the click; the Firm card is midnight indigo with an aquo name (weight of emphasis, not a "best seller" claim — see pass notes) — K.
- `Sebelum Anda bertanya.` + `Semuanya di sini.` FAQ (`Biaya`, `Data`, `Berhenti`) — the three objections at the exact price/data/exit questions — K.
- `Pasang. Pair. Kerja.` closing tail-CTA — K.

## fitur

- h1 `Browser Anda, alat kerja.` — the page's one promise — K.
- Stats strip (`56`, `36`, `6`) — the same three pinned numbers — K.
- Four-step rail (Bicara/Baca/Tulis/Simpan + `ringkasan.md`) — the workflow as a 4-line ritual; the filename is the proof of artefact-first — K.
- 8 bento articles — each answers "what does it do for me" with a concrete example (Sheets/Maps/Docs, permissions, portal waiting logic, four downloadable files) — K.
- Sample-file download row — four real files, openable now — K.
- Permission panel (`tabs scripting storage alarms debugger downloads`) — every permission, one reason each on the page — K.

## harga

- h1 `Harga.` + lede `Dua cara membayar, satu aturan: tidak ada yang terpotong sampai hasilnya ada.` — the pricing philosophy in one sentence — K.
- Saldo card (`Isi saldo Rp10.000 minimal`) — prepaid, no subscription — K.
- Firm card (`Plan Firm Rp249.000 · 30 hari`) — quota raises, honest terms incl. no auto-renew — K.
- Purchase buttons — open the billing function; no fake success states — K.
- Signed-out notice — never show a payment door to a signed-out stranger — K.
- Quick table (8 facts) — every number on the page, one glance — K.
- 6 FAQ items — the exact objections from support inbox (failure refund, plan expiry, model cost, batches) — K.

## unduh

- h1 `Unduh berkas.` + sub `Satu build. Lima browser. Sekali klik. Build terbaru, selalu.` — the whole download story — K.
- Five browser cards (Chrome/Edge/Brave/Opera/Vivaldi) — the extension runs on all five; zip is the primary door, crx secondary, manifest link for policy-managed machines — K.
- Install steps — same three steps as beranda — K.
- Permission list with reasons — the 6-permission promise, repeated here because this is the install page — K.
- Verify block (two commands, server vs local hash) — trust through verification, not through adjectives — K.
- Browser support table — honest: Firefox refused (no debugger permission) — K.
- Review-pending note — no fake store badge before review exists — K.

## docs

- h1 `Docs.` + sub `Pasang, pair, jalankan, hubungkan.` — the docs in four verbs — K.
- Left rail `Di halaman ini` (8 anchors) — scan-ability for a ~700-line page — K.
- Quick doors (3) — fastest onboarding path — K.
- Pasang / Pairing / Tugas / Berkas / Saldo / Tools / MCP / Batas — the full surface — K.
- Real SHA-256 and tool names — the docs are the product, not marketing — K.

## mcp

- `Pasang MCP.` head + warning `Server hosted sudah tidak disediakan lagi.` — the exact state of the product; no ghost endpoints — K.
- Install/verify/register commands — copy-paste-ready — K.
- 4 sections — install, verify, per-harness config, boundaries — K.

## studi

- h1 `Satu bulan kas jadi empat berkas.` — the case, in one line — K.
- Input CSV listing — the artefact before the artefact — K.
- Four output files with download links — the study is verifiable by opening — K.
- figureTable (`Pendapatan/Beban/Total`) — the numbers re-checked — K.

## bukti

- h1 `Empat berkas, sama persis.` — the proof claim — K.
- Steps list — what the run did — K.
- sha256 table — four files, byte-compared — K.
- Extension-path proof — the same run through the extension — K.
- portal.jpg figure — the page the agent read — K.

## dukungan

- h1 `Dukungan.` — the page's job — K.
- 5 fixes (device missing, extension uninstalled, harness connect, session expired, privacy) — the five actual support mails — K.
- 3 contact doors (Email, public issue, security) — real humans, real channels — K.

## privasi / syarat

- Two legal documents — the binding contract for a product that drives your browser — K.

## index / 404 / akun / oauth/consent / dashboard (auth + console)

- Sign-in split (raven/brand promises | magic-link + provider buttons) — the FB-split the site already uses — K.
- Promise list (bicara/halaman bergerak, no pw, keys stay local) — the privacy pitch in three lines — K.
- Account page (identitas, penyedia, device, sesi) — the reader's own data — K.
- Consent screen — the one door between an app and your browser; every scope named in plain words — K.
- Dashboard (9 views): Ringkasan (plan + metrics + checklist), Device (pair/revoke), Riwayat, Tabel, Sesi dengar, Saldo, Pairing, Aksi, Akun ini — each view answers one operational question a paying reader asks about their device — K.
- Dashboard empty states — never a blank screen — K.

## Y2K pass — what changed

1. The mark is new: chrome raven inside an iridescent ring (`components/Raven.tsx` + `public/icon.svg`) — metal, aqua rim, lit amber eye, one lens flare; the console rail gets the chrome head variant.
2. Palette became liquid light: silver-blue page with scanline texture, chrome panels, midnight indigo for console/footer/hero, aqua `#00b8e6` for live state, magenta `#e0219b` for the one CTA, lime `#86e800` used exactly twice.
3. The hero became a lit midnight splash panel with auras, sparkle points and a chrome frame around the plate.
4. Typography: Arial Black (display, italic for the big line) + Tahoma (body) + Lucida Console (code, the film's terminal) — all system faces, zero font requests.
5. Buttons became magenta gel with an aqua halo; the current nav page wears deep blue with a cyan glow; tables got wet blue headers and aqua-tinted zebra rows.
6. The demo's chrome became brushed metal with an aqua LCD status strip and an aqua play button.
7. Footer: midnight indigo with a 3px iridescent rule and the 88×31 badge to take away.
8. Instrument Sans Variable removed for good (no font dependency left at all); theme-color now `#dbe7f3`.
9. `.plan.is-primary::after TERLARIS` was cut before it ever shipped: no sales data exists, so the badge could only be a lie.
10. Focus ring: 2px indigo outline plus an aqua halo — visible on chrome panels and midnight indigo alike.
11. Dead CSS deleted along the way: `.steps-brief`, `.proof-panel`, `.chapter-link`, `.promises`, `.hero-corner`/`.hero-hud`, `full-bleed`/`hero-veil`, and the whole mission/XP/reward block.

Nothing functional was removed. Every surviving element answers a question the reader actually asks, or proves a claim the product actually makes.

Nothing functional was removed. Every surviving element answers a question the reader actually asks, or proves a claim the product actually makes.
