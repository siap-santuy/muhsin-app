# Panduan Deployment Manual Staging & Seeding (Muhsin App)

Panduan deployment lingkungan **Staging** terisolasi di VPS menggunakan `docker-compose.staging.yml` lengkap dengan step migrasi skema dan database seeding.

---

## 1. Spesifikasi Lingkungan Staging

Lingkungan staging berjalan berdampingan dengan production tanpa tabrakan port atau volume:

| Komponen | Host Binding | Container Name | Keterangan |
| :--- | :--- | :--- | :--- |
| **PostgreSQL** | `127.0.0.1:5433` | `muhsin_staging_postgres` | Isolated volume `postgres_staging_data` |
| **Redis** | `127.0.0.1:6380` | `muhsin_staging_redis` | Isolated volume `redis_staging_data` |
| **Backend API** | `127.0.0.1:3002` | `muhsin_staging_api` | Internal container port 3001 |
| **Frontend Web**| `127.0.0.1:8081` | `muhsin_staging_web` | Build arg `VITE_API_URL: http://localhost:3002` |

---

## 2. Prasyarat

- Docker Engine & Docker Compose v2 terinstall di VPS.
- Hak akses `sudo` atau user masuk ke group `docker`.
- Clone repositori berada di direktori kerja (misal: `/opt/muhsinapp` atau `/home/ubuntu/muhsinapp`).

---

## 3. Langkah-Langkah Deploy Manual

### Step 1: Tarik Perubahan Kode Terbaru

```bash
git fetch origin
git checkout staging
git pull origin staging
```

*(Jika deploy dari branch main untuk staging testing, sesuaikan branch yang di-checkout)*

---

### Step 2: Konfigurasi Environment File

Pastikan file `.env.staging` sudah ada di root repository:

```bash
# Cek isi file
cat .env.staging
```

Jika belum ada, buat atau sesuaikan nilai berikut:

```env
DB_USER=muhsin_staging_admin
DB_PASSWORD=muhsin_staging_secure_password_123
DB_NAME=muhsin_staging_db
JWT_SECRET=staging-jwt-secret-min-32-chars-random!
JWT_REFRESH_SECRET=staging-jwt-refresh-secret-min-32-chars-random!
```

---

### Step 3: Jalankan Database & Redis Staging

Start Postgres dan Redis terlebih dahulu sampai status ready:

```bash
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d postgres redis
```

Pastikan container database berstatus healthy:

```bash
docker compose -f docker-compose.staging.yml ps
```

---

### Step 4: Jalankan Database Migration

Terapkan migration Drizzle terbaru ke database staging:

```bash
docker compose -f docker-compose.staging.yml --env-file .env.staging run --rm api bun run db:migrate
```

---

### Step 5: Jalankan Database Seeding

Populasikan data demo (sekolah, periode akademik, skala nilai, kategori tahfidz/tahsin, akun admin, guru, siswa, kelas):

```bash
docker compose -f docker-compose.staging.yml --env-file .env.staging run --rm api bun run db:seed
```

> **Data Default Seeding:**
> - Akun Admin: `admin@alfitrah.sch.id`
> - Default Password: `muhsin123`
> - School Slug: `alfitrah`

---

### Step 6: Build & Jalankan Seluruh Service

Naikkan container API dan Web:

```bash
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build api web
```

---

### Step 7: Verifikasi Status & Logs

Periksa apakah semua container berjalan normal:

```bash
# Cek status container
docker compose -f docker-compose.staging.yml ps

# Cek logs API
docker compose -f docker-compose.staging.yml logs -f api

# Cek logs Web
docker compose -f docker-compose.staging.yml logs -f web
```

Uji konektivitas internal VPS:
```bash
# Test API Health / Response
curl -I http://127.0.0.1:3002/health || curl -I http://127.0.0.1:3002/

# Test Web Response
curl -I http://127.0.0.1:8081/
```

---

## 4. Alur Redeploy (Update Versi Staging)

Gunakan langkah ini saat ada commit baru di branch staging tanpa menghapus data database yang sudah ada:

```bash
# 1. Masuk ke direktori proyek dan tarik kode terbaru
git fetch origin
git checkout staging
git pull origin staging

# 2. Jalankan migrasi jika ada perubahan skema database
docker compose -f docker-compose.staging.yml --env-file .env.staging run --rm api bun run db:migrate

# 3. Build ulang dan restart container app (zero-downtime ringan)
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build api web

# 4. Bersihkan docker image lama yang dangling (opsional, hemat disk VPS)
docker image prune -f

# 5. Cek log untuk memastikan service berjalan normal
docker compose -f docker-compose.staging.yml logs --tail=50 -f api
```

---

## 5. Prosedur Reset Database Staging (Fresh Clean State)

Jika data staging perlu di-reset ulang ke kondisi bersih tanpa mempengaruhi production:

```bash
# 1. Matikan container staging dan hapus volume database staging
docker compose -f docker-compose.staging.yml down -v

# 2. Start ulang database & redis
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d postgres redis

# 3. Tunggu hingga postgres healthy (sekitar 5-10 detik)
sleep 10

# 4. Jalankan ulang migration & seed
docker compose -f docker-compose.staging.yml --env-file .env.staging run --rm api bun run db:migrate
docker compose -f docker-compose.staging.yml --env-file .env.staging run --rm api bun run db:seed

# 5. Start ulang app
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d api web
```

---

## 6. Troubleshooting CORS & Konfigurasi Nginx VPS

Jika muncul error browser seperti:
> `Access to fetch at 'https://api-staging.muhsin.id/...' from origin 'https://staging.muhsin.id' has been blocked by CORS policy`

Periksa 2 hal berikut:
1. **Nilai `VITE_API_URL`**: Pastikan di `.env.staging` sudah diisi `VITE_API_URL=https://api-staging.muhsin.id` (atau `http://api-staging.muhsin.id` jika belum pasang SSL), lalu re-build container web:
   ```bash
   docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build web
   ```
2. **Reverse Proxy Nginx**: Backend API Muhsin App sudah menangani CORS secara internal. Pastikan Nginx host **TIDAK** menimpa origin dan meneruskan request headers dengan benar:

Contoh konfigurasi Nginx host lengkap:

```nginx
# API Staging: api-staging.muhsin.id
server {
    listen 80;
    server_name api-staging.muhsin.id;
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Web Staging: staging.muhsin.id
server {
    listen 80;
    server_name staging.muhsin.id;

    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Reload Nginx:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 7. Panduan Demo Aplikasi Staging

Untuk akun login lengkap (Koordinator TTQ, Guru, Siswa, Orang Tua) beserta skenario demo end-to-end, baca panduan terpisah:
👉 **[docs/DEMO_GUIDE_STAGING.md](./DEMO_GUIDE_STAGING.md)**

