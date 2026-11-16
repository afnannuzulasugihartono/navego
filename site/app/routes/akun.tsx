import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';
import { AUTH_HOST, clearSession, ensureSession, headersFor, REST } from '../lib/auth';

export function meta() {
  return [
    { title: 'Akun Anda — Corbin' },
    { name: 'description', content: 'Identitas akun, penyedia tertaut, device Anda, dan sesi.' }
  ];
}

const PROVIDER_LABEL: Record<string, string> = { google: 'Google', github: 'GitHub', email: 'Tautan email' };

function providerOf(user: { app_metadata?: { providers?: string[]; provider?: string } }): string {
  const list = Array.isArray(user.app_metadata?.providers) ? (user.app_metadata?.providers as string[]) : [];
  return ['google', 'github'].find((name) => list.includes(name)) || user.app_metadata?.provider || 'email';
}

function linkedProviders(user: { app_metadata?: { providers?: string[] } }): string[] {
  const list = Array.isArray(user.app_metadata?.providers) ? (user.app_metadata?.providers as string[]) : [];
  return list.length ? list : [providerOf(user)];
}

function initialsOf(name: string, email: string): string {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return ((parts[0] || '').charAt(0) + (parts[1] || '').charAt(0)).toUpperCase();
  const fromEmail = String(email || '').split('@')[0] || '';
  return (fromEmail.slice(0, 2) || 'OA').toUpperCase();
}

function relativeTime(iso?: string | null): string {
  if (!iso) return 'tidak diketahui';
  try {
    const format = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return 'tidak diketahui';
    const seconds = Math.round((then - Date.now()) / 1000);
    const steps: Array<[number, number, Intl.RelativeTimeFormatUnit]> = [
      [60, 1, 'second'], [3600, 60, 'minute'], [86400, 3600, 'hour'], [2592000, 86400, 'day'], [31536000, 604800, 'week']
    ];
    for (const [limit, divisor, unit] of steps) {
      if (Math.abs(seconds) < limit) return format.format(Math.round(seconds / divisor), unit);
    }
    return format.format(Math.round(seconds / 31536000), 'year');
  } catch {
    return iso;
  }
}

