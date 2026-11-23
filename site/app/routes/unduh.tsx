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
            <h1>Mulai dari Chrome Anda.</h1>
            <p className="lede">Unduh ekstensinya, pair sekali, jalankan perintah pertama. Tidak perlu kartu kredit untuk mencoba.</p>
            <div className="hero-cta">
              <a className="btn btn-solid" href={`${DOWNLOAD}.zip?for=chrome`} download>Unduh untuk Chrome</a>
              <a className="btn btn-ghost" href="/download/forceinstall.reg" download="navego-forceinstall.reg">Pakai .reg di Windows</a>
            </div>
            <p className="note">Build yang sama untuk Edge, Brave, Opera, dan Vivaldi. .reg memakai HKCU, tanpa admin; .zip untuk Load unpacked.</p>
          </div>
        </section>

        <section className="band" aria-labelledby="browserTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="browserTitle" className="section-title">Pilih browser Anda.</h2>
              </div>
              <p className="section-note">.zip untuk Load unpacked. .crx untuk mesin dikelola.</p>
            </div>
            <div className="card-row">
              {BROWSERS.map((browser) => (
                <article key={browser.key} className="tile-xl">
                  <div className="tile-media"><span className="dl-letter">{browser.letter}</span></div>
                  <h3>{browser.name}</h3>
                  <a className="btn btn-solid btn-sm w-full" href={`${DOWNLOAD}.zip?for=${browser.key}`} download>Unduh .zip</a>
                  <p className="dl-note">Atau: <a href={`${DOWNLOAD}.crx?for=${browser.key}`} download>.crx</a>, <a href={MANIFEST}>Manifest</a></p>
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
              <div className="value-card"><span className="start-num">1</span><b>Load unpacked</b><p>Buka <code>chrome://extensions</code>. Aktifkan Developer mode. Pilih folder hasil ekstrak .zip.</p></div>
              <div className="value-card"><span className="start-num">2</span><b>Masuk</b><p>Masuk dengan Google, GitHub, atau magic link email. Sesi tersimpan setelah reload.</p></div>
              <div className="value-card"><span className="start-num">3</span><b>Pair & buktikan</b><p>Dashboard → Pairing → Pasangkan browser ini. Device harus online; jalankan <code>tabs.list</code> dari Aksi.</p></div>
            </div>
          </div>
        </section>

        <section className="band band-dark" aria-labelledby="permTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="permTitle" className="section-title">Enam izin, satu per satu.</h2>
              </div>
              <p className="section-note">Anda yang memutuskan. Password, OTP, CVV selalu diblokir.</p>
            </div>
            <div className="value-grid">
              {PERMISSIONS.map(([name, why]) => (
                <div className="value-card value-card--dark" key={name}>
                  <code>{name}</code>
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
              <p className="section-note">Setiap rilis punya SHA-256 sendiri. Keduanya harus sama.</p>
            </div>
            <div className="unduh-grid">
              {[
                ['server', 'Server', CURL],
                ['local', 'Lokal', LOCAL]
              ].map(([id, label, command]) => (
                <div key={id} className="command-row">
                  <span className="command-row__label">{label}</span>
                  <code className="command-row__code">{command}</code>
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
            <div className="table-wrapper table-wrapper--compact" tabIndex={0} role="region" aria-label="Browser yang didukung">
              <table className="table">
                <thead><tr><th scope="col">Browser</th><th scope="col">.zip</th><th scope="col">.crx</th></tr></thead>
                <tbody>
                  {BROWSER_SUPPORT.map(([name, zip, crx]) => (
                    <tr key={name}><td><strong>{name}</strong></td><td>{zip}</td><td>{crx}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="note note--spaced">Store masih review. Muat arsipnya dengan tangan. Pairing gagal? Buka <Link to="/docs#pairing">panduan pairing</Link> atau <Link to="/dukungan">Dukungan</Link>.</p>
          </div>
        </section>

        <section className="band">
          <div className="wrap">
            <div className="cta-band">
              <h2 className="section-title text-on-dark">Terpasang? Tunjuk satu tab.</h2>
              <p>Tulis satu perintah, lihat langkahnya, lalu ambil berkasnya.</p>
              <div className="hero-cta mt-2">
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
