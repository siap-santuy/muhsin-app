# Muhsin App

Aplikasi manajemen TTQ (Tahsin Tahfizh Qur'an) & ibadah yaumiyah siswa berbasis Clean Architecture & Multi-Tenant.

Monorepo management menggunakan **Bun workspaces**.

---

## 📁 Struktur Proyek

```text
.
├── package.json              # Monorepo workspaces (apps/*, packages/*) & root scripts
├── docker-compose.yml        # Multi-container local/production setup
├── Jenkinsfile               # CI/CD Pipeline configuration
├── apps/
│   ├── api/                  # Backend (Bun + Hono + Clean Architecture)
│   │   ├── Dockerfile        # Container build untuk API
│   │   └── src/
│   │       ├── db/           # Drizzle schema, migrations, seed
│   │       ├── modules/      # Modul domain (auth, daily-ibadah, gamification, setoran, etc.)
│   │       └── middleware/   # RBAC & tenant scoping guards
│   ├── web/                  # Frontend (React + Vite + Tailwind CSS)
│   │   ├── Dockerfile        # Nginx multi-stage build untuk Web
│   │   ├── nginx.conf        # Reverse proxy & SPA routing config
│   │   └── src/              # Pages, components, store, api client
├── packages/
│   └── shared/               # `@muhsin/shared` (Zod schemas, types source of truth)
└── docs/                     # Dokumentasi arsitektur, PRD & requirements
```

---

## ⚙️ Prasyarat

| Tool | Versi Rekomendasi | Keterangan |
|------|-------------------|------------|
| **Bun** | >= 1.1.x | Runtime & Package manager utama |
| **PostgreSQL** | >= 16.x | Database utama |
| **Redis** | >= 7.x | Token caching & session store |
| **Docker & Docker Compose** | Latest | Containerization & local stack |

---

## 🚀 Panduan Setup & Menjalankan

### 1. Instalasi Dependensi
Jalankan dari root direktori:
```bash
bun install
```

### 2. Konfigurasi Environment Variable
Salin file `.env.example` pada `apps/api` dan `apps/web`:
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Contoh konfigurasi `apps/api/.env`:
```env
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/muhsin_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=super-secret-jwt-key-min-32-characters
JWT_REFRESH_SECRET=super-secret-refresh-jwt-key-min-32-characters
ACCESS_TOKEN_TTL=900
REFRESH_TOKEN_TTL=604800
```

---

## 💻 Menjalankan Aplikasi (Root Scripts)

Semua perintah dapat langsung dijalankan dari root direktori:

### Mode Development
```bash
# Jalankan API & Frontend bersamaan
bun run dev

# Jalankan masing-masing service
bun run dev:api    # API saja (http://localhost:3000)
bun run dev:web    # Web saja (http://localhost:5173)
```

### Mode Production
```bash
# 1. Build semua package & app
bun run build

# Atau build per app
bun run build:api
bun run build:web

# 2. Jalankan mode production
bun run start        # Jalankan API & Web production
bun run start:api    # API production
bun run start:web    # Web preview server
bun run preview      # Web preview
```

---

## 🗄️ Database Management (Drizzle ORM)

Dapat dijalankan langsung dari root:

```bash
# Buat database jika belum ada
bun run db:create

# Generate migration dari skema Drizzle
bun run db:generate

# Jalankan migrasi ke PostgreSQL
bun run db:migrate

# Seed data awal (Tenant demo, Admin, Config TTQ)
bun run db:seed

# Reset database bersih (drop + migrate ulang)
bun run db:reset
```

---

## 🧪 Testing & Typecheck

```bash
# Typecheck semua workspace
bun run typecheck

# Jalankan seluruh unit test (Vitest)
bun run test
```

---

## 🐳 Deployment Menggunakan Docker & Docker Compose

Jalankan seluruh stack (PostgreSQL, Redis, API, dan Nginx Web) dengan satu perintah:

```bash
# Build dan jalankan semua service di background
docker compose up -d --build

# Cek logs service
docker compose logs -f

# Matikan service
docker compose down
```

Akses aplikasi melalui:
- **Frontend & Reverse Proxy API**: `http://localhost`
- **Backend API Direct**: `http://localhost:3000`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`

---

## 🔄 CI/CD Pipeline (Jenkins)

Pipeline otomatis terdefinisi di `Jenkinsfile`:

1. **Install Dependencies**: `bun install --frozen-lockfile`
2. **Lint & Format Check**: Memeriksa standardisasi kode.
3. **Type Check**: Menjalankan TypeScript Compiler `bun run typecheck`.
4. **Run Unit Tests**: Menjalankan test suite via `bun run test`.
5. **Docker Build**: Membangun Docker Image multi-stage untuk `api` dan `web`.
6. **Deploy**: Menerapkan update container ke environment staging/production.

---

## 🎮 Aturan & Formula Sistem Gamifikasi Ihsan

Sistem gamifikasi bertujuan mendorong konsistensi (*istiqomah*) ibadah harian siswa dan capaian hafalan Al-Qur'an. Gamifikasi terdiri dari **EXP (Experience Points)**, **Level**, dan **Streak Istiqomah**.

### 1. Formula Kenaikan Level (Level Up)
- **Karakteristik**: Level bersifat kumulatif dan tidak pernah turun.
- **Kebutuhan EXP**: Untuk mencapai Level $N$, dibutuhkan akumulasi total EXP sebesar:
  $$\text{Target EXP (Level } N) = 100 \times N$$
  $$\text{Total Akumulasi EXP} = \sum_{k=1}^{N-1} (100 \times k) = 50 \times N \times (N - 1)$$
- **Tabel Level Threshold**:
  - **Level 1**: 0 – 99 EXP
  - **Level 2**: 100 – 299 EXP
  - **Level 3**: 300 – 599 EXP
  - **Level 4**: 600 – 999 EXP
  - **Level 5**: 1000 – 1499 EXP (dan seterusnya).

---

### 2. Aturan Perolehan EXP (Points Breakdown)

| Kategori Aktivitas | Aksi / Indikator | EXP yang Didapat |
|---|---|---|
| **Sholat Fardhu** | **BA** (Berjamaah Awal Waktu / Masjid) | **+5 EXP** per waktu |
| | **MA** (Munfarid Awal Waktu) | **+4 EXP** per waktu |
| | **BT** (Berjamaah Terlambat) | **+3 EXP** per waktu |
| | **MT** (Munfarid Terlambat) | **+2 EXP** per waktu |
| | **H** (Haid - khusus siswi) | **+5 EXP** per waktu |
| | **T** (Tidak Sholat) | **0 EXP** (Poin minus di raport) |
| **Sholat Sunnah** | **Rawatib** (Qobliyah / Ba'diyah) | **+2 EXP** per jenis rawatib |
| | **Sholat Dhuha** | **+5 EXP** |
| | **Qiyamul Lail / Tahajud** | **+10 EXP** |
| **Ibadah Tambahan** | **Puasa Sunnah** (Senin / Kamis / Ayyamul Bidh) | **+15 EXP** |
| | **Tilawah Mandiri** | **+10 EXP** |
| **Setoran TTQ** | **Ziyadah / Muroja'ah / Sabiq / Talaqi** (Nilai > 0) | **+20 EXP** per sesi setoran |
| **Munaqosah** | **Lulus Ujian Munaqosah Kenaikan Juz** | **+100 EXP** + Badge Achievement |

---

### 3. Aturan Streak Istiqomah (Daily Streak)
1. **Syarat Bertambah**:
   - Status pengisian `daily_ibadah` hari itu telah di-**submit** (bukan sekadar draft).
   - Seluruh 5 waktu sholat fardhu wajib terisi (Subuh, Dzuhur, Ashar, Maghrib, Isya).
   - Pengisian dilakukan pada hari berturut-turut ($H \to H+1$).
2. **Idempoten**: Mengedit / submit ulang data pada hari yang sama tidak menambah streak ganda.
3. **Reset Streak**:
   - Jika terlewat 1 hari tanpa pengisian lengkap (gap $> 1$ hari), streak kembali ke **0** (atau **1** pada hari pengisian berikutnya).

---

## 🔒 Aturan Keamanan & Desain Sistem

1. **Tenant Scoping**: Setiap query wajib memfilter berdasarkan `school_id`.
2. **RBAC Guard**: Hak akses endpoint diverifikasi di backend melalui middleware (HTTP 403).
3. **Clean Architecture**: Domain layer murni dan independen tanpa ketergantungan langsung ke framework HTTP atau ORM.
4. **Data-Driven TTQ**: Skema field penilaian (`score_fields`) dan konversi huruf disimpan secara dinamis per sekolah via database.
