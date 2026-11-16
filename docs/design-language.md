# Corbin — the design language, every decision with its meaning

@last-edited: 2026-11-16 UTC+7.
@state: the Y2K pass is complete for the mark, the chrome, the hero and the player; the audit's sibling is [`design-elements.md`](design-elements.md), which justifies each element, not each value.
@related: [`AGENTS.md`](../AGENTS.md) · [`ARCHITECTURE.md`](../ARCHITECTURE.md) · [`docs/design-elements.md`](design-elements.md)

Every word, element, color, style, image and proportion below says why it exists. A decision without a sentence in this file does not ship. Nothing ships for decoration; nothing hides for convenience.

This era is deliberate. The owner asked for the site whole in the millennium style: chrome, liquid light, the atomic age. The rule is not nostalgia, it is the product's own posture — a 2001 desktop utility that drives the real web. The dress says "the future just shipped"; the substance stays exactly what it is.

## The name

- **Corbin** — from the Latin *corvus*, raven; the Germanic given name meaning raven. Short, spellable, one syllable.
- **The raven** — Odin's Huginn and Muninn: thought and memory, the two birds that fly across the world each day and return with what they saw. The product is the same animal in code: it flies out, it flies back, it acts. Every visual decision descends from that one bird — even the millennium chrome is the light the bird flies through.

## The mark — the chrome C

- **The monogram** (`components/CorbinMark.tsx`, `public/corbin-mark.svg`) — a C drawn from one geometric arc in brushed chrome, its short bar ending in an amber cursor. The circle is the old medallion reduced to its shape, not its ornament; one raven-free mark for the site, the badge, the favicon and the extension icons.
- **The head variant** — the same silhouette in chrome for the console rail: metal on indigo, eye lit, one cyan rim line.
- **The 1874 Naumann plate** (`public/assets/raven-1874.jpg`) — the bird as naturalists measured it, still the picture on beranda, index and notfound. It is *borrowed*, so it carries its credit line wherever it lands. The mark is the bird rendered in chrome; the plate is the bird drawn in ink.
- **Why the mark is a circle and not a doodle**: the 2001 language of light survives in the brushed chrome and the navy disc, but nothing decorative remains. The open arc, the bar and the amber cursor are legible at 16 px — the favicon and the toolbar icon read before the wordmark does.

## The palette — liquid light

- **Silver-blue page `#dce6f2` over `#eef4fb`** — the washed sky of the millennium desktop, with a fine scanline texture and two soft auras (aqua top-left, magenta right). The page is lit, not printed.
- **Chrome panels** — every content surface is polished metal: `#ffffff → #eef2f8 → #d3dbe6 → #e9eef4`, one `#93a3b8` bevel, one inner white highlight. Chrome is the era's default surface and it is what makes a page feel like an interface instead of a document.
- **Deep indigo `#16205a → #0d1338`** — the console, the footer, the primary plan card, the hero's night sky. Dark indigo is where chrome reads as chrome.
- **Aqua `#00b8e6` (hi `#7ff0ff`)** — the millennium's signature liquid light. It marks the live state: active nav, focus halo, progress fill, links on dark, the eye's halo. It never fills a large surface.
- **Magenta `#e0219b` (hi `#ff7ad9`)** — the second liquid: primary buttons, the numerals in the facts ticker, the starburst, the "»" bullets. One accent per role, never both at once in the same component.
- **Lime `#86e800`** — the Y2K green, used exactly twice: the free-plan line in the hero and the success pulse on the facts ticker. More than that is vomit.
- **Amber `#d8923f`** — the cursor at the end of the C's bar, and only that: the mark, the film lines, the amber data. The one warm point in a cold system.
- **Iridescent rule** (`aqua → violet → magenta → lime → aqua`) — the era's one indulgence: a 3px rule at the top of the footer, the auth divider, the glow edge on chrome. One per screen.
- **Shadows `rgba(18,34,64,…)`** — cool, below 30px, always paired with an inset white highlight. Warm shadows and grey haze are the failure mode this palette exists to avoid.

## The typography

- **Arial Black — the display and label face.** The millennium's heaviest system face, always set italic for the display line and upright for buttons and labels. Headlines, buttons, rails, chips, the brand word, the player's title bar.
- **Tahoma — the body face, 13.5px / 1.65.** The face every 2001 desktop shipped; small, tight, extremely legible.
- **Lucida Console — the code and terminal face.** The pre-2000 console standard, and the reason the film's run-log looks like a real machine speaking.
- **Display: weight 900, tracking `-0.03em` to `-0.05em`, line-height 0.86–1.04** — one loud line per section. The hero display is chrome-gradient text clipped to the glyphs (`#ffffff → #d8ecff → #8fd8ff → #ffffff`) with an aqua halo; the same trick carries the auth headline and the film's closing card.
- **Tabular figures** wherever numbers align — the raven counts.
- **No tracked-uppercase outside the wet table header** — kicker and bar chrome were the last users and were all converted to sentence case.
- **Sentence case everywhere else** — the era's all-bold sentence case is the human register.

## The words

