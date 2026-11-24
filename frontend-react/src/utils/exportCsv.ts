/**
 * Enhanced Excel & Spreadsheet Exporter
 * Generates beautifully styled Microsoft Excel (.xls) spreadsheets with:
 * - Brand title banner & metadata (Owner, Date, Outlet)
 * - KPI summary cards
 * - Colored table headers with borders
 * - Zebra row styling & auto-alignments (numeric, date, text)
 * - Auto-splits columns cleanly in Excel without CSV delimiter issues.
 */

export interface ExcelSummaryItem {
  label: string;
  value: string | number;
}

export interface ExportStyledExcelOptions {
  filename: string;
  title: string;
  subtitle?: string;
  author?: string;
  summaryItems?: ExcelSummaryItem[];
  headers: string[];
  rows: (string | number | null | undefined)[][];
  alignments?: ('left' | 'center' | 'right')[];
  themeColor?: string; // Header background color
}

export function formatDateTimeWIB(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(d).replace(/\./g, ':');
  } catch {
    return String(dateStr);
  }
}

export function exportStyledExcel({
  filename,
  title,
  subtitle,
  author = 'Faiz Rifki Syuhada (Owner)',
  summaryItems = [],
  headers,
  rows,
  alignments = [],
  themeColor = '#0f172a', // Elegant dark slate/navy
}: ExportStyledExcelOptions) {
  const colCount = Math.max(headers.length, 6);
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('id-ID', { hour12: false }) + ' WIB';

  // Build Summary Rows HTML if any
  let summaryHtml = '';
  if (summaryItems.length > 0) {
    summaryHtml += `
      <tr><td colspan="${colCount}" style="height: 10px;"></td></tr>
      <tr>
        <td colspan="${colCount}" style="font-size: 11pt; font-weight: bold; color: #334155; padding: 4px 8px;">
          📊 RINGKASAN EKSEKUTIF:
        </td>
      </tr>
      <tr>
    `;
    summaryItems.forEach((item) => {
      summaryHtml += `
        <td style="background-color: #f1f5f9; border: 1px solid #cbd5e1; font-size: 9pt; font-weight: bold; color: #475569; padding: 6px 10px;">
          ${escapeHtml(item.label)}:<br/>
          <span style="font-size: 11pt; color: #0f172a; font-family: Consolas, monospace;">${escapeHtml(String(item.value))}</span>
        </td>
      `;
    });
    // Fill remaining cells
    const remainingCols = colCount - summaryItems.length;
    if (remainingCols > 0) {
      summaryHtml += `<td colspan="${remainingCols}" style="background-color: #f8fafc; border: 1px solid #cbd5e1;"></td>`;
    }
    summaryHtml += `</tr><tr><td colspan="${colCount}" style="height: 14px;"></td></tr>`;
  }

  // Build Table Header HTML
  const headerHtml = headers
    .map(
      (h) => `
      <th style="background-color: ${themeColor}; color: #ffffff; font-weight: bold; font-size: 10pt; text-align: center; border: 1px solid #475569; padding: 10px 12px; vertical-align: middle;">
        ${escapeHtml(h)}
      </th>
    `
    )
    .join('');

  // Build Table Body Rows HTML
  const rowsHtml = rows
    .map((row, rowIdx) => {
      const isEven = rowIdx % 2 === 0;
      const bg = isEven ? '#ffffff' : '#f8fafc';

      const cells = row
        .map((cell, colIdx) => {
          const rawVal = cell === null || cell === undefined ? '' : String(cell);
          const align = alignments[colIdx] || detectAlignment(rawVal, colIdx);

          let cellStyle = `background-color: ${bg}; border: 1px solid #cbd5e1; font-size: 9.5pt; padding: 7px 10px; color: #1e293b; text-align: ${align};`;
          let formattedVal = escapeHtml(rawVal);

          // If numeric value or currency
          const isNum = typeof cell === 'number';
          const isCurrency = rawVal.startsWith('Rp') || (!isNaN(Number(rawVal.replace(/[.,]/g, ''))) && rawVal.trim() !== '' && !rawVal.startsWith('0') && !rawVal.includes('-') && !rawVal.includes(':'));

          if (isNum || isCurrency) {
            cellStyle += ` font-family: Consolas, monospace; mso-number-format:"\\#\\,\\#\\#0";`;
          } else {
            cellStyle += ` mso-number-format:"\\@";`;
          }

          // Status Badges coloring
          if (rawVal === 'PAID' || rawVal === 'COMPLETED' || rawVal === 'LUNAS' || rawVal === 'Sedang Bertugas' || rawVal === 'AMAN') {
            formattedVal = `<span style="font-weight: bold; color: #047857;">● ${formattedVal}</span>`;
          } else if (rawVal === 'UNPAID' || rawVal === 'Belum Hadir' || rawVal === 'PERLU RESTOCK') {
            formattedVal = `<span style="font-weight: bold; color: #b91c1c;">● ${formattedVal}</span>`;
          } else if (rawVal === 'Selesai Shift') {
            formattedVal = `<span style="font-weight: bold; color: #475569;">${formattedVal}</span>`;
          }

          return `<td style="${cellStyle}">${formattedVal}</td>`;
        })
        .join('');

      return `<tr>${cells}</tr>`;
    })
    .join('');

  // Full HTML Excel Spreadsheet
  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Laporan</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
                <x:Print>
                  <x:ValidPrinterInfo/>
                </x:Print>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
      </style>
    </head>
    <body style="padding: 10px;">
      <table>
        <!-- Header Banner -->
        <tr>
          <td colspan="${colCount}" style="background-color: ${themeColor}; color: #ffffff; font-size: 15pt; font-weight: bold; padding: 12px 14px; text-align: left; border: 1px solid ${themeColor};">
            ☕ KEDAI KOPI KITA — SISTEM PEMESANAN MANDIRI QR CODE
          </td>
        </tr>
        <tr>
          <td colspan="${colCount}" style="background-color: #1e293b; color: #fbbf24; font-size: 12pt; font-weight: bold; padding: 8px 14px; border: 1px solid #1e293b;">
            ${escapeHtml(title.toUpperCase())}
          </td>
        </tr>
        ${
          subtitle
            ? `
        <tr>
          <td colspan="${colCount}" style="font-size: 10pt; color: #64748b; padding: 4px 8px; font-style: italic;">
            ${escapeHtml(subtitle)}
          </td>
        </tr>`
            : ''
        }
        <tr>
          <td colspan="${colCount}" style="font-size: 9pt; color: #475569; padding: 4px 8px; border-bottom: 2px solid #cbd5e1;">
            📅 Tanggal Unduh: <b>${dateFormatted} (${timeFormatted})</b> &nbsp;|&nbsp; 👤 Dikeluarkan Oleh: <b>${escapeHtml(author)}</b>
          </td>
        </tr>

        <!-- Summary KPI Section -->
        ${summaryHtml}

        <!-- Data Table -->
        <thead>
          <tr style="height: 32px;">
            ${headerHtml}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </body>
    </html>
  `.trim();

  // Export as .xls with Excel MIME type
  const blob = new Blob(['\uFEFF' + excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const cleanFilename = filename.replace(/\.(csv|xls|xlsx)$/i, '');
  link.setAttribute('download', `${cleanFilename}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Helper to escape HTML characters
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Auto-detect column alignment based on contents
function detectAlignment(val: string, _colIdx: number): 'left' | 'center' | 'right' {
  const trimmed = val.trim();
  if (!trimmed) return 'center';

  // Currency or Numbers
  if (trimmed.startsWith('Rp') || !isNaN(Number(trimmed.replace(/[.,]/g, '')))) {
    return 'right';
  }

  // Dates, Times, Status, IDs, Codes
  if (
    trimmed.includes(':') ||
    trimmed.includes('-') && (trimmed.startsWith('ORD-') || trimmed.startsWith('TB-') || trimmed.startsWith('EMP-')) ||
    ['PAID', 'UNPAID', 'COMPLETED', 'QRIS', 'CASH', 'Dine In', 'Takeaway', 'QR Meja', 'POS Kasir'].includes(trimmed)
  ) {
    return 'center';
  }

  return 'left';
}

/**
 * Standard CSV fallback
 */
export function exportToCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  exportStyledExcel({
    filename,
    title: filename.replace(/_/g, ' '),
    headers,
    rows,
  });
}
