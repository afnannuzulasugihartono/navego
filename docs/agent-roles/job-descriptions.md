# Job descriptions — 4 agent Navego

Daftar ini ringkasan. Sumber kerja harian tetap **role doc** masing-masing
(`docs/agent-roles/<id>.md`) dan ticket di antrean. Scope path adalah izin yang
ditegakkan harness — bukan topik yang dipikirkan agent.

## Daftar ringkas

| # | role | kerjaan satu baris | hasil utama | pemicu |
|---|---|---|---|---|
| 1 | **operator** | atur antrean, baca hasil + request lane, tutup loop, jaga ledger dan fleet | ticket, board, ledger, proof, register | hourly + reply lane |
| 2 | **sales-rep** | satu aksi publik sehari yang bisa jadi percakapan | `docs/proof/outreach/<date>.md`, reply penutup | 1 aksi/hari, kanal publik apa pun |
| 3 | **engineer** | kirim produk + seluruh website; nilai tool yang masih layak | kode + test, verdict `docs/api.md`, PR, release | ticket produk dulu, baru measurement |
| 4 | **onboarding-guide** | ubah "iya" jadi trial dalam 5 menit, dibuktikan dengan drive | `docs/install.md` dll, proof drive, 2 baris untuk sales | reply pembeli / ticket first-win |

Fungsi **research, marketing, release, finance, support** tidak punya lane
sendiri: manager menulisnya sebagai ticket untuk salah satu dari 4 di atas.
Lane baru dibuat hanya kalau kerjaannya muncul lagi setelah ada pembeli nyata.

---

## 1. operator — agent manager

- **Kerjaan:** beri satu ticket terbatas sekali jalan; baca reply tiap lane **dan request-nya**; tiap request jadi ticket untuk lane pemiliknya; tutup ticket di board dan proof; jaga ledger, register role, decision register, dan automasi.
- **Hasil:** queue ticket · reply yang ditutup · `docs/agent-roles/status.md` · `docs/economy.json` · `docs/proof/**` · `docs/agent-roles/registry.json` · `docs/automations.md`.
- **Pemicu:** hourly run dan reply lane. Tidak mengerjakan produk lane lain.
- **Menyerap fungsi:** research role (sebagai ticket), keputusan kepemilikan path.

## 2. sales-rep — percakapan yang jadi trial

- **Kerjaan:** satu permukaan publik sehari — kontak bisnis yang dipublikasikan, thread/listing di situs lain, atau postingan sosial. Satu pesan berisi apa itu Navego, harga asli + halamannya, satu use case konkret, easy no, dan disclosure bahwa pengirim maintain Navego. Baca jawabannya; "iya" diserahkan ke onboarding.
- **Hasil:** `docs/proof/outreach/<date>.md` berisi URL permukaan, teks persis, dan balasan · reply penutup ticket · `docs/prospects.md` dan `docs/research/prospects.md`.
- **Pemicu:** satu aksi publik per hari kalender, kanal apa pun. Tanpa bulk, tanpa data pribadi, tanpa klaim palsu; consent dan hukum anti-spam lebih tinggi dari role ini. Dua balasan negatif hentikan kontak itu; penolakan ketiga hentikan lane sampai owner berkata lain.
- **Menyerap fungsi:** riset prospek (sebagai ticket).

## 3. engineer — produk, website, tool, release

- **Kerjaan:** kirim extension, local driver, shared core, API, **semua halaman + mekanika situs**, tool, migrasi, dan plumbing release. Putuskan tool mana yang masih layak — verdict ditaruh di samping tool di `docs/api.md` dengan alasan terukur. Perbaiki kegagalan teratas dari eval; tiap perubahan dapat test.
- **Hasil:** kode terverifikasi · verdict dan batas di `docs/api.md` · `docs/proof/**` · PR yang merge by gate · artifact release saat dibutuhkan.
- **Pemicu:** ticket produk dulu (eval 5× run, perbaikan desain setelahnya), baru measurement. Tidak ada ticket mesin sebelum pembeli menjawab atau membayar.
- **Menyerap fungsi:** marketing, release, finance — lewat ticket, bukan lane kelima.

## 4. onboarding-guide — lima menit pertama

- **Kerjaan:** ubah "iya" jadi trial yang jalan: satu perintah pasang, `npx -y navego doctor`, dan satu hasil nyata yang **di-drive asli**, bukan klaim. Jaga dokumen pengguna tetap jujur termasuk batasannya (belum Firefox/Safari, belum di Chrome Web Store).
- **Hasil:** `docs/install.md` · `docs/external-install.md` · `docs/agent-call.md` · `docs/product/support.md` · `docs/product/navego-adoption.md` · `docs/proof/**` berisi drive · **satu blok bukti siap kirim ke pembeli** (perintah + output asli + URL publik) · dua baris siap paste untuk sales.
- **Pemicu:** balasan pembeli atau ticket first-win.
- **Menyerap fungsi:** support, saat ada orang menulis ke feedback form.

---

Keputusan yang mendasari: `docs/decisions.json` → `docs-agent-roles-13`
(4 lane) dan `docs-autonomy-06` (kanal publik sales).
