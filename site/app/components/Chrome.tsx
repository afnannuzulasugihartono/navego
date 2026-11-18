import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { NavegoMark, NavegoWordmark } from './NavegoMark';

const NAV = [
  { href: '/fitur', label: 'Fitur' },
  { href: '/harga', label: 'Harga' },
  { href: '/docs', label: 'Docs' },
  { href: '/artikel', label: 'Artikel' }
];

// WHY the menu carries every destination while the inline row carries the four a reader picks from: the narrow header must never strand a visitor on a page with no way further in, and the wide row stays short enough to read at a glance.

const MENU = [
  { href: '/beranda', label: 'Beranda' },
  { href: '/fitur', label: 'Fitur' },
  { href: '/harga', label: 'Harga' },
  { href: '/unduh', label: 'Unduh' },
  { href: '/docs', label: 'Docs' },
  { href: '/mcp', label: 'Pasang MCP' },
  { href: '/artikel', label: 'Artikel' },
  { href: '/dukungan', label: 'Dukungan' },
  { href: '/privasi', label: 'Privasi' },
  { href: '/syarat', label: 'Syarat' }
];

const VERSION = '1.7.6';

// One nav tree, two presentations: inline when it fits, native popover when it does not.
// The header measures itself on every resize and toggles `is-wide`; without script the popover still opens.

function SiteNav({ current }: { current?: string }) {
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const measure = () => {
      const row = header.querySelector<HTMLElement>('.site-header-row');
      if (!row) return;
      const fits = row.scrollWidth <= row.clientWidth + 1;
      header.classList.toggle('is-wide', fits);
      const menu = header.querySelector<HTMLElement>('#site-menu');
      if (menu) {
        if (fits) menu.removeAttribute('popover');
        else menu.setAttribute('popover', 'auto');
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    const row = header.querySelector('.site-header-row');
    if (row) observer.observe(row);
    return () => observer.disconnect();
  }, []);

  return (
    <header className="site-header" ref={headerRef}>
      <div className="wrap site-header-row">
        <Link className="brand" to="/beranda" aria-label="Navego — beranda">
          <NavegoMark size={26} />
          <NavegoWordmark size={15} />
          <span className="brand-version">v{VERSION}</span>
        </Link>

        <nav className="nav" aria-label="Navigasi utama">
          {NAV.map((item) => (
            <Link key={item.href} to={item.href} aria-current={current === item.href ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>

        <Link className="btn btn-solid btn-sm" to="/unduh">Pasang navego</Link>

        <button className="nav-toggle" type="button" popoverTarget="site-menu" aria-controls="site-menu" aria-label="Menu">
          <span className="bars" aria-hidden="true" />
        </button>

        <ul className="nav-menu" id="site-menu" popover="auto">
          {MENU.map((item) => (
            <li key={item.href}>
              <Link to={item.href} aria-current={current === item.href ? 'page' : undefined}>{item.label}</Link>
            </li>
          ))}
          <li><Link className="btn btn-solid" to="/unduh">Pasang navego</Link></li>
        </ul>
      </div>
    </header>
  );
}

const PRODUK = [
  { href: '/fitur', label: 'Fitur' },
  { href: '/harga', label: 'Harga' },
  { href: '/unduh', label: 'Unduh' },
  { href: '/docs', label: 'Docs' },
  { href: '/mcp', label: 'Pasang MCP' },
  { href: '/artikel', label: 'Artikel' }
];

const LEGAL = [
  { href: '/dukungan', label: 'Dukungan' },
  { href: '/privasi', label: 'Privasi' },
  { href: '/syarat', label: 'Syarat' }
];

export function SiteHeader({ current }: { current?: string }) {
  return <SiteNav current={current} />;
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-cols">
          <div>
            <Link className="brand" to="/beranda" aria-label="Navego — beranda" style={{ color: '#ffffff' }}>
              <NavegoMark size={36} />
              <NavegoWordmark size={16} />
            </Link>
            <p className="footer-tag">Huginn &amp; Muninn — raven Odin. Browser Anda, atas perintah Anda.</p>
          </div>
          <nav aria-label="Produk">
            <h3>Produk</h3>
            <ul>{PRODUK.map((l) => <li key={l.href}><Link to={l.href}>{l.label}</Link></li>)}</ul>
          </nav>
          <nav aria-label="Bantuan">
            <h3>Bantuan</h3>
            <ul>{LEGAL.map((l) => <li key={l.href}><Link to={l.href}>{l.label}</Link></li>)}</ul>
          </nav>
          <nav aria-label="Buka sumber">
            <h3>Open source</h3>
            <ul>
              <li><a href="https://github.com/afnannuzulasugihartono/navego" rel="noreferrer">GitHub</a></li>
              <li><a href="https://www.npmjs.com/package/navego" rel="noreferrer">npm</a></li>
              <li><Link to="/mcp">Pasang sebagai MCP</Link></li>
            </ul>
          </nav>
        </div>
        <div className="footer-bar">
          <span>© 2026 Navego — private, local, signed.</span>
          <span><Link to="/privasi">Privasi</Link> · <Link to="/syarat">Syarat</Link> · <Link to="/dukungan">Dukungan</Link></span>
        </div>
      </div>
    </footer>
  );
}
