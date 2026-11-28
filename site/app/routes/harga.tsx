// decisions.json -> D35, D36 (no eyebrows, h1 first)

import { useEffect, useRef, useState } from 'react';
import { readConsent, readRegionCookie, storeRegionCookie } from '../lib/consent.js';
import { seoMeta } from '../lib/seo.js';
import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';
import { BILLING, PUBLISHABLE_KEY, REST, ensureSession, getStoredToken, headersFor } from '../lib/auth';
import { track } from '../lib/funnel';
import { planFeedback } from '../lib/checkout-feedback';
import { claimGuestCheckout, forgetGuestCheckout, readGuestCheckout, rememberGuestCheckout, type GuestCheckout } from '../lib/checkout-guest';
import { forgetPendingPlan, readPendingPlan, rememberPendingPlan } from '../lib/checkout-intent';
import { bandForCountry, type PricingBand } from '../lib/region.js';

export function meta() {
  return seoMeta({
    title: 'Harga — Navego',
    description: 'Sekali beli, langsung aktif. PayPal. Tidak ada tagihan tersembunyi.',
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
  ['rencana', 'Plan, bukan langganan', 'Sekali beli, langsung aktif. Starter, Basic, Plus, Pro, dan Advanced berlaku satu bulan; Business enam bulan; Enterprise satu tahun. Tidak ada perpanjangan otomatis.'],
  ['kuota', 'Kuota harian', 'Kuota hari ini habis hari ini. Tidak diakumulasikan.'],
  ['fitur', 'Semua fitur, bukan tier yang dikebiri', 'Asia/Arab/Afrika: lima plan dasar. Eropa/AS: Starter, Pro, Business, Enterprise — dua terakhir dengan prioritas dukungan.'],
  ['paypal', 'Bayar dengan PayPal', 'Selesaikan di PayPal. Anda bisa bayar tanpa akun, lalu masuk dan mengklaim order Anda. Plan aktif setelah pembayaran dikonfirmasi.'],
  ['biaya', 'Biaya di luar plan', 'Navego tidak menambah markup token atau biaya proxy. Model AI yang sudah Anda pakai ditagih oleh provider Anda sendiri, sesuai tarif mereka.'],
  ['gagal', 'Pekerjaan gagal, Anda tidak dirugikan', 'Kuota terpakai tetap terpakai. Itu perhitungan harian.']
] as const;

export default function Harga() {
  const [note, setNote] = useState('');
  const [warn, setWarn] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const [country, setCountry] = useState<string | null>(null);
  const [detected, setDetected] = useState(false);
  const [band, setBand] = useState<PricingBand | 'both'>('both');
  const [source, setSource] = useState<'ip' | 'device' | 'cache' | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [buyPending, setBuyPending] = useState<string | null>(null);
  const [lastPlan, setLastPlan] = useState<string | null>(null);
  const [checkoutNote, setCheckoutNote] = useState('');
  const [guestOrder, setGuestOrder] = useState<GuestCheckout | null>(null);

  const countryRef = useRef<string | null>(null);

  async function applyRegion(code: string | null, via: 'ip' | 'device' | 'cache') {
    countryRef.current = code;
    if (code && readConsent() === 'granted') storeRegionCookie(code);
    setCountry(code);
    setBand(bandForCountry(code) ?? 'both');
    setSource(code ? via : null);
    setDetected(true);
  }

  // Reverse-geocode the device's coords to a country: the one honest way to know where a visitor behind a VPN actually is.
  // Only the country code is read; the coordinates go to bigdatacloud.net (no key, no account) and are never stored or logged.
  async function applyDeviceLocation(latitude: number, longitude: number): Promise<boolean> {
    try {
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`, { cache: 'no-store' });
      const data = await response.json();
      const code = typeof data?.countryCode === 'string' && /^[A-Za-z]{2}$/.test(data.countryCode) ? data.countryCode.toUpperCase() : null;
      if (!code) return false;
      await applyRegion(code, 'device');
      return true;
    } catch {
      return false;
    }
  }

  function detectFromIp() {
    fetch('/api/region', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const code = typeof data?.country === 'string' ? data.country.toUpperCase() : null;
        void applyRegion(code, 'ip');
      })
      .catch(() => {
        void applyRegion(null, 'ip');
      });
  }

  function detectFromDevice() {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      detectFromIp();
      return;
    }
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition((position) => {
      void applyDeviceLocation(position.coords.latitude, position.coords.longitude).then((ok) => {
        setGeoBusy(false);
        if (!ok) detectFromIp();
      });
    }, () => {
      setGeoBusy(false);
      detectFromIp();
    }, { timeout: 8000, maximumAge: 3600000 });
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    if (checkout === 'success') setCheckoutNote('PayPal selesai. Aktivasi plan sedang dikonfirmasi; halaman ini akan menunjukkan hasilnya.');
    if (checkout === 'cancelled') setCheckoutNote('Checkout dibatalkan. Plan belum dibeli.');
    if (checkout === 'success') void finishCheckout();
    setSignedOut(!getStoredToken());
    setGuestOrder(readGuestCheckout());
    const pending = readPendingPlan();
    if (pending) {
      setLastPlan(pending);
      if (getStoredToken()) setNote('Lanjutkan plan pilihan Anda. Klik Beli dengan PayPal.');
    }
    // The cookie a consented visitor carries pre-fills the correct group instantly; the mandatory detection still runs and corrects it if the device moved.
    if (readConsent() === 'granted') {
      const cached = readRegionCookie();
      if (cached) void applyRegion(cached, 'cache');
    }
    const onConsent = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail === 'granted' && countryRef.current) storeRegionCookie(countryRef.current);
    };
    window.addEventListener('navego:consent', onConsent);
    // THE PAGE ASKS FOR LOCATION IMMEDIATELY because the owner requires the region to come from the device geolocation whenever the browser can answer it - a visitor behind a VPN is priced by where they actually are, not by where the VPN exits.
    // The browser owns the final say: a denial, a timeout or a missing API falls back to the IP the edge reports, and nothing here blocks the page from rendering either way.
    detectFromDevice();
    return () => {
      window.removeEventListener('navego:consent', onConsent);
    };
  }, []);

  async function retryWithDevice() {
    setGeoBusy(true);
    setGeoError('');
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGeoError('Browser Anda tidak menyediakan lokasi perangkat.');
      setGeoBusy(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
      const ok = await applyDeviceLocation(position.coords.latitude, position.coords.longitude);
      setGeoBusy(false);
      if (!ok) setGeoError('Lokasi didapat, tapi negaranya tidak bisa dibaca atau koneksinya gagal.');
    }, () => {
      setGeoBusy(false);
      setGeoError('Izin lokasi ditolak — kawasan dari IP tetap dipakai. Anda bisa mengizinkannya lagi dari pengaturan situs di browser.');
    }, { timeout: 8000, maximumAge: 3600000 });
  }

  const regionName = (code: string): string => {
    try {
      return new Intl.DisplayNames(['id'], { type: 'region' }).of(code) ?? code;
    } catch {
      return code;
    }
  };

  async function finishCheckout() {
    // PAYPAL RETURNS TO THE TAB IT OPENED, AND THAT TAB HAS NO sessionStorage COPY.
    // The approval page is opened with `noopener`, so on return it is a browsing context without the opener's sessionStorage: the order id saved at buy time is not there, and the capture call never happened because of it.
    // PayPal appends `token=<order id>` to return_url, which is the order id the capture needs; localStorage is the fallback for a return that arrives without it.
    const guest = readGuestCheckout();
    const orderId = guest?.orderId || new URLSearchParams(window.location.search).get('token') || window.localStorage.getItem('navego-paypal-order');
    if (!orderId) {
      setWarn(true);
      setNote('Order PayPal tidak ditemukan di tab ini. Plan belum dapat dikonfirmasi — hubungi dukungan dengan transaction ID Anda.');
      return;
    }
    try {
      const token = await ensureSession();
      if (!token) {
        setSignedOut(true);
        return;
      }
      if (guest && guest.orderId === orderId) {
        const claimed = await claimGuestCheckout(guest, `${REST}/rpc/opera_paypal_claim_order`, headersFor(token));
        if (!claimed.ok) {
          setWarn(true);
          setNote(`Order belum bisa diklaim: ${claimed.error || 'tidak diketahui'}. Hubungi dukungan dengan order ID ${orderId}.`);
          return;
        }
        forgetGuestCheckout();
        setGuestOrder(null);
      }
      const response = await fetch(BILLING, {
        method: 'POST',
        headers: headersFor(token),
        body: JSON.stringify({ action: 'paypal-capture', orderId })
      });
      const answer = await response.json().catch(() => null);
      if (answer?.ok) {
        setWarn(false);
        setNote(`Plan ${answer.plan} aktif. Selamat bekerja!`);
        window.localStorage.removeItem('navego-paypal-order');
        forgetPendingPlan();
        return;
      }
      setWarn(true);
      setNote(`Aktivasi belum selesai: ${answer?.error || `HTTP ${response.status}`}. Hubungi dukungan dengan order ID ${orderId}.`);
    } catch (error) {
      setWarn(true);
      setNote(`Aktivasi belum selesai: ${error instanceof Error ? error.message : 'jaringan'}. Hubungi dukungan dengan order ID ${orderId}.`);
    }
  }

  async function startGuestOrder(planKind: string, planKey: string): Promise<boolean> {
    // A BUYER WITHOUT AN ACCOUNT MAY STILL PAY.
    // The order is quoted without an owner, and one account claims it after signing in, so the conversion wall before PayPal is gone.
    setBuyPending(planKey);
    setWarn(false);
    setNote('Menyiapkan halaman PayPal...');
    try {
      const response = await fetch(BILLING, {
        method: 'POST',
        headers: { apikey: PUBLISHABLE_KEY, 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'paypal-buy', plan: planKind, guest: true })
      });
      const answer = await response.json().catch(() => null);
      const url = answer?.url || answer?.approvalUrl;
      const amountCents = Number(answer?.amountCents);
      if (!answer?.ok || !url || !answer.guestToken || !Number.isFinite(amountCents) || amountCents <= 0) return false;
      const orderId = String(answer.orderId || '');
      if (orderId) window.localStorage.setItem('navego-paypal-order', orderId);
      const record: GuestCheckout = {
        orderId,
        token: String(answer.guestToken),
        plan: planKind,
        amountCents,
        currency: String(answer.currency || 'USD')
      };
      rememberGuestCheckout(record);
      setGuestOrder(record);
      window.open(url, '_blank', 'noopener,noreferrer');
      forgetPendingPlan();
      setNote('Halaman PayPal terbuka di tab baru. Selesaikan pembayaran di sana, lalu masuk agar plan aktif untuk akun Anda.');
      return true;
    } catch {
      return false;
    } finally {
      setBuyPending(null);
    }
  }

  async function buy(planKind: string, planKey: string) {
    if (buyPending) return;
    setLastPlan(planKey);
    rememberPendingPlan(planKey);
    track('buy.click', { plan: planKind, rail: 'paypal' });
    const current = await ensureSession();
    if (!current) {
      if (await startGuestOrder(planKind, planKey)) return;
      setSignedOut(true);
      setNote('');
      return;
    }
    setSignedOut(false);
    setWarn(false);
    setBuyPending(planKey);
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
        const orderId = String(answer.orderId || '');
        if (orderId) window.localStorage.setItem('navego-paypal-order', orderId);
        // A WINDOW OPENED WITH `noopener` IS NOT RETURNED, EVEN WHEN IT OPENED.
        // The null this call gives back was read as a blocked popup, so a visitor whose PayPal tab did open was told it did not, and no wording could tell the two apart.
        // The tab carries the order id in localStorage and PayPal hands the order back as `token`, so the purchase completes whether this tab watches it or not.
        window.open(url, '_blank', 'noopener,noreferrer');
        forgetPendingPlan();
        setNote('Halaman PayPal terbuka di tab baru. Selesaikan pembayaran di sana; plan aktif setelah pembayaran dikonfirmasi. Jika tabnya tidak terbuka, izinkan popup untuk situs ini lalu klik beli lagi.');
        return;
      }
      setWarn(true);
      setNote(`PayPal tidak bisa dibuka: ${answer?.error || answer?.message || answer?.why || `HTTP ${response.status}`}.`);
    } catch (error) {
      setWarn(true);
      setNote(`PayPal tidak bisa dibuka: ${error instanceof Error ? error.message : 'jaringan'}.`);
    } finally {
      setBuyPending(null);
    }
  }

  const visiblePlanKeys = new Set<string>();
  if (band !== 'premium') for (const plan of ASIA_PLANS) visiblePlanKeys.add(`asia:${plan.id}`);
  if (band !== 'affordable') for (const plan of EUROPE_PLANS) visiblePlanKeys.add(`europe:${plan.id}`);
  const { present: activePlanPresent, feedback: activeFeedback } = planFeedback({ lastPlan, visiblePlanKeys, pendingKey: buyPending, signedOut, note, warn });
  const signInHref = guestOrder ? `/masuk?next=${encodeURIComponent('/harga?checkout=success')}` : '/masuk?next=/harga';
  const signInMessage = guestOrder ? 'Pembayaran Anda menunggu akun.' : 'Pembayaran memakai akun Anda.';
  const announcement = activeFeedback
    ? activeFeedback.tone === 'signin'
      ? `${signInMessage} Masuk dulu, lalu kembali ke halaman ini.`
      : activeFeedback.message
    : checkoutNote
      || (!activePlanPresent && signedOut ? `${signInMessage} Masuk dulu, lalu kembali ke halaman ini.` : '')
      || (!activePlanPresent && note ? note : '');

  const PlanCard = (plan: { id: string; price: string; name: string; quota: string; premium: boolean }, slot: 'asia' | 'europe') => {
    const planKey = `${slot}:${plan.id}`;
    const feedback = lastPlan === planKey ? activeFeedback : null;
    return (
    <section className="card plan" role="listitem" key={plan.id} aria-labelledby={`usd-${slot}-${plan.id}`}>
      <p className="plan-name">{plan.name}</p>
      <h2 id={`usd-${slot}-${plan.id}`} className="plan-price">{plan.price}<small> sekali bayar, {plan.id === 'plan.usd-17' ? 'berlaku 6 bulan' : plan.id === 'plan.usd-33' ? 'berlaku 1 tahun' : 'berlaku 1 bulan'}</small></h2>
      <ul>
        <li>{plan.quota}</li>
        <li>36 primitive browser</li>
        <li>{plan.premium ? 'Semua tool plus statement, VM, remote drive, prioritas sesi' : 'Semua 40 tool MCP'}</li>
      </ul>
      <button className="btn btn-solid btn-sm w-full" type="button" disabled={buyPending !== null} onClick={() => buy(plan.id, planKey)}>{buyPending === planKey ? 'Menyiapkan…' : 'Beli dengan PayPal'}</button>
      {feedback ? (
        <p className={`status plan-status${feedback.tone === 'warn' ? ' warn' : ''}`}>
          {feedback.tone === 'signin'
            ? <>{signInMessage} <Link to={signInHref}>Masuk dulu</Link>, lalu kembali ke halaman ini.</>
            : feedback.message}
        </p>
      ) : null}
    </section>
    );
  };

  return (
    <>
      <SiteHeader current="/harga" />
      <main>
        <p className="plan-announcer" role="status">{announcement}</p>
        <section className="page-hero">
          <div className="wrap">
            <h1>Harga yang bisa Anda hitung.</h1>
            <p className="lede">Mulai $1. Bayar sekali. Tidak ada perpanjangan otomatis, tidak ada tagihan tersembunyi.</p>
          </div>
        </section>

        {detected ? (
          <section className="band band--flush-bottom" aria-label="Kawasan harga">
            <div className="wrap">
              {country && bandForCountry(country) ? (
                <p className="section-note section-note--flush">
                  Kawasan ({source === 'device' ? 'perangkat' : source === 'cache' ? 'tersimpan' : 'IP'}): <strong>{regionName(country)}</strong> — plan yang tampil sesuai daya beli kawasan Anda.
                </p>
              ) : (
                <p className="section-note section-note--flush">Kawasan tidak bisa dideteksi dari IP maupun lokasi perangkat; kedua grup ditampilkan.</p>
              )}
              <button className="btn btn-ghost btn-sm mt-2" type="button" onClick={retryWithDevice} disabled={geoBusy}>
                {geoBusy ? 'Mendeteksi lokasi…' : 'Perbarui dengan lokasi saya'}
              </button>
              {geoError ? <p className="status warn mt-2" role="status">{geoError}</p> : null}
              <p className="note mt-2">Perangkat dipakai lebih dulu — akurat di balik VPN. Koordinat tidak disimpan. Cookie navego_region tersimpan hanya jika Anda setuju di banner bawah.</p>
            </div>
          </section>
        ) : null}

        {band !== 'premium' ? (
        <section className="band" aria-labelledby="asiaTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="asiaTitle" className="section-title">Kawasan berdaya beli rendah — $1 sampai $9.</h2>
              </div>
              <p className="section-note">Sekali beli, langsung aktif. Tidak ada perpanjangan otomatis.</p>
            </div>
            <div className="plans plans--dense" role="list">
              {ASIA_PLANS.map((plan) => PlanCard(plan, 'asia'))}
            </div>
          </div>
        </section>
        ) : null}

        {band !== 'affordable' ? (
        <section className="band band-soft" aria-labelledby="europeTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="europeTitle" className="section-title">Kawasan berdaya beli tinggi — termasuk 6 bulan dan tahunan.</h2>
              </div>
              <p className="section-note">Sekali beli, langsung aktif. Tidak ada perpanjangan otomatis.</p>
            </div>
            <div className="plans plans--dense" role="list">
              {EUROPE_PLANS.map((plan) => PlanCard(plan, 'europe'))}
            </div>
          </div>
        </section>
        ) : null}

        <section className="band band--flush-top" aria-label="Pembayaran">
          <div className="wrap">
            {!activePlanPresent && signedOut ? (
              <p className="status mt-4 center">{signInMessage} <Link to={signInHref}>Masuk dulu</Link>, lalu kembali ke halaman ini.</p>
            ) : null}
            {checkoutNote ? <p className="status mt-4 center">{checkoutNote}</p> : null}
            {!activePlanPresent && note ? <p className={`${warn ? 'status warn' : 'status'} mt-4 center`}>{note}</p> : null}
            <p className="note mt-3 center">Bayar dengan <strong>PayPal</strong>. Bisa tanpa akun: setelah bayar, masuk untuk mengklaim plan ke akun Anda. Plan aktif setelah pembayaran dikonfirmasi.</p>
          </div>
        </section>

        <section className="band band-soft" aria-labelledby="qaTitle">
          <div className="wrap">
            <h2 id="qaTitle" className="section-title mb-5">Pertanyaan soal plan.</h2>
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
              <h2 className="section-title text-on-dark">Pasang gratis. Putuskan setelah melihat hasilnya.</h2>
              <p>Satu pekerjaan pertama. Berkasnya. Baru putuskan.</p>
              <div className="hero-cta mt-2">
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
