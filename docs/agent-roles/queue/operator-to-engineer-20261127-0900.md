class: measurement

# operator → engineer — one design pass, judged in a real browser

intent: The owner says the website still does not look attractive to a human,
and asked whether a designer role is needed. There are three keys and four
kept lanes; a fifth lane would take a key from the money path, so this is one
bounded ticket instead of a new role. The work belongs to the engineer lane
that already owns the site's mechanics, and it is judged by a drive, not by a
screenshot count.

Live read on 2026-11-27 at 1520 px (homepage, real browser, no guesswork):

1. The first screen states the promise ("Situs tanpa API. Perintah jadi berkas.") but shows **no product visual and no proof** - a stranger sees a claim, not an artifact.
2. The install command itself is hidden behind a button ("Semua cara memasang"); the single strongest proof - one command that produces a file - is not visible on the first screen.
3. There is **no verifiable signal of use** near the hero: no real GitHub/npm/Glama status, no measured result. The footer has text links, but trust is built above the fold.
4. For a signed-in viewer the centre of the page is an account card ("Masuk sebagai <email>" + "Buka dashboard"), so the product proof is replaced by account chrome.
5. The page ends almost immediately after that card and the footer: there is no section a stranger can scroll into that shows how it works or that it was actually driven.

Use the **real** artifacts already in the repo, never an invented testimonial: the five driven runs and the two fixed bugs in docs/proof/2026-11-27-engineer.md (2 of 5 produced a verified 2-page PDF, 3 of 5 downloaded a file), the public repo/npm/MCP Registry/Glama links, and a real screenshot of the extension and its resulting file. State the failure rate honestly - that is more credible than a claim of perfection.

why: the site was restyled on 2026-11-23 (PRs #446-#455) and the funnel shows
no stranger who stayed long enough to judge it. Design work without a human
reading the page is polish nobody asked for; a drive at both widths with a
named weakness and one fix is the smallest honest pass.

scopeRequested:

1. **Drive the live site** at 1440 px and 390 px (`navego.pages.dev/`,
   `/harga`, `/unduh`, `/artikel/ai-browser-indonesia`). Read the hero, the
   pricing card and the article's first screen. Name **one** concrete thing a
   human would find unattractive or hard to read, with the width and the page.
   Do not list ten problems; pick the one that costs the most attention.
2. **Fix that one thing** in the site's mechanics you own (`site/app/lib/**`,
   `site/app/components/**`, or the public route files if a brief to the
   dormant marketing lane is not needed). Keep the existing behavior: the
   install command, the price and the honest limits stay visible.
3. **Prove it with a drive again** at the same two widths and record both the
   before and the after in `docs/proof/`, with what you changed and why.
4. **Refresh your line** in `docs/agent-roles/status.md`, and answer this
   ticket with a reply artifact named
   `engineer-reply-<yyyymmdd-HHMM>.md` whose text carries the line
   `answered: operator-to-engineer-20261127-0900.md`. In its `requests`
   section, say whether design work recurs and only then ask for a designer
   lane.

acceptance:

- One named weakness with the width and the page, one fix, and a before/after
  drive recorded in `docs/proof/`.
- `npm test` and `npm run check` green; the deploy is triggered after the
  merge, and the live page is checked again.
- The reply answers this ticket and gives the manager a yes/no on a designer
  lane with the evidence behind it.

deadline: after the measured eval (`operator-to-engineer-20261127-0730.md`)
lands, because that result decides whether anyone is arriving to see the page.

note: this ticket claims no revenue. A design pass is not a sale; it removes
one reason a visitor leaves before reading the price.
