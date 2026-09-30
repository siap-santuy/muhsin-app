import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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

export async function exportStudentListPdf(
  students: StudentRecord[],
  schoolName = 'SMP ISLAM TERPADU AL FITRAH'
): Promise<void> {
  const [smpLogo, ttqLogo] = await Promise.all([
    loadLogoDataUrl('/brand/logo_smp_exact.jpg'),
    loadLogoDataUrl('/brand/logo_ttq_exact.png'),
  ]);

  const html = `
<style>
  #student-list-offscreen * { box-sizing: border-box; margin: 0; padding: 0; }
  .list-page {
    width: 612pt;
    padding: 24pt;
    background: #fff;
    font-family: Calibri, Arial, sans-serif;
    color: #000;
  }
  .header-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12pt;
    border-bottom: 2pt solid #000;
    padding-bottom: 6pt;
  }
  .header-table td { vertical-align: middle; }
  .logo-cell { width: 85pt; text-align: center; }
  .title-cell { text-align: center; line-height: 1.3; }
  .title-cell h2 { font-size: 13pt; font-weight: bold; }
  .title-cell h3 { font-size: 11pt; font-weight: bold; color: #222; }
  table.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5pt;
    margin-top: 8pt;
  }
  table.data-table th, table.data-table td {
    border: 1pt solid #333;
    padding: 5pt 6pt;
    vertical-align: middle;
  }
  table.data-table th {
    background: #0D5C75;
    color: #fff;
    font-weight: bold;
    text-align: center;
  }
  .center { text-align: center; }
  tr:nth-child(even) { background-color: #f8f9fa; }
</style>
<div class="list-page" id="list-card">
  <table class="header-table">
    <tr>
      <td class="logo-cell">
        ${smpLogo ? `<img src="${smpLogo}" style="max-width: 75pt; max-height: 60pt; object-fit: contain;" />` : ''}
      </td>
      <td class="title-cell">
        <h2>${escapeHtml(schoolName)}</h2>
        <h3>DAFTAR CAPAIAN SISWA TTQ</h3>
        <p style="font-size: 9pt; color: #555; margin-top: 3pt;">
          Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </td>
      <td class="logo-cell">
        ${ttqLogo ? `<img src="${ttqLogo}" style="max-width: 95pt; max-height: 60pt; object-fit: contain;" />` : ''}
      </td>
    </tr>
  </table>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 5%;">No</th>
        <th style="width: 25%;">Nama Siswa</th>
        <th style="width: 15%;">Kelas</th>
        <th style="width: 8%;">Level</th>
        <th style="width: 12%;">Total EXP</th>
        <th style="width: 10%;">Streak</th>
        <th style="width: 25%;">Email</th>
      </tr>
    </thead>
    <tbody>
      ${students.map((s, idx) => `
        <tr>
          <td class="center">${idx + 1}</td>
          <td><b>${escapeHtml(s.name)}</b></td>
          <td class="center">${escapeHtml(s.className ?? '-')}</td>
          <td class="center">${s.level ?? 0}</td>
          <td class="center">${(s.totalExp ?? 0).toLocaleString('id-ID')}</td>
          <td class="center">${s.currentStreak ?? 0} hari</td>
          <td>${escapeHtml(s.email)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</div>
`;

  const container = document.createElement('div');
  container.id = 'student-list-offscreen';
  Object.assign(container.style, {
    position: 'fixed',
    top: '-20000px',
    left: '0',
    width: '612pt',
    zIndex: '-1000',
    background: '#ffffff',
  });
  container.innerHTML = html;
  document.body.appendChild(container);

  const filename = `${schoolName.replace(/\s+/g, '_')}_daftar_siswa.pdf`;

  try {
    const cardEl = container.querySelector('#list-card') as HTMLElement;
    const canvas = await html2canvas(cardEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 816,
    });

    const pdf = new jsPDF({
      unit: 'pt',
      format: [612, 792],
      orientation: 'portrait',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdfHeight = (canvas.height * 612) / canvas.width;
    pdf.addImage(imgData, 'JPEG', 0, 0, 612, Math.min(pdfHeight, 792));

    pdf.save(filename);
  } catch (error) {
    console.error('Gagal mengekspor PDF:', error);
    throw new Error('Gagal mengekspor daftar siswa ke PDF: ' + (error instanceof Error ? error.message : String(error)));
  } finally {
    document.body.removeChild(container);
  }
}
