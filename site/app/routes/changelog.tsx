import { Link } from 'react-router';
import { seoMeta } from '../lib/seo.js';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return seoMeta({
    title: 'Changelog — Navego',
    description: 'Setiap rilis Navego tercatat: tanggal, judul jujur, dan isi patch — dari 1.6.22 sampai versi yang berjalan di browser Anda.',
    path: '/changelog'
  });
}

// WHY THIS FILE CARRIES THE DATA INLINE.
// The list is the product's own history; reading it from the repo at runtime would need a fetch or a build step nobody asked for.
// Every row below is generated from docs/releases/<version>.md (the @title line plus the first bullets), so the page cannot drift from what shipped — regenerate with the script and review the diff.

const ENTRIES: Array<[version: string, date: string, title: string, points: string[]]> = [
  ['1.7.6', '2026-11-18', 'the rename ships end-to-end; MCP Registry publishes from CI.', ['Navego is the only name left on the wire, in the CLI, in the CRX, on the site, in the docs, and in the MCP registry.', '`navego doctor --json` emits one object', 'MCP Registry publishes from CI']],
  ['1.7.5', '2026-11-17', 'audit fixes; bridge loopback door behind one token; CSP tightened.', ['The loopback door now requires one token.', 'CSP dropped the bare `https:` wildcard', 'Contract fixes:']],
  ['1.7.4', '2026-11-17', 'install baru membuka dashboard pair langsung; halaman onboarding dihapus.', ['Fresh install membuka halaman pairing dashboard', '`extension/onboarding.html` dihapus.']],
  ['1.7.3', '2026-11-17', 'onboarding first-run: jelas dalam satu layar, satu tombol.', ['Onboarding page disederhanakan.']],
  ['1.7.2', '2026-11-17', 'the product is Navego; the update service answers both appids without an id.', ['Satu nama produk: Navego.', 'Paket npm tetap `kemudi`', '`navego-update` sudah live']],
  ['1.7.1', '2026-11-16', '40 tools, every one `browser_` + a job name; the site ships Corbin again.', []],
  ['1.6.59', '2026-11-15', 'the Tampermonkey idiom closed; every icon, no dots.', []],
  ['1.6.58', '2026-11-15', 'one face for the whole product, and pages that show it.', []],
  ['1.6.57', '2026-11-15', 'one frame for every full-height screen the extension owns, and a first-run page whose button pairs.', []],
  ['1.6.56', '2026-11-15', 'the paired browser is told so, and the update is one door.', []],
  ['1.6.55', '2026-11-15', 'the panel reads like a product: one ground, one identity, one verdict, one action, quiet doors.', []],
  ['1.6.54', '2026-11-15', 'one door: the manual pairing path is deleted everywhere; the one-click pair is the only way to tie a browser to an account.', []],
  ['1.6.53', '2026-11-15', 'the pair lives everywhere: the popup\'s first row, the first-run page, the dashboard that fires it for you.', []],
  ['1.6.52', '2026-11-15', 'the dashboard pairs the browser in one click, and the local road is the only road.', []],
  ['1.6.51', '2026-11-14', 'the extension is TypeScript end-to-end and loads without a SyntaxError.', []],
  ['1.6.50', '2026-11-13', 'dump_page reads the tab it was asked for, not the one it happens to be looking at.', []],
  ['1.6.49', '2026-11-13', 'the agent can read a page as data, and save one without a dialog.', ['`scan_page` is gone.', 'Agents ask about a page they cannot see']],
  ['1.6.48', '2026-11-12', 'provider pins: switch_device and per-provider routing.', ['No behaviour change for an existing caller.', '`browser_status` answers `pinSource`', 'Breaking:']],
  ['1.6.47', '2026-11-12', 'one reader, two answers: read_page with view.', ['Breaking for `read_page_map` directly:', 'New `view` field on `read_page`:']],
  ['1.6.46', '2026-11-12', 'the command installs the extension, and uninstall removes it.', []],
  ['1.6.45', '2026-11-12', 'the registry accepts the runner\'s identity, proven once.', []],
  ['1.6.44', '2026-11-12', 'record and scan a page, and see what the visitor sees.', []],
  ['1.6.43', '2026-11-11', 'the local road asks the bridge its own question, and every road has a number.', []],
  ['1.6.42', '2026-11-11', 'the panel sizes once, and the release pushes itself out.', []],
  ['1.6.41', '2026-11-11', 'the update can be pulled, and the page can close.', []],
  ['1.6.40', '2026-11-11', 'the refusal names the flag that turns the feature on.', []],
  ['1.6.39', '2026-11-11', 'the extension updates itself, once the reader has said where it may write.', []],
  ['1.6.38', '2026-11-11', 'the extension says when it is behind, so a version that stands still is no longer a mystery.', []],
  ['1.6.37', '2026-11-11', 'the dashboard tells the truth, and a device knows which browser it is.', []],
  ['1.6.36', '2026-11-09', 'one browser, one device, even when the extension is removed and installed again.', []],
  ['1.6.35', '2026-11-09', 'the plan you are on is visible before it runs out, and the dashboard says so.', []],
  ['1.6.34', '2026-11-09', 'the local bridge retries once its socket drops.', []],
  ['1.6.33', '2026-11-09', 'no websocket at a dead bridge, and a second browser keeps its name.', []],
  ['1.6.32', '2026-11-09', 'the everyday browser names itself to the meter.', []],
  ['1.6.31', '2026-11-09', 'a second browser is a device, not a rejection.', []],
  ['1.6.30', '2026-11-09', 'a full-page capture that comes back in time to be read.', []],
  ['1.6.29', '2026-11-08', 'a full-page capture that survives the whole document.', []],
  ['1.6.28', '2026-11-08', 'the whole page in one answer, and a worker that says what broke.', []],
  ['1.6.27', '2026-10-16', 'the local loop tells the truth about itself.', []],
  ['1.6.26', '2026-10-25', 'the release notes, written from the commits that made it.', []],
  ['1.6.25', '2026-10-25', 'the release notes, written from the commits that made it.', []],
  ['1.6.24', '2026-10-11', 'the release notes, written from the commits that made it.', []],
  ['1.6.23', '2026-10-11', 'the release notes, written from the commits that made it.', ['`opera_command_events`.', 'The device emits `received`, `step` and `done`.', 'The transport streams.']],
  ['1.6.22', '2026-10-10', 'the release notes, written from the commits that made it.', ['Two floating promises.', '`connectionState` could be reassigned.', 'The state-bridge listener trusted a tag.']]
];

export default function Changelog() {
  return (
    <>
      <SiteHeader current="/changelog" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <p className="crumb">Changelog</p>
            <h1>Setiap rilis, tercatat.</h1>
            <p className="lede">Bukan marketing. Satu baris per versi: tanggal, isi patch, dan tautan ke catatan lengkap di repositori.</p>
          </div>
        </section>

        <section className="band" aria-labelledby="releaseTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Riwayat rilis</p>
                <h2 id="releaseTitle" className="section-title">Dari 1.6.22 sampai hari ini.</h2>
              </div>
              <p className="section-note">Catatan lengkap per versi ada di <a href="https://github.com/afnannuzulasugihartono/navego/tree/main/docs/releases" rel="noreferrer">docs/releases/</a>.</p>
            </div>
            <ol className="changelog">
              {ENTRIES.map(([version, date, title, points]) => (
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
