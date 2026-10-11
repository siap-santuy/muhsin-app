# 📊 Panduan Monitoring & Troubleshooting Production VPS (Muhsin App)

Dokumen ini adalah standar operasional resmi bagi Developer dan Sysadmin untuk memantau kesehatan server, melacak error (*error tracing*), dan mengatasi insiden (*incident response*) pada server Production Muhsin App.

---

## ⚡ 1. Quick Health Check (Cek Cepat 10 Detik)

Saat masuk ke server VPS via SSH, jalankan 3 perintah ini untuk mengetahui status umum sistem:

### A. Cek Status Seluruh Container
```bash
docker compose ps
```
*Pastikan seluruh container (`muhsin_api`, `muhsin_web`, `muhsin_postgres`, `muhsin_redis`) berstatus `Up` (healthy).*

### B. Cek Pemakaian CPU & RAM Live
```bash
docker stats --no-stream
```
*Normalnya:*
- `muhsin_api` (Bun Runtime): ~60MB - 120MB RAM
- `muhsin_web` (Nginx Static): ~10MB - 25MB RAM
- `muhsin_postgres`: ~50MB - 150MB RAM
- `muhsin_redis`: ~15MB - 30MB RAM
*Total pemakaian RAM normal seluruh stack adalah < 400MB.*

### C. Cek Responsivitas API Eksternal
```bash
curl -I https://api.muhsin.id/schools/public/alfitrah
```
*Harus mengembalikan HTTP `200 OK`.*

---

## 🔍 2. Log Tracing & Investigasi Error 500

Semua log aplikasi dicetak ke container runtime dan dikelola oleh Docker daemon.

### A. Streaming Log Realtime (Live Watching)
Gunakan perintah ini saat memantau traffic yang sedang berlangsung:
```bash
# Pantau 100 baris terakhir dan ikuti log baru secara langsung:
docker logs -f --tail 100 muhsin_api
```
*(Tekan `Ctrl + C` untuk keluar).*

### B. Filter Khusus Error 500 & Stack Trace
Jika ada laporan dari guru/wali santri bahwa fitur tertentu gagal, filter log khusus error:
```bash
# Tampilkan log yang mengandung tanda error 500 atau uncaught exception:
docker logs muhsin_api | grep -E "\[500\]|\[ERROR\]|\[BUN_ERROR\]"
```

Contoh output saat terjadi error 500:
```text
[ERROR] 2026-10-08T18:05:12.345Z [500] POST /daily-ibadah/submit: Error: Database connection timeout
    at DrizzleDailyIbadahRepository.save (/app/apps/api/src/modules/daily-ibadah/infrastructure/DrizzleDailyIbadahRepository.ts:88:15)
```
*Dari baris di atas, Anda langsung mengetahui:*
1. Waktu kejadian: `2026-10-08T18:05:12.345Z`
2. Endpoint & Method: `POST /daily-ibadah/submit`
3. File & nomor baris kode: `DrizzleDailyIbadahRepository.ts:88`

### C. Mencari Log Berdasarkan Rentang Waktu
```bash
# Tampilkan log dalam 30 menit terakhir:
docker logs --since 30m muhsin_api

# Tampilkan log dalam 2 jam terakhir dan simpan ke file teks untuk dianalisis:
docker logs --since 2h muhsin_api > ~/api_investigasi.log
```

### D. Log Host Nginx (Reverse Proxy VPS)
Jika request gagal sebelum mencapai Docker (misal error `502 Bad Gateway`):
```bash
# Cek log error Nginx host VPS:
tail -f -n 50 /var/log/nginx/error.log
```

---

## 🗄️ 3. Inspeksi Database & Redis

### A. Masuk ke PostgreSQL CLI di Docker
Untuk memeriksa data langsung via SQL tanpa install client di VPS:
```bash
# Ganti muhsin_admin & muhsin_db sesuai .env production Anda:
docker exec -it muhsin_postgres psql -U muhsin_admin -d muhsin_db
```

Query cepat yang sering digunakan:
```sql
-- 1. Cek jumlah santri aktif:
SELECT count(*) FROM users WHERE role = 'student';

-- 2. Cek apakah ada orang tua yang belum terikat anak:
SELECT u.name, u.username FROM users u 
WHERE u.role = 'parent' 
AND u.id NOT IN (SELECT parent_id FROM parent_student_mapping);

-- 3. Cek setoran hafalan hari ini:
SELECT count(*) FROM setoran_entries WHERE date = CURRENT_DATE;

-- Keluar dari psql:
\q
```

### B. Cek Koneksi & Antrean Redis
```bash
# Ping Redis (harus membalas PONG):
docker exec -it muhsin_redis redis-cli ping

# Cek memory Redis:
docker exec -it muhsin_redis redis-cli info memory
```

---

## 🛠️ 4. SOP Penanganan Insiden Produksi (Incident Response)

### Skenario 1: API Crash / Hang / Memory Spike
Jika API tidak merespons, lakukan restart container API **tanpa mematikan database**:
```bash
docker compose restart api
```
*Waktu downtime: ~1–2 detik.*

### Skenario 2: Muncul Error `502 Bad Gateway` di Browser
Artinya Nginx di host VPS tidak dapat meneruskan koneksi ke container `muhsin_web` (port 8080) atau `muhsin_api` (port 3001).
```bash
# 1. Cek apakah container berjalan:
docker compose ps

# 2. Jika container mati, nyalakan kembali:
docker compose up -d

# 3. Reload Nginx host:
sudo systemctl reload nginx
```

### Skenario 3: Pemulihan Database Cepat (Restore Snapshot)
Jika terjadi salah eksekusi data di database, pulihkan dari file backup terakhir:
```bash
# 1. Catatan: Jangan gunakan flag -v
# 2. Restore file backup SQL:
docker exec -i muhsin_postgres psql -U muhsin_admin -d muhsin_db < ~/backup_prod_YYYY-MM-DD.sql
```

---

## 🔄 5. SOP Update Rutin / Maintenance

Saat ada pembaruan kode di GitHub `main` dan ingin diterapkan ke VPS:

```bash
# 1. Buat snapshot backup database (Wajib sebelum update):
docker exec muhsin_postgres pg_dump -U muhsin_admin muhsin_db > ~/backup_prod_$(date +%F_%H%M).sql

# 2. Tarik kode terbaru:
git pull origin main

# 3. Build & restart container aplikasi:
docker compose up -d --build api web

# 4. Jalankan migrasi database:
docker compose exec api bun run db:migrate

# 5. Cek log apakah booting sukses:
docker logs --tail 20 muhsin_api
```
*(Catatan: Jangan jalankan `db:seed` atau `db:seed:sim` saat update rutin di production yang datanya sudah berjalan).*
