import type { Config } from '@react-router/dev/config';

// ssr:false + prerender because every route is static HTML on Pages - there is no server, and every page documents itself.
// The site is a static artefact on Cloudflare Pages: every route is rendered to HTML at build time, then hydrated client-side.
// There is no server in production; /invoice stays a Pages Function, compiled from site/worker/_worker.ts to build/client/_worker.js at build time.
// One flat file per route, prerendered at build time: Cloudflare Pages serves the extensionless file for the pretty URL and the .html file directly.

export default {
  ssr: false,
  prerender: [
    '/',
    '/beranda',
    '/en',
    '/fitur',
    '/harga',
    '/unduh',
    '/masuk',
    '/docs',
    '/mcp',
    '/dukungan',
    '/bandingkan',
    '/changelog',
    '/faq',
    '/keamanan',
    '/metodologi',
    '/privasi',
    '/syarat',
    '/akun',
    '/404',
    '/oauth/consent',
    '/dashboard',
    '/artikel',
    '/artikel/ai-browser-indonesia'
  ]
} satisfies Config;
