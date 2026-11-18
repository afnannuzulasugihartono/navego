import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { NavegoMark, NavegoWordmark } from './NavegoMark';

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

// WHY THE PANEL IS DATA AND NOT SEVEN PANELS.
// Apple's header swaps one full-width panel between items; the content is the only thing that changes per item.
// One panel, one map keyed by the item under the pointer or focus, is the same shape with one place to edit.

const MEGA: Record<string, MegaPanel> = {
  fitur: {
    leadHeading: 'Explore fitur',
    lead: [
      { href: '/fitur#kemampuanTitle', label: 'Enam kemampuan inti' },
      { href: '/fitur#taskTitle', label: 'Empat langkah, dari tulis sampai simpan' },
      { href: '/fitur#roleTitle', label: 'Operator, analis, pengembang' }
    ],
    cols: [
      { heading: 'Yang dijaga', links: [
        { href: '/keamanan', label: 'Kata sandi & OTP ditolak' },
        { href: '/fitur#permTitle', label: 'Enam izin, tidak lebih' },
        { href: '/docs#batas', label: 'Batas yang dijaga' }
      ] },
      { heading: 'Alat', links: [
        { href: '/docs#tools', label: '45 tool MCP' },
        { href: '/docs#berkas', label: 'Contoh berkas' },
        { href: '/bandingkan', label: 'Navego vs pendekatan lain' }
      ] }
    ]
  },
  harga: {
    leadHeading: 'Pilih kawasan',
    lead: [
      { href: '/harga#asiaTitle', label: 'Asia · Arab · Afrika' },
      { href: '/harga#europeTitle', label: 'Eropa & AS' }
    ],
    cols: [
      { heading: 'Plan', links: [
        { href: '/harga#usd-plan.usd-1', label: 'Starter — $1' },
        { href: '/harga#usd-plan.usd-5', label: 'Plus — $5' },
        { href: '/harga#usd-plan.usd-17', label: 'Business — $17 / 6 bulan' },
        { href: '/harga#usd-plan.usd-33', label: 'Enterprise — $33 / tahun' }
      ] },
      { heading: 'Tanya jawab', links: [
        { href: '/faq', label: 'FAQ' },
        { href: '/docs#paket', label: 'Paket dan pembayaran' },
        { href: '/metodologi', label: 'Yang diukur, yang tidak' }
      ] }
    ]
  },
  unduh: {
    leadHeading: 'Unduh',
    lead: [
      { href: '/unduh', label: 'Build untuk Chrome, Edge, Brave, Opera, Vivaldi' },
      { href: '/unduh', label: 'CRX ditandatangani & .reg Windows' }
    ],
    cols: [
      { heading: 'Terminal', links: [
        { href: '/mcp', label: 'npm i -g navego' },
        { href: '/docs#tugas', label: 'Tugas pertama' },
        { href: '/docs', label: 'Dokumentasi lengkap' }
      ] },
      { heading: 'Setelah unduh', links: [
        { href: '/changelog', label: 'Changelog' },
        { href: '/metodologi', label: 'Metodologi pengukuran' },
        { href: '/dukungan', label: 'Dukungan' }
      ] }
    ]
  },
  docs: {
    leadHeading: 'Mulai dari sini',
    lead: [
      { href: '/docs#pasang', label: 'Pasang extension' },
      { href: '/docs#pairing', label: 'Masuk dan pair device' }
    ],
    cols: [
      { heading: 'Alat', links: [
        { href: '/docs#tools', label: '45 tool MCP' },
        { href: '/docs#mcp', label: 'Hubungkan AI harness' },
        { href: '/docs#batas', label: 'Batas yang dijaga' }
      ] },
      { heading: 'Lainnya', links: [
        { href: '/faq', label: 'FAQ' },
        { href: '/metodologi', label: 'Metodologi' },
        { href: '/changelog', label: 'Changelog' }
      ] }
    ]
  },
  artikel: {
    leadHeading: 'Dari lab Navego',
    lead: [
      { href: '/artikel/ai-browser-indonesia', label: 'AI yang mengenal browser Anda' },
      { href: '/artikel', label: 'Semua artikel' }
    ],
    cols: [
      { heading: 'Angka dan metode', links: [
        { href: '/metodologi', label: 'Metodologi' },
        { href: '/changelog', label: 'Changelog' }
      ] },
      { heading: 'Lainnya', links: [
        { href: '/bandingkan', label: 'Bandingkan pendekatan' },
        { href: '/keamanan', label: 'Keamanan' }
      ] }
    ]
  },
  mcp: {
    leadHeading: 'Pasang sebagai MCP',
    lead: [
      { href: '/mcp', label: 'npm i -g navego' },
      { href: '/mcp', label: 'Config OpenCode' }
    ],
    cols: [
      { heading: 'Verifikasi', links: [
        { href: '/metodologi', label: 'Yang diukur' },
        { href: '/changelog', label: 'Versi dan rilis' }
      ] },
      { heading: 'Lainnya', links: [
        { href: '/docs#mcp', label: 'Hubungkan AI harness' },
        { href: '/faq', label: 'FAQ' }
      ] }
    ]
  },
  dukungan: {
    leadHeading: 'Butuh bantuan',
    lead: [
      { href: '/dukungan', label: 'Perbaikan cepat & tiga pintu' },
      { href: '/faq', label: 'Dua belas jawaban' }
    ],
    cols: [
      { heading: 'Bantuan', links: [
        { href: '/docs', label: 'Dokumentasi' },
        { href: '/changelog', label: 'Changelog' }
      ] },
      { heading: 'Legal', links: [
        { href: '/privasi', label: 'Privasi' },
        { href: '/syarat', label: 'Syarat' },
        { href: '/keamanan', label: 'Keamanan' }
      ] }
    ]
  }
};

// One navigation tree at every size: a slim dark bar with a hover panel on wide screens, the native popover list when the row does not fit.
// The header measures its own row and toggles `is-wide`; the panel opens on hover and on keyboard focus, so nothing depends on a pointer.

function SiteNav({ current }: { current?: string }) {
  const headerRef = useRef<HTMLElement>(null);
  const [mega, setMega] = useState<string>('fitur');
  const panel: MegaPanel = MEGA[mega] ?? (MEGA.fitur as MegaPanel);

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
            <li><Link to="/keamanan">Keamanan</Link></li>
            <li><Link to="/changelog">Changelog</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/metodologi">Metodologi</Link></li>
            <li><Link to="/bandingkan">Bandingkan</Link></li>
            <li><Link to="/privasi">Privasi</Link></li>
            <li><Link to="/syarat">Syarat</Link></li>
          </ul>

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
          <span><Link to="/privasi">Privasi</Link> · <Link to="/syarat">Syarat</Link> · <Link to="/dukungan">Dukungan</Link></span>
        </div>
      </div>
    </footer>
  );
}
