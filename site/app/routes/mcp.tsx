import { useState } from 'react';
import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return [
    { title: 'Pasang MCP — Corbin' },
    { name: 'description', content: 'Driver lokal Corbin berjalan di mesin Anda sendiri — stdio, tanpa login, tanpa biaya per panggilan. Server hosted sudah tidak disediakan lagi.' }
  ];
}

const BLOCKS = [
  { id: 'install', title: 'Pasang paketnya', body: 'npm install -g opera-agent-mcp', note: 'Satu perintah. Paket ini memakai browser yang sudah Anda gunakan; tidak ada proses tambahan yang perlu dijaga.' },
  { id: 'doctor', title: 'Periksa yang terhubung', body: 'opera-agent-mcp doctor', note: 'Cetakan menyatakan nama device, paket plan, dan sisa quota hari ini. Kalau tidak ada yang terhubung, paket akan mencetak langkah perbaikan yang paling mungkin.' }
];

const HARNESS: Array<{ id: string; title: string; body: string }> = [
  { id: 'cfg-opencode', title: 'OpenCode — opencode.json atau ~/.config/opencode/opencode.json', body: '{\n  "mcp": {\n    "corbin": {\n      "type": "local",\n      "command": "opera-agent-mcp",\n      "args": ["local"]\n    }\n  }\n}' },
  { id: 'cfg-kilo', title: 'Kilo Code — MCP settings (JSON)', body: '{\n  "mcpServers": {\n    "corbin": {\n      "command": "opera-agent-mcp",\n      "args": ["local"]\n    }\n  }\n}' },
  { id: 'cfg-claude', title: 'Claude Desktop — konfigurasi MCP lokal', body: 'command: npx\nargs: ["-y", "opera-agent-mcp", "local"]' }
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

  return (
    <>
      <SiteHeader current="/mcp.html" />
      <main className="wrap" style={{ maxWidth: 880 }}>
        <header className="page-head" style={{ paddingBottom: 6 }}>
          <h1>Pasang MCP</h1>
          <p className="lede">Driver lokal Corbin berjalan di mesin Anda sendiri — stdio, tanpa login, tanpa biaya per panggilan. Server hosted sudah tidak disediakan lagi; yang dibutuhkan adalah browser yang masuk akun dan ekstensi terpasang.</p>
        </header>

        {BLOCKS.map(({ id, title, body, note }) => (
          <section key={id} style={{ marginTop: 26 }}>
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>{title}</h2>
            <div style={{ background: 'var(--ink)', borderRadius: 8, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 12, maxWidth: 640 }}>
              <code style={{ background: 'transparent', color: '#d8f4ff', fontSize: 12 }}>{body}</code>
              <button onClick={() => copy(body, id)} style={{ background: 'var(--paper)', color: '#ffffff', border: '1px solid #061c4e', borderRadius: 6, padding: '5px 10px', fontSize: 10.5, cursor: 'pointer', fontFamily: 'inherit', marginLeft: 'auto' }}>{copied === id ? 'Tersalin' : 'Salin'}</button>
            </div>
            <p style={{ color: 'var(--muted-2)', fontSize: 13, marginTop: 8, maxWidth: '72ch' }}>{note}</p>
          </section>
        ))}

        <section style={{ marginTop: 26 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>3. Daftarkan ke harness yang Anda pakai</h2>
          {HARNESS.map(({ id, title, body }) => (
            <div key={id} style={{ marginBottom: 14 }}>
              <h3 style={{ fontSize: 13, color: 'var(--muted-2)', marginBottom: 6 }}>{title}</h3>
              <div style={{ background: 'var(--ink)', borderRadius: 8, padding: '10px 12px', maxWidth: 640, position: 'relative' }}>
                <pre style={{ color: '#d8f4ff', fontSize: 11.5, overflowX: 'auto' }}><code>{body}</code></pre>
                <button onClick={() => copy(body, id)} style={{ position: 'absolute', top: 8, right: 8, background: 'var(--paper)', color: '#ffffff', border: '1px solid #061c4e', borderRadius: 6, padding: '5px 10px', fontSize: 10.5, cursor: 'pointer', fontFamily: 'inherit' }}>{copied === id ? 'Tersalin' : 'Salin'}</button>
              </div>
            </div>
          ))}
          <p style={{ color: 'var(--muted-2)', fontSize: 13 }}>Server lokal itu menambah <strong>45 tool MCP</strong> di atas <strong>36 primitive browser</strong>. Tidak ada login, tidak ada quota yang harus dimengerti di website: quota dibaca di lingkungan bridge dan ditampilkan oleh <code>doctor</code>.</p>
        </section>

        <section style={{ marginTop: 26 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>4. Satu kali per peramban</h2>
          <p style={{ color: 'var(--muted-2)', fontSize: 13.5, maxWidth: '76ch' }}>Peramban baru harus memasang ekstensi Corbin dulu (lihat <Link to="/unduh.html">Unduh</Link>), lalu buka <Link to="/dashboard.html">Dasbor</Link> dan klik <strong>Pasangkan browser ini</strong> — kode dibuat di server dan dikirim langsung ke ekstensi. Setelah itu, driver lokal otomatis mengambil alih — tidak perlu langkah lain setiap sesi.</p>
        </section>

        <section style={{ marginTop: 26 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Batas yang dijaga</h2>
          <ul style={{ paddingLeft: 20, color: 'var(--muted-2)', fontSize: 13.5, display: 'grid', gap: 6 }}>
            <li>Password, kode sekali pakai, PIN, kartu, dan CVV selalu ditolak. Pekerjaan yang berhenti di situ gagal — bukan diam-diam diteruskan.</li>
            <li>Tab pribadi, tab non-http(s), dan jendela tanpa akses debugger: primitive menolak, dan penolakan disebut namanya.</li>
            <li>Enam izin hanya dipakai untuk enam alasan: <code>tabs</code>, <code>scripting</code>, <code>storage</code>, <code>alarms</code>, <code>debugger</code>, <code>downloads</code>.</li>
          </ul>
          <p style={{ color: 'var(--muted-2)', fontSize: 13, marginTop: 10 }}>Butuh detail teknis? Panduan pemanggilan di <a href="https://github.com/afnannuzulasugihartono/opera-agent/blob/main/docs/agent-call.md">docs/agent-call.md</a> menyebut semua jalur secara persis.</p>
        </section>
        <div className="page-foot">
          <div>
            <h2>Operator menunggu.</h2>
            <p>Satu perintah <code style={{ color: '#9ff3ff', background: 'transparent', border: 0, padding: 0 }}>opera-agent-mcp local</code>, lalu harness Anda langsung bisa menjalankan browser.</p>
          </div>
          <Link className="btn btn-solid" to="/docs.html">Baca Docs</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
