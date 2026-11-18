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
    body: 'Buka Dashboard dan lihat status tiap device. Jika offline, pasangkan ulang lewat kode baru di sana. Jangan biarkan device tak dikenal tetap ter-pairing; cabut yang tidak Anda kenal.'
  },
  {
    id: 'ext', title: 'Ekstensi tidak terpasang',
    body: 'Ikuti Unduh. Pasang lewat arsip mentah dan aktifkan mode pengembang. Periksa chrome://extensions dan chrome://policy.'
  },
  {
    id: 'mcp', title: 'Menghubungkan AI harness (OpenCode, Kilo, ChatGPT, Claude)',
    body: 'Server MCP, header device, dan config OpenCode, Kilo, serta Claude ada di halaman Docs.'
  },
  {
    id: 'sesi', title: 'Sesi Anda keluar sendiri',
    body: 'Token akses kedaluwarsa sekitar satu jam. Biasanya diperbarui otomatis lewat refresh token yang tersimpan; jika refresh ikut gagal, Anda dipulangkan ke Masuk. Itu disengaja, bukan kehilangan akun. Riwayat perintah tetap ada.'
  },
  {
    id: 'privasi', title: 'Privasi dan data',
    body: 'Pertanyaan tentang kendali data: semuanya ada di halaman Akun dan Privasi. Temuan keamanan jangan dibuka sebagai isu publik; laporkan privat lewat tab Security di repositori.'
  }
];

export default function Dukungan() {
  return (
    <>
      <SiteHeader current="/dukungan" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <p className="crumb">Dukungan</p>
            <h1>Dukungan.</h1>
            <p className="lede">Lima perbaikan paling sering. Kalau jawaban Anda tidak ada di sini, gunakan tiga pintu di bawah.</p>
          </div>
        </section>

        <div className="wrap" style={{ paddingBlock: 'var(--s-7)' }}>
          <div className="faq" style={{ marginBottom: 'var(--s-6)' }}>
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

          <section className="card" aria-labelledby="kontakTitle">
            <p className="kicker">Kontak</p>
            <h2 id="kontakTitle" className="section-title" style={{ marginTop: 'var(--s-2)' }}>Belum ketemu?</h2>
            <p style={{ color: 'var(--muted-2)', fontSize: 'var(--text-sm)', margin: 'var(--s-3) 0 var(--s-4)' }}>Tiga pintu, dan semuanya dibaca orang.</p>
            <ul style={{ listStyle: 'none', display: 'grid', gap: 'var(--s-3)', fontSize: 'var(--text-base)' }}>
              <li><span style={{ display: 'inline-block', minWidth: '5rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Email</span> <a href="mailto:afnannuzulasugihartono@gmail.com">afnannuzulasugihartono@gmail.com</a></li>
              <li><span style={{ display: 'inline-block', minWidth: '5rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Isu publik</span> <a href="https://github.com/afnannuzulasugihartono/navego/issues">Buka isu baru</a></li>
              <li><span style={{ display: 'inline-block', minWidth: '5rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Keamanan</span> <a href="https://github.com/afnannuzulasugihartono/navego/security/advisories/new">Laporkan secara privat</a></li>
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
