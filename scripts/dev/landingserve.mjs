// @last-edited: 2026-11-16 UTC+7.
// @title: site-serve — serve site/build/client/ on 127.0.0.1 so the rebuild can be looked at before it ships.
// @state: one throwaway server for the review step; it reads the build output and answers, and holds no state.
// @dependencies: node:http, node:fs, node:path.

// WHY THIS EXISTS.
// A redesign is judged by looking at it, and the shipped site is deployed by a manual dispatch.
// This serves the exact bytes the build produced, so the screenshots are of the change and not of the last deploy.
// Run `npm run build --prefix site` first.

import { createServer } from 'node:http';
import { readdir, readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../site/build/client/', import.meta.url));
const rootWithSep = root.endsWith(sep) ? root : root + sep;
const types = { '.css': 'text/css', '.js': 'text/javascript', '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8' };
const port = Number(process.argv[2] || 8777);

// WHY THE PATH IS BUILT FROM A WHITELIST, NOT JOINED FROM THE REQUEST: joining user input into a filesystem path is the shape the traversal checks flag, whatever guard follows it.
// The request names a file, the whitelist decides whether it exists, and only files inside the build output are servable.

const entries = new Set();
async function walk(dir, prefix) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) await walk(join(dir, entry.name), rel);
    else entries.add(rel);
  }
}
await walk(root, '');

createServer(async (req, res) => {
  const raw = (req.url || '/').split('?')[0];
  if (/%|\\/.test(raw) || /\0|\.\./.test(raw)) {
    res.writeHead(403);
    res.end();
    return;
  }
  const path = decodeURIComponent(raw);
  const name = path === '/' ? 'index.html' : path.replace(/^\//, '');
  if (!/^[A-Za-z0-9._/-]+\.(html|css|js|svg|woff2|jpg|xml|txt)$|^(oauth\/consent|index|404)\.html$/.test(name)) {
    res.writeHead(404);
    res.end();
    return;
  }
  if (!entries.has(name) && !entries.has(`${name}.html`)) {
    res.writeHead(404);
    res.end();
    return;
  }
  const file = entries.has(name) ? resolve(root, name) : resolve(root, `${name}.html`);
  if (!file.startsWith(rootWithSep)) {
    res.writeHead(403);
    res.end();
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
}).listen(port, '127.0.0.1', () => console.log(`site served on http://127.0.0.1:${port}`));
