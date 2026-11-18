import { useEffect, useState } from 'react';
import { seoMeta } from '../lib/seo.js';
import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';
import { BILLING, ensureSession, getStoredToken, headersFor } from '../lib/auth';

export function meta() {
  return seoMeta({
    title: 'Harga — Navego',
    description: 'Dua cara membayar, satu aturan: tidak ada yang terpotong sampai hasilnya ada. Isi saldo mulai Rp10.000 lewat QRIS, atau Plan Firm Rp249.000 / 30 hari.',
    path: '/harga'
  });
}

const GLANCE: Array<[string, string]> = [
  ['Top-up minimum', 'Rp10.000'],
  ['Plan Firm', 'Rp249.000 / 30 hari'],
  ['Kuota Firm', '5.000 / hari'],
  ['Kuota Pilot', '200 / hari'],
  ['Pembayaran', 'QRIS'],
  ['Satuan', 'Per pekerjaan'],
  ['Batas satu pekerjaan', '10 aksi'],
  ['Kegagalan', 'Dikembalikan penuh']
];

const QA = [
  ['prabayar', 'Isi saldo, bukan langganan', 'Anda mengisi saldo sekali lewat QRIS mulai Rp10.000. Saldo tidak kedaluwarsa dan hanya berkurang saat satu pekerjaan benar-benar selesai.'],
  ['plan', 'Plan Firm, 30 hari sekali bayar', 'Plan Firm menaikkan kuota harian dari 200 menjadi 5.000 perintah dan jatah per sesi dari 50 menjadi 500. Berlaku 30 hari sejak pembayaran dikonfirmasi, tidak diperpanjang otomatis. Hari yang tersisa tidak hangus: masa berlaku diperpanjang di atas sisa yang ada.'],
  ['pekerjaan', 'Bayar per pekerjaan selesai', 'Sebelum satu pekerjaan mulai, Anda melihat harga tetapnya dan menyetujuinya. Saat pekerjaan selesai dan artefaknya ada, saldo dipotong sebesar harga itu. Tidak ada meteran lain.'],
  ['gagal', 'Pekerjaan gagal: saldo kembali', 'Kalau pekerjaan gagal — termasuk berhenti karena halaman meminta kata sandi, OTP, atau data kartu — dana yang ditahan dikembalikan penuh. Tidak ada potongan proporsional, tidak ada biaya admin.'],
  ['batas', 'Satu pekerjaan maksimal 10 aksi', 'Satu pekerjaan adalah satu hasil jelas: satu halaman, satu laporan, atau satu daftar yang dipecah otomatis menjadi kelompok 10 item. Perkiraan yang lebih besar ditolak di depan dengan tawaran dipecah.'],
  ['model', 'Biaya model tetap urusan Anda', 'Navego memakai model yang Anda bawa sendiri: endpoint, nama model, dan kunci API Anda. Biaya pemakaian dibayar langsung ke penyedia model, bukan ke Navego.']
] as const;

