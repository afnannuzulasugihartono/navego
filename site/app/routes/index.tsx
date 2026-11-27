// decisions.json -> D32, D34, D35, D36, D38 (one mark, no eyebrows, h1 first, the lockup panel) decisions.json -> site-install-cta-02

import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { seoMeta } from '../lib/seo.js';
import { SiteFooter, SiteHeader } from '../components/Chrome';
import { CopyCommand } from '../components/CopyCommand';
import { NavegoMark, NavegoWordmark } from '../components/NavegoMark';
import { recordInstallCopy } from '../lib/funnel';
import { WINDOWS_INSTALL_COMMAND } from '../lib/install-command';

import { AUTH_HOST, announceSession, clearSession, getReturnTo, getRefreshToken, getStoredToken, proveSession, renewAccessToken, storeEmail, storeRefreshToken, storeToken, PUBLISHABLE_KEY } from '../lib/auth';

export function meta() {
  return seoMeta({
    title: 'Navego — AI agent di browser Anda sendiri',
    description: 'Asisten AI yang membuka portal, mengisi formulir, dan menyimpan Excel, Word, atau PowerPoint di browser Anda sendiri. Mulai gratis; masuk dengan Google, GitHub, atau magic link email.',
    path: '/'
  });
}

type Phase = 'form' | 'signedIn';

