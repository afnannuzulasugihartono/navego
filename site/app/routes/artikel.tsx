// decisions.json -> D35, D36, D37 (no eyebrows, h1 first, commas not middle dots)

import { Link } from 'react-router';
import { seoMeta } from '../lib/seo.js';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return seoMeta({
    title: 'Artikel — Navego',
    description: 'Tulisan pendek tentang browser yang digerakkan satu perintah teks: cara kerja, alasan di balik keputusan, dan batasan yang dijaga.',
    path: '/artikel'
  });
}

const ARTIKEL = [
  {
    href: '/artikel/ai-browser-indonesia',
    slug: 'ai-browser-indonesia',
    title: 'AI yang mengenal browser Anda, dalam bahasa Indonesia',
    dek: 'Kenapa asisten AI yang dijalankan di browser Anda sendiri — bukan di server orang lain — adalah bentuk asisten yang benar untuk pekerjaan browser sehari-hari.',
    date: '2026-11-18',
    readingTime: '8 menit'
  }
] as const;

export default function Artikel() {
  return (
    <>
      <SiteHeader current="/artikel" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <h1>Artikel.</h1>
            <p className="lede">Tulisan pendek tentang browser yang digerakkan satu perintah teks — cara kerjanya, alasan di balik keputusannya, dan batasannya.</p>
          </div>
        </section>

        <div className="wrap py-7">
          <div className="artikel-grid">
            {ARTIKEL.map((item) => (
              <Link key={item.slug} to={item.href} className="card artikel-card">
                <div className="cover" aria-hidden="true" />
                <div className="card-body">
                  <h2 className="artikel-card__title">{item.title}</h2>
                  <p className="text-muted-2">{item.dek}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
