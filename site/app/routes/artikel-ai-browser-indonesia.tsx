import { Link } from 'react-router';
import { seoMeta } from '../lib/seo.js';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return seoMeta({
    title: 'AI yang mengenal browser Anda, dalam bahasa Indonesia — Navego',
    description: 'Kenapa asisten AI harus dijalankan di browser Anda sendiri — bukan di server orang lain — dan bagaimana Navego bekerja tanpa browser otomatis di cloud.',
    path: '/artikel/ai-browser-indonesia'
  });
}

export default function AiBrowserIndonesia() {
  return (
    <>
      <SiteHeader current="/artikel" />
      <article>
        <section className="page-hero">
          <div className="wrap">
            <p className="crumb">Artikel · 18 November 2026</p>
            <h1>AI yang mengenal browser Anda,<br />dalam bahasa Indonesia.</h1>
            <p className="lede">Asisten AI yang mengambil alih browser bukan hal baru. Yang baru — dan jarang dibicarakan — adalah di mana asisten itu seharusnya berjalan.</p>
          </div>
        </section>

        <div className="wrap docs-article" style={{ paddingBlock: 'var(--s-7)' }}>
          <h2>Browser Anda bukan sandbox.</h2>
          <p>Kalau asisten AI menjalankan Chrome di server orang lain, setiap sesi mulai dari nol: tidak ada cookies Anda, tidak ada histori, tidak ada sesi masuk ke aplikasi Anda — kecuali seseorang menyerahkan kredensialnya ke server itu, dan itu adalah bagian yang tidak akan hari ini juga Anda lakukan.</p>
          <p>Asisten yang benar-benar berguna harus melihat halaman yang sama yang Anda lihat: portal karyawan, dasbor internal, spreadsheet abonemen, feed sosial yang hanya Anda bisa akses. Satu-satunya tempat semua itu hidup adalah browser yang sedang Anda pakai.</p>

          <h2>Browser Anda bukan untuk diotomasi dari luar.</h2>
          <p>Hampir semua solusi browser-otomatis hari ini memasang Chrome barunya sendiri, mengisinya lewat protokol DevTools, lalu menjalankan skrip yang ditulis di muka untuk tiap situs. Itu bekerja sampai situs berubah tata letaknya, dan berhenti bekerja diam-diam.</p>
          <p>Navego berbeda dalam dua hal mendasar: ia memakai browser Anda — dengan semua sesi dan data yang sudah ada di sana — dan ia tidak menulis skrip per situs. Asisten membaca struktur halaman apa adanya, menemukan kolom yang dimaksud, lalu bertindak terhadapnya.</p>

          <h2>Tambahan yang tidak datang dari sekolah otomasi.</h2>
          <ul>
            <li><strong>Tab yang Anda tunjuk, bukan semua tab.</strong> Navego hanya bekerja pada tab yang Anda sebut, lewat <code>tabId</code>. Halaman pribadi dan <code>chrome://</code> ditolak.</li>
            <li><strong>Kata sandi bukan bahan bakar.</strong> Kolom password, kode sekali pakai, PIN, dan kartu selalu ditolak. Jika sebuah halaman meminta itu, asisten berhenti dan menunggu Anda menyelesaikannya sendiri.</li>
            <li><strong>Hasil berupa berkas.</strong> Pekerjaan berakhir sebagai <code>.xlsx</code>, <code>.docx</code>, <code>.pptx</code>, atau <code>.csv</code> di folder Anda — bukan sebagai jawaban di layar yang harus Anda salin manual.</li>
            <li><strong>Tagihan setelah hasil.</strong> Harga pekerjaan ditampilkan sebelum mulai; saldo hanya terpotong saat pekerjaan selesai. Jika gagal, dana kembali penuh.</li>
          </ul>

          <h2>Bahasa Indonesia, bukan terjemahan.</h2>
          <p>Produk ini berbahasa Indonesia karena pengguna pertamanya adalah orang Indonesia yang bekerja di kantor Indonesia: portal, dasbor, spreadsheet, dan dokumen yang memang ditulis dalam bahasa Indonesia. Memerintah asisten dalam bahasa kedua menambah gesekan yang tidak perlu.</p>

          <h2>Yang belum bisa, jujur.</h2>
          <p>Navego belum bisa berjalan di Firefox dan Safari (fitur yang dibutuhkan ekstensi ini tidak tersedia di sana). Extension-nya belum ada di Chrome Web Store — pemasangan sementara lewat Load unpacked atau satu klik di Windows lewat berkas kebijakan yang dijelaskan di <Link to="/unduh">halaman Unduh</Link>. Ini alat yang sedang tumbuh, dan batasannya disebutkan apa adanya.</p>

          <h2>Ke mana selanjutnya.</h2>
          <p>Jika Anda ingin melihat hasil nyatanya — berkas laporan keuangan, rencana strategis, riset promo yang dibuat oleh Navego sendiri — unduh contohnya dari <Link to="/docs">Docs</Link>. Jika Anda ingin mencoba, pasang dari <Link to="/unduh">halaman Unduh</Link>; lima belas menit dari sekarang, satu pekerjaan bisa selesai tanpa Anda menyentuh satu kolom pun.</p>
        </div>
      </article>
      <SiteFooter />
    </>
  );
}
