import { useState } from 'react';
import { seoMeta } from '../lib/seo.js';
import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return seoMeta({
    title: 'Unduh — Navego',
    description: 'Unduh build Navego untuk Chrome, Edge, Brave, Opera, dan Vivaldi. Satu klik di Windows lewat berkas .reg, atau developer mode. Masuk, lalu pair device dari dashboard.',
    path: '/unduh'
  });
}

const DOWNLOAD = 'https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/navego-update/download/navego';
const MANIFEST = 'https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/navego-update/update.xml?id=ofgemipoobcnbjkfanmofjbdonjapmgl';

const BROWSERS = [
  { key: 'chrome', name: 'Chrome', letter: 'C' },
  { key: 'edge', name: 'Edge', letter: 'E' },
  { key: 'brave', name: 'Brave', letter: 'B' },
  { key: 'opera', name: 'Opera', letter: 'O' },
  { key: 'vivaldi', name: 'Vivaldi', letter: 'V' }
];

const PERMISSIONS: Array<[string, string]> = [
  ['tabs', 'Membuka dan menavigasi tab.'],
  ['scripting', 'Menjaga skrip di halaman tetap hidup.'],
  ['storage', 'Token dan pengaturan lokal Anda.'],
  ['alarms', 'Menjadwalkan pemeriksaan berkala.'],
  ['debugger', 'Klik tepercaya, tangkapan layar, dan pembacaan aksesibilitas.'],
  ['downloads', 'Menyimpan berkas hasil kerja ke disk Anda.']
];

const BROWSER_SUPPORT: Array<[string, string, string]> = [
  ['Chrome', 'ya', 'ya'],
  ['Edge', 'ya', 'ya'],
  ['Brave', 'ya', 'ya'],
  ['Opera', 'ya', 'ya'],
  ['Vivaldi', 'ya', 'ya'],
  ['Firefox', 'ditolak — tidak ada izin debugger', 'ditolak']
];

