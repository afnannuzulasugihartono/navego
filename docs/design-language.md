# Corbin — the design language, every decision with its meaning

@last-edited: 2026-11-16 UTC+7.
@state: the constitution for every visible pixel of the site; the audit's sibling is [`design-elements.md`](design-elements.md), which justifies each element, not each value.
@related: [`AGENTS.md`](../AGENTS.md) · [`ARCHITECTURE.md`](../ARCHITECTURE.md) · [`docs/design-elements.md`](design-elements.md)

Every word, element, color, style, image and proportion below says why it exists. A decision without a sentence in this file does not ship. Nothing ships for decoration; nothing hides for convenience.

## The name

- **Corbin** — from the Latin *corvus*, raven; the Germanic given name meaning raven. Short, spellable, one syllable in every European language the site supports.
- **The raven** — Odin's Huginn and Muninn: thought and memory, the two birds that fly across the world each day and return with what they saw. The product is the same animal in code: it flies out (reads your page), it flies back (tells you what it found), it acts (moves the browser). Every visual decision on this site descends from that one bird.

## The images

- **The 1874 Naumann plate** (`Corvus corax`, after Naumann, 1874, public domain) — the bird as naturalists measured it: steep forehead, the hump of feathers over the bill base, the hooked culmen, the shaggy crown and throat, the eye ringed in a face of streaks. Used as the opening gesture on beranda/index/404 because it is the raven drawn by the era of the raven before photography — authentic anatomy, not a brand doodle. It is *borrowed*, so it carries its credit line everywhere it lands.
- **The vector mark** (`components/Raven.tsx`, `public/icon.svg`) — the plate reduced to the three shapes that survive 16 pixels: filled silhouette, amber eye, knocked-out beak line. Used in the header, footer and favicon. It is the bird at a glance; the plate is the bird at a sitting.

## The palette

- **Paper `#f4f1e9`** — every page of this site is a document you read, not an app you operate. Paper is the surface of every honest instruction manual, lab notebook and naturalist plate ever printed. The raven has flown across those pages for a thousand years; the site is one more.
- **Ink `#16161a`** — the raven's own color, warm-blue near-black, not pure `#000`. Pure black on paper is harsh, crude, cheap; this is feather, not carbon. Every primary stroke, rule and filled surface uses it.
- **The two heavy rules (2px ink) framing every page** — the sheet's two edges. The page is one sheet; the rules hold it open. A page without them is a screen; a sheet with them is a document.
- **Surface `#e7e3d5` / `#ece9de`** — aged linen, the cheapest tone step between paper and ink. Groups content *without* shadows, borders or floating cards. Depth in this system is earned by distance, never bought with blur.
- **Amber `#d8923f`** — the raven's eye. It is the only warm, living point in an all-ink bird, and it is reserved for exactly that role everywhere: the eye, the live/active state, the focus ring, the "this one matters" signal. It never fills a surface; it never decorates. If amber is on screen, something is alive.
- **Good `#2e7d4f`** — forest, not neon. A finished job is a tree that grew, not a siren that cried.
- **Danger `#a63a3a`** — dried blood. An error is a wound the reader should see at full value, never an orange warning to shrug at.
- **Muted `#55524a` / `#3f3f38`** — the feather seen from a distance: still present, not shouting. Prose, captions, secondary labels.

## The typography

- **Instrument Sans Variable, one face, always** — the raven has one voice. Two typefaces would make two arguments; one face makes one. The variable weight axis does all hierarchy (400 body, 700 labels/titles, 800 display), so no page ever says two things in two voices.
- **Display: negative tracking `-0.03em`, weight 800, line-height 0.92–1.02** — the one line the page is built around. One line, one loud voice, like the raven's single croak. Everything else whispers relative to it.
- **Body 15–16px / 1.55** — below 15px a reader squints on cheap screens; above 16 the page becomes a billboard. 1.55 line-height is print composure, not screen airiness.
- **Tabular figures everywhere numbers align** — the raven counts; columns of figures line up or the column is a lie.
- **One line per statement, ever** — the raven speaks in short lines; the page does too.
- **No monospace outside `<code>`** — monospace has one meaning on this site: "run this". Anywhere else it is a lie about code.
- **No tracked-uppercase micro-labels, ever** — shouting in small letters is not hierarchy, it is noise. Sentence case at a readable size is the quietest way to label; nothing else is used.
- **Headlines never exceed two lines at any width** — the raven's eye is wide but finite; two lines is the whole idea.

## The space

- **Frame: one `--maxw: 1160px` column, equal outer margins at every width** — asymmetry lives inside the grid, never in the frame. The raven flies at the same speed regardless of sky.
- **Vertical rhythm 56–96px between sections** — the raven glides; the page breathes. No cramped stacking.
- **Whitespace is the primary separator; tone step is secondary; rules are the frame only** — three distances, ranked. A divider that is not a frame does not exist on this site.
- **Asymmetry: text left, image or panel right (or vice versa)** — a raven crosses a field diagonally, not dead center. No section is centered; the eye travels.

## The surfaces

- **Cards exist to group ambiguous-to-group content, and never to decorate** — the tone step replaces the border; the border replaces nothing. If a card holds one sentence, it is not a card, it is a paragraph with shoulders.
- **One filled button per screen, ever** — attention is finite and the reader is a raven, not a crowd. The filled button is the one thing the page wants from you; everything else is a door, not a drum.
- **Inputs carry 2px inset strokes** — the only stroke on a control that means "you can type here", and the focus stroke doubles as the answer to "where am I".
- **Chrome (header/footer) is paper and one 2px rule each** — the site is its own furniture; it does not need a second coat.

## The images

- **Photographs or the 1874 plate only** — no stock illustration, no icon grids, no fake product shots. A page that cannot show the thing shows the real thing, or it shows the bird.
- **Every image is captioned with its source** — a borrowed bird is a borrowed fact; credit is the price of carrying it.

## The failure modes — what each decision forbids

- **No gradients, glows, glass, blur** — they lie about depth; depth here is distance, tone and shape.
- **No shadows on rest** — resting things cast nothing; only dialogs and menus float.
- **No centered long-form text** — documents are never centered.
- **No marketing verbs** — "seamless", "supercharge", "unleash", "jam-packed" are forbidden; only verbs the product performs on the page, and facts it can prove.
- **No decoration without a sentence** — any pixel on this page that cannot be explained in one sentence in [`design-elements.md`](design-elements.md) is a pixel that does not ship.
