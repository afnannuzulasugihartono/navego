# Why nothing is indexed — 2026-11-28

Decision supported: what to fix before expecting organic traffic. Live evidence and the full reasoning are in docs/proof/2026-11-28-0724-why-not-indexed.md.

## Measured

- Google `site:navego.pages.dev` → "did not match any documents"; Bing also had no domain result.
- With a Googlebot user agent: `/`, `/harga`, `/unduh`, `/docs` answered 200 text/html with no X-Robots-Tag; `/robots.txt` allowed `/` and declared the sitemap; `/sitemap.xml` was valid. No noindex in HTML.

## Causes, ordered

1. No inbound links: Google's How Search Works says most pages are discovered by links from already-crawled pages; a sitemap helps but does not guarantee crawling. The awesome-mcp-servers PR #20598 is still Open, so that link never landed.
2. Invalid canonical signal: pages emitted `<meta rel="canonical">`. Google's canonicalization guide names rel=canonical **link** annotations as an indexing signal. Fixed in PR #531; live HTML now has `<link rel="canonical" .../>`.
3. Query wording mismatch: Search Essentials says to use the words people search for in title and main heading. Our headings describe architecture; queries are "browser MCP signed-in Chrome" and its Indonesian equivalents.
4. Too little answer-shaped content: one article with FAQ JSON-LD cannot cover the query space.
5. No Search Console verification; that needs the owner's account and is not requested.

Google explicitly says indexing is not guaranteed even when the technical requirements pass. Fixing the canonical tag addresses cause 2 only; it does not promise traffic.

Sources: https://developers.google.com/search/docs/fundamentals/how-search-works , https://developers.google.com/search/docs/crawling-indexing/canonicalization , https://developers.google.com/search/docs/essentials , https://developers.google.com/search/docs/beginner/seo-starter-guide , https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview .
