// @last-edited: 2026-11-16 UTC+7.
// @title: site — the rebuilt Navego site, gated on its own build.
// @state: builds the site, type-checks it, then parses build/client for the per-page contract.
// @dependencies: site/ (React Router v7 + TypeScript), node:test, node:child_process.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { siteRules } from '../helpers/site-headers.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const site = path.join(root, 'site');
const client = path.join(site, 'build', 'client');

const ROUTES = [
  '/', '/beranda.html', '/fitur.html', '/harga.html', '/unduh.html', '/docs.html',
  '/mcp.html', '/dukungan.html', '/privasi.html',
  '/syarat.html', '/akun.html', '/404.html', '/oauth/consent.html', '/dashboard.html',
  '/artikel.html', '/artikel/ai-browser-indonesia.html'
];

const toFile = (route: string) => {
  if (route === '/') return 'index.html';
  return route.replace(/^\//, '');
};

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
let built: boolean | null = null;
const siteDir = path.join(root, 'site');

function buildSite() {
  if (built) return built;
  // WHY no --prefix: with --prefix npm re-registers the enclosing package (navego) as a file: dependency of the site every run.
  const quiet = (args: string[]) => {
    try {
      execFileSync(npm, args, { cwd: siteDir, stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' });
    } catch (error) {
      const failure = error as { stdout?: unknown; stderr?: unknown };
      const out = [failure.stdout, failure.stderr].filter(Boolean).map((b) => String(b)).join('\n');
      assert.fail(`npm ${args.join(' ')} failed:\n${out}`);
    }
  };
  if (!fs.existsSync(path.join(siteDir, 'node_modules'))) {
    quiet(['ci', '--ignore-scripts', '--no-audit', '--no-fund']);
  }
  quiet(['run', 'typecheck']);
  quiet(['run', 'build']);
  built = true;
  return built;
}

const readBuilt = (route: string) => fs.readFileSync(path.join(client, toFile(route)), 'utf8');

test('the build produces every prerendered route', () => {
  buildSite();
  for (const route of ROUTES) {
    assert.ok(fs.existsSync(path.join(client, toFile(route))), `build/client/${toFile(route)} exists`);
  }
});

// WHY the dashboard is the exception: it gates on a client-side session; the static shell says "checking" and the h1 paints after sign-in.

test('every page carries exactly one h1', () => {
  buildSite();
  for (const route of ROUTES) {
    const html = readBuilt(route);
    const count = (html.match(/<h1[\s>]/g) || []).length;
    if (route === '/dashboard.html') {
      assert.equal(count, 0, '/dashboard.html ships the pre-session shell');
      assert.ok(html.includes('Memeriksa sesi'));
      continue;
    }
    assert.equal(count, 1, `${route} carries exactly one <h1>`);
  }
});

test('no i18n machinery ships in the build', () => {
  buildSite();
  for (const route of ROUTES) {
    const html = readBuilt(route);
    assert.equal(html.includes('data-i18n'), false, `${route} has no data-i18n`);
    assert.equal(html.includes('i18n.js'), false, `${route} does not reference i18n.js`);
    assert.equal(/<html[^>]*lang="id"/.test(html), true, `${route} is Indonesian`);
  }
});

test('every inline script is covered by the CSP hashes in build/client/_headers', () => {
  buildSite();
  const headers = fs.readFileSync(path.join(client, '_headers'), 'utf8');
  const covered = new Set([...headers.matchAll(/'sha256-([^']+)'/g)].map((m) => m[1]));
  assert.ok(covered.size > 0, 'the build injects the boot hashes');
  let checked = 0;
  for (const route of ROUTES) {
    const html = readBuilt(route);
    for (const match of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
      const script = match[1];
      if (script === undefined) continue;
      const hash = createHash('sha256').update(script, 'utf8').digest('base64');
      assert.ok(covered.has(hash), `${route} carries an inline script the CSP does not allow`);
      checked += 1;
    }
  }
  assert.ok(checked >= 16, `verified ${checked} inline scripts against the CSP`);
});

const CLAIMS = {
  '/beranda.html': ['Navego.', '45', 'primitive browser'],
  '/fitur.html': ['45', 'primitive', 'debugger'],
  '/harga.html': ['Rp10.000', 'Rp249.000', 'QRIS'],
  '/unduh.html': ['navego-update', 'chrome', 'SHA-256'],
  '/docs.html': ['browser_status', 'navego'],
  '/mcp.html': ['navego', '45'],
  '/dukungan.html': ['Dukungan'],
  '/privasi.html': ['Kebijakan Privasi'],
  '/syarat.html': ['Syarat Layanan'],
  '/akun.html': ['Penyedia'],
  '/oauth/consent.html': ['Izin aplikasi'],
  '/dashboard.html': ['Memeriksa sesi'],
  '/404.html': ['Halaman ini tidak ada'],
  '/artikel.html': ['Artikel', 'AI yang mengenal browser'],
  '/artikel/ai-browser-indonesia.html': ['Navego', 'browser Anda'],
  '/': ['Masuk atau daftar', 'magic link']
};

for (const [route, needles] of Object.entries(CLAIMS)) {
  test(`${route} carries the claims the page exists to make`, () => {
    buildSite();
    const html = readBuilt(route);
    for (const needle of needles) {
      assert.ok(html.includes(needle), `${route} contains ${JSON.stringify(needle)}`);
    }
  });
}

test('_worker.js is compiled from the checked-in TypeScript source', () => {
  buildSite();
  const fromBuild = fs.readFileSync(path.join(client, '_worker.js'), 'utf8');
  assert.ok(fromBuild.includes('navego-billing'), 'the invoice proxy is intact');
  assert.ok(fromBuild.includes('/invoice'), 'the worker owns /invoice');
  assert.ok(fromBuild.includes('x-frame-options'), 'the page denies framing');
  assert.ok(fromBuild.includes('env.ASSETS') || fromBuild.includes('ASSETS.fetch'), 'everything else is the asset server');
  assert.ok(fs.existsSync(path.join(site, 'worker', '_worker.ts')), 'site/worker/_worker.ts is the source of truth');
  assert.equal(fs.existsSync(path.join(site, 'public', '_worker.js')), false, 'the hand-written twin is gone');
});

// WHY robots.txt and sitemap.xml carry no CSP: static policy files, not HTML.

test('_headers covers every route, forbids inline scripts, denies framing everywhere', () => {
  buildSite();
  const rules = siteRules();
  const byPath = new Map<string, Record<string, string>>();
  for (const rule of rules) {
    const first = rule.paths[0];
    if (first !== undefined) byPath.set(first, rule.headers);
  }
  const variants = ROUTES.flatMap((route) => route === '/' ? ['/', '/index.html'] : [route, route.replace(/\.html$/, '')]);
  for (const variant of variants) {
    assert.ok(byPath.has(variant), `_headers carries the ${variant} block`);
  }
  for (const rule of rules) {
    const policy = rule.headers['Content-Security-Policy'] || '';
    if (!policy) continue;
    assert.equal(rule.headers['X-Frame-Options'], 'DENY', `${rule.paths[0]} denies framing`);
    assert.match(policy, /script-src 'self'(?=[ ;])/, `${rule.paths[0]} scripts from self`);
    assert.equal(policy.includes("script-src 'self' 'unsafe-inline'"), false, `${rule.paths[0]} carries no unsafe-inline in script-src`);
  }
});

test('the client router answers the file URL and the legacy pretty URL alike', () => {
  buildSite();
  const assets = fs.readdirSync(path.join(client, 'assets'));
  const manifest = assets.find((f) => f.startsWith('manifest-') && f.endsWith('.js'));
  assert.ok(manifest, 'the build ships a router manifest');
  const source = fs.readFileSync(path.join(client, 'assets', manifest), 'utf8');
  const slugs = ['beranda', 'fitur', 'harga', 'unduh', 'docs', 'mcp', 'dukungan', 'privasi', 'syarat', 'akun', 'dashboard', 'artikel', 'artikel/ai-browser-indonesia', 'oauth/consent'];
  for (const slug of slugs) {
    assert.ok(source.includes(`"path":"${slug}"`), `the router knows /${slug}`);
    assert.ok(source.includes(`"path":"${slug}.html"`), `the router knows /${slug}.html`);
  }
  assert.ok(source.includes('"path":"index.html"'), 'the router knows /index.html');
});

test('the sitemap names exactly the routes the build carries (404 and unknowns are not in it)', () => {
  buildSite();
  const sitemap = fs.readFileSync(path.join(client, 'sitemap.xml'), 'utf8');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => String(m[1]).replace('https://navego.pages.dev', ''));
  const expected = ['/beranda', '/fitur', '/harga', '/unduh', '/docs', '/mcp', '/dukungan', '/privasi', '/syarat', '/akun', '/dashboard', '/artikel', '/artikel/ai-browser-indonesia', '/oauth/consent', '/'];
  assert.deepEqual([...locs].sort(), [...expected].sort());
});

test('no i18n or legacy machinery files ride along in the site source', () => {
  buildSite();
  const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
  const files = walk(site).filter((f) => !f.includes(`${path.sep}node_modules${path.sep}`) && !f.includes(`${path.sep}build${path.sep}`) && !f.includes(`${path.sep}.react-router${path.sep}`));
  const banned = files.filter((f) => /i18n|palette\.js|reveal\.js|wayfind\.js/.test(path.basename(f)));
  assert.deepEqual(banned, [], 'no legacy machinery files');
});
