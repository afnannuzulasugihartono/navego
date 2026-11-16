import { Link } from 'react-router';
import { CommandPreview } from '../components/CommandPreview';

export function meta() {
  return [
    { title: 'Corbin — AI untuk browser Anda' },
    { name: 'description', content: 'Corbin menjalankan browser Anda dari satu perintah teks. Membaca halaman, mengisi formulir, menyimpan hasilnya sebagai berkas. 45 tool MCP, 36 primitive browser, 6 izin.' }
  ];
}

const ARTEFAK = [
  { name: 'laporan-keuangan-2026-09.xlsx', note: 'Excel · 3 sheet', hash: 'a4f12765b77329eb' },
  { name: 'rencana-strategis-2027.pptx', note: 'PowerPoint · 5 slide', hash: '90711468da9fe631' },
  { name: 'riset-promo.docx', note: 'Word · 13 blok', hash: '1758824cd0cf0b15' },
  { name: 'rencana-pemasaran-2027.docx', note: 'Word · 13 blok', hash: '104e43eac8e80e186' }
];

const CARA = [
  { title: 'Satu perintah', body: 'Anda menulis kalimat dalam bahasa sendiri. Tidak ada API per situs, tidak ada skrip yang Anda pasang.' },
  { title: 'Browser Anda bergerak', body: 'Corbin membaca tab yang Anda tunjuk, mencari kolom dan tombol, lalu mengisi atau mengkliknya.' },
  { title: 'Berkas mendarat', body: 'Hasilnya file nyata di folder Anda. Nama file, isi, dan asal angkanya bisa Anda periksa.' }
];

const FAQ = [
  { q: 'Apakah Corbin membaca semua tab saya?', a: 'Tidak. Corbin hanya bekerja pada tab yang Anda tunjuk lewat tabId. Halaman pribadi dan chrome:// ditolak.' },
  { q: 'Apakah kata sandi boleh diketik agen?', a: 'Tidak. Kolom kata sandi, kode sekali pakai, dan data pembayaran selalu ditolak. Anda menyelesaikan masuk di browser Anda sendiri.' },
  { q: 'Apa yang dipasang di komputer saya?', a: 'Ekstensi MV3 dan driver lokal. Data halaman tidak dikirim ke server kami; kunci model tetap di browser Anda.' }
];

