# Roadmap & Catatan Pengembangan Mode Offline (Level 3 & Masa Depan)

Dokumen ini mencatat rencana arsitektur dan peningkatan mode offline untuk Muhsin App saat skala aplikasi dan volume data lokal bertambah.

---

## 1. Status Implementasi Saat Ini

| Level | Fitur | Status | Detail Implementasi |
|---|---|---|---|
| **Level 1** | **Static App Shell & Read Caching** | Selesai (v1.0) | Service Worker mem-precache seluruh asset statis (PWA). Respon GET di-cache di storage lokal terisolasi tenant (`school_id` + `user_id`). |
| **Level 2** | **Offline Mutation & Background Sync** | Selesai (v1.0) | Input Yaumiyah (draft/submit) & Setoran masuk antrean `offlineQueue`. Auto-sync ke server saat koneksi internet kembali online via `OfflineBanner`. |
| **Level 3** | **Full Offline Storage (IndexedDB) & Conflict Resolution** | **Rencana (Roadmap)** | Upgrade dari `localStorage` ke `IndexedDB` untuk kapasitas besar + penanganan konflik multi-device & offline master data. |

---

## 2. Rencana Teknis Level 3 (Future Plan)

### A. Migrasi Storage ke IndexedDB / Dexie.js / TanStack Persister
- **Latar Belakang:** `localStorage` memiliki batasan ~5MB dan bersifat synchronous.
- **Rencana:**
  1. Gunakan `idb-keyval` atau `Dexie.js` untuk tabel offline client:
     - `offline_cache_queries` (data query cache)
     - `offline_sync_mutations` (antrean write)
     - `offline_drafts` (draft lokal formulir siswa & guru)
  2. Integrasikan `@tanstack/react-query-persist-client` dengan `createAsyncStoragePersister` berbasis IndexedDB.

### B. Strategi Resolusi Konflik (Conflict Resolution Strategy)
Ketika user mengedit data secara offline di Device A, sementara server / Device B sudah memiliki pembaruan yang lebih baru:
1. **Timestamp & Version Vector:**
   - Setiap entity memiliki `updated_at` / `version`.
   - Backend memvalidasi `last_known_version`.
2. **Aturan Resolusi:**
   - **Daily Ibadah (Siswa):** *Last Write Wins (LWW)* untuk tanggal yang sama berdasarkan `client_updated_at` jika masih dalam window H/H-1. Jika sudah terkunci/auto-finalize, server menolak dan mengembalikan status terkunci.
   - **Setoran Nilai (Guru):** Idempotent mutation menggunakan `idempotency_key` (UUID dari client) agar submit ulang antrean offline tidak membuat duplikasi entri setoran.
   - **Raport / Kurikulum:** Read-only saat offline.

### C. Background Sync Service Worker API
- Menggunakan browser native `PeriodicBackgroundSync` / `SyncManager` (`navigator.serviceWorker.ready.then(reg => reg.sync.register('sync-yaumiyah'))`) agar sinkronisasi bisa berjalan di background bahkan jika tab browser ditutup oleh siswa.

### D. Offline Asset Download (Dokumen / PDF / Panduan)
- Cache audio murottal atau panduan munaqosah offline untuk santri.
- Export preview raport secara offline menggunakan data lokal.

---

*Catatan: Dokumen ini dibuat agar implementasi Level 3 dapat dieksekusi secara mulus saat kebutuhan performa dan offline-first mendesak.*
