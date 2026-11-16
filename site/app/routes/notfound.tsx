import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';


export function meta() {
  return [
    { title: 'Halaman tidak ditemukan — Corbin' },
    { name: 'description', content: 'Alamatnya mungkin salah ketik, atau halaman itu sudah dipindahkan. Lima jalan keluar.' }
  ];
}

const EXITS = [
  ['/beranda.html', 'Beranda', 'Cara kerjanya dan semua jawaban umum.'],
  ['/unduh.html', 'Unduh', 'Arsip extension dan sidik jarinya.'],
  ['/index.html', 'Masuk', 'Akun Anda, lewat Google, GitHub, atau magic link.'],
  ['/akun.html', 'Akun', 'Identitas Anda dan penyedia yang tertaut.'],
  ['/dashboard.html', 'Dashboard', 'Device ter-pairing dan riwayatnya.']
] as const;

export default function NotFound() {
  return (
    <>
      <SiteHeader current="/404.html" />
      <main className="wrap">
        <section className="statement" style={{ paddingTop: 56, paddingBottom: 10 }}>
          <figure className="hero-frame" style={{ maxWidth: 400 }} aria-hidden="true">
            <img src="/assets/raven-1874.jpg" width={1454} height={852} alt="" loading="eager" />
            <figcaption><em>Corvus corax</em> — setelah Naumann, 1874 · public domain</figcaption>
          </figure>
          <h1 style={{ fontSize: 'clamp(38px,6vw,64px)', letterSpacing: '-0.03em', margin: '22px 0 10px' }}>Halaman ini tidak ada</h1>
          <p style={{ fontSize: 15, color: 'var(--muted-2)', maxWidth: '48ch' }}>Alamatnya mungkin salah ketik, atau halaman itu sudah dipindahkan. Lima jalan keluar:</p>
        </section>
        <ul style={{ listStyle: 'none', display: 'grid', gap: 10, maxWidth: 620, margin: '20px 0 40px' }}>
          {EXITS.map(([href, title, body]) => (
            <li key={href}>
              <Link to={href} style={{ display: 'grid', gap: 2, background: 'var(--panel)', border: '1px solid var(--line)', boxShadow: 'var(--panel-shadow)', borderRadius: 12, padding: '13px 16px', textDecoration: 'none' }}>
                <strong style={{ fontSize: 14.5 }}>{title}</strong>
                <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>{body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
