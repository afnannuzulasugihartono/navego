import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return [
    { title: 'Corbin — Asisten AI di browser Anda' },
    { name: 'description', content: 'Corbin membaca halaman, mengisi formulir, dan bekerja lintas tab lewat satu perintah teks. Satu extension, satu akun, 56 tool diukur dari source.' }
  ];
}

const FEATURES = [
  ['Satu endpoint, setiap halaman', 'Tidak ada API per situs. OpenCode, Kilo, Claude — satu pintu.'],
  ['Membaca halaman yang Anda buka', 'Mencari, membandingkan, merangkum — tanpa kehilangan konteks Anda.'],
  ['Dari web ke berkas nyata', 'CSV, dokumen, halaman. Hasil yang bisa langsung Anda kirim.'],
  ['Kamu memegang kendali', 'Password, OTP, pembayaran — selalu ditolak. Kunci model tidak pernah diunggah.'],
  ['Ingat pairing Anda', 'Satu kode sekali pakai per device. Cabut kapan pun.']
] as const;

const FAQ = [
  ['Kenapa bukan ChatGPT / Gemini?', 'ChatGPT dan Gemini adalah teks yang menjawab soal web — bukan yang menjalankannya. Corbin bekerja di browser Anda yang sudah login: mengisi formulir, membuka portal internal, dan menyerahkan hasil sebagai berkas nyata.'],
  ['Kenapa bukan Operator / Nanobrowser?', 'Operator jalan di cloud browser dan tidak bisa menyentuh portal internal SSO/2FA. Nanobrowser gratis dan open source, tetapi Anda menyusun dan membayar sendiri toolchain-nya. Corbin: browser Anda, model Anda, biaya tetap, QRIS.'],
  ['Biaya', 'Pasang gratis. Setiap pekerjaan dibayar dari saldo mulai Rp10.000, atau flat 30 hari lewat plan.firm.'],
  ['Data', 'Konten pergi ke endpoint model Anda. Kunci tidak pernah diunggah.'],
  ['Berhenti', 'Keluar atau cabut pairing kapan saja.']
] as const;

