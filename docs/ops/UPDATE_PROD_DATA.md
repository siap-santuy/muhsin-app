# Panduan Update Data Production via Docker (Muhsin App)

Dokumen ini berisi instruksi dan query langsung untuk merapikan data yang sudah terlanjur di-seed di production server.

---

## 1. Akses Database PostgreSQL di Docker

Jalankan perintah berikut di server host tempat docker-compose berjalan:

```bash
docker exec -it muhsin_postgres psql -U muhsin_admin -d muhsin_db
```

*Catatan: Jika kredensial di file `.env` production Anda berbeda dari default, ganti `muhsin_admin` dan `muhsin_db` sesuai nilai `DB_USER` dan `DB_NAME` Anda.*

---

## 2. Eksekusi Query SQL

Jalankan query SQL berikut di dalam prompt `psql` (`muhsin_db=#`):

```sql
BEGIN;

-- 1. Ubah nama sekolah menjadi "SMP Islam Terpadu AL FITRAH"
UPDATE schools
SET name = 'SMP Islam Terpadu AL FITRAH'
WHERE name = 'SMP IT Al Fitrah - Demo' OR slug = 'alfitrah';

-- 2. Bersihkan penyebutan teknologi "PostgreSQL & Redis" di notifikasi
UPDATE notifications
SET title = 'Sistem Terhubung ke Database'
WHERE title ILIKE '%PostgreSQL%';

UPDATE notifications
SET message = REPLACE(message, 'setoran & ibadah yaumiyah', 'nilai & ibadah yaumiyah')
WHERE message ILIKE '%setoran & ibadah yaumiyah%';

-- 3. Ubah deskripsi jam pengingat dari 21:00 / 21.00 menjadi 23:59 WIB
UPDATE notifications
SET message = REPLACE(REPLACE(message, '21.00', '23.59'), '21:00', '23:59')
WHERE message LIKE '%21.00%' OR message LIKE '%21:00%';

COMMIT;
```

---

## 3. Verifikasi Hasil Query di PostgreSQL

Jalankan query pengecekan berikut:

```sql
-- Cek nama sekolah
SELECT id, slug, name, jenjang FROM schools WHERE slug = 'alfitrah';

-- Cek notifikasi yang telah diperbarui
SELECT id, title, message, type, created_at 
FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;
```

Ketik `\q` lalu Enter untuk keluar dari prompt `psql`.

---

## 4. Invalidation / Flush Cache Redis Notifikasi

Karena notifikasi di-cache di Redis (`notif:<school_id>:<user_id>`), lakukan pembersihan cache notifikasi agar perubahan langsung tampil di aplikasi pengguna tanpa menunggu TTL 5 menit:

```bash
# Opsi A: Bersihkan key notifikasi saja
docker exec -it muhsin_redis sh -c 'redis-cli --scan --pattern "notif:*" | xargs -r redis-cli DEL'

# Opsi B: Jika aman untuk membersihkan seluruh temporary cache redis
docker exec -it muhsin_redis redis-cli FLUSHDB
```

---

## 5. Menjalankan Sekali Jalan (Non-Interactive / One-Liner Bash)

Jika ingin menjalankan sekaligus tanpa masuk interaktif psql:

```bash
docker exec -i muhsin_postgres psql -U muhsin_admin -d muhsin_db << 'EOF'
BEGIN;
UPDATE schools
SET name = 'SMP Islam Terpadu AL FITRAH'
WHERE name = 'SMP IT Al Fitrah - Demo' OR slug = 'alfitrah';

UPDATE notifications
SET title = 'Sistem Terhubung ke Database'
WHERE title ILIKE '%PostgreSQL%';

UPDATE notifications
SET message = REPLACE(message, 'setoran & ibadah yaumiyah', 'nilai & ibadah yaumiyah')
WHERE message ILIKE '%setoran & ibadah yaumiyah%';

UPDATE notifications
SET message = REPLACE(REPLACE(message, '21.00', '23.59'), '21:00', '23:59')
WHERE message LIKE '%21.00%' OR message LIKE '%21:00%';
COMMIT;
EOF

# Invalidate cache Redis
docker exec -it muhsin_redis redis-cli FLUSHDB
```
