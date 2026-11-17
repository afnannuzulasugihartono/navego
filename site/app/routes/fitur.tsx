import { useState } from 'react';
import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '../components/Chrome';

export function meta() {
  return [
    { title: 'Fitur — Navego' },
    { name: 'description', content: 'Yang dikerjakan Navego: 45 tool MCP di atas 36 primitive browser, enam izin yang dijelaskan satu per satu, model milik Anda, pairing device yang bisa dicabut, dan empat berkas contoh yang bisa diunduh.' }
  ];
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
      <SiteHeader current="/fitur.html" />
      <main className="wrap">
        <header className="page-head">
          <h1>Yang bisa dikerjakan Navego.</h1>
          <p className="lede">Anda menulis satu perintah. Navego membaca halaman yang terbuka, mengisi formulir, lalu menyimpan hasilnya sebagai berkas.</p>
          <div className="page-head-actions">
            <Link className="btn btn-solid" to="/unduh.html">Unduh navego</Link>
            <Link className="btn btn-ghost" to="/beranda.html">Lihat contoh kerja</Link>
          </div>
        </header>

        <div className="facts" aria-label="Angka produk" style={{ fontSize: 12 }}>
          <span><b>45</b> tool MCP</span>
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

        <section className="section" aria-labelledby="roleTitle" style={{ paddingTop: 0 }}>
          <div className="section-head">
            <h2 id="roleTitle">Pilih jalur Anda.</h2>
            <p>Satu produk, tiga pintu masuk. Tiap jalur memakai primitive yang sama.</p>
          </div>
          <RoleTabs />
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
            <p>Buka akun, pair device ini, lalu jalankan satu pekerjaan — hasilnya berupa berkas nyata yang bisa Anda buka sendiri.</p>
          </div>
          <Link className="btn btn-solid" to="/unduh.html">Unduh navego</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
