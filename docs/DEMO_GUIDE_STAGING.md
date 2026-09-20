# Panduan Demo & Testing Aplikasi Muhsin (Staging)

Panduan ini berisi daftar kredensial bawaan dari hasil *database seeding* (`docs/data-seed.xlsx` & `apps/api/src/db/seed.ts`), serta alur skenario demo *end-to-end* untuk seluruh peran pengguna (*Koordinator TTQ*, *Guru*, *Siswa*, dan *Orang Tua*).

---

## 1. Informasi Tenant / Sekolah Demo

- **Nama Sekolah**: SMP IT Al Fitrah - Demo
- **School Slug**: `alfitrah`
- **Tahun Ajaran Aktif**: `2025/2026` (Semester Ganjil)
- **URL Staging**: `https://staging.muhsin.id` (atau `http://staging.muhsin.id`)
- **API Staging**: `https://api-staging.muhsin.id` (atau `http://api-staging.muhsin.id`)

---

## 2. Kredensial Akun Demo Berdasarkan Role

Semua akun terbuat otomatis saat menjalankan `docker compose -f docker-compose.staging.yml run --rm api bun run db:seed`.

### A. Role Koordinator TTQ (Super Admin Akademik)
Role tertinggi untuk manajemen kurikulum Al-Qur'an, data guru, kelas, halaqah, dan rekapitulasi penilaian.

- **Username / Identifier**: `koordinator` atau `koordinator@alfitrah.demo`
- **Password**: `muhsin123`
- **Akses Menu Utama**:
  - Manajemen Guru & Penguji Munaqosah
  - Manajemen Kelas & Pembagian Kelompok Halaqah / Setoran
  - Kategori Penilaian (Tahfidz: Ziyadah, Murojaah, Ujian & Tahsin: Sabqi, Tilawah, dll.)
  - Penjadwalan & Pengaturan Ujian Munaqosah
  - Rekapitulasi Rapor & Sertifikat

---

### B. Role Guru / Pengampu Halaqah
Role pendidik untuk mengelola absensi halaqah, mencatat setoran hafalan harian, dan memberikan penilaian munaqosah.

- **Contoh Akun 1**:
  - **Username / Identifier**: `asa` atau `asa@alfitrah.sch.id`
  - **Password**: `muhsin123`
- **Contoh Akun 2**:
  - **Username / Identifier**: `mzn` atau `mzn@alfitrah.sch.id`
  - **Password**: `muhsin123`
- **Akses Menu Utama**:
  - Daftar Siswa Bimbingan / Halaqah
  - Form Input Setoran Ziyadah (Surah, Ayat Awal - Ayat Akhir, Skor Tajwid & Kelancaran)
  - Form Input Setoran Murojaah
  - Penilaian Ujian Munaqosah (sesuai penugasan koordinator)
  - Catatan Evaluasi & Mutaba'ah

---

### C. Role Siswa
Role santri/siswa untuk melihat perkembangan hafalan, tracking target juz, EXP/streak harian, dan jadwal munaqosah.

- **Format Login**:
  - **Username**: Terdaftar di sistem (contoh: `dara.indah` atau email siswa)
  - **Password**: Format 8 digit tanggal lahir `DDMMYYYY` (atau fallback `muhsin123`)
- **Contoh Akun**:
  - **Email / Username**: `nengdara.hdr@gmail.com`
  - **Password**: `15042014`
- **Akses Menu Utama**:
  - Dashboard Capaian Hafalan (Juz selesai, Surah berjalan)
  - Gamifikasi: EXP, Level, dan Daily Streak
  - Riwayat Setoran & Catatan Guru
  - Jadwal & Hasil Ujian Munaqosah

---

### D. Role Orang Tua (Wali Santri)
Role orang tua untuk memantau mutaba'ah ibadah harian anak di rumah dan melihat histori setoran di sekolah.

- **Contoh Akun**:
  - **Username / Identifier**: `ortu_daraindahpertiwi`
  - **Password**: `muhsin123`
- **Akses Menu Utama**:
  - Profil Anak (terhubung langsung ke akun siswa terkait)
  - Monitoring Mutaba'ah Ibadah Harian (Sholat 5 waktu, Dhuha, Tahajjud, dll.)
  - Pantauan Progres Hafalan & Catatan Guru Pembimbing

---

## 3. Skenario Demo End-to-End (Alur Lengkap)

Ikuti alur berikut untuk mendemonstrasikan proses integrasi sistem dari hulu ke hilir:

```text
[ 1. Koordinator TTQ ]  ───> Atur Kategori, Guru, & Kelompok Halaqah
          │
          ▼
[ 2. Guru Halaqah ]     ───> Input Setoran Siswa (Ziyadah / Murojaah)
          │
          ├────────────────────────┐
          ▼                        ▼
[ 3. Siswa ] (EXP & Progres)    [ 4. Orang Tua ] (Mutaba'ah & Monitoring)
```

---

### Langkah 1: Pengaturan Akademik oleh Koordinator TTQ
1. Buka `https://staging.muhsin.id` di browser.
2. Pastikan sub-sekolah/slug mengarah ke `alfitrah`.
3. Login menggunakan:
   - Identifier: `koordinator`
   - Password: `muhsin123`
4. Masuk ke halaman **Admin / Koordinator**:
   - Tunjukkan daftar kelas yang terisi dari Excel (`VII-A`, `VIII-B`, dll.).
   - Tunjukkan pemetaan guru pengampu halaqah ke daftar siswa.
   - Tunjukkan pengaturan kategori penilaian (skala nilai Mumtaz, Jayyid Jiddan, dll.).
5. Logout.

---

### Langkah 2: Input Setoran Hafalan oleh Guru
1. Login sebagai Guru:
   - Identifier: `asa`
   - Password: `muhsin123`
2. Buka menu **Halaqah / Bimbingan**:
   - Pilih salah satu siswa bimbingan (misal: Dara Indah Pertiwi).
   - Klik tombol **Tambah Setoran Ziyadah**.
   - Masukkan detail setoran:
     - Surah & Rentang Ayat (misal: An-Naba' 1 - 20).
     - Nilai Tajwid: `95`.
     - Nilai Kelancaran: `92`.
     - Catatan Guru: *"Makhraj huruf 'Ain dan Ha sudah sangat baik, lanjutkan."*
   - Simpan setoran.
3. Tunjukkan riwayat setoran yang langsung terupdate.
4. Logout.

---

### Langkah 3: Verifikasi Progres & Gamifikasi oleh Siswa
1. Login sebagai Siswa:
   - Identifier: `nengdara.hdr@gmail.com`
   - Password: `15042014`
2. Tunjukkan **Dashboard Siswa**:
   - Indikator EXP bertambah dari setoran yang baru diinput oleh guru.
   - Indikator Streak harian aktif.
   - Halaman riwayat menunjukkan setoran surah terbaru beserta feedback dari guru.
3. Logout.

---

### Langkah 4: Pemantauan & Mutaba'ah oleh Orang Tua
1. Login sebagai Orang Tua:
   - Identifier: `ortu_daraindahpertiwi`
   - Password: `muhsin123`
2. Tunjukkan **Dashboard Wali Santri**:
   - Nama anak muncul secara otomatis.
   - Riwayat setoran anak di sekolah dapat dilihat secara transparan.
   - Buka menu **Mutaba'ah Harian**: orang tua dapat mengisi checklist ibadah anak di rumah (misal sholat fardhu berjamaah dan tilawah).
3. Selesai.
