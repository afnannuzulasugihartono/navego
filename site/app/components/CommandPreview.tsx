import { useState } from 'react';
import { Link } from 'react-router';

// Pratinjau alur: pengunjung memilih perintah, lalu melihat jejak primitive yang akan dipakai Navego.
// Tidak menjalankan browser siapa pun, tidak mengarang hasil — tautan docs tetap jujur.

const DEFAULT_COMMAND = 'Ringkas halaman yang sedang saya buka jadi tiga poin.';
const PRESETS = [
  { label: 'Ringkas halaman', command: DEFAULT_COMMAND },
  { label: 'Isi formulir', command: 'Isi formulir di tab ini dengan data yang saya berikan.' },
  { label: 'Simpan hasil', command: 'Simpan hasilnya sebagai berkas di folder saya.' }
];

const STEPS = [
  { tool: 'browser_read_page', label: 'Baca tab yang Anda sebutkan — url, judul, teks.' },
  { tool: 'browser_find_element', label: 'Temukan kolom atau tombol yang dimaksud.' },
  { tool: 'browser_type_text', label: 'Isi, klik, atau tunggu sesuai perintah.' },
  { tool: 'browser_download_file', label: 'Simpan berkas bila perintah berakhir pada berkas.' }
];

export function CommandPreview() {
  const [command, setCommand] = useState(DEFAULT_COMMAND);
  const [preview, setPreview] = useState(false);

  return (
    <div className="command-preview" data-ui>
      <form onSubmit={(event) => { event.preventDefault(); setPreview(true); }}>
        <label className="command-label" htmlFor="command-text">Coba satu perintah</label>
        <div className="command-row">
          <input
            id="command-text"
            className="command-input"
            value={command}
            onChange={(event) => { setCommand(event.target.value); setPreview(false); }}
          />
          <button className="command-run" type="submit">Lihat jejaknya</button>
        </div>
      </form>
      <div className="command-presets" aria-label="Contoh perintah">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className={command === preset.command ? 'command-preset is-selected' : 'command-preset'}
            onClick={() => { setCommand(preset.command); setPreview(false); }}
            aria-pressed={command === preset.command}
          >{preset.label}</button>
        ))}
      </div>
      {preview ? (
        <ol className="command-trace" aria-label="Pratinjau jejak perintah">
          {STEPS.map((step, index) => (
            <li key={step.tool}>
              <span className="trace-index">{index + 1}</span>
              <code>{step.tool}</code>
              <span>{step.label}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="command-hint">Pilih perintah untuk melihat langkah yang akan diambil Navego.</p>
      )}
      <p className="command-note">
        Pratinjau alur, bukan eksekusi. Navego baru bergerak setelah Anda memasangnya di browser sendiri.{' '}
        <Link to="/docs.html">Baca dokumentasi</Link>
      </p>
      <noscript>
        <p>Tanpa JavaScript, baca daftar kemampuan di <a href="/docs.html">dokumentasi</a>.</p>
      </noscript>
    </div>
  );
}
