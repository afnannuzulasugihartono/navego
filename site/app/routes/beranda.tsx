// decisions.json -> D43, D42, D45, D46, D48, site-type-01 (one idea per tile, short sentences, second person, facts pinned, inverted pyramid)

import { Link } from 'react-router';
import { seoMeta } from '../lib/seo.js';
import { CommandPreview } from '../components/CommandPreview';
import { SiteHeader, SiteFooter } from '../components/Chrome';

export function meta() {
  return seoMeta({
    title: 'Navego — AI agent di browser Anda',
    description: 'Situs tanpa API. Perintah jadi berkas. Navego membuka portal, mengisi formulir, mengunduh data, dan menyimpan Excel, Word, atau PowerPoint di browser Anda — tanpa eval, tanpa skrip.',
    path: '/beranda'
  });
}

const LANGKAH = [
  { title: 'Tunjuk tab', body: 'Anda tunjuk. Navego yang membaca.' },
  { title: 'Tulis perintah', body: 'Bahasa Anda. Tanpa skrip.' },
  { title: 'Ambil berkas', body: 'Hasilnya di folder Anda. .xlsx, .docx, .pptx.' }
];

const KEMAMPUAN = [
  { title: 'Baca', body: 'Teks dan tabel tab yang Anda sebut.' },
  { title: 'Isi', body: 'Formulir ditemukan dari label.' },
  { title: 'Klik', body: 'Tombol dan menu dijangkau.' },
  { title: 'Tunggu', body: 'Halaman lambat ditunggu, bukan ditebak.' },
  { title: 'Simpan', body: 'Berkas nyata di folder Anda.' },
  { title: 'Verifikasi', body: 'Setiap berkas membawa SHA-256.' }
];

const BUKTI = [
  { title: 'Laporan keuangan (.xlsx)', body: 'Buku kerja hasil ekstraksi tabel portal — siap dibuka dan diperiksa.', href: '/contoh/laporan-keuangan-2026-09.xlsx' },
  { title: 'Rencana pemasaran (.docx)', body: 'Dokumen Word hasil perintah, bukan tempelan HTML.', href: '/contoh/rencana-pemasaran-2027.docx' },
  { title: 'Rencana strategis (.pptx)', body: 'Deck PowerPoint dari ringkasan riset dan angka yang bisa ditelusuri.', href: '/contoh/rencana-strategis-2027.pptx' }
];

const FAQ = [
  { q: 'Apakah Navego membaca semua tab saya?', a: 'Tidak. Tab yang Anda tunjuk saja.' },
  { q: 'Apakah kata sandi boleh diketik agen?', a: 'Tidak pernah. Kolom itu selalu ditolak.' },
  { q: 'Ke mana data halaman saya pergi?', a: 'Dibaca di mesin Anda. Supabase menyimpan akun, device, perintah, dan hasilnya. Model pilihan Anda menerima tujuan dan potongan halaman yang diperlukan saja.' },
  { q: 'Bagaimana kalau pekerjaan gagal di tengah?', a: 'OTP, captcha, dan login berhenti untuk handoff manusia. continueOnError menyimpan langkah yang berhasil dan daftar kegagalannya — tidak ada retry loop.' },
  { q: 'Apa biaya di luar plan?', a: 'Navego tidak menambah markup token atau biaya proxy. Provider AI Anda menagih sesuai tarif mereka sendiri.' },
  { q: 'Apa yang dipasang di komputer saya?', a: 'Ekstensi dan driver lokal. Keduanya bisa Anda periksa dan cabut.' }
];

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Navego',
  operatingSystem: 'Windows, macOS, Linux',
  applicationCategory: 'BrowserApplication',
  description: 'Asisten AI yang menjalankan browser Anda dari satu perintah teks.',
  url: 'https://navego.pages.dev/beranda',
  downloadUrl: 'https://navego.pages.dev/unduh',
  inLanguage: 'id'
};

