import { Link } from 'react-router';
import { seoMeta } from '../lib/seo.js';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return seoMeta({
    title: 'FAQ — Navego',
    description: 'Jawaban jujur untuk pertanyaan yang paling sering: apa itu Navego, browser apa yang didukung, berapa harganya, kapan kata sandi ditolak, dan bagaimana cara berhenti.',
    path: '/faq'
  });
}

const QA = [
  ['produk', 'Apa itu Navego, satu kalimat?', 'Asisten AI di dalam browser Anda: Anda bicara, Navego membaca halaman yang terbuka, mengisi formulir, dan menyimpan hasilnya sebagai berkas di folder Anda.'],
  ['browser', 'Browser apa saja yang didukung?', 'Chrome, Edge, Brave, Opera, dan Vivaldi — manifest V3, satu berkas .zip atau .reg per mesin. Google (Docs, Sheets, Maps, YouTube) yang paling diprioritaskan; yang lain menyusul lewat primitive yang sama.'],
  ['harga', 'Berapa harganya, dan bagaimana cara membayarnya?', 'USD, sekali beli: $1–$9 per bulan (Asia/Arab/Afrika) dan $1/$9/$17 (6 bulan)/$33 (1 tahun) di Eropa & AS. Pembayaran lewat PayPal dan langsung aktif setelahnya. Tidak ada plan gratis; pemasangan ekstensinya gratis — unduh, coba, putuskan berlangganan setelah hasilnya ada.'],
  ['klik', 'Apakah Navego bisa membaca kata sandi saya?', 'Tidak. Kolom password, PIN, OTP/2FA, CVV/CVC selalu ditolak — bukan disembunyikan, ditolak. Navego juga tidak pernah mengisi file upload, tidak menyentuh tab pribadi, dan tidak menjalankan kode dari halaman mana pun.'],
  ['data', 'Apa yang dikirim ke server?', 'Device pairing, antrian perintah, dan hasilnya — lewat Supabase dengan token yang diverifikasi. Isi halaman Anda tidak dikirim ke mana pun kecuali ke model yang Anda konfigurasikan sendiri, dan hanya berupa tujuan (maks 1.200 karakter) plus potongan halaman (maks 1.200 karakter, maks 40 elemen).'],
  ['akun', 'Apakah saya perlu akun?', 'Untuk membeli plan dan memakai Dashboard, ya — akun dibuat saat Anda masuk. Untuk pemakaian lokal lewat pairing device, device Anda yang punya izin, bukan orang lain.'],
  ['kuota', 'Apa yang terjadi kalau kuotanya habis?', 'Hari itu Anda berhenti; besoknya kuota penuh lagi. Pekerjaan yang gagal tidak memotong kuota secara proporsional, dan tidak pernah ada yang ditagih tanpa pekerjaan terkirim.'],
  ['gagal', 'Kalau pekerjaannya gagal di tengah jalan, saya dirugikan?', 'Pekerjaan yang berhenti karena alasan di luar kendali Anda tidak mengurangi kuota harian secara proporsional. Kuota yang sudah terpakai tetap terpakai — itu sifat penghitungan harian, bukan meteran.'],
  ['verifikasi', 'Pembayaran dikonfirmasi tapi plan belum aktif?', 'Selesaikan pembayaran di PayPal sampai selesai; plan diaktifkan otomatis setelah PayPal menyelesaikan transaksi. Kalau sudah lebih dari beberapa menit belum aktif, hubungi dukungan dengan PayPal transaction ID Anda — itu cukup untuk ditelusuri manual.'],
  ['berhenti', 'Bagaimana cara berhenti?', 'Tidak ada yang perlu dibatalkan: plan USD tidak diperpanjang otomatis. Berhenti memakai = berhenti membayar. Hapus ekstensi dari chrome://extensions, cabut device di Dashboard, dan selesai.'],
  ['sla', 'Berapa lama dukungan menjawab?', 'Tidak ada SLA yang dipublikasikan hari ini — jujur saja: dukungan dijawab lewat email dan isu GitHub, biasanya dalam satu dua hari kerja, tetapi tidak ada jaminan tertulis. Kalau Anda membutuhkan jaminan, sampaikan kebutuhan itu sebelum membeli.'],
  ['stok', 'Apakah fitur X ada?', 'Kalau belum ada di halaman Fitur, belum ada. Jangan anggap ada dari namanya: setiap kemampuan di situs ini punya tes di repositori atau tidak disebut.']
] as const;

export default function Faq() {
  return (
    <>
      <SiteHeader current="/faq" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <p className="crumb">FAQ</p>
            <h1>Pertanyaan yang wajar diajukan.</h1>
            <p className="lede">Dua belas jawaban, apa adanya — termasuk yang tidak menguntungkan kami.</p>
          </div>
        </section>

        <section className="band" aria-labelledby="faqTitle">
          <div className="wrap">
            <h2 id="faqTitle" className="section-title" style={{ marginBottom: 'var(--s-5)' }}>Tanya jawab.</h2>
            <div className="faq">
              {QA.map(([id, q, a]) => (
                <details key={id} id={id}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap">
            <div className="cta-band">
              <h2 className="section-title" style={{ color: '#ffffff' }}>Masih ada yang kurang jelas?</h2>
              <p>Baca dokumentasi lengkapnya, atau kirim pertanyaan lewat email dengan langkah yang Anda coba.</p>
              <div className="hero-cta" style={{ marginTop: 'var(--s-2)' }}>
                <Link className="btn btn-solid" to="/docs">Buka docs</Link>
                <Link className="btn btn-ghost" to="/dukungan">Dukungan</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
