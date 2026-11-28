// decisions.json -> D32, D34, D35, D36, D38, site-design-01, local-doctor-verdict-01 (one mark, no eyebrows, h1 first; the proof and the doctor state are honest)

import { useEffect } from 'react';
import { Link } from 'react-router';
import { seoMeta } from '../lib/seo.js';
import { SiteFooter, SiteHeader, VERSION } from '../components/Chrome';
import { CopyCommand } from '../components/CopyCommand';
import { recordInstallCopy } from '../lib/funnel';
import { WINDOWS_INSTALL_COMMAND } from '../lib/install-command';
import { announceSession, getReturnTo, proveSession, storeEmail, storeRefreshToken, storeToken } from '../lib/auth';
import popupProof from '../../../docs/store/screenshots/popup-pair-1280x800.png';
import portalProof from '../../../docs/proof/extension-portal.jpg';
import '../components/proof-shot.css';

// The screenshots and the five-run numbers are read from files already in the repo, not from a claim written for this page.

const REPO_URL = 'https://github.com/afnannuzulasugihartono/navego';
const POPUP_SHOT = `${REPO_URL}/blob/main/docs/store/screenshots/popup-pair-1280x800.png`;
const PORTAL_SHOT = `${REPO_URL}/blob/main/docs/proof/extension-portal.jpg`;

export function meta() {
  return seoMeta({
    title: 'Navego - agent AI di Chrome yang sudah Anda masuki',
    description: 'Server MCP lokal yang memakai sesi Chrome Anda sendiri: satu perintah, lalu tugas selesai sebagai berkas di komputer Anda. Bukti lima kali jalan tersedia di halaman ini.',
    path: '/'
  });
}

type Phase = 'form' | 'signedIn';