export default function Beranda() {
  return (
    <main>
      <section className="cf-hero" aria-labelledby="judul-beranda">
        <div className="cf-wrap cf-hero-grid">
          <div>
            <h1 id="judul-beranda" className="cf-enter">Corbin.<br />AI browser.</h1>
            <p className="cf-lede cf-enter">Asisten AI yang menjalankan browser Anda dari satu perintah.</p>
            <div className="cf-hero-actions cf-enter">
              <Link className="cf-button" to="/unduh.html">Pasang gratis</Link>
              <span className="cf-spec"><strong>45 tool</strong> MCP · gratis untuk mulai</span>
            </div>
          </div>
<<<<<<< HEAD
          <figure className="hero-frame">
            <img src="/assets/raven-1874.jpg" width={1454} height={852} alt="Sketsa Corvus corax oleh Naumann" loading="eager" />
            <figcaption><em>Corvus corax</em> — setelah Naumann, 1874 · public domain</figcaption>
            <span className="burst" aria-hidden="true">Pasang<br />gratis!</span>
          </figure>
        </section>

        <section className="chapter" aria-labelledby="demoTitle">
          <Reveal>
            <h2 id="demoTitle" className="chapter-title">Satu perintah, satu berkas.</h2>
            <p className="chapter-note">Rekaman September dari Sinar Jaya: 23 baris kas masuk, dan Rp 65.310.000 keluar sebagai laporan tiga sheet. Angkanya asli; berkasnya bisa Anda unduh.</p>
            <DemoCorbin />
          </Reveal>
        </section>

        <div className="facts facts--center" aria-label="Angka produk">
          <span><b>45</b> tool MCP diukur dari source</span>
          <span><b>36</b> primitive browser</span>
          <span><b>6</b> izin, semua dijelaskan</span>
        </div>

        <section className="chapter warm" aria-labelledby="workTitle">
          <Reveal>
            <h2 id="workTitle" className="chapter-title">Laporan keuangan September.</h2>
            <p className="chapter-note">Empat berkas keluar dari satu file kas: laporan keuangan, rencana strategis, riset promo, dan rencana pemasaran. Semuanya bisa Anda buka sekarang, tanpa memasang apa pun.</p>
            <p className="chapter-note"><Link to="/studi.html">Lihat studi kasus lengkapnya →</Link></p>
          </Reveal>
        </section>

        <section id="fitur" className="chapter" aria-labelledby="featuresTitle">
          <Reveal>
            <h2 id="featuresTitle" className="chapter-title">Lima hal yang<br />dikerjakan Corbin.</h2>
            <div className="feature-list">
              {FEATURES.map(([title, body]) => (
                <div key={title} className="feature-row">
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section id="harga" className="chapter dark" aria-labelledby="pricingTitle">
          <Reveal>
            <h2 id="pricingTitle" className="chapter-title light-title">Dua cara bayar.</h2>
            <p className="chapter-note light-title" style={{ marginTop: 0 }}>Satu harga per pekerjaan selesai. Biaya model dari saldo Anda.</p>
            <div className="plans">
              <div className="plan">
                <p className="plan-name">Isi saldo</p>
                <p className="plan-price">Rp10.000<small> minimal, sekali isi</small></p>
                <p className="plan-meta">Bayar per pekerjaan yang benar-benar selesai — harga tampil sebelum mulai. Gagal? Saldo kembali penuh.</p>
=======
          <div className="cf-counter cf-enter" data-ui>
            {ARTEFAK.map((file) => (
              <div className="cf-artefact cf-crossfade" key={file.name}>
                <b>{file.name}</b>
                <span>{file.note}</span>
                <code>sha256 {file.hash}…</code>
>>>>>>> origin/main
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cf-intro" aria-label="Apa yang dilakukan Corbin">
        <div className="cf-wrap">
          <img className="cf-raven" src="/assets/raven-1874.jpg" alt="Corvus corax, gambar Naturalis tahun 1874" width="180" height="140" />
          <p className="cf-enter">Anda menulis satu kalimat. Corbin membaca halaman, mengisi kolom, lalu menyimpan hasilnya sebagai berkas. Browser Anda tetap browser Anda.</p>
        </div>
      </section>

      <section className="cf-section cf-wrap" aria-labelledby="judul-coba">
        <div className="cf-section-head">
          <h2 id="judul-coba" className="cf-enter">Coba bayangkan perintahnya.</h2>
          <p className="cf-enter">Pilih contoh atau tulis sendiri. Corbin menunjukkan langkah yang akan diambil — tanpa menjalankan browser Anda di sini.</p>
        </div>
        <CommandPreview />
      </section>

      <section className="cf-section" aria-labelledby="judul-cara">
        <div className="cf-wrap">
          <div className="cf-section-head">
            <h2 id="judul-cara" className="cf-enter">Dari kalimat ke berkas.</h2>
            <p className="cf-enter">Tiga langkah, tanpa alat tambahan di setiap situs.</p>
          </div>
          <div className="cf-steps">
            {CARA.map((item) => (
              <div className="cf-step cf-enter" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cf-section cf-bleed" aria-labelledby="judul-bukti">
        <div className="cf-wrap cf-proof">
          <div>
            <h2 id="judul-bukti" className="cf-enter">Bukti bisa dibuka.</h2>
            <p className="cf-proof-figure cf-enter">23 baris<br />Rp 65.310.000</p>
            <p className="cf-enter">Larian September 2026 menghasilkan empat berkas. Angka dan hash-nya ada di halaman bukti, bisa Anda cocokkan sendiri.</p>
            <p className="cf-enter"><Link className="cf-button" to="/bukti.html">Periksa buktinya</Link></p>
          </div>
          <ul className="cf-proof-list cf-enter" data-ui>
            {ARTEFAK.map((file) => <li key={file.name}><span>{file.name}</span><code>{file.hash}…</code></li>)}
          </ul>
        </div>
      </section>

      <section className="cf-section cf-wrap" aria-labelledby="judul-harga">
        <div className="cf-section-head">
          <h2 id="judul-harga" className="cf-enter">Harga terbuka.</h2>
          <p className="cf-enter">Mulai gratis. Bayar saat pekerjaan selesai, bukan per klik.</p>
        </div>
        <div className="cf-price">
          <div className="cf-plan cf-enter">
            <h3>plan.pilot</h3>
            <p className="cf-plan-price">Gratis</p>
            <ul><li>200 perintah per hari</li><li>50 per sesi</li><li>36 primitive browser</li></ul>
          </div>
          <div className="cf-plan cf-enter">
            <h3>plan.firm</h3>
            <p className="cf-plan-price">Rp 249.000</p>
            <ul><li>5.000 perintah per hari</li><li>500 per sesi</li><li>Rp 10.000 per client-month berikutnya</li></ul>
          </div>
        </div>
      </section>

      <section className="cf-section cf-wrap" aria-labelledby="judul-tanya">
        <div className="cf-section-head">
          <h2 id="judul-tanya" className="cf-enter">Yang sering ditanyakan.</h2>
          <p className="cf-enter">Jawaban singkat; rincian ada di dokumentasi.</p>
        </div>
        <div className="cf-faq">
          {FAQ.map((item) => (
            <details className="cf-enter" key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
        <p className="cf-enter" style={{ marginTop: 48 }}>
          <Link className="cf-button" to="/unduh.html">Pasang Corbin</Link>
        </p>
      </section>
    </main>
  );
}
