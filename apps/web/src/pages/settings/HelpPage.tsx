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
    question: "Bagaimana cara mengisi Ibadah Yaumiyah harian?",
    answer: "Buka menu Yaumiyah dari navigasi bawah, klik 'ISI IBADAH HARI INI', pilih tanggal yang ingin diisi (hari ini atau kemarin), lengkapi indikator sholat/tilawah/sunnah lalu tekan KIRIM.",
    role: ["student", "parent"],
  },
  {
    question: "Mengapa saya tidak bisa mengedit ibadah tanggal 2 hari lalu?",
    answer: "Pengisian dan pengeditan jurnal yaumiyah dibatasi pada window H (hari ini) dan H-1 (kemarin). Tanggal lebih lama otomatis dikunci oleh sistem.",
    role: ["student", "parent"],
  },
  {
    question: "Bagaimana perhitungan EXP dan Level naik?",
    answer: "EXP didapatkan dari setiap pengiriman jurnal ibadah lengkap dan setoran hafalan yang diverifikasi guru. Level naik otomatis ketika akumulasi EXP mencapai ambang batas.",
    role: ["student", "parent"],
  },
  {
    question: "Bagaimana guru menginput setoran Ziyadah & Muroja'ah?",
    answer: "Guru masuk ke menu Utama Pembimbing, pilih 'Input Ziyadah' atau 'Input Muroja'ah', pilih siswa dari daftar halaqah, lalu masukkan capaian ayat dan nilai performance (0-100).",
    role: ["teacher"],
  },
  {
    question: "Bagaimana cara memasang / mengunduh aplikasi di HP?",
    answer: "Untuk Android/Chrome: Klik tombol 'Unduh' yang muncul di aplikasi atau menu titik tiga browser lalu pilih 'Install App' / 'Tambahkan ke Layar Utama'. Untuk iOS Safari: Klik tombol Share (ikon kotak panah ke atas) lalu pilih 'Add to Home Screen' (Tambah ke Layar Utama).",
    role: ["student", "parent", "teacher"],
  },
  {
    question: "Bagaimana cara mencetak / mendownload Raport Bulanan?",
    answer: "Buka menu Raport, pilih bulan atau semester yang diinginkan, kemudian klik tombol 'UNDUH RAPORT' di bagian bawah halaman untuk mencetak atau menyimpan format PDF.",
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
                  <div className="border-t border-brand-line/40 bg-gray-50/50 px-4 py-3 text-xs text-brand-navy/90 leading-relaxed">
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
