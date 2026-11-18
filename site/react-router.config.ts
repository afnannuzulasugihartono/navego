import type { Config } from '@react-router/dev/config';

// WHY ssr:false + prerender.
// The site is a static artefact on Cloudflare Pages: every route is rendered to HTML at build time, then hydrated client-side.
// There is no server in production; /invoice stays a Pages Function, compiled from site/worker/_worker.ts to build/client/_worker.js at build time.

export default {
  ssr: false,
  prerender: [
    '/',
    '/beranda.html',
    '/fitur.html',
    '/harga.html',
    '/unduh.html',
    '/docs.html',
    '/mcp.html',
    '/dukungan.html',
    '/privasi.html',
    '/syarat.html',
    '/akun.html',
    '/404.html',
    '/oauth/consent.html',
    '/dashboard.html',
    '/artikel.html',
    '/artikel/ai-browser-indonesia.html'
  ]
} satisfies Config;
