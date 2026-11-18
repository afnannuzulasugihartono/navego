// decisions.json -> D21, D34, D37 (notch behaviour, no Huginn & Muninn, no middle-dot separators)

import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { NavegoMark, NavegoWordmark } from './NavegoMark';
import { readConsent, storeConsent, type ConsentChoice } from '../lib/consent.js';

const NAV = [
  { key: 'fitur', href: '/fitur', label: 'Fitur' },
  { key: 'harga', href: '/harga', label: 'Harga' },
  { key: 'unduh', href: '/unduh', label: 'Unduh' },
  { key: 'docs', href: '/docs', label: 'Docs' },
  { key: 'artikel', href: '/artikel', label: 'Artikel' },
  { key: 'mcp', href: '/mcp', label: 'MCP' },
  { key: 'dukungan', href: '/dukungan', label: 'Dukungan' }
] as const;

const VERSION = '1.7.6';

interface MegaLink {
  href: string;
  label: string;
}
interface MegaColumn {
  heading: string;
  links: MegaLink[];
}
interface MegaPanel {
  leadHeading: string;
  lead: MegaLink[];
  cols: MegaColumn[];
}

// ONE PANEL, ONE MAP, AND A LINK REGISTRY - Apple's header swaps one full-width panel between items; the content is the only thing that changes per item, so one panel and one map keyed by the active item is the same shape with one place to edit.
// The seven panels share most of their links, so every link lives here exactly once; the panels only say which links they show.

const L = {
  fiturKemampuan: { href: '/fitur#kemampuanTitle', label: 'Enam kemampuan inti' },
  fiturEmpat: { href: '/fitur#taskTitle', label: 'Empat langkah, dari tulis sampai simpan' },
  fiturPeran: { href: '/fitur#roleTitle', label: 'Operator, analis, pengembang' },
  perms: { href: '/fitur#permTitle', label: 'Enam izin, tidak lebih' },
  docsBatas: { href: '/docs#batas', label: 'Batas yang dijaga' },
  docsTools: { href: '/docs#tools', label: '45 tool MCP' },
  docsBerkas: { href: '/docs#berkas', label: 'Contoh berkas' },
  docsPasang: { href: '/docs#pasang', label: 'Pasang extension' },
  docsPair: { href: '/docs#pairing', label: 'Masuk dan pair device' },
  docsTugas: { href: '/docs#tugas', label: 'Tugas pertama' },
  docsPaket: { href: '/docs#paket', label: 'Paket dan pembayaran' },
  docsMcp: { href: '/docs#mcp', label: 'Hubungkan AI harness' },
  asia: { href: '/harga#asiaTitle', label: 'Asia, Arab, Afrika' },
  eropa: { href: '/harga#europeTitle', label: 'Eropa & AS' },
  p1: { href: '/harga#usd-plan.usd-1', label: 'Starter — $1' },
  p5: { href: '/harga#usd-plan.usd-5', label: 'Plus — $5' },
  p17: { href: '/harga#usd-plan.usd-17', label: 'Business — $17 / 6 bulan' },
  p33: { href: '/harga#usd-plan.usd-33', label: 'Enterprise — $33 / tahun' },
  download: { href: '/unduh', label: 'Build untuk Chrome, Edge, Brave, Opera, Vivaldi' },
  crx: { href: '/unduh', label: 'CRX ditandatangani & .reg Windows' },
  article: { href: '/artikel/ai-browser-indonesia', label: 'AI yang mengenal browser Anda' },
  articles: { href: '/artikel', label: 'Semua artikel' },
  mcp: { href: '/mcp', label: 'npm i -g navego' },
  openCode: { href: '/mcp', label: 'Config OpenCode' },
  dukungan: { href: '/dukungan', label: 'Perbaikan cepat & tiga pintu' },
  faq: { href: '/faq', label: 'Dua belas jawaban' },
  keamanan: { href: '/keamanan', label: 'Keamanan' },
  metodologi: { href: '/metodologi', label: 'Metodologi' },
  changelog: { href: '/changelog', label: 'Changelog' },
  bandingkan: { href: '/bandingkan', label: 'Bandingkan pendekatan' },
  privasi: { href: '/privasi', label: 'Privasi' },
  syarat: { href: '/syarat', label: 'Syarat' }
} as const;

