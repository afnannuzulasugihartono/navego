import { Link } from 'react-router';
import { seoMeta } from '../lib/seo.js';
import { SiteHeader, SiteFooter } from '../components/Chrome';

export function meta() {
  return seoMeta({
    title: 'Navego — Your AI agent in a real browser',
    description: 'Websites without APIs. Navego opens portals, fills forms, downloads data, and saves Excel, Word, or PowerPoint files in your own browser. Local, no scripts, no eval.',
    path: '/en',
    locale: 'en_US'
  });
}

const STEPS = [
  { title: 'Point at a tab', body: 'You choose the page. Navego reads only that tab.' },
  { title: 'Write one command', body: 'Plain language. No selectors, no scripts.' },
  { title: 'Take the file', body: 'A real .xlsx, .docx, or .pptx lands in your folder.' }
];

const PROOF = [
  { title: 'Financial report (.xlsx)', body: 'A workbook extracted from a portal table, ready to open and audit.', href: '/contoh/laporan-keuangan-2026-09.xlsx' },
  { title: 'Marketing plan (.docx)', body: 'A real Word document produced from a command, not a wrapped HTML page.', href: '/contoh/rencana-pemasaran-2027.docx' },
  { title: 'Strategy deck (.pptx)', body: 'A PowerPoint deck built from research and traceable figures.', href: '/contoh/rencana-strategis-2027.pptx' }
];

const FAQ = [
  { q: 'Does Navego read all my tabs?', a: 'No. Only the tab you point at.' },
  { q: 'Can the agent type my password or OTP?', a: 'Never. Those fields are always refused.' },
  { q: 'Where does my page data go?', a: 'Pages are read on your machine. Supabase stores your account, devices, commands and results. Your chosen model receives only the goal and a capped page excerpt.' },
  { q: 'What happens when a step fails?', a: 'OTP, CAPTCHA and login pause for a human handoff with resume instructions. continueOnError keeps successful steps and the exact failures — no retry loop.' },
  { q: 'What does it cost beyond the plan?', a: 'Navego adds no token markup or proxy fee. Your AI provider charges you at their own rates.' }
];

export default function English() {
  return (
    <>
      <SiteHeader />
      <main lang="en">
        <section className="hero" aria-labelledby="english-title">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <h1 id="english-title">Websites without APIs. Commands into files.</h1>
              <p className="lede">
                Navego is an AI agent in a real browser: it opens portals, fills forms, downloads data, and saves the result as Excel, Word, or PowerPoint. Local, no scripts, no eval.
              </p>
              <div className="hero-cta">
                <Link className="btn btn-solid" to="/unduh">Start free</Link>
                <Link className="btn btn-ghost" to="/docs">Read the docs</Link>
              </div>
              <div className="hero-proof" aria-label="Product proof">
                <span>Local browser</span>
                <span>40 MCP tools</span>
                <span>SHA-256 per file</span>
              </div>
              <p className="microcopy">An extension and a local driver you can inspect and remove. <Link to="/beranda">Bahasa Indonesia →</Link></p>
            </div>
            <div className="demo-window" aria-hidden="true">
              <div className="demo-bar">
                <span className="demo-dots"><i /><i /><i /></span>
                <span className="demo-url">tab — portal.internal.id/quarterly-report</span>
              </div>
              <div className="demo-body">
                <p className="cmd-bubble"><small>Your command</small>Summarize this report and save it as Excel.</p>
                <ul className="act-list">
                  <li className="act is-done"><i />Read the tab — 3 tables found</li>
                  <li className="act is-done"><i />Fill 3 fields, click Export</li>
                  <li className="act is-done"><i />Save to Downloads</li>
                </ul>
                <div className="file-grid">
                  <span className="file-chip"><b>✓</b>quarterly-report.xlsx</span>
                  <span className="file-chip"><b>✓</b>sha256 a4f12765…</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="english-steps">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="english-steps" className="section-title">Three steps. No scripts.</h2>
              </div>
              <p className="section-note">Your browser stays your browser.</p>
            </div>
            <div className="tile-grid">
              {STEPS.map((item, index) => (
                <div className="tile" key={item.title}>
                  <span className="start-num">{index + 1}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
            <div className="stat-strip mt-6">
              <div className="stat"><b>40</b><span>MCP tools</span></div>
              <div className="stat"><b>36</b><span>browser primitives</span></div>
              <div className="stat"><b>6</b><span>permissions, no more</span></div>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="english-proof">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="english-proof" className="section-title">Not a screenshot. Files you can open.</h2>
              </div>
              <p className="section-note">Download the examples. Judge them yourself.</p>
            </div>
            <div className="tile-grid">
              {PROOF.map((item) => (
                <article className="tile" key={item.href}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <p><a href={item.href} download>Download the example →</a></p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="english-price">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="english-price" className="section-title">Try first. Pay if it earns its place.</h2>
              </div>
              <p className="section-note">From $1. No subscription. <Link to="/harga">See every plan →</Link></p>
            </div>
            <div className="plans">
              <div className="card plan">
                <p className="plan-name">Starter</p>
                <p className="plan-price">$1<small> / month</small></p>
                <ul><li>1,000 commands / day</li><li>50 per session</li><li>PayPal</li></ul>
              </div>
              <div className="card plan is-primary">
                <p className="plan-name">Business</p>
                <p className="plan-price">$17<small> / 6 months</small></p>
                <ul><li>17,000 commands / day</li><li>500 per session</li><li>All features, priority support</li></ul>
              </div>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="english-faq">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="english-faq" className="section-title">Questions before you install.</h2>
              </div>
            </div>
            <div className="faq">
              {FAQ.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="cta-band">
              <h2 className="section-title">One task. One real file.</h2>
              <p>Start from a tab you already have open.</p>
              <div className="hero-cta">
                <Link className="btn btn-solid" to="/unduh">Install free</Link>
                <Link className="btn btn-ghost" to="/docs">Read the docs</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