export default function Harga() {
  const [note, setNote] = useState('');
  const [warn, setWarn] = useState(false);
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    setSignedOut(!getStoredToken());
  }, []);

  async function buy(action: 'wallet-deposit' | 'plan-subscribe') {
    const current = await ensureSession();
    if (!current) {
      setSignedOut(true);
      setNote('');
      return;
    }
    setSignedOut(false);
    setWarn(false);
    setNote('Membuka halaman pembayaran...');
    try {
      const response = await fetch(BILLING, {
        method: 'POST',
        headers: headersFor(current),
        body: JSON.stringify({ action })
      });
      const answer = await response.json().catch(() => null);
      if (answer?.ok && answer?.url) {
        window.open(answer.url, '_blank', 'noopener,noreferrer');
        setNote('Halaman pembayaran terbuka di tab baru. Selesaikan pembayaran di sana; akun Anda aktif otomatis.');
        return;
      }
      setWarn(true);
      setNote(`Halaman pembayaran tidak bisa dibuka: ${answer?.error || answer?.message || answer?.why || `HTTP ${response.status}`}.`);
    } catch (error) {
      setWarn(true);
      setNote(`Halaman pembayaran tidak bisa dibuka: ${error instanceof Error ? error.message : 'jaringan'}.`);
    }
  }

  return (
    <>
      <SiteHeader current="/harga" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <p className="crumb">Harga</p>
            <h1>Bayar setelah hasilnya ada.</h1>
            <p className="lede">Dua cara membayar, satu aturan: tidak ada yang terpotong sampai pekerjaan selesai.</p>
          </div>
        </section>

        <section className="band" aria-labelledby="plansTitle">
          <div className="wrap">
            <h2 id="plansTitle" className="section-title" style={{ textAlign: 'center', marginBottom: 'var(--s-6)' }}>Pilih cara Anda.</h2>
            <div className="plans" role="list">
              <section className="card plan" role="listitem" aria-labelledby="cardPilotTitle">
                <p className="plan-name">plan.pilot</p>
                <h2 id="cardPilotTitle" className="plan-price">Gratis</h2>
                <ul>
                  <li>200 perintah per hari</li>
                  <li>50 perintah per sesi</li>
                  <li>36 primitive browser</li>
                </ul>
                <Link className="btn btn-ghost" to="/unduh">Mulai gratis</Link>
              </section>

              <section className="card plan is-primary" role="listitem" aria-labelledby="cardFirmTitle">
                <p className="plan-name">plan.firm · paling dipilih</p>
                <h2 id="cardFirmTitle" className="plan-price">Rp249.000<small> / 30 hari</small></h2>
                <ul>
                  <li>5.000 perintah per hari</li>
                  <li>500 perintah per sesi</li>
                  <li>Tidak diperpanjang otomatis</li>
                </ul>
                <button className="btn btn-solid" type="button" onClick={() => buy('plan-subscribe')} style={{ background: 'var(--ground)', color: 'var(--navy-deep)' }}>Beli Plan Firm</button>
              </section>

              <section className="card plan" role="listitem" aria-labelledby="cardWalletTitle">
                <p className="plan-name">saldo</p>
                <h2 id="cardWalletTitle" className="plan-price">Rp10.000<small> minimal, sekali isi</small></h2>
                <ul>
                  <li>Bayar per pekerjaan selesai</li>
                  <li>Gagal: saldo kembali penuh</li>
                  <li>Saldo tidak kedaluwarsa</li>
                </ul>
                <button className="btn btn-ghost" type="button" onClick={() => buy('wallet-deposit')}>Isi saldo</button>
              </section>
            </div>

            {signedOut ? (
              <p className="status" style={{ marginTop: 'var(--s-4)', textAlign: 'center' }}>Pembayaran memakai akun Anda. <Link to="/">Masuk dulu</Link>, lalu kembali ke halaman ini.</p>
            ) : null}
            {note ? <p className={warn ? 'status warn' : 'status'} role="status" aria-live="polite" style={{ marginTop: 'var(--s-4)', textAlign: 'center' }}>{note}</p> : null}
            <p className="note" style={{ marginTop: 'var(--s-3)', textAlign: 'center' }}>Bayar lewat <strong>QRIS</strong>. Setelah dikonfirmasi, saldo atau Plan Firm aktif otomatis.</p>
          </div>
        </section>

        <section className="band band-soft" aria-labelledby="glanceTitle">
          <div className="wrap">
            <h2 id="glanceTitle" className="section-title" style={{ marginBottom: 'var(--s-5)' }}>Angka produk, apa adanya.</h2>
            <div className="table-wrapper" tabIndex={0} role="region" aria-label="Angka produk, apa adanya" style={{ maxWidth: '62rem' }}>
              <table className="table">
                <caption>Angka produk</caption>
                <tbody>
                  {GLANCE.map(([k, v]) => (
                    <tr key={k}>
                      <th scope="row" style={{ width: '40%' }}>{k}</th>
                      <td style={{ fontWeight: 700 }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="band" aria-labelledby="qaTitle">
          <div className="wrap">
            <h2 id="qaTitle" className="section-title" style={{ marginBottom: 'var(--s-5)' }}>Pertanyaan soal biaya.</h2>
            <div className="faq">
              {QA.map(([id, q, a]) => (
                <details key={id} id={id} open={id === 'prabayar'}>
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
              <h2 className="section-title" style={{ color: '#ffffff' }}>Pasang gratis. Bayar setelah hasilnya ada.</h2>
              <p>Jalankan satu pekerjaan pertama, lihat berkasnya, baru putuskan.</p>
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