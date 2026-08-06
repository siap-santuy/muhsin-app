# Muhsin App

Aplikasi manajemen TTQ (Tahsin Tahfizh Qur'an) & ibadah yaumiyah siswa.

Monorepo management menggunakan **npm workspaces** (Bun sebagai package manager & runtime).

## Struktur Proyek

```
.
├── package.json              # Definisi workspaces (apps/*, packages/*)
├── bun.lock                  # Lockfile (Bun)
├── apps/
│   ├── api/                  # Backend (Hono + Bun)
│   │   └── src/
│   │       ├── index.ts      # Entry point (port 3001)
│   │       ├── bootstrap/    # Dependency injection container
│   │       ├── db/           # Drizzle client, schema, migrations, seed
│   │       ├── modules/      # Auth module (clean architecture)
│   │       └── middleware/   # Auth & tenant-scope middleware
│   ├── web/                  # Frontend (React + Vite)
│   │   └── src/              # Komponen UI, styling
│   └── shared/               # (folder kosong penampung)
├── packages/
│   └── shared/               # Package `@muhsin/shared` (zod schema dsb.)
├── design/                   # Aset desain (icon, UI-UX)
└── docs/
│   ├── PRD.md                # Dokumentasi produk & teknis
│   ├── PROJECT.md            # Dokumentasi produk & teknis
└── dump.rdb                  # Artefak runtime Redis (jangan di-commit)
```

## Prasyarat

| Tool | Versi | Keterangan |
|------|-------|------------|
| [Bun](https://bun.sh/) | >= 1.1 | Runtime & package manager (wajib) |
| [Node.js](https://nodejs.org/) | >= 18 | Dibutuhkan Vite/TSC untuk web |
| **PostgreSQL** | >= 14 | Database utama |
| **Redis** | >= 6 | Refresh-token storage & session |

> `apps/api` dijalankan dengan Bun (`bun run --hot`), sehingga **Bun wajib terinstal**.
> Instalasi Bun: `curl -fsSL https://bun.sh/install | bash` (Unix) atau via PowerShell.

## Instalasi

Rekursif dari root (workspaces otomatis dibedakan per folder):

```bash
bun install
```

Lebih cepat memakai Bun dibanding `npm install`. Lockfile `bun.lock` dipakai Bun.

## Persiapan Environment

### 1. API

Berdasarkan folder `apps/api`, file contoh `.env.example`:

```bash
cp apps/api/.env.example apps/api/.env
```

Isi `.env` dengan nilai sebenarnya:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/muhsin_app
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-me-access-secret-min-32-chars
JWT_REFRESH_SECRET=change-me-refresh-secret-min-32-chars
ACCESS_TOKEN_TTL=900
REFRESH_TOKEN_TTL=604800
```

> Ganti semua secret dengan nilai acak (>= 32 karakter). Jangan commit `.env`
> (sudah ada di `.gitignore`).

### 2. Web

Web saat ini belum membaca env tambahan (memakai port default Vite `5173`).
Jika nanti memanggil API, perlu proxy/environment terpisah — belum disiapkan.

## Menjalankan Postgres & Redis

Fuel docker-compose (jika sudah punya, sesuaikan, contoh kecil):

```bash
docker run -d --name muhsin-postgres \
  -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=muhsin_app \
  postgres:16

docker run -d --name muhsin-redis -p 6379:6379 redis:7
```

Tanpa Docker: install **PostgreSQL** + **Redis** lokal, buat DB `muhsin_app`, lalu sesuaikan `DATABASE_URL`.

## Database Migration & Seed

> Jalankan dari folder `apps/api`.

```bash
bun run db:create     # buat database (pertama kali, jika belum ada)
bun run db:generate   # (opsional, bila schema berubah) generate SQL migration
bun run db:migrate     # apply migration ke DB
bun run db:seed       # seed data awal (bila tersedia)
```

> Alternatif sekali jalan untuk setup bersih: `bun run db:reset` (drop, buat ulang, migrate).

> Drizzle membaca `DATABASE_URL` dari `.env` (lihat `drizzle.config.ts`).

## Menjalankan Aplikasi

Dua terminal, satu untuk tiap app.

### API (port 3001)

```bash
cd apps/api
bun run dev
```

- Run hot-reload `bun ./src/index.ts`.
- Endpoint utama `/auth`, `/auth/me`.
- URL: <http://localhost:3001>

### Web (port 5173)

```bash
cd apps/web
bun run dev
```

- Vite dev server + hot reload.
- URL: <http://localhost:5173>

## Script yang Tersedia

### API (`apps/api`)

| Command | Fungsi |
|---|---|
| `bun run dev` | Jalankan dev server (hot reload) |
| `bun run test` | Jalankan unit test (Vitest) |
| `bun run typecheck` | Type-check TypeScript |
| `bun run db:generate` | Generate migration Drizzle |
| `bun run db:migrate` | Apply migration |
| `bun run db:create` | Buat database (jika belum ada) |
| `bun run db:reset` | Hapus database, buat ulang, lalu migrate |
| `bun run db:seed` | Seed database |

### Web (`apps/web`)

| Command | Fungsi |
|---|---|
| `bun run dev` | Dev server |
| `bun run build` | Type-check + build production |
| `bun run preview` | Preview hasil build |

## Verifikasi Instalasi

1. Pastikan `bun install` sukses tanpa error.
2. Cek `apps/api/node_modules` & `apps/web/node_modules` ada (deps khusus per app terinstal).
3. Jalankan API: buka <http://localhost:3001/auth> — jika `404` berarti server hidup.
4. Jalankan Web: buka <http://localhost:5173> — tampil halaman "Muhsin App".

## Troubleshooting

| Masalah | Solusi |
|---|---|
| `bun: command not found` | Install Bun (lihat Prasyarat) |
| `bun install` gagal | Bun versi < 1.1, atau hapus `bun.lock` lama lalu ulangi |
| DB connection error | Pastikan Postgres jalan & `DATABASE_URL` benar |
| Redis connection refused | Pastikan Redis jalan di `REDIS_URL` |
| Migration tidak ada | Jalankan `bun run db:generate` dulu, lalu `db:migrate` |
| Dependency di folder `node_modules` terpisah | Normal — npm workspaces hoist deps umum ke root & naruh deps spesifik di tiap workspace |

## License

Lihat `LICENSE`.