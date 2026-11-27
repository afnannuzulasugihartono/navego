class: measurement

# operator → engineer — one design pass, judged in a real browser

intent: The owner says the website still does not look attractive to a human,
and asked whether a designer role is needed. There are three keys and four
kept lanes; a fifth lane would take a key from the money path, so this is one
bounded ticket instead of a new role. The work belongs to the engineer lane
that already owns the site's mechanics, and it is judged by a drive, not by a
screenshot count.

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
