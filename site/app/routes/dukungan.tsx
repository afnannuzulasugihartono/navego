import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return [
    { title: 'Dukungan — Corbin' },
    { name: 'description', content: 'Lima perbaikan paling sering, kontak yang tepat, dan langkah berikutnya — jawaban yang bisa langsung diikuti.' }
  ];
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
      <SiteHeader current="/dukungan.html" />
      <main className="wrap" style={{ maxWidth: 880 }}>
        <header className="page-head" style={{ paddingBottom: 6 }}>
          <p className="kicker">Dukungan</p>
          <h1>Dukungan</h1>
          <p className="lede">Lima perbaikan paling sering. Kalau jawaban Anda tidak ada di sini, gunakan tiga pintu di bawah.</p>
        </header>

        <div className="faq" style={{ marginTop: 24 }}>
          {FIXES.map((fix) => (
            <details key={fix.id} id={fix.id}>
              <summary>{fix.title}</summary>
              <p>{fix.body}</p>
              {fix.id === 'mcp' ? <p style={{ marginTop: 6 }}><Link to="/docs.html#mcp">Ke Docs → Hubungkan AI harness</Link></p> : null}
              {fix.id === 'device' ? <p style={{ marginTop: 6 }}><Link to="/dashboard.html">Buka Dashboard</Link></p> : null}
              {fix.id === 'ext' ? <p style={{ marginTop: 6 }}><Link to="/unduh.html">Ke halaman Unduh</Link></p> : null}
            </details>
          ))}
        </div>

        <section className="panel" style={{ marginTop: 26 }} aria-labelledby="kontakTitle">
          <h2 id="kontakTitle" style={{ fontSize: 18, letterSpacing: '-0.01em' }}>Belum ketemu?</h2>
          <p style={{ color: 'var(--muted-2)', fontSize: 13, margin: '8px 0 12px' }}>Tiga pintu, dan semuanya dibaca orang.</p>
          <ul style={{ listStyle: 'none', display: 'grid', gap: 8, fontSize: 13.5 }}>
            <li><span style={{ display: 'inline-block', width: 86, color: 'var(--muted)' }}>Email</span> <a href="mailto:afnannuzulasugihartono@gmail.com">afnannuzulasugihartono@gmail.com</a></li>
            <li><span style={{ display: 'inline-block', width: 86, color: 'var(--muted)' }}>Isu publik</span> <a href="https://github.com/afnannuzulasugihartono/opera-agent/issues">Buka isu baru</a></li>
            <li><span style={{ display: 'inline-block', width: 86, color: 'var(--muted)' }}>Keamanan</span> <a href="https://github.com/afnannuzulasugihartono/opera-agent/security/advisories/new">Laporkan secara privat</a></li>
          </ul>
        </section>
        <div className="page-foot">
          <div>
            <h2>Macet di tengah?</h2>
            <p>Catat apa yang terjadi, lalu buka isu publik — atau laporkan secara privat kalau menyangkut keamanan.</p>
          </div>
          <a className="btn btn-solid" href="https://github.com/afnannuzulasugihartono/opera-agent/issues/new">Laporkan</a>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
