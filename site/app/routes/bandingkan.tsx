// decisions.json -> D35, D36 (no eyebrows, h1 first)

import { Link } from 'react-router';
import { seoMeta } from '../lib/seo.js';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return seoMeta({
    title: 'Bandingkan — Navego',
    description: 'Kejujuran membandingkan: apa yang bisa WebDriver/Selenium dan tidak bisa Navego, apa yang bisa Navego dan tidak bisa tool generik — sebelum Anda memilih.',
    path: '/bandingkan'
  });
}

const ROWS: Array<[dimensi: string, navego: string, webdriver: string, generik: string]> = [
  ['Cara kerja', '36 primitive tervalidasi di atas browser Anda; 40 tool MCP di atasnya', 'Protokol penuh (Chrome DevTools/WebDriver) — akses ke semuanya, termasuk kata sandi', 'Bervariasi per produk; biasanya kontrol jarak jauh lengkap'],
  ['Aplikasi canvas (Google Docs, Sheets)', 'Bisa — diukur di halaman asli: settle p50 ~46 ms, read ~2 ms', 'Sulit — tidak ada DOM untuk diisi atau dibaca', 'Sebagian besar tidak bisa; dokumen canvas tidak punya elemen untuk diklik'],
  ['Kata sandi & PIN', 'Selalu ditolak, di kode, bukan di kebijakan', 'Bisa membaca dan mengisi apa pun di halaman', 'Bervariasi; banyak yang mengisi semuanya demi "berhasil"'],
  ['Tab pribadi', 'Ditolak di setiap gerbang', 'Bisa disentuh kalau driver-nya dibuka di sana', 'Bervariasi'],
  ['Skrip dari halaman', 'Tidak pernah — isolated world, extension tidak membaca JS halaman', 'N/A — kendali dari luar, bukan dari halaman', 'Bervariasi'],
  ['Isi file upload', 'Tidak pernah', 'Bisa', 'Bervariasi'],
  ['Berbasis apa', 'Ekstensi + loopback bridge + npm', 'Server + driver + skrip yang Anda tulis', 'Ekstensi + layanan vendor'],
  ['Harga', 'USD sekali beli: $1–$33', 'Gratis (open source) — Anda menulis dan memeliharanya', 'Bervariasi; umumnya langganan'],
  ['Kegagalan', 'Gagal dengan nama: kode error, alasan, bukti', 'Gagal diam-diam atau skrip mati', 'Bervariasi'],
  ['Verifikasi', 'Angka settle/read/click tersedia di Metodologi; klaim dipin tes', 'Deterministik kalau Anda menulis tesnya', 'Rata-rata tidak dipublikasikan']
];

export default function Bandingkan() {
  return (
    <>
      <SiteHeader current="/bandingkan" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <h1>Di mana Navego berdiri.</h1>
            <p className="lede">Bukan tabel yang menulis menakut-nakuti. Dua pendekatan lain punya tempatnya — ini perbandingannya apa adanya.</p>
          </div>
        </section>

        <section className="band" aria-labelledby="tabelTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="tabelTitle" className="section-title">Navego vs WebDriver vs ekstensi AI generik.</h2>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>Dimensi</th><th>Navego</th><th>WebDriver/Selenium</th><th>Ekstensi AI generik</th></tr>
                </thead>
                <tbody>
                  {ROWS.map(([dim, a, b, c]) => (
                    <tr key={dim}>
                      <td><strong>{dim}</strong></td>
                      <td>{a}</td>
                      <td>{b}</td>
                      <td>{c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="section-note" style={{ marginTop: 'var(--s-4)' }}>
              Tabel ini soal kelas pendekatan, bukan klaim. Kami tidak menguji produk orang lain.
              Kalau Anda butuh regresi UI yang identik setiap malam, WebDriver lebih tepat. Kalau Anda butuh asisten yang bisa diajak bicara
              untuk pekerjaan berantakan sehari-hari — formulir, portal, berkas — itu wilayah Navego.
            </p>
          </div>
        </section>

        <section className="band">
          <div className="wrap">
            <div className="cta-band">
              <h2 className="section-title" style={{ color: '#ffffff' }}>Sudah tahu yang Anda butuhkan?</h2>
              <p>Unduh Navego dan buktikan di halaman nyata Anda — portals, portal HR, dokumen milik Anda.</p>
              <div className="hero-cta" style={{ marginTop: 'var(--s-2)' }}>
                <Link className="btn btn-solid" to="/unduh">Unduh Navego</Link>
                <Link className="btn btn-ghost" to="/metodologi">Lihat angkanya</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
