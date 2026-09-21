import * as XLSX from 'xlsx';

// ===== Types (match backend entities in apps/api/src/modules/reports/domain/entities/Raport.ts) =====
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

// ===== Types for student list export =====
export interface StudentRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  className: string | null;
  level: number;
  totalExp: number;
  currentStreak: number;
}

/** Load image from URL as base64 */
async function loadLogoBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1] ?? '');
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

/** Export raport data to a neatly formatted Excel file with TTQ + SMP Alfitrah logos. */
export async function exportRaportExcel(
  data: MonthlyRaportData | SemesterRaportData,
  schoolName = 'SMP IT Al Fitrah',
  reportType: 'monthly' | 'semester' = 'monthly'
): Promise<void> {
  try {
    const [ttqLogo, smpLogo] = await Promise.all([
      loadLogoBase64('/brand/TTQ_Logo.png'),
      loadLogoBase64('/brand/logo_smp.png'),
    ]);

    const student = data.student ?? ({} as RaportStudent);
    const period = data.period ?? ({} as RaportPeriod);
    const nilaiTtq = data.nilaiTtq ?? {};
    const detailTtq = data.detailTtq ?? {};
    const absensi = data.absensi ?? {};
    const mutabaah = data.mutabaah ?? [];
    const evaluasi = data.evaluasi ?? '';
    const sumatif = (data as SemesterRaportData).sumatif;
    const nilaiAkhir = (data as SemesterRaportData).nilaiAkhir ?? 0;
    const gradeAkhir = (data as SemesterRaportData).gradeAkhir ?? '-';
    const arabicPredicate = (data as SemesterRaportData).arabicPredicate ?? '-';

    const rows: (string | number)[][] = [];

    // Header
    rows.push([schoolName, '', '', '', '', '']);
    rows.push(['Laporan ' + (reportType === 'monthly' ? 'Bulanan' : 'Semester'), '', '', '', '', '']);
    rows.push(['', '', '', '', '', '']);

    // Student info
    rows.push(['Nama Siswa', student.name ?? '-', '', '', '', '']);
    rows.push(['Kelas', student.className ?? '-', '', '', '', '']);
    rows.push(['Pembimbing', student.pembimbingName ?? '-', '', '', '', '']);
    const periodeStr = reportType === 'monthly'
      ? `${period.month ?? '-'}/${period.year ?? '-'}`
      : `${period.semester ?? '-'} ${period.tahunAjaran ?? '-'}`;
    rows.push(['Periode', periodeStr, '', '', '', '']);
    rows.push(['', '', '', '', '', '']);

    // Nilai TTQ
    rows.push(['NILAI TTQ', '', '', '', '', '']);
    rows.push(['', '', '', '', '', '']);
    rows.push(['Tahfidz', nilaiTtq.tahfidz?.grade ?? '-', nilaiTtq.tahfidz?.score ?? '-', nilaiTtq.tahfidz?.arabicPredicate ?? '-', nilaiTtq.tahfidz?.capaian ?? '-', '']);
    rows.push(['Tahsin', nilaiTtq.tahsin?.grade ?? '-', nilaiTtq.tahsin?.score ?? '-', nilaiTtq.tahsin?.arabicPredicate ?? '-', nilaiTtq.tahsin?.capaian ?? '-', '']);
    rows.push(['', '', '', '', '', '']);

    // Detail Tahfidz/Tahsin
    rows.push(['DETAIL TAHFIDZ/TAHSIN', '', '', '', '', '']);
    rows.push(['', '', '', '', '', '']);
    rows.push(['Ziyadah', detailTtq.ziyadah ?? 0, '', '', '', '']);
    rows.push(['Muroja\'ah', detailTtq.murojaah ?? 0, '', '', '', '']);
    rows.push(['Makhroj', detailTtq.makhroj ?? 0, '', '', '', '']);
    rows.push(['Mad', detailTtq.mad ?? 0, '', '', '', '']);
    rows.push(['Ghunnah', detailTtq.ghunnah ?? 0, '', '', '', '']);
    rows.push(['Kelancaran', detailTtq.kelancaran ?? 0, '', '', '', '']);
    rows.push(['', '', '', '', '', '']);

    // Mutaba'ah
    rows.push(['MUTABA\'AH YAUMIYYAH', '', '', '', '', '']);
    rows.push(['', '', '', '', '', '']);
    rows.push(['Kegiatan', 'Ratio', 'Nilai', '', '', '']);
    for (const row of mutabaah) {
      rows.push([row.label ?? '-', row.ratio ?? '-', row.grade ?? '-', '', '', '']);
    }
    rows.push(['', '', '', '', '', '']);

    // Absensi
    rows.push(['ABSENSI SISWA', '', '', '', '', '']);
    rows.push(['', '', '', '', '', '']);
    rows.push(['Kehadiran', absensi.kehadiranRatio ?? '0/0', '', '', '', '']);
    rows.push(['Tidak Setoran', absensi.tidakSetoranCount ?? 0, '', '', '', '']);
    rows.push(['Sakit', absensi.sakitCount ?? 0, '', '', '', '']);
    rows.push(['Izin', absensi.izinCount ?? 0, '', '', '', '']);
    rows.push(['Alpa', absensi.alpaCount ?? 0, '', '', '', '']);
    rows.push(['', '', '', '', '', '']);

    // Sumatif (semester only)
    if (sumatif) {
      rows.push(['HASIL ASESMEN SUMATIF TTQ', '', '', '', '', '']);
      rows.push(['', '', '', '', '', '']);
      rows.push(['Test Tahfidz', sumatif.testTahfidz?.grade ?? '-', sumatif.testTahfidz?.score ?? '-', sumatif.testTahfidz?.arabicPredicate ?? '-', `${sumatif.testTahfidz?.tajwid ?? '-'}/${sumatif.testTahfidz?.kelancaran ?? '-'}`, '']);
      rows.push(['Test Tilawah', sumatif.testTilawah?.grade ?? '-', sumatif.testTilawah?.score ?? '-', sumatif.testTilawah?.arabicPredicate ?? '-', `${sumatif.testTilawah?.tajwid ?? '-'}/${sumatif.testTilawah?.kelancaran ?? '-'}`, '']);
      rows.push(['Test Tertulis', sumatif.testTertulis?.grade ?? '-', sumatif.testTertulis?.score ?? '-', sumatif.testTertulis?.arabicPredicate ?? '-', sumatif.testTertulis?.materi ?? '-', '']);
      rows.push(['', '', '', '', '', '']);
    }

    // Nilai Akhir (semester only)
    if (reportType === 'semester') {
      rows.push(['NILAI AKHIR', '', '', '', '', '']);
      rows.push(['', '', '', '', '', '']);
      rows.push(['Nilai Akhir', Number(nilaiAkhir).toFixed(2), '', '', '', '']);
      rows.push(['Grade', gradeAkhir, '', '', '', '']);
      rows.push(['Predikat', arabicPredicate, '', '', '', '']);
      rows.push(['', '', '', '', '', '']);
    }

    // Evaluasi
    rows.push(['EVALUASI GURU PEMBIMBING', '', '', '', '', '']);
    rows.push(['', '', '', '', '', '']);
    const evalText = evaluasi || 'Belum ada evaluasi dari ustadz pembimbing.';
    const chunks = evalText.match(/.{1,90}/g) ?? [evalText];
    for (const chunk of chunks) {
      rows.push([chunk, '', '', '', '', '']);
    }
    rows.push(['', '', '', '', '', '']);

    // Worksheet & Workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    if (!ws['!ref']) ws['!ref'] = 'A1:F' + rows.length;

    // Column widths
    ws['!cols'] = [
      { wch: 20 },
      { wch: 22 },
      { wch: 14 },
      { wch: 14 },
      { wch: 24 },
      { wch: 14 },
    ];

    // Embed logos via !images
    if (ttqLogo) {
      if (!ws['!images']) ws['!images'] = [];
      ws['!images'].push({ base64: ttqLogo, extension: 'png', origin: { c: 0, r: 0 } });
    }
    if (smpLogo) {
      if (!ws['!images']) ws['!images'] = [];
      ws['!images'].push({ base64: smpLogo, extension: 'png', origin: { c: 5, r: 0 } });
    }

    // Styles
    const sectionHeaders = new Set([
      'NILAI TTQ', 'DETAIL TAHFIDZ/TAHSIN', 'MUTABA\'AH YAUMIYYAH',
      'ABSENSI SISWA', 'HASIL ASESMEN SUMATIF TTQ', 'NILAI AKHIR',
      'EVALUASI GURU PEMBIMBING',
    ]);
    const infoLabels = new Set(['Nama Siswa', 'Kelas', 'Pembimbing', 'Periode']);

    for (let i = 0; i < rows.length; i++) {
      for (let ci = 0; ci < rows[i].length; ci++) {
        const val = rows[i][ci];
        if (val === null || val === undefined || val === '') continue;

        const cellAddr = XLSX.utils.encode_cell({ r: i, c: ci });
        const cell = ws[cellAddr];
        if (!cell) continue;

        const strVal = String(val);
        if (sectionHeaders.has(strVal)) {
          cell.s = {
            fill: { fgColor: { rgb: '0D5C75' } },
            font: { color: { rgb: 'FFFFFF' }, b: true, sz: 11 },
            alignment: { horizontal: 'center' },
            border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } },
          };
        } else if (infoLabels.has(strVal)) {
          cell.s = { font: { b: true, color: { rgb: '0D5C75' } } };
        } else if (typeof val === 'number') {
          cell.s = { alignment: { horizontal: 'center' } };
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Raport');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);

    const safeName = (student.name ?? 'student').replace(/\s+/g, '_');
    const filename = `${schoolName.replace(/\s+/g, '_')}_${reportType}_raport_${safeName}.xlsx`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Gagal mengekspor Excel:', error);
    throw new Error('Gagal mengekspor raport ke Excel: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/** Export student list data to Excel with TTQ + SMP Alfitrah logos */
export async function exportStudentListToExcel(
  students: StudentRecord[],
  schoolName = 'SMP IT Al Fitrah'
): Promise<void> {
  try {
    const [ttqLogo, smpLogo] = await Promise.all([
      loadLogoBase64('/brand/TTQ_Logo.png'),
      loadLogoBase64('/brand/logo_smp.png'),
    ]);

    const rows: (string | number)[][] = [];

    // Header
    rows.push([schoolName, '', '', '', '', '']);
    rows.push(['Daftar Siswa', '', '', '', '', '']);
    rows.push(['', '', '', '', '', '']);

    // Column headers
    rows.push([
      'No.',
      'Nama Siswa',
      'Kelas',
      'Level',
      'Total EXP',
      'Streak (Hari)',
      'Email',
      'Telepon',
    ]);

    // Student data
    students.forEach((student, index) => {
      rows.push([
        index + 1,
        student.name ?? '-',
        student.className ?? '-',
        student.level ?? 0,
        student.totalExp ?? 0,
        student.currentStreak ?? 0,
        student.email ?? '-',
        student.phone ?? '-',
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    if (!ws['!ref']) {
      ws['!ref'] = XLSX.utils.encode_range({
        s: { c: 0, r: 0 },
        e: { c: 7, r: rows.length - 1 },
      });
    }

    // Column widths
    ws['!cols'] = [
      { wch: 6 },
      { wch: 25 },
      { wch: 15 },
      { wch: 8 },
      { wch: 12 },
      { wch: 14 },
      { wch: 25 },
      { wch: 15 },
    ];

    // Embed logos
    if (ttqLogo) {
      if (!ws['!images']) ws['!images'] = [];
      ws['!images'].push({ base64: ttqLogo, extension: 'png', origin: { c: 0, r: 0 } });
    }
    if (smpLogo) {
      if (!ws['!images']) ws['!images'] = [];
      ws['!images'].push({ base64: smpLogo, extension: 'png', origin: { c: 7, r: 0 } });
    }

    // Styles
    for (let i = 0; i < rows.length; i++) {
      for (let ci = 0; ci < rows[i].length; ci++) {
        const val = rows[i][ci];
        if (val === null || val === undefined) continue;

        const cellAddr = XLSX.utils.encode_cell({ r: i, c: ci });
        const cell = ws[cellAddr];
        if (!cell) continue;

        if (i < 3) {
          if (typeof val === 'string' && (val === schoolName || val === 'Daftar Siswa')) {
            cell.s = {
              fill: { fgColor: { rgb: '0D5C75' } },
              font: { color: { rgb: 'FFFFFF' }, b: true, sz: 12 },
              alignment: { horizontal: 'center' },
            };
          }
        } else if (i === 3) {
          cell.s = {
            fill: { fgColor: { rgb: '0D5C75' } },
            font: { color: { rgb: 'FFFFFF' }, b: true, sz: 10 },
            alignment: { horizontal: 'center' },
            border: {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' },
            },
          };
        } else if (i >= 4) {
          if ((i - 4) % 2 === 1) {
            cell.s = { fill: { fgColor: { rgb: 'F8F9FA' } } };
          }
          if (ci === 0 || ci === 3 || ci === 4 || ci === 5) {
            cell.s = { alignment: { horizontal: 'center' } };
          }
          cell.s = {
            border: {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' },
            },
          };
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Siswa');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);

    const filename = `${schoolName.replace(/\s+/g, '_')}_daftar_siswa.xlsx`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Gagal mengekspor Excel:', error);
    throw new Error('Gagal mengekspor daftar siswa ke Excel: ' + (error instanceof Error ? error.message : String(error)));
  }
}
