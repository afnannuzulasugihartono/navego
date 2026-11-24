// Injects the CSP hashes of React Router's prerendered boot scripts into build/client/_headers.
// The checked-in public/_headers carries script-src 'self'; each prerendered page also ships RR's inline hydration boot, which Cloudflare must allow by hash, never by 'unsafe-inline'.
// The rewrite is deterministic per build, and per page: a hash list belongs to the page whose bytes produced it.

// THE HASH LIST IS PER PAGE, NEVER ONE LIST FOR THE WHOLE SITE.
// A Content-Security-Policy is enforced as an intersection: two CSP headers do not add hashes, they require every policy to allow the script.
// One union list also outgrew Cloudflare's per-header ceiling, and an overlong header is dropped entirely, which blocked the boot script and left every page as static HTML.
// Each page here carries only the hashes it emitted, so the policy stays closed and every header stays short.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';

const client = new URL('../build/client/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});

// The header ceiling Cloudflare enforces before it drops the whole header.

const MAX_HEADER_BYTES = 1900;

const pageHashes = new Map<string, string[]>();
for (const file of walk(client)) {
  if (!file.endsWith('.html')) continue;
  const page = relative(client, file).split(sep).join('/').replace(/\.html$/, '');
  const html = readFileSync(file, 'utf8');
  const seen: string[] = [];
  for (const match of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    const body = match[1];
    if (body === undefined) continue;
    const hash = createHash('sha256').update(body, 'utf8').digest('base64');
    if (!seen.includes(hash)) seen.push(hash);
  }
  pageHashes.set(page === 'index' ? '' : page, seen);
}
if (pageHashes.size === 0) {
  console.error('inline-script-hashes: no inline scripts found - is this a prerendered build?');
  process.exit(1);
}

// A block path names the page it protects: `/` and `/index.html` are the index page, `/beranda` and `/beranda.html` are beranda.html, and a nested route keeps its folders.

const pageForBlock = (path: string): string => {
  const bare = path.replace(/^\//, '');
  const key = bare.endsWith('.html') ? bare.slice(0, -'.html'.length) : bare;
  return key === 'index' ? '' : key;
};

const headersPath = join(client, '_headers');
const lines = readFileSync(headersPath, 'utf8').split('\n');
let block = '';
let rewritten = 0;
for (let index = 0; index < lines.length; index += 1) {
  const line = lines[index] ?? '';
  if (line.startsWith('/')) {
    block = line.trim();
    continue;
  }
  if (!line.trimStart().startsWith('Content-Security-Policy:')) continue;
  const hashes = pageHashes.get(pageForBlock(block));
  if (!hashes) throw new Error(`inline-script-hashes: ${block} has a CSP but no prerendered page named ${pageForBlock(block)}.html`);
  const list = hashes.map((hash) => `'sha256-${hash}'`).join(' ');
  const next = line.replace(/script-src 'self'(?=[;\n]|$)/, `script-src 'self' ${list}`.trimEnd());
  if (next.length > MAX_HEADER_BYTES) throw new Error(`inline-script-hashes: ${block} CSP is ${next.length} bytes, over Cloudflare's ${MAX_HEADER_BYTES}-byte ceiling`);
  if (next === line) throw new Error(`inline-script-hashes: ${block} CSP did not carry script-src 'self'`);
  lines[index] = next;
  rewritten += 1;
}
if (rewritten === 0) {
  console.error('inline-script-hashes: no CSP lines were rewritten');
  process.exit(1);
}
writeFileSync(headersPath, lines.join('\n'));
const total = [...pageHashes.values()].reduce((sum, list) => sum + list.length, 0);
console.log(`inline-script-hashes: ${rewritten} CSP line(s) rewritten from ${pageHashes.size} page(s), ${total} hash entries, one policy per page`);
