import { useEffect, type ReactNode } from 'react';
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration, useLocation, useRouteError } from 'react-router';
import { trackView } from './lib/funnel';
import './tokens.css';
import './brand.css';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f6f1e7" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  // Every route reports the page it opened, once per session: the funnel starts where the visitor arrived.
  const location = useLocation();
  useEffect(() => {
    trackView(location.pathname);
  }, [location.pathname]);
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  const is404 = isRouteErrorResponse(error) && error.status === 404;
  return (
    <main className="wrap error-page">
      <p className="section-head"><h2>{is404 ? 'Halaman ini tidak ada.' : 'Terjadi kesalahan.'}</h2></p>
      <p className="text-muted">
        {is404 ? 'Tautan yang Anda ikuti mungkin sudah dipindahkan.' : 'Coba muat ulang halaman ini.'}{' '}
        <a href="/">Kembali ke beranda</a>
      </p>
    </main>
  );
}
