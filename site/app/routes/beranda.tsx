import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';
import { DemoCorbin } from '../components/DemoCorbin';
import { Reveal } from '../components/Reveal';

export function meta() {
  return [
    { title: 'Corbin — Asisten AI di browser Anda' },
    { name: 'description', content: 'Corbin membaca halaman, mengisi formulir, dan bekerja lintas tab lewat satu perintah teks. Satu extension, satu akun, 56 tool diukur dari source.' }
  ];
}

const FEATURES = [
  ['Satu pintu, setiap halaman', 'Tidak ada API per situs. OpenCode, Kilo, Claude — semua lewat satu endpoint.'],
  ['Membaca konteks Anda', 'Mencari, membandingkan, merangkum — di tab yang sedang Anda buka.'],
  ['Berkas, bukan hanya teks', 'CSV, dokumen, halaman. Hasil yang bisa Anda kirim, bukan cuma dibaca.'],
  ['Anda yang memegang kendali', 'Password, OTP, pembayaran — selalu ditolak. Kunci Anda tidak pernah diunggah.'],
  ['Satu kode, satu device', 'Pairing permanen. Cabut kapan pun dari dashboard.']
] as const;

const FAQ = [
  ['Biaya', 'Pasang gratis. Setiap pekerjaan dibayar dari saldo mulai Rp10.000, atau flat 30 hari lewat plan.firm.'],
  ['Data', 'Konten pergi ke endpoint model Anda. Kunci tidak pernah diunggah.'],
  ['Berhenti', 'Keluar atau cabut pairing kapan saja.']
] as const;

export default function Beranda() {
  return (
    <>
      <SiteHeader current="/beranda.html" />
      <main>

        <section className="hero" aria-label="Corbin">
          <div className="hero-copy">
            <p className="hero-kicker">Ekstensi browser</p>
            <h1 className="hero-display">Corbin.</h1>
            <p className="hero-sub2">Asisten AI di browser Anda.</p>
            <p className="hero-support">Membaca halaman, mengisi formulir, bekerja lintas tab — satu perintah teks.</p>
            <div className="hero-actions2">
              <Link className="btn btn-solid hero-btn" to="/unduh.html">Pasang corbin</Link>
              <Link className="btn btn-ghost hero-btn" to="/docs.html">Pelajari →</Link>
            </div>
            <p className="hero-plan"><b>plan.pilot gratis</b> — 200 perintah/hari, 50 per sesi.</p>
          </div>
          <figure className="hero-frame">
            <img src="/assets/raven-1874.jpg" width={1454} height={852} alt="Sketsa Corvus corax oleh Naumann" loading="eager" />
            <figcaption><em>Corvus corax</em> — setelah Naumann, 1874 · public domain</figcaption>
            <span className="burst" aria-hidden="true">Pasang<br />gratis!</span>
          </figure>
        </section>

        <section className="chapter" aria-labelledby="demoTitle">
          <Reveal>
            <p className="chapter-eyebrow">Coba Corbin.</p>
            <h2 id="demoTitle" className="chapter-title">Klik. Lihat ia bekerja.</h2>
            <p className="chapter-note">Satu perintah nyata. Angka asli dari CSV 23 baris. Hasilnya bisa Anda unduh.</p>
            <DemoCorbin />
          </Reveal>
        </section>

        <div className="facts facts--center" aria-label="Fakta produk">
          <span><b>56</b> tool diukur dari source</span>
          <span><b>36</b> primitive browser</span>
          <span><b>6</b> izin, semua dijelaskan</span>
        </div>

        <section className="chapter warm" aria-labelledby="workTitle">
          <Reveal>
            <p className="chapter-eyebrow">Fungsinya.</p>
            <h2 id="workTitle" className="chapter-title">Baca halaman.<br />Tulis halaman.<br />Kirim hasilnya.</h2>
            <p className="chapter-note">Satu extension, satu akun, satu browser.</p>
          </Reveal>
        </section>

        <section id="fitur" className="chapter" aria-labelledby="featuresTitle">
          <Reveal>
            <p className="chapter-eyebrow">Cara ia bekerja.</p>
            <h2 id="featuresTitle" className="chapter-title">Lima hal,<br />satu arah: selesai.</h2>
            <div className="feature-list">
              {FEATURES.map(([title, body]) => (
                <div key={title} className="feature-row">
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section id="harga" className="chapter dark" aria-labelledby="pricingTitle">
          <Reveal>
            <p className="chapter-eyebrow light">Harganya.</p>
            <h2 id="pricingTitle" className="chapter-title light-title">Tidak kejutan.</h2>
            <p className="chapter-note light-title" style={{ marginTop: 0 }}>Satu harga per pekerjaan selesai. Biaya model dari saldo Anda.</p>
            <div className="plans">
              <div className="plan">
                <p className="plan-name">Isi saldo</p>
                <p className="plan-price">Rp10.000<small> minimal, sekali isi</small></p>
                <p className="plan-meta">Bayar per pekerjaan yang benar-benar selesai — harga tampil sebelum mulai. Gagal? Saldo kembali penuh.</p>
              </div>
              <div className="plan is-primary">
                <p className="plan-name">Plan Firm</p>
                <p className="plan-price">Rp249.000<small> / 30 hari, sekali bayar</small></p>
                <p className="plan-meta">Kuota 5000 perintah/hari (Pilot 200) dan 500/sesi (Pilot 50). Tidak otomatis diperpanjang.</p>
              </div>
              <div className="plan">
                <p className="plan-name">plan.pilot</p>
                <p className="plan-price">Gratis</p>
                <p className="plan-meta">200 perintah/hari, 50 per sesi. <Link to="/harga.html" style={{ color: 'inherit' }}>Lihat rincian →</Link></p>
              </div>
            </div>
          </Reveal>
        </section>

        <section id="faq" className="chapter tail" aria-labelledby="faqTitle">
          <p className="chapter-eyebrow">Sebelum Anda bertanya.</p>
          <h2 id="faqTitle" className="chapter-title">Semuanya di sini.</h2>
          <div className="faq">
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
          <div className="tail-cta">
            <Link className="btn btn-solid hero-btn" to="/unduh.html">Pasang corbin</Link>
            <p className="tail-meta">Satu extension, satu akun, satu browser.</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
