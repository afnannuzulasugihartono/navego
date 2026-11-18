// Flattens the prerendered directory layout to the flat .html URLs the site has always served.
// react-router v7 writes <route>/index.html; Cloudflare Pages and our tests expect <route> as a file.
// The rewrite is a pure rename — bytes never change.
// The walk, not a hardcoded list, because a hardcoded route list is the drift the build hides — the page is emitted, the flat file is not, and nothing warns until a 404.
// Any directory under build/client that carries an index.html is a route; the root index.html stays where it is.

import { existsSync, readdirSync, renameSync, rmdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

const client = new URL('../build/client/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

function collectRoutes(dir: string, prefix: string, out: string[]): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const next = prefix ? `${prefix}/${entry.name}` : entry.name;
      collectRoutes(join(dir, entry.name), next, out);
    } else if (entry.name === 'index.html' && prefix) {
      out.push(prefix);
    }
  }
  return out;
}

// deepest first because /artikel/ai-browser-indonesia must move out of build/client/artikel before the parent directory is removed.

const routes = collectRoutes(client, '', []).sort((a, b) => b.split('/').length - a.split('/').length);

for (const route of routes) {
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
console.log(`flatten-prerender: flat .html output ready (${routes.length} routes flattened)`);
