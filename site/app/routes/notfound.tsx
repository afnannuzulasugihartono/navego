import { Link } from 'react-router';
import { seoMeta } from '../lib/seo.js';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return seoMeta({
    title: 'Halaman tidak ditemukan — Navego',
    description: 'Alamatnya mungkin salah ketik, atau halaman itu sudah dipindahkan. Lima jalan keluar.',
    path: '/404'
  });
}

const EXITS = [
  ['/beranda', 'Beranda', 'Cara kerjanya dan semua jawaban umum.'],
  ['/unduh', 'Unduh', 'Arsip extension dan sidik jarinya.'],
  ['/', 'Masuk', 'Akun Anda, lewat Google, GitHub, atau magic link.'],
  ['/akun', 'Akun', 'Identitas Anda dan penyedia yang tertaut.'],
  ['/dashboard', 'Dashboard', 'Device ter-pairing dan riwayatnya.']
] as const;

export default function NotFound() {
  return (
    <>
      <SiteHeader current="/404" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <p className="crumb">404</p>
            <h1>Halaman ini tidak ada.</h1>
            <p className="lede">Alamatnya mungkin salah ketik, atau halaman itu sudah dipindahkan. Lima jalan keluar:</p>
          </div>
        </section>
        <div className="wrap" style={{ paddingBlock: 'var(--s-7)' }}>
          <ul style={{ listStyle: 'none', display: 'grid', gap: 'var(--s-3)', maxWidth: '36rem' }}>
            {EXITS.map(([href, title, body]) => (
              <li key={href}>
                <Link to={href} className="card" style={{ display: 'grid', gap: 'var(--s-1)', textDecoration: 'none' }}>
                  <strong style={{ color: 'var(--navy-deep)' }}>{title}</strong>
                  <span style={{ color: 'var(--muted-2)', fontSize: 'var(--text-sm)' }}>{body}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
