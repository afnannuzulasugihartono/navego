// decisions.json -> D35, D36, D37 (no eyebrows, h1 first, commas not middle dots)

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
      <SiteHeader current="/unduh" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <h1>Pasang dalam satu klik.</h1>
            <p className="lede">Satu build untuk lima browser. Setelah folder diizinkan, cek pembaruan berjalan tiap 30 menit dan build terbaru masuk sendiri.</p>
            <div className="hero-cta">
              <a className="btn btn-solid" href="/download/forceinstall.reg" download="navego-forceinstall.reg">Unduh .reg — satu klik</a>
              <a className="btn btn-ghost" href="/download/forceinstall-remove.reg" download="navego-forceinstall-remove.reg">Hapus kebijakannya</a>
            </div>
            <p className="note">Windows saja. Berkas .reg menulis kebijakan <code>ExtensionInstallForcelist</code> ke profil Anda sendiri (HKCU, tanpa admin). Tutup dan buka lagi browsernya, Navego terpasang dan ikut rilis terbaru.</p>
          </div>
        </section>

        <section className="band" aria-labelledby="browserTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="browserTitle" className="section-title">Pilih browser Anda.</h2>
              </div>
              <p className="section-note">.zip untuk Load unpacked, .crx untuk mesin yang dikelola. Isinya build yang sama.</p>
            </div>
            <div className="card-row">
              {BROWSERS.map((browser) => (
                <article key={browser.key} className="tile-xl">
                  <div className="tile-media"><span className="dl-letter">{browser.letter}</span></div>
                  <h3>{browser.name}</h3>
                  <a className="btn btn-solid btn-sm" style={{ width: '100%' }} href={`${DOWNLOAD}.zip?for=${browser.key}`} download>Unduh .zip</a>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>Atau: <a href={`${DOWNLOAD}.crx?for=${browser.key}`} download>.crx</a> · <a href={MANIFEST}>Manifest</a></p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="band band-soft" aria-labelledby="stepsTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="stepsTitle" className="section-title">Tiga langkah.</h2>
              </div>
            </div>
            <div className="value-grid">
              <div className="value-card"><span className="start-num">1</span><b>Ekstrak</b><p>Buka <code>chrome://extensions</code> (atau <code>edge://</code>, <code>brave://</code>, <code>opera://</code>), aktifkan Developer mode, klik Load unpacked, pilih folder hasil ekstrak.</p></div>
              <div className="value-card"><span className="start-num">2</span><b>Masuk</b><p>Buka halaman masuk dan gunakan magic link atau OAuth.</p></div>
              <div className="value-card"><span className="start-num">3</span><b>Pair</b><p>Dashboard → Device → Pasangkan browser ini. Satu klik, tanpa kode.</p></div>
            </div>
          </div>
        </section>

        <section className="band band-dark" aria-labelledby="permTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="permTitle" className="section-title">Enam izin, satu per satu.</h2>
              </div>
              <p className="section-note">Izin per situs: Anda yang memutuskan halaman mana boleh dibuka. Password, OTP, PIN, kartu, dan CVV selalu diblokir.</p>
            </div>
            <div className="value-grid">
              {PERMISSIONS.map(([name, why]) => (
                <div className="value-card" key={name} style={{ background: '#16204a' }}>
                  <code style={{ fontSize: 'var(--text-sm)', color: 'var(--amber-hi)', background: 'transparent', border: 0 }}>{name}</code>
                  <p>{why}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="band" aria-labelledby="verifyTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="verifyTitle" className="section-title">Bandingkan sidik jarinya.</h2>
              </div>
              <p className="section-note">Setiap rilis punya sidik jari SHA-256 sendiri. Dua perintah ini harus mencetak nilai yang sama.</p>
            </div>
            <div style={{ display: 'grid', gap: 'var(--s-3)', maxWidth: '54rem' }}>
              {[
                ['server', 'Server', CURL],
                ['local', 'Lokal', LOCAL]
              ].map(([id, label, command]) => (
                <div key={id} style={{ display: 'flex', gap: 'var(--s-3)', alignItems: 'center', background: 'var(--navy-deep)', borderRadius: 'var(--radius-sm)', padding: 'var(--s-3) var(--s-4)', minInlineSize: 0 }}>
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

        <section className="band band-soft" aria-labelledby="supportTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="supportTitle" className="section-title">Browser yang didukung.</h2>
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
            <p className="note" style={{ marginTop: 'var(--s-3)' }}>Extension dari Web Store masih dalam review. Sementara itu, muat arsip yang sama dengan tangan.</p>
          </div>
        </section>

        <section className="band">
          <div className="wrap">
            <div className="cta-band">
              <h2 className="section-title" style={{ color: '#ffffff' }}>Terpasang? Tunjuk satu tab.</h2>
              <p>Tulis satu perintah, lihat langkahnya, lalu ambil berkasnya.</p>
              <div className="hero-cta" style={{ marginTop: 'var(--s-2)' }}>
                <Link className="btn btn-solid" to="/docs">Buka docs</Link>
                <Link className="btn btn-ghost" to="/harga">Lihat harga</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
