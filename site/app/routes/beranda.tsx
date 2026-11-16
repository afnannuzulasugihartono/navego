import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';
import { DemoCorbin } from '../components/DemoCorbin';
import { Reveal } from '../components/Reveal';

export function meta() {
  return [
    { title: 'Corbin — Asisten AI di browser Anda' },
    { name: 'description', content: 'Corbin menjalankan browser Anda dari satu perintah teks: membaca halaman, mengisi formulir, menyimpan hasilnya sebagai berkas. 56 tool, 36 primitive browser, 6 izin.' }
  ];
}

const FEATURES = [
  ['Satu endpoint untuk semua situs', 'Tidak ada API per situs. OpenCode, Kilo Code, dan Claude Code masuk lewat endpoint yang sama.'],
  ['Membaca halaman yang terbuka', 'Cari, bandingkan, atau rangkum di tab yang sedang Anda pakai — bukan di server kami.'],
  ['Hasilnya berkas', 'CSV, dokumen, dan halaman terisi. Berkas yang bisa dikirim, bukan potongan teks.'],
  ['Kolom rahasia selalu ditolak', 'Password, kode sekali pakai, dan pembayaran ditolak. Kunci model Anda tidak pernah diunggah.'],
  ['Satu device, satu pairing', 'Device yang sudah ter-pairing tetap aktif. Cabut kapan saja dari dashboard.']
] as const;

const FAQ = [
  ['Biaya', 'Pasang gratis. Setiap pekerjaan yang selesai dibayar dari saldo, mulai Rp10.000. Plan Firm Rp249.000 berlaku 30 hari dan tidak diperpanjang otomatis.'],
  ['Data', 'Isi halaman dikirim ke endpoint model yang Anda tentukan. Kunci API Anda tidak pernah meninggalkan browser.'],
  ['Berhenti', 'Keluar dari akun, atau cabut pairing device dari dashboard. Keduanya langsung berlaku.']
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
            <p className="hero-support">Beri satu perintah. Corbin membaca halaman yang terbuka, mengisi formulir, lalu menyimpan hasilnya sebagai berkas.</p>
            <div className="hero-actions2">
              <Link className="btn btn-solid hero-btn" to="/unduh.html">Pasang corbin</Link>
              <Link className="btn btn-ghost hero-btn" to="/docs.html">Pelajari →</Link>
            </div>
            <p className="hero-plan"><b>plan.pilot gratis</b>: 200 perintah per hari, 50 per sesi.</p>
          </div>
          <figure className="hero-frame">
            <img src="/assets/raven-1874.jpg" width={1454} height={852} alt="Sketsa Corvus corax oleh Naumann" loading="eager" />
            <figcaption><em>Corvus corax</em> — setelah Naumann, 1874 · public domain</figcaption>
            <span className="burst" aria-hidden="true">Pasang<br />gratis!</span>
          </figure>
        </section>

        <section className="chapter" aria-labelledby="demoTitle">
          <Reveal>
            <p className="chapter-eyebrow">Contoh nyata.</p>
            <h2 id="demoTitle" className="chapter-title">Satu perintah, satu berkas.</h2>
            <p className="chapter-note">Rekaman September dari Sinar Jaya: 23 baris kas masuk, dan Rp 65.310.000 keluar sebagai laporan tiga sheet. Angkanya asli; berkasnya bisa Anda unduh.</p>
            <DemoCorbin />
          </Reveal>
        </section>

        <div className="facts facts--center" aria-label="Angka produk">
          <span><b>56</b> tool diukur dari source</span>
          <span><b>36</b> primitive browser</span>
          <span><b>6</b> izin, semua dijelaskan</span>
        </div>

        <section className="chapter warm" aria-labelledby="workTitle">
          <Reveal>
            <p className="chapter-eyebrow">Contoh berkas.</p>
            <h2 id="workTitle" className="chapter-title">Laporan keuangan September.</h2>
            <p className="chapter-note">Empat berkas keluar dari satu file kas: laporan keuangan, rencana strategis, riset promo, dan rencana pemasaran. Semuanya bisa Anda buka sekarang, tanpa memasang apa pun.</p>
            <p className="chapter-note"><Link to="/studi.html">Lihat studi kasus lengkapnya →</Link></p>
          </Reveal>
        </section>

        <section id="fitur" className="chapter" aria-labelledby="featuresTitle">
          <Reveal>
            <p className="chapter-eyebrow">Cara ia bekerja.</p>
            <h2 id="featuresTitle" className="chapter-title">Lima hal yang<br />dikerjakan Corbin.</h2>
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
            <p className="chapter-eyebrow light">Harga.</p>
            <h2 id="pricingTitle" className="chapter-title light-title">Dua cara bayar.</h2>
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
          <p className="chapter-eyebrow">Pertanyaan yang paling sering.</p>
          <h2 id="faqTitle" className="chapter-title">Tiga yang paling sering.</h2>
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
            <p className="tail-meta">Unduh, masuk, lalu pair device ini dari dashboard.</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
