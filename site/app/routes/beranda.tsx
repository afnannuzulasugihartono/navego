import { Link } from 'react-router';
import { seoMeta } from '../lib/seo.js';
import { CommandPreview } from '../components/CommandPreview';
import { SiteHeader, SiteFooter } from '../components/Chrome';

export function meta() {
  return seoMeta({
    title: 'Navego — AI untuk browser Anda',
    description: 'Navego menjalankan browser Anda dari satu perintah teks. Membaca halaman, mengisi formulir, menyimpan hasilnya sebagai berkas. 45 tool MCP, 36 primitive browser, 6 izin.',
    path: '/beranda'
  });
}

const ARTEFAK = [
  { name: 'laporan-keuangan-2026-09.xlsx', note: 'Excel · 3 sheet', hash: 'a4f12765b77329eb' },
  { name: 'rencana-strategis-2027.pptx', note: 'PowerPoint · 5 slide', hash: '90711468da9fe631' },
  { name: 'riset-promo.docx', note: 'Word · 13 blok', hash: '1758824cd0cf0b15' },
  { name: 'rencana-pemasaran-2027.docx', note: 'Word · 13 blok', hash: '104e43eac8e80e186' }
];

const CARA = [
  { title: 'Satu perintah', body: 'Anda menulis kalimat dalam bahasa sendiri. Tidak ada API per situs, tidak ada skrip yang Anda pasang.' },
  { title: 'Browser Anda bergerak', body: 'Navego membaca tab yang Anda tunjuk, mencari kolom dan tombol, lalu mengisi atau mengkliknya.' },
  { title: 'Berkas mendarat', body: 'Hasilnya berkas nyata di folder Anda. Nama file, isi, dan asal angkanya bisa Anda periksa.' }
];

const FAQ = [
  { q: 'Apakah Navego membaca semua tab saya?', a: 'Tidak. Navego hanya bekerja pada tab yang Anda tunjuk lewat tabId. Halaman pribadi dan chrome:// ditolak.' },
  { q: 'Apakah kata sandi boleh diketik agen?', a: 'Tidak. Kolom kata sandi, kode sekali pakai, dan data pembayaran selalu ditolak. Anda menyelesaikan masuk di browser Anda sendiri.' },
  { q: 'Apa yang dipasang di komputer saya?', a: 'Ekstensi MV3 dan driver lokal. Data halaman tidak dikirim ke server kami; kunci model tetap di browser Anda.' }
];

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Navego',
  operatingSystem: 'Windows, macOS, Linux',
  applicationCategory: 'BrowserApplication',
  description: 'Asisten AI yang menjalankan browser Anda dari satu perintah teks — membaca halaman, mengisi formulir, menyimpan hasilnya sebagai berkas.',
  url: 'https://navego.pages.dev/beranda',
  downloadUrl: 'https://navego.pages.dev/unduh',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'IDR' },
  inLanguage: 'id',
  author: { '@type': 'Person', name: 'afnannuzulasugihartono' }
};

export default function Beranda() {
  return (
    <>
      <SiteHeader />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

        <section className="hero" aria-labelledby="judul-beranda">
          <div className="wrap hero-grid">
            <div>
              <p className="kicker">Agentic browser · lokal</p>
              <h1 id="judul-beranda">Navego.<br />AI browser.</h1>
              <p className="lede">Asisten AI yang menjalankan browser Anda dari satu perintah teks.</p>
              <div className="hero-cta">
                <Link className="btn btn-solid" to="/unduh.html">Pasang gratis</Link>
                <span className="spec"><strong>45 tool MCP</strong> — gratis untuk mulai, tanpa kartu.</span>
              </div>
            </div>
            <div className="hero-counter" aria-hidden="true">
              {ARTEFAK.map((file) => (
                <div className="hero-artefact" key={file.name}>
                  <b>{file.name}</b>
                  <span>{file.note}</span>
                  <code>sha256 {file.hash}…</code>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Apa ini</p>
                <h2 className="section-title">Anda menulis satu kalimat. Navego membaca halaman, mengisi kolom, lalu menyimpan hasilnya sebagai berkas.</h2>
              </div>
              <p className="section-note">Browser Anda tetap browser Anda. Halaman tidak pernah pergi ke server kami — kunci model tetap di mesin Anda.</p>
            </div>
            <ol className="steps">
              {CARA.map((item) => (
                <li key={item.title}>
                  <div>
                    <h3 style={{ fontSize: 'var(--text-lg)', color: 'var(--navy-deep)', marginBottom: 'var(--s-2)' }}>{item.title}</h3>
                    <p style={{ color: 'var(--muted-2)' }}>{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section" aria-labelledby="judul-coba">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Coba</p>
                <h2 id="judul-coba" className="section-title">Coba bayangkan perintahnya.</h2>
              </div>
              <p className="section-note">Pilih contoh atau tulis sendiri. Navego menunjukkan langkah yang akan diambil — tanpa menjalankan browser Anda di sini.</p>
            </div>
            <CommandPreview />
          </div>
        </section>

        <section className="section" aria-labelledby="judul-harga">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Harga</p>
                <h2 id="judul-harga" className="section-title">Mulai gratis.</h2>
              </div>
              <p className="section-note">Bayar saat pekerjaan selesai, bukan per klik. <Link to="/harga.html">Lihat harga lengkap →</Link></p>
            </div>
            <div className="plans">
              <div className="card plan">
                <p className="plan-name">plan.pilot</p>
                <p className="plan-price">Gratis</p>
                <ul><li>200 perintah per hari</li><li>50 per sesi</li><li>36 primitive browser</li></ul>
              </div>
              <div className="card plan is-primary">
                <p className="plan-name">plan.firm · paling dipilih</p>
                <p className="plan-price">Rp 249.000 <small>/ 30 hari</small></p>
                <ul><li>5.000 perintah per hari</li><li>500 per sesi</li><li>saldo top-up Rp 10.000 / client-month</li></ul>
              </div>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="judul-tanya">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">FAQ</p>
                <h2 id="judul-tanya" className="section-title">Yang sering ditanyakan.</h2>
              </div>
            </div>
            <div className="faq">
              {FAQ.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
            <div className="hero-cta" style={{ marginTop: 'var(--s-6)' }}>
              <Link className="btn btn-solid" to="/unduh.html">Pasang Navego</Link>
              <a className="btn btn-ghost" href="https://wa.me/?text=Navego%20%E2%80%94%20AI%20yang%20menjalankan%20browser%20Anda%20dari%20satu%20perintah%3A%20https%3A%2F%2Fnavego.pages.dev%2Fberanda" target="_blank" rel="noreferrer">Bagikan ke teman</a>
              <a className="btn btn-ghost" href="https://t.me/share/url?url=https%3A%2F%2Fnavego.pages.dev%2Fberanda&text=Navego%20%E2%80%94%20AI%20yang%20menjalankan%20browser%20Anda%20dari%20satu%20perintah" target="_blank" rel="noreferrer">Bagikan di Telegram</a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
