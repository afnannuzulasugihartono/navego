// decisions.json -> D35, D36 (no eyebrows, h1 first)

import { useEffect, useState } from 'react';
import { seoMeta } from '../lib/seo.js';
import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';
import { AUTH_HOST, clearSession, ensureSession, headersFor, REST } from '../lib/auth';

export function meta() {
  return seoMeta({
    title: 'Akun Anda — Navego',
    description: 'Identitas akun, penyedia tertaut, device Anda, dan sesi.',
    path: '/akun'
  });
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
    void (async () => {
      const token = await ensureSession();
      if (!token) {
        window.location.replace('/');
        return;
      }
      let user: Record<string, unknown> | null = null;
      try {
        const response = await fetch(`${AUTH_HOST}/user`, { headers: headersFor(token) });
        if (!response.ok) throw new Error(`auth ${response.status}`);
        user = await response.json();
      } catch {
        setState((s) => ({ ...s, loading: false, status: 'Tidak bisa menghubungi layanan auth. Sesi Anda tetap tersimpan — coba lagi saat jaringan kembali.' }));
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

  const name = user ? (user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.user_name || user.email || 'Akun Navego') : 'Memeriksa sesi…';
  const email = user?.email || '—';
  const provider = user ? providerOf(user) : 'email';

  async function signOut() {
    const token = (await ensureSession()) || '';
    try {
      await fetch(`${AUTH_HOST}/logout`, { method: 'POST', headers: headersFor(token) });
    } catch {
    }
    clearSession();
    window.location.replace('/');
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
      <SiteHeader current="/akun" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <h1>Akun Anda.</h1>
            <p className="lede">Akun ini yang dipakai device dan perintah Anda.</p>
            <div className="hero-cta">
              <Link className="btn btn-solid" to="/dashboard">Buka Dashboard</Link>
            </div>
          </div>
        </section>

        <div className="wrap" style={{ paddingBlock: 'var(--s-7)' }}>
          <div className="akun-split" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 20rem) minmax(0, 1fr)', gap: 'var(--s-5)', alignItems: 'start' }}>
            <aside style={{ display: 'grid', gap: 'var(--s-4)' }}>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-4)' }}>
                <span aria-hidden="true" style={{ width: '3.25rem', height: '3.25rem', borderRadius: '50%', background: 'var(--navy)', color: '#f4f7ff', display: 'grid', placeItems: 'center', fontWeight: 800, letterSpacing: '0.04em' }}>{user ? initialsOf(name, email) : '…'}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 800, overflowWrap: 'anywhere' }}>{name}</span>
                  <span style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--muted-2)', overflowWrap: 'anywhere' }}>{email}</span>
                  <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{user ? `Masuk lewat ${PROVIDER_LABEL[provider] || provider}` : 'Akun Navego'}</span>
                </span>
              </div>
              <nav className="card" aria-label="Bagian akun" style={{ display: 'grid', gap: 'var(--s-2)', fontSize: 'var(--text-sm)' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Di halaman ini</p>
                {[['identitas', 'Identitas'], ['penyedia', 'Penyedia'], ['device', 'Device'], ['sesi', 'Sesi']].map(([id, label]) => (
                  <a key={id} href={`#${id}`} style={{ textDecoration: 'none', color: 'var(--navy)', fontWeight: 700 }}>{label}</a>
                ))}
              </nav>
            </aside>

            <div style={{ display: 'grid', gap: 'var(--s-4)' }}>
              <section className="card" id="identitas">
                <h2 className="card-title">Identitas akun</h2>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-2)', margin: 'var(--s-2) 0 var(--s-3)' }}>Data ini datang dari penyedia yang Anda pakai masuk, bukan dari kami.</p>
                <div className="table-wrapper" tabIndex={0} role="region" aria-label="Identitas akun">
                  <table className="table">
                    <tbody>
                      {[['Alamat', email], ['Penyedia', PROVIDER_LABEL[provider] || provider], ['Masuk terakhir', relativeTime(user?.last_sign_in_at)], ['ID akun', user?.id || '—']].map(([k, v]) => (
                        <tr key={k as string}>
                          <th scope="row" style={{ width: '40%' }}>{k}</th>
                          <td style={k === 'ID akun' ? { fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' } : undefined}>{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="btn btn-ghost btn-sm" type="button" onClick={copyId} style={{ marginTop: 'var(--s-3)' }}>Salin ID akun</button>
              </section>

              <section className="card" id="penyedia">
                <h2 className="card-title">Penyedia tertaut</h2>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-2)', margin: 'var(--s-2) 0 var(--s-3)' }}>Akun yang sama dapat masuk lewat lebih dari satu penyedia. Hanya yang tertaut yang bisa mengenali Anda.</p>
                <ul style={{ listStyle: 'none', display: 'grid', gap: 'var(--s-2)', fontSize: 'var(--text-sm)' }}>
                  {user ? linkedProviders(user).map((p) => <li key={p}><code>{p}</code> — {PROVIDER_LABEL[p] || p}</li>) : <li style={{ color: 'var(--muted)' }}>Memeriksa…</li>}
                </ul>
              </section>

              <section className="card" id="device">
                <h2 className="card-title">Device Anda</h2>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-2)', margin: 'var(--s-2) 0 var(--s-4)' }}>{state.deviceText}</p>
                <div className="hero-cta" style={{ marginTop: 0 }}>
                  <Link className="btn btn-solid" to="/dashboard">Buka dashboard</Link>
                  <Link className="btn btn-ghost" to="/unduh">Pasang di device lain</Link>
                </div>
              </section>

              <section className="card" id="sesi">
                <h2 className="card-title">Sesi</h2>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-2)', margin: 'var(--s-2) 0 var(--s-4)' }}>Keluar menghapus token dari browser ini. Device yang sudah ter-pairing tetap ter-pairing, dan Anda perlu masuk lagi sebelum bisa menjalankan perintah.</p>
                <button className="btn btn-ghost" type="button" onClick={signOut} style={{ color: 'var(--danger)' }}>Keluar</button>
                <p className="status" role="status" aria-live="polite">{state.status}</p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
