// decisions.json -> D35, D36, D37 (no eyebrows, h1 first, commas not middle dots)

import { Link } from 'react-router';
import { seoMeta } from '../lib/seo.js';
import { CommandPreview } from '../components/CommandPreview';
import { SiteHeader, SiteFooter } from '../components/Chrome';

export function meta() {
  return seoMeta({
    title: 'Navego — AI untuk browser Anda',
    description: 'Satu perintah, browser Anda bekerja. Navego membaca tab yang Anda tunjuk, mengisi kolom, lalu menyimpan hasilnya sebagai berkas nyata. 45 tool MCP, 36 primitive browser, 6 izin.',
    path: '/beranda'
  });
}

const LANGKAH = [
  { title: 'Tunjuk tab', body: 'Satu tab, satu izin. Halaman lain tidak pernah dibaca.' },
  { title: 'Tulis perintah', body: 'Bahasa Anda sendiri. Tanpa skrip per situs, tanpa API per halaman.' },
  { title: 'Ambil berkas', body: 'Hasil nyata di folder Anda: .xlsx, .docx, .pptx, atau .csv.' }
];

const KEMAMPUAN = [
  { title: 'Baca halaman', body: 'Judul, teks, dan struktur tab yang Anda sebut.' },
  { title: 'Isi formulir', body: 'Kolom ditemukan dari label, bukan alamat tetap.' },
  { title: 'Klik dan gulir', body: 'Tombol, menu, dan daftar yang bergulir ikut dijangkau.' },
  { title: 'Tunggu perubahan', body: 'Halaman yang memuat lama ditunggu, bukan ditebak.' },
  { title: 'Simpan berkas', body: 'Excel, Word, PowerPoint, dan CSV mendarat di folder Anda.' },
  { title: 'Verifikasi hasil', body: 'Setiap berkas membawa sidik jari SHA-256 sendiri.' }
];

