// decisions.json -> D35, D36 (no eyebrows, h1 first)

import { useState } from 'react';
import { seoMeta } from '../lib/seo.js';
import catalog from '../data/tools.json';
import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return seoMeta({
    title: 'Docs — Navego',
    description: 'Pasang, pair, jalankan, hubungkan. 40 tool MCP di atas 36 primitive browser — langkah yang bisa diikuti.',
    path: '/docs'
  });
}

const TOOLS = catalog as Array<{ group: string; items: Array<[string, string]> }>;

const CONFIGS: Array<{ id: string; title: string; body: string }> = [
  { id: 'cfg-opencode', title: 'OpenCode', body: '{\n  "mcp": {\n    "navego": {\n      "type": "local",\n      "command": "navego",\n      "args": ["local"]\n    }\n  }\n}' },
  { id: 'cfg-kilo', title: 'Kilo Code', body: '{\n  "mcpServers": {\n    "navego": {\n      "command": "navego",\n      "args": ["local"]\n    }\n  }\n}' },
  { id: 'cfg-claude', title: 'Claude Desktop', body: 'command: npx\nargs: ["-y", "navego", "local"]' }
];

const MULAI = [
  { title: 'Pasang', body: 'Arsip .zip dari halaman Unduh, muat di chrome://extensions.' },
  { title: 'Pair', body: 'Satu klik "Pasangkan browser ini". Tidak ada kode yang diketik.' },
  { title: 'Perintah', body: 'Satu kalimat. Satu pekerjaan. Satu hasil.' },
  { title: 'Berkas', body: 'Hasilnya .xlsx, .docx, .pptx, atau .csv di folder Anda.' }
];

const SECTIONS = [
  ['#pasang', 'Pasang extension'],
  ['#pairing', 'Masuk dan pair device'],
  ['#tugas', 'Tugas pertama'],
  ['#berkas', 'Berkas yang jadi'],
  ['#paket', 'Paket dan pembayaran'],
  ['#tools', 'Tools MCP'],
  ['#mcp', 'Hubungkan AI harness'],
  ['#batas', 'Batas yang dijaga']
] as const;

