// decisions.json -> D35, D36, D37 (no eyebrows, h1 first, commas not middle dots) decisions.json -> site-install-cta-01

import { useEffect, useMemo, useRef, useState } from 'react';
import { seoMeta } from '../lib/seo.js';
import { track } from '../lib/funnel';
import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';
import { createCopyCommand, type CopyFeedback } from '../lib/copy-command.js';

export function meta() {
  return seoMeta({
    title: 'Unduh — Navego',
    description: 'Pasang Navego di Windows dengan satu perintah PowerShell tanpa Node atau Chrome Web Store. macOS dan Linux memakai arsip .zip; masuk, lalu pair device dari dashboard.',
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

const ONE_LINER = 'irm https://navego.pages.dev/install.ps1 | iex';
const CURL = 'curl.exe -sI https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/navego-update/download/navego.zip | findstr /i x-opera-sha256';
const LOCAL = 'Get-FileHash .\\navego-*.zip -Algorithm SHA256';

type CopyCommandProps = {
  id: string;
  label: string;
  command: string;
  buttonLabel?: string;
  successMessage?: string;
  onCopied?: () => void;
};

function CopyCommand({ id, label, command, buttonLabel = 'Salin', successMessage = 'Disalin.', onCopied }: CopyCommandProps) {
  const [feedback, setFeedback] = useState<CopyFeedback | null>(null);
  const onCopiedRef = useRef(onCopied);
  useEffect(() => { onCopiedRef.current = onCopied; }, [onCopied]);
  const controller = useMemo(() => createCopyCommand({
    text: command,
    successMessage,
    failureMessage: 'Gagal menyalin. Salin manual dari kode.',
    onFeedback: setFeedback,
    onCopied: () => onCopiedRef.current?.()
  }), [command, successMessage]);

  useEffect(() => () => controller.dispose(), [controller]);

  return (
    <>
      <div className="command-row">
        <span className="command-row__label">{label}</span>
        <code className="command-row__code" id={`${id}-command`}>{command}</code>
        <button onClick={() => void controller.copy()} className="btn btn-solid btn-sm" type="button">{buttonLabel}</button>
      </div>
      <p className="copy-feedback" role="status" aria-live="polite" aria-atomic="true">
        {feedback ? <span key={feedback.attempt}>{feedback.message}</span> : null}
      </p>
    </>
  );
}

export default function Unduh() {
  return (
    <>
      <SiteHeader current="/unduh" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <h1>Mulai dari Chrome Anda.</h1>
            <p className="lede">Di Windows, satu perintah memasang extension tanpa Node dan tanpa Chrome Web Store. Di macOS dan Linux, satu unduhan. Tidak perlu kartu kredit untuk mencoba.</p>
            <CopyCommand
              id="install"
              label="PowerShell"
              command={ONE_LINER}
              buttonLabel="Salin perintah"
              successMessage="Perintah disalin. Jalankan di PowerShell."
              onCopied={() => track('install.click', { browser: 'windows', artifact: 'powershell' })}
            />
            <div className="hero-cta">
              <a className="btn btn-ghost" href={`${DOWNLOAD}.zip?for=chrome`} download onClick={() => track('install.click', { browser: 'chrome', artifact: 'zip' })}>Pasang manual (.zip)</a>
              <a className="btn btn-ghost" href="/download/forceinstall.reg" download="navego-forceinstall.reg" onClick={() => track('install.click', { browser: 'windows', artifact: 'reg' })}>Windows .reg</a>
            </div>
            <p className="note">macOS dan Linux: ekstrak .zip, lalu pilih Load unpacked. Di Windows, perintah ini menulis policy HKCU: browser lalu melaporkan dirinya dikelola, extension terpasang paksa dan tidak bisa dicabut selama policy itu ada. Tutup lalu buka browser sebelum masuk dan pair. Di mesin yang dikelola admin sekolah atau kantor, policy admin tetap menang.</p>
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
                  <a className="btn btn-solid btn-sm w-full" href={`${DOWNLOAD}.zip?for=${browser.key}`} download onClick={() => track('install.click', { browser: browser.key, artifact: 'zip' })}>Unduh .zip</a>
                  <p className="dl-note">Atau: <a href={`${DOWNLOAD}.crx?for=${browser.key}`} download onClick={() => track('install.click', { browser: browser.key, artifact: 'crx' })}>.crx</a>, <a href={MANIFEST}>Manifest</a></p>
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
              <div className="value-card"><span className="start-num">1</span><b>Pasang extension</b><p>Windows: jalankan perintah PowerShell di atas. macOS dan Linux: ekstrak .zip, buka <code>chrome://extensions</code>, aktifkan Developer mode, lalu pilih Load unpacked.</p></div>
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
                <CopyCommand key={id!} id={id!} label={label!} command={command!} successMessage={`${label!} disalin.`} />
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
            <p className="note note--spaced">Belum ada di Chrome Web Store. Windows memakai perintah di atas; macOS dan Linux memakai .zip. Pairing gagal? Buka <Link to="/docs#pairing">panduan pairing</Link> atau <Link to="/dukungan">Dukungan</Link>.</p>
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
