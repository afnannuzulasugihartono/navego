import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { NavegoMark, NavegoWordmark } from './NavegoMark';

const NAV = [
  { href: '/fitur', label: 'Fitur' },
  { href: '/harga', label: 'Harga' },
  { href: '/unduh', label: 'Unduh' },
  { href: '/docs', label: 'Docs' },
  { href: '/artikel', label: 'Artikel' },
  { href: '/mcp', label: 'MCP' },
  { href: '/dukungan', label: 'Dukungan' }
];

// One navigation tree at every size: inline links while the row fits, the native popover list when it does not.
// The header measures its own row and toggles `is-wide`; the popover attribute follows the layout, so the menu opens without script too.

function SiteNav({ current }: { current?: string }) {
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    const inner = header?.querySelector<HTMLElement>('.site-header-row');
    const menu = header?.querySelector<HTMLElement>('#site-menu');
    if (!header || !inner || !menu) return;

    let frame = 0;
    let lastWidth = inner.clientWidth;

    const measure = () => {
      frame = 0;
      const wasOpen = menu.matches(':popover-open');
      header.classList.add('is-measuring', 'is-wide');
      const wide = inner.scrollWidth <= inner.clientWidth;
      header.classList.toggle('is-wide', wide);
      if (wide) menu.removeAttribute('popover');
      else menu.setAttribute('popover', 'auto');
      header.classList.remove('is-measuring');
      if (!wide && wasOpen) menu.showPopover?.();
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    const observer = new ResizeObserver(() => {
      const width = inner.clientWidth;
      const grew = width > lastWidth;
      lastWidth = width;
      if (header.classList.contains('is-wide') || grew) schedule();
    });

    observer.observe(inner);
    schedule();
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header className="site-header" ref={headerRef}>
      <div className="wrap site-header-row header-inner">
        <nav className="site-nav" aria-label="Navigasi utama">
          <button className="nav-toggle menu-button" type="button" popoverTarget="site-menu" popoverTargetAction="toggle" aria-controls="site-menu">
            <span className="bars" aria-hidden="true" />
            <span className="menu-label">Menu</span>
          </button>

          <ul id="site-menu" className="site-menu" popover="auto">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link to={item.href} aria-current={current === item.href ? 'page' : undefined}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link className="brand" to="/beranda" aria-label="Navego — beranda">
          <NavegoMark size={26} />
          <NavegoWordmark size={15} />
        </Link>

        <Link className="btn btn-solid btn-sm" to="/unduh">Pasang gratis</Link>
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
          <span>Ac 2026 Navego — private, local, signed.</span>
          <span><Link to="/privasi">Privasi</Link> · <Link to="/syarat">Syarat</Link> · <Link to="/dukungan">Dukungan</Link></span>
        </div>
      </div>
    </footer>
  );
}