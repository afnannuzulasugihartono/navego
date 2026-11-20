# Jalur distribusi gratis — semua browser yang didukung Opera

Jawaban singkat untuk "mana yang gratis dan bisa semua browser": **tidak ada satu store pun yang mencakup semua browser, dan Chrome Web Store memang berbayar ($5 satu kali).** Yang mencakup hampir semua dipakai orang — tanpa biaya apa pun — sudah hidup sekarang: CRX langsung dari layanan update Opera, ditambah dua store gratis (Edge Add-ons, Opera Add-ons) yang butuh akun Anda untuk sekali submit.

Yang didukung: **Chrome, Edge, Brave, Opera, Vivaldi, Chromium** — satu mesin (Chromium), satu build, satu izin (`debugger`) yang memang tidak diizinkan Firefox/Safari, jadi dua browser itu memang di luar lingkup, bukan "belum dicoba".

## Matriks jalur gratis (terverifikasi 2026-11-18)

| Browser | Jalur gratis hari ini | Butuh akun? | Status |
|---|---|---|---|
| Chrome | Unduh `.zip`/`.crx` di `/unduh` lalu Load unpacked; atau force-install via `extension-forceinstall.reg` (Windows, tanpa admin); atau `opera install` di Windows | Tidak | Live |
| Edge | Edge Add-ons (gratis, tanpa biaya developer) **atau** jalur CRX yang sama | Ya (akun Microsoft, gratis) untuk store; tidak untuk CRX | CRX live; store menunggu submit |
| Brave | Rails yang sama seperti Chrome (CRX + .reg) | Tidak | Live |
| Opera | Opera Add-ons (gratis) **atau** CRX yang sama | Ya (akun Opera, gratis) untuk store; tidak untuk CRX | CRX live; store menunggu submit |
| Vivaldi | CRX yang sama | Tidak | Live |
| Chromium | CRX yang sama | Tidak | Live |
| Firefox | **Tidak ada jalur gratis yang berfungsi**: izin `debugger` ditolak — lihat `/unduh` | - | Di luar lingkup by design |
| Safari | Tidak ada jalur gratis: distribusi butuh akun Apple Developer (berbayar) | Ya ($99/thn) | Di luar lingkup |

## Yang sudah aktif (tanpa biaya, tanpa store)

1. **CRX live** di layanan update (`update.xml` → `opera-ofgemipoobcnbjkfanmofjbdonjapmgl-<versi>.crx`) — terverifikasi 2026-11-18 setelah redeploy fungsi; versi yang disajikan mengikuti rilis CRX terakhir (`ship-crx`).
2. **Force-install kebijakan Windows**: `docs/store/extension-forceinstall.reg` — satu klik memasang dan mengunci extension di Chrome/Edge/Brave per-user (HKCU, tanpa admin). Trade-off tertulis di file itu sendiri (browser melapor "dikelola organisasi Anda", dan itu jujur).
3. **GitHub Releases**: `release.yml` melampirkan CRX/zip/checksum ke setiap release.
4. **Halaman `/unduh`**: unduh `.zip` per-browser + instruksi Load unpacked — satu build untuk lima browser.

## Paket listing untuk dua store gratis

Semua bahan ada di `docs/store/`:

- `opera-store.zip` — paket upload (73 berkas, MV3, tanpa `key`/`update_url` yang ditolak store; dibangun `py scripts/release/build-store-package.py`)
- `store-manifest.json` — manifest versi store (nama/deskripsi produk)
- `icon128.png` (+ `extension/icons/`) — ikon 16/32/48/128
- `opera-logo-400.png` — 400×400 untuk kartu listing
- `screenshots/popup-pair-1280x800.png` — popup extension ("Pair this browser")
- `screenshots/beranda-1280x800.png` — beranda navego.pages.dev (hero + artefak)
- Deskripsi (ID): "Bawa asisten AI Anda mengemudikan browser: klik, ketik, isi formulir, baca halaman. Anda pilih modelnya."
- Kebijakan privasi: `https://navego.pages.dev/privasi.html` — halaman live, dan aturan produknya memang ketat (halaman tidak keluar mesin, password/OTP/CVV selalu diblokir, commit selalu dengan konfirmasi).

### Edge Add-ons (gratis)

1. Daftar/masuk ke Partner Center (`partner.microsoft.com/dashboard/microsoftedge/overview`) — tanpa biaya.
2. Buat submission baru → unggah `opera-store.zip`.
3. Isi kartu: nama **Opera**, deskripsi di atas, kategori Productivity, ikon 400×400, screenshot 1280×800 (keduanya), link privasi.
4. Tinjauan Microsoft biasanya hitungan hari kerja. Perhatikan: store menampilkan extension id miliknya sendiri, bukan milik kita — paket tanpa `update_url`/`key` sudah benar untuk ini; jalur sideload/self-host memakai build lain dan tidak terganggu.

### Opera Add-ons (gratis)

1. Daftar/masuk ke `addons.opera.com` — tanpa biaya.
2. Add-on baru → unggah `opera-store.zip` (manifest MV3 yang sama diterima Opera; halaman listing menerima bahasa apa pun — pakai versi Indonesia di atas).
3. Isi ikon/screenshot/link privasi yang sama.

## Yang tidak dilakukan

- **Chrome Web Store ($5)**: tetap ditunda sampai ada dana — bukan prioritas, karena jalur CRX sudah menjangkau Chrome penuh.
- **Firefox**: butuh port nyata (izin debugger, model izin skrip, perilaku MV3 Firefox) — pekerjaan engineering tersendiri, bukan submit form.
- **Safari**: butuh akun Apple Developer berbayar — di luar lingkup gratis.
- **Listing palsu/badge kosong**: tidak ada; badge Glama misalnya menunggu verifikasi nyata.
