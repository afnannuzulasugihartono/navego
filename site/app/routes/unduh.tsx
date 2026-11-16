import { useState } from 'react';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return [
    { title: 'Unduh — Corbin' },
    { name: 'description', content: 'Satu build. Lima browser. Sekali klik. Build terbaru, selalu.' }
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
      <main>

        <section className="chapter" aria-labelledby="dlTitle" style={{ paddingTop: 40 }}>
          <p className="chapter-eyebrow">Unduh.</p>
          <h1 id="dlTitle" className="chapter-title">Pasang corbin.<br />Pair. Kerja.</h1>
          <p className="chapter-note">Satu build. Lima browser. Build terbaru, selalu.</p>
        </section>

        <section className="chapter warm" aria-labelledby="browserTitle" style={{ paddingTop: 0 }}>
          <div className="dl-grid">
            {BROWSERS.map((browser) => (
              <article key={browser.key} className="dl-card">
                <span aria-hidden="true" className="dl-letter">{browser.letter}</span>
                <h2>{browser.name}</h2>
                <a className="btn btn-solid" style={{ justifyContent: 'center', width: '100%' }} href={`${DOWNLOAD}.zip?for=${browser.key}`} download>Unduh .zip</a>
                <p className="dl-req">Pasang lewat developer mode. Tidak pernah diperbarui sendiri — klik muat ulang di chrome://extensions setiap rilis.</p>
                <p className="dl-req">Atau: <a href={`${DOWNLOAD}.crx?for=${browser.key}`} download title="Paket bertanda tangan: untuk mesin yang dikelola">.crx</a> · <a href={MANIFEST}>Manifest</a></p>
              </article>
            ))}
          </div>
        </section>

        <section className="chapter" aria-labelledby="stepsTitle">
          <p className="chapter-eyebrow">Cara memasang.</p>
          <h2 id="stepsTitle" className="chapter-title">Tiga langkah.</h2>
          <ol className="steps" style={{ maxWidth: 760 }}>
            <li><span><strong>Ekstrak.</strong> Buka <code>opera://extensions</code> (atau <code>chrome://extensions</code>), aktifkan <em>Developer mode</em>, klik <em>Load unpacked</em>, pilih folder hasil ekstrak.</span></li>
            <li><span><strong>Masuk.</strong> Buka halaman masuk dan gunakan magic link atau OAuth.</span></li>
            <li><span><strong>Pair.</strong> Dashboard → Device → Pasangkan browser ini. Satu klik.</span></li>
          </ol>
        </section>

        <section className="chapter warm" aria-labelledby="permTitle">
          <p className="chapter-eyebrow">Izin.</p>
          <h2 id="permTitle" className="chapter-title">Enam izin,<br />satu per satu.</h2>
          <p className="chapter-note">Host permission di setiap origin — Anda yang memutuskan halaman mana. Screenshot ditolak di tab private; password, OTP, PIN, kartu, dan CVV selalu diblokir.</p>
          <div className="sheet" style={{ maxWidth: 760 }}>
            {PERMISSIONS.map(([name, why]) => (
              <div key={name} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', padding: '11px 14px', background: 'var(--panel)', borderBottom: '1px solid var(--card-2)', fontSize: 13 }}>
                <code>{name}</code>
                <span>{why}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="chapter dark" aria-labelledby="verifyTitle">
          <p className="chapter-eyebrow light">Verifikasi.</p>
          <h2 id="verifyTitle" className="chapter-title light-title">Sidik jari<br />yang sama.</h2>
          <p className="chapter-note light-title" style={{ marginTop: 0 }}>Sidik jari SHA-256 berubah tiap rilis. Tiga perintah berikut harus mencetak sidik jari yang sama.</p>
          <div style={{ display: 'grid', gap: 10, maxWidth: 860, marginTop: 20 }}>
            {[
              ['server', 'Server', CURL],
              ['local', 'Lokal', LOCAL]
            ].map(([id, label, command]) => (
              <div key={id} style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#1a1a21', borderRadius: 10, padding: '10px 14px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#8f8f9c', width: 46, flexShrink: 0 }}>{label}</span>
                <code style={{ background: 'transparent', color: '#f4f1e9', fontSize: 11, overflowX: 'auto', whiteSpace: 'nowrap', flex: 1 }}>{command}</code>
                <button onClick={() => copy(command!, id!)} style={{ background: 'linear-gradient(to bottom, #2a6ae0, #123fb8)', color: '#ffffff', border: '1px solid #061c4e', borderRadius: 6, padding: '5px 10px', fontSize: 10.5, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  {copied === id ? 'Tersalin' : 'Salin'}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="chapter tail" aria-labelledby="supportTitle" style={{ paddingTop: 20 }}>
          <div className="section-head"><h2 id="supportTitle" className="chapter-eyebrow" style={{ margin: 0 }}>Browser.</h2></div>
          <table className="table" style={{ maxWidth: 640, marginTop: 12 }}>
            <thead><tr><th scope="col">Browser</th><th scope="col">.zip</th><th scope="col">.crx</th></tr></thead>
            <tbody>
              {BROWSER_SUPPORT.map(([name, zip, crx]) => (
                <tr key={name}><td><strong>{name}</strong></td><td>{zip}</td><td>{crx}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="note" style={{ marginTop: 12 }}>Extension yang dipasang dari Web Store sedang dalam proses review. Sementara itu Anda memuat arsip yang sama dengan tangan.</p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
