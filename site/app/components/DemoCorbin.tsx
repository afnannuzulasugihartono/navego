import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';

// DemoCorbin — a short film about what one command buys.
// The content is the real, public Sinar Jaya September run: same CSV, same totals, same sha256-pinned artifacts re-checked on the proof page.

type Scene = 'idle' | 'run' | 'done';

interface Beat {
  text: string;
  tone?: 'ok' | 'amber' | 'dim' | 'title' | 'end';
  hold?: number;
}

const FILM: Beat[] = [
  { text: 'SINAR JAYA — September 2026', tone: 'title', hold: 1600 },
  { text: '23 baris kas. Satu file CSV.', tone: 'dim', hold: 1400 },
  { text: 'corbin jalankan "isi laporan keuangan September"', tone: 'amber', hold: 1200 },
  { text: 'Membuka transaksi-2026-09.csv …', tone: 'dim', hold: 700 },
  { text: 'Membaca 23 baris · 4 kolom', tone: 'dim', hold: 700 },
  { text: 'Pendapatan Penjualan … Rp 216.700.000', tone: 'ok', hold: 500 },
  { text: 'Beban Pokok Layanan …  −Rp 86.680.000', tone: 'ok', hold: 500 },
  { text: 'Total September …        Rp 65.310.000', tone: 'ok', hold: 1100 },
  { text: 'Ditulis: laporan-keuangan-2026-09.xlsx (3 sheet)', tone: 'dim', hold: 900 },
  { text: 'Corbin.', tone: 'end', hold: 2000 }
];

export function DemoCorbin() {
  const [scene, setScene] = useState<Scene>('idle');
  const [shown, setShown] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (scene !== 'run') return;
    if (shown >= FILM.length) {
      setScene('done');
      return;
    }
    const beat = FILM[Math.max(0, shown - 1)];
    const hold = beat?.hold ?? 600;
    timer.current = window.setTimeout(() => setShown((s) => s + 1), hold);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [scene, shown]);

  const play = () => { setShown(1); setScene('run'); };

  return (
    <div className="film">
      <div className="film-frame">
        <div className="film-titlebar">CORBIN PLAYER</div>
        <div className="film-viewport" role="log" aria-live="polite" aria-label="Film: Corbin mengisi laporan keuangan">
          {scene === 'idle' ? (
            <div className="film-poster">
              <span className="film-studio">corbin player</span>
              <span className="film-title">Satu Perintah.</span>
              <span className="film-subtitle">23 baris kas masuk → berkas yang bisa Anda kirim</span>
              <button type="button" className="film-play" onClick={play} aria-label="Putar film">
                <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
                <span>Tonton</span>
              </button>
              <span className="film-credit">demo berjalan di browser ini · angka dan berkas asli</span>
            </div>
          ) : (
            FILM.slice(0, shown).map((beat, index) => (
              <p key={index} className={`film-line film-line--${beat.tone}${scene === 'run' && index === shown - 1 && index < FILM.length - 1 ? ' cursor-blink' : ''}`}>{beat.text}</p>
            ))
          )}
          {scene === 'done' && (
            <a className="film-download" href="/contoh/laporan-keuangan-2026-09.xlsx" download>Unduh laporan-keuangan-2026-09.xlsx →</a>
          )}
        </div>
        <div className="film-bar">
          <span className="film-time">{scene === 'run' ? `${String(Math.min(shown, FILM.length)).padStart(2, '0')}/${FILM.length}` : scene === 'done' ? 'TAMAT' : 'FILM'}</span>
          <span className="film-proof"><a href="/bukti.html">sha256</a> · <a href="/studi.html">studi kasus</a></span>
        </div>
      </div>
      {scene === 'done' ? (
        <div className="film-aftercredits">
          <p>Corbin duduk di browser Anda. Biarkan ia mendaratkan berkasnya.</p>
          <Link className="btn btn-solid" to="/unduh.html">Pasang corbin</Link>
        </div>
      ) : null}
    </div>
  );
}
