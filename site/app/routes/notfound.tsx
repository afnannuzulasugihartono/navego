// decisions.json -> D35, D36 (no eyebrows, h1 first)

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
            <h1>Halaman ini tidak ada.</h1>
            <p className="lede">Alamatnya mungkin salah ketik, atau halaman itu sudah dipindahkan. Lima jalan keluar:</p>
          </div>
        </section>
        <div className="wrap py-7">
          <ul className="list-plain stack-3">
            {EXITS.map(([href, title, body]) => (
              <li key={href}>
                <Link to={href} className="card stack-1">
                  <strong className="text-navy">{title}</strong>
                  <span className="text-muted-2 text-sm">{body}</span>
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
