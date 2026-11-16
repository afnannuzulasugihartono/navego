import { useState } from 'react';
import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return [
    { title: 'Docs — Corbin' },
    { name: 'description', content: 'Pasang, pair, jalankan, hubungkan. 56 tool di atas 36 primitive browser — langkah yang bisa diikuti.' }
  ];
}

const TOOLS: Array<{ group: string; items: Array<[string, string]> }> = [
  {
    group: 'Peramban',
    items: [
      ['browser_status', 'Apakah ekstensi daring, device mana yang dipakai, dan kemampuannya.'],
      ['list_tabs', 'Daftar tab yang terbuka, dengan id, judul, URL, dan status muatnya.'],
      ['open_url', 'Buka URL di tab background; aktif hanya saat Anda minta.'],
      ['activate_tab', 'Aktifkan sebuah tab; hanya saat Anda melihat atau mengizinkan.'],
      ['navigate_tab', 'Navigasi tab tertentu ke URL, tanpa dipindah ke depan.'],
      ['close_tab', 'Tutup tab berdasarkan ID, hanya bila Anda yang memintanya.']
    ]
  },
  {
    group: 'Halaman (membaca)',
    items: [
      ['read_page', 'Observasi padat tugas (teks, elemen interaktif dengan ref, fakta viewport). Dengan view: "map": peta seluruh halaman dalam 17 kelas, koordinat dokumen, ref bertahan saat scroll.'],
      ['capture_page', 'JPEG terbatas dari tab tertentu; bisa satu halaman penuh lewat tile.'],
      ['record_start', 'Merekam tab ke webm di folder Downloads; semua perintah berjalan seperti biasa dan tertangkap. Ditolak di permukaan sensitif.'],
      ['record_stop', 'Mengakhiri rekaman dan menulis webm; mengembalikan manifest (nama berkas, byte, frame) dan sampai empat still sebagai gambar.'],
      ['scan_page', 'Satu berkas HTML berdiri sendiri di folder Downloads: DOM hasil render, stylesheet & script di-inline, aset sebagai data-URL. Ditolak di permukaan sensitif.'],
      ['find_elements', 'Cari elemen interaktif lewat teks, peran ARIA, atau tag; hasilnya punya ref untuk klik dan isi.']
    ]
  },
  {
    group: 'Aksi',
    items: [
      ['click_element', 'Klik ref memakai input tepercaya; background secara default.'],
      ['fill_element', 'Isi kolom teks lewat ref; ditolak di password, OTP, pembayaran, dan upload.'],
      ['press_key', 'Kirim tombol (Ctrl+A, Ctrl+V, Enter…) atau ketik teks ke permukaan terfokus.'],
      ['stream_keys', 'Rangkaian chord dan teks dalam satu panggilan, seperti melintasi menu.'],
      ['scroll_page', 'Scroll relatif atau absolut di halaman tanpa memindah fokus.'],
      ['pointer', 'Satu pointer untuk move, click, drag, wheel, dan hover untuk menu.'],
      ['run_browser_burst', '1–8 aksi bergantung dalam satu panggilan; tanpa JavaScript bebas; 12 detik.'],
      ['run_workflow', 'Workflow situs tertentu yang terdaftar, misalnya youtube.skip_ads.'],
      ['run_program', 'Program baca saja yang diverifikasi di dalam VM; tanpa langkah tulis.'],
      ['run_adhoc', 'Workflow tulis sementara (cari → isi → klik → verifikasi), dihapus setelah jalan.']
    ]
  },
  {
    group: 'Otomatisasi dan memori',
    items: [
      ['start_watch', 'Pasang trigger lokal di tab; saat kondisi terpenuhi, aksi jalan lokal, tanpa bolak-balik model.'],
      ['wait_events', 'Long-poll untuk event dari trigger; hasil terbaru pertama dengan cursor.'],
      ['stop_watch', 'Matikan satu trigger berdasarkan id, atau semua trigger aktif.'],
      ['skill_save', 'Simpan pelajaran tugas ke memori bersama lintas akun.'],
      ['skill_recall', 'Cari pelajaran dari tugas yang mirip; tiap pelajaran punya tugas, situs, dan jebakan.']
    ]
  },
  {
    group: 'Media',
    items: [
      ['media_state', 'Laporan elemen audio/video di halaman: kehadiran, waktu, durasi, mute, volume.'],
      ['media_play', 'Mulai pemutaran; jika diblokir browser, tekan Play lewat click_element.'],
      ['media_pause', 'Jeda pemutaran.'],
      ['media_seek', 'Lompat ke detik tertentu; nilai di luar durasi dikecilkan.'],
      ['media_stream_start', 'Mulai sesi dengar: audio halaman disadap dan ditranskripsi per jendela.'],
      ['media_stream_stop', 'Hentikan sesi dengar; ekor terakhir ikut ditranskripsi.'],
      ['media_listen_read', 'Baca segmen transkrip dengan cursor; transkrip tidak pernah masuk dashboard.']
    ]
  },
  {
    group: 'Rute',
    items: [
      ['use_browser', 'Kunci provider ini ke satu browser untuk panggilan berikutnya (mis. opencode di Brave, Claude di Chrome). Tanpa argumen: baca pin sekarang; any: lepas kuncinya; header X-Opera-Device selalu menang atas pin.']
    ]
  },
  {
    group: 'Kas',
    items: [
      ['statement_deliver', 'Unduh statement klien untuk bulan tertentu ke disk Anda, di bawah nama yang Anda pilih; pengiriman kedua untuk bulan sama ditolak.'],
      ['statement_manifest', 'Baca manifest yang disimpan device: satu baris per statement terkirim, beserta ukuran, jenis, jumlah halaman, dan saldo penutup.'],
      ['invoice_create', 'Susun invoice dari baris manifest atau client-periodes; amount dari price list, bukan dari angka di panggilan.']
    ]
  }
];

