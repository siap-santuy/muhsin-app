import { useState } from "react";
import { ChevronDown, HelpCircle, MessageSquare } from "lucide-react";
import { SettingsPageShell } from "@/components/settings/SettingsPageShell";
import { useAuthStore } from "@/store/authStore";

interface FaqItem {
  question: string;
  answer: string;
  role?: ("student" | "parent" | "teacher")[];
}

const FAQS: FaqItem[] = [
  {
    question: "Bagaimana cara mengisi Ibadah Yaumiyah harian (Langkah demi langkah)?",
    answer: `Langkah pengisian jurnal Yaumiyah harian:
1. Buka menu "Yaumiyah" dari navigasi bawah, lalu klik tombol "ISI IBADAH HARI INI" (atau pilih tanggal di kalender strip: hari ini H atau kemarin H-1).
2. Sholat Fardhu: Tentukan status 5 waktu sholat menggunakan kode:
   • BA : Berjamaah di Awal Waktu (+10 EXP)
   • MA : Munfarid (Sendiri) di Awal Waktu (+7 EXP)
   • BT : Berjamaah Terlambat (+5 EXP)
   • MT : Munfarid Terlambat (+3 EXP)
   • H  : Haid / Udzur Syar'i (khusus siswi)
   • T  : Tidak Sholat (0 EXP)
3. Tilawah Quran: Pilih Surah awal & nomor ayat hingga Surah akhir & nomor ayat. Jika sedang berhalangan, centang pilihan "Tidak Tilawah Hari Ini".
4. Ibadah Sunnah: Centang amalan yang dikerjakan: Sholat Rawatib (Qabliyah/Ba'diyah), Tahajud, Dhuha, atau Puasa Sunnah.
5. Simpan / Kirim: Klik "Simpan Draft" jika masih ingin diubah nanti, atau klik "KIRIM" untuk penguncian data resmi dan otomatis mengklaim EXP & Streak.`,
    role: ["student", "parent"],
  },
  {
    question: "Mengapa saya tidak bisa mengedit ibadah tanggal 2 hari lalu?",
    answer: "Pengisian dan pengeditan jurnal yaumiyah dibatasi pada window H (hari ini) dan H-1 (kemarin). Tanggal lebih lama otomatis dikunci oleh sistem untuk menjaga kedisiplinan pencatatan harian.",
    role: ["student", "parent"],
  },
  {
    question: "Bagaimana cara guru menginput nilai setoran TTQ siswa?",
    answer: `Langkah penginputan nilai setoran pembimbing TTQ:
1. Pilih Kelas Aktif: Jika mengampu lebih dari satu kelas, pilih kelas yang sesuai pada menu pemilih kelas (Class Switcher).
2. Buka Menu Siswa: Masuk ke tab "Siswa" atau "TTQ", pilih tanggal halaqah, lalu klik nama siswa yang menyetor.
3. Pilih Kategori Penilaian:
   • Ziyadah (Hafalan Baru): Tentukan Surah & Ayat awal-akhir, lalu masukkan angka nilai Tajwid & Kelancaran (0–100).
   • Muroja'ah (Pengulangan Hafalan): Tentukan Surah & Ayat awal-akhir, lalu masukkan angka nilai Tajwid & Kelancaran (0–100).
   • Sabiq (Tahsin / Buku Jilid): Tentukan Jilid & Halaman awal-akhir, lalu masukkan angka nilai Makhraj, Mad, Ghunnah, & Qolqolah (0–100).
   • Talaqi (Menyimak Bacaan Guru): Tentukan Surah & Ayat awal-akhir, lalu masukkan angka nilai Kelancaran (0–100).
4. Status Kehadiran & Catatan: Tentukan kehadiran siswa (Hadir / Izin / Sakit / Alpa) dan masukkan catatan evaluasi bimbingan.
5. Simpan Penilaian: Klik "Simpan Penilaian". Nilai langsung masuk ke rekap Raport, status siswa berubah menjadi "Sudah Dinilai", dan siswa otomatis mendapatkan reward EXP.
6. Koreksi & Ubah Kategori: Jika terjadi salah input kategori (misal Ziyadah tertukar Muroja'ah), guru pembimbing dapat langsung menekan tombol "UBAH KATEGORI" pada halaman lihat nilai tanpa perlu menghapus setoran.`,
    role: ["teacher"],
  },
  {
    question: "Apa arti status 'Siswa Perlu Perhatian' di Dashboard Guru?",
    answer: "Indikator otomatis yang menampilkan siswa pada kelas aktif yang belum menyetorkan hafalan (Ziyadah/Muroja'ah) lebih dari 3 hari, atau memiliki riwayat yaumiyah yang sering terlewat/alpa dalam 1 pekan terakhir. Guru dapat langsung menekan tombol ingatkan atau langsung menuju input nilai.",
    role: ["teacher"],
  },
  {
    question: "Bagaimana cara kerja mode Offline saat tidak ada internet?",
    answer: "Muhsin App mendukung Progressive Web App (PWA) offline. Jika koneksi terputus, Anda tetap dapat mengisi jurnal yaumiyah atau menginput setoran siswa. Data akan tersimpan aman di antrean lokal HP/perangkat dan otomatis disinkronkan ke server saat kembali terhubung ke internet.",
    role: ["student", "parent", "teacher"],
  },
  {
    question: "Bagaimana perhitungan EXP dan Level naik?",
    answer: "EXP didapatkan dari setiap pengiriman jurnal ibadah lengkap (hingga +60 EXP/hari) dan setoran hafalan yang diverifikasi guru (+20 EXP/setoran). Akumulasi EXP akan menaikkan level akun siswa secara bertahap.",
    role: ["student", "parent"],
  },
  {
    question: "Bagaimana cara memasang / mengunduh aplikasi di HP?",
    answer: "Untuk Android/Chrome: Klik tombol 'Unduh' yang muncul di aplikasi atau menu titik tiga browser lalu pilih 'Install App' / 'Tambahkan ke Layar Utama'. Untuk iOS Safari: Klik tombol Share (ikon kotak panah ke atas) lalu pilih 'Add to Home Screen' (Tambah ke Layar Utama).",
    role: ["student", "parent", "teacher"],
  },
  {
    question: "Bagaimana cara mencetak / mendownload Raport Bulanan & Semester?",
    answer: "Buka menu Raport, pilih bulan atau semester yang diinginkan, kemudian klik tombol 'UNDUH RAPORT' di bagian bawah halaman untuk mencetak atau menyimpan format PDF resmi.",
    role: ["student", "parent", "teacher"],
  },
];

