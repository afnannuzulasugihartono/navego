import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { NavegoMark, NavegoWordmark } from './NavegoMark';
import { readConsent, storeConsent, type ConsentChoice } from '../lib/consent.js';

const VERSION = '1.8.1';

// one navigation surface: a slim dark bar with the brand and one CTA, and a chevron that drops the whole menu as a panel.

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

export function SiteHeader({ current }: { current?: string }) {
  return (
    <header className="site-header" data-version={VERSION}>
      <div className="site-header-row site-header-bleed header-inner">
        <Link className="brand" to="/beranda" aria-label="Navego — beranda">
          <NavegoMark size={24} />
          <NavegoWordmark size={14} />
        </Link>
        <div className="header-actions">
          <Link className="btn btn-ghost btn-sm" to="/">Masuk</Link>
          <Link className="btn btn-solid btn-sm" to="/unduh">Pasang gratis</Link>
        </div>
      </div>

      <div className="nav-notch-wrap">
        <button className="nav-notch" type="button" aria-label="Tampilkan menu lengkap" aria-controls="nav-strip">
          <svg width="18" height="10" viewBox="0 0 18 10" aria-hidden="true" focusable="false">
            <path d="M1 1.5l8 7 8-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      <div className="nav-strip" id="nav-strip" role="region" aria-label="Menu lengkap">
        <div className="nav-strip-inner">
          <div className="nav-spot">
            <p className="nav-col-heading">Beranda</p>
            <h2 className="nav-spot-title">Satu perintah.<br />Browser Anda bekerja.</h2>
            <Link className="nav-spot-cta" to="/beranda">Buka beranda <span aria-hidden="true">→</span></Link>
          </div>
          <nav className="nav-col" aria-label="Produk">
            <p className="nav-col-heading">Produk</p>
            <ul className="nav-col-list">
              {PRODUK.map((item) => (
                <li key={item.href}><Link to={item.href} aria-current={current === item.href ? 'page' : undefined}>{item.label}</Link></li>
              ))}
            </ul>
          </nav>
          <nav className="nav-col" aria-label="Kepercayaan dan sumber">
            <p className="nav-col-heading">Kepercayaan</p>
            <ul className="nav-col-list">
              <li><Link to="/keamanan" aria-current={current === '/keamanan' ? 'page' : undefined}>Keamanan</Link></li>
              <li><Link to="/metodologi" aria-current={current === '/metodologi' ? 'page' : undefined}>Metodologi</Link></li>
              <li><Link to="/bandingkan" aria-current={current === '/bandingkan' ? 'page' : undefined}>Bandingkan</Link></li>
            </ul>
            <p className="nav-col-heading nav-col-heading--spaced">Sumber</p>
            <ul className="nav-col-list">
              <li><Link to="/changelog" aria-current={current === '/changelog' ? 'page' : undefined}>Changelog</Link></li>
              <li><Link to="/faq" aria-current={current === '/faq' ? 'page' : undefined}>FAQ</Link></li>
            </ul>
          </nav>
          <nav className="nav-col" aria-label="Bantuan">
            <p className="nav-col-heading">Bantuan</p>
            <ul className="nav-col-list">
              {BANTUAN.map((item) => (
                <li key={item.href}><Link to={item.href} aria-current={current === item.href ? 'page' : undefined}>{item.label}</Link></li>
              ))}
            </ul>
          </nav>
        </div>
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
        <p>Navego memakai dua cookie first-party: <code>navego_consent</code> (mengingat pilihan ini) dan <code>navego_region</code> (mengingat kawasan harga Anda). Tidak ada analytics, iklan, atau pelacakan. <Link to="/privasi#cookie">Detail di Kebijakan Privasi</Link></p>
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
            <p className="footer-tag">Navego — Browser Anda, atas perintah Anda.</p>
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
          <span>© 2026 Navego — private, local, signed.</span>
          <span><Link to="/privasi">Privasi</Link>, <Link to="/syarat">Syarat</Link>, <Link to="/dukungan">Dukungan</Link></span>
        </div>
      </div>
    </footer>
    <CookieConsent />
    </>
  );
}
