import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  getAllBoards,
  getBoard,
  saveBoard,
  deleteBoard,
  duplicateBoard,
} from '../db';
import type { Board, Cell } from '../types';

export function useBoards() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const all = await getAllBoards();
    setBoards(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createBoard = useCallback(
    async (name: string, rows: number, cols: number): Promise<Board> => {
      const now = Date.now();
      const cells: Cell[] = Array.from({ length: rows * cols }, (_, i) => ({
        position: i,
        word: '',
        imageData: '',
        imageSource: 'none',
      }));
      const board: Board = {
        id: uuidv4(),
        name,
        rows,
        cols,
        cells,
        createdAt: now,
        updatedAt: now,
      };
      await saveBoard(board);
      await refresh();
      return board;
    },
    [refresh]
  );

  const removeBoard = useCallback(
    async (id: string) => {
      await deleteBoard(id);
      await refresh();
    },
    [refresh]
  );

  const copyBoard = useCallback(
    async (id: string) => {
      await duplicateBoard(id);
      await refresh();
    },
    [refresh]
  );

  const renameBoard = useCallback(
    async (id: string, name: string) => {
      const board = await getBoard(id);
      if (!board) return;
      await saveBoard({ ...board, name, updatedAt: Date.now() });
      await refresh();
    },
    [refresh]
  );

  return { boards, loading, createBoard, removeBoard, copyBoard, renameBoard, refresh };
}

export function useBoardEditor(boardId: string) {
  const [board, setBoard] = useState<Board | null>(null);

  const load = useCallback(async () => {
    const b = await getBoard(boardId);
    setBoard(b ?? null);
  }, [boardId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateCell = useCallback(
    async (position: number, updates: Partial<Cell>) => {
      const b = await getBoard(boardId);
      if (!b) return;
      const cells = b.cells.map((c) =>
        c.position === position ? { ...c, ...updates } : c
      );
      const updated = { ...b, cells, updatedAt: Date.now() };
      await saveBoard(updated);
      setBoard(updated);
    },
    [boardId]
  );

  const renameBoard = useCallback(
    async (name: string) => {
      const b = await getBoard(boardId);
      if (!b) return;
      const updated = { ...b, name, updatedAt: Date.now() };
      await saveBoard(updated);
      setBoard(updated);
    },
    [boardId]
  );

  return { board, updateCell, renameBoard };
}
