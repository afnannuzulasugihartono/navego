import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { NavegoMark, NavegoWordmark } from './NavegoMark';
import { readConsent, storeConsent, type ConsentChoice } from '../lib/consent.js';
import { onSessionChange, sessionAccount } from '../lib/auth';

const VERSION = '1.8.1';

// one navigation surface: a slim dark bar with product links and one CTA; a Menu button opens the same list on a small screen.
// decisions.json -> site-nav-inline-01

const PRODUK = [
  { href: '/fitur', label: 'Fitur' },
  { href: '/harga', label: 'Harga' },
  { href: '/unduh', label: 'Unduh' },
  { href: '/docs', label: 'Docs' },
  { href: '/mcp', label: 'Pasang MCP' },
  { href: '/artikel', label: 'Artikel' }
];

const BANTUAN = [
  { href: '/dukungan', label: 'Dukungan' },
  { href: '/privasi', label: 'Privasi' },
  { href: '/syarat', label: 'Syarat' }
];

const SUMBER = [
  { href: '/changelog', label: 'Changelog' },
  { href: '/faq', label: 'FAQ' },
  { href: '/keamanan', label: 'Keamanan' },
  { href: '/metodologi', label: 'Metodologi' },
  { href: '/bandingkan', label: 'Bandingkan' }
];

// Unduh stays the amber action on the right; these are the ordinary first-level links, and the small-screen extras.

const NAV_LINKS = [...PRODUK.filter((item) => item.href !== '/unduh'), { href: '/en', label: 'EN' }];
const NAV_EXTRA = [
  { href: '/bandingkan', label: 'Bandingkan' },
  { href: '/changelog', label: 'Changelog' },
  { href: '/faq', label: 'FAQ' },
  { href: '/dukungan', label: 'Dukungan' }
];

export function SiteHeader({ current }: { current?: string }) {
  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let live = true;
    void sessionAccount().then((account) => { if (live) setEmail(account); });
    const stop = onSessionChange((account) => { if (live) setEmail(account); });
    return () => { live = false; stop(); };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    const wide = window.matchMedia('(min-width: 1001px)');
    const onWide = () => { if (wide.matches) setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    wide.addEventListener('change', onWide);
    return () => {
      document.removeEventListener('keydown', onKey);
      wide.removeEventListener('change', onWide);
    };
  }, []);

  return (
    <header className={menuOpen ? 'site-header nav-open' : 'site-header'} data-version={VERSION}>
      <div className="site-header-row site-header-bleed header-inner">
        <Link className="brand" to="/beranda" aria-label="Navego — beranda">
          <NavegoMark size={24} />
          <NavegoWordmark size={14} />
        </Link>
        <button className="nav-toggle" type="button" aria-expanded={menuOpen} aria-controls="site-nav" onClick={() => setMenuOpen((open) => !open)}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
            <path d="M2 4h14M2 9h14M2 14h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>Menu</span>
        </button>
        <nav id="site-nav" className="nav-links" aria-label="Navigasi utama">
          {NAV_LINKS.map((item) => (
            <Link key={item.href} to={item.href} aria-current={current === item.href ? 'page' : undefined}>{item.label}</Link>
          ))}
          <div className="nav-extra">
            <p className="nav-extra-heading">Lainnya</p>
            {NAV_EXTRA.map((item) => (
              <Link key={item.href} to={item.href} aria-current={current === item.href ? 'page' : undefined}>{item.label}</Link>
            ))}
          </div>
        </nav>
        <div className="header-actions">
          {email ? (
            <>
              <Link className="btn btn-ghost btn-sm" to="/dashboard" aria-label={`Akun ${email}`}>Dashboard</Link>
              <Link className="btn btn-solid btn-sm" to="/unduh">Pasang gratis</Link>
            </>
          ) : (
            <>
              <Link className="btn btn-ghost btn-sm" to="/">Masuk</Link>
              <Link className="btn btn-solid btn-sm" to="/unduh">Pasang gratis</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// the banner is a sibling of the footer because every page already ends there - a page-level overlay would double the markup on every page, and the page a search engine sees carries no consent UI.
// It renders nothing on the server and nothing for anyone who already chose, so the page a search engine sees carries no consent UI at all.

function CookieConsent() {
  const [ready, setReady] = useState(false);
  const [choice, setChoice] = useState<ConsentChoice>(null);

  useEffect(() => {
    setChoice(readConsent());
    setReady(true);
  }, []);

  if (!ready || choice) return null;

  const decide = (value: 'granted' | 'denied') => {
    storeConsent(value);
    setChoice(value);
    window.dispatchEvent(new CustomEvent('navego:consent', { detail: value }));
  };

  return (
    <div className="consent-banner" role="region" aria-label="Persetujuan cookie">
      <div className="wrap consent-inner">
        <p>Navego memakai tiga cookie first-party: <code>navego_consent</code> (mengingat pilihan ini), <code>navego_region</code> (mengingat kawasan harga Anda), dan <code>oa_device_id</code> (mengingat instance browser untuk pairing). Tidak ada analytics, iklan, atau pelacakan. <Link to="/privasi#cookie">Detail di Kebijakan Privasi</Link></p>
        <div className="hero-cta">
          <button className="btn btn-solid btn-sm" type="button" onClick={() => decide('granted')}>Accept cookies</button>
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => decide('denied')}>Tolak</button>
        </div>
      </div>
    </div>
  );
}

export function SiteFooter() {
  return (
    <>
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-cols">
          <div>
            <Link className="brand brand--footer" to="/beranda" aria-label="Navego — beranda">
              <NavegoMark size={36} />
              <NavegoWordmark size={16} />
            </Link>
            <p className="footer-tag">40 tool MCP di atas 36 primitive browser. Berjalan lokal di Chrome Anda.</p>
          </div>
          <nav aria-label="Produk">
            <h3>Produk</h3>
            <ul>{PRODUK.map((l) => <li key={l.href}><Link to={l.href}>{l.label}</Link></li>)}</ul>
          </nav>
          <nav aria-label="Sumber">
            <h3>Sumber</h3>
            <ul>{SUMBER.map((l) => <li key={l.href}><Link to={l.href}>{l.label}</Link></li>)}</ul>
          </nav>
          <nav aria-label="Open source">
            <h3>Open source</h3>
            <ul>
              <li><a href="https://github.com/afnannuzulasugihartono/navego" rel="noreferrer">GitHub</a></li>
              <li><a href="https://www.npmjs.com/package/navego" rel="noreferrer">npm</a></li>
              <li><Link to="/mcp">Pasang sebagai MCP</Link></li>
            </ul>
          </nav>
          <nav aria-label="Bantuan">
            <h3>Bantuan</h3>
            <ul>{BANTUAN.map((l) => <li key={l.href}><Link to={l.href}>{l.label}</Link></li>)}</ul>
          </nav>
        </div>
        <div className="footer-bar">
          <span>© 2026 Navego — MIT, npm navego, repo publik afnannuzulasugihartono/navego.</span>
          <span><Link to="/privasi">Privasi</Link>, <Link to="/syarat">Syarat</Link>, <Link to="/dukungan">Dukungan</Link></span>
        </div>
      </div>
    </footer>
    <CookieConsent />
    </>
  );
}
