Benchmark Navego — Metrik Tool Otomatisasi Browser Lokal

Subjek: ekstensi MV3 + eksekutor stdio MCP afnannuzulasugihartono/navego. Audit baseline 3f1a43e (19 November 2026); pohon yang diaudit sudah 1.8.0 (20 November 2026) setelah enterprise pass. Format mengikuti Overleaf "The Research LaTeX Template": https://www.overleaf.com/latex/templates/research-template/hygwbqmrjcrc.pdf

## Abstrak

Navego adalah ekstensi browser MV3 dengan eksekutor stdio MCP yang menyediakan 40 tool otomatisasi lokal: 30 browser, 7 wallet, 2 delivery, dan 1 artifact. Paper ini mengukur tiga hal. Pertama, bentuk permukaan tool: 40 tool dipetakan ke lima dimensi (read, act, files, deliver, wallet) dan refs eksternal dihitung untuk melihat primitif mana yang menanggung permukaan. Kedua, biaya satu panggilan di dua jalan: jalan lokal lewat bridge loopback dan jalan hosted lewat relay, keduanya diukur pada browser harian yang sama. Ketiga, cacat yang ditemukan oleh pengukuran itu sendiri.

Hasil: di jalan lokal, read 13 ms, find 3 ms, click 4 ms, press 47 ms, dan goto 201 ms (p50); screenshot 61 ms dengan p95 8,0 s pada attach debugger pertama. Jalan hosted menjawab 1,3-11,7 s per tool, dengan lantai transport yang diukur repo ini pada kisaran ratusan milidetik. Pengukuran menemukan dua cacat: koneksi PostgREST yang tertahan sekitar sepuluh detik untuk pekerjaan yang selesai dalam 414 ms, dan probe bridge yang mengambil port debug 9222 tanpa pernah menautkan ekstensi. Keduanya diperbaiki dan diukur ulang. Enterprise pass 20 November 2026 menutup runtime validation, kredensial, redaksi log, OAuth, race refresh, integrasi PostgreSQL, branch protection, pemecahan dispatcher, validasi environment hosted, dan tiga berkas migration yang tidak pernah bisa dijalankan apa adanya.

Kata kunci: benchmark, tool use, MCP, otomatisasi browser, latency.

## 1. Pendahuluan

Navego adalah ekstensi browser MV3 dengan eksekutor stdio MCP. Arsitekturnya memisahkan katalog tool dari primitif browser: extension/ (service worker, content script, worker), local/ (eksekutor npm), shared/ (inti murni), dan hosted/ (edge functions). Tool adalah "kartu katalog" yang dibaca agen; primitif adalah "jalan emas" yang menjalankan pekerjaan. Pemisahan ini yang membuat permukaan bisa diaudit: setiap tool punya nama, skema input, dan satu primitif yang dieksekusi.

Tiga pertanyaan memandu benchmark ini:

- RQ1 Bentuk: tool mana yang menanggung permukaan, dan di dimensi apa?
- RQ2 Biaya: berapa harga satu panggilan di jalan lokal dan jalan hosted?
- RQ3 Cacat: apa yang ditemukan ketika permukaan diukur, dan apakah perbaikannya terbukti?

Kontribusinya tiga: (1) potret katalog 40 tool beserta refs dan lima dimensinya; (2) tabel latency dua jalan pada mesin harian, lengkap dengan p50/p95; (3) catatan cacat yang dapat direproduksi, dari gejala sampai perbaikan, ditambah daftar temuan enterprise yang ditutup pada 20 November 2026.

## 2. Pekerjaan Terkait

Benchmark tool-use yang mapan menilai agen, bukan permukaan tool. Tabel berikut merangkum tujuh acuan yang dipakai paper ini; semuanya dapat diverifikasi.