export default function Index() {
  const [phase, setPhase] = useState<Phase>('form');
  const [email, setEmail] = useState('');
  const [who, setWho] = useState('');
  const [status, setStatus] = useState('');
  const [sessionStatus, setSessionStatus] = useState('');
  const [returning, setReturning] = useState(false);

  const returnTo = () => getReturnTo();

  useEffect(() => {
    const origin = window.location.origin;
    for (const id of ['googleButton', 'githubButton']) {
      const link = document.getElementById(id) as HTMLAnchorElement | null;
      if (!link) continue;
      const url = new URL(link.href);
      url.searchParams.set('redirect_to', `${origin}/?next=${encodeURIComponent(returnTo())}`);
      link.href = url.toString();
    }
    void (async () => {
      const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const accessToken = fragment.get('access_token');
      if (accessToken) {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        const refreshToken = fragment.get('refresh_token');
        const proof = await proveSession(accessToken).catch(() => ({}));
        if (proof && 'email' in proof) {
          storeToken(accessToken);
          if (refreshToken) storeRefreshToken(refreshToken);
          storeEmail(proof.email as string);
          announceSession(proof.email as string);
          window.location.replace(returnTo());
          return;
        }
        setStatus('Sesi tidak terbukti. Coba masuk lagi.');
        return;
      }
      let stored = getStoredToken();
      if (stored) {
        let proof = await proveSession(stored).catch(() => ({}));
        if (!('email' in proof)) {
          const renewed = getRefreshToken() ? await renewAccessToken() : null;
          if (renewed) {
            stored = renewed;
            proof = await proveSession(stored).catch(() => ({}));
          } else if (getStoredToken()) {
            setStatus('Tidak bisa menghubungi layanan auth. Sesi Anda tetap tersimpan — coba lagi saat jaringan kembali.');
            return;
          } else {
            return;
          }
        }
        if ('email' in proof) {
          setWho(proof.email as string);
          setPhase('signedIn');
          setReturning(true);
          announceSession(proof.email as string);
        }
      }
    })();
  }, []);

  async function sendMagicLink() {
    const target = email.trim();
    if (!target) {
      setStatus('Isi alamat email dulu.');
      return;
    }
    let response: Response;
    try {
      response = await fetch(`${AUTH_HOST}/otp`, {
        method: 'POST',
        headers: { apikey: PUBLISHABLE_KEY, 'content-type': 'application/json' },
        body: JSON.stringify({ email: target, options: { emailRedirectTo: `${window.location.origin}/?next=${encodeURIComponent(returnTo())}` } })
      });
    } catch {
      setStatus('Tidak bisa mencapai layanan auth. Periksa koneksi Anda.');
      return;
    }
    if (!response.ok) {
      setStatus('Email tidak terkirim. Coba lagi atau pakai tombol penyedia.');
      return;
    }
    setEmail('');
    setStatus('Terkirim. Klik link di email Anda untuk masuk.');
  }

  async function signOut() {
    const accessToken = getStoredToken() || '';
    try {
      await fetch(`${AUTH_HOST}/logout`, {
        method: 'POST',
        headers: { apikey: PUBLISHABLE_KEY, authorization: `Bearer ${accessToken}` }
      });
    } catch {
      setSessionStatus('Tidak bisa mencapai layanan auth, tapi tab ini dilupakan.');
    }
    clearSession();
    setPhase('form');
    setWho('');
  }

  return (
    <>
      <SiteHeader current="/" />
      <main className="auth-stage">
        <section className="page-hero" aria-labelledby="value-title">
          <div className="wrap">
            <h1 id="value-title">Agent Anda lanjut di Chrome yang sudah Anda masuki.</h1>
            <p className="lede">Navego adalah server MCP lokal yang memakai sesi browser Anda sendiri — bukan browser baru di server orang lain. Tidak ada sesi yang diekspor, tidak ada kredensial yang dikirim ke cloud. Satu perintah, lalu hasilnya menjadi berkas di komputer Anda.</p>

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
              <p className="note"><code>npx -y navego doctor</code> → <code>ready</code>; bridge <code>127.0.0.1:9451</code>, 1 device terhubung. Baca biaya dan jalur undo di halaman <Link to="/unduh">Unduh</Link> sebelum menjalankannya.</p>
            </div>

            <div className="card">
              <p className="note">Bukti 27 November 2026 — lima kali jalan mengambil dokumen dari Google Drive dengan sesi yang sudah ada:</p>
              <ul>
                <li><strong>2 dari 5</strong> menghasilkan PDF dua halaman terverifikasi: 578.104 byte, <code>%PDF-1.5</code>, dua objek <code>/Type /Page</code>.</li>
                <li><strong>3 dari 5</strong> mengunduh berkas. Dua yang gagal kehabisan jatah sesi bersama — bukan karena halamannya.</li>
                <li>Dua cacat ditemukan dan diperbaiki: ZIP diterima sebagai <code>.pdf</code>, dan status <code>settled: true</code> muncul pada grid yang belum render.</li>
              </ul>
              <p className="note"><a href="https://github.com/afnannuzulasugihartono/navego/blob/main/docs/proof/2026-11-27-engineer.md">Baca catatan lima kali jalan →</a></p>
            </div>

            <div className="hero-cta">
              <Link className="btn btn-solid" to="/harga">Lihat harga</Link>
              <Link className="btn btn-ghost" to="/unduh">Semua cara memasang</Link>
            </div>
            <p className="note">macOS dan Linux: <Link to="/unduh">unduh .zip</Link> dari halaman Unduh.</p>
          </div>
        </section>
        <div className="auth-pane">
          {phase === 'form' ? (
            <div className="auth-card">
              <div className="auth-lockup">
                <NavegoMark size={30} />
                <NavegoWordmark size={17} />
              </div>
              <div className="card">
                  <h2>Masuk atau daftar.</h2>
                <p className="auth-intro">Akun ini yang dipakai device, kuota, dan saldo Anda.</p>

                <a className="provider" id="googleButton" href="https://nenmkmtvjremqphfqnfw.supabase.co/auth/v1/authorize?provider=google&redirect_to=https://navego.pages.dev/"><svg viewBox="0 0 16 16" aria-hidden="true"><path fill="#4285F4" d="M15.5 8.2c0-.55-.05-1.08-.14-1.6H8v3.03h4.2a3.6 3.6 0 0 1-1.56 2.36v1.96h2.53c1.48-1.36 2.33-3.37 2.33-5.75z"/><path fill="#34A853" d="M8 16c2.1 0 3.87-.7 5.16-1.89l-2.53-1.96c-.7.47-1.6.75-2.63.75-2.02 0-3.73-1.36-4.34-3.2H1.08v2.03A8 8 0 0 0 8 16z"/><path fill="#FBBC05" d="M3.66 9.7a4.8 4.8 0 0 1 0-3.4V4.27H1.08a8 8 0 0 0 0 7.46l2.58-2.03z"/><path fill="#EA4335" d="M8 3.1c1.14 0 2.17.4 2.98 1.17l2.24-2.24A8 8 0 0 0 1.08 4.27l2.58 2.03C4.27 4.46 5.98 3.1 8 3.1z"/></svg><span>Lanjutkan dengan Google</span></a>

                <div className="divider"><span>atau</span></div>

                <form onSubmit={(event) => { event.preventDefault(); void sendMagicLink(); }}>
                  <div className="field">
                    <label htmlFor="magicEmail">Email</label>
                    <input id="magicEmail" type="email" autoComplete="email" spellCheck={false} maxLength={254} placeholder="anda@perusahaan.id" value={email} onChange={(event) => setEmail(event.target.value)} />
                  </div>
                  <button type="submit" className="btn btn-solid w-full">Lanjutkan dengan email</button>
                </form>
                <p className="status" role="status" aria-live="polite">{status}</p>

                <a className="provider mt-2" id="githubButton" href="https://nenmkmtvjremqphfqnfw.supabase.co/auth/v1/authorize?provider=github&redirect_to=https://navego.pages.dev/"><svg viewBox="0 0 16 16" aria-hidden="true"><path fill="#161513" d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.36c-2.24.49-2.71-1.08-2.71-1.08-.37-.93-.9-1.18-.9-1.18-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.5-1.07-1.77-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0z"/></svg><span>Lanjutkan dengan GitHub</span></a>

                  <p className="note">Kontrol browser tetap di perangkat Anda. Navego tidak menjalankan eval, dan tidak pernah meminta password.</p>
                  <p className="note"><Link to="/privasi">Kebijakan privasi</Link>, <Link to="/keamanan">Keamanan</Link></p>
                </div>
            </div>
          ) : (
            <div className="auth-card">
              <div className="card">
                <h2>Masuk atau daftar.</h2>
                <p className="auth-intro">Masuk sebagai <strong>{who}</strong>.</p>
                {returning ? (
                  <div className="hero-cta mt-4">
                    <a className="btn btn-solid" id="continueButton" href={returnTo()}>Lanjutkan ke tujuan</a>
                    <a className="btn btn-ghost" href="/dashboard">Buka dashboard</a>
                  </div>
                ) : (
                  <div className="hero-cta mt-4">
                    <a className="btn btn-solid" href="/dashboard">Buka dashboard</a>
                    <button className="btn btn-ghost" type="button" onClick={signOut}>Keluar</button>
                  </div>
                )}
                <p className="status" role="status" aria-live="polite">{sessionStatus}</p>
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
