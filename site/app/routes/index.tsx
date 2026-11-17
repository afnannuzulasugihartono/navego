import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';

import { AUTH_HOST, clearSession, getReturnTo, getRefreshToken, getStoredToken, proveSession, renewAccessToken, storeRefreshToken, storeToken, PUBLISHABLE_KEY } from '../lib/auth';

export function meta() {
  return [
    { title: 'Masuk — Navego' },
    { name: 'description', content: 'Satu akun untuk website dan device Anda. Masuk dengan Google, GitHub, atau magic link email — tanpa password.' }
  ];
}

type Phase = 'form' | 'signedIn';
type Tab = 'login' | 'register';

export default function Index() {
  const [phase, setPhase] = useState<Phase>('form');
  const [email, setEmail] = useState('');
  const [who, setWho] = useState('');
  const [tab, setTab] = useState<Tab>('login');
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
    const cont = document.getElementById('continueButton') as HTMLAnchorElement | null;
    if (cont) cont.href = returnTo();

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
          } else {
            clearSession();
            return;
          }
        }
        if ('email' in proof) {
          setWho(proof.email as string);
          setPhase('signedIn');
          if (returnTo() !== './beranda.html') setReturning(true);
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
        body: JSON.stringify({ email: target })
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
      <SiteHeader current="/index.html" />
      <main className="auth-stage" aria-label="Masuk ke Navego">
        <div className="auth-art" aria-hidden="true" style={{ backgroundImage: "url('/assets/raven-1874.jpg')" }} />
        <div className="auth-pane">
          <div className="auth-copy">
            <h1>Navego.</h1>
            <p>Satu akun.<br />Semua browser Anda.</p>
          </div>
          {phase === 'form' ? (
            <div className="auth-card">
              <div className="tabs" role="tablist" aria-label="Masuk atau daftar">
                <button type="button" role="tab" aria-selected={tab === 'login'} onClick={() => setTab('login')}>Masuk</button>
                <button type="button" role="tab" aria-selected={tab === 'register'} onClick={() => setTab('register')}>Daftar</button>
              </div>
              <form onSubmit={(event) => { event.preventDefault(); void sendMagicLink(); }}>
                <div className="field">
                  <label htmlFor="magicEmail">Email</label>
                  <input id="magicEmail" type="email" autoComplete="email" spellCheck={false} maxLength={254} placeholder="anda@anda@perusahaan.id" value={email} onChange={(event) => setEmail(event.target.value)} />
                </div>
                <button type="submit" className="btn btn-solid" style={{ width: '100%', justifyContent: 'center' }}>{tab === 'login' ? 'Kirim magic link' : 'Buat akun'}</button>
              </form>
              <p className="status" role="status" aria-live="polite">{status}</p>
              <div className="auth-divider"><span>atau</span></div>
              <a className="provider" id="googleButton" href="https://nenmkmtvjremqphfqnfw.supabase.co/auth/v1/authorize?provider=google&redirect_to=https://opera-agent.pages.dev/"><svg viewBox="0 0 16 16" aria-hidden="true"><path fill="#4285F4" d="M15.5 8.2c0-.55-.05-1.08-.14-1.6H8v3.03h4.2a3.6 3.6 0 0 1-1.56 2.36v1.96h2.53c1.48-1.36 2.33-3.37 2.33-5.75z"/><path fill="#34A853" d="M8 16c2.1 0 3.87-.7 5.16-1.89l-2.53-1.96c-.7.47-1.6.75-2.63.75-2.02 0-3.73-1.36-4.34-3.2H1.08v2.03A8 8 0 0 0 8 16z"/><path fill="#FBBC05" d="M3.66 9.7a4.8 4.8 0 0 1 0-3.4V4.27H1.08a8 8 0 0 0 0 7.46l2.58-2.03z"/><path fill="#EA4335" d="M8 3.1c1.14 0 2.17.4 2.98 1.17l2.24-2.24A8 8 0 0 0 1.08 4.27l2.58 2.03C4.27 4.46 5.98 3.1 8 3.1z"/></svg><span>Masuk dengan Google</span></a>
              <a className="provider" id="githubButton" href="https://nenmkmtvjremqphfqnfw.supabase.co/auth/v1/authorize?provider=github&redirect_to=https://opera-agent.pages.dev/" style={{ marginTop: 8 }}><svg viewBox="0 0 16 16" aria-hidden="true"><path fill="#161513" d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.36c-2.24.49-2.71-1.08-2.71-1.08-.37-.93-.9-1.18-.9-1.18-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.5-1.07-1.77-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0z"/></svg><span>Masuk dengan GitHub</span></a>
              <p className="note" style={{ marginTop: 12 }}>Tidak pernah meminta password. Sesi Anda aman di browser ini.</p>
            </div>
          ) : (
            <div className="auth-card">
              <p className="lede" style={{ fontSize: 15 }}>Masuk sebagai <strong>{who}</strong>.</p>
              {returning ? (
                <div className="hero-cta" style={{ marginTop: 14 }}>
                  <a className="btn btn-solid" id="continueButton" href="./beranda.html">Lanjut ke izin</a>
                  <Link className="btn btn-ghost" to="/beranda.html">Beranda</Link>
                </div>
              ) : (
                <div className="hero-cta" style={{ marginTop: 14 }}>
                  <Link className="btn btn-solid" to="/dashboard.html">Buka dashboard</Link>
                  <button className="btn btn-ghost" type="button" onClick={signOut}>Keluar</button>
                </div>
              )}
              <p className="status" role="status" aria-live="polite">{sessionStatus}</p>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