export function HelpPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? "student";

  const isTeacher = role === "teacher";
  const title = isTeacher ? "Bantuan & Panduan Guru" : "Bantuan & Panduan";

  const filteredFaqs = FAQS.filter((f) => !f.role || f.role.includes(role as "student" | "parent" | "teacher"));

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  function toggle(idx: number) {
    setOpenIndex(openIndex === idx ? null : idx);
  }

  return (
    <SettingsPageShell title={title} subtitle="Pertanyaan umum &amp; panduan aplikasi">
      <div className="flex flex-col gap-4 text-brand-navy">
        {/* Header Hero */}
        <div className="flex flex-col items-center rounded-2xl border border-brand-line bg-white p-5 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-cyan/10 text-brand-cyan">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-base font-bold">Pusat Bantuan Muhsin App</h2>
          <p className="mt-1 text-xs text-brand-text-muted">
            Temukan jawaban atas pertanyaan seputar penggunaan aplikasi di sini.
          </p>
        </div>

        {/* FAQ List Accordion */}
        <div className="space-y-2">
          {filteredFaqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={faq.question}
                className="rounded-2xl border border-brand-line bg-white shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="flex w-full items-center justify-between p-4 text-left font-bold text-xs text-brand-navy hover:bg-gray-50"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-brand-cyan transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen ? (
                  <div className="border-t border-brand-line/40 bg-gray-50/50 px-4 py-3 text-xs text-brand-navy/90 leading-relaxed whitespace-pre-line">
                    {faq.answer}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Contact Admin Card */}
        <div className="mt-2 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-brand-navy">Butuh bantuan lebih lanjut?</h4>
              <p className="text-[11px] text-brand-text-muted">Hubungi Koordinator TTQ / Admin Sekolah</p>
            </div>
          </div>
        </div>
      </div>
    </SettingsPageShell>
  );
}
