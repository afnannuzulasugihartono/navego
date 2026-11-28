// @last-edited: 2026-11-18 UTC+7.
// @title: _worker — serves the invoice page from the product's own domain, because the function's domain refuses HTML.
// @state: proxies /invoice to the billing function with its query and body, relabels the page, and rewrites the refresh redirect back to /invoice; every other path is the asset server's.
// @dependencies: the deployed navego-billing function, env.ASSETS.

// THIS FILE EXISTS because Supabase's shared function domain answered the function's HTML with text/plain and a locked-down CSP - the browser showed the page as source and a customer holding a real invoice had no way to pay it.
// Measured live on 2026-10-26: Supabase's shared function domain answered the function's HTML with Content-Type text/plain and content-security-policy default-src 'none'; sandbox.
// The browser showed the page as source and the refresh form could not be submitted, so a customer holding a real invoice had no way to pay it.
// The gateway does that on purpose on a domain shared by every project, so the page is served from the product's own domain and the function stays the only thing that knows the invoice.

// THE WORKER IS THE WHOLE SITE ONCE IT EXISTS.
// A Pages project has one _worker.js, and every request passes through it.
// So this worker owns /invoice and hands every other request to the asset server unchanged: the site is one directory, and the page is one path in it.

// THE PAGE'S HEADERS ARE SET HERE AND NOT READ FROM THE FUNCTION because the gateway keeps the policy but replaces the content type - a page carrying a token must not be cached, must not leak the link as referrer, and must not be framed or indexed.
// The function sets them, and the gateway keeps the policy but replaces the content type with text/plain.
// A page that carries a token must not be cached, must not leak the link as a referrer, and must not be framed or indexed, so the worker states all of it on the answer the browser actually receives.

const FUNCTION_URL = 'https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/navego-billing';
const PAGE_PATH = '/invoice';
const PAGE_POLICY = "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'";

const PAGE_HEADERS = Object.freeze({
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'no-store',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'x-robots-tag': 'noindex, nofollow',
  'content-security-policy': PAGE_POLICY
});

