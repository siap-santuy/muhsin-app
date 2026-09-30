import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// ===== Types (match backend entities) =====
export interface RaportStudent {
  id: string;
  name: string;
  email: string;
  className: string;
  pembimbingName: string;
}

export interface RaportPeriod {
  month?: string;
  year?: string;
  semester?: string;
  tahunAjaran?: string;
}

export interface RaportNilaiTtqItem {
  grade: string;
  score: string;
  arabicPredicate: string;
  capaian: string;
}

export interface RaportNilaiTtq {
  tahfidz: RaportNilaiTtqItem;
  tahsin: RaportNilaiTtqItem;
}

export interface RaportDetailTtq {
  ziyadah: number;
  murojaah: number;
  makhroj: number;
  mad: number;
  ghunnah: number;
  kelancaran: number;
}

export interface RaportAbsensi {
  kehadiranRatio: string;
  tidakSetoranCount: number;
  sakitCount: number;
  izinCount: number;
  alpaCount: number;
}

export interface RaportMutabaahRow {
  label: string;
  ratio: string;
  grade: string;
  color?: string;
}

export interface RaportSumatifTestTahfidz {
  grade?: string;
  score?: string;
  arabicPredicate?: string;
  capaian?: string;
  tajwid?: string;
  kelancaran?: string;
}

export interface RaportSumatifTestTilawah {
  grade?: string;
  score?: string;
  arabicPredicate?: string;
  capaian?: string;
  tajwid?: string;
  kelancaran?: string;
}

export interface RaportSumatifTestTertulis {
  grade?: string;
  score?: string;
  arabicPredicate?: string;
  materi?: string;
}

export interface RaportSumatif {
  testTahfidz: RaportSumatifTestTahfidz;
  testTilawah: RaportSumatifTestTilawah;
  testTertulis: RaportSumatifTestTertulis;
}

export interface MonthlyRaportData {
  student: RaportStudent;
  period: RaportPeriod;
  nilaiTtq: RaportNilaiTtq;
  detailTtq: RaportDetailTtq;
  absensi: RaportAbsensi;
  mutabaah: RaportMutabaahRow[];
  evaluasi: string | null;
  sumatif?: RaportSumatif;
}

export interface SemesterRaportData {
  student: RaportStudent;
  period: RaportPeriod;
  nilaiAkhir: number;
  gradeAkhir: string;
  arabicPredicate: string;
  nilaiTtq: RaportNilaiTtq;
  detailTtq: RaportDetailTtq;
  absensi: RaportAbsensi;
  mutabaah: RaportMutabaahRow[];
  evaluasi: string | null;
  sumatif?: RaportSumatif;
}

async function loadLogoDataUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) ?? '');
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

