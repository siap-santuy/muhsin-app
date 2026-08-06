# AGENT.md — Rules Wajib Semua Agent (Muhsin App)

> Aturan ini berlaku untuk **setiap** agent & subagent yang bekerja di repo ini (dengan atau tanpa persona OpenAgent/OpenCoder). Detail teknis & konvensi lengkap: baca `docs/PROJECT.md` (base knowledge, utamanya #3 arsitektur, #5 business rules, #6 konvensi) dan `docs/PRD.md` (requirement produk) sebelum menyentuh kode.

---

## 1. Keamanan (Non-Negotiable)

Aplikasi multi-tenant, menyimpan data anak-anak (siswa) & keluarga. Prinsip berikut tidak boleh dikompromikan demi kecepatan:

1. **Setiap query ke tabel operasional WAJIB di-scope oleh `school_id`.** Tidak ada pengecualian. Query tanpa tenant scoping = bug keamanan kritis, bukan technical debt.
2. **RBAC diverifikasi di backend** (403 dari API), bukan hanya disembunyikan di UI.
3. **Jangan pernah log atau expose data pribadi siswa/orang tua** (telepon, nilai, catatan evaluasi) di pesan error yang bisa sampai ke client.
4. **Password & token selalu di-hash/encrypt.** Tidak ada plaintext.
5. Saat ragu apakah itu masalah keamanan — **anggap masalah keamanan**, flag ke user.

---

## 2. Standar Kualitas Kode

- **Clean Architecture — dependency arah ke dalam, tanpa kecuali** (detail `docs/PROJECT.md` #3.1). Domain layer bersih: TIDAK import Hono/Drizzle. `routes.ts` (presentation) hanya: parse → validasi Zod → panggil 1 use-case → format response. Query Drizzle hanya dari infrastructure.
- **Type safety end-to-end**: skema Zod di `packages/shared` adalah source of truth tipe, dipakai BE & FE. Jangan duplikasi definisi tipe.
- **Tidak ada `any` tanpa justifikasi eksplisit.**
- **Setiap use-case baru** butuh: validasi input (Zod), tenant scoping (repository/context, bukan hardcode), RBAC check, minimal 1 unit test (happy path + 1 edge case keamanan/otorisasi) — murni terhadap use-case (mock repository), tanpa DB nyala.
- **Formula bisnis satu tempat** (application layer backend): EXP, streak, nilai akumulasi, konversi huruf/grading. Jangan duplikasi logic di frontend; preview FE panggil endpoint/util yang sama.
- **Migration reversible & nama deskriptif** (`drizzle-kit generate --name add_xxx`), bukan `update1`.
- **React**: pisahkan logic (hooks/`features/*`) dari presentation; pecah komponen > 200 baris.
- Kategori penilaian/bobot adalah **data, bukan hardcode** — dari config/DB.

---

## 3. Definition of Done

Task selesai jika:

- [ ] Layer benar (domain/application/infrastructure/presentation) — isi file di tempat yang tepat, bukan cuma naming.
- [ ] Tenant scoping & RBAC diverifikasi, bukan diasumsikan.
- [ ] Unit test ada untuk use-case ber-logic non-trivial (EXP, streak, grading) — tanpa DB nyala.
- [ ] Tidak ada hardcode kategori/bobot nilai.
- [ ] Perubahan skema DB disertai migration reversible.
- [ ] Keputusan desain dari ambiguitas requirement dicatat (commit message/PR description).
