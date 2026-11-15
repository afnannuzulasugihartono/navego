import { useState } from 'react';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return [
    { title: 'Unduh — Corbin' },
    { name: 'description', content: 'Satu build. Lima browser. Sekali klik. Bukti checksum diverifikasi dua perintah.' }
  ];
}

const DOWNLOAD = 'https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/opera-agent-update/download/opera-agent';
const MANIFEST = 'https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/opera-agent-update/update.xml?id=ofgemipoobcnbjkfanmofjbdonjapmgl';

const BROWSERS = [
  { key: 'chrome', name: 'Chrome', letter: 'C' },
  { key: 'edge', name: 'Edge', letter: 'E' },
  { key: 'brave', name: 'Brave', letter: 'B' },
  { key: 'opera', name: 'Opera', letter: 'O' },
  { key: 'vivaldi', name: 'Vivaldi', letter: 'V' }
];

const PERMISSIONS: Array<[string, string]> = [
  ['tabs', 'Membuka dan menavigasi tab.'],
  ['scripting', 'Menjaga content script tetap hidup.'],
  ['storage', 'Token dan pengaturan lokal Anda.'],
  ['alarms', 'Detak jantung yang tetap segar.'],
  ['debugger', 'Klik tepercaya, screenshot, dan aksesibilitas.'],
  ['downloads', 'Menyimpan berkas hasil pekerjaan, membuktikan hasil.']
];

const BROWSER_SUPPORT: Array<[string, string, string]> = [
  ['Chrome', 'ya', 'ya'],
  ['Edge', 'ya', 'ya'],
  ['Brave', 'ya', 'ya'],
  ['Opera', 'ya', 'ya'],
  ['Vivaldi', 'ya', 'ya'],
  ['Firefox', 'ditolak — tidak ada izin debugger', 'ditolak']
];

const CURL = 'curl.exe -sI https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/opera-agent-update/download/opera-agent.zip | findstr /i x-opera-sha256';
const LOCAL = 'Get-FileHash .\\opera-agent-*.zip -Algorithm SHA256';

export default function Unduh() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      setCopied(null);
    }
  };

  return (
    <>
      <SiteHeader current="/unduh.html" />
      <main className="wrap">
        <section className="section" style={{ paddingBottom: 6 }}>
          <h1 className="page-title" style={{ fontSize: 'clamp(38px,6vw,56px)' }}>Unduh berkas</h1>
          <p className="lede" style={{ marginTop: 8 }}>Satu build. Lima browser. Sekali klik. Build terbaru, selalu.</p>
        </section>

        <div className="dl-grid" style={{ marginTop: 10 }}>
          {BROWSERS.map((browser) => (
            <article key={browser.key} className="dl-card">
              <span aria-hidden="true" style={{ fontSize: 26, fontWeight: 800, width: 38, height: 38, borderRadius: 9, background: 'var(--card-2)', display: 'grid', placeItems: 'center' }}>{browser.letter}</span>
              <h3>{browser.name}</h3>
              <a className="btn btn-solid btn-sm" style={{ justifyContent: 'center' }} href={`${DOWNLOAD}.zip?for=${browser.key}`} download>Unduh .zip</a>
              <p className="dl-req">Pasang lewat developer mode. Yang dipasang dari folder tidak pernah diperbarui sendiri.</p>
              <p className="dl-req">Lainnya: <a href={`${DOWNLOAD}.crx?for=${browser.key}`} download title="Paket bertanda tangan: untuk mesin yang dikelola dan pembaruan otomatis">.crx</a> · <a href={MANIFEST}>Manifest</a></p>
            </article>
          ))}
        </div>

        <section className="section" aria-labelledby="stepsTitle" style={{ paddingBottom: 24 }}>
          <div className="section-head"><h2 id="stepsTitle">Cara memasang</h2></div>
          <ol className="steps" style={{ maxWidth: 760 }}>
            <li><span><strong>Ekstrak.</strong> Buka <code>opera://extensions</code> (atau <code>chrome://extensions</code>), aktifkan <em>Developer mode</em>, klik <em>Load unpacked</em>, pilih folder hasil ekstrak.</span></li>
            <li><span><strong>Masuk.</strong> Buka <a href="/index.html">halaman masuk</a> dan gunakan magic link atau OAuth.</span></li>
            <li><span><strong>Pair.</strong> Buka <a href="/dashboard.html">Dashboard</a> → Device → Pasangkan browser ini. Satu klik.</span></li>
          </ol>
        </section>

        <section className="section" aria-labelledby="permTitle" style={{ paddingTop: 0, paddingBottom: 24 }}>
          <div className="section-head">
            <h2 id="permTitle">Izin, dijelaskan satu per satu</h2>
            <p>Host permission di setiap origin — Anda yang memutuskan halaman mana. Screenshot ditolak di tab private; password, OTP, PIN, kartu, dan CVV selalu diblokir.</p>
          </div>
          <div className="sheet" style={{ maxWidth: 760 }}>
            {PERMISSIONS.map(([name, why]) => (
              <div key={name} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', padding: '9px 12px', background: '#fff', borderBottom: '1px solid #ece8db', fontSize: 13 }}>
                <code>{name}</code>
                <span>{why}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="verifyTitle" style={{ paddingTop: 0, paddingBottom: 24 }}>
          <div className="section-head">
            <h2 id="verifyTitle">Verifikasi berkas</h2>
            <p>Sidik jari SHA-256 berubah tiap rilis. Dua perintah berikut harus mencetak sidik jari yang sama.</p>
          </div>
          <div style={{ display: 'grid', gap: 10, maxWidth: 860 }}>
            {[
              ['server', 'Server', CURL],
              ['local', 'Lokal', LOCAL]
            ].map(([id, label, command]) => (
              <div key={id} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--ink)', borderRadius: 10, padding: '10px 12px' }}>
                <span style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8f8f9c', width: 46, flexShrink: 0 }}>{label}</span>
                <code style={{ background: 'transparent', color: '#f4f1e9', fontSize: 11, overflowX: 'auto', whiteSpace: 'nowrap', flex: 1 }}>{command}</code>
                <button onClick={() => copy(command!, id!)} style={{ background: '#262630', color: '#f4f1e9', border: 0, borderRadius: 6, padding: '5px 10px', fontSize: 10.5, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {copied === id ? 'Tersalin' : 'Salin'}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="supportTitle" style={{ paddingTop: 0 }}>
          <div className="section-head">
            <h2 id="supportTitle">Browser yang didukung</h2>
            <p>Chromium: Chrome, Edge, Brave, Opera, Vivaldi. Firefox tidak memiliki izin <code>debugger</code>.</p>
          </div>
          <table className="table" style={{ maxWidth: 640 }}>
            <thead><tr><th scope="col">Browser</th><th scope="col">.zip</th><th scope="col">.crx</th></tr></thead>
            <tbody>
              {BROWSER_SUPPORT.map(([name, zip, crx]) => (
                <tr key={name}><td><strong>{name}</strong></td><td>{zip}</td><td>{crx}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="note" style={{ marginTop: 12 }}>Extension yang dipasang dari Web Store sedang dalam proses review. Sementara itu Anda memuat arsip yang sama dengan tangan; listing menyusul setelah review selesai.</p>
        </section>
        <div style={{ height: 20 }} />
      </main>
      <SiteFooter />
    </>
  );
}