const CONFIGS: Array<{ id: string; title: string; body: string }> = [
  { id: 'cfg-opencode', title: 'OpenCode', body: '{\n  "mcp": {\n    "opera-agent": {\n      "type": "local",\n      "command": "opera-agent-mcp",\n      "args": ["local"]\n    }\n  }\n}' },
  { id: 'cfg-kilo', title: 'Kilo Code', body: '{\n  "mcpServers": {\n    "opera-agent": {\n      "command": "opera-agent-mcp",\n      "args": ["local"]\n    }\n  }\n}' },
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
          <p className="kicker">Docs</p>
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
            <li><span><strong>Ekstrak.</strong> Ke folder yang tidak akan dirapikan lagi, misalnya <code>C:\Corbin\</code>.</span></li>
            <li><span><strong>Muat.</strong> Buka <code>chrome://extensions</code> (Edge: <code>edge://extensions</code>, Brave: <code>brave://extensions</code>, Opera: <code>opera://extensions</code>), nyalakan Mode Pengembang, lalu muat folder tadi.</span></li>
            <li><span><strong>Periksa.</strong> Corbin muncul di daftar extension.</span></li>
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
          <p>Cara file-file itu dibuat dari satu file kas ada di halaman <Link to="/studi.html">Studi kasus</Link>.</p>

          <h2 id="saldo">Saldo dan tagihan</h2>
          <p>Isi saldo lewat QRIS dari Dashboard, tanpa langganan. Saldo yang kurang membuat pekerjaan ditolak sebelum mulai, dengan tautan isi ulang. Harga tetap, pengembalian, dan masa berlaku saldo ada di halaman <Link to="/harga.html">Harga</Link>.</p>

          <h2 id="tools">Tools MCP</h2>
          <p>56 tool di atas 36 primitive browser. Tugas masing-masing:</p>
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
            <button onClick={() => copy('npx -y opera-agent-mcp local', 'mcp-url')} style={{ background: 'linear-gradient(to bottom, #2a6ae0, #123fb8)', color: '#ffffff', border: '1px solid #061c4e', borderRadius: 6, padding: '5px 10px', fontSize: 10.5, cursor: 'pointer', fontFamily: 'inherit' }}>{copied === 'mcp-url' ? 'Tersalin' : 'Salin'}</button>
          </div>
          {CONFIGS.map(({ id, title, body }) => (
            <div key={id}>
              <h3>{title}</h3>
              <div style={{ background: 'var(--ink)', borderRadius: 8, padding: '10px 12px', maxWidth: 640, position: 'relative' }}>
                <pre style={{ color: '#d8f4ff', fontSize: 11.5, overflowX: 'auto' }}><code>{body}</code></pre>
                <button onClick={() => copy(body, id)} style={{ position: 'absolute', top: 8, right: 8, background: 'linear-gradient(to bottom, #2a6ae0, #123fb8)', color: '#ffffff', border: '1px solid #061c4e', borderRadius: 6, padding: '5px 10px', fontSize: 10.5, cursor: 'pointer', fontFamily: 'inherit' }}>{copied === id ? 'Tersalin' : 'Salin'}</button>
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
            <p>Langkah yang bisa diikuti ada di Dukungan — atau lihat studi kasus untuk jalannya yang berhasil.</p>
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
