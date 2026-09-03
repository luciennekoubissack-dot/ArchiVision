import jsPDF from 'jspdf';

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  triggerDownload(blob, filename);
}

/** Exporte une liste de paires libellé/valeur en CSV (une ligne par entrée). */
export function downloadCsv(rows: { label: string; value: string }[], filename: string): void {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = ['Libellé,Valeur', ...rows.map((r) => `${escape(r.label)},${escape(r.value)}`)];
  // BOM UTF-8 : sans lui, Excel interprète le CSV en ANSI et corrompt les accents.
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/** Exporte un titre + une liste de sections libellé/valeur en PDF (texte simple, mise en page verticale). */
export function downloadPdf(title: string, sections: { label: string; value: string }[], filename: string): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const marginX = 15;
  const maxWidth = 180;
  let y = 20;

  doc.setFontSize(16);
  doc.text(title, marginX, y);
  y += 12;

  sections.forEach((section) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(section.label, marginX, y);
    y += 6;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const lines: string[] = doc.splitTextToSize(section.value || '(non renseigné)', maxWidth);
    doc.text(lines, marginX, y);
    y += lines.length * 5.5 + 6;
  });

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

export interface QuestionnairePdfQuestion {
  intitule: string;
  type: 'OUI_NON' | 'CHOIX_MULTIPLE' | 'NOTE_MAX' | 'REPONSE_OUVERTE' | 'SUGGESTION';
  options?: string[];
  noteMax?: number | null;
}

/**
 * Exporte un questionnaire en PDF sous forme de formulaire vierge : titre,
 * consignes, puis chaque question numérotée avec la zone de réponse adaptée à
 * son type (cases Oui/Non, cases à cocher, note sur un maximum, lignes vides).
 */
export function downloadQuestionnairePdf(
  titre: string,
  description: string | null | undefined,
  questions: QuestionnairePdfQuestion[],
  filename: string,
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const marginX = 15;
  const maxWidth = 180;
  const pageBottom = 282;
  let y = 20;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageBottom) {
      doc.addPage();
      y = 20;
    }
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const titleLines: string[] = doc.splitTextToSize(titre, maxWidth);
  doc.text(titleLines, marginX, y);
  y += titleLines.length * 7 + 3;

  if (description && description.trim()) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines: string[] = doc.splitTextToSize(description.trim(), maxWidth);
    ensureSpace(lines.length * 5);
    doc.text(lines, marginX, y);
    y += lines.length * 5 + 4;
  }

  doc.setDrawColor(180);
  doc.line(marginX, y, marginX + maxWidth, y);
  y += 8;

  questions.forEach((question, index) => {
    ensureSpace(22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const head: string[] = doc.splitTextToSize(`${index + 1}. ${question.intitule}`, maxWidth);
    doc.text(head, marginX, y);
    y += head.length * 5 + 2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    switch (question.type) {
      case 'OUI_NON':
        doc.text('[  ] Oui          [  ] Non', marginX + 4, y);
        y += 7;
        break;
      case 'CHOIX_MULTIPLE':
        for (const option of question.options ?? []) {
          ensureSpace(6);
          const optLines: string[] = doc.splitTextToSize(`[  ] ${option}`, maxWidth - 4);
          doc.text(optLines, marginX + 4, y);
          y += optLines.length * 6;
        }
        y += 1;
        break;
      case 'NOTE_MAX':
        doc.text(`Note :  _______ / ${question.noteMax ?? 5}`, marginX + 4, y);
        y += 7;
        break;
      case 'REPONSE_OUVERTE':
      case 'SUGGESTION':
        doc.setDrawColor(210);
        for (let line = 0; line < 3; line += 1) {
          ensureSpace(7);
          doc.line(marginX + 4, y, marginX + maxWidth, y);
          y += 7;
        }
        y += 1;
        break;
    }
    y += 3;
  });

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

export function downloadSvg(svg: string, filename: string): void {
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  triggerDownload(blob, filename);
}

/** Convertit un SVG (avec width/height explicites sur la racine) en PNG côté client. */
export function downloadPng(svg: string, filename: string): void {
  const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(svgBlob);
  const image = new Image();

  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      URL.revokeObjectURL(url);
      return;
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    URL.revokeObjectURL(url);

    canvas.toBlob((blob) => {
      if (blob) triggerDownload(blob, filename);
    }, 'image/png');
  };

  image.onerror = () => URL.revokeObjectURL(url);
  image.src = url;
}

/** Déclenche le téléchargement d'une data URL (ex : `stage.toDataURL()` d'un canevas Konva). */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.click();
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
