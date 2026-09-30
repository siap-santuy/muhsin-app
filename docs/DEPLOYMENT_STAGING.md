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
| **Frontend Web**| `127.0.0.1:8081` | `muhsin_staging_web` | Build arg `VITE_API_URL: https://api-staging.muhsin.id` |

> **Keamanan & Isolasi Staging vs Production:**
> 1. **Project Name Terisolasi**: `docker-compose.staging.yml` menggunakan `name: muhsin_staging`. Docker memisahkan network dan container 100% dari production, sehingga keduanya dapat **hidup berdampingan secara bersamaan**.
> 2. **Volume Database Mandiri**: Staging menggunakan volume `postgres_staging_data`, production menggunakan `postgres_data`. Data database production tidak akan tersentuh.
> 3. **PENTING - Larangan Flag `-v`**: Jangan pernah menjalankan `docker compose down -v` karena flag `-v` akan menghapus storage volume database. Gunakan `down` tanpa `-v`.
> 4. **Swap Memory (Cegah Crash saat Build)**: Proses build image frontend web membutuhkan lonjakan RAM ~1.5 GB. Jika VPS memiliki RAM terbatas (1-2 GB), pastikan Swap 4GB aktif agar container production tidak dibunuh paksa oleh kernel (OOM Killer):
>    ```bash
>    sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
>    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
>    ```

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
VITE_API_URL=https://api-staging.muhsin.id
VITE_DEFAULT_SCHOOL_SLUG=alfitrah
VAPID_PUBLIC_KEY=change-me-staging-vapid-public
VAPID_PRIVATE_KEY=change-me-staging-vapid-private
VAPID_SUBJECT=mailto:admin@muhsin.id
```

> **Catatan Multi-Tenant Staging:**
> Subdomain `staging` dan `api-staging` masuk exclusion list slug sekolah. Akses frontend di `https://staging.muhsin.id` otomatis menggunakan `VITE_DEFAULT_SCHOOL_SLUG` (`alfitrah`). Untuk menguji slug tenant lain di staging, gunakan query param URL: `https://staging.muhsin.id/?school=<slug>`.

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

### Step 5: Jalankan Database Seeding & Simulasi 1 Bulan

Populasikan data demo (sekolah, periode akademik, skala nilai, kategori tahfidz/tahsin, akun admin, guru, siswa, kelas):

```bash
# 1. Seed struktur awal & user demo
docker compose -f docker-compose.staging.yml --env-file .env.staging run --rm api bun run db:seed

# 2. Seed simulasi 1 bulan penuh khusus staging (Anak, Ortu, Guru terhubung + 30 hari mutaba'ah + setoran + raport)
docker compose -f docker-compose.staging.yml --env-file .env.staging run --rm api bun run db:seed:sim
```

> **Akun Simulasi 1 Bulan Penuh (September 2026):**
> - **Siswa**: `nengdara.hdr@gmail.com` / `muhsin123` (Abdul Rayhan Pradipta, Level 7, Streak 30 Hari)
> - **Orang Tua**: `ortu_daraindahpertiwi` / `muhsin123` (Dara Indah Pertiwi)
> - **Guru**: `arai@teacher.alfitrah.sch.id` / `muhsin123` (Arai Kurnia Ramadhan, S.Pd.)

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

