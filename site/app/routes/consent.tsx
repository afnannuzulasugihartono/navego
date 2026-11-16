import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';
import { AUTH_HOST, clearSession, ensureSession, getStoredToken, getRefreshToken, headersFor, REST } from '../lib/auth';

export function meta() {
  return [
    { title: 'Izin aplikasi — Corbin' },
    { name: 'description', content: 'Tinjau aplikasi yang meminta akses ke akun Corbin Anda sebelum memberi izin.' }
  ];
}

const SCOPE_TEXT: Record<string, string> = {
  openid: 'Identitas dasar — ID akun unik Anda, tanpa data lain.',
  email: 'Alamat email Anda.',
  profile: 'Nama dan foto profil Anda.',
  phone: 'Nomor telepon Anda.',
  offline_access: 'Akses berkelanjutan — aplikasi tetap bisa bertindak saat Anda offline. Bisa dicabut kapan saja di bawah.'
};

interface Details {
  client?: { name?: string };
  redirect_uri?: string;
  scope?: string;
  redirect_url?: string;
}

interface Consent {
  clientId?: string;
  clientName?: string;
  scopes?: string;
  grantedAt?: string;
}

function say(raw: unknown): string {
  const message = String((raw as { message?: string })?.message || raw || '');
  if (/authorization not found|no longer pending|invalid/i.test(message)) return 'Permintaan izin ini sudah tidak berlaku. Mulai lagi dari aplikasi yang meminta.';
  if (/bad_jwt|authentication required|jwt/i.test(message)) return 'Sesi tidak berlaku. Masuk lagi lalu ulangi.';
  if (/Failed to fetch|NetworkError/i.test(message)) return 'Tidak bisa mencapai layanan auth. Periksa koneksi Anda.';
  return 'Terjadi kesalahan. Coba lagi atau tolak permintaan ini.';
}

