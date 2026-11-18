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

const VERSION = '1.7.6';

const MEGA_PRODUK = [
  { href: '/fitur', label: 'Fitur' },
  { href: '/harga', label: 'Harga' },
  { href: '/unduh', label: 'Unduh' },
  { href: '/docs', label: 'Docs' },
  { href: '/artikel', label: 'Artikel' }
];

const MEGA_ALAT = [
  { href: '/mcp', label: 'Pasang MCP' },
  { href: '/docs#berkas', label: 'Contoh berkas' },
  { href: '/docs#tools', label: '45 tool MCP' },
  { href: '/dukungan', label: 'Dukungan' }
];

const MEGA_AKUN = [
  { href: '/', label: 'Masuk' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/privasi', label: 'Privasi' },
  { href: '/syarat', label: 'Syarat' }
];

// One navigation tree at every size: a slim dark bar with a hover panel on wide screens, the native popover list when the row does not fit.
// The header measures its own row and toggles `is-wide`; the panel opens on hover and on keyboard focus, so nothing depends on a pointer.

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
      header.classList.add('is-wide');
      const wide = inner.scrollWidth <= inner.clientWidth;
      header.classList.toggle('is-wide', wide);
      if (wide) menu.removeAttribute('popover');
      else menu.setAttribute('popover', 'auto');
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
    <header className="site-header" ref={headerRef} data-version={VERSION}>
      <div className="wrap site-header-row header-inner">
        <Link className="brand" to="/beranda" aria-label="Navego — beranda">
          <NavegoMark size={24} />
          <NavegoWordmark size={14} />
        </Link>

        <nav className="site-nav" aria-label="Navigasi utama">
          <button className="nav-toggle menu-button" type="button" popoverTarget="site-menu" popoverTargetAction="toggle" aria-controls="site-menu">
            <span className="bars" aria-hidden="true" />
            <span className="menu-label">Menu</span>
          </button>

          <ul id="site-menu" className="site-menu" popover="auto">
            <li><Link to="/beranda" aria-current={current === '/beranda' ? 'page' : undefined}>Beranda</Link></li>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link to={item.href} aria-current={current === item.href ? 'page' : undefined}>{item.label}</Link>
              </li>
            ))}
            <li><Link to="/privasi">Privasi</Link></li>
            <li><Link to="/syarat">Syarat</Link></li>
          </ul>

          <div className="mega" aria-label="Jelajahi Navego">
            <div className="wrap mega-cols">
              <div>
                <p className="mega-title">Produk</p>
                <ul className="mega-main">
                  {MEGA_PRODUK.map((l) => <li key={l.href}><Link to={l.href}>{l.label}</Link></li>)}
                </ul>
              </div>
              <div>
                <p className="mega-title">Alat</p>
                <ul>
                  {MEGA_ALAT.map((l) => <li key={l.href}><Link to={l.href}>{l.label}</Link></li>)}
                </ul>
              </div>
              <div>
                <p className="mega-title">Akun</p>
                <ul>
                  {MEGA_AKUN.map((l) => <li key={l.href}><Link to={l.href}>{l.label}</Link></li>)}
                </ul>
              </div>
            </div>
          </div>
        </nav>

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
          <span>© 2026 Navego — private, local, signed.</span>
          <span><Link to="/privasi">Privasi</Link> · <Link to="/syarat">Syarat</Link> · <Link to="/dukungan">Dukungan</Link></span>
        </div>
      </div>
    </footer>
  );
}