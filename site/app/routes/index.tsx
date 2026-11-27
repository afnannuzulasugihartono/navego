// decisions.json -> D32, D34, D35, D36, D38, site-design-01 (one mark, no eyebrows, h1 first; the proof is the first screen)

import { useEffect } from 'react';
import { Link } from 'react-router';
import { seoMeta } from '../lib/seo.js';
import { SiteFooter, SiteHeader } from '../components/Chrome';
import { CopyCommand } from '../components/CopyCommand';
import { recordInstallCopy } from '../lib/funnel';
import { WINDOWS_INSTALL_COMMAND } from '../lib/install-command';
import { announceSession, getReturnTo, proveSession, storeEmail, storeRefreshToken, storeToken } from '../lib/auth';

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
              <p className="note"><code>npx -y navego doctor</code> - <code>ready</code>; bridge <code>127.0.0.1:9451</code>, 1 device terhubung. Baca biaya dan jalur undo di halaman <Link to="/unduh">Unduh</Link> sebelum menjalankannya.</p>
            </div>

            <div className="card">
              <p className="note">Bukti 27 November 2026 - lima kali jalan mengambil dokumen dari Google Drive dengan sesi yang sudah ada:</p>
              <ul>
                <li><strong>2 dari 5</strong> menghasilkan PDF dua halaman terverifikasi: 578.104 byte, <code>%PDF-1.5</code>, dua objek <code>/Type /Page</code>.</li>
                <li><strong>3 dari 5</strong> mengunduh berkas. Dua yang gagal kehabisan jatah sesi bersama - bukan karena halamannya.</li>
                <li>Dua cacat ditemukan dan diperbaiki: ZIP diterima sebagai <code>.pdf</code>, dan status <code>settled: true</code> muncul pada grid yang belum render.</li>
              </ul>
              <p className="note"><a href="https://github.com/afnannuzulasugihartono/navego/blob/main/docs/proof/2026-11-27-engineer.md">Baca catatan lima kali jalan →</a></p>
            </div>

            <div className="hero-cta">
              <Link className="btn btn-solid" to="/harga">Lihat harga</Link>
              <Link className="btn btn-ghost" to="/unduh">Semua cara memasang</Link>
            </div>
            <p className="note">macOS dan Linux: <Link to="/unduh">unduh .zip</Link> dari halaman Unduh. Sudah punya akun? <Link to="/dashboard">Buka dashboard</Link>.</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}