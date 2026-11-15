# Corbin — every element, with its reason

@last-edited: 2026-11-16 UTC+7.
@state: the minimalist pass is complete for the marketing and legal surfaces; the dashboard is inventoried, its claims data-driven.
@related: [`AGENTS.md`](../AGENTS.md) · [`ARCHITECTURE.md`](../ARCHITECTURE.md) · [`docs/design-references.md`](design-references.md)

A page earns its pixels or loses them. This file is the inventory: every text element, button, card, tile, strip and rule on the 16 surfaces, with the reason it exists and the decision taken. Format per entry: `element — reason — decision` (K=keep, C=cut).

Two house rules do the audit's heavy lifting: no element may sell what the product cannot prove, and no element ships for decoration alone.

## Site chrome (all pages)

- Brand mark + wordmark `corbin` — the identity; one raven, one name — K.
- Nav: `Fitur` `Harga` `Docs` — the three doors a new reader needs before installing; everything else reachable from those three or the footer — K.
- Nav CTA `Pasang corbin` — one action, always visible, the product's reason to exist — K.
- Footer `Produk` (Fitur/Harga/Unduh/Docs/MCP) — deep links a curious reader wants after the fold — K.
- Footer `Legal` (Dukungan/Privasi/Syarat) — required routing, never in nav — K.
- Footer tagline `Huginn & Muninn — Odin's ravens. Browser Anda, atas perintah Anda.` — the name's meaning; without it, the raven is only a picture — K.
- Footer bar `© 2026 Corbin — private, local, signed.` — ownership + the three-word security story; `Privasi · Syarat · Dukungan` — legal mirror of the nav for readers at the bottom — K.

## beranda

- h1 `Corbin.` — the name, the product, the brand; a reader who forgets nothing else — K.
- Lede `Asisten AI di browser Anda.` — what it is, in one line — K.
- Support line `Membaca halaman, mengisi formulir, bekerja lintas tab — satu perintah teks.` — the three verbs the product actually performs; no adjectives — K.
- CTA `Pasang corbin →` — the one action on this screen — K.
- Plan note `plan.pilot gratis` / `Rp 249 rb / 30 hari untuk Firm` — the cost before the click; hidden text is how pilots churn — K.
- Hero plate `Corvus corax — setelah Naumann, 1874 · public domain` — the real raven, drawn by an 1874 naturalist; the brand is a real bird, credited — K.
- Facts strip `56 tool · 36 primitive · 6 izin · MV3 Chrome·Edge·Brave · Data tetap di device` — five falsifiable claims, all pinned by the suite (tool/primitive counts derive from source) — K.
- `Semua halaman. Bukan daftar putih.` + 8 tiles (Sheets, Docs, Maps, YouTube, Gmail, Notion, GitHub, Shopee) — shows breadth of surfaces without a fake compatibility claim; dropped Figma, Linear, Jira, Traveloka (four identical-weight tiles that said nothing new) — C→K (trimmed).
- `Tidak ada API per situs.` / `Satu endpoint, semua halaman.` — the architectural claim that justifies the whole product; two statements, as big as they deserve — K.
- Install section: `Dari prompt ke hasil.` head — K.
- Step list `Unduh / Masuk / Pair` — the three-step path, nothing else — K.
- Terminal block (`macOS/Linux/Windows` + command + `Salin`) — the real install path, given honestly; copyable — K.
- `Panel extension` example card — shows the popup; the paired state, the action, the result — one glance, no video — K.
- Run-log panel (`Isi spreadsheet onboarding dari web`…`onboarding.csv — tersimpan`) — proves the loop end to end — K.
- Model section: `Pakai model sendiri.` head + copy `Endpoint dan kunci ada di browser Anda.` — the privacy promise in one sentence — K.
- Model form (provider/endpoint/name/key/저장) — the actual configuration; the one interactive page action besides CTAs — K.
- `Apa yang ia kerjakan.` + 6 feature rows (One endpoint / Membaca / Mengisi / Ingat / Artefak / Kendali) — each names a capability the tests pin — K.
- `Pasang. Pair. Kerja.` closing CTA — the entire onboarding in three words — K.
- FAQ (`Biaya`, `Data`, `Berhenti`) — answers the three objections at the exact price/data/exit questions — K.
- Pricing teaser (`Isi saldo Rp10.000` / `Plan Firm Rp249.000` / `plan.pilot gratis`) — routes to /harga.html with no bait — K.

Cut this pass: nothing decorative survives; the four weakest tiles were removed.

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

## Minimalist pass — what changed

1. Logo tiles 12 → 8 (Figma/Linear/Jira/Traveloka removed: four tiles, zero new information).
2. Tiles lost their fill; the strip is now a type-set list — fewer boxes, same breadth.
3. Feature/download cards lightened from #e7e3d5 to #ece9de — a tone step, not a slab.
4. `.sheet` (spec panels) lost the 2px frame — the tone step carries the grouping alone.
5. Section vertical rhythm 56px → 72px — more air, fewer eye-anchors competing for attention.

Nothing functional was removed. Every surviving element answers a question the reader actually asks, or proves a claim the product actually makes.
