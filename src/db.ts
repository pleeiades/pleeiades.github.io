import Dexie, { type Table } from 'dexie';
import type { Board } from './types';

interface Preference {
  key: string;
  value: string;
}

class AldDatabase extends Dexie {
  boards!: Table<Board>;
  preferences!: Table<Preference>;

  constructor() {
    super('ald-buddy');
    this.version(1).stores({
      boards: 'id, name, updatedAt',
    });
    this.version(2).stores({
      boards: 'id, name, updatedAt',
      preferences: 'key',
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