const Ikon = ({ name }: { name: string }) => {
  const paths: Record<string, string> = {
    baca: 'M4 5h16v14H4z M8 9h8 M8 13h5',
    isi: 'M4 7h16 M4 12h16 M4 17h10',
    klik: 'M6 3l12 8-5 1 3 6-2 1-3-6-3 4z',
    tunggu: 'M12 7v5l3 2 M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z',
    simpan: 'M12 4v10 M8 10l4 4 4-4 M4 18h16',
    verifikasi: 'M4 12l5 5L20 6'
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
};

export default function Beranda() {
  return (
    <>
      <SiteHeader />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

        <section className="hero" aria-labelledby="judul-beranda">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <h1 id="judul-beranda">Situs tanpa API. Perintah jadi berkas.</h1>
              <p className="lede">
                Navego adalah AI agent di browser Anda: membuka portal, mengisi formulir, mengunduh data, lalu menyimpannya sebagai Excel, Word, atau PowerPoint. Lokal, tanpa skrip, tanpa eval.
              </p>
              <div className="hero-cta">
                <Link className="btn btn-solid" to="/unduh">Mulai gratis</Link>
                <Link className="btn btn-ghost" to="/docs">Lihat dokumentasi</Link>
              </div>
              <div className="hero-proof" aria-label="Bukti produk">
                <span>Browser lokal</span>
                <span>40 tool MCP</span>
                <span>SHA-256 tiap berkas</span>
              </div>
              <p className="microcopy">Ekstensi dan driver lokal. Bisa Anda periksa dan cabut sendiri.</p>
            </div>
            <div className="demo-window" aria-hidden="true">
              <div className="demo-bar">
                <span className="demo-dots"><i /><i /><i /></span>
                <span className="demo-url">tab — portal.internal.id/laporan-kuartal</span>
              </div>
              <div className="demo-body">
                <p className="cmd-bubble"><small>Perintah Anda</small>Ringkas laporan ini, simpan sebagai Excel.</p>
                <ul className="act-list">
                  <li className="act is-done"><i />Baca tab — 3 tabel ditemukan</li>
                  <li className="act is-done"><i />Isi 3 kolom, klik Ekspor</li>
                  <li className="act is-done"><i />Simpan ke folder Unduhan</li>
                </ul>
                <div className="file-grid">
                  <span className="file-chip"><b>✓</b>laporan-kuartal.xlsx</span>
                  <span className="file-chip"><b>✓</b>sha256 a4f12765…</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="judul-cara">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="judul-cara" className="section-title">Tiga langkah. Tanpa skrip.</h2>
              </div>
              <p className="section-note">Browser Anda tetap browser Anda.</p>
            </div>
            <div className="tile-grid">
              {LANGKAH.map((item, index) => (
                <div className="tile" key={item.title}>
                  <span className="start-num">{index + 1}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
            <div className="stat-strip mt-6">
              <div className="stat"><b>40</b><span>tool MCP</span></div>
              <div className="stat"><b>36</b><span>primitive browser</span></div>
              <div className="stat"><b>6</b><span>izin, tidak lebih</span></div>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="judul-kemampuan">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="judul-kemampuan" className="section-title">Yang bisa dikerjakan.</h2>
              </div>
              <p className="section-note"><Link to="/fitur">Lihat semua kemampuan →</Link></p>
            </div>
            <div className="tile-grid">
              {KEMAMPUAN.map((item, index) => (
                <div className="tile" key={item.title}>
                  <Ikon name={['baca', 'isi', 'klik', 'tunggu', 'simpan', 'verifikasi'][index] ?? 'baca'} />
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="judul-bukti">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="judul-bukti" className="section-title">Bukan screenshot. Berkas yang bisa Anda buka.</h2>
              </div>
              <p className="section-note">Unduh contohnya. Periksa isinya. Baru nilai sendiri.</p>
            </div>
            <div className="tile-grid">
              {BUKTI.map((item) => (
                <article className="tile" key={item.href}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <p><a href={item.href} download>Unduh berkas contoh →</a></p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-dark" aria-labelledby="judul-coba">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="judul-coba" className="section-title">Coba satu perintah.</h2>
              </div>
              <p className="section-note">Jejak nyata. Bukan eksekusi.</p>
            </div>
            <CommandPreview />
          </div>
        </section>

        <section className="section" aria-labelledby="judul-harga">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="judul-harga" className="section-title">Coba dulu. Bayar kalau cocok.</h2>
              </div>
              <p className="section-note">Mulai $1. Tanpa langganan. <Link to="/harga">Lihat semua paket →</Link></p>
            </div>
            <div className="plans">
              <div className="card plan">
                <p className="plan-name">Starter</p>
                <p className="plan-price">$1<small> / bulan</small></p>
                <ul><li>1.000 perintah / hari</li><li>50 per sesi</li><li>PayPal</li></ul>
              </div>
              <div className="card plan is-primary">
                <p className="plan-name">Business</p>
                <p className="plan-price">$17<small> / 6 bulan</small></p>
                <ul><li>17.000 perintah / hari</li><li>500 per sesi</li><li>Semua fitur, prioritas dukungan</li></ul>
              </div>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="judul-tanya">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 id="judul-tanya" className="section-title">Pertanyaan yang sering muncul.</h2>
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
              <h2 className="section-title">Satu pekerjaan. Satu berkas.</h2>
              <p>Mulai dari tab Anda sendiri.</p>
              <div className="hero-cta">
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
