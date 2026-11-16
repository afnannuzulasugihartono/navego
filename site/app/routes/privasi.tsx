import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return [
    { title: 'Kebijakan Privasi — Corbin' },
    { name: 'description', content: 'Kebijakan privasi Corbin: konten halaman hanya pergi ke endpoint model milik Anda, tidak pernah dibagikan ke pihak ketiga.' }
  ];
}

export default function Privasi() {
  return (
    <>
      <SiteHeader current="/privasi.html" />
      <main className="wrap legal">
        <h1>Kebijakan Privasi</h1>
        <p className="updated" style={{ color: 'var(--muted)', fontSize: 13 }}>Terakhir diperbarui: 5 Oktober 2026.</p>
        <section>
          <p><strong>Hanya pergi ke endpoint model milik Anda.</strong> Konten dari halaman yang Anda setujui untuk dibaca asisten hanya dikirim ke endpoint model yang Anda konfigurasi sendiri. Kami tidak memilihkan model untuk Anda dan tidak menerima konten itu untuk dibaca manusia.</p>
        </section>
        <h2 id="relay">Relay perintah</h2>
        <p>Agar asisten bisa bertindak di device Anda, perintah browser beserta hasilnya transit melalui relay project dan <strong>disimpan sebagai riwayat antrean di database project</strong>. Tidak ada data yang dihapus otomatis; riwayat ada selama akun ada.</p>
        <h2 id="pihak-ketiga">Tidak pernah dibagikan ke pihak ketiga</h2>
        <p>Konten halaman, hasil perintah, dan kunci API Anda tidak pernah dibagikan, dijual, atau diberikan ke pihak ketiga mana pun untuk tujuan apa pun.</p>
        <h2 id="kunci">Kunci Anda</h2>
        <p>Kunci API model dan token device tersimpan di browser Anda masing-masing dan tidak pernah ditampilkan kembali ke halaman web mana pun, termasuk halaman situs ini.</p>
        <h2 id="ditolak">Yang selalu ditolak</h2>
        <p>Screenshot dan pembacaan halaman ditolak di halaman yang menampilkan password, kode sekali pakai, atau kolom pembayaran, serta di tab pribadi dan mode penyamaran.</p>
        <h2 id="kontak">Kontak</h2>
        <p>Pertanyaan tentang data Anda: semua kendali mandiri ada di halaman <Link to="/akun.html">Akun</Link> — lihat device yang ter-pairing, cabut yang tidak dikenal, keluar dari sesi. Temuan keamanan jangan dibuka sebagai isu publik; laporkan privat lewat tab Security di repositori.</p>
      </main>
      <SiteFooter />
    </>
  );
}
