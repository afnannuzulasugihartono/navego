import { useState } from 'react';
import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';
import { Raven } from '../components/Raven';

export function meta() {
  return [
    { title: 'Corbin — Asisten AI di browser Anda' },
    { name: 'description', content: 'Corbin membaca halaman, mengisi formulir, dan bekerja lintas tab lewat satu perintah teks. Satu extension, satu akun, 56 tool diukur dari source.' }
  ];
}

const HALAMAN = [
  ['Google Sheets', 'isi sheet dari web'],
  ['Google Docs', 'tulis dokumen dari prompt'],
  ['Google Maps', 'cari & bandingkan lokasi'],
  ['YouTube', 'ambil poin dari video'],
  ['Gmail', 'tulis & kirim balasan'],
  ['Notion', 'buat & rapikan halaman'],
  ['GitHub', 'ringkas PR & buka issue'],
  ['Shopee', 'pantau harga & stok']
] as const;

const FEATURES = [
  ['Satu endpoint, setiap halaman', 'OpenCode, Kilo, Claude: satu pintu. Tidak ada API per situs.'],
  ['Membaca web, menjawab', 'Mencari, membandingkan, merangkum di halaman yang sedang Anda buka.'],
  ['Mengisi lembar kerja', 'Dari web ke spreadsheet. Dari prompt ke dokumen.'],
  ['Ingat pairing Anda', 'Satu kode sekali pakai per device. Cabut kapan pun.'],
  ['Artefak, bukan hanya teks', 'Pekerjaan selesai berarti berkas: CSV, dokumen, halaman.'],
  ['Kamu yang memegang kendali', 'Password, OTP, pembayaran: selalu ditolak. Kamu di kendali.']
] as const;

const FAQ = [
  ['Kenapa bukan ChatGPT / Gemini?', 'ChatGPT dan Gemini adalah teks yang menjawab soal web — bukan yang menjalankannya. Corbin bekerja di browser Anda yang sudah login: mengisi formulir, membuka portal internal, dan menyerahkan hasil sebagai berkas nyata.'],
  ['Kenapa bukan Operator / Nanobrowser?', 'Operator jalan di cloud browser dan tidak bisa menyentuh portal internal SSO/2FA. Nanobrowser gratis dan open source, tetapi Anda menyusun dan membayar sendiri toolchain-nya. Corbin: browser Anda, model Anda, biaya tetap, QRIS.'],
  ['Biaya', 'Pasang gratis. Setiap pekerjaan dibayar dari saldo mulai Rp10.000, atau flat 30 hari lewat plan.firm.'],
  ['Data', 'Konten pergi ke endpoint model Anda. Kunci tidak pernah diunggah.'],
  ['Berhenti', 'Keluar atau cabut pairing kapan saja.']
] as const;

const TERMINAL: Record<string, string> = {
  mac: 'curl -fsSL https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/opera-agent-update/download/opera-agent.zip -o opera-agent.zip && unzip opera-agent.zip',
  linux: 'curl -fsSL https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/opera-agent-update/download/opera-agent.zip -o opera-agent.zip && unzip opera-agent.zip',
  win: 'iwr https://nenmkmtvjremqphfqnfw.supabase.co/functions/v1/opera-agent-update/download/opera-agent.zip -OutFile opera-agent.zip; Expand-Archive opera-agent.zip'
};