const FAQ = [
  { q: 'Apakah Navego membaca semua tab saya?', a: 'Tidak. Hanya tab yang Anda tunjuk lewat tabId. Halaman pribadi dan chrome:// selalu ditolak.' },
  { q: 'Apakah kata sandi boleh diketik agen?', a: 'Tidak. Kolom kata sandi, kode sekali pakai, dan data pembayaran ditolak. Anda yang menyelesaikan masuk, di browser Anda sendiri.' },
  { q: 'Ke mana data halaman saya pergi?', a: 'Tidak ke server kami. Halaman dibaca di mesin Anda; kunci model tetap di browser Anda.' },
  { q: 'Apa yang dipasang di komputer saya?', a: 'Ekstensi MV3 dan driver lokal. Dua-duanya bisa Anda periksa sendiri, dan cabut kapan saja.' }
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

const Ikon = ({ name }: { name: string }) => {
  const paths: Record<string, string> = {
    tab: 'M4 4h16v16H4z M4 9h16',
    tulis: 'M4 20h4l10-10-4-4L4 16z',
    berkas: 'M6 3h8l4 4v14H6z M14 3v4h4',
    baca: 'M4 5h16v14H4z M8 9h8 M8 13h5',
    isi: 'M4 7h16 M4 12h16 M4 17h10',
    klik: 'M6 3l12 8-5 1 3 6-2 1-3-6-3 4z',
    tunggu: 'M12 7v5l3 2 M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z',
    simpan: 'M12 4v10 M8 10l4 4 4-4 M4 18h16',
    verifikasi: 'M4 12l5 5L20 6'
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
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
              <h1 id="judul-beranda">Satu perintah.<br />Browser Anda bekerja.</h1>
              <p className="lede">Navego membaca tab yang Anda tunjuk, mengisi kolom, mengklik tombol, lalu menyimpan hasilnya sebagai berkas.</p>
              <div className="hero-cta">
                <Link className="btn btn-solid" to="/unduh">Pasang gratis</Link>
                <span className="spec"><strong>45 tool MCP</strong> · gratis untuk mulai · tanpa kartu</span>
              </div>
            </div>
            <div className="demo-window" aria-hidden="true">
              <div className="demo-bar">
                <span className="demo-dots"><i /><i /><i /></span>
                <span className="demo-url">tab · portal.internal.id/laporan-kuartal</span>
              </div>
              <div className="demo-body">
                <p className="cmd-bubble"><small>Perintah Anda</small>Ringkas laporan ini, lalu simpan sebagai Excel.</p>
                <ul className="act-list">
                  <li className="act is-done"><i />Baca tab — 3 tabel ditemukan</li>
                  <li className="act is-done"><i />Isi 3 kolom, klik Ekspor</li>
                  <li className="act is-done"><i />Simpan ke folder Unduhan</li>
                </ul>
                <div className="file-grid">
                  <span className="file-chip"><b>✓</b>laporan-kuartal.xlsx</span>
                  <span className="file-chip"><b>✓</b>sha256 a4f12765…</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="judul-cara">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="judul-cara" className="section-title">Tiga langkah. Tanpa skrip.</h2>
              </div>
              <p className="section-note">Browser Anda tetap browser Anda. Halaman tidak pernah pergi ke server kami.</p>
            </div>
            <div className="tile-grid">
              {LANGKAH.map((item, index) => (
                <div className="tile" key={item.title}>
                  <span className="start-num">{index + 1}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
            <div className="stat-strip" style={{ marginTop: 'var(--s-6)' }}>
              <div className="stat"><b>45</b><span>tool MCP</span></div>
              <div className="stat"><b>36</b><span>primitive browser</span></div>
              <div className="stat"><b>6</b><span>izin, tidak lebih</span></div>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="judul-kemampuan">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="judul-kemampuan" className="section-title">Yang bisa dikerjakan di tab Anda.</h2>
              </div>
              <p className="section-note">Semua lewat primitive yang sama — bukan trik per situs. <Link to="/fitur">Lihat detail fitur →</Link></p>
            </div>
            <div className="tile-grid">
              {KEMAMPUAN.map((item, index) => (
                <div className="tile" key={item.title}>
                  <Ikon name={['baca', 'isi', 'klik', 'tunggu', 'simpan', 'verifikasi'][index] ?? 'baca'} />
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="judul-coba">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="judul-coba" className="section-title">Ketik perintahnya, lihat langkahnya.</h2>
              </div>
              <p className="section-note">Pratinjau alur, bukan eksekusi. Navego baru bergerak setelah terpasang di browser Anda.</p>
            </div>
            <CommandPreview />
          </div>
        </section>

        <section className="section" aria-labelledby="judul-harga">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="judul-harga" className="section-title">Satu dolar per bulan untuk mulai.</h2>
              </div>
              <p className="section-note">Bukan per klik, bukan langganan buta. <Link to="/harga">Bandingkan paket →</Link></p>
            </div>
            <div className="plans">
              <div className="card plan">
                <p className="plan-name">Starter</p>
                <p className="plan-price">$1<small> / bulan</small></p>
                <ul><li>1.000 perintah / hari</li><li>50 per sesi</li><li>PayPal</li></ul>
              </div>
              <div className="card plan is-primary">
                <p className="plan-name">Business</p>
                <p className="plan-price">$17<small> / 6 bulan</small></p>
                <ul><li>17.000 perintah / hari</li><li>500 per sesi</li><li>Semua fitur (statement, VM, remote drive) + prioritas</li></ul>
              </div>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="judul-tanya">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="judul-tanya" className="section-title">Pertanyaan yang sering muncul.</h2>
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
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="cta-band">
              <h2 className="section-title" style={{ color: '#ffffff' }}>Satu pekerjaan. Satu berkas.</h2>
              <p>Mulai dari tab Anda sendiri. Lima belas menit lagi, pekerjaan pertama bisa selesai tanpa Anda menyentuh satu kolom pun.</p>
              <div className="hero-cta" style={{ marginTop: 'var(--s-2)' }}>
                <Link className="btn btn-solid" to="/unduh">Pasang gratis</Link>
                <Link className="btn btn-ghost" to="/docs">Baca docs</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