export default function Docs() {
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
      <SiteHeader current="/docs" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <h1>Docs.</h1>
            <p className="lede">Empat langkah. Semua bisa disalin.</p>
          </div>
        </section>

        <div className="wrap py-6">
          <div className="start-grid">
            {MULAI.map((item, index) => (
              <div className="start-card" key={item.title}>
                <span className="start-num">{index + 1}</span>
                <b>{item.title}</b>
                <span>{item.body}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="wrap docs-layout">
          <nav className="docs-rail" aria-label="Di halaman ini">
            <span className="eyebrow">Di halaman ini</span>
            {SECTIONS.map(([href, label]) => (
              <a key={href} href={href}>{label}</a>
            ))}
          </nav>

          <div className="docs-article">
            <section className="docs-article">
              <h2 id="pasang">Pasang extension</h2>
              <ol className="steps">
                <li><span><strong>Unduh.</strong> Ambil arsip <code>.zip</code> dari halaman <Link to="/unduh">Unduh</Link>.</span></li>
                <li><span><strong>Ekstrak.</strong> Ke folder yang tidak akan dirapikan lagi — misalnya <code>C:\Navego\</code>.</span></li>
                <li><span><strong>Muat.</strong> Buka <code>chrome://extensions</code> (Edge: <code>edge://extensions</code>, Brave: <code>brave://extensions</code>, Opera: <code>opera://extensions</code>), nyalakan Mode Pengembang, muat folder tadi.</span></li>
                <li><span><strong>Periksa.</strong> Navego muncul di daftar extension.</span></li>
              </ol>
              <p>Mesin kelolaan perusahaan memasang <code>.crx</code> bertanda tangan lewat <code>chrome://policy</code>. Firefox tidak didukung: izin <code>debugger</code> tidak tersedia di sana.</p>
              <div className="callout"><strong>Gratis untuk dipasang.</strong> Yang dibayar nanti adalah pekerjaan yang selesai.</div>

              <h2 id="pairing">Masuk dan pair device</h2>
              <p>Masuk dengan magic link email, Google, atau GitHub dari <Link to="/masuk">halaman Masuk</Link>.</p>
              <ol className="steps">
                <li><span><strong>Klik.</strong> Di <Link to="/dashboard">Dashboard</Link>, buka Pairing — atau klik <strong>Pasangkan browser ini</strong> di popup.</span></li>
                <li><span><strong>Izin.</strong> Browser meminta izin pairing sekali; tidak ada kode yang diketik.</span></li>
                <li><span><strong>Periksa.</strong> Device muncul di daftar. Status daring muncul setelah ekstensi heartbeat ke jembatan.</span></li>
              </ol>
              <p>Device yang tidak dikenali bisa dicabut kapan saja di Dashboard.</p>

              <h2 id="tugas">Tugas pertama</h2>
              <p><em>Buka Google Maps, cari kopi dekat Monas, tulis hasilnya ke sheet.</em></p>
              <ul>
                <li>Satu pekerjaan berarti satu hasil: satu halaman, satu laporan, atau satu daftar.</li>
                <li>Jumlah aksi dibatasi. Perkiraan yang lebih besar ditolak di depan — dengan tawaran dipecah, bukan gagal di tengah. Lihat <Link to="/harga">Harga</Link>.</li>
                <li>Konten halaman hanya pergi ke endpoint model pilihan Anda (opsional — lihat penyiapan BYOK).</li>
              </ul>

              <h2 id="berkas">Berkas yang jadi</h2>
              <p>Satu pekerjaan berakhir sebagai berkas yang bisa dibuka. Empat contoh nyata dari perusahaan tiruan, diunduh apa adanya:</p>
              <ul>
                <li><a href="/contoh/laporan-keuangan-2026-09.xlsx" download>Laporan keuangan September 2026</a> — Excel: baris laporan, baris sumber angka, dan buku besar yang menyebut baris mana yang menghasilkan tiap angka.</li>
                <li><a href="/contoh/rencana-strategis-2027.pptx" download>Rencana strategis 2027</a> — PowerPoint: satu sampul, empat slide isi; tiap angka berasal dari laporan yang sudah dicek.</li>
                <li><a href="/contoh/riset-promo.docx" download>Riset promo</a> — Word: judul, bagian, tabel, grafik.</li>
                <li><a href="/contoh/rencana-pemasaran-2027.docx" download>Rencana pemasaran 2027</a> — Word: positioning, segmentasi, rencana kanal.</li>
              </ul>
              <p>Portal yang minta masuk: Anda menyelesaikannya dulu. Lalu Navego lanjut di tab yang sama.</p>

              <h2 id="paket">Paket dan pembayaran</h2>
              <p>Sekali beli, langsung aktif. $1–$9 per bulan, $17 Business (6 bulan), $33 Enterprise (1 tahun). Detail di <Link to="/harga">Harga</Link>.</p>

              <h2 id="tools">Tools MCP</h2>
              <p>40 tool dalam empat keluarga — <code>browser_</code>, <code>artifact_</code>, <code>delivery_</code>, <code>wallet_</code> — di atas 36 primitive browser.</p>
              {TOOLS.map(({ group, items }) => (
                <div key={group}>
                  <h3 className="docs-group-title">{group}</h3>
                  <div className="table-wrapper table-wrapper--measure">
                    <table className="table">
                      <caption>{group}</caption>
                      <tbody>
                        {items.map(([name, body]) => (
                          <tr key={name}>
                            <th scope="row"><code>{name}</code></th>
                            <td>{body}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              <h2 id="mcp">Hubungkan AI harness</h2>
              <p>Satu MCP per mesin: driver lokal, jalan di mesin Anda sendiri, tanpa biaya per panggilan. <Link to="/mcp">Pasang driver lokal</Link>.</p>
              <div className="code-block">
                <code>npx -y navego local</code>
                {copyBlock('npx -y navego local', 'mcp-url')}
              </div>
              {CONFIGS.map(({ id, title, body }) => (
                <div key={id}>
                  <h3 className="docs-group-title--tight">{title}</h3>
                  <div className="code-block">
                    <pre><code>{body}</code></pre>
                    {copyBlock(body, id)}
                  </div>
                </div>
              ))}
              <p>Driver lokalnya sendiri tidak perlu langganan. Kuota paket tetap dihitung di jembatan Navego — sisa kuota bisa dicek dengan <code>npx -y navego doctor</code>. Semua jalur dijelaskan di <a href="https://github.com/afnannuzulasugihartono/navego/blob/main/docs/agent-call.md">docs/agent-call.md</a>.</p>
              <h3 className="docs-group-title docs-group-title--tight">ChatGPT dan harness lain</h3>
              <p>MCP harness = aplikasi AI Anda (Claude Desktop, OpenCode, dsb.). Konektor ChatGPT memakai remote-HTTP dan tidak lagi disediakan. Untuk ChatGPT dan harness serupa, gunakan harness lokal (atau Claude Desktop/OpenCode yang menerima MCP stdio).</p>
              <p>Setelah terpasang, alat baru muncul sesudah harness restart — itu perilaku harness, bukan error koneksi.</p>

              <h2 id="batas">Batas yang dijaga</h2>
              <ul>
                <li>Password, kode sekali pakai, PIN, kartu, dan CVV selalu ditolak.</li>
                <li>Tab pribadi: tangkapan layar ditolak. Tab non-http(s): primitive menolak.</li>
                <li>Enam izin: <code>tabs</code>, <code>scripting</code>, <code>storage</code>, <code>alarms</code>, <code>debugger</code>, <code>downloads</code>. Alasannya ada di <Link to="/unduh">Unduh</Link>.</li>
                <li>Yang masuk ke server untuk penagihan hanya: id reservasi, jenis tugas, status, dan hash artefak. Isi halaman tidak pernah ikut.</li>
              </ul>
              <p>Macet? <Link to="/dukungan">Dukungan</Link> punya langkah yang bisa diikuti.</p>
            </section>

            <div className="card card-cta mt-6">
              <div>
                <h2 className="m-0">Macet di tengah dokumen?</h2>
                <p className="text-muted-2">Langkah yang bisa diikuti ada di halaman Dukungan.</p>
              </div>
              <Link className="btn btn-solid" to="/dukungan">Dukungan</Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
