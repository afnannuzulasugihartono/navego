# Why nothing is indexed — root-cause research, 2026-11-28 07:24 WIB

## The question first

`site:navego.pages.dev` in Google returned **"did not match any documents"**. Bing also returned no results for the domain. So this is not a ranking problem: the site is not in the index at all.

## What is not broken

Driven with a Googlebot user agent:

- `/`, `/harga`, `/unduh`, `/docs` → HTTP 200, `text/html; charset=utf-8`, no `X-Robots-Tag`.
- `/robots.txt` → 200, `User-agent: *`, `Allow: /`, sitemap declared.
- `/sitemap.xml` → 200, valid XML listing the live routes.
- No `noindex` meta in the served HTML.

Technical access passes; Google itself says meeting the requirements does not guarantee crawl or index.

## Root causes, in order

1. **Discovery has no inbound links.** Google's [How Search Works](https://developers.google.com/search/docs/fundamentals/how-search-works) says most pages are found by following links from already-crawled pages; a sitemap helps discovery but does not guarantee crawling. Our public listing PR `punkpeye/awesome-mcp-servers#20598` is still open, so the one meaningful inbound link never landed. Search for `"navego.pages.dev"` showed unrelated "Navigo"/"NaveGo" results, not ours.
2. **The canonical signal was invalid.** The served HTML contained `<meta rel="canonical" href="...">`. Google's [canonicalization guide](https://developers.google.com/search/docs/crawling-indexing/canonicalization) names `rel="canonical"` **link** annotations as an indexing signal. A meta element with a rel attribute is not that signal.
3. **Query wording mismatch.** Google's [Search Essentials](https://developers.google.com/search/docs/essentials) says to use words people search for in the title and main heading. Our titles say "Situs tanpa API. Perintah jadi berkas" and "Harga yang bisa Anda hitung"; searches are "browser MCP signed-in Chrome", "cara pakai MCP di browser yang sudah login". Those results are currently occupied by BrowserMCP, Browserbase and Cursor docs.
4. **Too little answer-shaped content.** One article with FAQ JSON-LD cannot cover the query space. Google says helpful, reliable, people-first content influences presence more than technical tweaks.
5. **No Search Console verification.** Crawl/index status can only be confirmed there; that needs the owner's account and will not be requested.

## What changed in this run

A failing test was written first, then `site/app/lib/seo.ts` now emits `{ tagName: 'link', rel: 'canonical', href }`, matching React Router's own documented way to render a `<link>` from a meta descriptor. The test passes; `npm test` and `npm run check` exit 0.

This fixes cause 2. It does **not** guarantee indexing — Google explicitly says indexing is not guaranteed, and causes 1, 3 and 4 remain. The next bounded work is one answer-shaped page targeting one real query plus a real inbound link from the listing PR.
