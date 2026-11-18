import type { Config } from '@react-router/dev/config';

// WHY ssr:false + prerender.
// The site is a static artefact on Cloudflare Pages: every route is rendered to HTML at build time, then hydrated client-side.
// There is no server in production; /invoice stays a Pages Function, compiled from site/worker/_worker.ts to build/client/_worker.js at build time.

export default {
  ssr: false,
  // One flat file per route, prerendered at build time: Cloudflare Pages serves the extensionless file for the pretty URL and the .html file directly.
  prerender: [
    '/',
    '/beranda',
    '/fitur',
    '/harga',
    '/unduh',
    '/docs',
    '/mcp',
    '/dukungan',
    '/privasi',
    '/syarat',
    '/akun',
    '/404.html',
    '/oauth/consent',
    '/dashboard',
    '/artikel',
    '/artikel/ai-browser-indonesia'
  ]
} satisfies Config;
