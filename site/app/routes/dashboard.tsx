// decisions.json -> D35, D36, D37 (no eyebrows, h1 first, commas not middle dots)

import { useEffect, useState } from 'react';
import { seoMeta } from '../lib/seo.js';
import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';
import { NavegoMark } from '../components/NavegoMark';
import { AUTH_HOST, clearSession, ensureSession, headersFor } from '../lib/auth';
import {
  type Device,
  type PlanAnswer,
  createPairingCode,
  fetchDevices,
  fetchListen,
  fetchPlan,
  konsolTable,
  konsolTables,
  priceList,
  revokeDevice,
  runOnDevice,
  say,
  walletBalance,
  walletHistory
} from '../lib/dashboardApi';

export function meta() {
  return seoMeta({
    title: "Dashboard - Navego",
    description: "Device ter-pairing, perintah, plan, tagihan, dan kendali atas semuanya - dalam satu konsol.",
    path: "/dashboard",
  });
}

type View = 'ringkasan' | 'device' | 'riwayat' | 'tabel' | 'dengar' | 'saldo' | 'pairing' | 'aksi' | 'akun';
const OPERATOR_VIEWS: View[] = ['tabel', 'dengar'];

const VIEW_TITLES: Record<View, string> = {
  ringkasan: 'Ringkasan', device: 'Device', riwayat: 'Riwayat', tabel: 'Tabel',
  dengar: 'Sesi dengar', saldo: 'Saldo', pairing: 'Pairing', aksi: 'Aksi', akun: 'Akun ini'
};

function relativeTime(iso?: string | null): string {
  if (!iso) return 'belum pernah';
  try {
    const format = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return 'belum pernah';
    const seconds = Math.round((then - Date.now()) / 1000);
    const steps: Array<[number, number, Intl.RelativeTimeFormatUnit]> = [
      [60, 1, 'second'], [3600, 60, 'minute'], [86400, 3600, 'hour'], [2592000, 86400, 'day'], [31536000, 604800, 'week']
    ];
    for (const [limit, divisor, unit] of steps) {
      if (Math.abs(seconds) < limit) return format.format(Math.round(seconds / divisor), unit);
    }
    return format.format(Math.round(seconds / 31536000), 'year');
  } catch {
    return 'tidak diketahui';
  }
}

function duration(from?: string, to?: string): string {
  if (!from || !to) return '–';
  const ms = new Date(to).getTime() - new Date(from).getTime();
  if (!Number.isFinite(ms) || ms < 0) return '–';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${Math.max(1, seconds)} dtk`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} mnt ${seconds % 60} dtk`;
  return `${Math.floor(minutes / 60)} jam ${minutes % 60} mnt`;
}

const isDeviceLive = (device: Device) => /online|active|live|awake/i.test(String(device.status || ''));
const deviceStatusText = (device: Device) => String(device.status || 'tidak diketahui');

// THE PAIR INTENT SURVIVES LOGIN because the popup one-click door deep-links with ?pair=1 - a freshly installed, not-logged-in browser hits the login gate first, and dropping the intent here would strand the pairing.
// Dropping the intent here would send pair=1 users to a logged-out dashboard and leave the pairing unfinished.

const wantPairIntent = (): boolean => {
  try {
    return new URLSearchParams(window.location.search).has('pair');
  } catch {
    return false;
  }
};

// One-click pair deep-link from the extension popup: ?pair=1 fires the same flow once.
// The identity cookie is seeded here for the same reason: the extension mirrors it into its own storage, and pairing adopts the legacy identity in place so a reinstall keeps its device.

