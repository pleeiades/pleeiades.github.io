import type { PrintRunItem, FontChoice, FontSizeLabel, PagesPerSheet } from './types';

export interface PrintSettings {
  pagesPerSheet: PagesPerSheet;
  fontChoice: FontChoice;
  fontSize: FontSizeLabel;
}

// Implemented in Step 6
export async function exportStoriesToPdf(
  _printRun: PrintRunItem[],
  _settings: PrintSettings
): Promise<void> {
  throw new Error('PDF export not yet implemented — coming in Step 6.');
}
