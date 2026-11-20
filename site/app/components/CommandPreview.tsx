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
  { tool: 'browser_read_page', label: 'Baca tab yang Anda sebutkan' },
  { tool: 'browser_find_element', label: 'Temukan kolom atau tombol yang dimaksud' },
  { tool: 'browser_type_text', label: 'Isi, klik, atau tunggu sesuai perintah' },
  { tool: 'browser_download_file', label: 'Simpan hasilnya sebagai berkas' }
] as const;

export function CommandPreview() {
  const [command, setCommand] = useState(DEFAULT_COMMAND);

  return (
    <div className="try-panel" data-ui>
      <div className="try-command" aria-label="Pratinjau perintah Navego">
        <p className="try-eyebrow">navego ❯ coba</p>
        <p className="try-typed">{command}<span className="try-caret" aria-hidden="true" /></p>
        <div className="try-presets" role="group" aria-label="Contoh perintah">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className={command === preset.command ? 'try-preset is-selected' : 'try-preset'}
              onClick={() => setCommand(preset.command)}
              aria-pressed={command === preset.command}
            >{preset.label}</button>
          ))}
        </div>
      </div>
      <div className="try-trace" aria-label="Pratinjau jejak perintah">
        <p className="try-eyebrow">jejak</p>
        <ol className="try-steps">
          {STEPS.map((step, index) => (
            <li key={step.tool}>
              <span className="try-step-num">{index + 1}</span>
              <span className="try-step-body">
                <code>{step.tool}</code>
                <span>{step.label}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="try-note">
          Pratinjau, bukan eksekusi.{' '}
          <Link to="/docs">Baca dokumentasi →</Link>
        </p>
      </div>
    </div>
  );
}
