import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return [
    { title: 'Bukti — Navego' },
    { name: 'description', content: 'Navego menjalankan peramban sungguhan di portal contoh, mengunduh CSV-nya, lalu membangun ulang empat berkas halaman studi kasus — sha256 sama, byte per byte.' }
  ];
}

const STEPS = [
  'Membuka portal contoh di peramban.',
  'Membaca halaman dan menemukan tombol unduhnya.',
  'Menekan tombol unduh; CSV transaksi mendarat di disk.',
  'Menghitung ulang laporan keuangan dari baris CSV.',
  'Menyusun slide strategi dari angka yang sudah diperiksa.',
  'Menulis dua dokumen Word.',
  'Menangkap layar portal yang dibaca.',
  'Menutup tab dan menutup jalannya.'
];

const ROAD = [
  'Extension menyambung sendiri ke server lokal di komputer ini, jadi peramban yang sedang dipakai tidak perlu port debugging.',
  'Server membuka portal contoh di tab peramban yang sedang dipakai.',
  'Halaman dibaca, tombol "Unduh CSV" ditemukan, lalu ditekan.',
  'CSV mendarat di folder unduhan peramban, lalu dipindahkan ke folder kerja.',
  'Tab ditutup dan jalannya ditutup.'
];

const BUILDS: Array<[string, number, string]> = [
  ['laporan-keuangan-2026-09.xlsx', 21066, 'a4f12765b77329eb5ec37dae3ad4323ac1d1d6659cd6261bb689c2736c931922'],
  ['rencana-strategis-2027.pptx', 32871, '6f3f42a4dd2465fa8e77bf33572ac3949b5097eaec1aaebaeda074ac4a71806e'],
  ['riset-promo.docx', 23485, '1758824cd0cf0b15a6f9531cd13ff5d42de277776b8a0cd87b8d927184ba38e1'],
  ['rencana-pemasaran-2027.docx', 18509, '104e43eac8e80e1860e1bc52c61414e81dcac43a1bea2f424537e4754517b8b6']
];

export default function Bukti() {
  return (
    <>
      <SiteHeader current="/bukti.html" />
      <main className="wrap">
        <header className="page-head" style={{ paddingBottom: 6 }}>
          <h1>Empat berkas, sama persis.</h1>
          <p className="lede">Navego menjalankan peramban sungguhan di portal contoh, mengunduh CSV-nya, lalu membangun ulang empat berkas yang ada di halaman studi kasus. Setiap berkas dicocokkan dengan berkas yang bisa Anda unduh: sha256-nya sama, byte per byte.</p>
          <div className="page-head-actions">
            <Link className="btn btn-solid" to="/studi.html">Lihat keempat berkasnya</Link>
            <a className="btn btn-ghost" href="https://github.com/afnannuzulasugihartono/opera-agent/blob/main/proof/run.md">Buka catatannya</a>
          </div>
        </header>

        <section className="section" aria-labelledby="stepsTitle" style={{ paddingTop: 10 }}>
          <div className="section-head">
            <h2 id="stepsTitle">Yang terjadi</h2>
            <p>Delapan langkah, satu jalannya. Tidak ada berkas yang disalin tangan dan tidak ada tombol yang ditekan manual.</p>
          </div>
          <ol className="steps" style={{ maxWidth: 720 }}>
            {STEPS.map((step) => <li key={step}><span>{step}</span></li>)}
          </ol>
        </section>

        <section className="section" aria-labelledby="filesTitle" style={{ paddingTop: 10 }}>
          <div className="section-head">
            <h2 id="filesTitle">Hash-nya sama.</h2>
            <p>Keempat berkas di bawah dibangun ulang oleh jalannya, lalu dibandingkan dengan berkas di halaman studi kasus. Kalau satu byte berbeda, jalannya berhenti dan menulis kedua hash.</p>
          </div>
          <table className="table" style={{ maxWidth: 860 }}>
            <thead><tr><th scope="col">Berkas</th><th scope="col" className="num">Ukuran (byte)</th><th scope="col">sha256</th></tr></thead>
            <tbody>
              {BUILDS.map(([name, size, hash]) => (
                <tr key={name}><td><code>{name}</code></td><td className="num">{size}</td><td><code >{hash}</code></td></tr>
              ))}
            </tbody>
          </table>
          <p className="note" style={{ marginTop: 10 }}>Bandingkan dengan berkas yang Anda unduh: <code>sha256sum berkas-anda</code> harus sama persis dengan hash di tabel.</p>
        </section>

        <section className="section" aria-labelledby="roadTitle" style={{ paddingTop: 10 }}>
          <div className="section-head">
            <h2 id="roadTitle">Jalan lewat extension.</h2>
            <p>Jalannya di atas memakai peramban terpisah. Yang Anda pakai sehari-hari berjalan lewat extension Navego: extension itu menyambung sendiri ke server lokal dan menjalankan peramban yang sedang Anda buka. Jalur itu sudah dijalankan dan dicatat.</p>
          </div>
          <ol className="steps" style={{ maxWidth: 720 }}>
            {ROAD.map((step) => <li key={step}><span>{step}</span></li>)}
          </ol>
          <table className="table" style={{ maxWidth: 860, marginTop: 14 }}>
            <thead><tr><th scope="col">Berkas</th><th scope="col" className="num">Ukuran (byte)</th><th scope="col">sha256</th></tr></thead>
            <tbody>
              <tr><td><code>transaksi-2026-09.csv</code></td><td className="num">1109</td><td><code >8e0f64810fd70e91101051afb85a814df12a87b1eafde048272049ed6a3667a2</code></td></tr>
            </tbody>
          </table>
          <p className="note" style={{ marginTop: 10 }}>Berkas itu sama persis dengan CSV yang jadi sumber keempat berkas di atas. Bandingkan sha256-nya: sama, byte per byte.</p>
          <div className="hero-cta" style={{ marginTop: 10 }}>
            <a className="btn btn-ghost" href="https://github.com/afnannuzulasugihartono/opera-agent/blob/main/proof/extension-run.md">Buka catatan jalannya</a>
          </div>
        </section>

        <section className="section" aria-labelledby="shotTitle" style={{ paddingTop: 10 }}>
          <div className="section-head">
            <h2 id="shotTitle">Halaman yang dibaca jalannya.</h2>
            <p>Ini portal tiruan yang dibuka jalannya. Tombol unduh di halaman itu yang membuat CSV mendarat di disk.</p>
          </div>
          <figure style={{ maxWidth: 760 }}>
            <img src="/bukti/portal.jpg" width={1295} height={939} alt="Portal contoh Sinar Jaya: tabel transaksi September 2026 dan tombol Unduh CSV" loading="lazy" style={{ width: '100%', borderRadius: 10, border: '2px solid var(--ink)' }} />
          </figure>
        </section>
        <div className="page-foot">
          <div>
            <h2>Berhasil? Bawa ke pekerjaan Anda.</h2>
            <p>Gunakan file CSV yang sama dengan halaman Studi kasus, lalu jalankan perintah yang sama di browser Anda sendiri.</p>
          </div>
          <Link className="btn btn-solid" to="/unduh.html">Unduh navego</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
