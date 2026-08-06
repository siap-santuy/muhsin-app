# PROJECT.md — Muhsin App

> Dokumen ini adalah **base knowledge** untuk AI coding agent yang bekerja di repo ini. Baca ini sebelum menyentuh kode apa pun. Untuk requirement produk lengkap, lihat `PRD.md`. Untuk persona & cara kerja agent, lihat `AGENT.md`.

---

## 1. Ringkasan Proyek

Muhsin App adalah aplikasi **multi-tenant SaaS** untuk manajemen program TTQ (Tahfidz, Tahsin) dan ibadah yaumiyah siswa sekolah Islam Terpadu, dengan lapisan gamifikasi sederhana (Level, EXP, Streak) untuk mendorong konsistensi siswa.

**Prinsip desain fundamental yang TIDAK BOLEH dilanggar:**
1. **Multi-tenant by default** — setiap tabel data operasional punya `school_id`. Setiap query HARUS di-scope ke `school_id` user yang login. Tidak ada exception.
2. **Kategori penilaian adalah data, bukan kode** — jangan hardcode "Tahfidz/Ziyadah/Muroja'ah/Tahsin/Sabiq/Talaqi" di logic backend/frontend. Semua kategori, sub-kategori, field penilaian, label, dan skala nilai berasal dari `assessment_categories`/`assessment_subcategories` per sekolah — dan **per tahun ajaran** (lihat #4.2 soal versioning per periode).
3. **Sederhana dulu untuk gamifikasi** — jangan over-engineer sistem EXP/Level/Streak di MVP. Tidak ada badge kompleks, tidak ada seasonal event, tidak ada avatar system.
4. **Clean Architecture di backend** — business logic (domain & application layer) HARUS bisa di-unit-test tanpa database, tanpa Hono, tanpa network. Dependency hanya boleh mengarah ke dalam (lihat #3.1). Ini bukan sekadar preferensi gaya — bagi proyek yang formula bisnisnya serumit ini (EXP, streak, konversi huruf, grading dinamis), business logic yang terjebak di dalam route handler akan sangat mahal untuk diuji & diubah nanti.

> **Catatan stack (update):** proyek ini sempat dipertimbangkan pindah ke Go+Gin, lalu diputuskan **kembali ke TypeScript (Bun+Hono+Drizzle)** untuk mengejar timeline pilot SMP IT Al Fitrah. Rencana migrasi ke Go didokumentasikan terpisah di `MIGRATION_TO_GO.md` sebagai catatan masa depan — tidak dieksekusi sekarang.

---

## 2. Tech Stack

| Layer | Teknologi | Catatan |
|---|---|---|
| Runtime & Backend Framework | **Bun** + **Hono** | Gunakan Hono middleware pattern untuk auth & tenant-scoping. |
| ORM | **Drizzle ORM** | Schema-first, migrations via `drizzle-kit`. |
| Database | PostgreSQL (rekomendasi) | Perlu dukungan JSONB untuk `score_fields`/`scores` yang dinamis. |
| Validasi | **Zod** | Skema validasi request, disinkronkan dengan Drizzle schema via `drizzle-zod`. |
| Auth | JWT (access + refresh token) | Signing/verifikasi pakai **`jose`** (pure JS, framework-agnostic) — dipakai di application layer (issue token) dan middleware/presentation (verify token). `hono/jwt` TIDAK dipakai karena Hono-specific (melanggar dependency rule application layer). Refresh token disimpan di **Redis** (TTL = expiry), TIDAK ada tabel `refresh_tokens` di PostgreSQL. |
| Frontend Framework | **React + Vite** | |
| Styling | **Tailwind CSS** | + `shadcn/ui` untuk komponen dasar (form, table, dialog) agar konsisten & cepat. |
| Data Fetching | **TanStack Query** | Untuk caching & sinkronisasi state server. |
| Form Handling | **React Hook Form + Zod resolver** | Konsisten dengan validasi backend. |
| State Ringan (client) | **Zustand** | Untuk state UI lokal (mis. wizard onboarding). |
| Chart/Progress | **Recharts** | Untuk grafik progres EXP/nilai bulanan. |
| PDF Export | `@react-pdf/renderer` atau server-side (Puppeteer/Playwright headless) | Evaluasi trade-off saat implementasi v1.2. |
| Testing | **Vitest** (unit) + **Playwright** (e2e, opsional) | |
| Package Manager | **Bun** (workspace monorepo) | |
| Session/Token Store | **Redis** + `ioredis` | Refresh token store (TTL-based = expiry time). Bukan tabel PostgreSQL. |

---

## 3. Arsitektur Backend — Clean Architecture per Modul

### 3.1 Aturan Dasar (Dependency Rule)

Setiap modul bisnis (`assessment-categories`, `daily-ibadah`, `setoran`, `gamification`, `reports`, `auth`, `schools`) dibagi jadi 4 lapisan. **Dependensi hanya boleh mengarah ke dalam** — lapisan luar boleh tahu & bergantung ke lapisan dalam, TIDAK sebaliknya:

```
presentation  →  application  →  domain
infrastructure ────────────────→  domain
```

| Lapisan | Isi | Boleh depend ke | TIDAK BOLEH depend ke |
|---|---|---|---|
| **domain** | Entities (bentuk data inti), repository interfaces (port), domain error, value object, business rule paling murni (mis. formula konversi huruf sebagai fungsi murni) | Tidak ada (zero dependency) | Drizzle, Hono, Zod-untuk-HTTP, apa pun yang framework-specific |
| **application** | Use-case (satu class/fungsi = satu aksi bisnis, mis. `SubmitDailyIbadahUseCase`, `CalculateExpUseCase`) — mengorkestrasi entity & repository interface dari domain | `domain` saja | Drizzle langsung, Hono, request/response HTTP |
| **infrastructure** | Implementasi konkret repository interface pakai Drizzle, integrasi service eksternal (mis. penyimpanan file PDF) | `domain` (untuk implement interface-nya) | `application`, `presentation` |
| **presentation** | Hono router, request validation (Zod), mapping HTTP request → input use-case, mapping output use-case → HTTP response | `application` (panggil use-case), `domain` (untuk tipe) | Drizzle langsung — TIDAK BOLEH query DB dari sini |

**Konsekuensi konkret paling penting:** file `routes.ts` di layer presentation **hanya** boleh berisi: parse request → validasi Zod → panggil 1 use-case → format response. Kalau kamu (atau AI agent) menemukan kalkulasi bisnis (mis. hitung EXP, hitung streak, hitung huruf grading) di dalam file routes, itu salah tempat — pindahkan ke `application/use-cases`.

### 3.2 Struktur Folder

```
muhsin-app/
├── apps/
│   ├── api/                          # Bun + Hono backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── assessment-categories/
│   │   │   │   │   ├── domain/
│   │   │   │   │   │   ├── entities/              # AssessmentCategory.ts — plain type/class, TANPA import Drizzle/Hono
│   │   │   │   │   │   ├── repositories/          # IAssessmentCategoryRepository.ts — interface (port), bukan implementasi
│   │   │   │   │   │   └── errors/                # CategoryNotFoundError.ts, InvalidScoreFieldError.ts, dst
│   │   │   │   │   ├── application/
│   │   │   │   │   │   ├── use-cases/              # CreateCategoryUseCase.ts, UpdateGradingScaleUseCase.ts
│   │   │   │   │   │   └── dto/                    # Input/Output shape use-case (Zod schema + type inferred)
│   │   │   │   │   ├── infrastructure/
│   │   │   │   │   │   └── DrizzleAssessmentCategoryRepository.ts   # implements IAssessmentCategoryRepository
│   │   │   │   │   └── presentation/
│   │   │   │   │       ├── routes.ts               # Hono router — tipis, cuma translate HTTP <-> use-case
│   │   │   │   │       └── validators.ts           # Zod schema request (reuse dari packages/shared kalau ada)
│   │   │   │   ├── daily-ibadah/                   # struktur identik: domain/application/infrastructure/presentation
│   │   │   │   ├── setoran/
│   │   │   │   ├── munaqosah/                      # target bulanan hafalan + alur pengajuan/approval/penjadwalan/hasil ujian
│   │   │   │   ├── gamification/                   # CalculateExpUseCase, UpdateStreakUseCase, CalculateLevelUseCase, AwardMunaqosahAchievementUseCase tinggal di sini
│   │   │   │   ├── reports/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── domain/
│   │   │   │   │   │   ├── entities/              # User.ts — plain type, TANPA import Drizzle/Hono
│   │   │   │   │   │   ├── repositories/          # IUserRepository.ts, ITokenRepository.ts (port, bukan implementasi)
│   │   │   │   │   │   └── errors/                # InvalidCredentialsError.ts, TokenExpiredError.ts, dst
│   │   │   │   │   ├── application/
│   │   │   │   │   │   ├── use-cases/              # LoginUseCase.ts, RefreshTokenUseCase.ts
│   │   │   │   │   │   └── dto/                    # Input/Output shape use-case (Zod schema + type inferred)
│   │   │   │   │   ├── infrastructure/
│   │   │   │   │   │   ├── DrizzleUserRepository.ts   # implements IUserRepository (Drizzle, filter school_id WAJIB)
│   │   │   │   │   │   └── RedisTokenRepository.ts     # implements ITokenRepository (ioredis, TTL-based)
│   │   │   │   │   └── presentation/
│   │   │   │   │       ├── routes.ts               # Hono router — tipis, cuma translate HTTP <-> use-case
│   │   │   │   │       └── validators.ts           # Zod schema request (reuse dari packages/shared kalau ada)
│   │   │   │   ├── schools/
│   │   │   ├── shared/
│   │   │   │   ├── domain/                         # konsep lintas-modul: TenantContext, BaseDomainError, value objects umum
│   │   │   │   └── kernel/                          # utilitas murni (date helpers, dsb) — tanpa dependency framework
│   │   │   ├── db/
│   │   │   │   ├── schema/                          # Drizzle schema, TERPUSAT (bukan per-modul) — dipakai HANYA oleh layer infrastructure
│   │   │   │   ├── migrations/
│   │   │   │   └── client.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   └── tenant-scope.middleware.ts       # WAJIB: inject & enforce school_id
│   │   │   ├── bootstrap/
│   │   │   │   └── container.ts                     # composition root: wiring repository → use-case → routes, manual DI (factory function biasa, TIDAK perlu framework DI/decorator)
│   │   │   └── index.ts                             # entrypoint Hono app, mount semua routes dari tiap modul
│   │   └── package.json
│   └── web/                           # React + Vite frontend (tetap feature-based, bukan Clean Architecture penuh — itu overkill untuk FE proyek ini)
│       ├── src/
│       │   ├── routes/
│       │   ├── components/
│       │   ├── features/              # per domain: daily-ibadah, setoran, reports, gamification
│       │   ├── lib/
│       │   └── main.tsx
│       └── package.json
├── packages/
│   └── shared/                        # Zod schema & type dipakai bareng FE/BE (khususnya DTO application layer & validators presentation layer)
├── PRD.md
├── PROJECT.md
└── AGENT.md
```

### 3.3 Kenapa Manual DI, Bukan Framework DI?

Proyek ini kecil-menengah (1 developer, MVP), jadi `bootstrap/container.ts` cukup berupa factory function biasa yang wiring dependency secara eksplisit saat startup — **bukan** library DI seperti InversifyJS/tsyringe. Contoh pola (bukan kode final, sekadar ilustrasi bentuknya):

```ts
// bootstrap/container.ts (ilustrasi pola, bukan kode final)
const categoryRepo = new DrizzleAssessmentCategoryRepository(db);
const createCategoryUseCase = new CreateCategoryUseCase(categoryRepo);
export const assessmentCategoriesRoutes = buildRoutes({ createCategoryUseCase, ...});
```

Ini menjaga dependency injection eksplisit & mudah di-trace, tanpa menambah kompleksitas library DI yang sebenarnya tidak dibutuhkan di skala proyek ini.

### 3.4 Implikasi ke Testing

- **Domain & application layer**: target coverage tinggi (idealnya mendekati 100% untuk use-case yang mengandung formula bisnis — EXP, streak, grading). Karena tidak depend ke Drizzle/Hono, test-nya murni in-memory, cepat, tidak butuh DB nyala.
- **Infrastructure layer**: test integrasi (butuh DB test/testcontainer), jumlahnya lebih sedikit — cukup pastikan implementasi repository sesuai kontrak interface-nya.
- **Presentation layer**: test tipis (mis. pakai `hono/testing`) — cukup pastikan routing, validasi, dan status code benar; TIDAK perlu re-test business logic di sini (itu sudah dites di application layer).

---

## 4. Skema Data (Ringkasan Konseptual)

> Ini adalah panduan konseptual. Skema Drizzle final harus mengikuti dokumen ini tapi disesuaikan saat implementasi (index, constraint, dsb).

### 4.1 Tenancy & Identitas

- **`schools`**: `id, name, jenjang (enum: SD/SMP/SMA/MA), npsn, address, active_academic_period_id, subscription_tier (enum: small/medium/large), created_at`

> **Catatan feature-gating (dari `PROPOSAL.md` #6.1):** `subscription_tier` dipakai untuk mengaktifkan/menonaktifkan fitur yang jadi diferensiator paket (mis. Leaderboard Kelas untuk Medium+, notifikasi WhatsApp & branding kustom laporan untuk Large). Implementasikan sebagai simple tier check di application layer (mis. helper `hasFeature(school, 'leaderboard')`), BUKAN duplikasi logic per fitur — satu tempat yang memetakan tier ke daftar fitur aktif, supaya gampang diubah kalau susunan paket berubah nanti.
- **`users`**: `id, school_id, role (enum: koordinator_ttq, teacher, parent, student — "admin" TIDAK ada sebagai role terpisah, digabung ke koordinator_ttq), name, email, password_hash, phone, created_at`

> **Catatan role (update dari PRD #3 & #9):** Role "Admin Sekolah" digabung ke **`koordinator_ttq`** — satu role ini mengelola data master (kelas, siswa, guru, orang tua, mapping, periode akademik, batch close) SEKALIGUS konfigurasi kategori penilaian TTQ. `super_admin` tetap ada tapi hanya level platform (provisioning tenant baru, tidak butuh UI penuh di MVP — cukup seed/CLI), bukan role per-sekolah. Jika seorang Koordinator TTQ juga mengajar, buatkan **akun terpisah** dengan role `teacher` untuknya — satu orang boleh punya lebih dari satu akun/role, jangan desain satu akun dengan multi-role sekaligus (lebih sederhana untuk RBAC & audit trail).
- **`classes`**: `id, school_id, name, jenjang_level, created_at`
- **`student_class_enrollment`**: `student_id, class_id, school_id, academic_period_id`
- **`student_teacher_mapping`**: `student_id, teacher_id, class_id, school_id`
- **`parent_student_mapping`**: `parent_id, student_id, school_id`
- **`academic_periods`**: `id, school_id, tahun_ajaran, semester, is_locked, locked_until`

### 4.2 Konfigurasi TTQ (dinamis per sekolah, 2 level — KUNCI fleksibilitas multi-jenjang)

Struktur penilaian TTQ sekarang **2 level**, bukan flat: **Kategori** (mis. Tahfidz, Tahsin) → **Sub-kategori** (mis. Ziyadah, Muroja'ah di bawah Tahfidz; Sabiq, Talaqi di bawah Tahsin). Field penilaian (`score_fields`), skala nilai (`grading_scale`), dan bentuk referensi (`reference_shape`) ada di level **sub-kategori**, bukan kategori — karena tiap sub-kategori bisa punya kriteria penilaian yang beda (mis. Sabiq dinilai 4 aspek: Mad, Makhroj, Ghunnah, Kelancaran; Talaqi cuma 1 aspek: Kelancaran).

Default seed (contoh, bukan hardcode — tetap harus bisa diedit/ditambah/dikurangi per sekolah):

| Kategori | Sub-kategori | Field Penilaian |
|---|---|---|
| Tahfidz | Ziyadah (hafalan baru) | Tajwid (Per Surah), Kelancaran (Per Surah), Tajwid (Keseluruhan), Kelancaran (Keseluruhan) |
| Tahfidz | Muroja'ah | Tajwid, Kelancaran |
| Tahsin | Sabiq | Mad, Makhroj, Ghunnah, Kelancaran |
| Tahsin | Talaqi | Kelancaran |

- **`assessment_categories`**: `id, school_id, academic_period_id (FK academic_periods), code, name, icon, is_active (bool), order, created_at`
- **`assessment_subcategories`**: `id, category_id (FK assessment_categories), school_id, code, name, score_fields (JSONB: [{key, label, min, max}]), reference_shape (JSONB: skema referensi awal/akhir, mis. {type:"surah_ayat"} atau {type:"halaman"}), grading_scale (JSONB: [{min,max,letter,label_latin,label_arab}]), include_in_ranking (bool), is_active (bool), order, created_at`
- **`ibadah_grading_scale`** *(baru)*: `id, school_id, aspect (enum: sholat_fardhu, sholat_rawatib, tahajud_dhuha_tilawah, puasa_sunnah), scale (JSONB: [{min, max, letter}]), penalty_rule (JSONB, khusus sholat_fardhu: {trigger: "any_T", penalty_points: -100})` — konfigurasi skala konversi huruf (A-D) untuk akumulasi ibadah yaumiyah per bulan, terpisah dari `grading_scale` milik `assessment_subcategories` (yang itu untuk nilai setoran guru). Default seed mengikuti tabel di PRD #4.6.

#### 4.2.1 Sistem Penguncian & Versioning per Tahun Ajaran *(keputusan final, hasil diskusi)*

Dua mekanisme berjalan bersamaan, BUKAN pilih salah satu:

1. **Kunci berbasis pemakaian data (dalam 1 tahun ajaran berjalan):**
   - **Menambah** sub-kategori baru atau field baru ke `score_fields` yang sudah ada → **selalu boleh**, kapan saja, tidak pernah terkunci (aditif, tidak merusak data lama).
   - **Menghapus atau mengubah** (rename key, ubah range min/max) sebuah field di `score_fields`, atau menghapus sebuah sub-kategori → **hanya boleh kalau BELUM PERNAH ada `setoran_entries.scores` yang mengisi field/sub-kategori tsb.** Begitu ada minimal 1 data yang pernah dicatat memakai field itu, field itu terkunci untuk dihapus/diubah SELAMA periode akademik berjalan (implementasi: usecase update wajib cek ke repository setoran apakah field key tsb pernah dipakai, sebelum mengizinkan penghapusan — lihat CODING_PROMPT.md Fase 2).
   - **Yang selalu bebas diubah tanpa syarat** (murni kosmetik, tidak menyentuh data): label tampilan (selama `key` tidak berubah), icon, urutan tampilan, `is_active` (nonaktifkan tanpa menghapus).
2. **Restrukturisasi penuh di pergantian tahun ajaran:** setiap `assessment_categories`/`assessment_subcategories` terikat ke `academic_period_id` tertentu (bukan berlaku lintas periode). Di awal tahun ajaran baru, Koordinator TTQ men-trigger `CloneCategoryConfigForNewPeriodUseCase` yang **meng-copy struktur dari periode sebelumnya sebagai starting point** ke periode baru — baris-baris baru ini belum punya data sama sekali, jadi BEBAS diedit/dihapus/direstrukturisasi total tanpa kena kunci di poin 1. Struktur periode lama tetap "dibekukan" apa adanya (tidak diubah), tetap dipakai untuk render laporan histori periode itu supaya laporan lama tidak berubah tampilannya.

**Kenapa digabung, bukan salah satu saja:** kunci berbasis data (poin 1) menjaga integritas data dalam 1 tahun ajaran (nilai rata-rata & perbandingan antar bulan tetap konsisten kriterianya). Versioning per periode (poin 2) mencegah sekolah terkunci selamanya ke keputusan struktur kategori yang mereka buat di tahun pertama — di tahun ajaran baru mereka bebas mengorganisasi ulang total.

- **`exp_rules`**: `id, school_id, source_type (enum), rule_key, exp_value` — konfigurasi bobot EXP per aktivitas (default seed dari PRD #4.6, override-able).

### 4.3 Data Operasional

- **`daily_ibadah`**: `id, school_id, student_id, date, status (enum: draft, submitted — default draft), submitted_at (timestamp, null selama draft), tilawah (JSONB: {surah_start, ayat_start, surah_end, ayat_end} | null), sholat_fardhu (JSONB: {subuh, dzuhur, ashar, maghrib, isya}), sholat_rawatib (JSONB array), tahajud (bool), dhuha (bool), puasa_sunnah (enum|null), created_at, updated_at` — **WAJIB ada `UNIQUE (student_id, date, school_id)`** agar 1 siswa hanya punya 1 row per tanggal (cegah race condition saat concurrent save).

> **Catatan flow Simpan vs Kirim (update dari PRD #4.2, hasil diskusi UX):** Sholat berlangsung sepanjang hari, jadi siswa perlu bisa isi bertahap. "Simpan" hanya menulis/update row dengan `status = draft` (bisa dipanggil berkali-kali, tidak memicu apa pun di modul gamifikasi). "Kirim" mengubah `status = submitted`, mengunci row (tolak write lebih lanjut di level use-case, bukan cuma UI), set `submitted_at`, dan **inilah satu-satunya titik** yang memicu use-case EXP/streak di modul `gamification` (lihat #5 & catatan integrasi antar-modul di CODING_PROMPT.md Fase 3). Row dengan `status = draft` tidak pernah dihitung ke EXP/streak/laporan sampai berstatus `submitted`.
- **`setoran_entries`** *(generik, menggantikan tabel per-kategori)*: `id, school_id, subcategory_id (FK assessment_subcategories), student_id, teacher_id, date, reference_start (JSONB), reference_end (JSONB), scores (JSONB: {field_key: value}), keterangan, created_at, updated_at`
- **`evaluasi_bulanan`**: `id, school_id, student_id, teacher_id, subcategory_id, bulan (YYYY-MM), catatan, created_at`

### 4.4 Gamifikasi

- **`student_gamification`**: `student_id (PK), school_id, level, total_exp, current_streak, longest_streak, last_activity_date`
- **`exp_transactions`**: `id, school_id, student_id, source_type (enum: daily_ibadah/setoran/streak_bonus/munaqosah), source_id, exp_amount, description, created_at`
- **`student_achievements`** *(baru)*: `id, school_id, student_id, achievement_type (enum: munaqosah_juz — extensible untuk tipe lain di v1.3+), juz_ke (int, nullable — hanya diisi untuk tipe munaqosah_juz), source_id (FK munaqosah_assignments), earned_at, created_at` — **1 tipe achievement diparameterisasi** (`juz_ke` 1-30), BUKAN 30 baris konfigurasi/definisi badge terpisah. Rendering UI cukup 1 komponen badge yang menerima `juz_ke` sebagai prop, bukan 30 komponen berbeda.

> **Batasan penting (update dari PRD #4.4/#4.7):** Data di `student_gamification` & `student_achievements` HANYA ditampilkan lewat use-case/route dashboard live siswa & orang tua (mis. `GetGamificationSummaryUseCase` di modul `gamification`). Use-case/route **laporan bulanan** (modul `reports`) **TIDAK BOLEH** menyertakan level/EXP/streak/achievement sama sekali — baik di tampilan layar maupun di export PDF. Modul `gamification` dan `reports` harus punya use-case & repository terpisah sejak awal (jangan gabung di satu use-case) supaya tidak gampang "kebocoran" data gamifikasi ke laporan secara tidak sengaja.

> **Kenapa `setoran_entries` generik (bukan 1 tabel per sub-kategori)?** Karena kategori & sub-kategori penilaian bisa berbeda per sekolah/jenjang, dan bisa berubah tiap tahun ajaran (lihat #4.2.1), pendekatan JSONB dengan `score_fields` yang didefinisikan di `assessment_subcategories` jauh lebih scalable daripada hardcode kolom `nilai_tajwid`, `nilai_makhroj`, dst. Trade-off: butuh validasi ketat di layer aplikasi (Zod, divalidasi terhadap `score_fields` milik sub-kategori terkait, termasuk cek penguncian field di #4.2.1) karena DB tidak bisa constraint JSONB shape secara native.

### 4.5 Target Bulanan & Munaqosah *(baru — masuk MVP, lihat PRD #4.3b-4.3c)*

- **`hafalan_targets`**: `id, school_id, student_id, teacher_id, bulan (YYYY-MM), target_surah_start, target_ayat_start, target_surah_end, target_ayat_end, catatan, created_at, updated_at` — 1 target aktif per siswa per bulan, murni referensi perencanaan (tidak mengunci/memvalidasi input setoran aktual).

- **`munaqosah_periods`**: `id, school_id, academic_period_id, nama (mis. "September 2026"), tanggal_mulai, tanggal_selesai, status (enum: draft, buka, tutup), created_at` — jadwal ujian, dikonfigurasi Koordinator TTQ per sekolah (TIDAK hardcode ke bulan Sep/Nov/Mar/Mei — itu contoh dari Al Fitrah, sekolah lain bisa beda).

- **`munaqosah_examiners`**: `id, munaqosah_period_id, teacher_id, kapasitas_siswa (int), assigned_by (FK users, Koordinator), created_at` — pool guru yang boleh jadi penguji utk 1 periode + kapasitas maksimal siswa yang bisa diuji, ditentukan manual oleh Koordinator (bukan auto-balancing).

- **`munaqosah_requests`**: `id, school_id, student_id, teacher_id (guru pengaju/pembimbing), juz_ke (int 1-30), status (enum: diajukan, disetujui, dijadwalkan, lulus, tidak_lulus, ditolak), created_at, updated_at`

- **`munaqosah_assignments`**: `id, request_id (FK munaqosah_requests), period_id (FK munaqosah_periods), examiner_teacher_id (FK users, dari pool munaqosah_examiners), jadwal_tanggal, jadwal_waktu, scores (JSONB: {tajwid, kelancaran}), hasil (enum: belum, lulus, tidak_lulus), catatan_penguji, assigned_by (FK users, Koordinator), assigned_at, completed_at`

> **Referensi statis batas juz:** dibutuhkan data referensi (bukan tabel per-sekolah, cukup 1 dataset statis di kode/seed) yang memetakan 30 juz Al-Qur'an ke rentang surah+ayat masing-masing, dipakai untuk menghitung akumulasi Ziyadah siswa vs batas juz (lihat use-case `CalculateHafalanProgressUseCase` di CODING_PROMPT.md). Taruh di `shared/kernel` sebagai konstanta, bukan hardcode di use-case.

---

## 5. Business Rules Kunci (ringkas — detail penuh di `PRD.md` #4.6–4.7)

- **Bobot poin sholat fardhu default:** BA=5, MA=4, BT=3, MT=2, H=5, T=0 (dan −100 poin kualitatif khusus T).
- **Nilai akumulasi sub-kategori setoran** = rata-rata dari rata-rata `score_fields` seluruh entri sub-kategori tsb di bulan berjalan.
- **Konversi nilai setoran → huruf → kategori mutu** mengikuti `grading_scale` pada `assessment_subcategories` masing-masing sekolah.
- **Konversi akumulasi ibadah yaumiyah → huruf (A-D)** *(baru)* — dihitung terpisah dari nilai setoran, berbasis **jumlah kejadian** (bukan rata-rata) per aspek per bulan, mengikuti `ibadah_grading_scale`:
  - Sholat Fardhu: 140–150=A, 120–139=B, 80–119=C, (−100 s/d 79, atau otomatis turun ke rentang ini bila ada ≥1 kejadian "T")=D.
  - Sholat Rawatib: 121–150=A, 100–120=B, 70–99=C, 0–69=D.
  - Tahajud/Dhuha/Tilawah (dihitung gabungan): 20–31=A, 10–19=B, 1–9=C, 0=D.
  - Puasa Sunnah: 5–8=A, 3–4=B, 1–2=C, 0=D.
  - ⚠️ Perlu dikonfirmasi ke sekolah saat implementasi: apakah "Tahajud/Dhuha/Tilawah" dihitung sebagai 1 kejadian gabungan per hari (maks 1 poin/hari, cocok dengan rentang maks 31), atau dijumlahkan terpisah per jenis aktivitas — asumsikan **gabungan per hari** dulu (paling konsisten dengan rentang angka di PRD), tapi jangan hardcode tanpa konfirmasi eksplisit dari Koordinator TTQ.
- **EXP Level formula (MVP):** `exp_required(level N) = 100 × N`, kumulatif, level tidak pernah turun.
- **Streak** *(dikonfirmasi final)*: bertambah hanya jika `daily_ibadah` hari itu berstatus `submitted` DAN **lengkap** (semua field wajib terisi). Draft yang belum dikirim TIDAK dihitung apa pun sampai jadi `submitted` (baik lewat Kirim manual maupun auto-finalize di bawah). Submit (final) yang tidak lengkap TIDAK menambah streak. Reset ke 0 jika ada hari kosong (tidak ada row `submitted` sama sekali) atau submit tidak lengkap.
- **Auto-Finalize** *(keputusan final, update dari PRD #4.2)*: siswa hanya boleh edit `daily_ibadah` untuk tanggal hari ini & kemarin (H/H-1). Begitu tanggal itu tidak lagi masuk window H/H-1 (window-nya "tertutup"), sistem otomatis mengubah row yang masih `status = draft` jadi `submitted` apa adanya — data tidak hilang, tapi dievaluasi sesuai kondisi aslinya (kalau tidak lengkap, ya tetap dianggap tidak lengkap untuk streak, sama seperti Kirim manual yang tidak lengkap). Implementasi: scheduled job harian (mis. cron tengah malam per timezone sekolah) yang query semua `daily_ibadah` dengan `status = draft AND date < today`, lalu jalankan use-case finalize yang SAMA dengan yang dipanggil saat Kirim manual (jangan duplikasi logic finalize di 2 tempat berbeda).
- **Gamifikasi vs Laporan** *(dikonfirmasi final)*: level/EXP/streak hanya tampil di dashboard live, tidak pernah muncul di laporan bulanan (layar maupun PDF) — lihat catatan di #4.4.
- **Batch close:** setelah `academic_periods.is_locked = true`, semua write ke `daily_ibadah`/`setoran_entries` pada periode tsb ditolak di level API (bukan hanya UI). Berlaku juga untuk lock di level semester/tahun ajaran (bukan cuma bulanan).
- **Deteksi kelayakan Munaqosah** *(baru)*: hitung akumulasi entri Ziyadah `submitted` per siswa (dari `reference_start`/`reference_end` di `setoran_entries`), map ke rentang juz pakai referensi statis (#4.5), tandai layak diajukan kalau progres juz berikutnya (yang belum pernah diajukan/lulus) sudah 100%. Ini SARAN sistem, bukan validasi wajib — guru tetap yang memutuskan mengajukan atau tidak.
- **Alur status Munaqosah** *(baru)*: `diajukan` (oleh guru) → `disetujui` atau `ditolak` (oleh Koordinator) → jika disetujui, di-assign ke `munaqosah_assignments` (Koordinator pilih penguji dari pool `munaqosah_examiners` + jadwal) → `lulus`/`tidak_lulus` (diisi penguji). Keputusan lulus/tidak ada di tangan penguji — skor Tajwid/Kelancaran dicatat sebagai pendukung, BUKAN threshold otomatis (lihat PRD #9 untuk status konfirmasi ini).
- **Achievement Munaqosah** *(baru)*: begitu `munaqosah_assignments.hasil = lulus`, otomatis buat 1 row `student_achievements` (`achievement_type = munaqosah_juz`, `juz_ke` dari request terkait) — trigger ini ada di use-case yang sama yang memproses hasil ujian (bukan proses terpisah/manual).
- **Kapasitas penguji**: `munaqosah_examiners.kapasitas_siswa` dicek saat Koordinator meng-assign siswa ke penguji tertentu (tolak assignment kalau kapasitas sudah penuh) — validasi di usecase, bukan cuma UI.

---

## 6. Konvensi Coding

- **Naming DB:** `snake_case` untuk kolom & tabel, plural untuk nama tabel.
- **Naming TS:** `camelCase` untuk variabel/fungsi, `PascalCase` untuk komponen React, class, dan tipe.
- **Naming Clean Architecture:**
  - Repository interface (domain): prefix `I`, mis. `IAssessmentCategoryRepository`.
  - Implementasi repository (infrastructure): prefix teknologi, mis. `DrizzleAssessmentCategoryRepository`.
  - Use-case (application): akhiran `UseCase`, mis. `SubmitDailyIbadahUseCase`, satu file = satu use-case, satu tanggung jawab.
  - Domain error: akhiran `Error`, jangan pernah lempar Error generic tanpa tipe (mis. `CategoryNotFoundError` bukan `throw new Error("not found")`).
- **API response shape:** konsisten `{ data, error, meta }`. Error selalu punya `code` yang bisa dipetakan ke pesan i18n di FE.
- **Error handling lintas layer:** domain/application melempar domain error (mis. `CategoryNotFoundError`), lalu **hanya di presentation layer** domain error itu di-mapping ke HTTP status code yang sesuai (mis. lewat 1 error-handler middleware terpusat). Domain & application TIDAK BOLEH tahu soal HTTP status code.
- **Validasi ganda:** Zod schema didefinisikan sekali di `packages/shared`, dipakai backend (request validation di presentation layer) dan frontend (form validation) — hindari duplikasi skema.
- **Tenant scoping wajib di query builder:** buat helper `withTenantScope(query, schoolId)` di Drizzle, JANGAN pernah query tabel operasional tanpa filter `school_id` eksplisit. Karena akses Drizzle HANYA boleh dari infrastructure layer, helper ini otomatis hanya dipakai di sana.
- **Setiap migration Drizzle harus reversible** sebelum di-merge ke main. Catatan implementasi: Drizzle ORM (`drizzle-kit`) TIDAK punya down-migration native — strategi "reversible" di sini adalah: (1) migration harus **additive** (tambah tabel/kolom, JANGAN hapus kolom/tabel lama secara langsung), (2) perubahan breaking dipisah jadi 2 migration bertahap (deprecate kolom dulu → hapus di migration berikutnya setelah periode transisi), (3) nama migration deskriptif (`bun drizzle-kit generate --name add_xxx`), bukan `update1`.
- **Commit convention:** Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, dst).

---

## 7. Environment & Setup (draft — sesuaikan saat scaffolding)

```bash
# Prasyarat: Bun terinstall
bun install

# Setup env
cp apps/api/.env.example apps/api/.env
# isi DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, REDIS_URL

# Migrasi & seed
bun run --cwd apps/api db:migrate
bun run --cwd apps/api db:seed   # seed 1 school demo + kategori default (Tahfidz > Ziyadah/Muroja'ah, Tahsin > Sabiq/Talaqi)

# Jalankan dev
bun run dev   # menjalankan api & web secara paralel (turbo/concurrently)
```

---

## 8. Referensi Dokumen Sumber

Skema di atas adalah generalisasi multi-tenant dari dokumen awal `TTQ_Tracker.md` (spesifikasi pilot untuk SMP IT Al Fitrah) dan hasil wawancara `meeting_1 - narasumber.md` (konteks bahwa TTQ tidak seragam antar sekolah IT, mengikuti pedoman dasar JSIT namun disesuaikan kebijakan masing-masing sekolah). Untuk requirement fungsional lengkap & rationale keputusan, selalu rujuk `PRD.md` sebagai source of truth produk. Untuk rencana migrasi backend ke Go di masa depan, lihat `MIGRATION_TO_GO.md`.
