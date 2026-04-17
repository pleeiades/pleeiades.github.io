import jsPDF from 'jspdf';
import type { Board, Cell } from './types';

const A4_W_MM = 297; // landscape
const A4_H_MM = 210;
const A4_W_PT_PORT = 595.28; // portrait points
const A4_H_PT_PORT = 841.89;

const MARGIN_MM = 10;
const HEADER_MM = 14;
const FOOTER_MM = 8;
const CELL_PAD_MM = 3;
const LABEL_H_MM = 8;
const BORDER_MM = 0.4;

function mmToPt(mm: number) {
  return mm * 2.8346;
}

function chooseOrientation(rows: number, cols: number): 'landscape' | 'portrait' {
  return cols > rows ? 'landscape' : 'portrait';
}

export async function exportBoardToPdf(board: Board): Promise<void> {
  const orientation = chooseOrientation(board.rows, board.cols);
  const pageW = orientation === 'landscape' ? A4_W_MM : A4_H_MM;
  const pageH = orientation === 'landscape' ? A4_H_MM : A4_W_MM;

  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });

  const gridW = pageW - MARGIN_MM * 2;
  const gridH = pageH - MARGIN_MM * 2 - HEADER_MM - FOOTER_MM;

  const cellW = gridW / board.cols;
  const cellH = gridH / board.rows;

  const startX = MARGIN_MM;
  const startY = MARGIN_MM + HEADER_MM;

  // Board name header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(board.name, pageW / 2, MARGIN_MM + 8, { align: 'center' });

  // Draw cells
  doc.setLineWidth(BORDER_MM);
  doc.setDrawColor(0);

  for (const cell of board.cells) {
    const col = cell.position % board.cols;
    const row = Math.floor(cell.position / board.cols);

    const x = startX + col * cellW;
    const y = startY + row * cellH;

    // Cell border
    doc.rect(x, y, cellW, cellH);

    // Image
    if (cell.imageData) {
      const imgX = x + CELL_PAD_MM;
      const imgY = y + CELL_PAD_MM;
      const imgW = cellW - CELL_PAD_MM * 2;
      const imgH = cellH - CELL_PAD_MM * 2 - LABEL_H_MM;

      const { w: drawW, h: drawH } = fitInBox(cell, imgW, imgH);
      const drawX = imgX + (imgW - drawW) / 2;
      const drawY = imgY + (imgH - drawH) / 2;

      try {
        const format = detectFormat(cell.imageData);
        doc.addImage(cell.imageData, format, drawX, drawY, drawW, drawH);
      } catch {
        // skip broken images
      }
    }

    // Word label
    if (cell.word) {
      const fontSize = Math.min(18, Math.max(10, cellW * 2.2));
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fontSize);
      doc.setTextColor(0);

      const labelY = y + cellH - CELL_PAD_MM;
      doc.text(cell.word, x + cellW / 2, labelY, {
        align: 'center',
        maxWidth: cellW - CELL_PAD_MM * 2,
      });
    }
  }

  // Footer attribution
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120);
  doc.text(
    'Pictograms from ARASAAC (arasaac.org) — © Sergio Palao, Government of Aragón (CC BY-NC-SA 4.0)',
    pageW / 2,
    pageH - MARGIN_MM + 3,
    { align: 'center' }
  );

  doc.save(`${board.name.replace(/[^a-z0-9]/gi, '_')}.pdf`);
}

function detectFormat(dataUrl: string): string {
  if (dataUrl.startsWith('data:image/png')) return 'PNG';
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
  return 'JPEG';
}

function fitInBox(cell: Cell, maxW: number, maxH: number): { w: number; h: number } {
  // We don't have image dimensions, so fill the box while keeping aspect ratio
  // Use a square assumption as a safe default — jsPDF will stretch if needed,
  // but images are mostly square pictograms
  void cell;
  if (maxW <= maxH) return { w: maxW, h: maxW };
  return { w: maxH, h: maxH };
}

// Keep unused import quiet
void mmToPt;
void A4_W_PT_PORT;
void A4_H_PT_PORT;
