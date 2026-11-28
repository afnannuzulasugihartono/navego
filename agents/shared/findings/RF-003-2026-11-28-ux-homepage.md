# Homepage UX research — 2026-11-28

Decision supported: collapse the two homepages and lead with proof. The screenshot compared was /beranda, the legacy mockup page that the logo linked to.

## Findings

- Nielsen Norman Group, How Users Read on the Web (https://www.nngroup.com/articles/how-users-read-on-the-web/): 79% of users scan, 16% read word by word. Concise text improved usability 58%, scannable layout 47%, objective language 27%, combined 124%. Users detest marketese; exaggeration adds cognitive load.
- NN/G, 10 Usability Heuristics (https://www.nngroup.com/articles/ten-usability-heuristics/): speak the user's language, not internal jargon; make system status visible; keep the design minimal; provide help and exits.
- Baymard, Cart & Checkout Usability (https://baymard.com/research/checkout-usability): 70.19% cart abandonment; checkout design is often the sole cause; 65% of sites are mediocre or worse.
- Comparison pages: Linear (https://linear.app/) states the product class first, shows real customer quotes and a changelog, and gives one primary CTA. Apple (https://www.apple.com/) shows the product, the offer and one clear action per card.

## Applied to the old /beranda

- Clever headline about architecture ("Situs tanpa API") instead of the user's problem.
- Mockup panel used `portal.internal.id`, "3 tabel ditemukan" and `sha256 a4f12765…` with no named customer or artifact link.
- Jargon chips (40 tool MCP, SHA-256, 36 primitive) described internals.
- Four competing CTAs between header and hero.
- The hidden cost of "Mulai gratis" (HKCU policy) was on another page, not beside the button.

Result: /beranda and /beranda.html now 301 to /; logo, footer, language link and 404 exits point to the single proof-first homepage. Verified live after deploy 46082274937. This UX change is not the same as acquisition: Google still holds zero indexed pages, see 2026-11-28-why-not-indexed.md.