The owner rejected the copy once as slop. That is a design failure, so it gets rules like colour does.

- **Facts, not metaphors** — "Detak jantung yang tetap segar" became "Menjadwalkan pemeriksaan berkala". Where a fact fits, a metaphor never does: no "detak jantung", "pintu", "membekukan kerja", "satu arah: selesai".
- **Indonesian that is actually Indonesian** — "content script", "tab private", "Host permission di setiap origin", and "Companion dengan AI di belakangnya" were all replaced by "skrip di halaman", "tab pribadi", "Izin per situs", and a plain sentence. Terms the product genuinely uses — tool, primitive, device, extension, harness, pairing — stay in English; everything else is Indonesian.
- **A heading names a thing, not a mood** — "Tidak kejutan" became "Dua cara bayar", "Semuanya di sini" became "Tiga yang paling sering", "Browser Anda, alat kerja" became "Yang bisa dikerjakan Corbin".
- **Nothing repeats itself on one page** — "Satu extension, satu akun, satu browser" said the same thing twice on beranda; it now appears nowhere, and the band that carried it was replaced by the four example files.
- **Second person is "Anda"** — the dashboard said "device milikmu sendiri" in the middle of a formal page.
- **Every number must be one the site can prove** — 40 tool, 36 primitive, 6 izin, Rp10.000, Rp249.000, 23 baris, Rp 65.310.000, sha256, 200/50 kuota.
- **A claim that cannot be proved does not ship** — "Paling dipakai" became "Kuota terbesar"; the "TERLARIS" badge was cut before it ever shipped.

- **No eyebrow labels, ever.** The line above a heading — "Contoh nyata.", "Unduh.", "Fitur." — was cut from every page: the information it carried was either already in the heading, dropped, or moved into the lede. The definition lives at [vocab.design](https://vocab.design/eyebrow) ("what category the content belongs to"); it is only useful when a parent grouping exists ([CFPB design system](https://cfpb.github.io/design-system/foundation/headings)), and this site has none. Every heading on the page now names the thing or the claim itself.
- **A heading is one or two lines, at every width.** Over the same measure, Butterick's line length holds: [45–90 characters](https://practicaltypography.com/line-length.html), and the site's 62ch lede column sits inside it.
- **Buttons are named for what they do, with the outcome in the word.** "Pasang corbin", "Unduh .zip", "Isi saldo Rp10.000" — verb first, value named, exactly what conversion research keeps finding ([Unbounce's button study](https://unbounce.com/conversion-rate-optimization/cta-copy-critiqued-for-conversion)). "Pelajari →" was vague and became "Cara kerja →".
- **No uppercase micro-labels.** Tracked caps survived only inside real tables (header row), where a table is allowed its own conventions; every other label — footer, plan, metrics, costs, the player's bar — is sentence case.
- **No index numbers.** The install steps carry the order in position, not in "1." through "4.".

## The space

- **Frame: one `--maxw: 1160px` column** — equal outer margins at every width.
- **The hero is a lit panel, not a page** — a rounded midnight card with aqua and magenta auras, floating stars and a chrome frame around the plate. It is the splash screen of the millennium, sized to today's screen.
- **Panels carry the work** — dashboard, docs rail, spec sheets, plans, FAQ; the header strip is the era's tab without being a fake control.
- **Glow is used as depth** — aqua halos under chrome edges, magenta under the primary button, never a rainbow around everything.

## The surfaces

- **The header is a chrome bar** — white-to-silver gradient, one bevel line, a version pill (`v1.6.54`, the true version), the chrome wordmark, nav as chrome pills with the current page in deep blue with an aqua halo, and one magenta gel CTA.
- **The footer is midnight indigo with an iridescent top rule** — brand, two link columns, legal mirror; aqua headings with halo, cool grey copy, and the 88×31 badge to take away.
- **One filled CTA per screen** — magenta gel with a glow. Everything else is chrome.
- **Inputs**: white inset wells; focus doubles an aqua ring — visible on chrome and on indigo alike.
- **The plate frame is chrome** — brushed metal border, deep drop shadow, aqua rim light; the picture inside stays an ink engraving.
- **Tables are wet tables** — deep blue gel header row, aqua-tinted zebra rows, right-aligned tabular numerics.

## The failure modes — what each decision forbids

- **No flat Apple restraint** — the owner rejected it: "gallery" is not "portal". A page with only hairlines and empty air is a museum, not a tool.
- **No Y2K vomit** — no lime on aqua, no rotating gradients, no bouncing logos, no tiled chrome textures on every surface. Aqua and magenta have separate roles; lime appears twice on the whole site.
- **No fake OS affordances** — the player's title bar and status cells are not clickable; a button that cannot be pressed is a painted lie. Play, download, back are real.
- **No glow on body text** — halos belong to display type, the eye, and edges.
- **No marketing verbs** — "seamless", "supercharge", "unleash" remain forbidden; only verbs the product performs and facts it can prove.
- **No decoration without a sentence** — any pixel on this page that cannot be explained in one sentence in [`design-elements.md`](design-elements.md) does not ship.
