import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return [
    { title: 'Studi kasus — Navego' },
    { name: 'description', content: 'Sinar Jaya, September 2026. Satu file CSV jadi laporan keuangan, rencana strategis, riset promosi, dan rencana pemasaran. Setiap angka menyebut baris asalnya.' }
  ];
}

const FILES = [
  ['Laporan keuangan (.xlsx)', 'Tiga sheet: laporan, sumber angka, dan buku besar. Tiap angka menyebut baris yang menghasilkannya.', '/contoh/laporan-keuangan-2026-09.xlsx', 'Unduh .xlsx'],
  ['Rencana strategis (.pptx)', 'Satu sampul, lalu empat slide: posisi hari ini, tiga pilar 2027, di mana uangnya, dan rencana 90 hari.', '/contoh/rencana-strategis-2027.pptx', 'Unduh .pptx'],
  ['Riset promosi (.docx)', 'Ringkasan eksekutif, metode, hasil, dan batasan, dengan tabel per kanal.', '/contoh/riset-promo.docx', 'Unduh .docx'],
  ['Rencana pemasaran (.docx)', 'Tujuan, segmentasi, poin pembeda, rencana sembilan bulan, dan cara mengukur.', '/contoh/rencana-pemasaran-2027.docx', 'Unduh .docx']
] as const;

export default function Studi() {
  return (
    <>
      <SiteHeader current="/studi.html" />
      <main className="wrap">
        <header className="page-head" style={{ paddingBottom: 6 }}>
          <h1>Satu bulan kas jadi empat berkas.</h1>
          <p className="lede">Sinar Jaya, September 2026. Satu file CSV jadi laporan keuangan, rencana strategis, riset promosi, dan rencana pemasaran. Setiap angka menyebut baris asalnya, jadi bisa diperiksa.</p>
          <div className="page-head-actions">
            <Link className="btn btn-solid" to="/unduh.html">Unduh navego</Link>
            <Link className="btn btn-ghost" to="/fitur.html">Lihat kemampuan</Link>
          </div>
        </header>

        <section className="section" aria-labelledby="inputTitle" style={{ paddingTop: 10 }}>
          <div className="section-head">
            <h2 id="inputTitle">Masukannya satu file.</h2>
            <p>Dua puluh tiga baris kas September, empat kolom: tanggal, akun, kanal, jumlah. Tidak ada template dan tidak ada tabel yang sudah jadi.</p>
          </div>
          <pre style={{ background: 'var(--ink)', color: '#d8f4ff', borderRadius: 10, padding: '14px 16px', maxWidth: 640, overflowX: 'auto', fontSize: 12 }}><code>Tanggal,Akun,Kanal,Jumlah
2026-09-02,Pendapatan Penjualan,Langganan,48.250.000
2026-09-05,Pendapatan Penjualan,Proyek,31.400.000
2026-09-03,Beban Pokok Layanan,Proyek,-28.900.000</code></pre>
        </section>

        <section className="section" aria-labelledby="outTitle" style={{ paddingTop: 10 }}>
          <div className="section-head">
            <h2 id="outTitle">Keluarannya empat berkas.</h2>
            <p>Setiap berkas dibuka di aplikasi yang biasa dipakai orang: Excel, PowerPoint, Word. Unduh apa adanya.</p>
          </div>
          <div className="feature-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {FILES.map(([title, body, href, cta]) => (
              <article key={title} className="feature">
                <h3>{title}</h3>
                <p>{body}</p>
                <p style={{ marginTop: 10 }}><a href={href} download className="btn btn-ghost btn-sm" style={{ display: 'inline-flex' }}>{cta}</a></p>
              </article>
            ))}
          </div>
          <p className="note" style={{ marginTop: 12 }}>Jalannya terbukti di <Link to="/bukti.html">halaman bukti</Link>: satu jalannya membangun ulang keempat berkas ini, dan sha256-nya sama.</p>
        </section>

        <section className="section" aria-labelledby="figureTitle" style={{ paddingTop: 10 }}>
          <div className="section-head">
            <h2 id="figureTitle">Angkanya dicek ulang.</h2>
            <p>Laporan menghitung ulang setiap angka dari baris yang disebutnya. Slide strategi hanya boleh memakai angka yang ada di laporan; kalau tidak ada, slide itu ditolak sebelum ditulis.</p>
          </div>
          <table className="table" style={{ maxWidth: 640 }}>
            <thead><tr><th scope="col">Angka</th><th scope="col" className="num">Nilai</th><th scope="col" className="num">Baris</th></tr></thead>
            <tbody>
              <tr><td>Pendapatan Penjualan</td><td className="num">Rp 216.700.000</td><td className="num">2–10</td></tr>
              <tr><td>Beban Pokok Layanan</td><td className="num">-Rp 86.680.000</td><td className="num">11–15</td></tr>
              <tr><td><strong>Total September</strong></td><td className="num"><strong>Rp 65.310.000</strong></td><td className="num">2–24</td></tr>
            </tbody>
          </table>
          <p className="note" style={{ marginTop: 10 }}>Sumber: 23 baris transaksi-2026-09.csv. Tujuh angka diperiksa, tidak ada selisih.</p>
        </section>

        <div className="page-foot">
          <div>
            <h2>Buka berkasnya sekarang.</h2>
            <p>Keempat berkas di halaman ini dibuat dari data tiruan, dan bisa dibuka di aplikasi Anda sendiri. Pekerjaan Anda berikutnya dimulai dari file yang sama.</p>
          </div>
          <Link className="btn btn-solid" to="/unduh.html">Unduh navego</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
