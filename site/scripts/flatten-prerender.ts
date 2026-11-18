// Flattens the prerendered directory layout to the flat .html URLs the site has always served.
// react-router v7 writes <route>/index.html; Cloudflare Pages and our tests expect <route> as a file.
// The rewrite is a pure rename — bytes never change.
// WHY the map and not "whatever is in the directory": the pretty route /oauth/consent can only ship as oauth/consent.html,
// because Pages resolves /oauth/consent to the .html file and the 404 fallback flattens the same way.

import { existsSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

const client = new URL('../build/client/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const routes = [
  'beranda', 'fitur', 'harga', 'unduh', 'docs', 'mcp',
  'dukungan', 'privasi', 'syarat', 'akun', 'dashboard',
  'artikel', 'artikel/ai-browser-indonesia', 'oauth/consent',
  '404.html'
];

for (const route of routes) {
  const dir = join(client, route);
  const index = join(dir, 'index.html');
  if (!existsSync(index)) continue;
  const target = route.endsWith('.html') ? route : `${route}.html`;
  const temp = join(client, `${target}.flat-tmp`);
  renameSync(index, temp);
  rmSync(dir, { recursive: true, force: true });
  renameSync(temp, join(client, target));
}

const left = readdirSync(client).filter((entry) => entry.endsWith('.html') && statSync(join(client, entry)).isDirectory());
if (left.length) {
  console.error('flatten-prerender: directory-style routes remain:', left.join(', '));
  process.exit(1);
}
console.log('flatten-prerender: flat .html output ready');
