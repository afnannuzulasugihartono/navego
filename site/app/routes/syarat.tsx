// decisions.json -> D35, D36 (no eyebrows, h1 first)

import { SiteFooter, SiteHeader } from '../components/Chrome';
import { seoMeta } from '../lib/seo.js';

export function meta() {
  return seoMeta({
    title: 'Syarat Layanan — Navego',
    description: 'Syarat layanan Navego: akses terbuka, bawa model sendiri, dan pairing yang dapat dicabut.',
    path: '/syarat'
  });
}

export default function Syarat() {
  return (
    <>
      <SiteHeader current="/syarat" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <h1>Syarat Layanan</h1>
            <p className="lede">Terakhir diperbarui: 5 Oktober 2026.</p>
          </div>
        </section>
        <div className="wrap legal py-7">
          <h2 id="akses">Akses terbuka</h2>
          <p><strong>Pendaftaran terbuka</strong> untuk siapa pun; tidak ada daftar tunggu. Kami dapat menutup pendaftaran kapan pun tanpa kehilangan hak Anda atas data yang sudah ada.</p>
          <h2 id="model">Bawa model sendiri</h2>
          <p>Anda membawa <strong>model sendiri</strong>: endpoint, nama model, dan kunci API penyedia pilihan Anda. Biaya model adalah urusan Anda dengan penyedia itu. Kami tidak pernah menerbitkan kunci bersama.</p>
          <h2 id="device">Satu device, pairing yang dapat dicabut</h2>
          <p>Satu akun memasangkan satu device dalam satu waktu. Pairing dapat dicabut, dan pencabutan menghentikan perintah baru seketika; riwayat antrean yang sudah tersimpan mengikuti kebijakan privasi.</p>
          <h2 id="wajar">Penggunaan yang wajar</h2>
          <p>Jangan memakai jembatan ini untuk mengambil alih akun orang lain, mengelabui verifikasi manusia, atau melanggar syarat situs yang Anda kunjungi. Pelanggaran menghentikan akses tanpa pengembalian untuk periode berjalan.</p>
          <h2 id="garansi">Tanpa garansi</h2>
          <p>Layanan diberikan apa adanya. Asisten bisa salah klik seperti manusia bisa salah klik; awasi tab Anda untuk tindakan penting.</p>
          <h2 id="perubahan">Perubahan</h2>
          <p>Perubahan besar diberi tahu lewat halaman ini minimal 14 hari sebelumnya. Perubahan kecil — kalimat yang diperjelas, tautan yang diperbarui — langsung berlaku.</p>
          <h2 id="hukum">Hukum</h2>
          <p>Perselisihan diselesaikan di pengadilan wilayah Indonesia, dalam bahasa Indonesia, dengan itikad baik.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
