import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return [
    { title: 'Fitur — Corbin' },
    { name: 'description', content: 'Yang dikerjakan Corbin: 56 tool dan 36 primitive browser, enam izin yang dijelaskan satu per satu, model milik Anda, pairing device yang bisa dicabut, dan empat berkas contoh yang bisa diunduh.' }
  ];
}

const BENTO = [
  ['56 tool, 36 primitive', 'Membaca, mengisi, menavigasi, dan memverifikasi halaman. Peta, YouTube, dan Docs adalah contoh yang paling sering.'],
  ['Enam izin, satu alasan masing-masing', 'Setiap izin dijelaskan di halaman Unduh: untuk apa, dan apa yang ditolak.'],
  ['Model milik Anda', 'Endpoint dan kunci tetap di browser ini. Isi halaman hanya pergi ke model yang Anda pilih.'],
  ['Pairing device', 'Kode sekali pakai mengikat device ke akun Anda. Cabut dari dashboard kapan saja.'],
  ['Kolom rahasia ditolak', 'Password, kode sekali pakai, token, dan kolom pembayaran selalu ditolak.'],
  ['MCP untuk harness apa pun', 'OpenCode, Kilo Code, dan Claude Code memakai satu endpoint yang sama.'],
  ['Empat berkas dari satu perintah', 'Laporan keuangan, rencana strategis, riset promo, dan rencana pemasaran — semuanya berkas.'],
  ['Halaman yang minta login tidak memblokir', 'Corbin membaca dulu, lalu menunggu Anda menyelesaikan login atau captcha sendiri, lalu lanjut di tab yang sama.']
] as const;

const STEPS = [
  ['Tulis', 'Satu kalimat: ringkas cek onboarding Q4.'],
  ['Baca', 'Halaman, tombol, dan baris dibaca dari tab yang terbuka.'],
  ['Isi', 'Formulir dan sel diisi sesuai instruksi, bukan diklik asal.'],
  ['Simpan', 'Berkas hasil kerja tersimpan, dengan jejaknya di dashboard.']
] as const;

export default function Fitur() {
  return (
    <>
      <SiteHeader current="/fitur.html" />
      <main className="wrap">
        <header className="page-head">
          <h1>Yang bisa dikerjakan Corbin.</h1>
          <p className="lede">Anda menulis satu perintah. Corbin membaca halaman yang terbuka, mengisi formulir, lalu menyimpan hasilnya sebagai berkas.</p>
          <div className="page-head-actions">
            <Link className="btn btn-solid" to="/unduh.html">Unduh corbin</Link>
            <Link className="btn btn-ghost" to="/beranda.html">Lihat contoh kerja</Link>
          </div>
        </header>

        <div className="facts" aria-label="Angka produk" style={{ fontSize: 12 }}>
          <span><b>56</b> tool</span>
          <span><b>36</b> primitive</span>
          <span><b>6</b> izin</span>
        </div>

        <section className="section" aria-labelledby="taskTitle">
          <div className="section-head">
            <h2 id="taskTitle">Satu pekerjaan, empat langkah.</h2>
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

        <div className="page-foot">
          <div>
            <h2>Mulai dari satu perintah.</h2>
            <p>Buka akun, pair device ini, lalu jalankan satu pekerjaan — hasilnya bisa Anda buka di halaman <Link to="/studi.html" style={{ color: '#9ff3ff' }}>Studi kasus</Link>.</p>
          </div>
          <Link className="btn btn-solid" to="/unduh.html">Unduh corbin</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
