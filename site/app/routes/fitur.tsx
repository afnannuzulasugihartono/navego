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

const STEPS = [
  ['Tulis', 'Satu kalimat: ringkas cek onboarding Q4.'],
  ['Baca', 'Halaman, tombol, dan baris dibaca dari tab yang terbuka.'],
  ['Isi', 'Formulir dan sel diisi sesuai instruksi, bukan diklik asal.'],
  ['Simpan', 'Berkas hasil kerja tersimpan, dengan jejaknya di dashboard.']
] as const;

const PERMISSIONS = [
  ['tabs', 'Membuka dan menavigasi tab yang Anda tunjuk.'],
  ['scripting', 'Menjaga skrip di halaman tetap hidup selama pekerjaan berjalan.'],
  ['storage', 'Menyimpan token dan pengaturan lokal Anda.'],
  ['alarms', 'Menjadwalkan pemeriksaan berkala di latar.'],
  ['debugger', 'Klik tepercaya, tangkapan layar, dan pembacaan aksesibilitas.'],
  ['downloads', 'Menyimpan berkas hasil kerja ke folder Anda.']
] as const;

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
            <h1>Yang bisa<br />dikerjakan Navego.</h1>
            <p className="lede">Anda menulis satu perintah. Navego membaca halaman yang terbuka, mengisi formulir, lalu menyimpan hasilnya sebagai berkas.</p>
            <div className="hero-cta">
              <Link className="btn btn-solid" to="/unduh">Unduh navego</Link>
              <Link className="btn btn-ghost" to="/docs">Baca docs</Link>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="taskTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Cara kerja</p>
                <h2 id="taskTitle" className="section-title">Satu pekerjaan, empat langkah.</h2>
              </div>
            </div>
            <ol className="steps">
              {STEPS.map(([title, body]) => (
                <li key={title}>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', color: 'var(--navy-deep)', marginBottom: 'var(--s-1)' }}>{title}</h3>
                    <p style={{ color: 'var(--muted-2)' }}>{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section" aria-labelledby="roleTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Jalur</p>
                <h2 id="roleTitle" className="section-title">Pilih jalur Anda.</h2>
              </div>
              <p className="section-note">Satu produk, tiga pintu masuk. Tiap jalur memakai primitive yang sama.</p>
            </div>
            <RoleTabs />
          </div>
        </section>

        <section className="section" aria-labelledby="permTitle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">Izin</p>
                <h2 id="permTitle" className="section-title">Enam izin, satu per satu.</h2>
              </div>
              <p className="section-note">Tidak ada izin lain di luar daftar ini.</p>
            </div>
            <div className="feature-grid">
              {PERMISSIONS.map(([name, why]) => (
                <div className="card" key={name}>
                  <code style={{ fontSize: 'var(--text-sm)' }}>{name}</code>
                  <p style={{ marginTop: 'var(--s-2)' }}>{why}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="card is-primary" style={{ background: 'var(--navy-deep)', color: '#eaf0ff', borderColor: 'var(--navy-deep)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--s-5)', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', color: '#ffffff', letterSpacing: '-0.02em' }}>Mulai dari satu perintah.</h2>
                <p style={{ color: '#a9bce8', marginTop: 'var(--s-2)' }}>Buka akun, pair device ini, lalu jalankan satu pekerjaan — hasilnya berupa berkas nyata yang bisa Anda buka sendiri.</p>
              </div>
              <Link className="btn btn-solid" to="/unduh">Unduh navego</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
