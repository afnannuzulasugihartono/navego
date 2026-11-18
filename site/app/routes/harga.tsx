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
  ['plan', 'Plan Firm, 30 hari sekali bayar', 'Plan Firm menaikkan kuota harian dari 200 menjadi 5.000 perintah dan jatah per sesi dari 50 menjadi 500. Pembelian berlaku 30 hari sejak pembayaran dikonfirmasi, dan tidak diperpanjang otomatis — beli lagi kapan pun sebelum atau sesudah habis, dan hari yang tersisa tidak hangus: masa berlaku diperpanjang di atas sisa yang ada. Setelah habis, akun kembali ke Pilot tanpa biaya.'],
  ['pekerjaan', 'Bayar per pekerjaan selesai', 'Sebelum satu pekerjaan mulai, Anda melihat harga tetapnya dan menyetujuinya. Saat pekerjaan selesai dan artefaknya ada, saldo dipotong sebesar harga itu. Tidak ada meteran lain yang memotong saldo Anda.'],
  ['gagal', 'Pekerjaan gagal: saldo kembali', 'Kalau pekerjaan gagal — termasuk berhenti karena halaman meminta kata sandi, OTP, atau data kartu — dana yang ditahan dikembalikan penuh. Tidak ada potongan proporsional, tidak ada biaya admin. Dana yang ditahan lebih dari 30 menit tanpa penyelesaian dikembalikan otomatis.'],
  ['batas', 'Satu pekerjaan maksimal 10 aksi', 'Satu pekerjaan adalah satu hasil yang jelas: satu halaman, satu laporan, atau satu daftar yang dipecah otomatis menjadi kelompok 10 item, masing-masing dengan harga dan pengembalian sendiri. Pekerjaan yang diperkirakan lebih dari 10 aksi ditolak di depan dengan tawaran untuk dipecah — bukan gagal di tengah jalan.'],
  ['model', 'Biaya model tetap urusan Anda', 'Navego memakai model yang Anda bawa sendiri: endpoint, nama model, dan kunci API Anda. Biaya pemakaian model dibayar langsung ke penyedia model itu, bukan ke Navego.']
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
    setNote('Membuka halaman pembayaran…');
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
      <SiteHeader current="/harga.html" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <p className="crumb">Harga</p>
            <h1>Harga terbuka.</h1>
            <p className="lede">Dua cara membayar, satu aturan: <strong>tidak ada yang terpotong sampai hasilnya ada.</strong></p>
          </div>
        </section>

        <div className="wrap" style={{ paddingBlock: 'var(--s-6)' }}>
          <div className="plans" role="list">
            <section className="card plan" role="listitem" aria-labelledby="cardWalletTitle">
              <p className="plan-name">Isi saldo</p>
              <h2 id="cardWalletTitle" className="plan-price">Rp10.000<small> minimal, sekali isi</small></h2>
              <ul>
                <li>Bayar per pekerjaan yang benar-benar selesai — harga tampil sebelum mulai.</li>
                <li>Gagal atau berhenti di tengah jalan: saldo kembali penuh.</li>
                <li>Saldo tidak kedaluwarsa. Tidak ada biaya admin.</li>
              </ul>
              <button className="btn btn-solid" type="button" onClick={() => buy('wallet-deposit')}>Isi saldo Rp10.000</button>
            </section>

            <section className="card plan is-primary" role="listitem" aria-labelledby="cardFirmTitle">
              <p className="plan-name">Kuota terbesar</p>
              <h2 id="cardFirmTitle" className="plan-price">Plan Firm<small> Rp249.000 · 30 hari, sekali bayar</small></h2>
              <ul>
                <li>Kuota 5.000 perintah per hari — Pilot hanya 200.</li>
                <li>500 perintah per sesi drive — Pilot hanya 50.</li>
                <li>Berlaku 30 hari sejak pembayaran. Habis? Kembali ke Pilot.</li>
                <li>Tidak otomatis diperpanjang — beli lagi sebelum habis.</li>
              </ul>
              <button className="btn btn-solid" type="button" onClick={() => buy('plan-subscribe')} style={{ background: 'var(--ground)', color: 'var(--navy-deep)' }}>Beli Plan Firm Rp249.000</button>
            </section>
          </div>

          {signedOut ? (
            <p className="status" style={{ marginTop: 'var(--s-4)' }}>Pembayaran memakai akun Anda. <Link to="/index.html">Masuk dulu</Link>, lalu kembali ke halaman ini.</p>
          ) : null}
          {note ? <p className={warn ? 'status warn' : 'status'} role="status" aria-live="polite" style={{ marginTop: 'var(--s-4)' }}>{note}</p> : null}
          <p className="note" style={{ marginTop: 'var(--s-3)' }}>Bayar lewat <strong>QRIS</strong>. Setelah pembayaran dikonfirmasi, saldo atau Plan Firm aktif otomatis — saldo bertambah, kuota Firm berlaku langsung.</p>

          <div className="table-wrapper" tabIndex={0} role="region" aria-label="Angka produk, apa adanya" style={{ marginTop: 'var(--s-6)', maxWidth: '62rem' }}>
            <table className="table">
              <caption>Angka produk, apa adanya</caption>
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

          <div className="faq" style={{ marginTop: 'var(--s-6)' }}>
            {QA.map(([id, q, a]) => (
              <details key={id} id={id} open={id === 'prabayar'}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>

        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="card is-primary" style={{ background: 'var(--navy-deep)', borderColor: 'var(--navy-deep)', color: '#eaf0ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--s-5)', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', color: '#ffffff', letterSpacing: '-0.02em' }}>Harga yang jalan.</h2>
                <p style={{ color: '#a9bce8', marginTop: 'var(--s-2)' }}>Pasang gratis, jalankan satu pekerjaan pertama Anda, dan bayar hanya setelah hasilnya ada.</p>
              </div>
              <Link className="btn btn-solid" to="/unduh.html">Pasang navego</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