export default function Index() {
  // A public landing page has no account card.
  // Sign-in lives in the header; this effect only finishes an OAuth return that lands back on `/`.
  const phase: Phase = 'form';
  const returnTo = () => getReturnTo();

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = fragment.get('access_token');
    if (!accessToken) return;
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    const refreshToken = fragment.get('refresh_token');
    void (async () => {
      const proof = await proveSession(accessToken).catch(() => ({}));
      if (!proof || !('email' in proof)) return;
      storeToken(accessToken);
      if (refreshToken) storeRefreshToken(refreshToken);
      storeEmail(proof.email as string);
      announceSession(proof.email as string);
      window.location.replace(returnTo());
    })();
  }, []);

  return (
    <>
      <SiteHeader current="/" />
      <main className="auth-stage">
        <section className="page-hero" aria-labelledby="value-title">
          <div className="wrap">
            <h1 id="value-title">Agent Anda lanjut di Chrome yang sudah Anda masuki.</h1>
            <p className="lede">Navego adalah server MCP lokal yang memakai sesi browser Anda sendiri - bukan browser baru di server orang lain. Tidak ada sesi yang diekspor, tidak ada kredensial yang dikirim ke cloud. Satu perintah, lalu hasilnya menjadi berkas di komputer Anda.</p>

            <div className="card">
              {phase === 'form' ? (
                <>
                  <p className="note">Di Windows, perintah ini menulis policy HKCU: browser dikelola dan extension tidak bisa dicabut sampai policy dihapus. Hapus nilai policy yang ditampilkan perintah untuk uninstall.</p>
                  <CopyCommand
                    id="landing-install"
                    label="Windows"
                    command={WINDOWS_INSTALL_COMMAND}
                    buttonLabel="Salin perintah"
                    successMessage="Perintah disalin. Jalankan di PowerShell."
                    onCopied={() => recordInstallCopy('landing')}
                  />
                </>
              ) : null}
              <p className="note"><code>npx -y navego doctor</code> → setelah signing in dan pairing, doctor menampilkan paket dan jatah; di mesin baru, statusnya degraded sampai signing in dan pairing selesai. Baca biaya dan jalur undo di halaman <Link to="/unduh">Unduh</Link> sebelum menjalankannya.</p>
            </div>

            <div className="card">
              <p className="note"><strong>27 November 2026, lima kali jalan</strong> mengambil surat dari Google Drive dengan sesi yang sudah masuk. Ini halaman pertama salah satu hasilnya; nama, NIM, dan tanda tangan diburam atas permintaan pemilik, isi lainnya utuh:</p>
              <figure className="proof-figure">
                <img
                  src="/proof/navego-drive-pdf-page1.jpg"
                  width={780}
                  height={1103}
                  loading="lazy"
                  alt="Halaman pertama surat keputusan rektor yang diunduh Navego: dokumen asli, bukan gambar contoh; nama, NIM, dan tanda tangan diburam."
                />
                <figcaption>Hasil unduhan Navego, bukan tiruan. 578.104 byte, dua halaman.</figcaption>
              </figure>
              <ul>
                <li><strong>2 dari 5</strong> menghasilkan PDF dua halaman terverifikasi: <code>%PDF-1.5</code>, dua objek <code>/Type /Page</code>.</li>
                <li><strong>3 dari 5</strong> mengunduh berkas. Dua yang gagal kehabisan jatah sesi bersama - bukan karena halamannya.</li>
                <li>Dua cacat ditemukan dan diperbaiki: ZIP diterima sebagai <code>.pdf</code>, dan status <code>settled: true</code> muncul pada grid yang belum render.</li>
              </ul>
              <figure className="figure">
                <img className="proof-shot" src={popupProof} alt="Popup ekstensi Navego dengan tombol Pair this browser" />
                <figcaption>Tangkapan layar asli: <a href={POPUP_SHOT} rel="noreferrer">popup ekstensi saat pairing</a>.</figcaption>
              </figure>
              <p className="note"><a href="https://github.com/afnannuzulasugihartono/navego/blob/main/docs/proof/2026-11-27-engineer.md">Baca catatan lima kali jalan, termasuk yang gagal →</a></p>
              <p className="note"><Link to="/panduan-mcp-chrome-login">Panduan: pakai MCP di Chrome yang sudah Anda masuki →</Link></p>
            </div>

            <div className="hero-cta">
              <Link className="btn btn-solid" to="/harga">Lihat harga</Link>
              <Link className="btn btn-ghost" to="/unduh">Semua cara memasang</Link>
            </div>
            <p className="note">macOS dan Linux: <Link to="/unduh">unduh .zip</Link> dari halaman Unduh. Sudah punya akun? <Link to="/dashboard">Buka dashboard</Link>.</p>
          </div>
        </section>

        <section className="section" aria-labelledby="bukti-title">
          <div className="wrap">
            <div className="section-head">
              <div><h2 id="bukti-title" className="section-title">Bukti yang bisa Anda periksa.</h2></div>
              <p className="section-note">Tangkapan layar asli, berkas asli, dan angka yang kami ukur sendiri.</p>
            </div>
            <div className="stat-strip">
              <div className="stat"><b>5</b><span>uji, satu tugas</span></div>
              <div className="stat"><b>2</b><span>PDF terverifikasi</span></div>
              <div className="stat"><b>40</b><span>tool MCP, MIT</span></div>
            </div>
            <div className="tile-grid mt-6">
              <article className="tile">
                <h3>Halaman tempat berkas diambil</h3>
                <img className="proof-shot" src={portalProof} alt="Portal contoh dengan tombol Unduh CSV yang ditandai" />
                <p>Tangkapan layar asli dari <a href={PORTAL_SHOT} rel="noreferrer">docs/proof/extension-portal.jpg</a>.</p>
              </article>
              <article className="tile">
                <h3>Berkas yang bisa Anda buka</h3>
                <p>Unduh contoh hasil kerja, lalu periksa isinya sendiri.</p>
                <p><a href="/contoh/laporan-keuangan-2026-09.xlsx" download>Laporan keuangan (.xlsx) →</a></p>
                <p><a href="/contoh/rencana-pemasaran-2027.docx" download>Rencana pemasaran (.docx) →</a></p>
                <p><a href="/contoh/rencana-strategis-2027.pptx" download>Rencana strategis (.pptx) →</a></p>
              </article>
              <article className="tile">
                <h3>Fakta yang bisa dicek</h3>
                <p>Kode di <a href={REPO_URL} rel="noreferrer">GitHub</a> dengan lisensi MIT, paket <a href="https://www.npmjs.com/package/navego" rel="noreferrer">npm navego {VERSION}</a>, 40 tool MCP, dan manifes di <a href="/mcp">halaman Pasang MCP</a>.</p>
                <p>Batas jujur: belum Firefox atau Safari, belum di Chrome Web Store, dan hasil CAPTCHA atau anti-bot bergantung pada situs. Password, OTP, dan CVV selalu ditolak.</p>
              </article>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}