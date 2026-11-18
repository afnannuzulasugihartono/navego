import { useState } from 'react';
import { seoMeta } from '../lib/seo.js';
import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return seoMeta({
    title: 'Fitur — Navego',
    description: 'Yang dikerjakan Navego: 45 tool MCP di atas 36 primitive browser, enam izin yang dijelaskan satu per satu, model milik Anda, pairing device yang bisa dicabut, dan empat berkas contoh yang bisa diunduh.',
    path: '/fitur'
  });
}

const ROLES = [
  ['Operator', 'Buka portal, cari data, unduh CSV', 'browser_open_url · browser_find_text · browser_download_file'],
  ['Analis', 'Rangkai laporan, cek asal tiap angka', 'artifact_build_report · artifact_build_workbook'],
  ['Pengembang', 'Pasang driver lokal, panggil dari harness', 'browser_status · browser_run_steps · browser_wait_until']
] as const;

const LANGKAH = [
  ['Tulis', 'Satu kalimat: ringkas cek onboarding Q4.'],
  ['Baca', 'Halaman, tombol, dan baris dibaca dari tab yang terbuka.'],
  ['Isi', 'Formulir dan sel diisi sesuai instruksi, bukan diklik asal.'],
  ['Simpan', 'Berkas hasil tersimpan, dengan jejaknya di dashboard.']
] as const;

const KEMAMPUAN = [
  ['baca', 'Baca halaman', 'Judul, teks, dan struktur tab yang Anda sebut — bukan semua tab.'],
  ['isi', 'Isi formulir', 'Kolom ditemukan dari label dan struktur, bukan alamat tetap.'],
  ['klik', 'Klik dan gulir', 'Tombol, menu, dan daftar bergulir ikut dijangkau.'],
  ['tunggu', 'Tunggu perubahan', 'Halaman yang memuat lama ditunggu, bukan ditebak.'],
  ['simpan', 'Simpan berkas', 'Excel, Word, PowerPoint, dan CSV mendarat di folder Anda.'],
  ['verifikasi', 'Verifikasi hasil', 'Setiap berkas membawa sidik jari SHA-256 sendiri.']
] as const;

const PERMISSIONS = [
  ['tabs', 'Membuka dan menavigasi tab yang Anda tunjuk.'],
  ['scripting', 'Menjaga skrip di halaman tetap hidup selama pekerjaan berjalan.'],
  ['storage', 'Menyimpan token dan pengaturan lokal Anda.'],
  ['alarms', 'Menjadwalkan pemeriksaan berkala di latar.'],
  ['debugger', 'Klik tepercaya, tangkapan layar, dan pembacaan aksesibilitas.'],
  ['downloads', 'Menyimpan berkas hasil kerja ke folder Anda.']
] as const;

const PATHS: Record<string, string> = {
  baca: 'M4 5h16v14H4z M8 9h8 M8 13h5',
  isi: 'M4 7h16 M4 12h16 M4 17h10',
  klik: 'M6 3l12 8-5 1 3 6-2 1-3-6-3 4z',
  tunggu: 'M12 7v5l3 2 M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z',
  simpan: 'M12 4v10 M8 10l4 4 4-4 M4 18h16',
  verifikasi: 'M4 12l5 5L20 6'
};

function Ikon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name] ?? PATHS.baca} />
    </svg>
  );
}

function RoleTabs() {
  const [active, setActive] = useState(0);
  const [role, task, tools] = ROLES[active] ?? ROLES[0];
  return (
    <div className="role-tabs" data-ui>
      <div className="role-list" role="tablist" aria-label="Jalur pengguna">
        {ROLES.map(([name], index) => (
          <button key={name} type="button" role="tab" aria-selected={index === active} className={index === active ? 'role-tab is-active' : 'role-tab'} onClick={() => setActive(index)}>{name}</button>
        ))}
      </div>
      <div className="role-detail" role="tabpanel">
        <h3>{task}</h3>
        <code>{tools}</code>
        <p>Contoh berkas nyata: <a href="/contoh/laporan-keuangan-2026-09.xlsx" download>Laporan (.xlsx)</a> · <a href="/contoh/rencana-strategis-2027.pptx" download>Rencana (.pptx)</a>.</p>
      </div>
    </div>
  );
}

export default function Fitur() {
  return (
    <>
      <SiteHeader current="/fitur" />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <p className="crumb">Fitur</p>
            <h1>Yang bisa dikerjakan Navego.</h1>
            <p className="lede">Satu perintah. Browser Anda membaca, mengisi, mengklik, lalu menyimpan hasilnya sebagai berkas.</p>
            <div className="hero-cta">
              <Link className="btn btn-solid" to="/unduh">Unduh navego</Link>
              <Link className="btn btn-ghost" to="/docs">Baca docs</Link>
            </div>
          </div>
        </section>

        <section className="band band-soft" aria-labelledby="taskTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Cara kerja</p>
                <h2 id="taskTitle" className="section-title">Empat langkah.</h2>
              </div>
              <p className="section-note">Tiap langkah memakai primitive yang sama — bukan trik per situs.</p>
            </div>
            <div className="value-grid">
              {LANGKAH.map(([title, body], index) => (
                <div className="value-card" key={title}>
                  <span className="start-num">{index + 1}</span>
                  <b>{title}</b>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="band" aria-labelledby="kemampuanTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Kemampuan</p>
                <h2 id="kemampuanTitle" className="section-title">Enam hal, satu mesin.</h2>
              </div>
              <p className="section-note">45 tool MCP di atas 36 primitive browser.</p>
            </div>
            <div className="card-row">
              {KEMAMPUAN.map(([icon, title, body]) => (
                <article className="tile-xl" key={title}>
                  <div className="tile-media"><Ikon name={icon} /></div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="band band-soft" aria-labelledby="roleTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Jalur</p>
                <h2 id="roleTitle" className="section-title">Satu produk, tiga pintu.</h2>
              </div>
              <p className="section-note">Operator, analis, pengembang — primitive yang sama.</p>
            </div>
            <RoleTabs />
          </div>
        </section>

        <section className="band band-dark" aria-labelledby="permTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker" style={{ color: 'var(--amber-hi)' }}>Izin</p>
                <h2 id="permTitle" className="section-title">Enam izin, tidak lebih.</h2>
              </div>
              <p className="section-note">Tidak ada izin lain di luar daftar ini.</p>
            </div>
            <div className="value-grid">
              {PERMISSIONS.map(([name, why]) => (
                <div className="value-card" key={name} style={{ background: '#16204a' }}>
                  <code style={{ fontSize: 'var(--text-sm)', color: 'var(--amber-hi)', background: 'transparent', border: 0 }}>{name}</code>
                  <p>{why}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="band">
          <div className="wrap">
            <div className="cta-band">
              <h2 className="section-title" style={{ color: '#ffffff' }}>Mulai dari satu perintah.</h2>
              <p>Buka akun, pair device ini, jalankan satu pekerjaan — hasilnya berkas nyata yang bisa Anda buka sendiri.</p>
              <div className="hero-cta" style={{ marginTop: 'var(--s-2)' }}>
                <Link className="btn btn-solid" to="/unduh">Unduh navego</Link>
                <Link className="btn btn-ghost" to="/harga">Lihat harga</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}