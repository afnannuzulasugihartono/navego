// Injects the CSP hashes of React Router's prerendered boot scripts into build/client/_headers.
// The checked-in public/_headers carries script-src 'self'; the prerendered pages also ship RR's inline hydration boot, which Cloudflare must allow — by hash, never by 'unsafe-inline'.
// The rewrite is deterministic per build: same bytes, same hashes.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const client = new URL('../build/client/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});

const hashes = new Set();
for (const file of walk(client)) {
  if (!file.endsWith('.html')) continue;
  const html = readFileSync(file, 'utf8');
  for (const match of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    hashes.add(createHash('sha256').update(match[1], 'utf8').digest('base64'));
  }
}
if (hashes.size === 0) {
  console.error('inline-script-hashes: no inline scripts found — is this a prerendered build?');
  process.exit(1);
}
const hashList = [...hashes].map((hash) => `'sha256-${hash}'`).join(' ');
const headersPath = join(client, '_headers');
const headers = readFileSync(headersPath, 'utf8');
const rewritten = headers.replace(/script-src 'self'(?=[;\n])/g, `script-src 'self' ${hashList}`);
writeFileSync(headersPath, rewritten);
console.log(`inline-script-hashes: ${hashes.size} inline script hashes injected into build/client/_headers`);
