import type { Config } from '@react-router/dev/config';

// WHY ssr:false + prerender. The site is a static artefact on Cloudflare Pages: every
// route is rendered to HTML at build time, then hydrated client-side. There is no
// server in production; /invoice stays a Pages Function via public/_worker.js.
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
    '/studi.html',
    '/bukti.html',
    '/dukungan.html',
    '/privasi.html',
    '/syarat.html',
    '/akun.html',
    '/404.html',
    '/oauth/consent.html',
    '/dashboard.html'
  ]
} satisfies Config;