export default function Beranda() {
  const [os, setOs] = useState<'mac' | 'linux' | 'win'>('mac');
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState('');

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <SiteHeader current="/beranda.html" />
      <main className="wrap">
        <section className="hero" aria-label="Corbin">
          <div>
            <h1>Corbin.</h1>
            <p className="lede">Asisten AI di browser Anda.</p>
            <p className="support" style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 600, marginTop: 8 }}>Chatbot menjawab soal web. Corbin mengerjakan web.</p>
            <p className="support">Membaca halaman, mengisi formulir, bekerja lintas tab — satu perintah teks. Begitu juga di portal internal yang sudah login: SSO, 2FA, semua ikut bekerja.</p>
            <div className="hero-cta">
              <Link className="btn btn-solid" to="/unduh.html" style={{ fontSize: 14, padding: '14px 26px' }}>Pasang corbin →</Link>
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

        <section className="section" aria-label="Halaman yang bisa dikerjakan">
          <p className="strip-label">Semua halaman. Bukan daftar putih.</p>
          <ul className="logo-grid">
            {HALAMAN.map(([name, action]) => (
              <li key={name} className="logo-tile">
                <span className="logo-name">{name}</span>
                <span className="logo-do">{action}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="statement" aria-label="Inti produk">
          <p>Tidak ada API per situs.</p>
          <p>Satu endpoint, semua halaman.</p>
        </section>

        <section id="install" className="section">
          <div className="section-head">
            <h2>Dari prompt ke hasil.</h2>
            <p>Unduh. Masuk. Pair. <Link to="/unduh.html">Panduan bila perlu</Link>.</p>
          </div>
          <div className="install-split">
            <div>
              <ol className="steps">
                <li><span><strong>Unduh.</strong> Muat arsip di <code>opera://extensions</code> atau browser Chromium.</span></li>
                <li><span><strong>Masuk.</strong> Magic link atau OAuth — tanpa password milik kami.</span></li>
                <li><span><strong>Pair.</strong> Hubungkan dari <Link to="/dashboard.html">Dashboard</Link>. Satu klik.</span></li>
              </ol>
              <div className="hero-cta" style={{ marginTop: 6 }}>
                <Link className="btn btn-solid" to="/unduh.html">Mulai instalasi</Link>
                <Link className="btn btn-ghost" to="/dashboard.html">Buka checklist</Link>
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '18px 0 8px' }}>Pasang lewat terminal</p>
              <div role="group" aria-label="Perintah terminal" style={{ background: 'var(--ink)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 4, padding: '8px 10px 0' }} role="tablist" aria-label="Sistem operasi">
                  {(['mac', 'linux', 'win'] as const).map((key) => (
                    <button
                      key={key}
                      role="tab"
                      aria-selected={os === key}
                      onClick={() => setOs(key)}
                      style={{ background: os === key ? '#f4f1e9' : 'transparent', color: os === key ? '#16161a' : '#cfcbe4', border: 0, borderRadius: '6px 6px 0 0', padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      {key === 'mac' ? 'macOS' : key === 'linux' ? 'Linux' : 'Windows'}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#0d0d10' }}>
                  <code style={{ background: 'transparent', color: '#f4f1e9', fontSize: 10.5, overflowX: 'auto', whiteSpace: 'nowrap', flex: 1 }}>{TERMINAL[os] ?? ''}</code>
                  <button onClick={() => copy(TERMINAL[os] ?? '')} style={{ background: '#262630', color: '#f4f1e9', border: 0, borderRadius: 6, padding: '5px 10px', fontSize: 10.5, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {copied ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
              </div>
            </div>
            <div className="card" data-ui aria-label="Contoh tampilan popup Corbin">
              <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 800 }}>Contoh</p>
              <h3 className="card-title" style={{ margin: '6px 0 2px' }}>Panel extension</h3>
              <p style={{ fontSize: 12, color: 'var(--muted-2)' }}>Satu device, satu akun, satu kunci lokal.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 12px', background: 'var(--ink)', borderRadius: 10, margin: '12px 0 8px', color: 'var(--paper)' }}>
                <Raven variant="icon" size={20} />
                <strong style={{ fontSize: 12 }}>corbin</strong>
                <span style={{ color: '#8f8f9c', fontSize: 10.5 }}>· Laptop kantor</span>
                <span className="chip good" style={{ marginLeft: 'auto' }}>daring</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '9px 12px', background: 'var(--card-2)', borderRadius: 8, fontSize: 11.5, marginBottom: 8 }}>
                <span>Pairing</span><span style={{ fontWeight: 700 }}>Pasangkan browser ini</span><span className="chip good">selesai</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '9px 12px', background: 'var(--card-2)', borderRadius: 8, fontSize: 11.5 }}>
                <span>Jejak status</span><span style={{ fontWeight: 700 }}>Isi sheet onboarding</span><span className="chip good">selesai</span>
              </div>
            </div>
          </div>
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

        <section id="model" className="section">
          <div className="section-head">
            <h2>Pakai model sendiri.</h2>
            <p>Endpoint dan kunci ada di browser Anda.</p>
          </div>
          <div className="card" style={{ maxWidth: 560 }}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setStatus('Konfigurasi disalin. Tempel di popup extension — Simpan ke extension belum tersambung di halaman ini.');
              }}
            >
              <div className="field">
                <label htmlFor="provider">Penyedia</label>
                <select id="provider" className="input-sm" defaultValue="nvidia" style={{ background: '#fff' }}>
                  <option value="nvidia">NVIDIA</option>
                  <option value="groq">Groq</option>
                  <option value="ollama">Ollama</option>
                  <option value="lmstudio">LM Studio</option>
                  <option value="custom">Kustom…</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="modelEndpoint">Endpoint API</label>
                <input id="modelEndpoint" type="url" inputMode="url" autoComplete="off" spellCheck={false} maxLength={2048} placeholder="https://penyedia-anda.example/v1" />
              </div>
              <div className="field">
                <label htmlFor="modelName">Nama model</label>
                <input id="modelName" type="text" autoComplete="off" spellCheck={false} maxLength={120} placeholder="Nama yang dipakai penyedia Anda" />
              </div>
              <div className="field">
                <label htmlFor="modelKey">Kunci API</label>
                <input id="modelKey" type="password" autoComplete="off" spellCheck={false} maxLength={512} placeholder="Kunci dari penyedia Anda" />
              </div>
              <div className="hero-cta" style={{ marginTop: 2 }}>
                <button type="submit" className="btn btn-solid">Salin konfigurasi</button>
              </div>
              <p className="status" role="status" aria-live="polite">{status}</p>
              <p className="note">Endpoint https dan model lokal di 127.0.0.1 didukung. Kunci tidak pernah diunggah.</p>
            </form>
          </div>
        </section>

        <section className="section" aria-labelledby="whyTitle" style={{ paddingTop: 10 }}>
          <div className="section-head">
            <h2 id="whyTitle">Kenapa Corbin.</h2>
            <p>Empat cara kerja yang sering tertukar di kepala orang.</p>
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

        <section id="fitur" className="section" aria-labelledby="featuresTitle">
          <div className="section-head">
            <h2 id="featuresTitle">Apa yang ia kerjakan.</h2>
            <p>Enam hal. Satu arah: selesai.</p>
          </div>
          <div className="feature-grid">
            {FEATURES.map(([title, body]) => (
              <div key={title} className="feature">
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
          <div className="hero-cta" style={{ marginTop: 18 }}>
            <Link className="btn btn-solid" to="/index.html">Masuk / Daftar</Link>
            <Link className="btn btn-ghost" to="/docs.html">Baca Docs</Link>
          </div>
        </section>

        <section id="harga" className="section" aria-labelledby="pricingTitle">
          <div className="section-head">
            <h2 id="pricingTitle">Harga tetap. Tanpa kejutan.</h2>
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

        <section id="privacy" className="section">
          <div className="section-head">
            <h2>Privasi lebih dulu.</h2>
            <p>Model, kunci, dan persetujuan ada di tangan Anda. <Link to="/privasi.html">Baca kebijakan privasi</Link>.</p>
          </div>
          <div className="feature-grid">
            <div className="feature"><h3>Konten</h3><p>Hanya ke endpoint model Anda; riwayat antrean disimpan di database project.</p></div>
            <div className="feature"><h3>Kunci API</h3><p>Disimpan lokal. Tidak pernah diunggah.</p></div>
            <div className="feature"><h3>Screenshot</h3><p>Sensitif dan private selalu ditolak, tidak pernah dibagikan ke pihak ketiga.</p></div>
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

        <section className="section" aria-labelledby="whoTitle" style={{ padding: '24px 0 0' }}>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>Siapa di balik Corbin: <a href="https://github.com/afnannuzulasugihartono" style={{ color: 'inherit', textDecoration: 'underline' }}>AFNAN NUZULA SUGIHARTONO</a> · <a href="mailto:afnannuzulasugihartono@gmail.com" style={{ color: 'inherit', textDecoration: 'underline' }}>afnannuzulasugihartono@gmail.com</a> · <a href="https://github.com/afnannuzulasugihartono/opera-agent" style={{ color: 'inherit', textDecoration: 'underline' }}>kode sumber</a></p>
        </section>

        <section className="statement" aria-labelledby="finalTitle" style={{ paddingBottom: 40 }}>
          <h2 id="finalTitle" style={{ fontSize: 'clamp(34px,5vw,56px)', letterSpacing: '-0.03em' }}>Pasang. Pair. Kerja.</h2>
          <p style={{ fontSize: 15, color: 'var(--muted-2)', margin: '10px 0 20px' }}>Satu extension, satu akun, satu browser.</p>
          <Link className="btn btn-solid" to="/unduh.html" style={{ fontSize: 14, padding: '14px 26px' }}>Pasang corbin →</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
