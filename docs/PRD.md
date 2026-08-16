# PRD — MUHSIN APP

**Versi Dokumen:** 1.0
**Status:** Draft — MVP Planning
**Tech Stack:** Bun + Hono + Drizzle ORM (Backend) · React + Vite + Tailwind (Frontend)
**Basis:** Wawancara narasumber (koordinator TTQ) + spesifikasi awal "Muhsin App SMP IT Al Fitrah"

---

## 1. Ringkasan & Latar Belakang

### 1.1 Konteks Domain
Berdasarkan hasil wawancara dengan narasumber:

- Setiap sekolah IT (Islam Terpadu) — yang secara historis berafiliasi dengan jaringan **JSIT (Jaringan Sekolah Islam Terpadu)** — **pasti memiliki program TTQ** (Tahfidz, Tahsin, Al-Qur'an/Hadist) di setiap jenjang (SD/SMP/SMA).
- TTQ berstatus **setara dengan mata pelajaran (mapel) umum** dalam kurikulum sekolah, namun dikelola oleh **Koordinator TTQ** yang beririsan dengan bagian kurikulum.
- **JSIT hanya menyediakan panduan/goals dasar.** Program, kategori penilaian, dan bobot nilai TTQ **bisa berbeda-beda antar sekolah**, menyesuaikan kebijakan dan kondisi masing-masing sekolah.
- Sistem penilaian saat ini masih **kebijakan internal sekolah** — belum ada standar baku lintas sekolah.

> **Implikasi produk:** Karena TTQ tidak seragam antar sekolah/jenjang, produk **tidak boleh** dibangun dengan kategori penilaian yang di-hardcode secara permanen. Produk harus dirancang sebagai **platform multi-tenant** dengan kategori & sub-kategori penilaian (mis. Tahfidz > Ziyadah/Muroja'ah, Tahsin > Sabiq/Talaqi, atau struktur lain) yang **dapat dikonfigurasi per sekolah** (dan per tahun ajaran), agar bisa digunakan oleh banyak sekolah IT dengan kebutuhan jenjang & kurikulum yang berbeda-beda.

### 1.2 Problem Statement
Sekolah IT saat ini umumnya mencatat setoran hafalan, tahsin, hadist, dan ibadah harian siswa secara manual dan semi digital (buku/Excel/Spreadhseet/WhatsApp), sehingga:
- Guru kesulitan (butuh effort) merekap nilai bulanan dan menyusun laporan ke orang tua.
- Orang tua tidak punya visibilitas real-time atas progres ibadah & hafalan anak.
- Resiko penggunaan buku bisa hilang atau rusak/robek dan lainnya.
- Tidak ada insentif/motivasi terstruktur bagi siswa untuk konsisten (istiqomah).
- Tiap sekolah "reinvent the wheel" membangun sistem sendiri-sendiri.

### 1.3 Nama & Positioning Produk
- **Nama kerja:** Muhsin App
- **Positioning:** SaaS manajemen & monitoring program TTQ + ibadah yaumiyah siswa, dengan gamifikasi ringan sebagai pendorong motivasi (level, EXP, streak).
- **Target jangka pendek**: Membantu permasalahan administratif dalam program TTQ di SMP IT AL Fitrah
- **Target jangka panjang:** Sekolah-sekolah IT di berbagai jenjang (SD/SMP/SMA) yang terafiliasi JSIT maupun independen.
- **Pilot customer:** SMP IT Al Fitrah (jenjang SMP, 2 kategori: Tahfidz [sub-kategori: Ziyadah, Muroja'ah], Tahsin [sub-kategori: Sabiq, Talaqi]).

---

## 2. Keputusan Arsitektur Kunci (Decision Log)

| #   | Keputusan                                  | Pilihan                                                                                          | Alasan                                                                                                         |
| --- | ------------------------------------------ | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| D1  | Arsitektur data                            | **Multi-tenant sejak awal** (`school_id` di seluruh tabel operasional)                           | Rencana komersialisasi ke banyak sekolah IT — retrofit multi-tenant di kemudian hari jauh lebih mahal.         |
| D2  | Manajemen akun                             | **Admin sekolah input manual/bulk** semua akun (siswa, guru, orang tua)                          | Cocok untuk konteks sekolah formal Indonesia; hindari kompleksitas self-register/verifikasi di MVP.            |
| D3  | Fleksibilitas jenjang & kategori penilaian | **Skema dirancang dinamis** (kategori penilaian & skala nilai adalah data, bukan kolom hardcode) | Tiap sekolah/jenjang punya kategori & bobot berbeda (sesuai temuan wawancara: JSIT hanya kasih pedoman dasar). |
| D4  | Model gamifikasi EXP                       | **Semua aktivitas (yaumiyah + setoran) + bonus streak konsistensi**                              | Mendorong kombinasi ibadah harian & prestasi hafalan, sekaligus reward untuk konsistensi harian.               |
| D5  | Export PDF Laporan                         | **Browser Print API (`window.print()`) untuk MVP**                                               | Pendekatan tercepat tanpa dependensi tambahan; ekspor PDF server-side dengan Playwright/Puppeteer di v1.2.    |
| D6  | Pusat Notifikasi (App Shell)               | **In-App Notification Hub dengan mock data per role di MVP**                                    | Memberikan visibilitas langsung dari AppHeader & ReminderBanner; integrasi WA/email tetap di v1.2.             |

Keenam keputusan ini adalah **fondasi** yang memengaruhi seluruh desain data model & fitur aplikasi.

---

## 3. Persona & Role Pengguna

| Role                                             | Level Akses          | Deskripsi                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------ | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Super Admin** *(internal, bukan user sekolah)* | Platform             | Mengelola onboarding sekolah baru (provisioning tenant). Tidak dibangun sebagai UI penuh di MVP — cukup seed/CLI.                                                                                                                                                                                                                                  |
| **Koordinator TTQ**                              | School-scoped        | Mengelola data master: kelas, siswa, guru, orang tua, mapping bimbingan, periode akademik, batch close. Role turunan dari temuan wawancara — mengelola **kategori & sub-kategori penilaian TTQ & skala konversi nilai** milik sekolahnya (mis. Tahfidz/Tahsin, atau struktur lain sesuai kebijakan sekolah), termasuk restrukturisasi di pergantian tahun ajaran (lihat #4.1), memantau seluruh kelas (lintas guru pembimbing). **Baru:** meninjau & meng-approve pengajuan Munaqosah dari guru, meng-assign guru penguji + jadwal (lihat #4.3c). |
| **Guru/Pembimbing (Teacher)**                    | Class/student-scoped | Mencatat & menilai setoran siswa bimbingannya, mengisi evaluasi akhir bulan, mengakses laporan bulanan siswa bimbingannya, menetapkan target hafalan bulanan (lihat #4.3b). **Baru:** dapat mengajukan siswa bimbingannya untuk Munaqosah; guru mana pun *bisa* ditugaskan sebagai **penguji Munaqosah** oleh Koordinator TTQ untuk periode tertentu (bukan role akun terpisah — cukup penugasan per-periode, lihat #4.3c). |
| **Siswa (Student)**                              | Self-scoped          | Mencatat aktivitas harian ibadah (tilawah, sholat fardhu/sunnah, puasa sunnah), melihat progres EXP/level/streak miliknya.                                                                                                                                                                                                                         |
| **Orang Tua/Wali (Parent)**                      | Child-scoped         | Melihat laporan bulanan anak dalam format naratif rapi + progres gamifikasi anak.                                                                                                                                                                                                                                                                  |

> **Catatan desain RBAC:** Setiap query di backend **wajib** difilter oleh `school_id` DAN scope role (mis. guru hanya bisa akses siswa yang di-mapping ke dirinya). Ini adalah aturan keamanan non-negotiable di sistem multi-tenant.

---

## 4. Fitur & Functional Requirements

### 4.1 Konfigurasi Sekolah & Kategori Penilaian *(Baru — hasil generalisasi multi-tenant)*

Sebelum sekolah bisa mulai memakai sistem, Admin/Koordinator TTQ mengonfigurasi:

| Konfigurasi | Deskripsi |
|---|---|
| **Profil Sekolah** | Nama, jenjang (SD/SMP/SMA/MA), tahun ajaran aktif. |
| **Kategori & Sub-kategori Penilaian** | Struktur **2 level**: Kategori (mis. Tahfidz, Tahsin) → Sub-kategori (mis. Ziyadah, Muroja'ah di bawah Tahfidz; Sabiq, Talaqi di bawah Tahsin). Field penilaian (mis. Tajwid, Kelancaran, Makhroj, Ghunnah, Mad) ada di level sub-kategori, bisa beda-beda tiap sub-kategori. Bisa ditambah/diedit/dinonaktifkan — lihat aturan penguncian di bawah. |
| **Skala Konversi Nilai** | Rentang angka → huruf → kategori mutu (Latin/Arab), per sub-kategori penilaian. Sekolah bisa pakai default JSIT-style atau kustom. |
| **Aturan Poin Ibadah Fardhu** | Bobot nilai per kode indikator (MT/H/T/BT/MA/BA) — default mengikuti dokumen SMP IT Al Fitrah, bisa disesuaikan. |
| **Batas Waktu Input** | Tanggal aktivitas siswa hanya bisa diisi H-1/H (kemarin & hari ini), dan batas penguncian periode bulanan (mis. tanggal 5 bulan berikutnya). |

**Aturan Penguncian & Restrukturisasi** *(keputusan final, hasil diskusi)*:
- **Dalam 1 tahun ajaran berjalan:** menambah sub-kategori/field baru selalu boleh kapan saja. Menghapus atau mengubah field/sub-kategori yang **sudah pernah dipakai mencatat nilai** (minimal 1 data) **terkunci** — tidak bisa dihapus/diubah sampai tahun ajaran itu selesai. Yang selalu bebas diubah: label tampilan, ikon, urutan, status aktif/nonaktif (tanpa hapus data).
- **Di pergantian tahun ajaran baru:** Koordinator TTQ bisa merestrukturisasi total (kategori/sub-kategori/field boleh dihapus/diubah bebas) untuk periode baru — struktur tahun ajaran sebelumnya tetap dibekukan apa adanya supaya laporan histori tidak berubah tampilannya.
- Kenapa begini: kunci berbasis data menjaga konsistensi kriteria penilaian dalam 1 tahun ajaran (supaya nilai rata-rata antar bulan tetap sebanding), sementara restrukturisasi per tahun ajaran mencegah sekolah terkunci selamanya ke keputusan struktur di tahun pertama.

**Acceptance Criteria:**
- Admin/Koordinator TTQ dapat membuat, mengedit, dan menonaktifkan kategori/sub-kategori penilaian tanpa perlu perubahan kode (data-driven).
- Sistem menolak penghapusan/perubahan field atau sub-kategori yang sudah punya data tercatat, selama tahun ajaran masih berjalan.
- Di awal tahun ajaran baru, Koordinator TTQ dapat meng-copy struktur tahun ajaran sebelumnya sebagai starting point, lalu bebas mengubahnya sebelum ada data baru tercatat.
- Sekolah baru yang di-onboard dapat langsung memakai template kategori default SMP IT Al Fitrah sebagai starting point, lalu menyesuaikan.

---

### 4.2 Student Input — Form Harian Ibadah (Yaumiyah)

Satu form per **tanggal aktivitas**, dipilih lewat **kalender card** (bukan date picker konvensional) — strip horizontal berisi card tanggal (hari + angka), **hari ini** & **kemarin** aktif bisa diklik (hari ini terpilih sebagai default, ditandai lebih menonjol), tanggal lebih lama tampil disabled/abu-abu. Tiap card tanggal aktif punya indikator titik status: kosong (belum ada data), kuning/oranye (draft tersimpan), hijau (sudah terkirim).

**Status Pengisian — Draft vs Terkirim** *(update dari desain awal, hasil diskusi UX)*: Sholat berlangsung sepanjang hari (Subuh pagi s/d Isya malam), jadi siswa perlu bisa mengisi bertahap tanpa takut "kekunci" duluan. Form ini punya 2 aksi berbeda:

| Aksi | Status hasil | Efek |
|---|---|---|
| **Simpan** | `draft` | Data tersimpan, **bisa diedit berkali-kali** selama hari itu masih dalam window (hari ini/kemarin) dan belum di-Kirim. TIDAK memicu perhitungan EXP/streak, TIDAK masuk ke agregat laporan guru. |
| **Kirim** | `submitted` | Data **terkunci, tidak bisa diedit lagi**. Memicu perhitungan EXP & evaluasi streak (lengkap/tidak — lihat #4.5), dan baru masuk ke data agregat laporan guru. |

**Auto-Finalize** *(keputusan final)*: Jika siswa mengisi/menyimpan draft tapi lupa menekan "Kirim" sampai window edit tanggal tsb tertutup (tanggal itu tidak lagi hari ini/kemarin), sistem **otomatis men-submit draft apa adanya** ("auto-finalize") begitu window tertutup — data tidak hilang, tapi tetap dievaluasi sesuai kondisi aslinya (kalau draft-nya tidak lengkap, tetap dianggap tidak lengkap untuk keperluan streak — sama seperti submit manual yang tidak lengkap, lihat #4.5).

| Field                                  | Tipe                                  | Keterangan                                                                                           |
| --------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Tilawah                                | Surah + range ayat, atau kosong (`-`) | Bisa lintas surah.                                                                                   |
| Sholat Subuh/Dzuhur/Ashar/Maghrib/Isya | Enum: `MT / H / T / BT / MA / BA`     | Lihat tabel bobot poin [[#4.6 Business Logic — Aturan Bisnis]].                                      |
| Sholat Rawatib                         | Multi-select                          | Sebelum/Setelah Subuh, Dzuhur, Ashar, Maghrib, Isya (sesuai daftar rawatib yang valid secara fiqih). |
| Sholat Tahajud                         | Boolean                               | Ya/Tidak                                                                                             |
| Sholat Dhuha                           | Boolean                               | Ya/Tidak                                                                                             |
| Puasa Sunnah                           | Dropdown                              | Senin, Kamis, Daud, Ayamul Bidh, atau kosong                                                         |

**Acceptance Criteria:**
- Siswa dapat memilih tanggal lewat kalender card; hanya hari ini & kemarin yang aktif, sesuai window yang diizinkan (belum di-lock batch close).
- "Simpan" bisa dipanggil berkali-kali tanpa mengunci data, tidak memicu EXP/streak.
- "Kirim" mengunci data (read-only setelahnya) dan memicu perhitungan EXP ([[#4.7 User Flow]]) serta update streak.
- Draft yang tidak di-Kirim manual otomatis di-finalize sistem begitu window tanggal tsb tertutup, dengan hasil evaluasi (lengkap/tidak) mengikuti kondisi data aslinya.

---

### 4.3 Teacher Input — Setoran & Penilaian (Generik per Sub-kategori)

Guru mengisi form setoran **per siswa bimbingan, per sub-kategori aktif di sekolahnya** (Ziyadah, Muroja'ah, Sabiq, Talaqi, atau sub-kategori lain sesuai konfigurasi #4.1).

| Field                 | Tipe                     | Keterangan                                                                                       |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------------------ |
| Siswa                 | Dropdown (searchable)    | Hanya siswa yang di-mapping ke guru tsb.                                                         |
| Kategori              | Dropdown                 | Kategori aktif di sekolah (mis. Tahfidz, Tahsin) — pilih dulu, baru sub-kategori muncul.          |
| Sub-kategori          | Dropdown                 | Sub-kategori di bawah kategori terpilih (mis. Ziyadah/Muroja'ah untuk Tahfidz).                   |
| Tanggal               | Date Picker              | Default hari ini.                                                                                |
| Referensi Awal/Akhir  | Dinamis sesuai sub-kategori | Ziyadah/Muroja'ah: Surah+Ayat. Sabiq/Talaqi: Halaman.                            |
| Nilai (field dinamis) | Number (0–100) per field | Ziyadah: **Tajwid (Per Surah), Kelancaran (Per Surah), Tajwid (Keseluruhan), Kelancaran (Keseluruhan)** — lihat #4.3b. Muroja'ah: Tajwid, Kelancaran. Sabiq: Mad, Makhroj, Ghunnah, Kelancaran. Talaqi: Kelancaran. |
| Keterangan            | Dropdown/opsional        | Sakit, Izin, Alpha, Hadir tidak setor, atau alasan lain.                                         |

**Evaluasi Akhir Bulan** — per sub-kategori, per siswa: catatan naratif dari guru.

**Acceptance Criteria:**
- Guru hanya bisa memilih siswa bimbingannya sendiri.
- Field penilaian yang muncul menyesuaikan konfigurasi kategori sekolah (tidak hardcode di frontend).
- Setiap setoran dengan nilai valid memicu perhitungan EXP.

---

### 4.3b Target Bulanan Hafalan (Ziyadah)

Ziyadah bersifat **berurutan** (siswa menghafal surah demi surah sesuai urutan mushaf, tidak lompat-lompat). Setiap bulan, guru pembimbing menetapkan **target hafalan** untuk tiap siswa bimbingannya — terpisah dari catatan evaluasi naratif bulanan yang sudah ada.

| Field | Tipe | Keterangan |
|---|---|---|
| Siswa | Dropdown | Siswa bimbingan guru tsb. |
| Bulan | Otomatis (bulan berjalan) | 1 target aktif per siswa per bulan. |
| Target Surah/Ayat Awal | Surah + Ayat | Titik mulai target bulan ini (biasanya kelanjutan dari capaian bulan lalu). |
| Target Surah/Ayat Akhir | Surah + Ayat | Titik akhir target yang diharapkan tercapai akhir bulan. |
| Catatan | Teks opsional | Mis. alasan target diperlambat/dipercepat. |

**Acceptance Criteria:**
- Guru dapat menetapkan/mengubah target bulanan untuk tiap siswa bimbingannya.
- Target bulan berjalan ditampilkan di laporan guru & (opsional) dashboard siswa/orang tua sebagai pembanding terhadap capaian aktual — bukan bagian dari nilai/EXP, murni referensi perencanaan.
- Target TIDAK mengunci/membatasi input setoran aktual — siswa yang melebihi atau belum mencapai target tetap bisa input seperti biasa; target murni alat bantu perencanaan guru, bukan validasi.

---

### 4.3c Munaqosah (Ujian Kenaikan Juz) *(Baru — masuk MVP)*

Munaqosah adalah **ujian formal** bagi siswa yang hafalannya (Ziyadah, akumulatif) sudah mencapai 1 juz penuh — beda dari setoran harian biasa: ini kejadian terjadwal, butuh approval Koordinator TTQ, dan menghasilkan pencapaian resmi (lihat #4.5).

**Jadwal:** 4 kali per tahun ajaran (September, November, Maret, Mei — 2 kali per semester), dikonfigurasi Koordinator TTQ sebagai `munaqosah_periods` per sekolah (tidak hardcode ke bulan-bulan ini, sekolah lain bisa beda jadwal).

**Alur kerja (4 tahap):**

| Tahap | Pelaku | Aksi |
|---|---|---|
| 1. Deteksi Kelayakan | Sistem | Menghitung akumulasi Ziyadah tiap siswa (dari histori `setoran_entries`) dibandingkan batas juz (referensi statis 30 juz Al-Qur'an). Siswa yang sudah menyelesaikan 1 juz penuh (dan belum pernah munaqosah untuk juz tsb) muncul di daftar **"Siswa Possible Munaqosah"** milik guru pembimbingnya. |
| 2. Pengajuan | Guru Pembimbing | Guru meninjau daftar tsb, memilih siswa yang dianggap sudah siap (sistem cuma menyarankan berdasar hitungan ayat, keputusan kesiapan tetap di guru), lalu **mengajukan** munaqosah untuk siswa tsb + juz yang diuji. |
| 3. Approval & Penjadwalan | Koordinator TTQ | Meninjau pengajuan → **setuju/tolak**. Jika setuju: assign ke periode munaqosah aktif + pilih **guru penguji** dari pool guru yang sudah ditugaskan Koordinator sebagai penguji periode tsb (kapasitas siswa per penguji diatur Koordinator, menyesuaikan beban), + tentukan tanggal/waktu ujian. |
| 4. Pelaksanaan & Hasil | Guru Penguji (yang ditugaskan) | Menginput hasil ujian: skor **Tajwid** & **Kelancaran** (0-100, sama seperti dimensi penilaian setoran lain), catatan penguji, dan keputusan **Lulus / Tidak Lulus** (keputusan lulus/tidak ada di tangan penguji, tidak otomatis dari skor — skor jadi pertimbangan, bukan threshold otomatis). |

**Penugasan Penguji** *(Koordinator TTQ)*: Koordinator menentukan pool guru yang boleh jadi penguji untuk 1 periode munaqosah tertentu (guru mana pun bisa ditugaskan, tidak harus guru pembimbing siswa tsb — justru sebaiknya beda, supaya penilaian lebih objektif), beserta kapasitas maksimal siswa yang bisa diuji tiap penguji di periode itu. Penugasan siswa-ke-penguji dilakukan manual oleh Koordinator (bukan auto-balancing sistem) — sederhana dulu, sesuai prinsip MVP.

**Status Pengajuan:** `diajukan` → `disetujui` → `dijadwalkan` → `lulus` / `tidak_lulus`, atau `ditolak` (oleh Koordinator di tahap approval).

**Acceptance Criteria:**
- Sistem menampilkan daftar siswa yang layak diajukan munaqosah ke guru pembimbing masing-masing, berdasar akumulasi Ziyadah tervalidasi (bukan draft).
- Guru hanya bisa mengajukan siswa bimbingannya sendiri; Koordinator bisa melihat & memproses semua pengajuan di sekolahnya.
- Guru penguji hanya bisa menginput hasil untuk siswa yang di-assign ke dirinya oleh Koordinator, tidak bisa akses pengajuan lain.
- Siswa yang lulus munaqosah 1 juz otomatis mendapat achievement sesuai juz yang diuji (lihat #4.5) — tidak perlu aksi manual tambahan.
- Siswa yang tidak lulus tetap bisa diajukan ulang munaqosah untuk juz yang sama di periode berikutnya.

---

### 4.4 Laporan Bulanan — Guru & Orang Tua

**Untuk Guru** (format tabel/dashboard):
- Ringkasan setoran per kategori: range referensi + nilai akumulasi (angka, huruf, kategori mutu).
- Akumulasi ibadah yaumiyah (jumlah tilawah, rincian sholat fardhu per waktu, rawatib, tahajud, dhuha, puasa sunnah).
- Akumulasi kehadiran setoran (Hadir / Tidak Setoran / Alpha / Izin / Sakit) per kategori.
- Ranking bulanan (berdasarkan sub-kategori yang ditandai `include_in_ranking`, default Ziyadah).

**Untuk Siswa & Orang Tua** (format template, non-tabel):
- Header identitas (nama, kelas, guru pembimbing).
- Ringkasan hasil nilai per kategori dengan parameter penilaian nya
- Ringkasan ibadah yaumiyah.
- Kehadiran setoran.
- Evaluasi naratif guru per kategori.
- **Progres Gamifikasi** (level, EXP, streak bulan berjalan, progres gamifikasi hanya pada dashboard bukan report).

**Acceptance Criteria:**
- Laporan dapat diekspor ke PDF dengan layout cetak rapi.
- Rendering laporan bulanan < 2 detik (agregasi server-side, bukan hitung ulang di client).

---

### 4.5 Gamifikasi (MVP — Sederhana)

Sesuai arahan: **mulai dari yang sederhana** — Level, EXP/Point, dan Streak.

| Komponen         | Deskripsi MVP                                                                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **EXP**          | Didapat dari SEMUA aktivitas tervalidasi: input ibadah yaumiyah harian & setoran guru (lihat tabel poin [[#4.6 Business Logic — Aturan Bisnis]]).                    |
| **Level**        | Dihitung dari akumulasi total EXP menggunakan kurva sederhana: `EXP dibutuhkan untuk naik ke level N = 100 × N` (kumulatif). Level tidak pernah turun.               |
| **Streak**       | Hitung hari berturut-turut yang statusnya `submitted` (baik lewat "Kirim" manual maupun auto-finalize, lihat #4.2) **dan** datanya lengkap (seluruh field wajib terisi). Draft yang belum `submitted` tidak dihitung. Terputus jika ada hari kosong atau hasil `submitted`-nya tidak lengkap.                                  |
| **Bonus Streak** | Milestone: 7 hari (+50 EXP), 14 hari (+100 EXP), 30 hari (+250 EXP) — nilai dapat dikonfigurasi per sekolah di v1.1. Di MVP boleh hardcode default ini.              |
| **Tampilan**     | Progress bar EXP menuju level berikutnya + badge streak di dashboard siswa. Leaderboard sederhana per kelas (opsional, bisa di-toggle sekolah — lihat #8 milestone; per keputusan bisnis di `PROPOSAL.md`, fitur ini jadi diferensiator Paket Medium ke atas, bukan tersedia default di semua tier). |
| **Achievement Munaqosah** *(baru, masuk MVP)* | 1 tipe achievement diparameterisasi (`munaqosah_juz`, field `juz_ke` 1-30) — BUKAN 30 definisi badge terpisah, tetap 1 template visual + logic, cuma beda angka. Diberikan otomatis saat hasil Munaqosah = Lulus (lihat #4.3c). Muncul di modal pencapaian yang sama dengan Level Up (lihat `UI_DESIGN_PROMPT.md` #2.9) — tidak perlu komponen UI baru. |

> Formula & bobot poin adalah **starting point**, bukan aturan baku — disimpan sebagai konfigurasi agar bisa di-tuning tanpa deploy ulang code (lihat `gamification_config` di `docs/PROJECT.md`).

---

### 4.6 Business Logic — Aturan Bisnis

**Bobot Poin Sholat Fardhu (default, dapat dikonfigurasi per sekolah):**

| Kode | Arti | Bobot Nilai Ibadah | Bobot EXP (default) |
|---|---|---|---|
| BA | Berjamaah, di awal waktu | 5 | +5 |
| MA | Munfarid, di awal waktu | 4 | +4 |
| BT | Berjamaah, tidak di awal waktu | 3 | +3 |
| MT | Munfarid, tidak di awal waktu | 2 | +2 |
| H | Haid (khusus akhwat) | 5 | +5 (tidak mengurangi streak) |
| T | Tidak sholat | 0 | 0, dan **−100 poin nilai ibadah** (bukan EXP) untuk laporan kualitatif |
**Nilai akumulasi sholat fardhu**

| Rentang Angka (Jumlah dilakukan)                               | Huruf |
| -------------------------------------------------------------- | ----- |
| 140 – 150                                                      | A     |
| 120 – 139                                                      | B     |
| 80 – 119                                                       | C     |
| -100 – 79 (-100 jika ada 1 yang T dari indikator nilai sholat) | D     |
**Nilai akumulasi sholat sunnah rawatib**

| Rentang Angka (Jumlah dilakukan) | Huruf |
| -------------------------------- | ----- |
| 121 – 150                        | A     |
| 100 – 120                        | B     |
| 70 – 99                          | C     |
| 0 – 69                           | D     |
**Nilai akumulasi Tahajud/Dhuha/Tilawah**

| Rentang Angka (Jumlah dilakukan) | Huruf |
| -------------------------------- | ----- |
| 20 – 31                          | A     |
| 10 – 19                          | B     |
| 1 – 9                            | C     |
| 0 – 0.99                         | D     |
**Nilai akumulasi shoum/puasa sunnah**

| Rentang Angka (Jumlah dilakukan) | Huruf |
| -------------------------------- | ----- |
| 5 – 8                            | A     |
| 3 – 4                            | B     |
| 1 – 2                            | C     |
| 0 – 0.99                         | D     |

**Perhitungan Nilai Akumulasi Setoran** (generik, berlaku untuk semua kategori):
```
nilai_akumulasi_kategori = rata-rata( rata-rata(field_penilaian) ) dari seluruh setoran kategori tsb di bulan berjalan
```
Contoh Ziyadah/Muroja'ah: rata-rata dari `(nilai_tajwid + nilai_kelancaran) / 2` seluruh setoran bulan tsb.

**Konversi Nilai → Huruf → Kategori Mutu** (default, per-sekolah bisa override):

| Rentang | Huruf | Kategori (Latin/Arab) |
|---|---|---|
| 91–100 | A | Mumtaz / ممتاز |
| 80–90 | B | Jayyid Jiddan / جيد جدا |
| 70–79 | C | Jayyid / جيد |
| 51–69 | D | Maqbul / مقبول |
| 31–50 | E | Dhaif / ضعيف |
| 0–30 | F | Dhaif Jiddan / ضعيف جدا |

**Kehadiran Setoran:**
- **Hadir**: ada data nilai valid (>0) tanpa keterangan negatif.
- **Tidak Setoran**: hadir tapi nilai kosong/0 tanpa keterangan sakit/izin.
- **Izin/Sakit**: sesuai keterangan yang diisi guru.
- **Alpha**: tidak ada data setoran sama sekali di hari terjadwal.

**Ranking Bulanan:** diambil dari sub-kategori yang ditandai `include_in_ranking = true` (default: Ziyadah), descending; tie-break alfabetis nama. ⚠️ Catatan MVP: ranking dihitung per sub-kategori (bukan gabungan seluruh Tahfidz), karena rollup nilai antar sub-kategori (mis. gabungan Ziyadah+Muroja'ah jadi 1 skor Tahfidz) belum didefinisikan bobotnya — perlu dikonfirmasi ke Koordinator TTQ kalau nanti dibutuhkan ranking gabungan per kategori, bukan per sub-kategori.

---

### 4.7 User Flow

**Siswa — Input Harian:**
```
Login → Dashboard Siswa (lihat EXP/Level/Streak) → "Input Harian"
→ Pilih Tanggal → Isi form ibadah → Submit
→ Toast "EXP +X, Streak hari ke-Y" → Konfirmasi sukses
```

**Guru — Input Setoran:**
```
Login → Dashboard Guru → Pilih Siswa Bimbingan → Pilih Kategori
→ Isi form setoran → Submit
→ (Akhir bulan: Isi evaluasi per kategori → Submit)
```

**Guru — Laporan:**
```
Login → Dashboard Guru → "Laporan Bulanan" → Pilih Bulan & Siswa
→ Lihat / Cetak / Download PDF
```

**Orang Tua — Laporan:**
```
Login → Dashboard Orang Tua (progres gamifikasi anak tampil live di sini) → Nama Anak otomatis tampil
→ Pilih Tahun Ajaran → Semester → Bulan → Lihat Laporan bulanan (nilai & ibadah, TANPA progres gamifikasi)
→ (Opsional: Download PDF)
```

**Admin — Onboarding Sekolah (baru, multi-tenant):**
```
Super Admin provisioning tenant → Koordinator TTQ login pertama kali
→ Setup profil sekolah & jenjang → Pilih/edit kategori penilaian (dari template atau custom)
→ Import data master (kelas, siswa, guru, mapping) → Sistem siap dipakai
```

---

### 4.8 App Shell — Notifikasi & Pengaturan Akun *(Baru — MVP)*

Pengalaman pengguna yang utuh membutuhkan halaman app shell yang dapat diakses dari AppHeader, Dashboard, dan Profil:

1. **Pusat Notifikasi (`#/notifications`)**:
   - Dapat diakses via ikon lonceng pada `AppHeader` dan tombol "Ingatkan!" di `ParentDashboard`.
   - Menampilkan notifikasi kontekstual berdasarkan role (Pengingat Setoran, Ibadah Yaumiyah, Pengumuman Sekolah).
   - Mendukung filter status (Semua / Belum Dibaca) dan penandaan "Tandai semua dibaca".

2. **Pengaturan Akun & Informasi (`#/edit-profile`, `#/change-password`, `#/privacy`, `#/help`, `#/about`)**:
   - **Ubah Profile (`#/edit-profile`)**: Mengubah informasi profil (Nama, Email, No. Telepon, foto avatar).
   - **Ubah Password (`#/change-password`)**: Mengubah kata sandi dengan verifikasi password lama & konfirmasi password baru.
   - **Kebijakan Privasi (`#/privacy`)**: Informasi perlindungan data siswa, keluarga, dan standar keamanan sekolah IT.
   - **Bantuan & Panduan (`#/help`)**: FAQ dan petunjuk penggunaan aplikasi (disesuaikan per role, misal "Bantuan & Panduan Guru").
   - **Tentang Muhsin (`#/about`)**: Informasi versi aplikasi (v1.0.0), pengembang, dan visi platform Muhsin App.

**Acceptance Criteria:**
- Seluruh menu pada halaman Profil (Student, Parent, Teacher) dapat diklik dan mengarah ke rute yang sesuai.
- Ikon lonceng di AppHeader dan tombol pengingat di dashboard dapat diklik dan membuka halaman pusat notifikasi.
- Tombol "UNDUH RAPORT" di seluruh halaman raport memicu dialog cetak browser (`window.print()`).

---

## 5. Non-Functional Requirements

| Aspek | Requirement |
|---|---|
| **Multi-tenancy & Isolasi Data** | Setiap request wajib divalidasi terhadap `school_id` milik user yang login. Tidak boleh ada kebocoran data lintas sekolah — ini prioritas keamanan tertinggi. |
| **Keamanan** | Autentikasi JWT + refresh token, RBAC per role & scope (school/class/student). Password di-hash (argon2/bcrypt). |
| **Responsivitas** | Mobile-first — mayoritas siswa/orang tua akan akses dari smartphone. |
| **Performa** | Laporan bulanan render < 2 detik; agregasi dilakukan server-side/materialized, bukan real-time compute berat di request path. |
| **Ekspor** | Laporan bulanan dapat diekspor ke PDF dengan layout cetak rapi. |
| **Validasi** | Tanggal aktivitas tidak boleh di masa depan; validasi field wajib sesuai konteks kategori. |
| **Batch Close** | Admin dapat mengunci periode bulanan setelah batas waktu input; data yang sudah dikunci read-only. |
| **Skalabilitas Onboarding** | Menambah sekolah baru (tenant) tidak boleh butuh deploy/perubahan kode — cukup provisioning data (school + kategori + user). |

---

## 6. Milestone & Prioritas

| Fase | Deliverable | Prioritas |
|---|---|---|
| **MVP (v1.0)** | Multi-tenant foundation (school_id di semua tabel), Auth + RBAC, Konfigurasi kategori penilaian (dinamis), Student input harian, Teacher input setoran (kategori dinamis), Target bulanan hafalan (#4.3b), **Munaqosah — alur pengajuan/approval/penjadwalan/hasil (#4.3c)**, Laporan bulanan (tabel, guru), Ranking, **Gamifikasi dasar (EXP + Level + Streak) + Achievement Munaqosah (1-30 juz)** | P0 — Harus |
| **v1.1** | Laporan naratif Student & Parent, Evaluasi akhir bulan guru, Konfigurasi bobot EXP per sekolah, Leaderboard kelas | P1 — Penting |
| **v1.2** | Dashboard statistik, ekspor PDF, notifikasi (WA/email), Koordinator TTQ dashboard lintas kelas | P2 — Nice-to-have |
| **v1.3** | Grafik progres bulanan, badge/achievement lain di luar Munaqosah (mis. streak jangka panjang, konsistensi semester), template kategori multi-jenjang (SD/SMA), self-onboarding sekolah baru | P3 — Enhancement / Growth |

> **Catatan:** Gamifikasi dasar dinaikkan ke MVP (bukan v1.3 seperti draft awal) sesuai arahan eksplisit user bahwa gamifikasi adalah bagian inti dari value proposition produk sejak awal — namun tetap dijaga **sederhana** (EXP + Level + Streak, tanpa badge/achievement kompleks di MVP) **kecuali Achievement Munaqosah**, yang dinaikkan ke MVP berdasarkan info terbaru dari Koordinator TTQ bahwa ini adalah proses institusional nyata yang berjalan di sekolah (bukan fitur gamifikasi murni tempelan) — lihat #4.3c. Ini memperluas scope MVP secara signifikan dibanding rencana awal; **timeline di `PROPOSAL.md` perlu direvisi** untuk mengakomodasi ini (lihat catatan di dokumen tsb).

---

## 7. Acceptance Criteria (Ringkasan MVP)

1. Sistem dapat menangani lebih dari satu sekolah (tenant) tanpa kebocoran data antar sekolah.
2. Admin/Koordinator TTQ dapat mengonfigurasi kategori penilaian & skala nilai tanpa bantuan developer.
3. Siswa dapat login dan mengisi form harian; submit valid memicu perhitungan EXP & streak secara otomatis.
4. Guru dapat memilih siswa bimbingan, mengisi setoran sesuai kategori aktif, dan menambahkan keterangan jika tidak setoran.
5. Guru dapat melihat laporan bulanan dengan akumulasi nilai, konversi huruf, dan kategori mutu.
6. Ranking bulanan tersaji berdasarkan kategori yang dikonfigurasi sebagai basis ranking.
7. Siswa/Orang tua dapat melihat progres level, EXP, dan streak di dashboard.
8. Sistem membatasi akses sesuai role & scope (RBAC).
9. Semua perhitungan akumulasi & EXP konsisten dengan formula yang dikonfigurasi.
10. Sistem dapat mendeteksi & menampilkan siswa yang layak diajukan Munaqosah ke guru pembimbingnya, dan alur pengajuan → approval → penjadwalan → hasil berjalan sesuai #4.3c.
11. Siswa yang lulus Munaqosah mendapat Achievement juz sesuai otomatis, tanpa aksi manual tambahan.

---

## 8. Out of Scope (MVP)

- Self-registration untuk orang tua/siswa (akun dibuat admin secara manual/bulk).
- Payment/billing/subscription management untuk model SaaS (akan dirancang terpisah saat mulai onboarding sekolah kedua).
- Achievement/badge system kompleks di luar Munaqosah (seasonal event, avatar customization) — Achievement Munaqosah (1-30 juz) SUDAH masuk MVP, lihat #4.3c & #4.5.
- Notifikasi push/WhatsApp otomatis (masuk v1.2).
- Mobile native app (cukup web responsive di MVP).
- Multi-bahasa (Arab hanya untuk label kategori mutu, bukan i18n penuh).

---

## 9. Asumsi & Pertanyaan Terbuka

| Area                               | Asumsi Sementara                                                                                | Perlu Divalidasi                                                                                               | Final                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Role Koordinator TTQ               | Diasumsikan sebagai role terpisah dari Admin & Guru, scope sekolah penuh                        | Perlu konfirmasi apakah di praktiknya Koordinator TTQ = guru senior yang juga mengajar, atau murni struktural. | Role terpisah dari admin dan guru, jika koor/admin juga mengajar maka buat akun untuk mengajar |
| Definisi "hari aktif" untuk streak | 1 hari dianggap valid streak jika minimal ada 1 field ibadah terisi (bukan harus lengkap semua) | Perlu keputusan bisnis: apakah streak butuh submit lengkap atau parsial cukup?                                 | streak butuh satu submit lengkap ibadah harian bukan 1 per satu                                |
| Referensi batas juz (Munaqosah)    | Pakai pembagian 30 juz standar (mushaf Utsmani) sebagai data referensi statis                   | Perlu dicek: apakah "1 juz selesai" untuk kelayakan Munaqosah harus 100% tepat batas juz, atau ada toleransi (mis. sudah 95% dianggap layak diajukan)? | Belum dikonfirmasi — asumsikan 100% dulu, guru tetap yang memutuskan kelayakan akhir (sistem cuma menyarankan) |
| Skor Munaqosah vs keputusan Lulus  | Skor Tajwid/Kelancaran dicatat tapi tidak otomatis menentukan Lulus/Tidak Lulus                 | Perlu dicek: apakah nanti perlu skor minimum sebagai syarat, atau tetap murni keputusan penguji?                | Belum dikonfirmasi — asumsikan keputusan penguji sepenuhnya dulu (sederhana), skor sebagai catatan pendukung |
| Kategori mutu default              | Menggunakan skala dari dokumen SMP IT Al Fitrah sebagai template global                         | Perlu dicek apakah ini benar-benar berasal dari standar JSIT atau kebijakan internal Al Fitrah saja.           | Kebijakan internal Al Fitrah, dengan base sementara dari skala SMP Al fitrah                   |
| Sholat Rawatib daftar valid        | 8 slot (Sebelum/Setelah × 5 waktu, minus yang tidak ada rawatib-nya) mengikuti dokumen asli     | Perlu review fiqih agar daftar checklist rawatib akurat.                                                       | mengikuti dokumen asli                                                                         |
| Ranking rollup per kategori vs sub-kategori | Ranking MVP dihitung per sub-kategori (default: Ziyadah), belum ada rollup gabungan ke level kategori (mis. skor gabungan Tahfidz dari Ziyadah+Muroja'ah) | Perlu konfirmasi ke Koordinator TTQ: apakah ranking cukup per sub-kategori, atau dibutuhkan skor gabungan per kategori (dan kalau iya, berapa bobot masing-masing sub-kategori)? | *(belum final)* |
| Status kategori Hadist | Sebelumnya Al-Qur'an/Hadist/Tahsin (3 kategori flat) | — | Hadist dihapus dari sistem penilaian; struktur final: Tahfidz (Ziyadah, Muroja'ah), Tahsin (Sabiq, Talaqi) |
