import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return [
    { title: 'Syarat Layanan — Corbin' },
    { name: 'description', content: 'Syarat layanan Corbin: akses terbuka, bawa model sendiri, dan pairing yang dapat dicabut.' }
  ];
}

export default function Syarat() {
  return (
    <>
      <SiteHeader current="/syarat.html" />
      <main className="wrap legal">
        <header className="page-head" style={{ paddingBottom: 6 }}>
          <p className="kicker">Legal</p>
          <h1>Syarat Layanan</h1>
          <p className="lede" style={{ fontSize: 13 }}>Terakhir diperbarui: 5 Oktober 2026.</p>
        </header>
        <h2 id="akses">Akses terbuka</h2>
        <p><strong>Pendaftaran terbuka</strong> untuk siapa pun; tidak ada daftar tunggu. Kami dapat menutup pendaftaran kapan pun tanpa kehilangan hak Anda atas data yang sudah ada.</p>
        <h2 id="model">Bawa model sendiri</h2>
        <p>Anda membawa <strong>model sendiri</strong>: endpoint, nama model, dan kunci API dari penyedia pilihan Anda. Biaya pemakaian model adalah urusan Anda dengan penyedia itu, bukan dengan kami. Kami tidak pernah menerbitkan kunci bersama.</p>
        <h2 id="device">Satu device, pairing yang dapat dicabut</h2>
        <p>Satu akun memasangkan satu device dalam satu waktu. Pairing dapat dicabut, dan pencabutan menghentikan perintah baru seketika; riwayat antrean yang sudah tersimpan mengikuti kebijakan privasi.</p>
        <h2 id="wajar">Penggunaan yang wajar</h2>
        <p>Jangan memakai jembatan ini untuk mengambil alih akun orang lain, mengelabui verifikasi manusia, atau melanggar syarat situs yang Anda kunjungi. Pelanggaran menghentikan akses tanpa pengembalian untuk periode berjalan.</p>
        <h2 id="garansi">Tanpa garansi</h2>
        <p>Layanan diberikan apa adanya. Asisten bisa salah klik seperti manusia bisa salah klik; awasi tab Anda untuk tindakan penting.</p>
      </main>
      <SiteFooter />
    </>
  );
}
