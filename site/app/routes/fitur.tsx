import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return [
    { title: 'Fitur — Corbin' },
    { name: 'description', content: 'Fitur Corbin: 56 tool dan 36 primitive, enam izin yang dijelaskan satu per satu, model milik Anda berjalan di perangkat Anda, pairing device yang tetap.' }
  ];
}

const BENTO = [
  ['56 tool, 36 primitive', 'Baca, isi, navigasi, verifikasi. Maps, YouTube, Docs adalah contoh awal.'],
  ['Enam izin, dijelaskan satu per satu', 'Setiap izin punya satu alasan yang bisa dibaca di halaman Unduh.'],
  ['Model milik Anda', 'Endpoint dan kunci tetap di browser Anda. Konten halaman hanya pergi ke model yang Anda pilih.'],
  ['Pairing device', 'Kode sekali pakai mengikat device ke akun Anda. Kelola di Dashboard.'],
  ['Baca halaman tanpa eksploitasi', 'Password, kode sekali pakai, token, dan kolom pembayaran selalu ditolak.'],
  ['MCP untuk harness apa pun', 'OpenCode, Kilo Code, dan Claude Code memakai satu endpoint.'],
  ['Empat berkas dari satu percakapan', 'Laporan keuangan, rencana strategis, riset promo, dan rencana pemasaran — ditulis sebagai berkas.'],
  ['Portal yang minta masuk tidak lagi membekukan kerja', 'Sign-in atau captcha? Corbin membaca dulu, menunggu Anda menyelesaikannya, lalu lanjut di tab yang sama. Kode sekali pakai tidak pernah dijawab Corbin.']
] as const;

const STEPS = [
  ['Bicara', 'Satu kalimat: ringkas cek onboarding Q4.'],
  ['Baca', 'Halaman, tombol, dan baris dibaca.'],
  ['Tulis', 'Formulir dan sel diisi, bukan diklik asal.'],
  ['Simpan', 'Berkas dan bukti ikut tersimpan.']
] as const;

export default function Fitur() {
  return (
    <>
      <SiteHeader current="/fitur.html" />
      <main className="wrap">
        <section className="section" style={{ paddingBottom: 30 }}>
          <h1 className="page-title" style={{ fontSize: 'clamp(38px,6vw,64px)' }}>Browser Anda, alat kerja.</h1>
          <p className="lede" style={{ marginTop: 12, maxWidth: '52ch' }}><strong>Companion dengan AI di belakangnya.</strong> Anda berbicara. Browser bekerja.</p>
          <div className="hero-cta">
            <Link className="btn btn-solid" to="/unduh.html">Unduh corbin</Link>
            <Link className="btn btn-ghost" to="/beranda.html#install">Lihat cara kerja</Link>
          </div>
        </section>

        <div className="facts" aria-label="Angka produk" style={{ fontSize: 12 }}>
          <span><b>56</b> tool</span>
          <span><b>36</b> primitive</span>
          <span><b>6</b> izin</span>
        </div>

        <section className="section" aria-labelledby="taskTitle">
          <div className="section-head">
            <h2 id="taskTitle">Dari satu kalimat ke berkas.</h2>
          </div>
          <ol style={{ listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            {STEPS.map(([title, body]) => (
              <li key={title} className="feature" style={{ display: 'grid', gap: 6 }}>
                <h3 className="card-title">{title}</h3>
                <p style={{ fontSize: 12.5, color: 'var(--muted-2)' }}>{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section" aria-label="Kemampuan utama" style={{ paddingTop: 0 }}>
          <div className="feature-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {BENTO.map(([title, body]) => (
              <article key={title} className="feature">
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
          <p style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>
            Contoh berkas hasil kerja: <a href="/contoh/laporan-keuangan-2026-09.xlsx" download>Laporan (.xlsx)</a> · <a href="/contoh/rencana-strategis-2027.pptx" download>Rencana (.pptx)</a> · <a href="/contoh/riset-promo.docx" download>Riset (.docx)</a> — <Link to="/studi.html">studi kasus lengkapnya</Link>.
          </p>
        </section>

        <section className="section" aria-labelledby="permTitle" style={{ paddingTop: 0 }}>
          <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <h2 id="permTitle" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>Izin yang diminta</h2>
              <p style={{ color: 'var(--muted-2)', fontSize: 13 }}>Tidak ada izin lain di luar daftar ini.</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['tabs', 'scripting', 'storage', 'alarms', 'debugger', 'downloads'].map((p) => (
                <code key={p} style={{ fontSize: 12, padding: '6px 12px' }}>{p}</code>
              ))}
            </div>
          </div>
        </section>

        <section className="statement" aria-labelledby="finalTitle" style={{ paddingBottom: 40 }}>
          <h2 id="finalTitle" style={{ fontSize: 'clamp(30px,4.5vw,48px)', letterSpacing: '-0.03em' }}>Satu extension. Browser Anda.</h2>
          <p style={{ fontSize: 15, color: 'var(--muted-2)', margin: '10px 0 20px' }}>Harga dan aturannya ada di halaman <Link to="/harga.html">Harga</Link>.</p>
          <Link className="btn btn-solid" to="/unduh.html">Unduh corbin</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
