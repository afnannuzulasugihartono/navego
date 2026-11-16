import { useState } from 'react';
import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return [
    { title: 'Docs — Corbin' },
    { name: 'description', content: 'Pasang, pair, jalankan, hubungkan. 45 tool MCP di atas 36 primitive browser - langkah yang bisa diikuti.' }
  ];
}

const TOOLS: Array<{ group: string; items: Array<[string, string]> }> = [
  {
    group: 'Peramban',
    items: [
      ['browser_status', 'Cek perangkat ter-pairing, port yang hidup, dan paket plan masing-masing. Jawab pertama waktu klik dan tombol tidak bekerja.'],
      ['browser_focus_window', 'Bawa window browser ke depan lewat bagian dari judulnya. Tanpa kecocokan, jawab keadaan tanpa memindahkan apa pun.'],
      ['browser_focus_tab', 'Bawa window yang memegang satu tab ke depan lewat tabId — tidak menebak dari judul yang bisa sama pada dua window.'],
      ['browser_select_browser', 'Pilih browser yang menjawab perintah tanpa tab sampai diganti. Tab yang sedang dipakai tetap mengikuti tabId-nya.'],
      ['browser_list_tabs', 'Daftar tab yang terbuka, dengan id, judul, URL, dan slot browsernya.'],
      ['browser_open_url', 'Buka URL di tab baru; tab yang sedang terbuka tidak pernah dihapus isinya.'],
      ['browser_close_tab', 'Tutup tab berdasarkan id; lepas cache sesi tab itu.'],
      ['browser_get_guide', 'Bacaan ringkas tentang server ini, ditulis sebagai tugas: panggilan yang dikenal bekerja untuk tiap pekerjaan.']
    ]
  },
  {
    group: 'Membaca halaman',
    items: [
      ['browser_read_page', 'Baca halaman: url, judul, teks, dan apakah teksnya sudah berhenti bergerak. Ladder: a11y tree → DOM → selection → foto.'],
      ['browser_search_web', 'Cari di Bing sebagai data terstruktur (peringkat, judul, URL, situs, cuplikan), bukan halaman yang harus dibaca.'],
      ['browser_find_text', 'Cari teks terlihat dan balik tiap kecocokan dengan kotak viewport — bisa langsung diklik.'],
      ['browser_find_element', 'Cari satu baris berdasar role dan nama; balik handle yang tidak basi. Tanpa nama: daftar semua baris peran itu.'],
      ['browser_screenshot', 'JPEG halaman; viewport × device scale factor. fullPage untuk halaman penuh (canvas tetap viewport).']
    ]
  },
  {
    group: 'Aksi',
    items: [
      ['browser_click', 'Klik titik viewport (x, y), handle dari browser_find_element, atau baris berdasar role dan name — dicari lalu diklik.'],
      ['browser_hover', 'Gerakkan pointer ke koordinat tanpa menekan; menu dan submenu muncul.'],
      ['browser_press_key', 'Kirim tombol ke elemen terfokus: Enter, Tab, Escape, panah, atau satu karakter.'],
      ['browser_type_text', 'Ketik teks ke permukaan terfokus; newline jadi paragraf nyata. atEnd: true untuk menambah di akhir dokumen.'],
      ['browser_scroll', 'Geser {y: pixel}, {end: true}, atau ke teks/selector tertentu. Jawaban: container mana yang bergerak.'],
      ['browser_run_steps', '1–8 langkah tergantung dalam satu panggilan; gagal pertama menghentikan yang tersisa.']
    ]
  },
  {
    group: 'Menunggu',
    items: [
      ['browser_wait_until', 'until=text: teks muncul/pergi. until=row: baris menu muncul/pergi. until=url: tiba di halaman. until=stable: halaman berhenti bergerak.']
    ]
  },
  {
    group: 'Berkas',
    items: [
      ['browser_upload_file', 'Isi file input dengan bytes atau path; halaman mengunggah sendiri via change yang sudah didengarkan.'],
      ['browser_drop_file', 'Lepas file di titik viewport; untuk site yang tidak punya input file (Docs, dll.).'],
      ['browser_intercept_picker', 'Sembunyikan file picker supaya unggahan selesai tanpa UI OS; aktif → upload → nonaktif.'],
      ['browser_download_file', 'Klik kontrol unduh, tunggu sampai berkas jadi, kembalikan path dan byte-nya.']
    ]
  },
  {
    group: 'Menu',
    items: [
      ['browser_list_menu', 'Baca apa yang bisa dilakukan aplikasi halaman, dari markup-nya sendiri — tanpa klik.'],
      ['browser_walk_menu', 'Telusuri path menu (mis. ["Insert","Image"]) dan berhenti di sana; clickLeaf untuk menekan ujungnya.']
    ]
  },
  {
    group: 'Dialog sistem',
    items: [
      ['browser_read_dialog', 'Baca judul, tombol, dan isi kolom dialog OS (file picker). Tidak mengubah apa pun.'],
      ['browser_type_into_dialog', 'Isi kolom dialog OS dengan teks, lalu baca kembali apa yang benar-benar masuk.'],
      ['browser_press_dialog_button', 'Tekan tombol bernama pada dialog OS, misalnya Open, Save, atau Cancel.']
    ]
  },
  {
    group: 'Masuk dan captcha',
    items: [
      ['browser_check_gate', 'Baca gate di tab (masuk, kode sekali pakai, captcha) atau tunggu sampai selesai. Tidak mengetik.'],
      ['browser_login', 'Isi username/password dari file kredensial yang Anda tulis; rahasia tidak pernah masuk ke jawaban.'],
      ['browser_solve_captcha', 'Opt-in: baca gambar captcha lewat solver yang Anda konfigurasikan, ketik jawabannya. Domain Anda yang memutuskan.']
    ]
  },
  {
    group: 'Pengiriman',
    items: [
      ['delivery_plan', 'Rencana satu pengiriman: nama file, folder, manifest, halaman, dan syarat agar berkas dihitung. Tanpa browser.'],
      ['delivery_record', 'Catat statement sebagai terkirim: cek berkas di disk, hitung halaman PDF, tambah ke manifest.']
    ]
  },
  {
    group: 'Berkas keluaran',
    items: [
      ['artifact_build_report', 'CSV → rencana laporan dengan tiap angka menyebut kolom dan baris asalnya; dicek ulang.'],
      ['artifact_build_workbook', 'CSV → Excel workbook: baris laporan, baris sumber, ledger yang menyebut baris penghasil tiap angka.'],
      ['artifact_build_slides', 'JSON → PowerPoint; slide yang menyebut angka yang tidak ada di laporan ditolak.'],
      ['artifact_build_document', 'JSON → Word; tiap graph menyebut bagian dan baris asalnya; dicek ulang sebelum ditulis.']
    ]
  },
  {
    group: 'Dompet',
    items: [
      ['wallet_pair_device', 'Pasangkan mesin ini dengan akun yang membayar pekerjaannya; kode dari dashboard. Token = otoritas penuh mesin ini ke wallet Anda.'],
      ['wallet_get_balance', 'Baca saldo wallet, dan tersedia setelah hold tugas berjalan.'],
      ['wallet_get_price', 'Harga satu pekerjaan sebelum mulai; tampilkan ke pemiliknya, minta persetujuan.'],
      ['wallet_add_funds', 'Buka halaman isi ulang; saldo bertambah saat provider mengonfirmasi, bukan saat panggilan kembali.'],
      ['wallet_hold_price', 'Tahan harga satu pekerjaan sebelum mulai; gagal = ditolak.'],
      ['wallet_charge', 'Tagih harga pekerjaan yang selesai; hash sha256 artefak adalah satu-satunya yang keluar dari mesin ini.'],
      ['wallet_refund', 'Kembalikan seluruh harga pekerjaan yang tidak selesai, dengan satu baris alasan.']
    ]
  }
];

const CONFIGS: Array<{ id: string; title: string; body: string }> = [
  { id: 'cfg-opencode', title: 'OpenCode', body: '{\n  "mcp": {\n    "corbin": {\n      "type": "local",\n      "command": "opera-agent-mcp",\n      "args": ["local"]\n    }\n  }\n}' },
  { id: 'cfg-kilo', title: 'Kilo Code', body: '{\n  "mcpServers": {\n    "corbin": {\n      "command": "opera-agent-mcp",\n      "args": ["local"]\n    }\n  }\n}' },
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
          <p>45 tool, semuanya berawalan <code>browser_</code>, di atas 36 primitive browser. Tugas masing-masing:</p>
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
