// Flattens the prerendered directory layout to the flat .html URLs the site has always served.
// react-router v7 writes <route>/index.html; Cloudflare Pages and our tests expect <route> as a file.
// The rewrite is a pure rename — bytes never change.
// WHY the map and not "whatever is in the directory": the pretty route /oauth/consent can only ship as oauth/consent.html, because Pages resolves /oauth/consent to the .html file and the 404 fallback flattens the same way.

import { existsSync, readdirSync, renameSync, rmdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

const client = new URL('../build/client/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const routes = [
  'beranda', 'fitur', 'harga', 'unduh', 'docs', 'mcp',
  'dukungan', 'privasi', 'syarat', 'akun', 'dashboard',
  'artikel', 'artikel/ai-browser-indonesia', 'oauth/consent',
  '404.html'
];

// WHY deepest first: /artikel/ai-browser-indonesia must be moved out of build/client/artikel before the parent dir is removed.

const ordered = [...routes].sort((a, b) => b.split('/').length - a.split('/').length);

for (const route of ordered) {
  const dir = join(client, route);
  const index = join(dir, 'index.html');
  if (!existsSync(index)) continue;
  const target = route.endsWith('.html') ? route : `${route}.html`;
  const temp = join(dirname(join(client, target)), `${route.endsWith('.html') ? route : route.split('/').at(-1) + '.html'}.flat-tmp`);
  renameSync(index, temp);
  // the deeper prerender we move next shares this directory; the 404 file races the .html directories
  try {
    rmdirSync(dir);
  } catch {
  }
  renameSync(temp, join(client, target));
}

const left = readdirSync(client).filter((entry) => entry.endsWith('.html') && statSync(join(client, entry)).isDirectory());
if (left.length) {
  console.error('flatten-prerender: directory-style routes remain:', left.join(', '));
  process.exit(1);
}
console.log('flatten-prerender: flat .html output ready');
