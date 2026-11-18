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
  { id: 'doctor', title: 'Periksa yang terhubung', body: 'navego doctor', note: 'Cetakan menyatakan nama device, paket plan, dan sisa quota hari ini. Kalau tidak ada yang terhubung, paket akan mencetak langkah perbaikan yang paling mungkin.' }
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
      <SiteHeader current="/mcp.html" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <p className="crumb">Pasang MCP</p>
            <h1>Driver lokal,<br />di mesin Anda.</h1>
            <p className="lede">Stdio, tanpa login, tanpa biaya per panggilan. Server hosted sudah tidak disediakan lagi; yang dibutuhkan adalah browser yang masuk akun dan ekstensi terpasang.</p>
          </div>
        </section>

        <div className="wrap" style={{ paddingBlock: 'var(--s-7)' }}>
          {BLOCKS.map(({ id, title, body, note }) => (
            <section key={id} style={{ marginBottom: 'var(--s-6)' }}>
              <p className="kicker">{id === 'install' ? 'Langkah 1' : 'Langkah 2'}</p>
              <h2 className="section-title" style={{ fontSize: 'var(--text-xl)', marginTop: 'var(--s-2)' }}>{title}</h2>
              <div style={{ position: 'relative', background: 'var(--navy-deep)', borderRadius: 'var(--radius-sm)', padding: 'var(--s-3) var(--s-4)', maxWidth: '40rem', marginTop: 'var(--s-3)' }}>
                <code style={{ background: 'transparent', border: 0, padding: 0, color: '#cfe0ff' }}>{body}</code>
                {copyBlock(body, id)}
              </div>
              <p style={{ color: 'var(--muted-2)', fontSize: 'var(--text-sm)', marginTop: 'var(--s-3)', maxWidth: '62ch' }}>{note}</p>
            </section>
          ))}

          <section style={{ marginBottom: 'var(--s-6)' }}>
            <p className="kicker">Langkah 3</p>
            <h2 className="section-title" style={{ fontSize: 'var(--text-xl)', marginTop: 'var(--s-2)' }}>Daftarkan ke harness Anda.</h2>
            {HARNESS.map(({ id, title, body }) => (
              <div key={id} style={{ margin: 'var(--s-5) 0' }}>
                <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--navy-deep)', marginBottom: 'var(--s-2)' }}>{title}</h3>
                <div style={{ position: 'relative', background: 'var(--navy-deep)', borderRadius: 'var(--radius-sm)', padding: 'var(--s-3) var(--s-4)', maxWidth: '40rem' }}>
                  <pre style={{ color: '#cfe0ff', fontSize: 'var(--text-sm)', overflowX: 'auto', fontFamily: 'var(--font-mono)' }}><code>{body}</code></pre>
                  {copyBlock(body, id)}
                </div>
              </div>
            ))}
            <p style={{ color: 'var(--muted-2)', fontSize: 'var(--text-sm)', maxWidth: '62ch' }}>Server lokal itu menambah <strong>45 tool MCP</strong> di atas <strong>36 primitive browser</strong>. Tidak ada login, tidak ada quota yang harus dimengerti di website: quota dibaca di lingkungan bridge dan ditampilkan oleh <code>doctor</code>.</p>
          </section>

          <section style={{ marginBottom: 'var(--s-6)' }}>
            <p className="kicker">Langkah 4</p>
            <h2 className="section-title" style={{ fontSize: 'var(--text-xl)', marginTop: 'var(--s-2)' }}>Satu kali per peramban.</h2>
            <p style={{ color: 'var(--muted-2)', fontSize: 'var(--text-base)', maxWidth: '64ch', marginTop: 'var(--s-3)' }}>Peramban baru harus memasang ekstensi Navego dulu (lihat <Link to="/unduh.html">Unduh</Link>), lalu buka <Link to="/dashboard.html">Dasbor</Link> dan klik <strong>Pasangkan browser ini</strong> — kode dibuat di server dan dikirim langsung ke ekstensi. Setelah itu, driver lokal otomatis mengambil alih — tidak perlu langkah lain setiap sesi.</p>
          </section>

          <section>
            <p className="kicker">Batas</p>
            <h2 className="section-title" style={{ fontSize: 'var(--text-xl)', marginTop: 'var(--s-2)' }}>Batas yang dijaga.</h2>
            <ul style={{ paddingLeft: '1.4rem', color: 'var(--muted-2)', fontSize: 'var(--text-base)', display: 'grid', gap: 'var(--s-2)', marginTop: 'var(--s-3)' }}>
              <li>Password, kode sekali pakai, PIN, kartu, dan CVV selalu ditolak. Pekerjaan yang berhenti di situ gagal — bukan diam-diam diteruskan.</li>
              <li>Tab pribadi, tab non-http(s), dan jendela tanpa akses debugger: primitive menolak, dan penolakan disebut namanya.</li>
              <li>Enam izin hanya dipakai untuk enam alasan: <code>tabs</code>, <code>scripting</code>, <code>storage</code>, <code>alarms</code>, <code>debugger</code>, <code>downloads</code>.</li>
            </ul>
            <p style={{ color: 'var(--muted-2)', fontSize: 'var(--text-sm)', marginTop: 'var(--s-4)' }}>Butuh detail teknis? Panduan pemanggilan di <a href="https://github.com/afnannuzulasugihartono/navego/blob/main/docs/agent-call.md">docs/agent-call.md</a> menyebut semua jalur secara persis.</p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
