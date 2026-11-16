import { index, route, type RouteConfig } from '@react-router/dev/routes';

// WHY the file names live in one map: every flat page answers under two URLs — /beranda.html (the file Cloudflare Pages serves) and /beranda (the pretty URL the sitemap and the old backlinks use).
// The client router must know both: a reader who arrives on the legacy URL is flipped to the 404 page the moment the app hydrates, and the static HTML they got is replaced without a word of warning.
// WHY index.html is a route of its own: the sign-in page is prerendered to /index.html, so the router has to match that path too — otherwise /index.html hydrates into the 404.
// WHY every route carries an explicit id: two paths may share one file, and the id a route gets from its file name would collide the moment the second path is added.

const PAGES: Array<[string, string]> = [
  ['beranda', './routes/beranda.tsx'],
  ['fitur', './routes/fitur.tsx'],
  ['harga', './routes/harga.tsx'],
  ['unduh', './routes/unduh.tsx'],
  ['docs', './routes/docs.tsx'],
  ['mcp', './routes/mcp.tsx'],
  ['studi', './routes/studi.tsx'],
  ['bukti', './routes/bukti.tsx'],
  ['dukungan', './routes/dukungan.tsx'],
  ['privasi', './routes/privasi.tsx'],
  ['syarat', './routes/syarat.tsx'],
  ['akun', './routes/akun.tsx'],
  ['dashboard', './routes/dashboard.tsx'],
  ['oauth/consent', './routes/consent.tsx']
];

export default [
  index('./routes/index.tsx'),
  route('index.html', './routes/index.tsx', { id: 'routes/index-html' }),
  ...PAGES.flatMap(([slug, file]) => [
    route(`${slug}.html`, file, { id: `routes/${slug}-html` }),
    route(slug, file, { id: `routes/${slug}-pretty` })
  ]),
  route('404.html', './routes/notfound.tsx'),
  route('*', './routes/notfound.tsx', { id: 'catch-all' })
] satisfies RouteConfig;
