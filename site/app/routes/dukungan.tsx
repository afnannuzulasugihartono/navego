import { Link } from 'react-router';
import { seoMeta } from '../lib/seo.js';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return seoMeta({
    title: 'Dukungan — Navego',
    description: 'Lima perbaikan paling sering, kontak yang tepat, dan langkah berikutnya — jawaban yang bisa langsung diikuti.',
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
  }
];

const DOORS = [
  ['Email', 'afnannuzulasugihartono@gmail.com', 'mailto:afnannuzulasugihartono@gmail.com'],
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
            <p className="crumb">Dukungan</p>
            <h1>Ada yang macet?</h1>
            <p className="lede">Lima perbaikan paling sering. Kalau tidak ada di sini, tiga pintu di bawah dibaca orang.</p>
          </div>
        </section>

        <section className="band" aria-labelledby="fixTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Perbaikan cepat</p>
                <h2 id="fixTitle" className="section-title">Lima yang paling sering.</h2>
              </div>
            </div>
            <div className="faq">
              {FIXES.map((fix) => (
                <details key={fix.id} id={fix.id}>
                  <summary>{fix.title}</summary>
                  <p>{fix.body}</p>
                  {fix.id === 'mcp' ? <p style={{ marginTop: 'var(--s-3)' }}><Link to="/docs#mcp">Ke Docs → Hubungkan AI harness</Link></p> : null}
                  {fix.id === 'device' ? <p style={{ marginTop: 'var(--s-3)' }}><Link to="/dashboard">Buka Dashboard</Link></p> : null}
                  {fix.id === 'ext' ? <p style={{ marginTop: 'var(--s-3)' }}><Link to="/unduh">Ke halaman Unduh</Link></p> : null}
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="band band-soft" aria-labelledby="kontakTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Kontak</p>
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

        <section className="band">
          <div className="wrap">
            <div className="cta-band">
              <h2 className="section-title" style={{ color: '#ffffff' }}>Belum ketemu jawabannya?</h2>
              <p>Mulai dari docs untuk langkah lengkap, atau kirim email dengan tab dan pesan error yang Anda lihat.</p>
              <div className="hero-cta" style={{ marginTop: 'var(--s-2)' }}>
                <Link className="btn btn-solid" to="/docs">Buka docs</Link>
                <a className="btn btn-ghost" href="mailto:afnannuzulasugihartono@gmail.com">Kirim email</a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}