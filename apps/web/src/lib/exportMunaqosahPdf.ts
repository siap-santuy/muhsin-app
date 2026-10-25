import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface MunaqosahScheduleItem {
  id: string;
  studentName: string;
  className: string;
  juzKe: number;
  juzList?: number[] | null;
  examDate?: string | null;
  examTime?: string | null;
  assignedExaminerName?: string | null;
  status?: string;
  scores?: any;
  nilaiAkhir?: number | null;
  grade?: string | null;
  hasil?: string | null;
  catatanPenguji?: string | null;
}

export interface MunaqosahPeriodInfo {
  id: string;
  nama: string;
  tanggalMulai: string;
  tanggalSelesai: string;
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

function toRomanMonth(monthNumber: number): string {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return romans[monthNumber - 1] || 'X';
}

function formatIndoDate(dateStr?: string | Date | null): string {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatIndoDayDate(dateStr?: string | Date | null): string {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

async function loadLogoDataUrl(url: string, isSvg = false): Promise<string> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();

    if (!isSvg) {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) ?? '');
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    // Rasterize SVG onto an offscreen canvas to guarantee clean html2canvas rendering
    const svgText = await blob.text();
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const DOMURL = window.URL || window.webkitURL || window;
    const svgUrl = DOMURL.createObjectURL(svgBlob);

    return await new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 340;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(svgUrl);
        }
        DOMURL.revokeObjectURL(svgUrl);
      };
      img.onerror = () => resolve('');
      img.src = svgUrl;
    });
  } catch {
    return '';
  }
}

function generateKopHtml(bandungLogo: string, alfitrahLogo: string): string {
  return `
    <table class="kop-table">
      <tr>
        <td class="kop-logo-left">
          ${bandungLogo ? `<img src="${bandungLogo}" alt="Logo Bandung" style="height: 62pt; max-width: 62pt; object-fit: contain;" />` : ''}
        </td>
        <td class="kop-text">
          <div class="inst-1">PEMERINTAH KOTA BANDUNG</div>
          <div class="inst-2">SMP ISLAM TERPADU AL FITRAH</div>
          <div class="inst-3">AKREDITASI A</div>
          <div class="inst-4">Jl. Cipamokolan No. 59 Bandung</div>
          <div class="inst-5">Email : smpit.alfitrah@gmail.com, Telp. 0857-2403-8114</div>
        </td>
        <td class="kop-logo-right">
          ${alfitrahLogo ? `<img src="${alfitrahLogo}" alt="Logo Al Fitrah" style="height: 62pt; max-width: 62pt; object-fit: contain;" />` : ''}
        </td>
      </tr>
    </table>
    <div class="kop-line"></div>
  `;
}

const COMMON_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .pdf-page {
    width: 595pt;
    min-height: 842pt;
    padding: 32pt 40pt;
    background: #ffffff;
    font-family: 'Times New Roman', Times, serif;
    color: #000000;
    line-height: 1.35;
    position: relative;
  }
  .kop-table {
    width: 100%;
    border-collapse: collapse;
  }
  .kop-logo-left { width: 70pt; text-align: left; vertical-align: middle; }
  .kop-logo-right { width: 70pt; text-align: right; vertical-align: middle; }
  .kop-text { text-align: center; vertical-align: middle; }
  .inst-1 { font-size: 11pt; font-weight: bold; letter-spacing: 1.5pt; }
  .inst-2 { font-size: 13pt; font-weight: bold; margin-top: 1pt; }
  .inst-3 { font-size: 9.5pt; font-weight: bold; margin-top: 0.5pt; }
  .inst-4 { font-size: 8.5pt; margin-top: 1pt; }
  .inst-5 { font-size: 8.5pt; }
  .kop-line {
    border-top: 2.5pt solid #000;
    border-bottom: 0.75pt solid #000;
    height: 3pt;
    margin: 4pt 0 14pt 0;
  }
  .table-data {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10pt;
    font-size: 9pt;
  }
  .table-data th, .table-data td {
    border: 0.75pt solid #000;
    padding: 4.5pt 5pt;
    vertical-align: middle;
  }
  .table-data th {
    background: #f0f0f0;
    font-weight: bold;
    text-align: center;
  }
  .center { text-align: center; }