const CURL = 'curl.exe -sI https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/navego-update/download/navego.zip | findstr /i x-opera-sha256';
const LOCAL = 'Get-FileHash .\\navego-*.zip -Algorithm SHA256';

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
        <section className="page-hero">
          <div className="wrap">
            <p className="crumb">Unduh</p>
            <h1>Pasang navego.</h1>
            <p className="lede">Satu build untuk lima browser. Sekali folder diizinkan, cek pembaruan berjalan tiap 30 menit dan build terbaru masuk sendiri.</p>
            <div className="hero-cta">
              <a className="btn btn-solid" href="/download/forceinstall.reg" download="navego-forceinstall.reg">Unduh .reg — satu klik</a>
              <a className="btn btn-ghost" href="/download/forceinstall-remove.reg" download="navego-forceinstall-remove.reg">Hapus kebijakannya</a>
            </div>
            <p className="note">Windows saja. Berkas .reg ini menulis kebijakan <code>ExtensionInstallForcelist</code> ke profil Anda sendiri (HKCU, tanpa admin). Setelah browser ditutup dan dibuka lagi, Navego terpasang dan ikut rilis terbaru otomatis. Browser akan melaporkan “dikelola organisasi Anda” di <code>chrome://policy</code> — Anda sendiri yang menulis kebijakannya.</p>
          </div>
        </section>

        <section className="section" aria-labelledby="browserTitle" style={{ paddingTop: 'var(--s-6)' }}>
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Build</p>
                <h2 id="browserTitle" className="section-title">Pilih browser Anda.</h2>
              </div>
              <p className="section-note">.zip untuk Load unpacked, .crx untuk mesin yang dikelola. Keduanya berisi build yang sama.</p>
            </div>
            <div className="dl-grid">
              {BROWSERS.map((browser) => (
                <article key={browser.key} className="card dl-card">
                  <span className="dl-letter" aria-hidden="true">{browser.letter}</span>
                  <h2>{browser.name}</h2>
                  <a className="btn btn-solid" style={{ width: '100%' }} href={`${DOWNLOAD}.zip?for=${browser.key}`} download>Unduh .zip</a>
                  <p className="dl-req">Untuk build ini, klik Izinkan folder sekali di popup/opsi; setelah itu extension memeriksa dan mengambil rilis baru otomatis.</p>
                  <p className="dl-req">Atau: <a href={`${DOWNLOAD}.crx?for=${browser.key}`} download title="Paket bertanda tangan: untuk mesin yang dikelola">.crx</a> · <a href={MANIFEST}>Manifest</a></p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="stepsTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Langkah</p>
                <h2 id="stepsTitle" className="section-title">Tiga langkah.</h2>
              </div>
            </div>
            <ol className="steps">
              <li><span><strong>Ekstrak.</strong> Buka <code>opera://extensions</code> (atau <code>chrome://extensions</code>), aktifkan <em>Developer mode</em>, klik <em>Load unpacked</em>, pilih folder hasil ekstrak.</span></li>
              <li><span><strong>Masuk.</strong> Buka halaman masuk dan gunakan magic link atau OAuth.</span></li>
              <li><span><strong>Pair.</strong> Dashboard → Device → Pasangkan browser ini. Satu klik.</span></li>
            </ol>
          </div>
        </section>

        <section className="section" aria-labelledby="permTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Izin</p>
                <h2 id="permTitle" className="section-title">Enam izin,<br />satu per satu.</h2>
              </div>
              <p className="section-note">Izin per situs: Anda yang memutuskan halaman mana boleh dibuka. Tangkapan layar ditolak di tab pribadi; password, OTP, PIN, kartu, dan CVV selalu diblokir.</p>
            </div>
            <div className="table-wrapper" tabIndex={0} role="region" aria-label="Enam izin yang diminta" style={{ maxWidth: '46rem' }}>
              <table className="table">
                <caption>Izin yang diminta, tanpa izin lain</caption>
                <tbody>
                  {PERMISSIONS.map(([name, why]) => (
                    <tr key={name}>
                      <th scope="row"><code>{name}</code></th>
                      <td>{why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="verifyTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Verifikasi</p>
                <h2 id="verifyTitle" className="section-title">Bandingkan<br />sidik jarinya.</h2>
              </div>
              <p className="section-note">Setiap rilis punya sidik jari SHA-256 sendiri. Dua perintah berikut harus mencetak sidik jari yang sama.</p>
            </div>
            <div style={{ display: 'grid', gap: 'var(--s-3)', maxWidth: '54rem' }}>
              {[
                ['server', 'Server', CURL],
                ['local', 'Lokal', LOCAL]
              ].map(([id, label, command]) => (
                <div key={id} style={{ display: 'flex', gap: 'var(--s-3)', alignItems: 'center', background: 'var(--navy-deep)', borderRadius: 'var(--radius-sm)', padding: 'var(--s-3) var(--s-4)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--amber-hi)', minInlineSize: '3.25rem', flexShrink: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
                  <code style={{ background: 'transparent', border: 0, padding: 0, color: '#cfe0ff', fontSize: 'var(--text-xs)', overflowX: 'auto', whiteSpace: 'nowrap', flex: '1 1 0%', minInlineSize: 0 }}>{command}</code>
                  <button onClick={() => copy(command!, id!)} className="btn btn-solid btn-sm" type="button">
                    {copied === id ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="supportTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Dukungan</p>
                <h2 id="supportTitle" className="section-title">Browser yang didukung</h2>
              </div>
            </div>
            <div className="table-wrapper" tabIndex={0} role="region" aria-label="Browser yang didukung" style={{ maxWidth: '40rem' }}>
              <table className="table">
                <thead><tr><th scope="col">Browser</th><th scope="col">.zip</th><th scope="col">.crx</th></tr></thead>
                <tbody>
                  {BROWSER_SUPPORT.map(([name, zip, crx]) => (
                    <tr key={name}><td><strong>{name}</strong></td><td>{zip}</td><td>{crx}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="note" style={{ marginTop: 'var(--s-3)' }}>Extension yang dipasang dari Web Store sedang dalam proses review. Sementara itu Anda memuat arsip yang sama dengan tangan.</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
