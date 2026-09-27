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

/** Export raport ala docs/raport.xlsx sheet Raport. Semester penuh, monthly tanpa sumatif/nilai akhir. */
export async function exportRaportExcel(
  data: MonthlyRaportData | SemesterRaportData,
  schoolName = 'SMP IT Al Fitrah',
  reportType: 'monthly' | 'semester' = 'monthly'
): Promise<void> {
  try {
    const [smpLogo, ttqLogo] = await Promise.all([
      loadLogoBase64('/brand/logo_smp.png'),
      loadLogoBase64('/brand/TTQ_Logo.png'),
    ]);

    const student = data.student ?? ({} as RaportStudent);
    const period = data.period ?? ({} as RaportPeriod);
    const nilaiTtq = (data.nilaiTtq ?? {}) as RaportNilaiTtq;
    const absensi = (data.absensi ?? {}) as RaportAbsensi;
    const mutabaah = data.mutabaah ?? [];
    const evaluasi = data.evaluasi ?? '';
    const sumatif = (data as SemesterRaportData).sumatif;
    const nilaiAkhir = (data as SemesterRaportData).nilaiAkhir ?? 0;

    const NC = 12;
    const blank = (): (string | number)[] => Array(NC).fill('');
    const rows: (string | number)[][] = [];
    const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
    const mergeRow = (r: number, c0: number, c1: number) => merges.push({ s: { r, c: c0 }, e: { r, c: c1 } });

    const pushFull = (text: string | number) => {
      const r = rows.length;
      const row = blank();
      row[0] = text;
      rows.push(row);
      mergeRow(r, 0, NC - 1);
      return r;
    };

    // Header + logo (SMP kiri kol A, TTQ kanan kol L)
    let r = rows.length;
    rows.push(blank());
    mergeRow(r, 2, 9);
    rows[r][2] = 'LAPORAN PENCAPAIAN';
    r = rows.length;
    rows.push(blank());
    mergeRow(r, 2, 9);
    rows[r][2] = 'TAHSIN TAHFIZH AL QURAN (TTQ)';
    r = rows.length;
    rows.push(blank());
    mergeRow(r, 2, 9);
    rows[r][2] = schoolName.toUpperCase();
    const periodeStr = reportType === 'monthly'
      ? `BULAN ${period.month ?? '-'} ${period.year ?? '-'}`
      : `SEMESTER ${period.semester ?? '-'} ${period.tahunAjaran ?? '-'}`;
    r = rows.length;
    rows.push(blank());
    mergeRow(r, 2, 9);
    rows[r][2] = periodeStr;
    r = rows.length;
    rows.push(blank());
    mergeRow(r, 2, 9);
    rows[r][2] = `TAHUN PELAJARAN ${reportType === 'monthly' ? (period.year ?? '-') : (period.tahunAjaran ?? '-')}`;
    rows.push(blank());
    rows.push(blank());

    // Identitas
    const identitas: [string, string][] = [
      ['Nama', student.name ?? '-'],
      ['Kelas', student.className ?? '-'],
      [reportType === 'monthly' ? 'Bulan' : 'Semester', reportType === 'monthly' ? `${period.month ?? '-'} ${period.year ?? ''}`.trim() : `${period.semester ?? '-'} ${period.tahunAjaran ?? ''}`.trim()],
      ['Pembimbing', student.pembimbingName ?? '-'],
    ];
    for (const [label, value] of identitas) {
      const ri = rows.length;
      const row = blank();
      row[0] = ` ${label}`;
      row[2] = ':';
      row[3] = value;
      rows.push(row);
      mergeRow(ri, 3, NC - 1);
    }
    rows.push(blank());

    // Blok Al-Quran + Sabiq berdampingan
    const tahfidz = nilaiTtq.tahfidz ?? ({} as RaportNilaiTtqItem);
    const tahsin = nilaiTtq.tahsin ?? ({} as RaportNilaiTtqItem);
    let ri = rows.length;
    rows.push(blank());
    rows[ri][0] = 'Al-Quran';
    rows[ri][6] = 'Tilawah Metode Sabiq';
    mergeRow(ri, 0, 5);
    mergeRow(ri, 6, NC - 1);
    ri = rows.length;
    rows.push(blank());
    rows[ri][0] = tahfidz.arabicPredicate ?? '-';
    rows[ri][6] = tahsin.arabicPredicate ?? '-';
    mergeRow(ri, 0, 5);
    mergeRow(ri, 6, NC - 1);
    ri = rows.length;
    rows.push(blank());
    rows[ri][0] = tahfidz.capaian ?? '-';
    rows[ri][6] = tahsin.capaian ?? '-';
    mergeRow(ri, 0, 5);
    mergeRow(ri, 6, NC - 1);
    const ttqScoreRows: Array<[string, string | number, string, string | number, string, string | number, string, string | number]> = [
      ['Tajwid', tahfidz.score ?? '-', 'Kelancaran', tahfidz.score ?? '-', 'Tajwid', tahsin.score ?? '-', 'Kelancaran', tahsin.score ?? '-'],
      ['Nilai', tahfidz.score ?? '-', '', '', 'Nilai', tahsin.score ?? '-', '', ''],
    ];
    for (const [l1, v1, l2, v2, l3, v3, l4, v4] of ttqScoreRows) {
      const row = blank();
      row[0] = l1 ? ` ${l1}` : '';
      row[1] = v1 === '' ? '' : ':';
      row[2] = v1;
      row[3] = l2 ? ` ${l2}` : '';
      row[4] = v2 === '' ? '' : ':';
      row[5] = v2;
      row[6] = l3 ? ` ${l3}` : '';
      row[7] = v3 === '' ? '' : ':';
      row[8] = v3;
      row[9] = l4 ? ` ${l4}` : '';
      row[10] = v4 === '' ? '' : ':';
      row[11] = v4;
      rows.push(row);
    }
    rows.push(blank());

    // Sumatif (semester saja)
    if (reportType === 'semester' && sumatif) {
      pushFull(`HASIL ASESMEN SUMATIF TTQ SEMESTER ${period.semester ?? ''}`.trim());
      ri = rows.length;
      rows.push(blank());
      rows[ri][0] = "Tes Tahfizh Al Qur'an";
      rows[ri][6] = 'Tes Tilawah Metode Sabiq';
      mergeRow(ri, 0, 5);
      mergeRow(ri, 6, NC - 1);
      ri = rows.length;
      rows.push(blank());
      rows[ri][0] = sumatif.testTahfidz?.arabicPredicate ?? '-';
      rows[ri][6] = sumatif.testTilawah?.arabicPredicate ?? '-';
      mergeRow(ri, 0, 5);
      mergeRow(ri, 6, NC - 1);
      ri = rows.length;
      rows.push(blank());
      rows[ri][0] = sumatif.testTahfidz?.capaian ?? '-';
      rows[ri][6] = sumatif.testTilawah?.capaian ?? '-';
      mergeRow(ri, 0, 5);
      mergeRow(ri, 6, NC - 1);
      const sumRows: Array<[string, string | number, string, string | number]> = [
        ['Tajwid', sumatif.testTahfidz?.tajwid ?? '-', 'Tajwid', sumatif.testTilawah?.tajwid ?? '-'],
        ['Kelancaran', sumatif.testTahfidz?.kelancaran ?? '-', 'Kelancaran', sumatif.testTilawah?.kelancaran ?? '-'],
      ];
    for (const [l1, v1, l2, v2] of sumRows) {
      const row = blank();
        row[0] = ` ${l1}`;
        row[1] = ':';
        row[2] = v1;
        row[6] = ` ${l2}`;
        row[7] = ':';
        row[8] = v2;
        rows.push(row);
      }
      pushFull('TES TERTULIS');
      rows.push(blank());
      ri = rows.length;
      rows.push(blank());
      rows[ri][0] = `Materi : ${sumatif.testTertulis?.materi ?? '-'}`;
      rows[ri][7] = sumatif.testTertulis?.score ?? '-';
      rows[ri][9] = sumatif.testTertulis?.grade ?? '-';
      mergeRow(ri, 0, 6);
      rows.push(blank());
    }

    // Mutabaah
    pushFull("LAPORAN MUTABA'AH YAUMIYYAH");
    for (const row of mutabaah) {
      const line = blank();
      line[0] = ` ${row.label ?? '-'}`;
      line[8] = ':';
      line[9] = row.grade ?? '-';
      const qi = rows.length;
      rows.push(line);
      mergeRow(qi, 0, 7);
      mergeRow(qi, 9, NC - 1);
    }
    rows.push(blank());

    // Munaqosyah (data BE belum ada -> '-')
    ri = rows.length;
    rows.push(blank());
    rows[ri][0] = ' Keterangan Munaqosyah';
    rows[ri][4] = ':';
    rows[ri][5] = '-';
    rows[ri][7] = 'Nilai';
    rows[ri][8] = ':';
    rows[ri][9] = '-';
    mergeRow(ri, 0, 3);
    mergeRow(ri, 5, 6);
    mergeRow(ri, 9, NC - 1);
    rows.push(blank());
    rows.push(blank());

    // Absensi
    pushFull('ABSENSI SISWA');
    rows.push(blank());
    const denom = (() => {
      const m = String(absensi.kehadiranRatio ?? '').match(/\/(\d+)/);
      return m ? m[1] : '40';
    })();
    const absRows: [string, string | number][] = [
      ['Kehadiran', absensi.kehadiranRatio ?? `0/${denom}`],
      ['Tidak Setoran', `${absensi.tidakSetoranCount ?? 0}/${denom}`],
      ['Alpa', `${absensi.alpaCount ?? 0}/${denom}`],
      ['Izin', `${absensi.izinCount ?? 0}/${denom}`],
      ['Sakit', `${absensi.sakitCount ?? 0}/${denom}`],
    ];
    for (const [label, value] of absRows) {
      const line = blank();
      line[0] = ` ${label}`;
      line[7] = ':';
      line[8] = value;
      const qa = rows.length;
      rows.push(line);
      mergeRow(qa, 0, 6);
      mergeRow(qa, 8, NC - 1);
    }

    // Range nilai
    pushFull('RANGE NILAI');
    ri = rows.length;
    rows.push(blank());
    rows[ri][0] = 'Kurang (D)';
    rows[ri][3] = 'Cukup (C)';
    rows[ri][6] = 'Baik (B)';
    rows[ri][9] = 'Sangat Baik (A)';
    mergeRow(ri, 0, 2);
    mergeRow(ri, 3, 5);
    mergeRow(ri, 6, 8);
    mergeRow(ri, 9, NC - 1);
    ri = rows.length;
    rows.push(blank());
    rows[ri][0] = '<75';
    rows[ri][3] = '75-83';
    rows[ri][6] = '84-92';
    rows[ri][9] = '93-100';
    mergeRow(ri, 0, 2);
    mergeRow(ri, 3, 5);
    mergeRow(ri, 6, 8);
    mergeRow(ri, 9, NC - 1);
    rows.push(blank());

    // Evaluasi
    pushFull('EVALUASI GURU PEMBIMBING :');
    rows.push(blank());
    const evalText = evaluasi || 'Belum ada evaluasi dari ustadz pembimbing.';
    const chunks = evalText.match(/.{1,90}/g) ?? [evalText];
    for (const chunk of chunks) {
      pushFull(chunk);
    }
    rows.push(blank());
    rows.push(blank());

    // Nilai akhir + tanda tangan (semester saja)
    if (reportType === 'semester') {
      const semLabel = `Semester ${period.semester ?? ''}`.trim();
      const todayId = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      ri = rows.length;
      rows.push(blank());
      rows[ri][1] = `Nilai TTQ ${semLabel}`;
      rows[ri][7] = todayId;
      mergeRow(ri, 1, 5);
      mergeRow(ri, 7, NC - 1);
      ri = rows.length;
      rows.push(blank());
      rows[ri][7] = 'Guru Pembimbing TTQ';
      mergeRow(ri, 7, NC - 1);
      ri = rows.length;
      rows.push(blank());
      rows[ri][1] = Number(nilaiAkhir).toFixed(2);
      mergeRow(ri, 1, 3);
      rows.push(blank());
      rows.push(blank());
      rows.push(blank());
      ri = rows.length;
      rows.push(blank());
      rows[ri][7] = student.pembimbingName ?? '-';
      mergeRow(ri, 7, NC - 1);
    }

    // Worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!ref'] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: NC - 1, r: rows.length - 1 } });
    ws['!merges'] = merges;

    ws['!cols'] = [
      { wch: 16 }, { wch: 4 }, { wch: 12 }, { wch: 16 }, { wch: 4 }, { wch: 12 },
      { wch: 16 }, { wch: 4 }, { wch: 12 }, { wch: 14 }, { wch: 4 }, { wch: 12 },
    ];

    if (smpLogo) {
      if (!ws['!images']) ws['!images'] = [];
      ws['!images'].push({ base64: smpLogo, extension: 'png', origin: { c: 0, r: 0 } });
    }
    if (ttqLogo) {
      if (!ws['!images']) ws['!images'] = [];
      ws['!images'].push({ base64: ttqLogo, extension: 'png', origin: { c: NC - 1, r: 0 } });
    }

    const thin = { style: 'thin' } as const;
    const borderAll = { top: thin, bottom: thin, left: thin, right: thin };
    for (let i = 0; i < rows.length; i++) {
      for (let ci = 0; ci < NC; ci++) {
        const val = rows[i][ci];
        if (val === null || val === undefined || val === '') continue;
        const cell = ws[XLSX.utils.encode_cell({ r: i, c: ci })];
        if (!cell) continue;
        const strVal = String(val).trim();
        if (/^(LAPORAN|HASIL ASESMEN|TES TERTULIS|ABSENSI|RANGE NILAI|EVALUASI)/.test(strVal)) {
          cell.s = {
            fill: { fgColor: { rgb: '0D5C75' } },
            font: { color: { rgb: 'FFFFFF' }, b: true, sz: 11 },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderAll,
          };
        } else if (/^(Al-Quran|Tilawah Metode|Tes Tahfizh|Tes Tilawah)$/.test(strVal)) {
          cell.s = { font: { b: true, sz: 11 }, alignment: { horizontal: 'center' }, border: borderAll };
        } else if (/^[م-ي]/.test(strVal)) {
          cell.s = { font: { b: true, sz: 14 }, alignment: { horizontal: 'center' }, border: borderAll };
        } else if (typeof val === 'number' || /^(A|B|C|D)$/.test(strVal)) {
          cell.s = { alignment: { horizontal: 'center' }, border: borderAll };
        } else {
          cell.s = { border: borderAll };
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
