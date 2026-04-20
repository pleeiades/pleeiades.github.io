export interface Cell {
  position: number; // 0-indexed, left-to-right top-to-bottom
  word: string;
  imageData: string; // base64 data URL
  imageSource: 'arasaac' | 'upload' | 'none';
  arasaacId?: number;
}

export interface Board {
  id: string;
  name: string;
  rows: number;
  cols: number;
  cells: Cell[];
  createdAt: number;
  updatedAt: number;
}

export type BoardSize =
  | '2x2' | '2x3' | '3x3' | '3x4' | '4x4' | '4x6' | '5x5' | 'custom';

export interface ArasaacResult {
  _id: number;
  keywords: Array<{ keyword: string; type: number; meaning: string }>;
  categories: string[];
}
