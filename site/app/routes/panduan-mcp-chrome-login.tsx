// decisions.json -> site-answer-01 (one page answers one real query with first-hand evidence)

import { Link } from 'react-router';
import { seoMeta } from '../lib/seo.js';
import { SiteFooter, SiteHeader } from '../components/Chrome';

const FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Apakah Navego bisa memakai Chrome yang sudah saya masuki?',
      acceptedAnswer: { '@type': 'Answer', text: 'Ya. Navego adalah server MCP lokal plus extension MV3 yang menyambung ke browser Anda sendiri lewat bridge di 127.0.0.1:9451. Sesi browser tidak diekspor ke cloud.' }
    },
    {
      '@type': 'Question',
      name: 'Apakah Navego mengisi CAPTCHA atau kode OTP untuk saya?',
      acceptedAnswer: { '@type': 'Answer', text: 'Tidak. Gerbang login, OTP, dan CAPTCHA diserahkan kembali kepada orang. Agent berhenti sebagai needsHuman dan dilanjutkan setelah Anda menyelesaikannya.' }
    },
    {
      '@type': 'Question',
      name: 'Browser apa yang didukung?',
      acceptedAnswer: { '@type': 'Answer', text: 'Chrome, Edge, Brave, Opera, dan Vivaldi dengan MV3. Firefox dan Safari belum didukung.' }
    },
    {
      '@type': 'Question',
      name: 'Berapa biayanya?',
      acceptedAnswer: { '@type': 'Answer', text: 'Memasang extension gratis. Plan berbayar mulai $1 untuk satu bulan, dibayar sekali dan tidak memperpanjang otomatis. Lihat https://navego.pages.dev/harga.' }
    }
  ]
};

export function meta() {
  return seoMeta({
    title: 'Cara pakai MCP di Chrome yang sudah login — Navego',
    description: 'Server MCP lokal yang memakai sesi Chrome Anda sendiri: pasang extension, masuk dan pair, jalankan npx -y navego local, lalu arahkan agent ke tool MCP. Ada batasannya, dan bukti lima kali jalan tersedia.',
    path: '/panduan-mcp-chrome-login'
  });
}

export default function PanduanMcpChromeLogin() {
  return (
    <>
      <SiteHeader current="/panduan-mcp-chrome-login" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ) }} />
      <main>
        <section className="page-hero" aria-labelledby="answer-title">
          <div className="wrap">
            <h1 id="answer-title">Pakai MCP di Chrome yang sudah Anda masuki.</h1>
            <p className="lede">Navego adalah server MCP lokal yang menyambung ke browser Anda sendiri. Pasang extensionnya, masuk dan pair sekali, lalu agent Anda bisa membaca tab, mengisi formulir, dan menyimpan berkas sebagai hasil nyata. Sesi browser tidak di ekspor ke server orang lain.</p>
            <p className="note">Ditulis oleh pemelihara Navego, 28 November 2026. Ini berasal dari perangkat yang benar-benar dijalankan, bukan dari daftar fitur yang belum diukur.</p>
          </div>
        </section>

        <section className="band band-soft">
          <div className="wrap">
            <h2 className="section-title">Empat langkah.</h2>
            <ol>
              <li><strong>Pasang extension.</strong> Mulai gratis dari <Link to="/unduh">halaman Unduh</Link>. Di Windows, satu perintah memasang extension; perintah itu menulis policy HKCU, dan halaman Unduh menjelaskan cara membalikkannya.</li>
              <li><strong>Masuk dan pair.</strong> Buka <Link to="/masuk">halaman Masuk</Link>, masuk dengan Google, GitHub, atau tautan email, lalu pairing browser dari dashboard.</li>
              <li><strong>Jalankan driver lokal.</strong> Di terminal:
                <pre><code>npx -y navego local</code></pre>
                Biarkan proses ini hidup. Bridge mendengar di <code>127.0.0.1:9451</code>.
              </li>
              <li><strong>Arahkan agent Anda.</strong> Tambahkan server lokal ke klien MCP:
                <pre><code>{`{ "mcpServers": { "navego": { "command": "npx", "args": ["-y", "navego", "local"] } } }`}</code></pre>
              </li>
            </ol>
            <p className="note">Cek dengan <code>npx -y navego doctor</code>. Di mesin baru ia melaporkan <code>degraded</code> sampai login dan pairing selesai; setelah itu ia menampilkan plan dan kuota. <Link to="/mcp">Contoh konfigurasi untuk beberapa klien →</Link></p>
          </div>
        </section>

        <section className="band">
          <div className="wrap">
            <h2 className="section-title">Yang tidak kami lakukan.</h2>
            <p>Navego tidak mengisi CAPTCHA atau kode OTP, tidak melewati perlindungan akun, tidak mengubah settings, dan tidak melakukan transaksi. Saat halaman meminta verifikasi manusia, agent berhenti dan menyerahkan kembali ke Anda. Browser yang didukung adalah Chromium MV3 — Chrome, Edge, Brave, Opera, Vivaldi. Firefox dan Safari belum.</p>
            <p className="note">Bukti: lima kali jalan mengambil dokumen dari Google Drive dengan sesi yang sudah ada; 2 dari 5 menghasilkan PDF dua halaman terverifikasi berisi 578.104 byte, 3 dari 5 mengunduh berkas, dan dua kegagalan disebabkan jatah sesi bersama. <a href="https://github.com/afnannuzulasugihartono/navego/blob/main/docs/proof/2026-11-27-engineer.md">Baca catatan lima kali jalan →</a></p>
          </div>
        </section>

        <section className="band band-soft">
          <div className="wrap">
            <h2 className="section-title">Mulai dari yang bisa Anda hitung.</h2>
            <p>Pasang extensionnya gratis. Plan berbayar mulai $1 untuk satu bulan, sekali bayar, tanpa perpanjangan otomatis.</p>
            <div className="hero-cta">
              <Link className="btn btn-solid" to="/unduh">Pasang gratis</Link>
              <Link className="btn btn-ghost" to="/harga">Lihat harga</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
