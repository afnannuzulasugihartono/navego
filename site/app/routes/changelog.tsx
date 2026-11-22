// decisions.json -> D35, D36 (no eyebrows, h1 first)

import { Link } from 'react-router';
import { seoMeta } from '../lib/seo.js';
import { SiteFooter, SiteHeader } from '../components/Chrome';
import releases from '../data/releases.json';

export function meta() {
  return seoMeta({
    title: 'Changelog — Navego',
    description: 'Setiap rilis Navego tercatat: tanggal, judul jujur, dan isi patch — dari 1.6.22 sampai versi yang berjalan di browser Anda.',
    path: '/changelog'
  });
}

// THIS PAGE IS A VIEW OF THE RELEASE NOTES.
// The rows are generated from docs/releases/<version>.md into site/app/data/releases.json by `npm run changelog`; the version bump regenerates the same file, so a release cannot ship without its row.

export default function Changelog() {
  return (
    <>
      <SiteHeader current="/changelog" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <h1>Setiap rilis, tercatat.</h1>
            <p className="lede">Bukan marketing. Satu baris per versi: tanggal, isi patch, dan tautan ke catatan lengkap di repositori.</p>
          </div>
        </section>

        <section className="band" aria-labelledby="releaseTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="releaseTitle" className="section-title">Dari 1.6.22 sampai hari ini.</h2>
              </div>
              <p className="section-note">Catatan lengkap per versi ada di <a href="https://github.com/afnannuzulasugihartono/navego/tree/main/docs/releases" rel="noreferrer">docs/releases/</a>.</p>
            </div>
            <ol className="changelog">
              {releases.entries.map(({ version, date, title, points }) => (
                <li key={version} className="card changelog-row" id={'v-' + version}>
                  <div className="changelog-head">
                    <span className="changelog-version">{version}</span>
                    <time className="changelog-date" dateTime={date}>{date}</time>
                  </div>
                  <p className="changelog-title">{title}</p>
                  {points.length ? (
                    <ul className="changelog-points">
                      {points.map((point) => <li key={point}>{point}</li>)}
                    </ul>
                  ) : null}
                  <a className="changelog-link" href={'https://github.com/afnannuzulasugihartono/navego/blob/main/docs/releases/' + version + '.md'} rel="noreferrer">Catatan lengkap →</a>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="band">
          <div className="wrap">
            <div className="cta-band">
              <h2 className="section-title" style={{ color: '#ffffff' }}>Versi Anda tertinggal?</h2>
              <p>Navego memberi tahu sendiri, sekali ditanya. Atau ambil versi terbaru dari halaman Unduh.</p>
              <div className="hero-cta" style={{ marginTop: 'var(--s-2)' }}>
                <Link className="btn btn-solid" to="/unduh">Unduh versi terbaru</Link>
                <Link className="btn btn-ghost" to="/dukungan">Tanya dukungan</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
