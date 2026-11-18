import { useState } from 'react';
import { seoMeta } from '../lib/seo.js';
import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return seoMeta({
    title: 'Pasang MCP — Navego',
    description: 'Driver lokal Navego berjalan di mesin Anda sendiri — stdio, tanpa login, tanpa biaya per panggilan. Server hosted sudah tidak disediakan lagi.',
    path: '/mcp'
  });
}

const BLOCKS = [
  { id: 'install', title: 'Pasang paketnya', body: 'npm install -g navego', note: 'Satu perintah. Paket ini memakai browser yang sudah Anda gunakan; tidak ada proses tambahan yang perlu dijaga.' },
  { id: 'doctor', title: 'Periksa yang terhubung', body: 'navego doctor', note: 'Cetakan menyatakan nama device, paket plan, dan sisa kuota hari ini. Kalau tidak ada yang terhubung, paket mencetak langkah perbaikan yang paling mungkin.' },
  { id: 'pair', title: 'Pair sekali per peramban', body: 'navego local', note: 'Peramban baru memasang ekstensi dulu (lihat Unduh), lalu Dashboard → Pasangkan browser ini. Setelah itu driver lokal mengambil alih otomatis.' }
];

const HARNESS: Array<{ id: string; title: string; body: string }> = [
  { id: 'cfg-opencode', title: 'OpenCode — opencode.json atau ~/.config/opencode/opencode.json', body: '{\n  "mcp": {\n    "navego": {\n      "type": "local",\n      "command": "navego",\n      "args": ["local"]\n    }\n  }\n}' },
  { id: 'cfg-kilo', title: 'Kilo Code — MCP settings (JSON)', body: '{\n  "mcpServers": {\n    "navego": {\n      "command": "navego",\n      "args": ["local"]\n    }\n  }\n}' },
  { id: 'cfg-claude', title: 'Claude Desktop — konfigurasi MCP lokal', body: 'command: npx\nargs: ["-y", "navego", "local"]' }
];

export default function Mcp() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      setCopied(null);
    }
  };

  const copyBlock = (text: string, id: string) => (
    <button onClick={() => copy(text, id)} className="btn btn-solid btn-sm" type="button" style={{ position: 'absolute', top: 'var(--s-2)', right: 'var(--s-2)' }}>
      {copied === id ? 'Tersalin' : 'Salin'}
    </button>
  );

  return (
    <>
      <SiteHeader current="/mcp" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <p className="crumb">Pasang MCP</p>
            <h1>Driver lokal, di mesin Anda.</h1>
            <p className="lede">Stdio, tanpa login, tanpa biaya per panggilan. Yang dibutuhkan hanya browser yang masuk akun dan ekstensi terpasang.</p>
          </div>
        </section>

        <section className="band" aria-labelledby="stepsTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Langkah</p>
                <h2 id="stepsTitle" className="section-title">Tiga perintah.</h2>
              </div>
              <p className="section-note">Salin, jalankan, selesai. Tidak ada server yang perlu dijaga.</p>
            </div>
            <div style={{ display: 'grid', gap: 'var(--s-6)' }}>
              {BLOCKS.map(({ id, title, body, note }, index) => (
                <section key={id} className="value-card" style={{ display: 'grid', gap: 'var(--s-3)' }}>
                  <span className="start-num">{index + 1}</span>
                  <b>{title}</b>
                  <div style={{ position: 'relative', background: 'var(--navy-deep)', borderRadius: 'var(--radius-sm)', padding: 'var(--s-3) var(--s-4)', maxWidth: '40rem' }}>
                    <code style={{ background: 'transparent', border: 0, padding: 0, color: '#cfe0ff' }}>{body}</code>
                    {copyBlock(body, id)}
                  </div>
                  <p>{note}</p>
                </section>
              ))}
            </div>
          </div>
        </section>

        <section className="band band-soft" aria-labelledby="harnessTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Harness</p>
                <h2 id="harnessTitle" className="section-title">Daftarkan ke AI Anda.</h2>
              </div>
              <p className="section-note">Server lokal menambah 45 tool MCP di atas 36 primitive browser.</p>
            </div>
            <div className="value-grid" style={{ gridTemplateColumns: '1fr' }}>
              {HARNESS.map(({ id, title, body }) => (
                <section key={id} className="value-card">
                  <b>{title}</b>
                  <div style={{ position: 'relative', background: 'var(--navy-deep)', borderRadius: 'var(--radius-sm)', padding: 'var(--s-3) var(--s-4)', maxWidth: '40rem', marginTop: 'var(--s-2)' }}>
                    <pre style={{ color: '#cfe0ff', fontSize: 'var(--text-sm)', overflowX: 'auto', fontFamily: 'var(--font-mono)' }}><code>{body}</code></pre>
                    {copyBlock(body, id)}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>

        <section className="band band-dark" aria-labelledby="limitsTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker" style={{ color: 'var(--amber-hi)' }}>Batas</p>
                <h2 id="limitsTitle" className="section-title">Yang dijaga, apa adanya.</h2>
              </div>
            </div>
            <ul style={{ paddingLeft: '1.2rem', display: 'grid', gap: 'var(--s-2)', maxWidth: '70ch' }}>
              <li>Password, kode sekali pakai, PIN, kartu, dan CVV selalu ditolak. Pekerjaan yang berhenti di situ gagal — bukan diam-diam diteruskan.</li>
              <li>Tab pribadi, tab non-http(s), dan jendela tanpa akses debugger: primitive menolak, dan penolakan disebut namanya.</li>
              <li>Enam izin hanya dipakai untuk enam alasan: <code>tabs</code>, <code>scripting</code>, <code>storage</code>, <code>alarms</code>, <code>debugger</code>, <code>downloads</code>.</li>
            </ul>
            <p style={{ marginTop: 'var(--s-4)', fontSize: 'var(--text-sm)' }}>Butuh detail teknis? <a href="https://github.com/afnannuzulasugihartono/navego/blob/main/docs/agent-call.md">docs/agent-call.md</a> menyebut semua jalur secara persis.</p>
          </div>
        </section>

        <section className="band">
          <div className="wrap">
            <div className="cta-band">
              <h2 className="section-title" style={{ color: '#ffffff' }}>Satu perintah untuk mulai.</h2>
              <p>Pasang paketnya, jalankan <code>navego doctor</code>, lihat device Anda di Dashboard.</p>
              <div className="hero-cta" style={{ marginTop: 'var(--s-2)' }}>
                <Link className="btn btn-solid" to="/docs">Baca docs lengkap</Link>
                <Link className="btn btn-ghost" to="/unduh">Pasang extension</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}