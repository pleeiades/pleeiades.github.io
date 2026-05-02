import type { PrintRunItem, PrintRunPage, PrintRunCover, PagesPerSheet, FontSizeLabel } from './types';

export interface PrintSettings {
  pagesPerSheet: PagesPerSheet;
  fontChoice: 'standard' | 'queensland';
  fontSize: FontSizeLabel;
}

// Sentence pt sizes per pages-per-sheet × size label.
// Values scale down as more slots are packed per page.
const FONT_PT: Record<PagesPerSheet, Record<FontSizeLabel, number>> = {
  1: { small: 16, medium: 20, large: 24, xl: 28 },
  2: { small: 13, medium: 16, large: 20, xl: 24 },
  3: { small: 11, medium: 13, large: 16, xl: 20 },
  4: { small:  9, medium: 11, large: 14, xl: 18 },
};

const A4_W_MM = 210;
const A4_H_MM = 297;
const MARGIN_MM = 12;
const FOOTER_MM = 10;

// A4 at 96 dpi, used as the html2canvas render container.
const A4_PX_W = 794;
const A4_PX_H = 1123;
const MARGIN_PX = 46;
const FOOTER_PX = 26;

interface PdfContentPage {
  type: 'content';
  slots: PrintRunPage[];
}

interface PdfCoverPage {
  type: 'cover';
  item: PrintRunCover;
}

type PdfPage = PdfContentPage | PdfCoverPage;

function buildLayout(printRun: PrintRunItem[], pagesPerSheet: PagesPerSheet): PdfPage[] {
  const pages: PdfPage[] = [];
  let buffer: PrintRunPage[] = [];

  const flush = () => {
    if (buffer.length > 0) {
      pages.push({ type: 'content', slots: [...buffer] });
      buffer = [];
    }
  };

  for (const item of printRun) {
    if (item.type === 'cover') {
      flush();
      pages.push({ type: 'cover', item });
    } else {
      buffer.push(item);
      if (buffer.length === pagesPerSheet) flush();
    }
  }
  flush();
  return pages;
}

function detectFormat(dataUrl: string): string {
  if (dataUrl.startsWith('data:image/png')) return 'PNG';
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
  return 'JPEG';
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function exportStoriesToPdf(
  printRun: PrintRunItem[],
  settings: PrintSettings
): Promise<void> {
  if (printRun.length === 0) return;

  const layout = buildLayout(printRun, settings.pagesPerSheet);
  const hasArasaac = printRun.some(
    (item): item is PrintRunPage => item.type === 'page' && item.imageSource === 'arasaac'
  );

  if (settings.fontChoice === 'queensland') {
    await exportQueensland(layout, settings, hasArasaac);
  } else {
    await exportStandard(layout, settings, hasArasaac);
  }
}

// ─── Standard font path (pure jsPDF, Helvetica) ────────────────────────────

async function exportStandard(
  layout: PdfPage[],
  settings: PrintSettings,
  hasArasaac: boolean
): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const fontPt = FONT_PT[settings.pagesPerSheet][settings.fontSize];

  for (let pageIdx = 0; pageIdx < layout.length; pageIdx++) {
    const page = layout[pageIdx];
    const isLastPage = pageIdx === layout.length - 1;
    const showFooter = isLastPage && hasArasaac;

    if (pageIdx > 0) doc.addPage();

    if (page.type === 'cover') {
      renderStandardCover(doc, page.item);
    } else {
      renderStandardContent(doc, page.slots, settings.pagesPerSheet, fontPt, showFooter);
    }
  }

  doc.save('social-stories.pdf');
}

function renderStandardCover(
  doc: InstanceType<Awaited<typeof import('jspdf')>['default']>,
  item: PrintRunCover
): void {
  const title = item.title || 'Social Story';
  const midY = A4_H_MM / 2;

  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  const titleLines = doc.splitTextToSize(title, A4_W_MM - MARGIN_MM * 2);
  const titleBlockH = titleLines.length * 32 * 0.352778 * 1.3;
  const titleStartY = item.studentName ? midY - titleBlockH - 6 : midY - titleBlockH / 2;
  doc.text(titleLines, A4_W_MM / 2, titleStartY, { align: 'center' });

  if (item.studentName) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(20);
    doc.text(item.studentName, A4_W_MM / 2, midY + 10, { align: 'center' });
  }
}

