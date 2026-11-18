import { Link } from 'react-router';
import { seoMeta } from '../lib/seo.js';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return seoMeta({
    title: 'Metodologi — Navego',
    description: 'Cara Navego mengukur dirinya: halaman nyata (Google Docs, Sheets, YouTube), n=30 per operasi, P50/P95, dan daftar jujur tentang apa yang belum diukur.',
    path: '/metodologi'
  });
}

const CARA = [
  ['Halaman nyata', 'Google Docs, Sheets, dan YouTube yang benar-benar dibuka — bukan fixture kosong yang berbohong halus. Contoh nyata: halaman YouTube melaporkan readyState complete di 871 karakter, dan jadi 8.478 dua detik kemudian.'],
  ['n=30, P50/P95', 'Setiap operasi diukur 30 kali di mesin dan halaman yang sama. Yang tampil adalah p50 dan p95 — bukan rata-rata yang menutupi lonjakan.'],
  ['Fixture 100 baris', 'Headless Chrome dengan dokumen 100 baris: pengukuran settle, read, click, dan stream berulang secara deterministik sebelum dan sesudah tiap perubahan.'],
  ['Tab tersembunyi itu nyata', 'Tab yang disembunyikan meng-clamp timer halaman. Jebakan ini tercatat (p50 998 ms untuk settle yang tampak benar) dan melahirkan bentuk settle yang jam-nya berada di Node, bukan di halaman.'],
  ['Klaim dipin oleh tes', 'Angka di dokumentasi tidak berdiri sendiri: tes di repositori yang gagal ketika kenyataan berubah — itu yang dimaksud dengan mengukur, bukan mengklaim.']
] as const;

const TERUKUR = [
  ['Pengendapan halaman (settle)', '41.55 → 0.47 ms', 'settle menunggu MutationObserver yang sudah aktif, bukan re-arm setiap kali'],
  ['Baca halaman (read)', '40.42 → 1.51 ms', 'sampel kedua menunggu observer yang sama, bukan jendela diam 100 ms tetap'],
  ['Klik (click)', '42.62 → 5.21 ms', 'settle setelah klik adalah satu putaran, bukan jendela diam baru'],
  ['Tekan tombol (press)', '107.24 → 76.43 ms', 'KEY_BEAT_MS 50 ms → 16 ms, satu frame 60 Hz'],
  ['Stream satu chord', '1.987 s → 153 ms', 'stream menunggu settle satu kali, bukan dua belas polling 150 ms'],
  ['Satu burst, tiga langkah', '76.83 ms', 'satu settle dan satu pembacaan halaman di akhir — bukan per langkah'],
  ['Docs asli, settle', 'p50 45.78 / p95 46.71 ms', 'tab Docs yang masih terbuka, tanpa edit, tanpa navigasi'],
  ['Sheets asli, settle', 'p50 45.94 / p95 47.21 ms', 'tab Sheets yang masih terbuka, tanpa edit, tanpa navigasi'],
  ['Tab tersembunyi', '998.93 → 45.78 ms', 'jam settle pindah dari halaman (di-clamp timer) ke Node']
] as const;

export default function Metodologi() {
  return (
    <>
      <SiteHeader current="/metodologi" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <p className="crumb">Metodologi</p>
            <h1>Diukur, bukan diklaim.</h1>
            <p className="lede">Angka di halaman ini datang dari mesin nyata dan halaman nyata — dan daftar hal yang belum diukur ada di bagian bawah, dengan sengaja.</p>
          </div>
        </section>

        <section className="band" aria-labelledby="caraTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Cara mengukur</p>
                <h2 id="caraTitle" className="section-title">Lima aturan kerja, selalu sama.</h2>
              </div>
            </div>
            <div className="value-grid">
              {CARA.map(([title, body]) => (
                <div className="value-card" key={title}>
                  <b>{title}</b>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="band band-soft" aria-labelledby="terukurTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Yang sudah diukur</p>
                <h2 id="terukurTitle" className="section-title">Sebelum dan sesudah, satu mesin.</h2>
              </div>
              <p className="section-note">Data penuh: <a href="https://github.com/afnannuzulasugihartono/navego/blob/main/docs/product/browser-latency.md" rel="noreferrer">docs/product/browser-latency.md</a></p>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>Operasi</th><th>Hasil</th><th>Apa yang berubah</th></tr>
                </thead>
                <tbody>
                  {TERUKUR.map(([op, result, why]) => (
                    <tr key={op}>
                      <td>{op}</td>
                      <td className="num">{result}</td>
                      <td>{why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="band" aria-labelledby="belumTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Yang belum diukur</p>
                <h2 id="belumTitle" className="section-title">Jujur soal batasnya.</h2>
              </div>
            </div>
            <div className="faq">
              <details open id="maps">
                <summary>Google Maps belum di-benchmark</summary>
                <p>Maps masuk prioritas di peta jalan, tetapi angka settle dan read di atas halaman Maps belum ada. Yang ada: Docs, Sheets, dan sebagian bukti dari YouTube. Kami tidak menulis angka untuk yang belum diukur.</p>
              </details>
              <details id="youtube">
                <summary>YouTube baru sebagian</summary>
                <p>Terukur: 871 karakter saat readyState complete vs 8.478 dua detik kemudian — "complete" bukan tanda halaman selesai, dan itu alasan semua waits Navego berbasis settle. Alur penuh YouTube belum memiliki tabel latency tersendiri.</p>
              </details>
              <details id="remote">
                <summary>Angka "remote MCP" adalah sejarah</summary>
                <p>Angka ~380 ms per perintah melewati hosted MCP yang sudah dihapus dari pohon kode (2026-11-14). Jalan yang hidup adalah <code>navego local</code>; tabel di <a href="https://github.com/afnannuzulasugihartono/navego/blob/main/docs/mcp-latency.md" rel="noreferrer">docs/mcp-latency.md</a> bernilai untuk jalan yang sudah dipensiunkan itu.</p>
              </details>
              <details id="paypal">
                <summary>PayPal sandbox belum dituntaskan end-to-end</summary>
                <p>Webhook PayPal sudah terdaftar dan kredensial sandbox sudah diset, tetapi satu pembelian sandbox penuh (order → capture → webhook → aktivasi plan) belum dirampungkan. Modul dan wiring-nya dipin tes; klaim "otomatis aktif" menunggu bukti itu.</p>
              </details>
            </div>
            <p className="section-note" style={{ marginTop: 'var(--s-4)' }}>Dan semuanya bergerak: setiap angka di sini diukur pada mesin tertentu di tanggal tertentu. Rerun yang jujur berpindah ratusan milidetik — itu sebabnya halaman ini menyebut kapan diukur.</p>
          </div>
        </section>

        <section className="band">
          <div className="wrap">
            <div className="cta-band">
              <h2 className="section-title" style={{ color: '#ffffff' }}>Lihat hasilnya di browser Anda.</h2>
              <p>Satu perintah, satu berkas — lalu Anda yang menilai, bukan kami.</p>
              <div className="hero-cta" style={{ marginTop: 'var(--s-2)' }}>
                <Link className="btn btn-solid" to="/unduh">Unduh Navego</Link>
                <Link className="btn btn-ghost" to="/docs#tugas">Tugas pertama</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
