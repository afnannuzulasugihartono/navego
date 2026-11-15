import { Link } from 'react-router';
import { Raven } from './Raven';

const NAV = [
  { href: '/fitur.html', label: 'Fitur' },
  { href: '/harga.html', label: 'Harga' },
  { href: '/docs.html', label: 'Docs' }
];

export function SiteHeader({ current }: { current?: string }) {
  return (
    <header className="site-header">
      <div className="wrap">
        <Link className="brand" to="/beranda.html" aria-label="Corbin — beranda">
          <Raven variant="icon" size={22} />
          <span className="brand-word">corbin</span>
        </Link>
        <nav className="nav" aria-label="Navigasi utama">
          {NAV.map((item) => (
            <Link key={item.href} to={item.href} aria-current={current === item.href ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
          <Link className="btn btn-solid btn-sm" to="/unduh.html">Pasang corbin</Link>
        </nav>
        <details className="nav-menu">
          <summary aria-label="Menu halaman"><span className="bars" /></summary>
          <div className="nav-panel">
            {NAV.map((item) => (
              <Link key={item.href} to={item.href}>{item.label}</Link>
            ))}
            <Link className="btn btn-solid" to="/unduh.html">Pasang corbin</Link>
          </div>
        </details>
      </div>
    </header>
  );
}

const PRODUK = [
  { href: '/fitur.html', label: 'Fitur' },
  { href: '/harga.html', label: 'Harga' },
  { href: '/unduh.html', label: 'Unduh' },
  { href: '/docs.html', label: 'Docs' },
  { href: '/mcp.html', label: 'MCP' }
];

const LEGAL = [
  { href: '/dukungan.html', label: 'Dukungan' },
  { href: '/privasi.html', label: 'Privasi' },
  { href: '/syarat.html', label: 'Syarat' }
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-cols">
          <div>
            <div className="footer-brand">
              <Raven variant="icon" size={40} />
              <span className="brand-word" style={{ fontSize: 16 }}>corbin</span>
            </div>
            <p className="footer-tag">Huginn &amp; Muninn — Odin&#x27;s ravens. Browser Anda, atas perintah Anda.</p>
          </div>
          <nav aria-label="Produk">
            <h3>Produk</h3>
            <ul>{PRODUK.map((l) => <li key={l.href}><Link to={l.href}>{l.label}</Link></li>)}</ul>
          </nav>
          <nav aria-label="Legal">
            <h3>Legal</h3>
            <ul>{LEGAL.map((l) => <li key={l.href}><Link to={l.href}>{l.label}</Link></li>)}</ul>
          </nav>
        </div>
        <div className="footer-bar">
          <span>© 2026 Corbin — private, local, signed.</span>
          <span><Link to="/privasi.html">Privasi</Link> · <Link to="/syarat.html">Syarat</Link> · <Link to="/dukungan.html">Dukungan</Link></span>
        </div>
      </div>
    </footer>
  );
}