function renderStandardContent(
  doc: InstanceType<Awaited<typeof import('jspdf')>['default']>,
  slots: PrintRunPage[],
  pagesPerSheet: PagesPerSheet,
  fontPt: number,
  showFooter: boolean
): void {
  const footerH = showFooter ? FOOTER_MM : 0;
  const availH = A4_H_MM - MARGIN_MM * 2 - footerH;
  const slotH = availH / pagesPerSheet;
  const ptToMm = 0.352778;

  for (let si = 0; si < slots.length; si++) {
    const slot = slots[si];
    const slotTop = MARGIN_MM + si * slotH;

    if (si > 0) {
      doc.setLineWidth(0.3);
      doc.setDrawColor(180);
      doc.line(MARGIN_MM, slotTop, A4_W_MM - MARGIN_MM, slotTop);
    }

    const imgAreaH = slotH * 0.65;
    const txtAreaH = slotH * 0.35;
    const pad = 3;

    if (slot.imageData) {
      const maxW = A4_W_MM - MARGIN_MM * 2 - pad * 2;
      const maxH = imgAreaH - pad * 2;
      const size = Math.min(maxW, maxH);
      const imgX = MARGIN_MM + (A4_W_MM - MARGIN_MM * 2 - size) / 2;
      const imgY = slotTop + pad;
      try {
        doc.addImage(slot.imageData, detectFormat(slot.imageData), imgX, imgY, size, size);
      } catch {
        // skip broken image
      }
    }

    if (slot.sentence) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontPt);
      doc.setTextColor(0);
      const maxW = A4_W_MM - MARGIN_MM * 2 - pad * 2;
      const lines = doc.splitTextToSize(slot.sentence, maxW);
      const lineH = fontPt * ptToMm * 1.4;
      const blockH = lines.length * lineH;
      const textY = slotTop + imgAreaH + (txtAreaH - blockH) / 2 + fontPt * ptToMm;
      doc.text(lines, A4_W_MM / 2, textY, { align: 'center' });
    }
  }

  if (showFooter) {
    const lineY = A4_H_MM - MARGIN_MM - footerH;
    doc.setLineWidth(0.3);
    doc.setDrawColor(200);
    doc.line(MARGIN_MM, lineY, A4_W_MM - MARGIN_MM, lineY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(
      'Pictograms: ARASAAC (arasaac.org) — Sergio Palao, Gobierno de Aragón, CC BY-NC-SA',
      A4_W_MM / 2,
      lineY + 4,
      { align: 'center' }
    );
  }
}

// ─── Queensland font path (html2canvas) ────────────────────────────────────
// html2canvas renders the HTML that the browser draws (including the loaded
// Edu QLD Beginner font), then we embed the resulting image in jsPDF.
// Tradeoff vs jsPDF font embedding: text is not selectable in the PDF and
// generation is slower, but the font is guaranteed to render correctly.

async function exportQueensland(
  layout: PdfPage[],
  settings: PrintSettings,
  hasArasaac: boolean
): Promise<void> {
  await ensureQueenslandFont();

  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const fontPt = FONT_PT[settings.pagesPerSheet][settings.fontSize];
  // Convert pt to px at 96 dpi (1pt = 1.333px)
  const fontPx = Math.round(fontPt * 1.333);

  const container = document.createElement('div');
  container.style.cssText = `position:fixed;top:-9999px;left:0;width:${A4_PX_W}px;height:${A4_PX_H}px;overflow:hidden;`;
  document.body.appendChild(container);

  try {
    for (let pageIdx = 0; pageIdx < layout.length; pageIdx++) {
      const page = layout[pageIdx];
      const isLastPage = pageIdx === layout.length - 1;
      const showFooter = isLastPage && hasArasaac;

      container.innerHTML = buildPageHtml(page, settings.pagesPerSheet, fontPx, showFooter);

      await waitForImages(container);

      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        // data: URLs are same-origin, no CORS needed
        useCORS: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      if (pageIdx > 0) doc.addPage();
      doc.addImage(imgData, 'JPEG', 0, 0, A4_W_MM, A4_H_MM);
    }
  } finally {
    document.body.removeChild(container);
  }

  doc.save('social-stories.pdf');
}