interface PagesEnv {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

// ONLY TWO HEADERS CROSS TO THE FUNCTION because the page link is a capability in the query string, and the function needs the method, the query, the body and its type to answer - cookies and origin belong to the site.
// The page link is a capability in the query string, and the function needs the method, the query, the body and its type to answer.
// A browser's cookies and origin headers belong to the site, not to this invoice, and forwarding them would hand the function a session it has no use for.

async function askFunction(request: Request): Promise<Response> {
  const target = new URL(FUNCTION_URL);
  target.search = new URL(request.url).search;
  const headers = new Headers();
  for (const name of ['accept', 'content-type']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const init: RequestInit = { method: request.method, headers, redirect: 'manual' };
  if (request.method !== 'GET' && request.method !== 'HEAD') init.body = await request.arrayBuffer();
  return fetch(target.toString(), init);
}

// A REDIRECT IS REWRITTEN INSTEAD OF FOLLOWED because the refresh form posts here and the function answers 303 to its own path - following it would leave the browser at the old address, and a reload would repost the form.
// The refresh form posts here, and the function answers 303 to the address it knows: its own path.
// Following that answer would leave the browser at the old address with a 200, so a reload would post the form again.
// Rewriting the Location keeps the address and the method honest, and only the function's own answer is rewritten, so another host cannot be turned into a link on the product's domain.

// THE PATH THE FUNCTION SEES IS NOT THE PATH IN THIS FILE because the gateway strips the prefix - the rule is the shape of the answer, not a guessed path.
// Measured live on 2026-10-26: the same function answered a redirect to /navego-billing, not to /functions/v1/navego-billing, because the gateway strips the prefix before the function reads its own URL.
// So the rule is the shape of the answer, not a path this file guessed: a root-relative Location belongs to the function, and an absolute one is rewritten only when its host is the function's.

function pageLocation(location: string | null): string {
  if (!location) return '';
  let at: URL;
  try {
    at = new URL(location, FUNCTION_URL);
  } catch {
    return '';
  }
  const fn = new URL(FUNCTION_URL);
  const ours = location.startsWith('/') || at.origin === fn.origin;
  if (!ours) return '';
  return `${PAGE_PATH}${at.search}`;
}

// THE BODY DECIDES WHAT THE PAGE IS, NOT THE CONTENT TYPE because the gateway labels every function answer text/plain - the first characters are the only honest way to tell a page from an error.
// The gateway labels every function answer text/plain, so the content type the function sent no longer says what the body is.
// The page starts with a doctype and an error is JSON, so the first characters are the only honest way to tell them apart.

const looksLikePage = (body: string): boolean => /^\s*(<!doctype html|<html[\s>])/i.test(body);

// A FAILURE IS A PAGE AND NOT A STACK TRACE because the customer cannot do anything with the worker's error, and the worker cannot say whether the invoice changed.
// The customer cannot do anything with the worker's error, and the worker cannot say whether the invoice changed.
// So a failure says only that the page could not be loaded and that nothing has changed, and the reason goes to the Pages log.

function failure(): Response {
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Invoice</title><style>body{font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;max-width:44rem;margin:1.5rem auto;padding:0 1rem;color:#111}</style></head><body><h1>The invoice could not be loaded just now.</h1><p>Nothing has changed. Try again in a moment.</p></body></html>';
  return new Response(html, { status: 502, headers: PAGE_HEADERS });
}

async function serveInvoice(request: Request): Promise<Response> {
  let upstream: Response;
  try {
    upstream = await askFunction(request);
  } catch (error) {
    console.error('INVOICE_PROXY_FAILED', error instanceof Error ? error.message : String(error));
    return failure();
  }
  if (upstream.status >= 300 && upstream.status < 400) {
    const location = upstream.headers.get('location') || '';
    const headers = new Headers({ 'cache-control': 'no-store' });
    const rewritten = pageLocation(location);
    if (rewritten) headers.set('location', rewritten);
    else if (location) headers.set('location', location);
    return new Response(null, { status: upstream.status, headers });
  }
  const body = await upstream.text();
  const type = upstream.headers.get('content-type') || '';
  if (type.includes('text/html') || looksLikePage(body)) {
    return new Response(body, { status: upstream.status, headers: PAGE_HEADERS });
  }
  return new Response(body, {
    status: upstream.status,
    headers: {
      'content-type': type || 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'x-robots-tag': 'noindex, nofollow'
    }
  });
}

// A /api/region DOOR EXISTS because the pricing page prices by the visitor's region, and the country comes from the IP Cloudflare terminates - it cannot come from the browser.
// The pricing page shows the group of plans priced for the visitor's region, and the region comes from the IP Cloudflare terminates — it cannot come from the browser.
// This door answers exactly that: the country code Cloudflare attributes to the request, or null when the platform said nothing, and nothing else.
// It is deliberately tiny: no account, no cookie, no log of who asked.

const REGION_PATH = '/api/region';

function regionFrom(request: Request): string | null {
  const cf = (request as Request & { cf?: { country?: unknown } }).cf;
  const raw = typeof cf?.country === 'string' ? cf.country : request.headers.get('cf-ipcountry');
  const country = String(raw ?? '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(country) ? country : null;
}

// the .html aliases answer 301 because every page is prerendered under its pretty route id - serving .html inline would hydrate against the pretty id and error on every visit.
// Serving .html inline would hydrate against the pretty route id baked into the file and React error #418 on every page; a 301 keeps the legacy URLs honest without baking a second manifest.
// the fallback answers 404 with the real page because the Pages asset server answers missing paths with an empty 404 - unknown paths deserve the designed page like every other route.

// THE PREDECESSOR DOMAIN REDIRECTS PERMANENTLY because the old opera-agent.pages.dev host still serves this same Pages project, and a reader who follows an old link must land on the product's name, not on a stale copy of the site under a retired domain.
// The host check runs before any asset is served, so every path on the old host - including asset paths - moves with the visitor.
// The redirect keeps the path, the query and the hash, so a deep link to a pairing door (/dashboard.html?pair=1#pairing) survives the move.

const CANONICAL_HOST = 'navego.pages.dev';
const LEGACY_HOSTS = new Set(['opera-agent.pages.dev']);

function canonicalRedirect(request: Request): Response {
  const asked = new URL(request.url);
  return new Response(null, {
    status: 301,
    headers: { location: `https://${CANONICAL_HOST}${asked.pathname}${asked.search}${asked.hash}` }
  });
}

export default {
  async fetch(request: Request, env: PagesEnv): Promise<Response> {
    const url = new URL(request.url);
    if (LEGACY_HOSTS.has(url.hostname)) return canonicalRedirect(request);
    const path = url.pathname;
    if (path === '/index' || path === '/index.html') return new Response(null, { status: 301, headers: { location: '/' } });
    if (path === '/404.html') return env.ASSETS.fetch(request);
    if (path === REGION_PATH) {
      return new Response(JSON.stringify({ country: regionFrom(request) }), {
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
      });
    }
    // Two homepages split the story and the legacy one is the weaker page, so both spellings move to one address.
    if (path === '/beranda' || path === '/beranda.html') {
      const asked = new URL(request.url);
      return new Response(null, { status: 301, headers: { location: `/${asked.search}${asked.hash}` } });
    }
    if (path === '/googleeff3efb1a2e4c74e.html') return env.ASSETS.fetch(request);
    if (path.endsWith('.html')) {
      const pretty = path.slice(0, -'.html'.length) || '/';
      const asked = new URL(request.url);
      const suffix = `${asked.search}${asked.hash}`;
      return new Response(null, { status: 301, headers: { location: `${pretty}${suffix}` } });
    }
    if (path === PAGE_PATH || path === `${PAGE_PATH}/`) return serveInvoice(request);
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) return asset;
    const notFound = await env.ASSETS.fetch(new Request(new URL('/404.html', request.url)));
    return new Response(notFound.body, { status: 404, headers: notFound.headers });
  }
};
