// decisions.json -> site-auth-return-path-01, site-design-02

import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { seoMeta } from '../lib/seo.js';
import { SiteFooter, SiteHeader } from '../components/Chrome';
import { AUTH_HOST, PUBLISHABLE_KEY, announceSession, clearSession, getReturnTo, getStoredToken, proveSession, storeEmail, storeToken } from '../lib/auth';

export function meta() {
  return seoMeta({
    title: 'Masuk ke Navego',
    description: 'Masuk dengan Google, GitHub, atau tautan email. Setelah masuk Anda kembali ke halaman yang sedang dibuka - termasuk halaman harga dari tempat Anda menekan beli.',
    path: '/masuk'
  });
}

export default function Masuk() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [known, setKnown] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const next = getReturnTo();
  const backIsHarga = next.startsWith('/harga');

  useEffect(() => {
    const origin = window.location.origin;
    for (const id of ['googleButton', 'githubButton']) {
      const link = document.getElementById(id) as HTMLAnchorElement | null;
      if (!link) continue;
      const url = new URL(link.href);
      url.searchParams.set('redirect_to', `${origin}/masuk?next=${encodeURIComponent(next)}`);
      link.href = url.toString();
    }
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const fragmentToken = fragment.get('access_token');
    if (fragmentToken) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      void proveSession(fragmentToken)
        .then((proof) => {
          if (!('email' in proof)) {
            setStatus('Sesi tidak terbukti. Coba masuk lagi.');
            return;
          }
          storeToken(fragmentToken);
          storeEmail(String(proof.email || ''));
          announceSession(String(proof.email || ''));
          window.location.replace(next);
        })
        .catch(() => setStatus('Sesi tidak terbukti. Coba masuk lagi.'));
      setChecked(true);
      return;
    }
    const token = getStoredToken();
    if (!token) {
      setChecked(true);
      return;
    }
    void proveSession(token)
      .then((proof) => { if ('email' in proof) setKnown(String(proof.email || 'akun ini')); })
      .catch(() => {})
      .finally(() => setChecked(true));
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
        body: JSON.stringify({ email: target, options: { emailRedirectTo: `${window.location.origin}/masuk?next=${encodeURIComponent(next)}` } })
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
    setStatus('Terkirim. Klik tautan di email Anda - tab ini boleh ditutup.');
  }

  function signOut() {
    clearSession();
    setKnown(null);
    announceSession(null);
  }

  return (
    <>
      <SiteHeader current="/masuk" />
      <main className="auth-stage">
        <section className="page-hero">
          <div className="wrap">
            <h1>Masuk ke Navego.</h1>
            <p className="lede">
              {backIsHarga
                ? 'Plan terikat ke akun, jadi masuk dulu. Setelah masuk Anda kembali ke halaman harga dengan plan yang tadi Anda pilih.'
                : 'Akun ini yang memegang plan, device, dan riwayat perintah Anda.'}
            </p>

            {checked && known ? (
              <div className="auth-card"><div className="card">
                <p className="note">Anda sudah masuk sebagai <strong>{known}</strong>.</p>
                <div className="hero-cta">
                  <a className="btn btn-solid" href={next}>Lanjutkan</a>
                  <button className="btn btn-ghost" type="button" onClick={signOut}>Bukan saya</button>
                </div>
              </div></div>
            ) : null}

            <div className="auth-card">
              <div className="card">
              <a className="provider" id="googleButton" href={`${AUTH_HOST}/authorize?provider=google`}>Lanjutkan dengan Google</a>
              <a className="provider" id="githubButton" href={`${AUTH_HOST}/authorize?provider=github`}>Lanjutkan dengan GitHub</a>
              <p className="auth-intro">Atau tautan email - tanpa kata sandi, tautannya berlaku sekali.</p>
              <form onSubmit={(event) => { event.preventDefault(); void sendMagicLink(); }}>
                <div className="field">
                  <label htmlFor="masuk-email">Alamat email</label>
                  <input
                    id="masuk-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="nama@contoh.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <button className="btn btn-solid" type="submit">Kirim tautan masuk</button>
              </form>
              <p className="status" role="status">{status}</p>
              <p className="note">Yang disimpan: alamat email dan device yang Anda pasangkan. Tidak ada kata sandi. <Link to="/privasi">Kebijakan privasi</Link>.</p>
              </div>
            </div>
            <p className="note">Belum punya plan? <Link to="/harga">Lihat harga</Link> - pemasangan extension tetap gratis.</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}