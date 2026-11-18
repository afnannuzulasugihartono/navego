import { index, route, type RouteConfig } from '@react-router/dev/routes';

// WHY one route per page: Cloudflare Pages serves the flat .html file for both the pretty URL and the file URL,
// so /beranda and /beranda.html are the same document. A duplicate route per URL bakes two route ids into two files
// that both answer at two URLs, and the hydration mismatch (React error #418) hides behind the pretty one.
// The worker in site/worker/_worker.ts answers every legacy .html URL with a 301 to the pretty path instead.
// WHY 404.html is a route of its own: it is the Pages fallback for unknown paths, prerendered as one flat file.

const PAGES: Array<[path: string, file: string, id: string]> = [
  ['beranda', './routes/beranda.tsx', 'beranda'],
  ['fitur', './routes/fitur.tsx', 'fitur'],
  ['harga', './routes/harga.tsx', 'harga'],
  ['unduh', './routes/unduh.tsx', 'unduh'],
  ['docs', './routes/docs.tsx', 'docs'],
  ['mcp', './routes/mcp.tsx', 'mcp'],
  ['dukungan', './routes/dukungan.tsx', 'dukungan'],
  ['privasi', './routes/privasi.tsx', 'privasi'],
  ['syarat', './routes/syarat.tsx', 'syarat'],
  ['akun', './routes/akun.tsx', 'akun'],
  ['dashboard', './routes/dashboard.tsx', 'dashboard'],
  ['artikel', './routes/artikel.tsx', 'artikel'],
  ['artikel/ai-browser-indonesia', './routes/artikel-ai-browser-indonesia.tsx', 'artikel-ai-browser-indonesia'],
  ['oauth/consent', './routes/consent.tsx', 'oauth-consent'],
];

export default [
  index('./routes/index.tsx'),
  ...PAGES.map(([path, file, id]) => route(path, file, { id: `routes/${id}` })),
  route('404.html', './routes/notfound.tsx'),
  route('*', './routes/notfound.tsx', { id: 'catch-all' }),
] satisfies RouteConfig;