`;

/**
 * 1. Export Surat Pemberitahuan & Lampiran Jadwal Munaqosah
 */
export async function exportSuratPenjadwalanPdf(
  period: MunaqosahPeriodInfo,
  schedules: MunaqosahScheduleItem[],
  options?: {
    tempat?: string;
    kepalaSekolah?: string;
    nomorSurat?: string;
    tanggalSurat?: string;
  }
): Promise<void> {
  const [bandungLogo, alfitrahLogo] = await Promise.all([
    loadLogoDataUrl('/brand/logo_kota_bandung.svg', true),
    loadLogoDataUrl('/brand/logo_ttq_alfitrah.png', false),
  ]);

  const now = new Date();
  const romanMonth = toRomanMonth(now.getMonth() + 1);
  const year = now.getFullYear();
  const nomorSurat = options?.nomorSurat || `116/SPb/SMPITAF.KUR/${romanMonth}/${year}`;
  const tglSuratIndo = formatIndoDate(options?.tanggalSurat || now);
  const kepalaSekolah = options?.kepalaSekolah || 'Ridha Sofia, S.S, M.Pd';
  const tempat = options?.tempat || 'Mushola Ikhwan / Ruang TTQ';

  // Format hari dan rentang waktu pelaksanaan
  const rangeDate =
    period.tanggalMulai === period.tanggalSelesai
      ? formatIndoDayDate(period.tanggalMulai)
      : `${formatIndoDayDate(period.tanggalMulai)} s.d ${formatIndoDayDate(period.tanggalSelesai)}`;

  // Cari rentang waktu terendah dan tertinggi dari jadwal
  let minTime = '07.00';
  let maxTime = '11.00';
  if (schedules.length > 0) {
    const times: string[] = [];
    schedules.forEach((s) => {
      if (s.examTime) {
        const parts = s.examTime.replace(':', '.').split(' - ');
        parts.forEach((p) => times.push(p.trim()));
      }
    });
    if (times.length > 0) {
      times.sort();
      minTime = times[0];
      maxTime = times[times.length - 1];
    }
  }

  // Filter santri yang dijadwalkan
  const scheduledSantri = schedules.filter(
    (s) => s.status === 'dijadwalkan' || s.status === 'disetujui' || s.examDate
  );

  const html = `
    <style>${COMMON_CSS}</style>

    <!-- PAGE 1: SURAT PEMBERITAHUAN -->
    <div id="page-1" class="pdf-page">
      ${generateKopHtml(bandungLogo, alfitrahLogo)}

      <table style="width: 100%; font-size: 10pt; margin-bottom: 12pt;">
        <tr>
          <td style="width: 70pt;">Nomor</td>
          <td style="width: 10pt;">:</td>
          <td>${escapeHtml(nomorSurat)}</td>
          <td style="text-align: right;">Bandung, ${tglSuratIndo}</td>
        </tr>
        <tr>
          <td>Lampiran</td>
          <td>:</td>
          <td>1 (satu) halaman</td>
          <td></td>
        </tr>
        <tr>
          <td>Perihal</td>
          <td>:</td>
          <td><b>Pemberitahuan Munaqosyah</b></td>
          <td></td>
        </tr>
      </table>

      <div style="font-size: 10pt; margin-bottom: 12pt;">
        <p>Kepada Yth,</p>
        <p><b>Orang Tua / Wali Murid SMPIT Al Fitrah</b></p>
        <p>Di tempat</p>
      </div>

      <div style="font-size: 10pt; text-align: justify; line-height: 1.5;">
        <p style="font-style: italic; margin-bottom: 4pt;">Bismillahirrohmanirrohim</p>
        <p style="font-weight: bold; margin-bottom: 8pt;">Assalamu'alaikum warahmatullahi wabarakatuh</p>

        <p style="margin-bottom: 8pt; text-indent: 20pt;">
          Segala puji hanyalah milik Allah SWT yang mengatur semesta alam. Shalawat dan salam semoga senantiasa tercurahkan kepada suri tauladan kita Rasulullah SAW.
        </p>

        <p style="margin-bottom: 8pt; text-indent: 20pt;">
          Dengan ini kami informasikan mengenai pelaksanaan <b>Munaqosyah Tahfidz Al-Qur'an</b> (${escapeHtml(period.nama)}) yang akan dilaksanakan pada:
        </p>

        <table style="width: 100%; margin-left: 20pt; margin-bottom: 10pt; font-size: 10pt;">
          <tr>
            <td style="width: 100pt; padding: 2pt 0;">Hari / Tanggal</td>
            <td style="width: 12pt;">:</td>
            <td><b>${rangeDate}</b></td>
          </tr>
          <tr>
            <td style="padding: 2pt 0;">Tempat</td>
            <td>:</td>
            <td>${escapeHtml(tempat)}</td>
          </tr>
          <tr>
            <td style="padding: 2pt 0;">Waktu</td>
            <td>:</td>
            <td>${minTime} – ${maxTime} WIB</td>
          </tr>
        </table>

        <p style="margin-bottom: 8pt; text-indent: 20pt;">
          Ananda yang hendak melaksanakan munaqosyah diharapkan hadir <b>5 menit sebelum tes dimulai</b>, mengenakan seragam sekolah rapi atau gamis (akhwat) / baju koko (ikhwan). Jadwal rinci munaqosyah terlampir pada surat ini.
        </p>

        <p style="margin-bottom: 14pt; text-indent: 20pt;">
          Demikian surat pemberitahuan ini kami sampaikan. Atas segala perhatian dan kerja sama Ayah/Bunda, kami ucapkan <i>jazakumullohu khoiron katsiro</i>.
        </p>

        <p style="font-weight: bold; margin-bottom: 16pt;">Wassalamu'alaikum warahmatullahi wabarakatuh</p>
      </div>

      <table style="width: 100%; margin-top: 10pt; font-size: 10pt;">
        <tr>
          <td style="width: 60%;">
            <div style="font-size: 8.5pt; color: #333; line-height: 1.4;">
              <p><b>Tembusan :</b></p>
              <p>1. Ketua YPM Al Fitrah</p>
              <p>2. Koordinator LTTQ</p>
              <p>3. Arsip</p>
            </div>
          </td>
          <td style="text-align: center; width: 40%;">
            <p>Kepala Satuan Pendidikan</p>
            <div style="height: 52pt;"></div>
            <p><b><u>${escapeHtml(kepalaSekolah)}</u></b></p>
          </td>
        </tr>
      </table>
    </div>

    <!-- PAGE 2: LAMPIRAN JADWAL -->
    <div id="page-2" class="pdf-page" style="margin-top: 20pt;">
      ${generateKopHtml(bandungLogo, alfitrahLogo)}

      <div style="text-align: center; margin-bottom: 10pt;">
        <h3 style="font-size: 11pt; font-weight: bold;">LAMPIRAN 1</h3>
        <h4 style="font-size: 10.5pt; font-weight: bold; text-transform: uppercase;">
          JADWAL MUNAQOSYAH TAHFIDZ — ${escapeHtml(period.nama)}
        </h4>
      </div>

      <table class="table-data">
        <thead>
          <tr>
            <th style="width: 5%;">No</th>
            <th style="width: 30%;">Nama Siswa/i</th>
            <th style="width: 10%;">Kelas</th>
            <th style="width: 12%;">Juz</th>
            <th style="width: 18%;">Waktu</th>
            <th style="width: 25%;">Penguji</th>
          </tr>
        </thead>
        <tbody>
          ${
            scheduledSantri.length === 0
              ? `<tr><td colspan="6" class="center" style="padding: 12pt;">Belum ada santri yang dijadwalkan pada periode ini</td></tr>`
              : scheduledSantri
                  .map((s, idx) => {
                    const juzText =
                      s.juzList && s.juzList.length > 0 ? s.juzList.join(', ') : s.juzKe;
                    return `
                      <tr>
                        <td class="center">${idx + 1}</td>
                        <td><b>${escapeHtml(s.studentName)}</b></td>
                        <td class="center">${escapeHtml(s.className || '-')}</td>
                        <td class="center"><b>Juz ${juzText}</b></td>
                        <td class="center">${escapeHtml(s.examTime || '-')}</td>
                        <td>${escapeHtml(s.assignedExaminerName || 'Menunggu Penugasan')}</td>
                      </tr>
                    `;
                  })
                  .join('')
          }
        </tbody>
      </table>

      <div style="margin-top: 20pt; text-align: right; font-size: 10pt;">
        <p>Bandung, ${tglSuratIndo}</p>
        <p style="margin-top: 4pt;">Koordinator LTTQ SMPIT Al Fitrah</p>
        <div style="height: 48pt;"></div>
        <p><b><u>Tim Penguji & Penjadwalan</u></b></p>
      </div>
    </div>
  `;

  await renderAndDownloadPdf(html, [`page-1`, `page-2`], `Surat_Pemberitahuan_Jadwal_${period.nama.replace(/\s+/g, '_')}.pdf`);
}

/**
 * 2. Export Surat Keterangan Hasil Munaqosah Per Siswa
 */
export async function exportSuratHasilMunaqosahPdf(
  item: MunaqosahScheduleItem,
  options?: {
    kepalaSekolah?: string;
    tahunAjaran?: string;
    nomorSurat?: string;
    tanggalSurat?: string;
  }
): Promise<void> {
  const [bandungLogo, alfitrahLogo] = await Promise.all([
    loadLogoDataUrl('/brand/logo_kota_bandung.svg', true),
    loadLogoDataUrl('/brand/logo_ttq_alfitrah.png', false),
  ]);

  const now = new Date();
  const romanMonth = toRomanMonth(now.getMonth() + 1);
  const year = now.getFullYear();
  const nomorSurat = options?.nomorSurat || `124/SPb/SMPITAF.KUR/${romanMonth}/${year}`;
  const tglSuratIndo = formatIndoDate(options?.tanggalSurat || now);
  const kepalaSekolah = options?.kepalaSekolah || 'Ridha Sofia, S.S, M.Pd';
  const tahunAjaran = options?.tahunAjaran || `${year}/${year + 1}`;

  const isLulus = item.hasil === 'lulus' || item.status === 'lulus';
  const statusLabel = isLulus ? 'LULUS' : 'MENGULANG';
  const statusColor = isLulus ? '#15803d' : '#b91c1c';

  const juzText =
    item.juzList && item.juzList.length > 0 ? item.juzList.join(', ') : item.juzKe;

  const tajwid = item.scores?.tajwid ?? '-';
  const kelancaran = item.scores?.kelancaran ?? '-';
  const grade = item.scores?.grade ?? item.grade ?? (isLulus ? 'B' : 'D');
  const catatan =
    item.catatanPenguji ||
    (isLulus
      ? 'Alhamdulillah ananda telah menuntaskan ujian dengan baik, tingkatkan murojaah secara istiqomah.'
      : 'Hafalan ananda masih perlu ditingkatkan kelancaran dan ketepatannya, serta ditekankan untuk lebih banyak murojaah sebagai persiapan untuk mengikuti munaqosyah berikutnya.');

  const html = `
    <style>${COMMON_CSS}</style>

    <div id="page-hasil" class="pdf-page">
      ${generateKopHtml(bandungLogo, alfitrahLogo)}

      <div style="text-align: center; margin-bottom: 14pt;">
        <h2 style="font-size: 11pt; font-weight: bold; text-decoration: underline; letter-spacing: 0.5pt;">
          SURAT KETERANGAN HASIL MUNAQOSYAH TAHFIZH AL QUR'AN
        </h2>
        <p style="font-size: 9.5pt; margin-top: 2pt;">
          Nomor : ${escapeHtml(nomorSurat)}
        </p>
      </div>

      <div style="font-size: 10pt; text-align: justify; line-height: 1.5;">
        <p style="margin-bottom: 10pt;">
          Yang bertandatangan di bawah ini, Kepala Sekolah Menengah Pertama Islam Terpadu (SMPIT) Al Fitrah selaku penyelenggara Munaqosyah tahun ajaran ${escapeHtml(tahunAjaran)} menerangkan bahwa :
        </p>

        <table style="width: 100%; margin-left: 15pt; margin-bottom: 12pt; font-size: 10pt;">
          <tr>
            <td style="width: 110pt; padding: 2.5pt 0;">Nama</td>
            <td style="width: 12pt;">:</td>
            <td><b>${escapeHtml(item.studentName)}</b></td>
          </tr>
          <tr>
            <td style="padding: 2.5pt 0;">Kelas</td>
            <td>:</td>
            <td>${escapeHtml(item.className || '-')}</td>
          </tr>
          <tr>
            <td style="padding: 2.5pt 0;">Munaqosyah Juz</td>
            <td>:</td>
            <td><b>Juz ${juzText}</b></td>
          </tr>
          <tr>
            <td style="padding: 2.5pt 0;">Dinyatakan</td>
            <td>:</td>
            <td><b style="color: ${statusColor}; font-size: 11pt; letter-spacing: 1pt;">${statusLabel}</b></td>
          </tr>
        </table>

        <p style="margin-bottom: 8pt;">
          Dengan rincian perolehan nilai sebagai berikut :
        </p>

        <table class="table-data" style="margin-bottom: 14pt;">
          <thead>
            <tr>
              <th style="width: 18%;">Munaqosyah Juz</th>
              <th style="width: 15%;">Nilai Tajwid</th>
              <th style="width: 18%;">Nilai Kelancaran</th>
              <th style="width: 14%;">Nilai Huruf</th>
              <th style="width: 35%;">Catatan Penguji</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="center"><b>Juz ${juzText}</b></td>
              <td class="center">${tajwid}</td>
              <td class="center">${kelancaran}</td>
              <td class="center"><b>${grade}</b></td>
              <td style="font-style: italic; font-size: 8.5pt;">${escapeHtml(catatan)}</td>
            </tr>
          </tbody>
        </table>

        <p style="margin-bottom: 18pt; text-indent: 20pt;">
          Demikian Surat Keterangan ini kami buat dengan sebenarnya untuk diketahui dan dipergunakan sebagaimana mestinya.
        </p>
      </div>

      <table style="width: 100%; margin-top: 10pt; font-size: 10pt;">
        <tr>
          <td style="width: 55%; vertical-align: top;">
            <div style="font-size: 8.5pt; color: #333; line-height: 1.4;">
              <p><b>Tembusan :</b></p>
              <p>1. Yang bersangkutan.</p>
              <p>2. Arsip.</p>
            </div>
          </td>
          <td style="text-align: center; width: 45%;">
            <p>Bandung, ${tglSuratIndo}</p>
            <p style="margin-top: 2pt;">Mengetahui,</p>
            <p><b>Kepala Satuan Pendidikan</b></p>
            <div style="height: 52pt;"></div>
            <p><b><u>${escapeHtml(kepalaSekolah)}</u></b></p>
          </td>
        </tr>
      </table>
    </div>
  `;

  const cleanName = item.studentName.replace(/[^a-zA-Z0-9]/g, '_');
  await renderAndDownloadPdf(html, ['page-hasil'], `Surat_Hasil_Munaqosah_${cleanName}_Juz_${juzText}.pdf`);
}

/**
 * Helper render HTML to jsPDF
 */
async function renderAndDownloadPdf(
  htmlContent: string,
  elementIds: string[],
  outputFilename: string
): Promise<void> {
  const container = document.createElement('div');
  container.id = 'munaqosah-pdf-offscreen';
  Object.assign(container.style, {
    position: 'fixed',
    top: '-25000px',
    left: '0',
    width: '595pt',
    zIndex: '-1000',
    background: '#ffffff',
  });
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    const pdf = new jsPDF({
      unit: 'pt',
      format: [595, 842], // Standard A4 portrait in points
      orientation: 'portrait',
    });

    for (let i = 0; i < elementIds.length; i++) {
      const el = container.querySelector(`#${elementIds[i]}`) as HTMLElement;
      if (!el) continue;

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 794, // 595pt * (96/72) approx
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      if (i > 0) {
        pdf.addPage([595, 842], 'portrait');
      }
      pdf.addImage(imgData, 'JPEG', 0, 0, 595, 842);
    }

    pdf.save(outputFilename);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