export default function Akun() {
  const [state, setState] = useState<{ loading: boolean; user: null | Record<string, unknown>; deviceText: string; status: string }>({
    loading: true,
    user: null,
    deviceText: 'Memeriksa…',
    status: ''
  });

  useEffect(() => {
    (async () => {
      const token = await ensureSession();
      if (!token) {
        window.location.replace('./index.html');
        return;
      }
      let user: Record<string, unknown> | null = null;
      try {
        const response = await fetch(`${AUTH_HOST}/user`, { headers: headersFor(token) });
        if (!response.ok) throw new Error(`auth ${response.status}`);
        user = await response.json();
      } catch {
        clearSession();
        window.location.replace('./index.html');
        return;
      }
      setState((s) => ({ ...s, loading: false, user }));
      try {
        const response = await fetch(`${REST}/rpc/opera_my_devices`, { method: 'POST', headers: headersFor(token), body: '{}' });
        const data = await response.json();
        const count = data?.ok ? (data.devices?.length ?? 0) : 0;
        setState((s) => ({
          ...s,
          deviceText: data?.ok
            ? count ? `${count} device ter-pairing di akun ini.` : 'Belum ada device ter-pairing di akun ini.'
            : 'Belum bisa memuat device. Buka dashboard untuk mencoba lagi.'
        }));
      } catch {
        setState((s) => ({ ...s, deviceText: 'Belum bisa memuat device. Buka dashboard untuk mencoba lagi.' }));
      }
    })();
  }, []);

  const user = state.user as {
    id?: string;
    email?: string;
    last_sign_in_at?: string | null;
    app_metadata?: { providers?: string[]; provider?: string };
    user_metadata?: { full_name?: string; name?: string; user_name?: string };
  } | null;

  const name = user ? (user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.user_name || user.email || 'Akun Corbin') : 'Memeriksa sesi…';
  const email = user?.email || '—';
  const provider = user ? providerOf(user) : 'email';

  async function signOut() {
    const token = (await ensureSession()) || '';
    try {
      await fetch(`${AUTH_HOST}/logout`, { method: 'POST', headers: headersFor(token) });
    } catch {
    }
    clearSession();
    window.location.replace('./index.html');
  }

  async function copyId() {
    if (!user?.id) return;
    try {
      await navigator.clipboard.writeText(user.id);
      setState((s) => ({ ...s, status: `ID akun disalin: ${user.id}` }));
    } catch {
      setState((s) => ({ ...s, status: `Salin manual: ${user.id}` }));
    }
  }

  return (
    <>
      <SiteHeader current="/akun.html" />
      <main className="wrap" style={{ padding: '28px 0 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title" style={{ fontSize: 'clamp(30px,4vw,40px)' }}>Akun Anda</h1>
            <p className="lede" style={{ marginTop: 6, color: 'var(--muted-2)' }}>Akun ini yang dipakai device dan perintah Anda.</p>
          </div>
          <Link className="btn btn-solid" to="/dashboard.html">Buka Dashboard</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 320px) minmax(0, 1fr)', gap: 18, marginTop: 22, alignItems: 'start' }} className="akun-split">
          <aside>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span aria-hidden="true" style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--ink)', color: 'var(--paper)', display: 'grid', placeItems: 'center', fontWeight: 800, letterSpacing: '0.04em' }}>{user ? initialsOf(name, email) : '…'}</span>
              <span>
                <span style={{ display: 'block', fontWeight: 800 }}>{name}</span>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--muted-2)' }}>{email}</span>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>{user ? `Masuk lewat ${PROVIDER_LABEL[provider] || provider}` : 'Akun Corbin'}</span>
              </span>
            </div>
            <nav className="card" style={{ marginTop: 12, display: 'grid', gap: 6, fontSize: 13 }} aria-label="Bagian akun">
              <strong style={{ fontSize: 12, color: 'var(--muted)' }}>Di halaman ini</strong>
              {['identitas', 'penyedia', 'device', 'sesi'].map((id) => (
                <a key={id} href={`#${id}`} style={{ textDecoration: 'none', color: 'var(--muted-2)' }}>{id.charAt(0).toUpperCase() + id.slice(1)}</a>
              ))}
            </nav>
          </aside>

          <div style={{ display: 'grid', gap: 14 }}>
            <section className="panel" id="identitas" style={{ background: 'var(--card)' }}>
              <h2 style={{ fontSize: 16, marginBottom: 6 }}>Identitas akun</h2>
              <p style={{ fontSize: 12, color: 'var(--muted-2)' }}>Data ini datang dari penyedia yang Anda pakai masuk, bukan dari kami.</p>
              <dl className="sheet" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', marginTop: 10 }}>
                {[['Alamat', email], ['Penyedia', PROVIDER_LABEL[provider] || provider], ['Masuk terakhir', relativeTime(user?.last_sign_in_at)], ['ID akun', user?.id || '—']].map(([k, v]) => (
                  <div key={k as string} style={{ display: 'contents' }}>
                    <div style={{ padding: '8px 12px', color: 'var(--muted-2)', background: '#fff', borderBottom: '1px solid var(--card-2)', fontSize: 12 }}>{k}</div>
                    <div style={{ padding: '8px 12px', background: '#fff', borderBottom: '1px solid var(--card-2)', fontSize: 12, fontFamily: k === 'ID akun' ? "'Lucida Console', Consolas, monospace" : 'inherit' }}>{v}</div>
                  </div>
                ))}
              </dl>
              <button className="btn btn-ghost btn-sm" type="button" onClick={copyId} style={{ marginTop: 10 }}>Salin ID akun</button>
            </section>

            <section className="panel" id="penyedia">
              <h2 style={{ fontSize: 16, marginBottom: 6 }}>Penyedia tertaut</h2>
              <p style={{ fontSize: 12, color: 'var(--muted-2)' }}>Akun yang sama dapat masuk lewat lebih dari satu penyedia. Hanya yang tertaut yang bisa mengenali Anda.</p>
              <ul style={{ listStyle: 'none', display: 'grid', gap: 6, marginTop: 10, fontSize: 13 }}>
                {user ? linkedProviders(user).map((p) => <li key={p}><code>{p}</code> — {PROVIDER_LABEL[p] || p}</li>) : <li className="meta">Memeriksa…</li>}
              </ul>
            </section>

            <section className="panel" id="device">
              <h2 style={{ fontSize: 16, marginBottom: 6 }}>Device Anda</h2>
              <p style={{ fontSize: 13, color: 'var(--muted-2)' }}>{state.deviceText}</p>
              <div className="hero-cta" style={{ marginTop: 10 }}>
                <Link className="btn btn-solid" to="/dashboard.html">Buka dashboard</Link>
                <Link className="btn btn-ghost" to="/beranda.html#install">Pasang di device lain</Link>
              </div>
            </section>

            <section className="panel" id="sesi">
              <h2 style={{ fontSize: 16, marginBottom: 6 }}>Sesi</h2>
              <p style={{ fontSize: 12, color: 'var(--muted-2)' }}>Keluar menghapus token dari browser ini. Device yang sudah ter-pairing tetap ter-pairing, dan Anda perlu masuk lagi sebelum bisa menjalankan perintah.</p>
              <button className="btn btn-ghost" type="button" onClick={signOut} style={{ marginTop: 10, color: 'var(--danger)' }}>Keluar</button>
              <p className="status" role="status" aria-live="polite">{state.status}</p>
            </section>
          </div>
        </div>
        <p style={{ marginTop: 14 }}><Link to="/index.html" style={{ fontSize: 12, color: 'var(--muted)' }}>Ke halaman masuk</Link></p>
      </main>
      <SiteFooter />
    </>
  );
}