function buildPageHtml(
  page: PdfPage,
  pagesPerSheet: PagesPerSheet,
  fontPx: number,
  showFooter: boolean
): string {
  const FONT = `'Edu QLD Beginner', system-ui, sans-serif`;

  const footerHtml = showFooter
    ? `<div style="font-size:9px;color:#888;text-align:center;padding-top:4px;border-top:1px solid #ddd;font-family:system-ui,sans-serif;flex-shrink:0;">
         Pictograms: ARASAAC (arasaac.org) — Sergio Palao, Gobierno de Aragón, CC BY-NC-SA
       </div>`
    : '';

  if (page.type === 'cover') {
    const { item } = page;
    const titlePx = Math.round(fontPx * 2.2);
    const studentPx = Math.round(fontPx * 1.4);
    return `<div style="width:${A4_PX_W}px;height:${A4_PX_H}px;background:white;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:${FONT};padding:${MARGIN_PX}px;box-sizing:border-box;gap:20px;">
      <h1 style="font-size:${titlePx}px;text-align:center;color:#000;margin:0;line-height:1.2;">${esc(item.title || 'Social Story')}</h1>
      ${item.studentName ? `<p style="font-size:${studentPx}px;text-align:center;color:#333;margin:0;">${esc(item.studentName)}</p>` : ''}
      ${footerHtml}
    </div>`;
  }

  const { slots } = page;
  const footerAlloc = showFooter ? FOOTER_PX : 0;
  const availPx = A4_PX_H - MARGIN_PX * 2 - footerAlloc;
  const slotPx = Math.floor(availPx / pagesPerSheet);
  const imgMaxPx = Math.floor(slotPx * 0.65);

  const slotsHtml = slots
    .map((slot, i) => {
      const divider = i < slots.length - 1 ? 'border-bottom:1px solid #ccc;' : '';
      const imgHtml = slot.imageData
        ? `<img src="${slot.imageData}" style="max-height:${imgMaxPx}px;max-width:100%;object-fit:contain;display:block;flex-shrink:0;" alt="" />`
        : '';
      const sentenceHtml = slot.sentence
        ? `<p style="font-size:${fontPx}px;text-align:center;margin:${slot.imageData ? '8px' : '0'} 0 0 0;color:#000;line-height:1.4;padding:0 8px;word-break:break-word;flex-shrink:0;">${esc(slot.sentence)}</p>`
        : '';
      return `<div style="height:${slotPx}px;display:flex;flex-direction:column;align-items:center;justify-content:center;${divider}flex-shrink:0;overflow:hidden;padding:6px 0;">
        ${imgHtml}${sentenceHtml}
      </div>`;
    })
    .join('');

  return `<div style="width:${A4_PX_W}px;height:${A4_PX_H}px;background:white;padding:${MARGIN_PX}px;box-sizing:border-box;font-family:${FONT};display:flex;flex-direction:column;overflow:hidden;">
    <div style="display:flex;flex-direction:column;flex:1;overflow:hidden;">${slotsHtml}</div>
    ${footerHtml}
  </div>`;
}

async function waitForImages(container: HTMLElement): Promise<void> {
  const imgs = [...container.querySelectorAll('img')];
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if ((img as HTMLImageElement).complete) resolve();
          else {
            (img as HTMLImageElement).onload = () => resolve();
            (img as HTMLImageElement).onerror = () => resolve();
          }
        })
    )
  );
}

async function ensureQueenslandFont(): Promise<void> {
  const FAMILY = 'Edu QLD Beginner';
  // The @fontsource import in main.tsx registers the font — we just wait for
  // the browser to finish loading it (usually already done at this point).
  try {
    await Promise.race([
      document.fonts.load(`400 16px "${FAMILY}"`),
      new Promise<void>((resolve) => setTimeout(resolve, 4000)),
    ]);
  } catch {
    // Timeout or load failure — html2canvas will use the fallback font.
    console.warn('Edu QLD Beginner font not ready; using fallback.');
  }
}
