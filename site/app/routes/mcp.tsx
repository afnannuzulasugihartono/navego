// decisions.json -> D35, D36 (no eyebrows, h1 first)

import { useState } from 'react';
import { seoMeta } from '../lib/seo.js';
import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return seoMeta({
    title: 'Pasang MCP — Navego',
    description: 'Driver lokal Navego berjalan di mesin Anda sendiri — stdio, tanpa biaya per panggilan. Server hosted sudah tidak disediakan lagi.',
    path: '/mcp'
  });
}

const BLOCKS = [
  { id: 'pair', title: 'Pair browser ini', body: 'Dashboard → Pasangkan browser ini', note: 'Pasang ekstensi dari Unduh, masuk, lalu klik sekali. Tidak ada kode yang diketik.' },
  { id: 'local', title: 'Jalankan driver lokal', body: 'npx -y navego local', note: 'Biarkan proses ini hidup. Stdio di mesin Anda. Tidak perlu install global, tidak ada biaya per panggilan.' },
  { id: 'doctor', title: 'Buktikan koneksinya', body: 'npx -y navego doctor', note: 'Di terminal kedua, selagi local berjalan: doctor membaca device, plan, dan sisa kuota. Kalau gagal, pesannya menyebut langkah perbaikan.' }
];

const HARNESS: Array<{ id: string; title: string; body: string }> = [
  { id: 'cfg-opencode', title: 'OpenCode — opencode.json atau ~/.config/opencode/opencode.json', body: '{\n  "mcp": {\n    "navego": {\n      "type": "local",\n      "command": "npx",\n      "args": ["-y", "navego", "local"]\n    }\n  }\n}' },
  { id: 'cfg-kilo', title: 'Kilo Code — MCP settings (JSON)', body: '{\n  "mcpServers": {\n    "navego": {\n      "command": "npx",\n      "args": ["-y", "navego", "local"]\n    }\n  }\n}' },
  { id: 'cfg-claude', title: 'Claude Desktop — konfigurasi MCP lokal', body: '{\n  "mcpServers": {\n    "navego": {\n      "command": "npx",\n      "args": ["-y", "navego", "local"]\n    }\n  }\n}' }
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
    <button onClick={() => copy(text, id)} className="btn btn-solid btn-sm code-block__copy" type="button">
      {copied === id ? 'Tersalin' : 'Salin'}
    </button>
  );

  return (
    <>
      <SiteHeader current="/mcp" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <h1>Dari npx ke tab pertama.</h1>
            <p className="lede">Butuh Node.js 22 atau lebih baru. Pair sekali, jalankan <code>npx -y navego local</code>, lalu AI Anda memakai browser yang sama. Tanpa install global, tanpa biaya per panggilan.</p>
          </div>
        </section>

        <section className="band" aria-labelledby="stepsTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="stepsTitle" className="section-title">Tiga perintah.</h2>
              </div>
              <p className="section-note">Salin, jalankan, selesai. Tidak ada server yang perlu dijaga.</p>
            </div>
            <div className="stack-6">
              {BLOCKS.map(({ id, title, body, note }, index) => (
                <section key={id} className="value-card value-card--stack">
                  <span className="start-num">{index + 1}</span>
                  <b>{title}</b>
                  <div className="code-block code-block--flush">
                    <code>{body}</code>
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
                <h2 id="harnessTitle" className="section-title">Daftarkan ke AI Anda.</h2>
              </div>
              <p className="section-note">Server lokal menambah 40 tool MCP di atas 36 primitive browser.</p>
            </div>
            <div className="value-grid value-grid--single">
              {HARNESS.map(({ id, title, body }) => (
                <section key={id} className="value-card">
                  <b>{title}</b>
                  <div className="code-block code-block--flush mt-2">
                    <pre><code>{body}</code></pre>
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
                <h2 id="limitsTitle" className="section-title">Yang dijaga, apa adanya.</h2>
              </div>
            </div>
            <ul className="list-inset stack-2">
              <li>Password, kode sekali pakai, PIN, kartu, dan CVV selalu ditolak. Pekerjaan yang berhenti di situ gagal — bukan diam-diam diteruskan.</li>
              <li>Tab pribadi, tab non-http(s), dan jendela tanpa akses debugger: primitive menolak, dan penolakan disebut namanya.</li>
              <li>Enam izin hanya dipakai untuk enam alasan: <code>tabs</code>, <code>scripting</code>, <code>storage</code>, <code>alarms</code>, <code>debugger</code>, <code>downloads</code>.</li>
            </ul>
            <p className="mt-4 text-sm">Butuh detail teknis? <a href="https://github.com/afnannuzulasugihartono/navego/blob/main/docs/agent-call.md">docs/agent-call.md</a> menyebut semua jalur secara persis.</p>
          </div>
        </section>

        <section className="band">
          <div className="wrap">
            <div className="cta-band">
              <h2 className="section-title text-on-dark">Satu perintah untuk mulai.</h2>
              <p>Jalankan <code>npx -y navego doctor</code>, lihat device Anda di Dashboard.</p>
              <div className="hero-cta mt-2">
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