export default function Beranda() {
  return (
    <>
      <SiteHeader current="/beranda.html" />
      <main className="wrap">

        <section className="hero" aria-label="Corbin">
          <div>
            <h1>Corbin.</h1>
            <p className="lede">Asisten AI di browser Anda.</p>
            <p className="support" style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 700, marginTop: 10, maxWidth: '34ch', lineHeight: 1.35 }}>Chatbot menjawab soal web. Corbin mengerjakan web.</p>
            <div className="hero-cta">
              <Link className="btn btn-solid" to="/unduh.html" style={{ fontSize: 14, padding: '15px 28px' }}>Pasang corbin →</Link>
              <span className="plan-note">plan.pilot gratis<br />Rp 249 rb / 30 hari untuk Firm</span>
            </div>
          </div>
          <figure className="hero-figure" aria-hidden="true">
            <img src="/assets/raven-1874.jpg" width={1454} height={852} alt="" loading="eager" />
            <figcaption><em>Corvus corax</em> — setelah Naumann, 1874 · public domain</figcaption>
          </figure>
        </section>

        <div className="facts" aria-label="Fakta produk">
          <span><b>56</b> tool</span>
          <span><b>36</b> primitive browser</span>
          <span><b>6</b> izin</span>
          <span><b>MV3</b> Chrome · Edge · Brave</span>
          <span>Data tetap di <b>device</b></span>
        </div>

        <section className="section" aria-labelledby="howTitle">
          <div className="section-head">
            <h2 id="howTitle">Cara kerjanya.</h2>
            <p>Tiga langkah, selalu sama.</p>
          </div>
          <ol className="steps-brief">
            <li><b>1</b><span><strong>Anda bicara.</strong> Satu kalimat, bahasa sehari-hari.</span></li>
            <li><b>2</b><span><strong>Corbin menjalankan.</strong> Baca, ketik, klik — di tab tempat Anda bekerja sekarang.</span></li>
            <li><b>3</b><span><strong>Anda mendapat berkasnya.</strong> CSV, dokumen, atau halaman — selesai dalam hitungan menit.</span></li>
          </ol>
        </section>

        <section className="section" aria-label="Contoh pekerjaan berjalan">
          <div data-ui role="img" aria-label="Pekerjaan berjalan di Corbin: mengisi spreadsheet onboarding dari web, lalu onboarding.csv tersimpan sebagai berkas" style={{ border: '2px solid var(--ink)', borderRadius: 12, overflow: 'hidden', maxWidth: 720 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--ink)', color: 'var(--paper)', padding: '8px 12px', fontSize: 11 }}>
              <strong>corbin</strong><span style={{ color: '#8f8f9c' }}>·</span><span style={{ color: '#cfcbe4' }}>Pekerjaan</span>
            </div>
            <div style={{ padding: '16px 18px', background: '#101014', color: '#f4f1e9', fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 12.5 }}>
              <p><span style={{ color: '#d8923f' }}>$</span> Isi spreadsheet onboarding dari web</p>
              <ol style={{ listStyle: 'none', margin: '10px 0', color: '#cfcbe4', display: 'grid', gap: 6 }}>
                <li>Mengantrekan pekerjaan</li>
                <li>Membuka tab dan membaca ringkasan</li>
                <li>Mencocokkan 12 baris dengan sumber</li>
                <li>Menyimpan onboarding.csv sebagai berkas</li>
              </ol>
              <p style={{ color: '#7dd3a0' }}>✓ onboarding.csv — tersimpan sebagai berkas</p>
            </div>
          </div>
        </section>

        <section id="fitur" className="section" aria-labelledby="featuresTitle">
          <div className="section-head">
            <h2 id="featuresTitle">Apa yang ia kerjakan.</h2>
            <p>Lima hal, satu arah: selesai.</p>
          </div>
          <div className="feature-grid">
            {FEATURES.map(([title, body]) => (
              <div key={title} className="feature">
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="whyTitle" style={{ paddingTop: 0 }}>
          <div className="section-head">
            <h2 id="whyTitle">Kenapa Corbin.</h2>
            <p>Empat cara kerja yang sering tertukar.</p>
          </div>
          <div className="sheet" role="table" aria-label="Perbandingan Corbin dengan alternatif">
            {[
              ['ChatGPT / Gemini', 'Teks yang menjawab soal web — bukan yang menjalankannya.', 'not-a-match'],
              ['OpenAI Operator / Atlas', 'Cloud browser ($20/bln). Tidak menyentuh portal internal SSO/2FA.', 'not-a-match'],
              ['Nanobrowser', 'Gratis & open source (14 rb ★), tapi Anda menyusun sendiri toolchain-nya.', 'different'],
              ['Corbin', 'Browser Anda, model Anda, hasilnya berkas nyata. Harga tetap, QRIS.', 'match']
            ].map(([name, body, tone]) => (
              <div key={name as string} role="row" style={{ display: 'grid', gridTemplateColumns: '170px 1fr', padding: '11px 14px', background: tone === 'match' ? 'var(--ink)' : '#fbfaf5', borderBottom: '1px solid #ece8db', color: tone === 'match' ? 'var(--paper)' : 'var(--ink)' }}>
                <div role="cell" style={{ fontWeight: 800, fontSize: 13.5 }}>{name}</div>
                <div role="cell" style={{ fontSize: 12.5, lineHeight: 1.5, color: tone === 'match' ? '#d8d3c4' : 'var(--muted-2)' }}>{body}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="harga" className="section" aria-labelledby="pricingTitle">
          <div className="section-head">
            <h2 id="pricingTitle">Harga tetap.</h2>
            <p>Satu harga per pekerjaan selesai. Biaya model dari saldo Anda.</p>
          </div>
          <div className="plans">
            <div className="plan">
              <p className="plan-name">Isi saldo</p>
              <p className="plan-price">Rp10.000<small> minimal, sekali isi</small></p>
              <p className="plan-meta">Bayar per pekerjaan yang benar-benar selesai — harga tampil sebelum mulai. Gagal? Saldo kembali penuh. Tidak kedaluwarsa.</p>
            </div>
            <div className="plan is-primary">
              <p className="plan-name">Plan Firm</p>
              <p className="plan-price">Rp249.000<small> / 30 hari, sekali bayar</small></p>
              <p className="plan-meta">Kuota 5000 perintah/hari (Pilot 200) dan 500/sesi (Pilot 50). Tidak otomatis diperpanjang.</p>
            </div>
            <div className="plan">
              <p className="plan-name">plan.pilot</p>
              <p className="plan-price">Gratis</p>
              <p className="plan-meta">200 perintah/hari, 50 per sesi. <Link to="/harga.html" style={{ color: 'inherit' }}>Lihat rincian harga →</Link></p>
            </div>
          </div>
        </section>

        <section id="faq" className="section">
          <div className="section-head"><h2>Pertanyaan umum.</h2></div>
          <div className="faq">
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        <p style={{ fontSize: 12, color: 'var(--muted)', padding: '20px 0 0' }}>Siapa di balik Corbin: <a href="https://github.com/afnannuzulasugihartono" style={{ color: 'inherit', textDecoration: 'underline' }}>AFNAN NUZULA SUGIHARTONO</a> · <a href="mailto:afnannuzulasugihartono@gmail.com" style={{ color: 'inherit', textDecoration: 'underline' }}>afnannuzulasugihartono@gmail.com</a> · <a href="https://github.com/afnannuzulasugihartono/opera-agent" style={{ color: 'inherit', textDecoration: 'underline' }}>kode sumber</a></p>

        <section className="statement" aria-labelledby="finalTitle" style={{ paddingBottom: 40, paddingTop: 30 }}>
          <h2 id="finalTitle" style={{ fontSize: 'clamp(36px,5vw,58px)', letterSpacing: '-0.03em' }}>Pasang. Pair. Kerja.</h2>
          <p style={{ fontSize: 15, color: 'var(--muted-2)', margin: '10px 0 20px' }}>Satu extension, satu akun, satu browser.</p>
          <Link className="btn btn-solid" to="/unduh.html" style={{ fontSize: 14, padding: '15px 28px' }}>Pasang corbin →</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