export default function Dashboard() {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>('ringkasan');
  const [operatorOpen, setOperatorOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [statusLine, setStatusLine] = useState('');

  const [devices, setDevices] = useState<Device[] | null>(null);
  const [devicesFailed, setDevicesFailed] = useState(false);
  const [plan, setPlan] = useState<PlanAnswer | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'' | 'completed' | 'failed' | 'pending'>('');
  const [historyQuery, setHistoryQuery] = useState('');
  const [listens, setListens] = useState<Array<{ id?: string; deviceName?: string; status?: string; startedAt?: string; segments?: number }> | null>(null);

  const [pairName, setPairName] = useState('');
  const [pairStatus, setPairStatus] = useState('');
  const [pairOk, setPairOk] = useState(false);
  const [pairPending, setPairPending] = useState(false);
  const [installState, setInstallState] = useState<'unknown' | 'installed'>('unknown');
  const [runMethod, setRunMethod] = useState('tabs.list');
  const [runStatus, setRunStatus] = useState('');
  const [runPending, setRunPending] = useState(false);

  const [wallet, setWallet] = useState<{ balance?: number; available?: number; entries: Array<{ at?: string; kind?: string; amountCents?: number; note?: string | null }>; prices: Array<{ kind: string; amount_cents: number }> | null; status: string }>({ entries: [], prices: null, status: '' });

  const EXTENSION_ID = 'ofgemipoobcnbjkfanmofjbdonjapmgl';

  async function loadDevices() {
    const answer = await fetchDevices();
    if (!answer?.ok) {
      setDevices(null);
      setDevicesFailed(true);
      setStatusLine('Device belum bisa dimuat. Koneksi atau sesi mungkin kedaluwarsa — coba lagi sebentar.');
      return;
    }
    const list = answer.devices ?? [];
    setDevices(list);
    setDevicesFailed(false);
    setStatusLine(list.length ? '' : 'Belum ada device ter-pairing di akun ini.');
  }

  async function loadPlan() {
    const answer = await fetchPlan();
    if (!answer?.ok) {
      setPlan(null);
      setStatusLine('Plan belum bisa dimuat. Coba lagi sebentar.');
      return;
    }
    setPlan(answer);
  }

  async function loadListen() {
    const answer = await fetchListen();
    if (!answer?.ok) {
      setListens(null);
      return;
    }
    setListens(Array.isArray(answer.sessions) ? answer.sessions : []);
  }

  async function loadAll() {
    await Promise.all([loadDevices(), loadPlan(), loadListen()]);
  }

  useEffect(() => {
    void (async () => {
      const token = await ensureSession();
      if (!token) {
        const next = wantPairIntent() ? '/dashboard?pair=1#pairing' : '/dashboard';
        window.location.replace('/?next=' + encodeURIComponent(next));
        return;
      }
      try {
        const response = await fetch(`${AUTH_HOST}/user`, { headers: headersFor(token) });
        if (response.ok) {
          const user = await response.json();
          setUserEmail(user?.email || '');
        }
      } catch { /* the line is a comfort, not the decision */ }
      setReady(true);
      await loadAll();
    })();
    const interval = window.setInterval(() => { if (!document.hidden) void loadDevices(); }, 10000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const check = () => setInstallState(document.documentElement.dataset.navego !== undefined ? 'installed' : 'unknown');
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-navego'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    try {
      if (document.cookie.includes('oa_device_id=')) return;
      const value = globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : '';
      if (!value) return;
      document.cookie = `oa_device_id=${value}; Max-Age=31536000; Path=/; Secure; SameSite=Lax`;
    } catch {
      console.warn('[navego] the device cookie could not be written; pairing will use a random identity this time');
    }
  }, []);

  useEffect(() => {
    const wanted = (window.location.hash || '#ringkasan').slice(1) as View;
    if (VIEW_TITLES[wanted]) {
      setView(wanted);
      if (OPERATOR_VIEWS.includes(wanted)) setOperatorOpen(true);
    }
    const onHash = () => {
      const next = (window.location.hash || '#ringkasan').slice(1) as View;
      if (VIEW_TITLES[next]) {
        setView(next);
        if (OPERATOR_VIEWS.includes(next)) setOperatorOpen(true);
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has('pair')) return;
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`);
    void runPairQuick();
  }, [ready]);

  function go(next: View) {
    window.location.hash = next;
    setView(next);
    if (OPERATOR_VIEWS.includes(next)) setOperatorOpen(true);
  }

  async function runPairQuick() {
    if (pairPending) return;
    const name = (pairName.trim() || 'opera').slice(0, 64);
    setPairOk(false);
    setPairPending(true);
    setPairStatus('Memasangkan browser ini…');
    const created = await createPairingCode(name);
    if (!created?.ok || !created.code) {
      setPairPending(false);
      setPairStatus(`Gagal memasangkan: ${say(created?.error ?? 'server menolak')}`);
      return;
    }
    const delivered = await new Promise<{ ok: boolean; reason?: string; message?: string; deviceName?: string }>((resolve) => {
      try {
        const chrome = (globalThis as { chrome?: { runtime?: { sendMessage?: (id: string, message: unknown, cb: (reply?: unknown) => void) => void; lastError?: { message?: string } } } }).chrome;
        if (!chrome?.runtime?.sendMessage) return resolve({ ok: false, reason: 'no-runtime' });
        chrome.runtime.sendMessage(EXTENSION_ID, { action: 'pair', code: created.code }, (reply) => {
          const lastError = chrome.runtime?.lastError?.message;
          if (lastError) return resolve({ ok: false, reason: 'no-extension', message: lastError });
          const r = reply as { ok?: boolean; deviceName?: string } | undefined;
          resolve(r && typeof r === 'object' ? { ok: Boolean(r.ok), deviceName: r.deviceName } : { ok: false, reason: 'unreadable-reply' });
        });
      } catch (error) {
        resolve({ ok: false, reason: 'send-threw', message: String(error) });
      }
    });
    setPairPending(false);
    if (delivered.ok) {
      setPairStatus(`Browser ini ter-pairing: ${delivered.deviceName || created.deviceName || name}.`);
      setPairOk(true);
      void loadDevices();
      return;
    }
    if (delivered.reason === 'no-extension' || delivered.reason === 'no-runtime') {
      setPairStatus('Ekstensi belum terpasang atau nonaktif di browser ini. Pasang dari Unduh, lalu klik lagi.');
      return;
    }
    setPairStatus(`Gagal memasangkan: ${delivered.message || delivered.reason || 'tidak diketahui'}`);
  }

  async function runAction() {
    const method = runMethod.trim();
    if (!method) return;
    setRunPending(true);
    setRunStatus('Mengirim…');
    const result = await runOnDevice(method);
    setRunPending(false);
    if (!result) {
      setRunStatus('Gagal (jaringan).');
      return;
    }
    const error = result.error as { code?: string; message?: string } | undefined;
    if (!result.ok) {
      if (error?.code === 'AWAIT_TIMEOUT' || (result as { status?: string }).status === 'queued') {
        setRunStatus(`${method} masuk antrean; device mengambilnya dalam hitungan detik. Riwayat di Device akan memperbarui sendiri.`);
        window.setTimeout(() => void loadDevices(), 4000);
        return;
      }
      setRunStatus(`Gagal: ${say(error?.message || error)}.`);
      return;
    }
    setRunStatus(`${method} — ${String((result as { status?: string }).status || 'ok')}.`);
    window.setTimeout(() => void loadDevices(), 2000);
  }

  async function loadWallet() {
    setWallet((w) => ({ ...w, status: 'Memuat saldo…' }));
    const [balance, history, prices] = await Promise.all([walletBalance(), walletHistory(), priceList()]);
    if (!balance?.ok || !history?.ok) {
      setWallet((w) => ({ ...w, status: 'Tidak bisa memuat saldo sekarang. Coba muat ulang.' }));
      return;
    }
    const entries = Array.isArray(history.entries) ? history.entries : [];
    setWallet({
      balance: balance.balanceCents,
      available: balance.availableCents,
      entries,
      prices,
      status: 'Saldo dibaca dari server. Paket utama dibeli di Harga.'
    });
  }

  useEffect(() => {
    if (ready && view === 'saldo' && wallet.entries.length === 0 && !wallet.status) {
      void loadWallet();
    }
  }, [ready, view]);

  const allCommands = (devices ?? []).flatMap((device) => (device.commands || []).map((command) => ({ device: device.name || '?', ...command })));
  allCommands.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  const historyRows = allCommands.filter((row) => {
    if (historyFilter && row.status !== historyFilter) return false;
    if (!historyQuery) return true;
    return `${row.method} ${row.device} ${row.status}`.toLowerCase().includes(historyQuery.toLowerCase());
  });

  const total = devices?.length ?? 0;
  const online = (devices ?? []).filter(isDeviceLive).length;
  const doneSum = (devices ?? []).reduce((n, d) => n + (d.completedCommands ?? 0), 0);
  const totalSum = (devices ?? []).reduce((n, d) => n + (d.totalCommands ?? 0), 0);

  const planQuota = plan?.dailyQuota ?? null;
  const planUsed = plan?.usedToday ?? 0;
  const planUnlimited = planQuota === null;
  const planPercent = planQuota ? Math.max(0, Math.min(100, Math.round((planUsed / planQuota) * 100))) : 0;
  const planRemaining = planUnlimited ? Number.POSITIVE_INFINITY : Math.max(0, (planQuota ?? 0) - planUsed);
  const planAllowance = plan?.sessionAllowance ?? (plan?.plan === 'plan.usd-17' ? 500 : 50);

  const renderNavItem = (id: View, label: string) => (
    <a key={id} href={`#${id}`} className={view === id ? 'is-active' : ''} aria-current={view === id ? 'page' : undefined} onClick={(event) => { event.preventDefault(); go(id); }}>
      {label}
    </a>
  );

  return (
    <>
      <SiteHeader current="/dashboard" />
      <main className="wrap">
        {!ready ? (
          <p className="empty" style={{ paddingTop: 'var(--s-9)' }}>Memeriksa sesi…</p>
        ) : (
          <div className="app">
            <nav className="rail" aria-label="Navigasi konsol">
              <div className="rail__brand">
                <NavegoMark size={24} title="Navego" />
                <span className="rail__brand-text">Konsol</span>
              </div>
              <p className="rail__group">Operasional</p>
              {renderNavItem('ringkasan', 'Ringkasan')}
              {renderNavItem('device', `Device (${total})`)}
              {renderNavItem('riwayat', 'Riwayat')}
              {renderNavItem('pairing', 'Pairing')}
              {renderNavItem('aksi', 'Aksi')}
              <p className="rail__group">Keuangan</p>
              {renderNavItem('saldo', 'Saldo')}
              <button className="rail-item" aria-expanded={operatorOpen} aria-controls="operatorGroup" onClick={() => setOperatorOpen(!operatorOpen)}>Operator ▸</button>
              {operatorOpen ? (
                <div id="operatorGroup">
                  {renderNavItem('tabel', 'Tabel')}
                  {renderNavItem('dengar', 'Sesi dengar')}
                </div>
              ) : null}
              <p className="rail__group">Akun</p>
              {renderNavItem('akun', 'Akun ini')}
              <p className="who">Perangkat milik {userEmail || '…'}</p>
            </nav>

            <div className="app-main">
              {view === 'ringkasan' ? (
                <>
                  <h1>Ringkasan</h1>
                  <div className="dash-tiles">
                    <div className="tile-metric"><small>Device ter-pairing</small><b>{total}</b></div>
                    <div className="tile-metric"><small>Daring sekarang</small><b>{online}</b></div>
                    <div className="tile-metric"><small>Perintah selesai</small><b>{doneSum}<span style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)' }}> / {totalSum}</span></b></div>
                    <div className="tile-metric">
                      <small>Kuota hari ini</small><b>{planUnlimited ? '∞' : `${planPercent}%`}</b>
                      {!planUnlimited ? <div className="usage-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={planPercent} aria-label="Pemakaian kuota hari ini"><i style={{ width: `${planPercent}%` }} /></div> : null}
                    </div>
                  </div>

                  <div className="panel" style={{ background: !planUnlimited && planRemaining <= 0 ? '#f6dcd6' : planPercent >= 80 ? '#fbeab6' : 'var(--panel-2)' }}>
                    <div className="panel-head">
                      <h2 style={{ fontSize: 'var(--text-base)' }}>Plan</h2>
                      <span className={`chip ${plan?.status === 'active' ? 'good' : 'warn'}`}>{plan?.status === 'active' ? 'aktif' : plan ? plan.status || 'tidak diketahui' : 'belum bisa dimuat'}</span>
                    </div>
                    <p style={{ fontFamily: 'ui-monospace, Consolas, monospace', fontWeight: 800 }}>{plan?.plan || 'belum diketahui'}</p>
                    {!planUnlimited ? <div className="plan-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={planPercent} aria-label="Pemakaian kuota hari ini">
                      <div className="plan-fill" style={{ width: `${planPercent}%` }} />
                    </div> : null}
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-2)' }}>
                      {planUnlimited
                        ? <><strong>Tanpa batas harian</strong> pada plan ini, {planAllowance.toLocaleString('id-ID')} perintah / sesi.</>
                        : <><strong>{planUsed.toLocaleString('id-ID')}</strong> dari <strong>{(planQuota ?? 0).toLocaleString('id-ID')}</strong> perintah dipakai hari ini, {planAllowance.toLocaleString('id-ID')} / sesi, reset besok 00.00 UTC</>}
                    </p>
                    {!planUnlimited && planRemaining <= 0 ? <p style={{ marginTop: 'var(--s-2)', fontSize: 'var(--text-xs)', color: 'var(--danger)' }}>Plan habis — reset besok 00.00 UTC. <Link to="/harga">Lihat paket</Link></p> : null}
                  </div>

                  <div className="panel">
                    <div className="panel-head"><h2 style={{ fontSize: 'var(--text-base)' }}>Checklist pemasangan</h2></div>
                    <ol className="setup-checklist">
                      <li className={installState === 'installed' ? 'is-done' : ''}><span className="setup-checklist__mark" aria-hidden="true">{installState === 'installed' ? '✓' : '○'}</span> Pasang extension di browser ini</li>
                      <li className={total > 0 ? 'is-done' : ''}><span className="setup-checklist__mark" aria-hidden="true">{total > 0 ? '✓' : '○'}</span> Pair device</li>
                      <li className={doneSum > 0 ? 'is-done' : ''}><span className="setup-checklist__mark" aria-hidden="true">{doneSum > 0 ? '✓' : '○'}</span> Jalankan perintah pertama</li>
                    </ol>
                    <div className="hero-cta">
                      {installState !== 'installed' ? <Link className="btn btn-solid btn-sm" to="/unduh">Pasang extension</Link> : null}
                      {total === 0 ? <Link className="btn btn-solid btn-sm" to="/dashboard#pairing">Pasangkan browser ini</Link> : null}
                      {doneSum === 0 ? <Link className="btn btn-ghost btn-sm" to="/docs">Baca cara menjalankan perintah</Link> : null}
                    </div>
                  </div>
                  {statusLine ? <p className="status warn" role="status" aria-live="polite">{statusLine}</p> : null}
                </>
              ) : null}

              {view === 'device' ? (
                <>
                  <h1>Device</h1>
                  {statusLine ? <p className="status warn" role="status" aria-live="polite">{statusLine}</p> : null}
                  {devices === null ? (devicesFailed
                    ? <div className="empty">
                      <p><strong>Device belum bisa dimuat.</strong></p>
                      <p>Koneksi atau sesi mungkin kedaluwarsa. Muat ulang halaman ini untuk mencoba lagi.</p>
                      <button className="btn btn-solid btn-sm" type="button" onClick={() => void loadDevices()} style={{ marginTop: 'var(--s-2)' }}>Coba lagi</button>
                    </div>
                    : <p className="empty">Memuat…</p>) : null}
                  {devices && devices.length === 0 ? (
                    <div className="empty">
                      <p><strong>Belum ada device.</strong></p>
                      <p>Pasang Navego di browser ini, lalu klik “Pasangkan browser ini”.</p>
                      <button className="btn btn-solid btn-sm" type="button" onClick={() => go('pairing')} style={{ marginTop: 'var(--s-2)' }}>Pasangkan browser ini</button>
                    </div>
                  ) : null}
                  <div style={{ display: 'grid', gap: 'var(--s-3)' }}>
                    {(devices ?? []).map((device) => (
                      <div key={device.id} className="panel">
                        <div className="panel-head">
                          <h2 style={{ fontSize: 'var(--text-base)', display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
                            <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: '50%', background: isDeviceLive(device) ? 'var(--good)' : 'var(--danger)', display: 'inline-block' }} />
                            {device.name || 'device'}
                            <span className="chip">{device.extensionVersion || '-'}</span>
                            {device.browserName ? <span className="chip">{device.browserName}</span> : null}
                          </h2>
                        </div>
                        <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--s-1) var(--s-4)', fontSize: 'var(--text-sm)' }}>
                          <dt style={{ color: 'var(--muted)' }}>Status</dt><dd>{deviceStatusText(device)}</dd>
                          <dt style={{ color: 'var(--muted)' }}>Terakhir terlihat</dt><dd>{relativeTime(device.lastSeenAt)}</dd>
                          <dt style={{ color: 'var(--muted)' }}>Perintah</dt><dd>{device.completedCommands ?? 0} / {device.totalCommands ?? 0}</dd>
                          <dt style={{ color: 'var(--muted)' }}>ID device</dt><dd><code>{device.id}</code></dd>
                        </dl>
                        {device.commands?.length ? (
                          <ul style={{ listStyle: 'none', display: 'grid', gap: 'var(--s-1)', marginTop: 'var(--s-2)', fontSize: 'var(--text-xs)' }}>
                            {device.commands.map((command, index) => (
                              <li key={index} style={{ display: 'flex', gap: 'var(--s-2)' }}><code>{command.method}</code>{command.provider ? <span className="chip">{command.provider}</span> : null}<span>{command.status}</span></li>
                            ))}
                          </ul>
                        ) : null}
                        <div className="hero-cta" style={{ marginTop: 'var(--s-2)' }}>
                          <button className="btn btn-ghost btn-sm" type="button" onClick={() => navigator.clipboard?.writeText(device.id || '')}>Salin ID</button>
                          <button className="btn btn-ghost btn-sm" type="button" style={{ color: 'var(--danger)' }} onClick={async () => {
                            if (!window.confirm(`Cabut ${device.name}? Perintah baru berhenti seketika; pairing ulang menghidupkannya lagi.`)) return;
                            const result = await revokeDevice(String(device.id));
                            if (result?.ok) { setStatusLine(`${device.name} dicabut.`); void loadDevices(); }
                            else setStatusLine(`Gagal mencabut: ${say(result?.error ?? 'server menolak')}.`);
                          }}>Cabut device ini</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              {view === 'riwayat' ? (
                <>
                  <h1>Riwayat</h1>
                  <div className="toolbar">
                    <input className="input-sm" type="search" placeholder="Cari metode atau device…" value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} aria-label="Cari di riwayat" />
                    <select className="input-sm" value={historyFilter} onChange={(event) => setHistoryFilter(event.target.value as typeof historyFilter)} aria-label="Filter status">
                      <option value="">Semua status</option>
                      <option value="completed">Selesai</option>
                      <option value="failed">Gagal</option>
                      <option value="pending">Mengantre</option>
                    </select>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{historyRows.length}/{allCommands.length} perintah</span>
                  </div>
                  <table className="table">
                    <thead><tr><th>Waktu</th><th>Device</th><th>Metode</th><th>Durasi</th><th>Status</th></tr></thead>
                    <tbody>
                      {historyRows.map((row, index) => (
                        <tr key={index}>
                          <td>{row.createdAt ? new Date(row.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '–'}</td>
                          <td>{row.device}</td>
                          <td><code>{row.method}</code></td>
                          <td>{duration(row.createdAt, row.completedAt)}</td>
                          <td>{row.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {historyRows.length === 0 ? <p className="empty">Tidak ada perintah yang cocok.</p> : null}
                </>
              ) : null}

              {view === 'dengar' ? (
                <>
                  <h1>Sesi dengar</h1>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-2)', marginBottom: 'var(--s-2)' }}>Sesi dengar di akun ini: metadata saja, tidak pernah kata-katanya. Transkrip hanya hidup di hasil tool model.</p>
                  {listens === null ? <p className="empty">Sesi dengar belum bisa dimuat. Coba lagi sebentar.</p> : listens.length === 0 ? <p className="empty">Belum ada sesi dengar. Mulai dari model dengan <code>media_stream_start</code>.</p> : (
                    <div style={{ display: 'grid', gap: 'var(--s-2)' }}>
                      {listens.map((session) => (
                        <div key={session.id} className="panel">
                          <div className="panel-head"><strong style={{ fontSize: 'var(--text-sm)' }}>{session.deviceName || session.id}</strong><span className="chip">{session.status}</span></div>
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-2)' }}>Mulai {relativeTime(session.startedAt)}, {session.segments ?? 0} segmen tertranskrip</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : null}

              {view === 'saldo' ? (
                <>
                  <h1>Saldo</h1>
                  <div className="panel">
                    <dl className="metrics">
                      <div><dt>Saldo</dt><dd>{wallet.balance !== undefined ? `Rp${(wallet.balance / 100).toLocaleString('id-ID')}` : '–'}</dd></div>
                      <div><dt>Tersedia sekarang</dt><dd>{wallet.available !== undefined ? `Rp${(wallet.available / 100).toLocaleString('id-ID')}` : '–'}</dd></div>
                    </dl>
                    <div className="hero-cta" style={{ marginTop: 'var(--s-1)' }}>
                      <button className="btn btn-ghost" type="button" onClick={loadWallet}>Muat ulang</button>
                    </div>
                    <p className="status" role="status" aria-live="polite" style={{ marginTop: 'var(--s-2)' }}>{wallet.status}</p>
                  </div>

                  {wallet.prices ? (
                    <div className="panel">
                      <h2 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--s-2)' }}>Harga</h2>
                      <table className="table">
                        <tbody>
                          {wallet.prices.map((price) => (
                            <tr key={price.kind}><td>{priceLabel(price.kind)}</td><td className="num">Rp{(price.amount_cents / 100).toLocaleString('id-ID')}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}

                  <div className="panel">
                    <h2 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--s-2)' }}>Pergerakan</h2>
                    {wallet.entries.length ? (
                      <table className="table">
                        <thead><tr><th>Waktu</th><th>Jenis</th><th className="num">Jumlah</th><th>Catatan</th></tr></thead>
                        <tbody>
                          {wallet.entries.map((entry, index) => (
                            <tr key={index}>
                              <td>{relativeTime(entry.at)}</td>
                              <td>{walletKindLabel(entry.kind)}</td>
                              <td className="num">Rp{((entry.amountCents ?? 0) / 100).toLocaleString('id-ID')}</td>
                              <td>{entry.note || '–'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : <p className="empty">Belum ada pergerakan saldo. Paket utama dibeli di <Link to="/harga">Harga</Link> via PayPal; saldo hanya dipakai untuk pekerjaan per tugas.</p>}
                  </div>
                </>
              ) : null}

              {view === 'pairing' ? (
                <>
                  <h1>Pairing</h1>
                  <div className="panel" style={{ maxWidth: 520 }}>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-2)' }}>Satu klik saja — kode dibuat di server dan dikirim langsung ke ekstensi di browser ini. Tidak ada yang perlu diketik atau disalin.</p>
                    <div className="field" style={{ marginTop: 'var(--s-3)' }}>
                      <label htmlFor="pairName">Nama device</label>
                      <input id="pairName" type="text" autoComplete="off" spellCheck={false} maxLength={64} placeholder="opera" value={pairName} onChange={(event) => setPairName(event.target.value)} />
                    </div>
                    <button className="btn btn-solid" type="button" disabled={pairPending} aria-busy={pairPending} onClick={runPairQuick}>{pairOk ? 'siap Ter-pairing' : pairPending ? 'Memasangkan…' : 'Pasangkan browser ini'}</button>
                    <p className="status" role="status" aria-live="polite" style={{ marginTop: 'var(--s-2)' }}>{pairStatus}</p>
                  </div>
                </>
              ) : null}

              {view === 'aksi' ? (
                <>
                  <h1>Jalankan aksi</h1>
                  <div className="panel" style={{ maxWidth: 520 }}>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-2)' }}>Perintah dikirim ke device milik Anda sendiri. Device menolak halaman yang menampilkan password, kode sekali pakai, atau pembayaran.</p>
                    <div className="field" style={{ marginTop: 'var(--s-3)' }}>
                      <label htmlFor="runMethod">Primitive</label>
                      <input id="runMethod" type="text" autoComplete="off" spellCheck={false} maxLength={64} value={runMethod} onChange={(event) => setRunMethod(event.target.value)} />
                    </div>
                    <button className="btn btn-solid" type="button" disabled={runPending} onClick={runAction}>Jalankan</button>
                    <p className="status" role="status" aria-live="polite" style={{ marginTop: 'var(--s-2)' }}>{runStatus}</p>
                  </div>
                </>
              ) : null}

              {view === 'akun' ? (
                <>
                  <h1>Akun ini</h1>
                  <div className="panel" style={{ maxWidth: 560 }}>
                    <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--s-1) var(--s-4)', fontSize: 'var(--text-sm)' }}>
                      <dt style={{ color: 'var(--muted)' }}>Alamat</dt><dd>{userEmail || '—'}</dd>
                      <dt style={{ color: 'var(--muted)' }}>Device daring</dt><dd>{online} dari {total}</dd>
                    </dl>
                    <div className="hero-cta" style={{ marginTop: 'var(--s-3)' }}>
                      <Link className="btn btn-ghost" to="/akun">Kelola akun</Link>
                      <Link className="btn btn-ghost" to="/unduh">Pasang di device lain</Link>
                      <button className="btn btn-ghost" type="button" style={{ color: 'var(--danger)' }} onClick={async () => { const token = await ensureSession(); try { if (token) await fetch(`${AUTH_HOST}/logout`, { method: 'POST', headers: headersFor(token) }); } catch { /* best effort */ } clearSession(); window.location.replace('/'); }}>Keluar</button>
                    </div>
                  </div>
                </>
              ) : null}

              {view === 'tabel' ? <KonsolView deviceCount={total} /> : null}
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function priceLabel(kind: string): string {
  return ({
    'wallet.deposit': 'Isi ulang saldo',
    'task.simple': 'Pekerjaan sederhana — saat selesai',
    'task.report': 'Laporan — saat selesai',
    'task.batch_item': 'Per item batch — saat selesai'
  } as Record<string, string>)[kind] || kind;
}

function walletKindLabel(kind?: string): string {
  const base = String(kind || '');
  if (base.startsWith('reservation.')) return `Tugas ${base.slice('reservation.'.length)}`;
  return ({ deposit: 'Isi ulang', settle: 'Pekerjaan selesai', refund: 'Pengembalian', adjust: 'Penyesuaian' } as Record<string, string>)[base] || base;
}

function KonsolView({ deviceCount }: { deviceCount: number }) {
  const [state, setState] = useState<{ ready: boolean; tables: Array<{ name: string; scope?: string; readable?: boolean; total?: number | null }>; selected: string | null; columns: Array<{ name: string; type: string }>; rows: Array<Record<string, unknown>>; total: number; offset: number; search: string; status: string }>({
    ready: false, tables: [], selected: null, columns: [], rows: [], total: 0, offset: 0, search: '', status: 'Memuat…'
  });
  const pageSize = 50;

  useEffect(() => {
    void (async () => {
      const tables = await konsolTables();
      if (!tables?.ok || !Array.isArray(tables.tables)) {
        setState((s) => ({ ...s, ready: true, status: 'Konsol data belum bisa dimuat. Muat ulang halaman sebentar lagi.' }));
        return;
      }
      setState((s) => ({ ...s, ready: true, tables: tables.tables ?? [], status: '' }));
    })();
  }, []);

  async function openTable(name: string, offset = 0, search = '') {
    setState((s) => ({ ...s, selected: name, status: 'Memuat…', offset }));
    const answer = await konsolTable({ p_table: name, p_limit: pageSize, p_offset: offset, p_search: search || null, p_sort: null, p_dir: null });
    if (!answer?.ok) {
      setState((s) => ({ ...s, columns: [], rows: [], total: 0, status: say(answer?.error ?? 'Konsol tidak bisa membaca tabel itu.') }));
      return;
    }
    setState((s) => ({ ...s, columns: answer.columns ?? [], rows: answer.rows ?? [], total: answer.total ?? 0, offset, search, status: '' }));
  }

  async function exportCsv() {
    const selected = state.selected;
    if (!selected) return;
    setState((s) => ({ ...s, status: 'Menyiapkan CSV…' }));
    const csvCell = (value: unknown) => {
      const text = value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
      const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text;
      return `"${guarded.replace(/"/g, '""')}"`;
    };
    const lines = [state.columns.map((col) => csvCell(col.name)).join(',')];
    let offset = 0;
    let fetched = 0;
    let total = state.total;
    const cap = 5000;
    while (offset < total && fetched < cap) {
      const page = await konsolTable({ p_table: selected, p_limit: 200, p_offset: offset, p_search: state.search || null, p_sort: null, p_dir: null });
      if (!page?.ok) {
        setState((s) => ({ ...s, status: `Ekspor gagal: ${say(page?.error ?? 'gagal membaca tabel')}.` }));
        return;
      }
      total = page.total ?? 0;
      const rowsOnPage = page.rows ?? [];
      if (!rowsOnPage.length) break;
      for (const record of rowsOnPage) {
        if (fetched >= cap) break;
        lines.push(state.columns.map((col) => csvCell(record[col.name])).join(','));
        fetched += 1;
      }
      offset += rowsOnPage.length;
    }
    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `${selected}.csv`;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
    setState((s) => ({ ...s, status: `${fetched} baris diunduh sebagai ${selected}.csv.` }));
  }

  const pages = Math.max(1, Math.ceil(state.total / pageSize));
  const currentPage = Math.floor(state.offset / pageSize) + 1;
  const selectedTable = state.selected ?? '';

  return (
    <>
      <h1>Tabel</h1>
      <div className="konsol-split">
        <nav className="panel" style={{ minWidth: 190, display: 'grid', gap: 'var(--s-1)', alignContent: 'start' }} aria-label="Daftar tabel">
          {!state.ready ? <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>Memuat…</span> : state.tables.length === 0 ? <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>Konsol data belum bisa dimuat.</span> : state.tables.filter((table) => table.readable !== false).map((table) => (
            <button key={table.name} className="rail-item" style={{ color: 'var(--ink)', background: state.selected === table.name ? 'var(--panel-2)' : 'transparent', borderRadius: 'var(--radius-sm)', border: 0, padding: 'var(--s-2) var(--s-3)', textAlign: 'left', cursor: 'pointer', fontSize: 'var(--text-sm)' }} onClick={() => openTable(table.name)}>
              {table.name}{typeof table.total === 'number' ? <span style={{ color: 'var(--muted)' }}> ({table.total.toLocaleString('id-ID')})</span> : null}
            </button>
          ))}
        </nav>
        <div style={{ flex: 1 }}>
          {state.selected ? (
            <>
              <div className="toolbar">
                <input className="input-sm" type="search" placeholder="Cari di tabel ini…" value={state.search} onChange={(event) => openTable(selectedTable, 0, event.target.value)} aria-label="Cari baris" />
                <button className="btn btn-ghost btn-sm" type="button" onClick={exportCsv} title="Unduh hingga 5.000 baris sesuai filter saat ini">Ekspor CSV</button>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{state.total.toLocaleString('id-ID')} baris</span>
              </div>
              <table className="table" style={{ fontSize: 'var(--text-xs)' }}>
                <thead><tr>{state.columns.length === 0 ? <th scope="col">Memuat…</th> : state.columns.map((col) => <th key={col.name} scope="col">{col.name}</th>)}</tr></thead>
                <tbody>
                  {state.rows.map((row, index) => (
                    <tr key={index}>{state.columns.map((col) => {
                      const raw = row[col.name];
                      const text = raw === null || raw === undefined ? '–' : typeof raw === 'object' ? JSON.stringify(raw) : String(raw);
                      return <td key={col.name} title={text}>{text.length > 90 ? `${text.slice(0, 87)}…` : text}</td>;
                    })}</tr>
                  ))}
                </tbody>
              </table>
              {state.rows.length === 0 ? <p className="empty">Tabel ini kosong. Tidak ada baris yang cocok dengan akun dan filter ini.</p> : null}
              <div className="toolbar" style={{ marginTop: 'var(--s-2)' }}>
                <button className="btn btn-ghost btn-sm" type="button" disabled={currentPage <= 1} onClick={() => openTable(selectedTable, Math.max(0, state.offset - pageSize), state.search)}>‹ Sebelumnya</button>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>Halaman {currentPage} dari {pages}</span>
                <button className="btn btn-ghost btn-sm" type="button" disabled={currentPage >= pages} onClick={() => openTable(selectedTable, state.offset + pageSize, state.search)}>Berikutnya ›</button>
              </div>
            </>
          ) : <p className="empty">Pilih tabel di kiri. {deviceCount === 0 ? 'Konsol hanya terisi setelah device Anda ter-pairing.' : ''}</p>}
          {state.status ? <p className="status" role="status" aria-live="polite" style={{ marginTop: 'var(--s-2)' }}>{state.status}</p> : null}
        </div>
      </div>
    </>
  );
}
