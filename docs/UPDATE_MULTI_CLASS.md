# Pembaruan Arsitektur & PRD: Multi-Class Guru & Card Siswa Perlu Perhatian

## 1. Pembaruan Arsitektur (docs/PROJECT.md)

### 4.1.1 Penugasan Guru (Multi-Class)
- **`teacher_classes`**: `id, school_id, teacher_id, class_id, created_at` — Relasi untuk mendukung guru mengajar lebih dari satu kelas/halaqah.
- **Scope Query**: Setiap query backend (siswa, statistik, input setoran) wajib menyertakan filter berdasarkan `class_id` yang dipilih guru pada state aplikasi (Class Switcher), dengan validasi keamanan `school_id`.

## 2. Pembaruan PRD (docs/PRD.md)

### 3. Persona & Role Pengguna (Update)
- **Guru/Pembimbing (Teacher)**:
  - Scope: Class/student-scoped (Multi-class supported).
  - Deskripsi: Guru dapat di-assign ke lebih dari satu kelas/halaqah oleh Koordinator TTQ. Antarmuka mendukung pemilihan kelas aktif (*Class Switcher*) untuk memfilter data siswa dan statistik.

### 4.3.1 Dashboard Guru (Update)
- **Siswa Perlu Perhatian (*Attention Needed*)**:
  - Deteksi otomatis siswa di kelas aktif dengan kriteria:
    1. Absen setor (Ziyadah/Murojaah) > 3 hari.
    2. Status Yaumiyah sering "Belum/Alfa" dalam 1 minggu terakhir.
  - UI: List siswa dengan indikator status urgensi & aksi cepat (Ingatkan/Arahkan ke Input Nilai).

## 3. Data Layer Design (Backend)

### Skema Database
```sql
CREATE TABLE teacher_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id),
    teacher_id UUID NOT NULL REFERENCES users(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Logika API
- **Endpoint**: `GET /api/teacher/students/attention?class_id=XYZ`
- **Logic**: Filter `students` berdasarkan `class_id` → Hitung hari sejak setoran terakhir → List siswa dengan urgensi > 3 hari → Return list terurut.