export default function Consent() {
  const [status, setStatus] = useState('Memuat permintaan…');
  const [warn, setWarn] = useState(false);
  const [details, setDetails] = useState<Details | null>(null);
  const [account, setAccount] = useState('—');
  const [consents, setConsents] = useState<Consent[]>([]);
  const [busy, setBusy] = useState(false);
  const [authId, setAuthId] = useState<string | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('authorization_id');
    setAuthId(id);
    (async () => {
      const token = await ensureSession();
      if (token) {
        try {
          const response = await fetch(`${REST}/rpc/opera_my_consents`, { method: 'POST', headers: headersFor(token), body: '{}' });
          const data = await response.json();
          if (data?.ok && Array.isArray(data.consents)) setConsents(data.consents);
        } catch { /* the list is a comfort; absence is not an error */ }
      }
      if (!id) {
        setWarn(!token);
        setStatus(token ? 'Tidak ada permintaan izin di alamat ini.' : 'Tidak ada permintaan izin di alamat ini. Mulai dari aplikasi yang meminta akses.');
        return;
      }
      if (!token) {
        setWarn(true);
        setStatus('Masuk dulu untuk memberi izin ini.');
        return;
      }
      setStatus('Memeriksa permintaan…');
      try {
        const response = await fetch(`${AUTH_HOST}/oauth/authorizations/${encodeURIComponent(id)}`, { headers: headersFor(token) });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.msg || `http ${response.status}`);
        }
        const parsed: Details = await response.json();
        if (parsed.redirect_url) {
          window.location.assign(parsed.redirect_url);
          return;
        }
        setDetails(parsed);
        try {
          const response2 = await fetch(`${AUTH_HOST}/user`, { headers: headersFor(token) });
          if (response2.ok) {
            const u = await response2.json();
            if (u?.email) setAccount(u.email);
          }
        } catch { /* optional line */ }
        setStatus('Tinjau dan pilih izin.');
      } catch (error) {
        if (/jwt|bad_jwt|expired/i.test(String((error as Error)?.message))) clearSession();
        setWarn(true);
        setStatus(say(error));
      }
    })();
  }, []);

  async function decide(action: 'approve' | 'deny') {
    if (!authId) return;
    const token = await ensureSession();
    if (!token) {
      window.location.assign(`/index.html?next=${encodeURIComponent(`./oauth/consent.html?authorization_id=${authId}`)}`);
      return;
    }
    setBusy(true);
    setStatus(action === 'approve' ? 'Memberi izin…' : 'Menolak…');
    try {
      const response = await fetch(`${AUTH_HOST}/oauth/authorizations/${encodeURIComponent(authId)}/consent`, {
        method: 'POST',
        headers: headersFor(token),
        body: JSON.stringify({ action })
      });
      const data = await response.json();
      if (!response.ok || data?.error) throw new Error(data?.msg || data?.error_description || `http ${response.status}`);
      window.location.assign(data.redirect_url);
    } catch (error) {
      setBusy(false);
      setWarn(true);
      setStatus(say(error));
    }
  }

  async function revoke(consent: Consent) {
    const name = (consent.clientName || 'aplikasi ini').trim();
    if (!window.confirm(`Cabut izin ${name}? Aplikasi itu berhenti seketika.`)) return;
    const token = await ensureSession();
    if (!token) return;
    try {
      const response = await fetch(`${REST}/rpc/opera_revoke_consent`, { method: 'POST', headers: headersFor(token), body: JSON.stringify({ p_client_id: consent.clientId }) });
      const data = await response.json();
      if (!data?.ok) throw new Error(data?.error || `http ${response.status}`);
      setConsents((list) => list.filter((c) => c.clientId !== consent.clientId));
      setStatus(`Izin ${name} dicabut.`);
    } catch {
      setWarn(true);
      setStatus('Gagal mencabut. Coba lagi.');
    }
  }

  const scopes = (details?.scope || '').split(/\s+/).filter(Boolean);
  const redirectHost = (() => { try { return details?.redirect_uri ? new URL(details.redirect_uri).host : ''; } catch { return ''; } })();
  const clientName = details?.client?.name?.trim() || 'Nama aplikasi tidak diberikan';

  return (
    <>
      <SiteHeader current="/oauth/consent.html" />
      <main className="wrap" style={{ maxWidth: 760, padding: '36px 0 40px' }}>
        <h1 className="page-title" style={{ fontSize: 'clamp(30px,4.5vw,42px)' }}>Izin aplikasi</h1>
        <p className={warn ? 'status warn' : 'status'} role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 13.5 }}>{status}</p>

        {details ? (
          <section className="card" style={{ marginTop: 16 }} aria-labelledby="clientName">
            <h2 id="clientName" style={{ fontSize: 19 }}>{clientName}</h2>
            <p className="note" style={{ marginTop: 4 }}>Tinjau hal-hal ini sebelum memberi izin. Nama aplikasi diberikan oleh aplikasi itu sendiri; yang bisa diverifikasi adalah alamat kode dikirim ke.</p>
            <dl className="sheet" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', marginTop: 12 }}>
              {[
                ['Aplikasi', clientName],
                ['Kode dikirim ke', details.redirect_uri || '—'],
                ['Akun Anda', account]
              ].map(([k, v]) => (
                <div key={k as string} style={{ display: 'contents' }}>
                  <div style={{ padding: '8px 12px', color: 'var(--muted-2)', background: '#fff', borderBottom: '1px solid var(--card-2)', fontSize: 12 }}>{k}</div>
                  <div style={{ padding: '8px 12px', background: '#fff', borderBottom: '1px solid var(--card-2)', fontSize: 12, fontFamily: k === 'Kode dikirim ke' ? "'Lucida Console', Consolas, monospace" : 'inherit' }}>{v}</div>
                </div>
              ))}
              <div style={{ padding: '8px 12px', color: 'var(--muted-2)', background: '#fff', fontSize: 12, borderBottom: '1px solid var(--card-2)' }}>Yang diminta</div>
              <div style={{ padding: '8px 12px', background: '#fff', fontSize: 12 }}>
                <ul style={{ listStyle: 'none', display: 'grid', gap: 4 }}>
                  {scopes.length ? scopes.map((scope) => (
                    <li key={scope} style={scope === 'offline_access' ? { color: 'var(--danger)' } : undefined}>
                      <strong>{scope}</strong> — {SCOPE_TEXT[scope] || 'Izin tambahan yang diminta aplikasi.'}
                    </li>
                  )) : <li>Tidak ada izin tambahan yang diminta.</li>}
                </ul>
              </div>
            </dl>
            {redirectHost ? <p className="note" style={{ marginTop: 8 }}>Kode hanya dikirim ke {redirectHost}.</p> : null}
            <p className="note" style={{ marginTop: 6 }}>Corbin tetap memblokir password, kode sekali pakai, data pembayaran, tab pribadi, dan unggah file. Izin ini hanya mengizinkan aplikasi itu meminta tindakan lewat Corbin.</p>
            <div className="hero-cta" style={{ marginTop: 12 }}>
              <button className="btn btn-solid" type="button" disabled={busy} onClick={() => decide('approve')}>Izinkan</button>
              <button className="btn btn-ghost" type="button" disabled={busy} onClick={() => decide('deny')} style={{ color: 'var(--danger)' }}>Tolak</button>
            </div>
          </section>
        ) : null}

        {consents.length ? (
          <section className="panel" style={{ marginTop: 16 }} aria-labelledby="consentsTitle">
            <h2 id="consentsTitle" style={{ fontSize: 16 }}>Aplikasi yang sudah Anda izinkan</h2>
            <p style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 4 }}>Mencabut menghentikan aplikasi itu seketika: sesinya dihapus dan tokennya dimatikan.</p>
            <ul style={{ listStyle: 'none', display: 'grid', gap: 8, marginTop: 10 }}>
              {consents.map((consent) => (
                <li key={consent.clientId} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--card)', borderRadius: 8, padding: '9px 12px', fontSize: 12.5 }}>
                  <span style={{ fontWeight: 700 }}>{consent.clientName || 'Aplikasi tidak dikenal'}</span>
                  <span style={{ color: 'var(--muted)', fontSize: 11 }}>{consent.scopes || ''} · sejak {String(consent.grantedAt || '').slice(0, 10)}</span>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => revoke(consent)} style={{ marginLeft: 'auto', color: 'var(--danger)' }}>Cabut</button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!getStoredTokenSafe() && !details ? (
          <div className="card" style={{ marginTop: 16 }}>
            <h2 style={{ fontSize: 16 }}>Masuk dulu</h2>
            <p className="note" style={{ marginTop: 4 }}>Layar izin hanya bekerja untuk akun yang sudah masuk, karena persetujuan ini terikat pada akun Anda.</p>
            <div className="hero-cta" style={{ marginTop: 10 }}>
              <Link className="btn btn-solid" to={`/index.html${authId ? `?next=${encodeURIComponent(`./oauth/consent.html?authorization_id=${authId}`)}` : ''}`}>Masuk</Link>
            </div>
          </div>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}

// Render-time safe: returns '' outside the browser (prerender) and null when no token is stored.

function getStoredTokenSafe(): boolean {
  if (typeof window === 'undefined') return true;
  return Boolean(getStoredToken() || getRefreshToken());
}
