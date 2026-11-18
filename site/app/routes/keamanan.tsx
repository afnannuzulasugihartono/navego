import { Link } from 'react-router';
import { seoMeta } from '../lib/seo.js';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return seoMeta({
    title: 'Keamanan — Navego',
    description: 'Aturan keamanan Navego yang dipatuhi kode: tanpa eval, katasandi dan OTP ditolak selalu, token diverifikasi lalu dibuang, izin eksplisit dan bisa dicabut, dan cara melaporkan kerentanan secara privat.',
    path: '/keamanan'
  });
}

const PRINSIP = [
  ['Tanpa eval', 'Satu-satunya jalan ke halaman adalah 36 primitive browser yang divalidasi — tidak ada eval, tidak ada remote code, tidak ada pengecualian untuk Anda maupun untuk pengembangnya.'],
  ['Isolated world', 'Content script berjalan di ISOLATED world. Ia tidak pernah membaca JavaScript halaman; ringkasan yang dipakainya dibangun oleh extension sendiri, bukan oleh halaman.'],
  ['Kata sandi dan OTP tidak disentuh', 'Kolom password, PIN, OTP/2FA, CVV/CVC, dan kode keamanan selalu ditolak — di mana pun, kapan pun, tanpa saklar untuk mematikannya.'],
  ['Berkas upload diblok', 'input file tidak pernah diisi oleh Navego. Unduhan hanya mendarat di folder yang Anda pilih.'],
  ['Tab pribadi di luar jangkauan', 'Private tabs ditolak di setiap gerbang — capture, listen, dan semua primitive lainnya.'],
  ['Token diverifikasi, lalu dibuang', 'Token diperiksa lalu dihapus dari memori. Tidak ada di log, tidak ada di payload, tidak ada di penyimpanan mana pun.'],
  ['Bridge loopback tertutup', 'Loopback bridge menuntut satu token. Pemanggil tanpa token tidak belajar lebih dari "ada yang terhubung".'],
  ['Model tidak memegang kunci', 'Yang keluar dari device: tujuan Anda (maks 1.200 karakter) dan ringkasan halaman (maks 1.200 karakter, maks 40 elemen). Kunci model tidak pernah meninggalkan device.'],
  ['Header terkunci', 'CSP berbasis host bernama, tanpa skrip inline (hash saja), frame-ancestors none, no-store — di setiap path situs ini.'],
  ['Izin eksplisit, bisa dicabut', 'Enam izin extension dijelaskan satu per satu. Device dan token bisa dicabut kapan pun dari Dashboard — tanpa pengembalian, tanpa batas waktu tunggu.']
] as const;

export default function Keamanan() {
  return (
    <>
      <SiteHeader current="/keamanan" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <p className="crumb">Keamanan</p>
            <h1>Keamanan, disebutkan satu per satu.</h1>
            <p className="lede">Bukan janji di atas banner. Sepuluh aturan ini dipatuhi kode, diuji tes, dan bisa diverifikasi di repositori terbuka.</p>
          </div>
        </section>

        <section className="band" aria-labelledby="prinsipTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Prinsip</p>
                <h2 id="prinsipTitle" className="section-title">Sepuluh yang dipatuhi kode.</h2>
              </div>
              <p className="section-note">Detail teknis penuh ada di <a href="https://github.com/afnannuzulasugihartono/navego/blob/main/docs/security.md" rel="noreferrer">docs/security.md</a>.</p>
            </div>
            <div className="value-grid">
              {PRINSIP.map(([title, body]) => (
                <div className="value-card" key={title}>
                  <b>{title}</b>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="band band-soft" aria-labelledby="laporTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Melaporkan kerentanan</p>
                <h2 id="laporTitle" className="section-title">Jangan buka isu publik.</h2>
              </div>
            </div>
            <div className="start-grid">
              <div className="card">
                <p className="plan-name">GitHub Security</p>
                <p>Laporkan secara privat lewat tab Security di repositori: <a href="https://github.com/afnannuzulasugihartono/navego/security/advisories/new" rel="noreferrer">advisories/new</a>. Tidak pernah terlihat publik sebelum diperbaiki.</p>
              </div>
              <div className="card">
                <p className="plan-name">Email</p>
                <p>Tulis ke <a href="mailto:afnannuzulasugihartono@gmail.com">afnannuzulasugihartono@gmail.com</a> dengan tab, langkah reproduksi, dan dampak yang Anda lihat.</p>
              </div>
              <div className="card">
                <p className="plan-name">Versi yang mendapat perbaikan</p>
                <p>Daftar versi yang didukung dan kebijakan rilis keamanan ada di <a href="https://github.com/afnannuzulasugihartono/navego/blob/main/SECURITY.md" rel="noreferrer">SECURITY.md</a> — versi terbaru selalu yang teratas.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap">
            <div className="cta-band">
              <h2 className="section-title" style={{ color: '#ffffff' }}>Ingin tahu persis apa yang dikerjakan Navego?</h2>
              <p>Baca daftar lengkap primitive dan tool di docs, atau lihat posisi Navego dibanding pendekatan lain.</p>
              <div className="hero-cta" style={{ marginTop: 'var(--s-2)' }}>
                <Link className="btn btn-solid" to="/docs#tools">Lihat tools MCP</Link>
                <Link className="btn btn-ghost" to="/bandingkan">Bandingkan pendekatan</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
