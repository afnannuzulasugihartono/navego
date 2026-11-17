// Flattens the prerendered directory layout to the flat .html URLs the site has always served.
// react-router v7 writes <route>/index.html; Cloudflare Pages and our tests expect <route> as a file.
// The rewrite is a pure rename — bytes never change.

import { existsSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

const client = new URL('../build/client/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const flat = [
  'beranda.html', 'fitur.html', 'harga.html', 'unduh.html', 'docs.html', 'mcp.html',
  'dukungan.html', 'privasi.html', 'syarat.html', 'akun.html',
  '404.html', 'dashboard.html', 'oauth/consent.html'
];

for (const route of flat) {
  const dir = join(client, route);
  const index = join(dir, 'index.html');
  if (!existsSync(index)) continue;
  const temp = join(client, route + '.flat-tmp');
  renameSync(index, temp);
  rmSync(dir, { recursive: true, force: true });
  renameSync(temp, join(client, route));
}

const left = readdirSync(client).filter((entry) => entry.endsWith('.html') && statSync(join(client, entry)).isDirectory());
if (left.length) {
  console.error('flatten-prerender: directory-style routes remain:', left.join(', '));
  process.exit(1);
}
console.log('flatten-prerender: flat .html output ready');
