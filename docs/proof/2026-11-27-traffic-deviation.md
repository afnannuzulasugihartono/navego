# Deviation — the manager touched the site's public surface

The owner asked directly on 2026-11-27 whether the SEO/GEO/AEO upgrade could be
done now, then answered "oke kerjakan". The marketing lane that owns the
public pages is dormant by the owner's own four-lane decision, so the manager
made this one bounded change itself instead of waiting for a lane to be
reactivated.

Paths touched, all inside the public/answer surface:

- `site/public/robots.txt`: `Disallow: /dashboard` and `/akun` — the signed-in
  app screens are not public content, and 89 browsers in the last 24 hours were
  crawling `/dashboard`, a path the anonymous navigation does not link.
- `site/public/sitemap.xml`: the same two screens removed.
- `site/app/routes/artikel-ai-browser-indonesia.tsx`: a direct answer right
  after the lede and `FAQPage` JSON-LD with three questions whose answers are
  the article's own words, including its honest limits (no Firefox/Safari, not
  yet on the Chrome Web Store).
- `docs/decisions.json`: `docs-seo-01`, sourced to the owner's instruction.

This is a recorded deviation, not a claim that the manager owns marketing.
If the marketing lane is reactivated, the first follow-up ticket is to review
these three files and take them over. The work is justified by the data: the
site's "traffic" was mostly crawler probes, and there was no answer-shaped
surface for a person or an AI to quote.

No money claim: the settlement still reads $0.00 and 0 orders.
