// decisions.json -> D35, D36 (no eyebrows, h1 first)

import { Link } from 'react-router';
import { seoMeta } from '../lib/seo.js';
import { SiteFooter, SiteHeader } from '../components/Chrome';
import { FeedbackForm } from '../components/FeedbackForm';

export function meta() {
  return seoMeta({
    title: 'Dukungan — Navego',
    description: 'Enam perbaikan paling sering, termasuk pembayaran yang belum aktif, kontak yang tepat, dan langkah berikutnya — jawaban yang bisa langsung diikuti.',
    path: '/dukungan'
  });
}

const FIXES = [
  {
    id: 'device', title: 'Device tidak muncul di Dashboard',
    body: 'Buka Dashboard dan lihat status tiap device. Jika offline, pasangkan ulang lewat kode baru di sana. Cabut device yang tidak Anda kenal.'
  },
  {
    id: 'ext', title: 'Ekstensi tidak terpasang',
    body: 'Ikuti Unduh. Pasang lewat arsip mentah dan aktifkan mode pengembang. Periksa chrome://extensions dan chrome://policy.'
  },
  {
    id: 'mcp', title: 'Menghubungkan AI harness',
    body: 'Server MCP, header device, dan config OpenCode, Kilo, serta Claude ada di halaman Docs.'
  },
  {
    id: 'sesi', title: 'Sesi Anda keluar sendiri',
    body: 'Token akses kedaluwarsa sekitar satu jam dan biasanya diperbarui otomatis lewat refresh token. Jika refresh ikut gagal, Anda dipulangkan ke Masuk — itu disengaja, bukan kehilangan akun. Riwayat perintah tetap ada.'
  },
  {
    id: 'privasi', title: 'Privasi dan data',
    body: 'Kendali data ada di halaman Akun dan Privasi. Temuan keamanan jangan dibuka sebagai isu publik; laporkan privat lewat tab Security di repositori.'
  },
  {
    id: 'bayar', title: 'Sudah bayar, plan belum aktif',
    body: 'Buka harga di browser yang sama dengan tempat Anda membayar. Order yang masih menunggu ditampilkan di bagian atas: masuk, lalu pilih Klaim pesanan saya. Jika PayPal masih memproses, tunggu konfirmasi lalu muat ulang halaman. Sertakan order ID jika Anda tetap perlu bantuan.'
  }
];

const DOORS = [
  ['Form dukungan', 'Pakai form di bawah', '#form-dukungan'],
  ['Isu publik', 'Buka isu baru', 'https://github.com/afnannuzulasugihartono/navego/issues'],
  ['Keamanan', 'Laporkan secara privat', 'https://github.com/afnannuzulasugihartono/navego/security/advisories/new']
] as const;

export default function Dukungan() {
  return (
    <>
      <SiteHeader current="/dukungan" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <h1>Ada yang macet?</h1>
            <p className="lede">Enam perbaikan paling sering. Kalau tidak ada di sini, tiga pintu di bawah dibaca orang.</p>
          </div>
        </section>

        <section className="band" aria-labelledby="fixTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="fixTitle" className="section-title">Enam yang paling sering.</h2>
              </div>
            </div>
            <div className="faq">
              {FIXES.map((fix) => (
                <details key={fix.id} id={fix.id}>
                  <summary>{fix.title}</summary>
                  <p>{fix.body}</p>
                  {fix.id === 'mcp' ? <p className="mt-3"><Link to="/docs#mcp">Ke Docs → Hubungkan AI harness</Link></p> : null}
                  {fix.id === 'device' ? <p className="mt-3"><Link to="/dashboard">Buka Dashboard</Link></p> : null}
                  {fix.id === 'ext' ? <p className="mt-3"><Link to="/unduh">Ke halaman Unduh</Link></p> : null}
                  {fix.id === 'bayar' ? <p className="mt-3"><Link to="/harga">Ke halaman klaim</Link></p> : null}
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="band band-soft" aria-labelledby="kontakTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="kontakTitle" className="section-title">Tiga pintu.</h2>
              </div>
              <p className="section-note">Pilih yang paling cocok; semuanya dibaca orang.</p>
            </div>
            <div className="value-grid">
              {DOORS.map(([label, action, href]) => (
                <div className="value-card" key={label}>
                  <b>{label}</b>
                  <p><a href={href}>{action}</a></p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="band band-soft" aria-labelledby="formTitle">
          <div className="wrap">
            <h2 id="formTitle" className="section-title">Tulis jawaban Anda.</h2>
            <FeedbackForm />
          </div>
        </section>

        <section className="band">
          <div className="wrap">
            <div className="cta-band">
              <h2 className="section-title text-on-dark">Belum ketemu jawabannya?</h2>
              <p>Mulai dari docs untuk langkah lengkap, atau pakai form dukungan dengan tab dan pesan error yang Anda lihat.</p>
              <div className="hero-cta mt-2">
                <Link className="btn btn-solid" to="/docs">Buka docs</Link>
                <a className="btn btn-ghost" href="#form-dukungan">Ke form dukungan</a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
