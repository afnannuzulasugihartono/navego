import { useEffect, useState } from 'react';
import { seoMeta } from '../lib/seo.js';
import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';
import { BILLING, ensureSession, getStoredToken, headersFor } from '../lib/auth';
import { bandForCountry, type PricingBand } from '../lib/region.js';

export function meta() {
  return seoMeta({
    title: 'Harga — Navego',
    description: 'Bayar satu kali, hingga satu tahun. Tidak ada yang terpotong sebelum pekerjaan selesai. Plan USD ($1–$33) dibayar PayPal, dibagi menurut daya beli: Asia/Arab/Afrika atau Eropa & AS.',
    path: '/harga'
  });
}

const ASIA_PLANS = [
  { id: 'plan.usd-1', price: '$1', name: 'Starter', quota: '1.000 perintah/hari', premium: false },
  { id: 'plan.usd-3', price: '$3', name: 'Basic', quota: '3.000 perintah/hari', premium: false },
  { id: 'plan.usd-5', price: '$5', name: 'Plus', quota: '5.000 perintah/hari', premium: false },
  { id: 'plan.usd-7', price: '$7', name: 'Pro', quota: '7.000 perintah/hari', premium: false },
  { id: 'plan.usd-9', price: '$9', name: 'Advanced', quota: '9.000 perintah/hari', premium: false }
] as const;

const EUROPE_PLANS = [
  { id: 'plan.usd-1', price: '$1', name: 'Starter', quota: '1.000 perintah/hari', premium: false },
  { id: 'plan.usd-9', price: '$9', name: 'Pro', quota: '9.000 perintah/hari', premium: false },
  { id: 'plan.usd-17', price: '$17', name: 'Business', quota: '17.000 perintah/hari', premium: true },
  { id: 'plan.usd-33', price: '$33', name: 'Enterprise', quota: 'Tanpa batas', premium: true }
] as const;

const QA = [
  ['rencana', 'Plan, bukan langganan tersembunyi', 'USD, sekali beli, langsung aktif. Kawasan Anda terdeteksi otomatis dari IP — plan yang tampil sesuai daya beli negara Anda, Asia/Arab/Afrika atau Eropa & AS. Jika kawasan tidak bisa terdeteksi, kedua grup ditampilkan.'],
  ['kuota', 'Kuota perintah per hari', 'Setiap plan punya kuota harian. Kuota terpakai tidak bertambah di hari berikutnya; kuota hari ini hanya bisa dipakai hari ini.'],
  ['fitur', 'Semua fitur, bukan tier yang dikebiri', 'Asia/Arab/Afrika: Starter, Basic, Plus, Pro, Advanced — semuanya plan dasar. Eropa/AS: Starter, Pro, Business (6 bulan), Enterprise (1 tahun); Business dan Enterprise membawa statement, VM, dan remote drive, plus prioritas dukungan.'],
  ['paypal', 'Bayar dengan PayPal', 'Plan USD dibayar dengan PayPal. Setelah pembayaran dikonfirmasi PayPal Anda, plan aktif otomatis.'],
  ['pekerjaan', 'Kuota harian, bukan meteran per tugas', 'Paket membuka kuota harian sejak hari pertama. Pekerjaan yang gagal tidak memotong kuota secara proporsional; kuota harian adalah batas hari itu, bukan tagihan per tugas.'],
  ['gagal', 'Pekerjaan gagal, Anda tidak dirugikan', 'Pekerjaan yang berhenti karena alasan di luar kendali Anda tidak mengurangi kuota harian secara proporsional. Kuota yang sudah terpakai tetap terpakai — itu bagian dari perhitungan harian dan tidak bisa dikembalikan.']
] as const;

