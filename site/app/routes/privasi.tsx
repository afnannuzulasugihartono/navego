// decisions.json -> D35, D36 (no eyebrows, h1 first)

import { Link } from 'react-router';
import { seoMeta } from '../lib/seo.js';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return seoMeta({
    title: 'Kebijakan Privasi — Opera',
    description: 'Kebijakan privasi Opera: konten halaman hanya pergi ke endpoint model milik Anda, tidak pernah dibagikan ke pihak ketiga.',
    path: '/privasi'
  });
}

export default function Privasi() {
  return (
    <>
      <SiteHeader current="/privasi" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <h1>Kebijakan Privasi</h1>
            <p className="lede">Terakhir diperbarui: 5 Oktober 2026.</p>
          </div>
        </section>
        <div className="wrap legal" style={{ paddingBlock: 'var(--s-7)' }}>
          <section>
            <p><strong>Hanya pergi ke endpoint model milik Anda.</strong> Konten yang Anda setujui dibaca asisten dikirim ke endpoint model yang Anda konfigurasi sendiri. Kami tidak memilihkan model. Kami tidak membaca kontennya.</p>
          </section>
          <h2 id="relay">Relay perintah</h2>
          <p>Agar asisten bisa bertindak di device Anda, perintah browser beserta hasilnya transit melalui relay project dan <strong>disimpan sebagai riwayat antrean di database project</strong>. Tidak ada data yang dihapus otomatis; riwayat ada selama akun ada.</p>
          <h2 id="pihak-ketiga">Tidak pernah dibagikan ke pihak ketiga</h2>
          <p>Konten halaman, hasil perintah, dan kunci API Anda tidak pernah dibagikan, dijual, atau diberikan ke pihak ketiga mana pun untuk tujuan apa pun.</p>
          <h2 id="kunci">Kunci Anda</h2>
          <p>Kunci API model dan token device tersimpan di browser Anda masing-masing dan tidak pernah ditampilkan kembali ke halaman web mana pun, termasuk halaman situs ini.</p>
          <h2 id="ditolak">Yang selalu ditolak</h2>
          <p>Screenshot dan pembacaan halaman ditolak di halaman yang menampilkan password, kode sekali pakai, atau kolom pembayaran, serta di tab pribadi dan mode penyamaran.</p>
          <h2 id="cookie">Cookie</h2>
<p>Situs ini memakai dua cookie first-party. <code>opera_consent</code> menyimpan pilihan banner cookie. <code>opera_region</code> menyimpan kawasan harga Anda — hanya setelah Anda menerima. Tidak ada cookie analytics, iklan, atau pelacakan. Menolak tidak memblokir apa pun; deteksi kawasan tetap berjalan, hanya tidak disimpan.</p>

<h2 id="kontak">Kontak</h2>
          <p>Pertanyaan tentang data Anda: semua kendali mandiri ada di halaman <Link to="/akun">Akun</Link> — lihat device yang ter-pairing, cabut yang tidak dikenal, keluar dari sesi. Temuan keamanan jangan dibuka sebagai isu publik; laporkan privat lewat tab Security di repositori.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
