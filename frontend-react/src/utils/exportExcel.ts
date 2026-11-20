/**
 * Professional Styled Excel Generator (XML Spreadsheet 2003 / SpreadsheetML)
 * 100% compatible with Microsoft Excel, Google Sheets, and LibreOffice.
 * Features:
 * - Real multi-column layout (no column cramming)
 * - Beautiful Table Theme (Slate & Emerald headers with white text)
 * - Formal Company Title Banner (Owner name, outlet name, print timestamp)
 * - Proper cell borders, font sizes, and alignments
 * - Native Excel Currency formatting ("Rp "#,##0)
 * - Summary Totals Row with double bottom border
 */

export interface ExcelColumn {
  header: string;
  width?: number; // width in points, default 120
  type?: 'text' | 'center' | 'currency' | 'number';
}

export interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
  reportTitle: string;
  reportSubtitle?: string;
  columns: ExcelColumn[];
  rows: (string | number | null | undefined)[][];
  totalLabel?: string;
  totalColumns?: { [colIndex: number]: number }; // colIndex -> total sum
}

function escapeXml(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function exportToStyledExcel(options: ExcelExportOptions) {
  const {
    filename,
    sheetName = 'Laporan',
    reportTitle,
    reportSubtitle = 'Dicetak otomatis oleh Sistem ESB Coffee ERP',
    columns,
    rows,
    totalLabel = 'TOTAL KESELURUHAN',
    totalColumns = {},
  } = options;

  const now = new Date();
  const printDateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const printTimeStr = now.toLocaleTimeString('id-ID', { hour12: false }) + ' WIB';

  // Build Column Widths
  const columnTags = columns
    .map((col) => `<Column ss:Width="${col.width || 120}"/>`)
    .join('\n    ');

  // Build Data Rows
  const dataRowsXml = rows
    .map((row) => {
      const cellsXml = row
        .map((cellVal, colIdx) => {
          const colDef = columns[colIdx] || { type: 'text' };
          const colType = colDef.type || 'text';

          if (colType === 'currency' || colType === 'number') {
            const num = Number(cellVal) || 0;
            const styleId = colType === 'currency' ? 'CellCurrency' : 'CellNumber';
            return `<Cell ss:StyleID="${styleId}"><Data ss:Type="Number">${num}</Data></Cell>`;
          }

          if (colType === 'center') {
            return `<Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(cellVal)}</Data></Cell>`;
          }

          return `<Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(cellVal)}</Data></Cell>`;
        })
        .join('');
      return `   <Row ss:Height="22">\n    ${cellsXml}\n   </Row>`;
    })
    .join('\n');

  // Build Total Row if totalColumns is provided
  let totalRowXml = '';
  if (Object.keys(totalColumns).length > 0) {
    const totalCells = columns
      .map((colDef, colIdx) => {
        if (colIdx === 0) {
          return `<Cell ss:StyleID="TotalLabel"><Data ss:Type="String">${escapeXml(totalLabel)}</Data></Cell>`;
        }
        if (totalColumns[colIdx] !== undefined) {
          const num = totalColumns[colIdx];
          const styleId = colDef.type === 'currency' ? 'TotalCurrency' : 'TotalNumber';
          return `<Cell ss:StyleID="${styleId}"><Data ss:Type="Number">${num}</Data></Cell>`;
        }
        return `<Cell ss:StyleID="TotalEmpty"><Data ss:Type="String"></Data></Cell>`;
      })
      .join('');
    totalRowXml = `   <Row ss:Height="26">\n    ${totalCells}\n   </Row>`;
  }

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Faiz Rifki Syuhada</Author>
  <Company>ESB Coffee &amp; Eatery</Company>
  <Created>${now.toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#0F172A"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>

  <!-- Title Style -->
  <Style ss:ID="ReportTitle">
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#0F172A"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>

  <!-- Subtitle Style -->
  <Style ss:ID="ReportSubtitle">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#475569"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>

  <!-- Info Header Badge -->
  <Style ss:ID="ReportMeta">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Italic="1" ss:Color="#64748B"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>

  <!-- Table Header Style (Dark Slate 900 with Crisp White Text) -->
  <Style ss:ID="TableHeader">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0284C7"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155"/>
   </Borders>
  </Style>

  <!-- Data Cells -->
  <Style ss:ID="CellText">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>

  <Style ss:ID="CellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>

  <Style ss:ID="CellNumber">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>

  <Style ss:ID="CellCurrency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="&quot;Rp &quot;#,##0"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>

  <!-- Summary Totals Row -->
  <Style ss:ID="TotalLabel">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F172A"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>

  <Style ss:ID="TotalEmpty">
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F172A"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>

  <Style ss:ID="TotalCurrency">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="&quot;Rp &quot;#,##0"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F172A"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>

  <Style ss:ID="TotalNumber">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F172A"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
 </Styles>

 <Worksheet ss:Name="${escapeXml(sheetName)}">
  <Table ss:DefaultRowHeight="20">
    ${columnTags}

   <!-- Company Title Banner -->
   <Row ss:Height="28">
    <Cell ss:StyleID="ReportTitle"><Data ss:Type="String">☕ ${escapeXml(reportTitle)}</Data></Cell>
   </Row>

   <!-- Report Subtitle -->
   <Row ss:Height="18">
    <Cell ss:StyleID="ReportSubtitle"><Data ss:Type="String">${escapeXml(reportSubtitle)}</Data></Cell>
   </Row>

   <!-- Metadata Banner (Owner, Outlet, Print Timestamp) -->
   <Row ss:Height="18">
    <Cell ss:StyleID="ReportMeta"><Data ss:Type="String">Owner: Faiz Rifki Syuhada | Tanggal Cetak: ${printDateStr}, ${printTimeStr} | Status: Resmi</Data></Cell>
   </Row>

   <!-- Blank Spacer Row -->
   <Row ss:Height="10"/>

   <!-- Table Header Row -->
   <Row ss:Height="28">
    ${columns.map((c) => `<Cell ss:StyleID="TableHeader"><Data ss:Type="String">${escapeXml(c.header)}</Data></Cell>`).join('\n    ')}
   </Row>

   <!-- Data Rows -->
${dataRowsXml}

   <!-- Summary Totals Row (if any) -->
${totalRowXml}

  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <PageSetup>
    <Layout x:Orientation="Landscape"/>
   </PageSetup>
   <FitToPage/>
   <Print>
    <FitWidth>1</FitWidth>
    <FitHeight>999</FitHeight>
    <ValidPrinterInfo/>
   </Print>
   <Selected/>
   <DoNotDisplayGridlines/>
   <DisplayGridlines/>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xmlContent], {
    type: 'application/vnd.ms-excel;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    filename.endsWith('.xls') ? filename : `${filename}.xls`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
