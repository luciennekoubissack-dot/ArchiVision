import * as XLSX from 'xlsx';

export function exportToExcel(filename: string, sheetName: string, rows: Record<string, unknown>[]): void {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

export function importFromExcel(file: File): Promise<Record<string, unknown>[]> {
  // Le CSV est lu comme texte (FileReader décode l'UTF-8 correctement) puis
  // parsé en chaîne — lire un CSV comme buffer binaire corrompt les accents,
  // SheetJS ne décodant pas l'UTF-8 des octets bruts pour ce format.
  const isCsv = /\.csv$/i.test(file.name) || file.type === 'text/csv';

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const workbook = isCsv
          ? XLSX.read(reader.result as string, { type: 'string' })
          : XLSX.read(reader.result as ArrayBuffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    if (isCsv) reader.readAsText(file, 'utf-8');
    else reader.readAsArrayBuffer(file);
  });
}