const MEGA: Record<string, MegaPanel> = {
  fitur: {
    leadHeading: 'Explore fitur',
    lead: [L.fiturKemampuan, L.fiturEmpat, L.fiturPeran],
    cols: [
      { heading: 'Yang dijaga', links: [L.keamanan, L.perms, L.docsBatas] },
      { heading: 'Alat', links: [L.docsTools, L.docsBerkas, L.bandingkan] }
    ]
  },
  harga: {
    leadHeading: 'Pilih kawasan',
    lead: [L.asia, L.eropa],
    cols: [
      { heading: 'Plan', links: [L.p1, L.p5, L.p17, L.p33] },
      { heading: 'Tanya jawab', links: [L.faq, L.docsPaket, L.metodologi] }
    ]
  },
  unduh: {
    leadHeading: 'Unduh',
    lead: [L.download, L.crx],
    cols: [
      { heading: 'Terminal', links: [L.mcp, L.docsTugas, { href: '/docs', label: 'Dokumentasi lengkap' }] },
      { heading: 'Setelah unduh', links: [L.changelog, L.metodologi, L.dukungan] }
    ]
  },
  docs: {
    leadHeading: 'Mulai dari sini',
    lead: [L.docsPasang, L.docsPair],
    cols: [
      { heading: 'Alat', links: [L.docsTools, L.docsMcp, L.docsBatas] },
      { heading: 'Lainnya', links: [L.faq, L.metodologi, L.changelog] }
    ]
  },
  artikel: {
    leadHeading: 'Dari lab Navego',
    lead: [L.article, L.articles],
    cols: [
      { heading: 'Angka dan metode', links: [L.metodologi, L.changelog] },
      { heading: 'Lainnya', links: [L.bandingkan, L.keamanan] }
    ]
  },
  mcp: {
    leadHeading: 'Pasang sebagai MCP',
    lead: [L.mcp, L.openCode],
    cols: [
      { heading: 'Verifikasi', links: [L.metodologi, L.changelog] },
      { heading: 'Lainnya', links: [L.docsMcp, L.faq] }
    ]
  },
  dukungan: {
    leadHeading: 'Butuh bantuan',
    lead: [L.dukungan, L.faq],
    cols: [
      { heading: 'Bantuan', links: [{ href: '/docs', label: 'Dokumentasi' }, L.changelog] },
      { heading: 'Legal', links: [L.privasi, L.syarat, L.keamanan] }
    ]
  }
};

// One navigation tree at every size: a slim dark bar carrying a flat horizontal row at every width, an Apple-style panel under it on hover or focus, and a notch that drops the same row - always visible, at every width.

const ALL_LINKS = [
  { href: '/beranda', label: 'Beranda' },
  ...NAV.map(({ href, label }) => ({ href, label })),
  { href: '/keamanan', label: 'Keamanan' },
  { href: '/changelog', label: 'Changelog' },
  { href: '/faq', label: 'FAQ' },
  { href: '/metodologi', label: 'Metodologi' },
  { href: '/bandingkan', label: 'Bandingkan' },
  { href: '/privasi', label: 'Privasi' },
  { href: '/syarat', label: 'Syarat' }
];

function SiteNav({ current }: { current?: string }) {
  const [mega, setMega] = useState<string>('fitur');
  const panel: MegaPanel = MEGA[mega] ?? (MEGA.fitur as MegaPanel);

  return (
    <header className="site-header" data-version={VERSION}>
      <div className="wrap site-header-row header-inner">
        <Link className="brand" to="/beranda" aria-label="Navego — beranda">
          <NavegoMark size={24} />
          <NavegoWordmark size={14} />
        </Link>

        <nav className="site-nav" aria-label="Navigasi utama">
          <ul className="nav-flat">
            <li><Link to="/beranda" aria-current={current === '/beranda' ? 'page' : undefined}>Beranda</Link></li>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  aria-current={current === item.href ? 'page' : undefined}
                  onMouseEnter={() => setMega(item.key)}
                  onFocus={() => setMega(item.key)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link className="btn btn-solid btn-sm" to="/unduh">Pasang gratis</Link>
      </div>

      <div className="nav-notch-wrap">
        <button className="nav-notch" type="button" aria-label="Tampilkan menu lengkap" aria-controls="nav-strip">
          <svg width="18" height="10" viewBox="0 0 18 10" aria-hidden="true" focusable="false">
            <path d="M1 1.5l8 7 8-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="nav-strip" id="nav-strip" role="region" aria-label="Menu lengkap">
          <ul>
            {ALL_LINKS.map((item) => (
              <li key={item.href}>
                <Link to={item.href} aria-current={current === item.href ? 'page' : undefined}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mega" aria-label="Jelajahi Navego">
            <div className="wrap mega-cols">
              <div>
                <p className="mega-title">{panel.leadHeading}</p>
                <ul className="mega-main">
                  {panel.lead.map((l) => <li key={l.href + l.label}><Link to={l.href}>{l.label}</Link></li>)}
                </ul>
              </div>
              {panel.cols.map((col) => (
                <div key={col.heading}>
                  <p className="mega-title">{col.heading}</p>
                  <ul>
                    {col.links.map((l) => <li key={l.href + l.label}><Link to={l.href}>{l.label}</Link></li>)}
                  </ul>
                </div>
              ))}
            </div>
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

const SUMBER = [
  { href: '/changelog', label: 'Changelog' },
  { href: '/faq', label: 'FAQ' },
  { href: '/keamanan', label: 'Keamanan' },
  { href: '/metodologi', label: 'Metodologi' },
  { href: '/bandingkan', label: 'Bandingkan' }
];

const BANTUAN = [
  { href: '/dukungan', label: 'Dukungan' },
  { href: '/privasi', label: 'Privasi' },
  { href: '/syarat', label: 'Syarat' }
];

export function SiteHeader({ current }: { current?: string }) {
  return <SiteNav current={current} />;
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
            <Link className="brand" to="/beranda" aria-label="Navego — beranda" style={{ color: '#ffffff' }}>
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
