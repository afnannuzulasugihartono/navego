> **Historical (superseded 2026-11-17/18 by the Apple-style redesign, PRs #380-#383).** This file described the Y2K site. The current design lives in site/app/tokens.css and site/app/brand.css (cream ground, navy, amber; Tahoma/Verdana body, Arial Black display). Keep this only as the record of the old pass.

# Navego — every element, with its reason

@last-edited: 2026-11-18 UTC+7.
@state: superseded 2026-11-18 by the Apple-style redesign (PRs #380-#383); kept as the record of the old passes. The current design lives in site/app/tokens.css and site/app/brand.css.
@related: [`AGENTS.md`](../AGENTS.md) · [`ARCHITECTURE.md`](../ARCHITECTURE.md) · [`docs/design-references.md`](design-references.md)

A page earns its pixels or loses them. This file is the inventory: every text element, button, card, tile, strip and rule on the 16 surfaces, with the reason it exists and the decision taken. Format per entry: `element — reason — decision` (K=keep, C=cut).

Two house rules do the audit's heavy lifting: no element may sell what the product cannot prove, and no element ships for decoration alone.

## Site chrome (all pages)

- Brand mark (monogram C in restrained chrome: an open arc and a short bar ending in an amber cursor on a navy disc) + wordmark `navego` drawn from the same round stroke — the identity; professional without losing the millennium metal — K.
- Version pill `v1.6.54` — the era's "beta" tag carrying the true version; pinned by the suite, never invented — K.
- Page head (`.page-head`): one h1 (Arial Black, navy), one lede sentence, optional actions — no eyebrow labels anywhere; every document page opens the same way — K (added, eyebrows removed).
- Page foot (`.page-foot`): navy band, one h2, one supporting line, one filled CTA — every document page closes with one door, never two; it is the one place a page asks for a click — K (added).
- Nav: `Fitur` `Harga` `Docs` — the three doors a new reader needs before installing; everything else reachable from those three or the footer — K.
- Nav CTA `Pasang navego` — one action, always visible, the product's reason to exist — K.
- Footer `Produk` (Fitur/Harga/Unduh/Docs/MCP) — deep links a curious reader wants after the fold — K.
- Footer `Legal` (Dukungan/Privasi/Syarat) — required routing, never in nav — K.
- Footer tagline `Huginn & Muninn — Odin's ravens. Browser Anda, atas perintah Anda.` — the name's meaning; without it, the raven is only a picture — K.
- Footer badge `88×31` — the era's link-me button, drawn as our own mark so other sites can link us the 2001 way; it carries no third party's claim — K.
- Footer bar `© 2026 Navego — private, local, signed.` — ownership + the three-word security story; `Privasi · Syarat · Dukungan` — legal mirror of the nav for readers at the bottom — K.

## beranda

- h1 `Navego.` — the name as a chrome-gradient glyph (Arial Black italic, `#ffffff → #d8ecff → #8fd8ff → #ffffff`) with an aqua halo; one loud line, the millennium way to say one thing — K.
- Kicker `Ekstensi browser` — the category in three words; answers "apa ini?" before the name does — K.
- Support line `Beri satu perintah. Navego membaca halaman yang terbuka, mengisi formulir, lalu menyimpan hasilnya sebagai berkas.` — the three actions, stated as actions — K.
- CTA `Pasang navego` (magenta gel, glowing) + `Pelajari →` (chrome) — the one action and its door — K.
- Plan note `plan.pilot gratis: 200 perintah per hari, 50 per sesi.` — priced honestly from the published pilot quota; the cost before the click — K.
- Starburst `Pasang gratis!` — one per page; the claim is the pricing FAQ's own first sentence (`Pasang gratis`), nothing invented — K.
- Framed plate `Corvus corax — setelah Naumann, 1874 · public domain` — chrome frame with aqua rim light around an ink engraving — K.
- Facts ticker pill `40 tool · 36 primitive · 6 izin` — the three pinned numbers, chrome with magenta numerals — K.
- `Contoh nyata.` + `Satu perintah, satu berkas.` + the Sinar Jaya line — the demo framed by what it really shows: 23 rows in, Rp 65.310.000 out as three sheets — K.
- `Contoh berkas.` + `Laporan keuangan September.` — the four files, openable now, linked to the study — replaces the old slogan band that said nothing — K (replaced).
- `Lima hal yang dikerjakan Navego.` + 5 feature rows (endpoint, reading, files, rejected secrets, pairing) — each row names a capability the suite pins — K.
- `Dua cara bayar.` + 3 plan cards — money stated before the click; the Firm card is midnight indigo with an aqua name (weight of emphasis, not a "best seller" claim) — K.
- `Tiga yang paling sering.` + FAQ (`Biaya`, `Data`, `Berhenti`) — the three objections at the exact price/data/exit questions, each answered with the real number — K.
- `Unduh, masuk, lalu pair device ini dari dashboard.` — the tail line states the next step instead of repeating a slogan — K (replaced).

## fitur

- h1 `Yang bisa dikerjakan Navego.` — the page's one promise, named as a thing — K.
- Lede `Anda menulis satu perintah. Navego membaca halaman yang terbuka, mengisi formulir, lalu menyimpan hasilnya sebagai berkas.` — the loop, in one sentence, no borrowed word — K.
- Stats strip (`40`, `36`, `6`) — the same three pinned numbers — K.
- Four-step rail (Tulis/Baca/Isi/Simpan) — the ritual of one job, with a real example command — K.
- 8 tiles (tool, izin, model, pairing, rahasia, MCP, berkas, login) — each names a capability with a number or a rule, none of them slogan — K.
- Sample-file download row — four real files, openable now — K.
- Permission panel (`tabs scripting storage alarms debugger downloads`) — every permission, one reason each on the page — K.
- Final `Mulai dari satu perintah.` — the next three actions in one line, linked to the study and the pricing — K (replaced).

## harga

- h1 `Harga.` + lede `Dua cara membayar, satu aturan: tidak ada yang terpotong sampai hasilnya ada.` — the pricing philosophy in one sentence — K.
- Saldo card (`Isi saldo Rp10.000 minimal`) — prepaid, no subscription — K.
- Firm card (`Plan Firm Rp249.000 · 30 hari`) — quota raises, honest terms incl. no auto-renew — K.
- Purchase buttons — open the billing function; no fake success states — K.
- Signed-out notice — never show a payment door to a signed-out stranger — K.
- Quick table (8 facts) — every number on the page, one glance — K.
- 6 FAQ items — the exact objections from support inbox (failure refund, plan expiry, model cost, batches) — K.

## unduh

- h1 `Pasang navego. Pair. Kerja.` + sub `Satu build untuk lima browser.` — the install story and the build's one honest limit (no self-update) — K.
- Five browser cards (Chrome/Edge/Brave/Opera/Vivaldi) — the extension runs on all five; zip is the primary door, crx secondary, manifest link for policy-managed machines — K.
- Install steps — same three steps as beranda — K.
- Permission list with reasons — the 6-permission promise, repeated here because this is the install page; each reason is a job, not a metaphor — K (reworded).
- Verify block (two commands, server vs local hash) — trust through verification, not through adjectives; the text said "three commands" and showed two — now "dua" — K (fixed).
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

1. The mark is the same everywhere: open-arc C in brushed chrome with an amber cursor (`components/NavegoMark.tsx`, `public/navego-mark.svg`, `public/icon.svg`, `public/assets/badge-88x31.svg`, `extension/icons/*`); one mark, one wordmark, no raven silhouette in the identity.
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
12. Copy pass — the owner called the words slop, and slop is a design failure. Metaphors, borrowed English, moods-as-headings, and lines that repeated themselves were rewritten across beranda, fitur, unduh, docs, dashboard, dukungan, mcp, privasi, consent, akun: "Detak jantung yang tetap segar" → "Menjadwalkan pemeriksaan berkala"; "Tiga perintah berikut" → "Dua perintah berikut" (the text miscounted its own block); "device milikmu sendiri" → "milik Anda sendiri"; "Semuanya di sini" → "Tiga yang paling sering". The rules now live in `design-language.md` under "The words".
13. Structure pass — one page skeleton for every document page: `.page-head` (one h1, one lede, optional actions) and `.page-foot` (navy band, one h2, one line, one CTA). Every route now opens and closes the same way; the ad-hoc section intros, end-of-page dead ends, and mismatched margins are gone. `.statement` was deleted (no page used it), the unduh verification block moved to the indigo palette, and `.dl-letter` (browser letter badge) is styled.
14. Taste pass — the owner asked for the design-taste skill to be applied to the text, buttons and eyebrows. Every eyebrow label was deleted from all sixteen surfaces; the category either moved into the h1/lede ("Yang bisa dikerjakan Navego."), was redundant, or was dropped. The film's run-log lines are real output and are now marked up as `<code>`. Buttons are verb-first with the outcome in the word; "Pelajari →" became "Cara kerja →". Footer, plan, metrics, player and divider micro-labels converted to sentence case; only the wet table header keeps capitals (a table is its own convention). Install steps carry order in position, not in "1., 2., 3." Zero tracked-uppercase labels remain outside tables. Sources consulted: vocab.design (eyebrow), CFPB Design System (eyebrow scope), Butterick Practical Typography (measure 45–90 cpl), Unbounce (verb CTAs).

Nothing functional was removed. Every surviving element answers a question the reader actually asks, or proves a claim the product actually makes.

Nothing functional was removed. Every surviving element answers a question the reader actually asks, or proves a claim the product actually makes.