| # | Benchmark | Venue | Cakupan |
|---|-----------|-------|---------|
| 1 | MCP-Bench (https://arxiv.org/abs/2508.20453) | ICLR 2026 | 28 server MCP, 250 tool; task multi-hop dengan instruksi fuzzy dan koordinasi lintas domain |
| 2 | ToolSandbox (https://aclanthology.org/2025.findings-naacl.65/) | NAACL 2025 Findings | 1.032 skenario, 34 tool stateful, 13,9 turn rata-rata; dependensi state implisit |
| 3 | ToolBench (https://arxiv.org/abs/2307.16789) | ACL 2024 | 49 kategori, 16.464 API; instruksi nyata dan evaluasi berbasis ToolEval |
| 4 | BFCL v3 (https://gorilla.cs.berkeley.edu/leaderboard.html) | Berkeley | Function calling multi-turn: kategori multi-turn, paralel, dan irrelevance |
| 5 | tau-bench (https://arxiv.org/abs/2406.12045) | arXiv 2024 | 2 domain, 28 tool, 165 task; dialog dengan aturan domain dan user simulator |
| 6 | WebArena (https://arxiv.org/abs/2307.13854) | ICLR 2024 | 812 task long-horizon pada empat aplikasi web yang di-host sendiri |
| 7 | OSWorld (https://arxiv.org/abs/2404.07972) | NeurIPS 2024 | 369 task komputer nyata; manusia 72,36%, model terbaik 12,24% |

Posisi paper ini berbeda. Ketujuh acuan di atas mengukur kemampuan agen (model + tool) menyelesaikan task. Paper ini mengukur permukaan tool itu sendiri: bentuk katalog, biaya satu panggilan, dan cacat yang muncul saat diukur. Hasilnya bukan skor agen, melainkan anggaran yang bisa dipakai untuk merancang agen di atas permukaan tersebut, misalnya berapa panggilan yang layak dalam satu menit dan tool mana yang harus dihindari di jalur panas.

## 3. Metode

### 3.1 Audit katalog

Sumber tunggal katalog adalah local/tools.ts. Setiap tool diklasifikasikan ke satu dimensi: read (membaca halaman), act (mengubah halaman), files (unggah dan unduh), deliver (pernyataan dan faktur), dan wallet (saldo dan refund). Jumlah refs dihitung dari seluruh pohon repo, sehingga tool yang sering dipanggil kode lain terlihat menonjol. Audit ini bukan penilaian kualitas: refs tinggi berarti tool itu adalah primitif yang menanggung pekerjaan lain.

### 3.2 Pengukuran latency

Pengukuran memakai scripts/bench/latency-benchmark.ts dengan fixture yang sama untuk kedua jalan: satu halaman berisi satu field, satu tombol, dan seratus baris. Jalan lokal diukur lewat bridge loopback (npm run bridge lalu npm run benchmark:latency), tujuh run per tool, dan dilaporkan p50/p95. Jalan hosted diukur lewat MCP function di atas relay, lima run per tool, pada commit rilis 410658b0 (14 November 2026). Semua angka diambil pada browser harian yang sama, dengan perintah yang sama.

Dua catatan kejujuran. Pertama, ini bukan laboratorium terkontrol: latency memuat jaringan, edge, kanal perubahan, dan waktu settle halaman, sehingga satu run dapat bergeser ratusan milidetik. Kedua, permukaan MCP hosted dihapus dari pohon pada 14 November 2026; angka hosted di sini bersifat historis dan berguna sebagai pembanding, bukan sebagai janji produk. Jalan yang hidup adalah navego local.

### 3.3 Catatan cacat

Setiap anomali yang muncul saat pengukuran dicatat dengan tiga hal: gejala yang terlihat pemanggil, penyebab yang terbukti, dan perbaikan beserta angka sesudahnya. Cacat yang tidak dapat direproduksi tidak dimasukkan sebagai angka; ia dicatat sebagai anomali.

## 4. Hasil

### 4.1 Bentuk permukaan: 40 tool, lima dimensi

Katalog berisi 40 tool: 30 browser, 7 wallet, 2 delivery, dan 1 artifact. Tiga tool artifact lama (artifact_build_report, artifact_build_slides, artifact_build_document) digabung menjadi satu artifact_build dengan parameter target, sehingga jumlahnya turun dari 42 ke 40 tanpa kehilangan kemampuan.

Refs eksternal tertinggi dipegang primitif baca-cari-klik-tunggu:

| Tool | Peran | Refs |
|------|-------|------|
| browser_find_element | menyelesaikan baris menjadi handle anti-stale | 79 |
| browser_click | klik titik, handle, atau role+nama | 79 |
| browser_read_page | membaca tab: url, title, teks, dan strategi baca | 69 |
| browser_wait_until | menunggu teks, baris, url, atau halaman tenang | 50 |
| artifact_build | membangun artefak terverifikasi (word/xlsx/pptx/docx) | 44 |
| browser_screenshot | bukti visual berupa JPEG | 37 |
| wallet_refund | mengembalikan seluruh harga lewat billing | 17 |

Pola ini masuk akal: agen menghabiskan sebagian besar siklusnya untuk mencari, membaca, dan mengklik. Tool yang menanggung pekerjaan lain adalah tool yang harus paling stabil dan paling murah.

### 4.2 Jalan lokal: milidetik

Tabel berikut adalah p50/p95 dalam milidetik, tujuh run per tool, pada 11 November 2026.

| Tool | p50 | p95 |
|------|-----|-----|
| read | 13 | 14 |
| find | 3 | 4 |
| click_element | 4 | 5 |
| fill_element | 4 | 5 |
| press | 47 | 48 |
| stream | 46 | 48 |
| pointer | 1 | 2 |
| shot | 61 | 8.023 |
| run_browser_burst | 1 | 1 |
| goto | 201 | 204 |
| status | 5 | 7 |

Tiga pembacaan penting. Pertama, primitif baca-cari-klik berada di 3-13 ms, jadi seratus panggilan masih di bawah dua detik. Kedua, press dan stream berada di sekitar 47 ms karena setiap tombol dikirim lalu halaman ditanya apakah teksnya mendarat; itu harga verifikasi, bukan harga transport. Ketiga, shot punya p50 61 ms tetapi p95 8,0 s: capture pertama memasang debugger, capture berikutnya tidak.

### 4.3 Jalan hosted: detik

Tabel berikut adalah satu sampel per tool pada 14 November 2026, lewat permukaan MCP hosted yang sekarang sudah dihapus.

| Tool | p50 |
|------|-----|
| press / stream | 1,3 s |
| read | 1,4 s |
| find (role) | 1,9 s |
| fill_element | 2,4 s |
| click_element | 3,6 s |
| goto | 3,8 s |
| shot | 6,7 s |
| navigate_tab | 11,1 s |
| close | 11,7 s |

Lantai transport yang diukur repo ini: klaim perintah 58-297 ms dan selesai 486-810 ms, sebelum waktu settle halaman. Itulah sebabnya tool tercepat di jalan hosted tetap 1,3 s: satu perintah membayar relay, function, dan settle. Perbandingan satu baris: jalan lokal menjawab dalam satuan milidetik untuk sebagian besar tool; jalan hosted menjawab sekitar 1,3 detik untuk tool yang sama. Seratus panggilan berarti beda antara satu detik dan dua menit.

### 4.4 Dua cacat yang ditemukan pengukuran

Cacat 1: koneksi PostgREST tertahan sepuluh detik. Perangkat mengklaim perintah dalam 28 ms dan menyelesaikannya dalam 414 ms, kaki HTTP function sekitar 950 ms, tetapi pemanggil menunggu sekitar sepuluh detik; panggilan kemudian gagal dengan AWAIT_OUTCOME_UNKNOWN saat anggaran 12 detik function habis. Penyebabnya bukan transport, melainkan cara menunggu: function mencapai database lewat PostgREST, dan kedua wait-nya (hasil dan progress stream) menahan koneksi selama perintah berlangsung. Beberapa panggilan serentak memenuhi pool, dan panggilan berikutnya mengantre. Perbaikannya: wait diminta dalam irisan 250 ms, sehingga koneksi ditahan satu irisan, bukan satu perintah. Sesudah perbaikan, sisa p50 adalah hop relay ditambah kaki function.

Cacat 2: probe bridge mengambil port debug. Ekstensi bertanya "apakah ada yang menjawab di port ini" ketika mencari bridge loopback, dan Chrome yang berjalan dengan remote debugging menjawab di 9222. Ekstensi mengira itu bridge, memanggil endpoint debug selamanya, dan melaporkan "port 9222 discovered" tanpa pernah menautkan. Perbaikannya: probe sekarang mengajukan pertanyaan milik bridge sendiri, sehingga penjawab yang tidak bisa menjawabnya bukan bridge.

## 5. Diskusi dan Ancaman Validitas

Angka di atas menjawab RQ2 dengan jelas: jalan lokal adalah produk, jalan hosted adalah biaya. Selisih dua ordo bukan terutama soal protokol, melainkan soal jumlah hop: jalan lokal berbicara CDP langsung di mesin yang sama, sedangkan jalan hosted membayar relay, function, database, dan settle.

Ancaman validitas yang harus disebut:

- Satu mesin, satu browser. Semua angka diambil pada mesin harian yang sama. Mesin lain, ekstensi lain, atau profil lain dapat menggeser angka.
- Sampel kecil. Tujuh run untuk jalan lokal dan lima run untuk hosted bukan distribusi; p95 adalah ekor dari sampel kecil.
- Bukan lab terkontrol. Jaringan, edge, dan beban mesin ikut terukur.
- Jalan hosted sudah dihapus. Angka hosted bersifat historis; membandingkannya dengan rilis sekarang berarti membandingkan dengan jalan yang tidak lagi ada.
- Refs bukan popularitas. Hitungan refs mengukur ketergantungan internal, bukan pemakaian oleh pengguna.

Batas yang masih terbuka: browser_run_steps dibatasi 1-8 langkah, belum ada tool untuk pekerjaan panjang di luar browser, dan belum ada parameter verify-after-act pada tool mutasi. Ketiganya adalah rekomendasi, bukan angka.

## 6. Rekomendasi

1. Verifikasi sesudah aksi. Tambahkan parameter verify pada click, type, dan scroll: baca ulang halaman sebelum menjawab. Harga satu pembacaan jauh lebih murah daripada satu aksi yang salah.
2. Naikkan batas langkah. browser_run_steps 1-8 sudah menjadi batas yang terasa; naikkan batasnya atau tambahkan browser_run_batch untuk pekerjaan 10+ langkah.
3. Jaga harness latency di CI. Jalankan benchmark pada setiap rilis dengan anggaran p50 per tool, sehingga regresi terlihat sebagai angka, bukan sebagai keluhan.
4. Publikasikan angka per rilis. Setiap rilis membawa tabel p50/p95 sendiri; pembaca dapat membandingkan versi tanpa mengulang pengukuran.

## 7. Temuan Enterprise: yang ditutup dan yang masih terbuka

Audit internal 20 November 2026 terhadap commit 3f1a43e menemukan sembilan celah operasional; sembilan itu ditutup, dan tiga berkas migration yang tidak pernah bisa dijalankan dari repo apa adanya ikut diperbaiki.

Temuan yang ditutup, masing-masing dengan testnya sendiri:

1. Runtime validation: setiap panggilan tool divalidasi terhadap inputSchema yang sama dengan yang dibaca klien (tipe, enum, batas angka, objek tertutup).
2. Kredensial: file kredensial menolak akun tanpa password non-kosong.
3. Log kegagalan: rahasia diredaksi sebelum penulisan, dengan permission 0700/0600 pada POSIX dan icacls pada Windows.
4. OAuth: callback dengan state salah tidak lagi menghentikan login yang sedang berjalan.
5. Refresh token: Web Locks dan single-flight menutup race multi-tab.
6. CI: action di-pin ke SHA, checksum gitleaks diverifikasi, dan job PostgreSQL menerapkan seluruh migration dengan ON_ERROR_STOP lalu menguji bentuk hasilnya.
7. Branch protection: main mewajibkan satu approval dan code-owner sign-off pada permukaan gatekeeper.
8. Dispatcher: mcp-server dipecah per domain, job-tools dan browser-actions.
9. Env hosted: navego-billing dan navego-auth memvalidasi environment dan body permintaan.

Tiga migration yang tidak pernah bisa dijalankan apa adanya, ditemukan justru oleh lane PostgreSQL baru:

- 20260907204248_navego_1_0_0_seed_workflows.sql menutup array steps sebelum menutup call, sehingga 'output' jatuh di dalam array dan parser menolak statement itu di setiap Postgres.
- 20261118090100_opera_usd_plan_readers.sql dimulai dengan byte-order mark, yang ditolak parser sebelum statement pertama.
- 20261118000000_rename_dark_schemas.sql memindahkan satu fungsi dua kali, sehingga ALTER kedua tidak menemukan fungsi yang sudah pindah.

Selain itu, setiap kegagalan yang ditangkap lalu diabaikan kini tercatat dengan alasannya (tests/tooling/swallowed-errors.lock), dan daftar itu hanya boleh mengecil.

Yang masih terbuka, dan bukan bagian dari pekerjaan kode:

- Rotasi token Cloudflare ke cakupan read-only; itu tindakan pemilik atas secret yang sudah ada.
- Redesign autentikasi cookie BFF; itu keputusan produk yang sengaja ditunda.
- Fetch body situs yang belum punya validator di batasnya.
- Approval pull request oleh pemilik pada jalur gatekeeper: branch protection memang menolak merge tanpa review.

## 8. Kesimpulan

Katalog 40 tool Navego menutup lima dimensi dengan primitif yang jelas: baca, cari, klik, tunggu, bukti visual, artefak, deliver, dan wallet. Di jalan lokal, primitif inti menjawab dalam 3-13 ms dan goto dalam 201 ms, sehingga pekerjaan pendek terasa instan; shot dan press membayar verifikasi, bukan transport. Di jalan hosted, tool yang sama menjawab 1,3-11,7 s karena relay, function, dan settle, dan itulah alasan jalan hosted dihapus. Pengukuran menemukan dua cacat nyata, PostgREST yang menahan koneksi dan probe bridge yang mengambil port debug, dan keduanya diperbaiki dengan angka sesudahnya. Enterprise pass menutup sembilan celah operasional, membuat seluruh history migration bisa dibuktikan di database sungguhan, dan menutup setiap kegagalan yang diabaikan tanpa alasan. Sisa pekerjaan ada pada verifikasi sesudah aksi, batas langkah, rotasi secret, dan approval pemilik.

## Referensi

1. Wang, Z. et al. (2026). MCP-Bench: Benchmarking Tool-Using LLM Agents with Complex Real-World Tasks via MCP Servers. ICLR 2026. https://arxiv.org/abs/2508.20453
2. Lu, J. et al. (2025). ToolSandbox: A Stateful, Conversational, Interactive Evaluation Benchmark for LLM Tool Use Capabilities. NAACL 2025 Findings. https://aclanthology.org/2025.findings-naacl.65/
3. Qin, Y. et al. (2024). ToolLLM: Facilitating Large Language Models to Master 16000+ Real-world APIs. ACL 2024. https://arxiv.org/abs/2307.16789
4. Berkeley Function Calling Leaderboard (BFCL). https://gorilla.cs.berkeley.edu/leaderboard.html
5. Yao, S. et al. (2024). tau-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains. arXiv 2024. https://arxiv.org/abs/2406.12045
6. Zhou, S. et al. (2024). WebArena: A Realistic Web Environment for Building Autonomous Agents. ICLR 2024. https://arxiv.org/abs/2307.13854
7. Xie, T. et al. (2024). OSWorld: Benchmarking Multimodal Agents for Open-Ended Tasks in Open Computer Environments. NeurIPS 2024. https://arxiv.org/abs/2404.07972

Catatan data: angka katalog dan latency diambil dari main 9ef5d0dd dan enterprise pass (cabang enterprise-ready, rilis 1.8.0); baseline audit 3f1a43e (19 November 2026).