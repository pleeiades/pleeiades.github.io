import Dexie, { type Table } from 'dexie';
import type { Board, SocialStory } from './types';

interface Preference {
  key: string;
  value: string;
}

class AldDatabase extends Dexie {
  boards!: Table<Board>;
  preferences!: Table<Preference>;
  socialStories!: Table<SocialStory>;

  constructor() {
    super('ald-buddy');
    this.version(1).stores({
      boards: 'id, name, updatedAt',
    });
    this.version(2).stores({
      boards: 'id, name, updatedAt',
      preferences: 'key',
    });
    this.version(3).stores({
      boards: 'id, name, updatedAt',
      preferences: 'key',
      socialStories: 'id, title, updatedAt',
    });
  }
}

export const db = new AldDatabase();

export async function getAllBoards(): Promise<Board[]> {
  return db.boards.orderBy('updatedAt').reverse().toArray();
}

export async function getBoard(id: string): Promise<Board | undefined> {
  return db.boards.get(id);
}

export async function saveBoard(board: Board): Promise<void> {
  await db.boards.put(board);
}

export async function deleteBoard(id: string): Promise<void> {
  await db.boards.delete(id);
}

export async function duplicateBoard(id: string): Promise<Board | null> {
  const original = await db.boards.get(id);
  if (!original) return null;
  const now = Date.now();
  const copy: Board = {
    ...original,
    id: crypto.randomUUID(),
    name: `${original.name} (copy)`,
    createdAt: now,
    updatedAt: now,
  };
  await db.boards.put(copy);
  return copy;
}

// Social Stories CRUD

export async function getAllStories(): Promise<SocialStory[]> {
  return db.socialStories.orderBy('updatedAt').reverse().toArray();
}

export async function getStory(id: string): Promise<SocialStory | undefined> {
  return db.socialStories.get(id);
}

export async function saveStory(story: SocialStory): Promise<void> {
  await db.socialStories.put(story);
}

export async function deleteStory(id: string): Promise<void> {
  await db.socialStories.delete(id);
}

export async function duplicateStory(id: string): Promise<SocialStory | null> {
  const original = await db.socialStories.get(id);
  if (!original) return null;
  const now = Date.now();
  const copy: SocialStory = {
    ...original,
    id: crypto.randomUUID(),
    title: `${original.title} (copy)`,
    createdAt: now,
    updatedAt: now,
  };
  await db.socialStories.put(copy);
  return copy;
}
