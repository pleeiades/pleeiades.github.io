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

export interface StoryPage {
  id: string;
  sentence: string;
  imageData: string; // base64 data URL
  imageSource: 'upload' | 'arasaac';
  arasaacId?: number;
}

export interface SocialStory {
  id: string;
  title: string;
  studentName: string;
  createdAt: number;
  updatedAt: number;
  pages: StoryPage[];
}

// Print composer types
export interface PrintRunPage {
  uid: string; // unique per slot in the print run
  type: 'page';
  storyId: string;
  storyTitle: string;
  pageId: string;
  sentence: string;
  imageData: string;
  imageSource: 'upload' | 'arasaac';
  arasaacId?: number;
}

export interface PrintRunCover {
  uid: string;
  type: 'cover';
  title: string;
  studentName: string;
}

export type PrintRunItem = PrintRunPage | PrintRunCover;

export type FontChoice = 'standard' | 'queensland';
export type FontSizeLabel = 'small' | 'medium' | 'large' | 'xl';
export type PagesPerSheet = 1 | 2 | 3 | 4;