function escapeHtml(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMonthYear(monthStr?: string, yearStr?: string): string {
  if (!monthStr) return yearStr || '-';
  const MONTHS_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  if (monthStr.includes('-')) {
    const [y, m] = monthStr.split('-').map(Number);
    if (m >= 1 && m <= 12) {
      return `${MONTHS_ID[m - 1]} ${y}`;
    }
  }
  const mNum = parseInt(monthStr, 10);
  if (!isNaN(mNum) && mNum >= 1 && mNum <= 12) {
    return `${MONTHS_ID[mNum - 1]} ${yearStr || ''}`.trim();
  }
  return `${monthStr} ${yearStr || ''}`.trim();
}

export async function exportRaportPdf(
  data: MonthlyRaportData | SemesterRaportData,
  _schoolName = 'SMP ISLAM TERPADU AL FITRAH',
  reportType: 'monthly' | 'semester' = 'monthly'
): Promise<void> {
  const [smpLogo, ttqLogo] = await Promise.all([
    loadLogoDataUrl('/brand/logo_smp_exact.jpg'),
    loadLogoDataUrl('/brand/logo_ttq_exact.png'),
  ]);

  const student = data.student ?? ({} as RaportStudent);
  const period = data.period ?? ({} as RaportPeriod);
  const nilaiTtq = (data.nilaiTtq ?? {}) as RaportNilaiTtq;
  const absensi = (data.absensi ?? {}) as RaportAbsensi;
  const mutabaah = data.mutabaah ?? [];
  const evaluasi = data.evaluasi ?? '';
  const sumatif = (data as SemesterRaportData).sumatif;
  
  // Hitung nilai akhir jika belum ada di payload (misal monthly)
  let nilaiAkhir = (data as SemesterRaportData).nilaiAkhir;
  if (nilaiAkhir === undefined || nilaiAkhir === null || isNaN(nilaiAkhir) || nilaiAkhir === 0) {
    const s1 = parseFloat(nilaiTtq.tahfidz?.score || '0');
    const s2 = parseFloat(nilaiTtq.tahsin?.score || '0');
    if (s1 > 0 || s2 > 0) {
      nilaiAkhir = (s1 > 0 && s2 > 0) ? (s1 + s2) / 2 : (s1 || s2);
    } else {
      nilaiAkhir = 0;
    }
  }

  const tahfidz = nilaiTtq.tahfidz ?? ({} as RaportNilaiTtqItem);
  const tahsin = nilaiTtq.tahsin ?? ({} as RaportNilaiTtqItem);

  const denom = (() => {
    const m = String(absensi.kehadiranRatio ?? '').match(/\/(\d+)/);
    return m ? m[1] : '40';
  })();

  const semLabel = period.semester
    ? period.semester === '1'
      ? 'Satu (Ganjil)'
      : period.semester === '2'
      ? 'Dua (Genap)'
      : period.semester
    : 'Dua (Genap)';

  const tahunPelajaran = reportType === 'monthly'
    ? (period.year ?? '2025/2026')
    : (period.tahunAjaran ?? '2025/2026');

  const semesterNum = period.semester ?? '2';

  const defaultMutabaah = [
    { label: 'Tilawah', grade: 'A' },
    { label: 'Shalat Fardhu', grade: 'A' },
    { label: 'Shalat Sunnah', grade: 'B' },
    { label: 'Tahajud', grade: 'A' },
    { label: 'Dhuha', grade: 'A' },
    { label: 'Shaum', grade: 'A' },
  ];

  const mutabaahRows = mutabaah.length > 0
    ? mutabaah.map(m => ({ label: m.label, grade: m.grade || '-' }))
    : defaultMutabaah;

  const scoreFormatted = Number(nilaiAkhir).toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const evalText = evaluasi || 'Alhamdulillah semakin hari ananda semakin semangat menghafalnya, semoga tetap istiqomah. Barakallah fiik.';
  const periodDisplay = reportType === 'monthly' ? formatMonthYear(period.month, period.year) : semLabel;
  const footerLabel = reportType === 'monthly' ? `Nilai TTQ Bulan ${periodDisplay}` : `Nilai TTQ Semester ${semesterNum}`;

  // Build offscreen container for html2canvas
  const renderContainer = document.createElement('div');
  renderContainer.id = 'raport-offscreen-host';
  Object.assign(renderContainer.style, {
    position: 'fixed',
    top: '-20000px',
    left: '0',
    width: '612pt',
    zIndex: '-1000',
    background: '#ffffff',
  });

  renderContainer.innerHTML = `
<style>
  #raport-offscreen-host {
    font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
    color: #000;
    -webkit-font-smoothing: antialiased;
  }
  #raport-offscreen-host table,
  #raport-offscreen-host tr,
  #raport-offscreen-host td,
  #raport-offscreen-host div,
  #raport-offscreen-host span,
  #raport-offscreen-host p {
    box-sizing: border-box;
    margin: 0;
  }
  .pdf-page-card {
    width: 612pt !important;
    height: 792pt !important;
    padding: 36pt 18pt 24pt 18pt !important;
    background: #ffffff !important;
    box-sizing: border-box !important;
    position: relative;
    overflow: hidden;
  }
  .outer-border-box {
    border: 1.5pt solid #000 !important;
    width: 100% !important;
    box-sizing: border-box !important;
    display: flex;
    flex-direction: column;
  }
  .grid-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 11pt;
    color: #000;
  }
  .grid-table td {
    border: 1.2pt solid #000;
    padding: 0;
    vertical-align: middle;
  }
  .c-inner {
    padding: 3pt 6pt;
    line-height: 1.25;
    display: flex;
    align-items: center;
    min-height: 20pt;
    width: 100%;
    box-sizing: border-box;
  }
  .c-center {
    justify-content: center;
    text-align: center;
  }
  .c-between {
    justify-content: space-between;
  }
  .c-bold {
    font-weight: bold;
  }
  .section-bar {
    font-weight: bold;
    font-size: 11pt;
    border-top: 1.2pt solid #000;
    border-bottom: 1.2pt solid #000;
    background: #fff;
    padding: 4pt 0;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 22pt;
    line-height: 1.2;
  }
  .arabic-title {
    font-family: "Traditional Arabic", "Noto Naskh Arabic", "Amiri", "Arabic Typesetting", serif;
    font-size: 16pt;
    font-weight: bold;
    text-align: center;
    line-height: 1.2;
    padding: 3pt 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 26pt;
  }
  .col-1 { width: 15.18%; }
  .col-2 { width: 11.98%; }
  .col-3 { width: 7.47%; }
  .col-4 { width: 14.35%; }
  .col-5 { width: 10.08%; }
  .col-6 { width: 6.52%; }
  .col-7 { width: 11.27%; }
  .col-8 { width: 4.63%; }
  .col-9 { width: 6.52%; }
  .col-10 { width: 11.98%; }
</style>

<!-- ==================== HALAMAN 1 ==================== -->
<div class="pdf-page-card" id="pdf-p1">
  <div class="outer-border-box">

    <!-- Header Table: Logo SMP, Judul Center, Logo TTQ -->
    <table style="width: 100%; border-collapse: collapse; border-bottom: 1.5pt solid #000;">
      <tr>
        <td style="width: 95pt; text-align: center; vertical-align: middle; padding: 6pt 4pt;">
          ${smpLogo ? `<img src="${smpLogo}" style="width: 82pt; height: 75pt; object-fit: contain;" />` : ''}
        </td>
        <td style="text-align: center; vertical-align: middle; line-height: 1.25; padding: 6pt 0;">
          <div style="font-size: 12.5pt; font-weight: bold; letter-spacing: 0.3px;">LAPORAN PENCAPAIAN</div>
          <div style="font-size: 12pt; font-weight: bold;">TAHSIN TAHFIZH AL QURAN (TTQ)</div>
          <div style="font-size: 12pt; font-weight: bold;">SMP ISLAM TERPADU AL FITRAH</div>
          <div style="font-size: 12pt; font-weight: bold;">TAHUN PELAJARAN ${escapeHtml(tahunPelajaran)}</div>
        </td>
        <td style="width: 115pt; text-align: center; vertical-align: middle; padding: 6pt 4pt;">
          ${ttqLogo ? `<img src="${ttqLogo}" style="width: 108pt; height: 72pt; object-fit: contain;" />` : ''}
        </td>
      </tr>
    </table>

    <!-- Identitas Table -->
    <table style="width: 100%; border-collapse: collapse; border-bottom: 1.5pt solid #000; font-size: 11pt;">
      <tr>
        <td style="width: 115pt; padding: 3pt 8pt;">Nama</td>
        <td style="width: 12pt; text-align: center;">:</td>
        <td style="padding: 3pt 6pt; font-weight: bold;">${escapeHtml(student.name ?? 'Evra Elya Najma Aris')}</td>
      </tr>
      <tr>
        <td style="padding: 3pt 8pt;">Kelas</td>
        <td style="text-align: center;">:</td>
        <td style="padding: 3pt 6pt;">${escapeHtml(student.className ?? 'VII Ali bin Abi Thalib')}</td>
      </tr>
      <tr>
        <td style="padding: 3pt 8pt;">${reportType === 'monthly' ? 'Bulan' : 'Semester'}</td>
        <td style="text-align: center;">:</td>
        <td style="padding: 3pt 6pt;">${escapeHtml(periodDisplay)}</td>
      </tr>
      <tr>
        <td style="padding: 3pt 8pt;">Pembimbing</td>
        <td style="text-align: center;">:</td>
        <td style="padding: 3pt 6pt;">${escapeHtml(student.pembimbingName ?? 'Sahri Fauzan, S.Pd.')}</td>
      </tr>
    </table>

    <!-- TTQ Table -->
    <table class="grid-table">
      <colgroup>
        <col class="col-1" /><col class="col-2" /><col class="col-3" /><col class="col-4" /><col class="col-5" />
        <col class="col-6" /><col class="col-7" /><col class="col-8" /><col class="col-9" /><col class="col-10" />
      </colgroup>
      <tr>
        <td colspan="5"><div class="c-inner c-center c-bold">Al-Quran</div></td>
        <td colspan="5"><div class="c-inner c-center c-bold">Tilawah Metode Sabiq</div></td>
      </tr>
      <tr>
        <td colspan="5"><div class="arabic-title">${escapeHtml(tahfidz.arabicPredicate || 'ممتاز')}</div></td>
        <td colspan="5"><div class="arabic-title">${escapeHtml(tahsin.arabicPredicate || 'ممتاز')}</div></td>
      </tr>
      <tr style="font-size: 10pt;">
        <td colspan="5"><div class="c-inner c-center">${escapeHtml(tahfidz.capaian || 'QS. Juz 29 - Al Mujadalah dan Al Hasyir')}</div></td>
        <td colspan="5"><div class="c-inner c-center">${escapeHtml(tahsin.capaian || 'Jilid 4 : 221-240')}</div></td>
      </tr>
      <tr>
        <td colspan="2"><div class="c-inner c-between"><span>Tajwid</span><span>: ${escapeHtml(tahfidz.score ?? '95')}</span></div></td>
        <td colspan="3"><div class="c-inner c-between"><span>Kelancaran</span><span>: ${escapeHtml(tahfidz.score ?? '95')}</span></div></td>
        <td colspan="5"><div class="c-inner c-between"><span>Nilai</span><span>: ${escapeHtml(tahsin.score ?? '95')}</span></div></td>
      </tr>
    </table>

    <!-- Sumatif Section -->
    <div class="section-bar">
      HASIL ASESMEN SUMATIF TTQ SEMESTER ${escapeHtml(semesterNum)}
    </div>
    <table class="grid-table">
      <colgroup>
        <col class="col-1" /><col class="col-2" /><col class="col-3" /><col class="col-4" /><col class="col-5" />
        <col class="col-6" /><col class="col-7" /><col class="col-8" /><col class="col-9" /><col class="col-10" />
      </colgroup>
      <tr>
        <td colspan="5"><div class="c-inner c-center c-bold">Tes Tahfizh Al Qur'an</div></td>
        <td colspan="5"><div class="c-inner c-center c-bold">Tes Tilawah Metode Sabiq</div></td>
      </tr>
      <tr>
        <td colspan="5"><div class="arabic-title">${escapeHtml(sumatif?.testTahfidz?.arabicPredicate || 'ممتاز')}</div></td>
        <td colspan="5"><div class="arabic-title">${escapeHtml(sumatif?.testTilawah?.arabicPredicate || 'ممتاز')}</div></td>
      </tr>
      <tr style="font-size: 10pt;">
        <td colspan="5"><div class="c-inner c-center">${escapeHtml(sumatif?.testTahfidz?.capaian || 'QS. Juz 29 - Al Mujadalah dan Al Hasyir')}</div></td>
        <td colspan="5"><div class="c-inner c-center">${escapeHtml(sumatif?.testTilawah?.capaian || 'QS. Jilid 4 : 221-240')}</div></td>
      </tr>
      <tr>
        <td colspan="3"><div class="c-inner"><span>Tajwid</span></div></td>
        <td colspan="2"><div class="c-inner c-center"><span>${escapeHtml(sumatif?.testTahfidz?.tajwid ?? '94')}</span></div></td>
        <td colspan="3"><div class="c-inner"><span>Tajwid</span></div></td>
        <td colspan="2"><div class="c-inner c-center"><span>${escapeHtml(sumatif?.testTilawah?.tajwid ?? '93')}</span></div></td>
      </tr>
      <tr>
        <td colspan="3"><div class="c-inner"><span>Kelancaran</span></div></td>
        <td colspan="2"><div class="c-inner c-center"><span>${escapeHtml(sumatif?.testTahfidz?.kelancaran ?? '98')}</span></div></td>
        <td colspan="3"><div class="c-inner"><span>Kelancaran</span></div></td>
        <td colspan="2"><div class="c-inner c-center"><span>${escapeHtml(sumatif?.testTilawah?.kelancaran ?? '94')}</span></div></td>
      </tr>
    </table>

    <!-- Tes Tertulis -->
    <div class="section-bar">
      TES TERTULIS
    </div>
    <table class="grid-table">
      <colgroup>
        <col class="col-1" /><col class="col-2" /><col class="col-3" /><col class="col-4" /><col class="col-5" />
        <col class="col-6" /><col class="col-7" /><col class="col-8" /><col class="col-9" /><col class="col-10" />
      </colgroup>
      <tr>
        <td colspan="6"><div class="c-inner" style="min-height: 32pt;">Materi : ${escapeHtml(sumatif?.testTertulis?.materi || 'Pengetahuan Ilmu Tajwid Metode Sabiq')}</div></td>
        <td colspan="2"><div class="c-inner c-center c-bold" style="font-size: 16pt; min-height: 32pt;">${escapeHtml(sumatif?.testTertulis?.score ?? '100')}</div></td>
        <td colspan="2"><div class="c-inner c-center c-bold" style="font-size: 16pt; min-height: 32pt;">${escapeHtml(sumatif?.testTertulis?.grade ?? 'A')}</div></td>
      </tr>
    </table>

    <!-- Laporan Mutabaah Yaumiyyah -->
    <div class="section-bar">
      LAPORAN MUTABA'AH YAUMIYYAH
    </div>
    <table class="grid-table">
      <colgroup>
        <col class="col-1" /><col class="col-2" /><col class="col-3" /><col class="col-4" /><col class="col-5" />
        <col class="col-6" /><col class="col-7" /><col class="col-8" /><col class="col-9" /><col class="col-10" />
      </colgroup>
      ${mutabaahRows.map(r => `
      <tr>
        <td colspan="8"><div class="c-inner">${escapeHtml(r.label)}</div></td>
        <td colspan="2"><div class="c-inner">: ${escapeHtml(r.grade)}</div></td>
      </tr>
      `).join('')}
      <tr>
        <td colspan="4"><div class="c-inner">Keterangan Munaqosyah</div></td>
        <td colspan="2"><div class="c-inner">: Juz 29</div></td>
        <td colspan="2"><div class="c-inner">Nilai</div></td>
        <td colspan="2"><div class="c-inner">: A</div></td>
      </tr>
    </table>

    <!-- Absensi Siswa Header & Kehadiran (Hal 1) -->
    <div class="section-bar">
      ABSENSI SISWA
    </div>
    <table class="grid-table">
      <colgroup>
        <col class="col-1" /><col class="col-2" /><col class="col-3" /><col class="col-4" /><col class="col-5" />
        <col class="col-6" /><col class="col-7" /><col class="col-8" /><col class="col-9" /><col class="col-10" />
      </colgroup>
      <tr>
        <td colspan="8"><div class="c-inner">Kehadiran</div></td>
        <td colspan="2"><div class="c-inner">: ${escapeHtml(absensi.kehadiranRatio ?? `40/${denom}`)}</div></td>
      </tr>
    </table>

  </div>
</div>

<!-- ==================== HALAMAN 2 ==================== -->
<div class="pdf-page-card" id="pdf-p2">
  <div class="outer-border-box">

    <!-- Sisa Absensi (Hal 2) -->
    <table class="grid-table">
      <colgroup>
        <col class="col-1" /><col class="col-2" /><col class="col-3" /><col class="col-4" /><col class="col-5" />
        <col class="col-6" /><col class="col-7" /><col class="col-8" /><col class="col-9" /><col class="col-10" />
      </colgroup>
      <tr>
        <td colspan="8"><div class="c-inner">Tidak Setoran</div></td>
        <td colspan="2"><div class="c-inner">: ${escapeHtml(absensi.tidakSetoranCount ?? 3)}/${escapeHtml(denom)}</div></td>
      </tr>
      <tr>
        <td colspan="8"><div class="c-inner">Alpa</div></td>
        <td colspan="2"><div class="c-inner">: ${escapeHtml(absensi.alpaCount ?? 0)}/${escapeHtml(denom)}</div></td>
      </tr>
      <tr>
        <td colspan="8"><div class="c-inner">Izin</div></td>
        <td colspan="2"><div class="c-inner">: ${escapeHtml(absensi.izinCount ?? 0)}/${escapeHtml(denom)}</div></td>
      </tr>
      <tr>
        <td colspan="8"><div class="c-inner">Sakit</div></td>
        <td colspan="2"><div class="c-inner">: ${escapeHtml(absensi.sakitCount ?? 0)}/${escapeHtml(denom)}</div></td>
      </tr>
    </table>

    <!-- Range Nilai -->
    <div class="section-bar">
      RANGE NILAI
    </div>
    <table class="grid-table">
      <colgroup>
        <col class="col-1" /><col class="col-2" /><col class="col-3" /><col class="col-4" /><col class="col-5" />
        <col class="col-6" /><col class="col-7" /><col class="col-8" /><col class="col-9" /><col class="col-10" />
      </colgroup>
      <tr>
        <td colspan="10"><div class="c-inner c-center">Predikat</div></td>
      </tr>
      <tr class="c-bold" style="font-size: 10pt;">
        <td colspan="3"><div class="c-inner c-center">Kurang (D)</div></td>
        <td colspan="2"><div class="c-inner c-center">Cukup (C)</div></td>
        <td colspan="2"><div class="c-inner c-center">Baik (B)</div></td>
        <td colspan="3"><div class="c-inner c-center">Sangat Baik (A)</div></td>
      </tr>
      <tr style="font-size: 10pt;">
        <td colspan="3"><div class="c-inner c-center">&lt;75</div></td>
        <td colspan="2"><div class="c-inner c-center">75-83</div></td>
        <td colspan="2"><div class="c-inner c-center">84-92</div></td>
        <td colspan="3"><div class="c-inner c-center">93-100</div></td>
      </tr>
    </table>

    <!-- Evaluasi Guru Pembimbing -->
    <div style="font-weight: bold; font-style: italic; padding: 6pt 8pt; border-top: 1.2pt solid #000; border-bottom: 1.2pt solid #000; font-size: 11pt;">
      EVALUASI GURU PEMBIMBING :
    </div>
    <div style="padding: 10pt; font-size: 11pt; line-height: 1.45; min-height: 85pt; border-bottom: 1.5pt solid #000;">
      ${escapeHtml(evalText)}
    </div>

    <!-- Footer: Nilai TTQ Semester + Tanda Tangan -->
    <div style="padding: 20pt 16pt 24pt 16pt;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        
        <!-- Nilai Kiri -->
        <div style="width: 48%; text-align: center;">
          <div style="font-size: 11pt; font-weight: bold; margin-bottom: 8pt;">
            ${footerLabel}
          </div>
          <div style="border: 2pt solid #000; width: 175pt; height: 55pt; display: flex; align-items: center; justify-content: center; font-size: 21pt; font-weight: bold; margin: 0 auto;">
            ${scoreFormatted}
          </div>
        </div>

        <!-- Tanda Tangan Kanan -->
        <div style="width: 48%; text-align: center; font-size: 10.5pt;">
          <div>Bandung, &nbsp; Juni 2026</div>
          <div style="margin-top: 2pt;">Guru Pembimbing TTQ</div>
          <div style="height: 60pt;"></div>
          <div style="font-weight: bold; font-size: 11pt;">
            ${escapeHtml(student.pembimbingName ?? 'Sahri Fauzan, S.Pd.')}
          </div>
        </div>

      </div>
    </div>

  </div>
</div>
`;

  document.body.appendChild(renderContainer);

  const safeName = (student.name ?? 'student').replace(/\s+/g, '_');
  const filename = `${_schoolName.replace(/\s+/g, '_')}_${reportType}_raport_${safeName}.pdf`;

  try {
    const page1El = renderContainer.querySelector('#pdf-p1') as HTMLElement;
    const page2El = renderContainer.querySelector('#pdf-p2') as HTMLElement;

    // Render each page individually at scale 2 to guarantee exact 1 page per canvas
    const [canvas1, canvas2] = await Promise.all([
      html2canvas(page1El, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 816, // 612pt * 1.3333 = 816px
        height: 1056, // 792pt * 1.3333 = 1056px
      }),
      html2canvas(page2El, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 816,
        height: 1056,
      }),
    ]);

    const pdf = new jsPDF({
      unit: 'pt',
      format: [612, 792],
      orientation: 'portrait',
    });

    const img1Data = canvas1.toDataURL('image/jpeg', 0.98);
    pdf.addImage(img1Data, 'JPEG', 0, 0, 612, 792);

    pdf.addPage([612, 792], 'portrait');
    const img2Data = canvas2.toDataURL('image/jpeg', 0.98);
    pdf.addImage(img2Data, 'JPEG', 0, 0, 612, 792);

    pdf.save(filename);
  } catch (error) {
    console.error('Gagal mengekspor PDF:', error);
    throw new Error('Gagal mengekspor raport ke PDF: ' + (error instanceof Error ? error.message : String(error)));
  } finally {
    document.body.removeChild(renderContainer);
  }
}