export default function Harga() {
  const [note, setNote] = useState('');
  const [warn, setWarn] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const [country, setCountry] = useState<string | null>(null);
  const [detected, setDetected] = useState(false);
  const [band, setBand] = useState<PricingBand | 'both'>('both');

  useEffect(() => {
    setSignedOut(!getStoredToken());
    let alive = true;
    fetch('/api/region', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!alive) return;
        const code = typeof data?.country === 'string' ? data.country.toUpperCase() : null;
        setCountry(code);
        setBand(bandForCountry(code) ?? 'both');
        setDetected(true);
      })
      .catch(() => {
        if (!alive) return;
        setDetected(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const regionName = (code: string): string => {
    try {
      return new Intl.DisplayNames(['id'], { type: 'region' }).of(code) ?? code;
    } catch {
      return code;
    }
  };

  async function buy(planKind: string) {
    const current = await ensureSession();
    if (!current) {
      setSignedOut(true);
      setNote('');
      return;
    }
    setSignedOut(false);
    setWarn(false);
    setNote('Menyiapkan halaman PayPal...');
    try {
      const response = await fetch(BILLING, {
        method: 'POST',
        headers: headersFor(current),
        body: JSON.stringify({ action: 'paypal-buy', plan: planKind })
      });
      const answer = await response.json().catch(() => null);
      const url = answer?.url || answer?.approvalUrl;
      if (answer?.ok && url) {
        window.open(url, '_blank', 'noopener,noreferrer');
        setNote('Halaman PayPal terbuka di tab baru. Selesaikan pembayaran di sana; plan aktif setelah pembayaran dikonfirmasi.');
        return;
      }
      setWarn(true);
      setNote(`PayPal tidak bisa dibuka: ${answer?.error || answer?.message || answer?.why || `HTTP ${response.status}`}.`);
    } catch (error) {
      setWarn(true);
      setNote(`PayPal tidak bisa dibuka: ${error instanceof Error ? error.message : 'jaringan'}.`);
    }
  }

  const grid = 'repeat(auto-fit, minmax(13rem, 1fr))';

  const PlanCard = (plan: { id: string; price: string; name: string; quota: string; premium: boolean }) => (
    <section className="card plan" role="listitem" key={plan.id} aria-labelledby={`usd-${plan.id}`}>
      <p className="plan-name">{plan.name}</p>
      <h2 id={`usd-${plan.id}`} className="plan-price">{plan.price}<small> / {plan.id === 'plan.usd-17' ? '6 bulan' : plan.id === 'plan.usd-33' ? 'tahun' : 'bulan'}</small></h2>
      <ul>
        <li>{plan.quota}</li>
        <li>36 primitive browser</li>
        <li>{plan.premium ? 'Semua fitur (statement, VM, remote drive) + prioritas' : 'Plan dasar'}</li>
      </ul>
      <button className="btn btn-solid btn-sm" type="button" onClick={() => buy(plan.id)} style={{ width: '100%' }}>Beli dengan PayPal</button>
    </section>
  );

  return (
    <>
      <SiteHeader current="/harga" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <p className="crumb">Harga</p>
            <h1>Satu bayar, hingga satu tahun.</h1>
            <p className="lede">Plan USD dibayar PayPal. Kuota per hari yang jelas. Tidak ada yang dipotong sebelum pekerjaan selesai.</p>
          </div>
        </section>

        {detected ? (
          <section className="band" aria-label="Kawasan harga" style={{ paddingBottom: 0 }}>
            <div className="wrap">
              {country && bandForCountry(country) ? (
                <p className="section-note" style={{ margin: 0 }}>
                  Kawasan terdeteksi dari IP Anda: <strong>{regionName(country)}</strong> — plan yang tampil sesuai daya beli kawasan Anda.
                </p>
              ) : (
                <p className="section-note" style={{ margin: 0 }}>Kami tidak bisa mendeteksi kawasan Anda dari IP; kedua grup ditampilkan.</p>
              )}
            </div>
          </section>
        ) : null}

        {band !== 'premium' ? (
        <section className="band" aria-labelledby="asiaTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Asia · Arab · Afrika</p>
                <h2 id="asiaTitle" className="section-title">Daya beli kawasan ini: plan lebih terjangkau.</h2>
              </div>
              <p className="section-note">Sekali beli, langsung aktif. Tidak diperpanjang otomatis.</p>
            </div>
            <div className="plans" role="list" style={{ gridTemplateColumns: grid }}>
              {ASIA_PLANS.map(PlanCard)}
            </div>
          </div>
        </section>
        ) : null}

        {band !== 'affordable' ? (
        <section className="band band-soft" aria-labelledby="europeTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Europa & AS</p>
                <h2 id="europeTitle" className="section-title">Daya beli kawasan ini: nada akselerasi.</h2>
              </div>
              <p className="section-note">Sekali beli, langsung aktif. Tidak diperpanjang otomatis.</p>
            </div>
            <div className="plans" role="list" style={{ gridTemplateColumns: grid }}>
              {EUROPE_PLANS.map(PlanCard)}
            </div>
          </div>
        </section>
        ) : null}

        <section className="band" aria-label="Pembayaran" style={{ paddingTop: 0 }}>
          <div className="wrap">
            {signedOut ? (
              <p className="status" style={{ marginTop: 'var(--s-4)', textAlign: 'center' }}>Pembayaran memakai akun Anda. <Link to="/">Masuk dulu</Link>, lalu kembali ke halaman ini.</p>
            ) : null}
            {note ? <p className={warn ? 'status warn' : 'status'} role="status" aria-live="polite" style={{ marginTop: 'var(--s-4)', textAlign: 'center' }}>{note}</p> : null}
            <p className="note" style={{ marginTop: 'var(--s-3)', textAlign: 'center' }}>Bayar dengan <strong>PayPal</strong>. Plan langsung aktif setelah Anda menyelesaikan pembayaran di PayPal.</p>
          </div>
        </section>

        <section className="band band-soft" aria-labelledby="qaTitle">
          <div className="wrap">
            <h2 id="qaTitle" className="section-title" style={{ marginBottom: 'var(--s-5)' }}>Pertanyaan soal plan.</h2>
            <div className="faq">
              {QA.map(([id, q, a]) => (
                <details key={id} id={id} open={id === 'rencana'}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap">
            <div className="cta-band">
              <h2 className="section-title" style={{ color: '#ffffff' }}>Pasang gratis. Putuskan setelah Anda lihat hasilnya.</h2>
              <p>Jalankan satu pekerjaan pertama, lihat berkasnya, baru putuskan mau upgrade.</p>
              <div className="hero-cta" style={{ marginTop: 'var(--s-2)' }}>
                <Link className="btn btn-solid" to="/unduh">Pasang gratis</Link>
                <Link className="btn btn-ghost" to="/docs">Baca docs</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}