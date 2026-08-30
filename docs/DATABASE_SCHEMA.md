# DATABASE_SCHEMA.md — Muhsin App ERD & DBML

Dokumen ini berisi representasi skema database PostgreSQL Muhsin App (18 tabel) dalam format **DBML (Database Markup Language)** yang dapat langsung di-copy ke [dbdiagram.io](https://dbdiagram.io).

---

## 📊 DBML Code (dbdiagram.io)

```dbml
// ==========================================
// ENUMS
// ==========================================

Enum school_jenjang {
  SD
  SMP
  SMA
  MA
}

Enum subscription_tier {
  small
  medium
  large
}

Enum user_role {
  koordinator_ttq
  teacher
  parent
  student
}

Enum ibadah_status {
  draft
  submitted
}

Enum exp_source_type {
  daily_ibadah
  setoran
  streak_bonus
  munaqosah
}

Enum achievement_type {
  munaqosah_juz
}

Enum ibadah_aspect {
  sholat_fardhu
  sholat_rawatib
  tahajud_dhuha_tilawah
  puasa_sunnah
}

Enum munaqosah_period_status {
  draft
  buka
  tutup
}

Enum munaqosah_request_status {
  diajukan
  disetujui
  dijadwalkan
  lulus
  tidak_lulus
  ditolak
}

Enum munaqosah_hasil {
  belum
  lulus
  tidak_lulus
}

// ==========================================
// 1. TENANCY & MASTER
// ==========================================

Table schools {
  id uuid [pk, default: `gen_random_uuid()`]
  name text [not null]
  jenjang school_jenjang [not null]
  npsn text
  address text
  active_academic_period_id uuid
  subscription_tier subscription_tier [not null, default: 'small']
  created_at timestamp [not null, default: `now()`]
}

Table users {
  id uuid [pk, default: `gen_random_uuid()`]
  school_id uuid [not null, ref: > schools.id]
  role user_role [not null]
  name text [not null]
  email text [not null]
  password_hash text [not null]
  phone text
  created_at timestamp [not null, default: `now()`]
}

Table classes {
  id uuid [pk, default: `gen_random_uuid()`]
  school_id uuid [not null, ref: > schools.id]
  name text [not null]
  jenjang_level text
  created_at timestamp [not null, default: `now()`]
}

Table academic_periods {
  id uuid [pk, default: `gen_random_uuid()`]
  school_id uuid [not null, ref: > schools.id]
  tahun_ajaran text [not null]
  semester text [not null]
  is_locked boolean [not null, default: false]
  locked_until timestamp
  created_at timestamp [not null, default: `now()`]
}

Ref: schools.active_academic_period_id > academic_periods.id

// ==========================================
// 2. MAPPINGS
// ==========================================

Table student_class_enrollment {
  id uuid [pk, default: `gen_random_uuid()`]
  student_id uuid [not null, ref: > users.id]
  class_id uuid [not null, ref: > classes.id]
  school_id uuid [not null, ref: > schools.id]
  academic_period_id uuid [not null, ref: > academic_periods.id]
}

Table student_teacher_mapping {
  id uuid [pk, default: `gen_random_uuid()`]
  student_id uuid [not null, ref: > users.id]
  teacher_id uuid [not null, ref: > users.id]
  class_id uuid [not null, ref: > classes.id]
  school_id uuid [not null, ref: > schools.id]
}

Table parent_student_mapping {
  id uuid [pk, default: `gen_random_uuid()`]
  parent_id uuid [not null, ref: > users.id]
  student_id uuid [not null, ref: > users.id]
  school_id uuid [not null, ref: > schools.id]
}

Table teacher_classes {
  id uuid [pk, default: `gen_random_uuid()`]
  school_id uuid [not null, ref: > schools.id]
  teacher_id uuid [not null, ref: > users.id]
  class_id uuid [not null, ref: > classes.id]
  created_at timestamp [not null, default: `now()`]
}

// ==========================================
// 3. ASSESSMENT CONFIG (DATA-DRIVEN)
// ==========================================

Table assessment_categories {
  id uuid [pk, default: `gen_random_uuid()`]
  school_id uuid [not null, ref: > schools.id]
  academic_period_id uuid [not null, ref: > academic_periods.id]
  code text [not null]
  name text [not null]
  icon text
  is_active boolean [not null, default: true]
  order integer [not null, default: 0]
  created_at timestamp [not null, default: `now()`]
}

Table assessment_subcategories {
  id uuid [pk, default: `gen_random_uuid()`]
  category_id uuid [not null, ref: > assessment_categories.id]
  school_id uuid [not null, ref: > schools.id]
  code text [not null]
  name text [not null]
  score_fields jsonb [not null, note: '[{key, label, min, max}]']
  reference_shape jsonb [note: '{type: "surah_ayat" | "halaman"}']
  grading_scale jsonb [not null, note: '[{min, max, letter, label_latin, label_arab}]']
  include_in_ranking boolean [not null, default: false]
  is_active boolean [not null, default: true]
  order integer [not null, default: 0]
  created_at timestamp [not null, default: `now()`]
}

Table ibadah_grading_scale {
  id uuid [pk, default: `gen_random_uuid()`]
  school_id uuid [not null, ref: > schools.id]
  aspect ibadah_aspect [not null]
  scale jsonb [not null, note: '[{min, max, letter}]']
  penalty_rule jsonb [note: '{trigger: "any_T", penalty_points: -100}']
}

// ==========================================
// 4. OPERASIONAL
// ==========================================

Table daily_ibadah {
  id uuid [pk, default: `gen_random_uuid()`]
  school_id uuid [not null, ref: > schools.id]
  student_id uuid [not null, ref: > users.id]
  date date [not null]
  status ibadah_status [not null, default: 'draft']
  submitted_at timestamp
  tilawah jsonb [note: '{surah_start, ayat_start, surah_end, ayat_end}']
  sholat_fardhu jsonb [note: '{subuh, dzuhur, ashar, maghrib, isya}']
  sholat_rawatib jsonb [note: 'string[]']
  tahajud boolean [not null, default: false]
  dhuha boolean [not null, default: false]
  puasa_sunnah text
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]

  indexes {
    (student_id, date, school_id) [unique, name: 'daily_ibadah_student_date_school']
  }
}

Table setoran_entries {
  id uuid [pk, default: `gen_random_uuid()`]
  school_id uuid [not null, ref: > schools.id]
  subcategory_id uuid [not null, ref: > assessment_subcategories.id]
  student_id uuid [not null, ref: > users.id]
  teacher_id uuid [not null, ref: > users.id]
  date date [not null]
  reference_start jsonb [note: '{surah, ayat} | {halaman}']
  reference_end jsonb [note: '{surah, ayat} | {halaman}']
  scores jsonb [not null, note: '{field_key: number}']
  keterangan text
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
}

Table evaluasi_bulanan {
  id uuid [pk, default: `gen_random_uuid()`]
  school_id uuid [not null, ref: > schools.id]
  student_id uuid [not null, ref: > users.id]
  teacher_id uuid [not null, ref: > users.id]
  subcategory_id uuid [not null, ref: > assessment_subcategories.id]
  bulan text [not null, note: 'YYYY-MM']
  catatan text
  created_at timestamp [not null, default: `now()`]
}

Table hafalan_targets {
  id uuid [pk, default: `gen_random_uuid()`]
  school_id uuid [not null, ref: > schools.id]
  student_id uuid [not null, ref: > users.id]
  teacher_id uuid [not null, ref: > users.id]
  bulan text [not null, note: 'YYYY-MM']
  target_surah_start text
  target_ayat_start text
  target_surah_end text
  target_ayat_end text
  catatan text
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
}

// ==========================================
// 5. GAMIFIKASI & AUDIT
// ==========================================

Table student_gamification {
  student_id uuid [pk, ref: - users.id]
  school_id uuid [not null, ref: > schools.id]
  level integer [not null, default: 1]
  total_exp integer [not null, default: 0]
  current_streak integer [not null, default: 0]
  longest_streak integer [not null, default: 0]
  last_activity_date date
}

Table exp_transactions {
  id uuid [pk, default: `gen_random_uuid()`]
  school_id uuid [not null, ref: > schools.id]
  student_id uuid [not null, ref: > users.id]
  source_type exp_source_type [not null]
  source_id uuid
  exp_amount integer [not null]
  description text
  created_at timestamp [not null, default: `now()`]
}

Table exp_rules {
  id uuid [pk, default: `gen_random_uuid()`]
  school_id uuid [not null, ref: > schools.id]
  source_type text [not null]
  rule_key text [not null]
  exp_value integer [not null]
}

Table student_achievements {
  id uuid [pk, default: `gen_random_uuid()`]
  school_id uuid [not null, ref: > schools.id]
  student_id uuid [not null, ref: > users.id]
  achievement_type achievement_type [not null]
  juz_ke integer [note: '1-30']
  source_id uuid [ref: > munaqosah_assignments.id]
  earned_at timestamp [not null]
  created_at timestamp [not null, default: `now()`]
}

// ==========================================
// 6. MUNAQOSAH
// ==========================================

Table munaqosah_periods {
  id uuid [pk, default: `gen_random_uuid()`]
  school_id uuid [not null, ref: > schools.id]
  academic_period_id uuid [not null, ref: > academic_periods.id]
  nama text [not null]
  tanggal_mulai date [not null]
  tanggal_selesai date [not null]
  status munaqosah_period_status [not null, default: 'draft']
  created_at timestamp [not null, default: `now()`]
}

Table munaqosah_examiners {
  id uuid [pk, default: `gen_random_uuid()`]
  munaqosah_period_id uuid [not null, ref: > munaqosah_periods.id]
  teacher_id uuid [not null, ref: > users.id]
  kapasitas_siswa integer [not null]
  assigned_by uuid [not null, ref: > users.id]
  created_at timestamp [not null, default: `now()`]
}

Table munaqosah_requests {
  id uuid [pk, default: `gen_random_uuid()`]
  school_id uuid [not null, ref: > schools.id]
  student_id uuid [not null, ref: > users.id]
  teacher_id uuid [not null, ref: > users.id]
  juz_ke integer [not null]
  status munaqosah_request_status [not null, default: 'diajukan']
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
}

Table munaqosah_assignments {
  id uuid [pk, default: `gen_random_uuid()`]
  request_id uuid [not null, ref: > munaqosah_requests.id]
  period_id uuid [not null, ref: > munaqosah_periods.id]
  examiner_teacher_id uuid [not null, ref: > users.id]
  jadwal_tanggal date [not null]
  jadwal_waktu time
  scores jsonb [note: '{tajwid, kelancaran}']
  hasil munaqosah_hasil [not null, default: 'belum']
  catatan_penguji text
  assigned_by uuid [not null, ref: > users.id]
  assigned_at timestamp [not null, default: `now()`]
  completed_at timestamp
}

// ==========================================
// TABLE GROUPS
// ==========================================

TableGroup Tenancy_Master {
  schools
  users
  classes
  academic_periods
}

TableGroup Mappings {
  student_class_enrollment
  student_teacher_mapping
  parent_student_mapping
  teacher_classes
}

TableGroup Assessment_Config {
  assessment_categories
  assessment_subcategories
  ibadah_grading_scale
}

TableGroup Operational {
  daily_ibadah
  setoran_entries
  evaluasi_bulanan
  hafalan_targets
}

TableGroup Gamification {
  student_gamification
  exp_transactions
  exp_rules
  student_achievements
}

TableGroup Munaqosah {
  munaqosah_periods
  munaqosah_examiners
  munaqosah_requests
  munaqosah_assignments
}
```

---

## 📌 Cara Menggunakan di dbdiagram.io

1. Buka [https://dbdiagram.io](https://dbdiagram.io).
2. Buat diagram baru.
3. Hapus kode default di panel sebelah kiri.
4. Copy seluruh blok kode di dalam ` ```dbml ` di atas dan paste ke editor dbdiagram.
5. Diagram ERD interaktif akan ter-render otomatis.
