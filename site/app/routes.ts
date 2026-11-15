import { index, route, type RouteConfig } from '@react-router/dev/routes';

// WHY .html paths: the legacy flat URLs are pinned by sitemap.xml, robots.txt and external backlinks.
// Every path below prerenders to <path>.html so nothing moves.

export default [
  index('./routes/index.tsx'),
  route('beranda.html', './routes/beranda.tsx'),
  route('fitur.html', './routes/fitur.tsx'),
  route('harga.html', './routes/harga.tsx'),
  route('unduh.html', './routes/unduh.tsx'),
  route('docs.html', './routes/docs.tsx'),
  route('mcp.html', './routes/mcp.tsx'),
  route('studi.html', './routes/studi.tsx'),
  route('bukti.html', './routes/bukti.tsx'),
  route('dukungan.html', './routes/dukungan.tsx'),
  route('privasi.html', './routes/privasi.tsx'),
  route('syarat.html', './routes/syarat.tsx'),
  route('akun.html', './routes/akun.tsx'),
  route('404.html', './routes/notfound.tsx'),
  route('oauth/consent.html', './routes/consent.tsx'),
  route('dashboard.html', './routes/dashboard.tsx'),
  route('*', './routes/notfound.tsx', { id: 'catch-all' })
] satisfies RouteConfig;
