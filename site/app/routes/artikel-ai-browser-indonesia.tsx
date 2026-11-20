// decisions.json -> D35, D36 (no eyebrows, h1 first)

import { Link } from 'react-router';
import { seoMeta } from '../lib/seo.js';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return seoMeta({
    title: 'AI yang mengenal browser Anda, dalam bahasa Indonesia — Opera',
    description: 'Kenapa asisten AI harus dijalankan di browser Anda sendiri — bukan di server orang lain — dan bagaimana Opera bekerja tanpa browser otomatis di cloud.',
    path: '/artikel/ai-browser-indonesia'
  });
}

const TOC = [
  ['#sandbox', 'Browser Anda bukan sandbox'],
  ['#luar', 'Bukan otomasi dari luar'],
  ['#beda', 'Dua hal yang berbeda'],
  ['#bahasa', 'Bahasa Indonesia, bukan terjemahan'],
  ['#batas', 'Yang belum bisa, jujur']
] as const;

export default function AiBrowserIndonesia() {
  return (
    <>
      <SiteHeader current="/artikel" />
      <article>
        <header className="article-hero">
          <div className="wrap">
            <h1>AI yang mengenal browser Anda, dalam bahasa Indonesia.</h1>
            <p className="lede" style={{ marginTop: 'var(--s-4)', fontSize: 'var(--text-lg)', maxWidth: '56ch', color: 'var(--muted-2)' }}>Asisten AI yang mengambil alih browser bukan hal baru. Yang jarang dibicarakan: di mana asisten itu seharusnya berjalan.</p>
            <p className="article-meta"><span>18 November 2026</span><span>8 menit baca</span><span>Opera</span></p>
          </div>
        </header>

        <div className="wrap article-layout">
          <nav className="article-toc" aria-label="Di artikel ini">
            {TOC.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
          </nav>

          <div className="article-body">
            <h2 id="sandbox">Browser Anda bukan sandbox.</h2>
            <p>Asisten di server orang lain mulai dari nol. Tanpa cookies Anda. Tanpa histori. Tanpa sesi aplikasi kerja Anda. Kredensial Anda bukan bahan bakar asisten itu.</p>
            <p>Asisten yang benar-benar berguna harus melihat halaman yang sama dengan Anda: portal karyawan, dasbor internal, spreadsheet langganan. Semua itu hidup di satu tempat — browser Anda.</p>

            <div className="callout"><strong>Poinnya.</strong> Keunggulan bukan model yang lebih pintar; keunggulan adalah konteks yang sudah ada di browser Anda.</div>

            <h2 id="luar">Bukan otomasi dari luar.</h2>
            <p>Solusi lain memasang Chrome baru di server. Skrip ditulis di muka untuk tiap situs. Bekerja sampai tata letak berubah — lalu berhenti diam-diam.</p>
            <p>Opera memakai browser Anda, dengan sesi yang sudah ada. Halaman dibaca apa adanya. Kolom ditemukan dari label. Tindakan dilakukan terhadapnya.</p>

            <div className="pull">Yang dibaca struktur halaman, bukan alamat tetap. Itu yang membuat satu perintah berlaku di situs yang belum pernah dilihat.</div>

            <h2 id="beda">Dua hal yang berbeda.</h2>
            <ul>
              <li><strong>Tab yang Anda tunjuk, bukan semua tab.</strong> Kerja hanya pada <code>tabId</code> yang Anda sebut. Halaman pribadi dan <code>chrome://</code> ditolak.</li>
              <li><strong>Kata sandi bukan bahan bakar.</strong> Kolom password, kode sekali pakai, PIN, dan kartu selalu ditolak. Asisten berhenti dan menunggu Anda.</li>
              <li><strong>Hasil berupa berkas.</strong> Pekerjaan berakhir sebagai <code>.xlsx</code>, <code>.docx</code>, <code>.pptx</code>, atau <code>.csv</code> — bukan jawaban di layar yang harus Anda salin.</li>
              <li><strong>Harga sebelum mulai.</strong> Semua harga plan tampil di halaman Harga sebelum Anda membayar; tidak ada tagihan tersembunyi per pekerjaan.</li>
            </ul>

            <figure className="figure">
              <div className="diagram">
                <span className="node">Perintah Anda</span>
                <span className="arrow">→</span>
                <span className="node">Tab yang ditunjuk</span>
                <span className="arrow">→</span>
                <span className="node">Berkas di folder</span>
              </div>
              <figcaption>Satu alur, tiga titik yang bisa Anda periksa sendiri.</figcaption>
            </figure>

            <h2 id="bahasa">Bahasa Indonesia, bukan terjemahan.</h2>
            <p>Pengguna pertama produk ini bekerja di kantor Indonesia: portal, dasbor, spreadsheet, dan dokumen berbahasa Indonesia. Memerintah asisten dalam bahasa kedua menambah gesekan yang tidak perlu.</p>

            <h2 id="batas">Yang belum bisa, jujur.</h2>
            <p>Opera belum berjalan di Firefox dan Safari — fitur yang dibutuhkan ekstensi tidak tersedia di sana. Extension-nya juga belum ada di Chrome Web Store; pemasangan sementara lewat Load unpacked atau satu klik di Windows lewat berkas kebijakan yang dijelaskan di <Link to="/unduh">halaman Unduh</Link>.</p>
            <p>Ini alat yang sedang tumbuh. Batasannya disebutkan apa adanya, bukan disembunyikan di halaman syarat.</p>

            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--s-5)', flexWrap: 'wrap', marginTop: 'var(--s-7)' }}>
              <div>
                <h2 style={{ margin: 0 }}>Coba sendiri.</h2>
                <p style={{ color: 'var(--muted-2)' }}>Pasang, tunjuk satu tab, tulis satu perintah.</p>
              </div>
              <Link className="btn btn-solid" to="/unduh">Pasang gratis</Link>
            </div>
          </div>
        </div>
      </article>
      <SiteFooter />
    </>
  );
}
