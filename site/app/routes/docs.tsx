import { useState } from 'react';
import catalog from '../data/tools.json';
import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return [
    { title: 'Docs — Navego' },
    { name: 'description', content: 'Pasang, pair, jalankan, hubungkan. 45 tool MCP di atas 36 primitive browser - langkah yang bisa diikuti.' }
  ];
}

const TOOLS = catalog as Array<{ group: string; items: Array<[string, string]> }>;

const CONFIGS: Array<{ id: string; title: string; body: string }> = [
  { id: 'cfg-opencode', title: 'OpenCode', body: '{\n  "mcp": {\n    "navego": {\n      "type": "local",\n      "command": "opera-agent-mcp",\n      "args": ["local"]\n    }\n  }\n}' },
  { id: 'cfg-kilo', title: 'Kilo Code', body: '{\n  "mcpServers": {\n    "navego": {\n      "command": "opera-agent-mcp",\n      "args": ["local"]\n    }\n  }\n}' },
  { id: 'cfg-claude', title: 'Claude Desktop', body: 'command: npx\nargs: ["-y", "opera-agent-mcp", "local"]' }
];

const SECTIONS = [
  ['#pasang', 'Pasang extension'],
  ['#pairing', 'Masuk dan pair device'],
  ['#tugas', 'Tugas pertama'],
  ['#berkas', 'Berkas yang jadi'],
  ['#saldo', 'Saldo dan tagihan'],
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

  return (
    <>
      <SiteHeader current="/docs.html" />
      <main className="wrap" style={{ maxWidth: 1080 }}>
        <header className="page-head" style={{ paddingBottom: 6 }}>
          <h1>Docs</h1>
          <p className="lede">Pasang, masuk, jalankan, hubungkan.</p>
        </header>

        <div className="docs-layout">
          <nav className="docs-rail" aria-label="Di halaman ini">
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', padding: '4px 10px' }}>Di halaman ini</span>
            {SECTIONS.map(([href, label]) => (
              <a key={href} href={href}>{label}</a>
            ))}
          </nav>
          <div>
        <section className="section" aria-labelledby="quickTitle" style={{ paddingTop: 30 }}>
          <h2 id="quickTitle" style={{ fontSize: 20, marginBottom: 12 }}>Mulai cepat</h2>
          <ol style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, listStyle: 'none' }}>
            {[
              ['#pasang', 'Pasang extension', 'Arsip .zip, mode pengembang.'],
              ['#pairing', 'Pair device', 'Kode sekali pakai dari Dashboard.'],
              ['#tugas', 'Tugas pertama', 'Satu kalimat, satu hasil.']
            ].map(([href, title, body]) => (
              <li key={href}><a href={href} className="feature" style={{ textDecoration: 'none', display: 'block', height: '100%' }}><strong style={{ fontSize: 13.5 }}>{title}</strong><p style={{ color: 'var(--muted-2)', fontSize: 12, marginTop: 4 }}>{body}</p></a></li>
            ))}
          </ol>
        </section>

        <section className="legal" style={{ maxWidth: 'none' }}>
          <h2 id="pasang">Pasang extension</h2>
          <ol className="steps">
            <li><span><strong>Unduh.</strong> Ambil arsip <code>.zip</code> dari halaman <Link to="/unduh.html">Unduh</Link>.</span></li>
            <li><span><strong>Ekstrak.</strong> Ke folder yang tidak akan dirapikan lagi, misalnya <code>C:\Navego\</code>.</span></li>
            <li><span><strong>Muat.</strong> Buka <code>chrome://extensions</code> (Edge: <code>edge://extensions</code>, Brave: <code>brave://extensions</code>, Opera: <code>opera://extensions</code>), nyalakan Mode Pengembang, lalu muat folder tadi.</span></li>
            <li><span><strong>Periksa.</strong> Navego muncul di daftar extension.</span></li>
          </ol>
          <p>Mesin yang dikelola perusahaan memasang <code>.crx</code> bertanda tangan lewat <code>chrome://policy</code>. Firefox tidak didukung: tidak ada izin <code>debugger</code> di sana.</p>
          <p>Pemasangan tidak dipungut biaya. Yang dibayar nanti adalah setiap pekerjaan yang selesai.</p>

          <h2 id="pairing">Masuk dan pair device</h2>
          <p>Masuk dengan magic link email, Google, atau GitHub dari <Link to="/index.html">halaman Masuk</Link>.</p>
          <ol className="steps">
            <li><span><strong>Buat kode.</strong> Di <Link to="/dashboard.html">Dashboard</Link>, buka Device dan buat kode sekali pakai — atau klik Pasangkan browser ini untuk pair 1 klik.</span></li>
            <li><span><strong>Tempel.</strong> Kode berlaku sepuluh menit dan hanya dipakai sekali.</span></li>
            <li><span><strong>Periksa.</strong> Device muncul di daftar dengan status daring.</span></li>
          </ol>
          <p>Device yang tidak dikenali bisa dicabut kapan saja di Dashboard.</p>

          <h2 id="tugas">Tugas pertama</h2>
          <p>Anda menulis satu perintah, browser bekerja, dan hasilnya menjadi berkas. Contoh: <em>Buka Google Maps, cari kopi dekat Monas, dan tulis hasilnya ke sheet.</em></p>
          <ul>
            <li>Satu pekerjaan berarti satu hasil: satu halaman, satu laporan, atau satu daftar.</li>
            <li>Jumlah aksinya dibatasi. Perkiraan yang lebih besar ditolak di depan dengan tawaran dipecah, bukan gagal di tengah. Batas dan harganya ada di halaman <Link to="/harga.html">Harga</Link>.</li>
            <li>Konten halaman hanya pergi ke endpoint model Anda; kunci API tersimpan di browser ini.</li>
          </ul>

          <h2 id="berkas">Berkas yang jadi</h2>
          <p>Satu pekerjaan berakhir sebagai berkas yang bisa langsung dibuka. Empat contoh nyata dari perusahaan tiruan, diunduh apa adanya:</p>
          <ul>
            <li><a href="/contoh/laporan-keuangan-2026-09.xlsx" download>Laporan keuangan September 2026</a> — Excel: baris laporan, baris sumber angkanya, dan buku besar yang menyebut baris mana yang menghasilkan tiap angka.</li>
            <li><a href="/contoh/rencana-strategis-2027.pptx" download>Rencana strategis 2027</a> — PowerPoint: satu sampul dan empat slide isi, dan tiap angka di slide berasal dari laporan yang sudah dicek.</li>
            <li><a href="/contoh/riset-promo.docx" download>Riset promo</a> — Word: judul, bagian, tabel, dan grafik.</li>
            <li><a href="/contoh/rencana-pemasaran-2027.docx" download>Rencana pemasaran 2027</a> — Word: positioning, segmentasi, dan rencana kanal.</li>
          </ul>
          <p>Portal yang minta masuk tidak menghentikan pekerjaan: agen membaca halaman lebih dulu, tahu ada sign-in atau captcha, dan menunggu Anda menyelesaikannya di browser Anda sendiri sebelum lanjut di tab yang sama.</p>
          <p>Berkas dibuat dari satu file kas yang Anda lihat sendiri — tidak ada langkah yang disembunyikan.</p>

          <h2 id="saldo">Saldo dan tagihan</h2>
          <p>Isi saldo lewat QRIS dari Dashboard, tanpa langganan. Saldo yang kurang membuat pekerjaan ditolak sebelum mulai, dengan tautan isi ulang. Harga tetap, pengembalian, dan masa berlaku saldo ada di halaman <Link to="/harga.html">Harga</Link>.</p>

          <h2 id="tools">Tools MCP</h2>
          <p>45 tool dalam empat keluarga — <code>browser_</code>, <code>artifact_</code>, <code>delivery_</code>, dan <code>wallet_</code> — di atas 36 primitive browser. Tugas masing-masing:</p>
          {TOOLS.map(({ group, items }) => (
            <div key={group}>
              <h3>{group}</h3>
              <dl className="sheet" style={{ maxWidth: 780 }}>
                {items.map(([name, body]) => (
                  <div key={name} style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 230px) 1fr', gap: 10, padding: '7px 12px', background: '#fff', borderBottom: '1px solid var(--card-2)', fontSize: 12.5 }}>
                    <code>{name}</code>
                    <span style={{ color: 'var(--muted-2)' }}>{body}</span>
                  </div>
                ))}
              </dl>
            </div>
          ))}

          <h2 id="mcp">Hubungkan AI harness</h2>
          <p>Satu server MCP per mesin: driver lokal, jalan di mesin Anda sendiri, tanpa biaya per panggilan dan tanpa melewati server orang lain. <Link to="/mcp.html">Pasang driver lokal</Link>.</p>
          <p>Koneksi driver lokal:</p>
          <div style={{ background: 'var(--ink)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 12, maxWidth: 640 }}>
            <code style={{ background: 'transparent', color: '#d8f4ff' }}>npx -y opera-agent-mcp local</code>
            <button onClick={() => copy('npx -y opera-agent-mcp local', 'mcp-url')} className="cf-copy">{copied === 'mcp-url' ? 'Tersalin' : 'Salin'}</button>
          </div>
          {CONFIGS.map(({ id, title, body }) => (
            <div key={id}>
              <h3>{title}</h3>
              <div style={{ background: 'var(--ink)', borderRadius: 8, padding: '10px 12px', maxWidth: 640, position: 'relative' }}>
                <pre style={{ color: '#d8f4ff', fontSize: 11.5, overflowX: 'auto' }}><code>{body}</code></pre>
                <button onClick={() => copy(body, id)} className="cf-copy">{copied === id ? 'Tersalin' : 'Salin'}</button>
              </div>
            </div>
          ))}
          <p>Tidak perlu login atau langganan untuk memakai driver lokal. Meter plan tetap jalan di bridge — sisa quota Anda bisa dilihat dengan <code>opera-agent-mcp doctor</code> kapan pun. Semua jalur dijelaskan di satu panduan: <a href="https://github.com/afnannuzulasugihartono/opera-agent/blob/main/docs/agent-call.md">docs/agent-call.md</a>.</p>
          <h3>ChatGPT dan konektor lain</h3>
          <p>Konektor mereka bicara remote-over-HTTP; itu sudah berhenti eksis — kami tidak menyediakan jalur hosted lagi. Untuk ChatGPT dan harness serupa, gunakan harness lokal (atau Claude Desktop/OpenCode yang menerima MCP stdio).</p>
          <p>Setelah terpasang, alat baru muncul sesudah restart harness — itu perilaku harness, bukan error koneksi.</p>

          <h2 id="batas">Batas yang dijaga</h2>
          <ul>
            <li>Password, kode sekali pakai, PIN, kartu, dan CVV selalu ditolak. Pekerjaan yang berhenti di situ gagal.</li>
            <li>Tab pribadi: tangkapan layar ditolak. Tab non-http(s): primitive menolak.</li>
            <li>Enam izin: <code>tabs</code>, <code>scripting</code>, <code>storage</code>, <code>alarms</code>, <code>debugger</code>, <code>downloads</code>. Satu alasan untuk tiap izin ada di halaman <Link to="/unduh.html">Unduh</Link>.</li>
            <li>Yang masuk ke server untuk penagihan hanya: id reservasi, jenis tugas, status, dan hash artefak. Isi halaman tidak pernah ikut.</li>
          </ul>
          <p>Macet? Halaman <Link to="/dukungan.html">Dukungan</Link> punya langkah yang bisa diikuti.</p>
        </section>
        <div className="page-foot" style={{ marginTop: 36 }}>
          <div>
            <h2>Macet di tengah dokumen?</h2>
            <p>Langkah yang bisa diikuti ada di halaman Dukungan.</p>
          </div>
          <Link className="btn btn-solid" to="/dukungan.html">Dukungan</Link>
        </div>
        </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
