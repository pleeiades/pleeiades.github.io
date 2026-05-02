import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  getAllStories,
  getStory,
  saveStory,
  deleteStory,
  duplicateStory,
} from '../db';
import type { SocialStory, StoryPage } from '../types';

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
}

export function useStories() {
  const [stories, setStories] = useState<SocialStory[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const all = await getAllStories();
    setStories(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createStory = useCallback(
    async (title: string, studentName: string): Promise<SocialStory> => {
      const now = Date.now();
      const story: SocialStory = {
        id: uuidv4(),
        title,
        studentName,
        createdAt: now,
        updatedAt: now,
        pages: [],
      };
      await saveStory(story);
      await refresh();
      return story;
    },
    [refresh]
  );

  const removeStory = useCallback(
    async (id: string) => {
      await deleteStory(id);
      await refresh();
    },
    [refresh]
  );

  const copyStory = useCallback(
    async (id: string) => {
      await duplicateStory(id);
      await refresh();
    },
    [refresh]
  );

  const renameStory = useCallback(
    async (id: string, title: string) => {
      const story = await getStory(id);
      if (!story) return;
      await saveStory({ ...story, title, updatedAt: Date.now() });
      await refresh();
    },
    [refresh]
  );

  return { stories, loading, createStory, removeStory, copyStory, renameStory, refresh };
}

export function useStoryEditor(storyId: string) {
  const [story, setStory] = useState<SocialStory | null>(null);

  const load = useCallback(async () => {
    const s = await getStory(storyId);
    setStory(s ?? null);
  }, [storyId]);

  useEffect(() => {
    load();
  }, [load]);

  const persist = useCallback(async (updated: SocialStory) => {
    await saveStory(updated);
    setStory(updated);
  }, []);

  const updateMeta = useCallback(
    async (updates: Partial<Pick<SocialStory, 'title' | 'studentName'>>) => {
      const s = await getStory(storyId);
      if (!s) return;
      await persist({ ...s, ...updates, updatedAt: Date.now() });
    },
    [storyId, persist]
  );

  const addPage = useCallback(async (): Promise<void> => {
    const s = await getStory(storyId);
    if (!s) return;
    const page: StoryPage = {
      id: uuidv4(),
      sentence: '',
      imageData: '',
      imageSource: 'upload',
    };
    await persist({ ...s, pages: [...s.pages, page], updatedAt: Date.now() });
  }, [storyId, persist]);

  const updatePage = useCallback(
    async (pageId: string, updates: Partial<StoryPage>): Promise<void> => {
      const s = await getStory(storyId);
      if (!s) return;
      const pages = s.pages.map((p) => (p.id === pageId ? { ...p, ...updates } : p));
      await persist({ ...s, pages, updatedAt: Date.now() });
    },
    [storyId, persist]
  );

  const deletePage = useCallback(
    async (pageId: string): Promise<void> => {
      const s = await getStory(storyId);
      if (!s) return;
      await persist({
        ...s,
        pages: s.pages.filter((p) => p.id !== pageId),
        updatedAt: Date.now(),
      });
    },
    [storyId, persist]
  );

  const reorderPages = useCallback(
    async (fromIndex: number, toIndex: number): Promise<void> => {
      const s = await getStory(storyId);
      if (!s) return;
      await persist({ ...s, pages: moveItem(s.pages, fromIndex, toIndex), updatedAt: Date.now() });
    },
    [storyId, persist]
  );

  return { story, updateMeta, addPage, updatePage, deletePage, reorderPages };
}
