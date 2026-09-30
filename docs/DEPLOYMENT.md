# Panduan Deployment Muhsin App (Production VPS)

Panduan ini menjelaskan arsitektur dan langkah deployment Muhsin App di VPS menggunakan **Docker Compose** dan **Nginx Reverse Proxy** untuk domain `muhsin.id` & `api.muhsin.id`.

---

## 1. Arsitektur Jaringan (Network Topology)

```text
[ Internet / Browser User (HP / Desktop) ]
                │
                ▼
      [ Nginx Host VPS (Port 80 / 443 SSL) ]
         │                              │
         │ (muhsin.id & *.muhsin.id)    │ (api.muhsin.id)
         ▼                              ▼
  [ Container Web (127.0.0.1:8080) ]   [ Container API (127.0.0.1:3001) ]
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 │                Docker Virtual Network (100% Privat)         │
                 │                                                             │
                 ▼                                                             ▼
        [ Container Postgres ]                                        [ Container Redis ]
        (postgres:5432)                                               (redis:6379)
```

- **Database (Postgres) & Redis**: 100% privat di dalam jaringan Docker internal. Port 5432 & 6379 tidak dibuka ke internet luar.
- **Web & API**: Hanya bind ke `127.0.0.1` (localhost internal VPS), lalu diekspos ke publik dengan aman melalui Nginx Host dengan sertifikat SSL (HTTPS).

---

## 2. Persiapan di VPS

### A. Install Docker & Docker Compose
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
```

### B. Install Nginx & Certbot SSL
```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

### C. Setting DNS di Domain Provider / Cloudflare
Pastikan DNS A Record mengarah ke IP publik VPS Anda:
- `@` (muhsin.id) &rarr; `IP_VPS_ANDA`
- `*` (*.muhsin.id) &rarr; `IP_VPS_ANDA`
- `api` (api.muhsin.id) &rarr; `IP_VPS_ANDA`

---

## 3. Konfigurasi Nginx di VPS

Buat file konfigurasi Nginx baru:
```bash
sudo nano /etc/nginx/sites-available/muhsin.id
```

Paste konfigurasi berikut:

```nginx
# =======================================================
# 1. API BACKEND: api.muhsin.id
# =======================================================
server {
    listen 80;
    server_name api.muhsin.id;

    # Batas ukuran upload (untuk foto profil, dll)
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# =======================================================
# 2. FRONTEND WEB: muhsin.id & *.muhsin.id (Multi-School Subdomains)
# =======================================================
server {
    listen 80;
    server_name muhsin.id *.muhsin.id;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;

        # Meneruskan Host asli agar frontend bisa mendeteksi subdomain sekolah
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Aktifkan konfigurasi dan test Nginx:
```bash
sudo ln -sf /etc/nginx/sites-available/muhsin.id /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### D. Pasang SSL Otomatis Let's Encrypt
```bash
sudo certbot --nginx -d muhsin.id -d *.muhsin.id -d api.muhsin.id
```

---

## 4. Langkah Menjalankan Aplikasi di VPS

1. **Clone Repositori di VPS**:
   ```bash
   git clone <URL_REPO_ANDA> /home/ubuntu/muhsinapp
   cd /home/ubuntu/muhsinapp
   ```

2. **Buat File `.env`**:
   ```bash
   nano .env
   ```
   Isi file `.env`:
   ```env
   DB_USER=muhsin_admin
   DB_PASSWORD=GantiPasswordPostgresKuat123!
   DB_NAME=muhsin_prod_db
   JWT_SECRET=super-secure-jwt-secret-min-32-chars-random!
   JWT_REFRESH_SECRET=super-secure-jwt-refresh-secret-min-32-chars-random!
   VAPID_PUBLIC_KEY=change-me-production-vapid-public
   VAPID_PRIVATE_KEY=change-me-production-vapid-private
   VAPID_SUBJECT=mailto:admin@muhsin.id
   ```

3. **Jalankan Container Docker**:
   ```bash
   docker compose up -d --build
   ```

4. **Jalankan Migrasi & Database Seeding**:
   ```bash
   # Jalankan migrasi tabel
   docker compose exec api bun run db:migrate

   # Jalankan seed data awal sekolah & akun
   docker compose exec api bun run db:seed
   ```

5. **Cek Status Container**:
   ```bash
   docker compose ps
   docker compose logs -f api
   ```

---

## 5. Perintah Berguna / Maintenance

- **Backup Database PostgreSQL (Direkomendasikan Sebelum Update)**:
  ```bash
  docker exec muhsin_postgres pg_dump -U muhsin_admin muhsin_prod_db > ~/backup_prod_$(date +%F_%H%M).sql
  ```
  *(Catatan Keamanan: Jangan pernah menggunakan perintah `docker compose down -v` karena flag `-v` akan menghapus storage volume database! Gunakan `docker compose down` tanpa `-v`).*

- **Update Code / Redeploy Versi Baru**:
  ```bash
  git pull origin main
  docker compose up -d --build
  docker compose exec api bun run db:migrate
  ```

- **Restart Seluruh Service**:
  ```bash
  docker compose restart
  ```

- **Menjalankan Bersamaan dengan Staging**:
  Lingkungan Production dan Staging diisolasi 100% sehingga dapat hidup bersamaan di 1 VPS:
  ```bash
  # 1. Jalankan Production:
  docker compose up -d

  # 2. Jalankan Staging:
  docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build

  # 3. Cek seluruh container aktif:
  docker ps
  ```
