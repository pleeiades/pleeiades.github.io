import { useState, useCallback } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStoryEditor } from '../hooks/useStories';
import type { StoryPage } from '../types';
import PageEditor from './PageEditor';

interface Props {
  storyId: string;
  onBack: () => void;
  onOpenComposer: () => void;
}

export default function StoryEditor({ storyId, onBack, onOpenComposer }: Props) {
  const { story, updateMeta, addPage, updatePage, deletePage, reorderPages } =
    useStoryEditor(storyId);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [titleValue, setTitleValue] = useState<string | null>(null);
  const [studentValue, setStudentValue] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || !story || active.id === over.id) return;
      const fromIndex = story.pages.findIndex((p) => p.id === active.id);
      const toIndex = story.pages.findIndex((p) => p.id === over.id);
      if (fromIndex !== -1 && toIndex !== -1) {
        await reorderPages(fromIndex, toIndex);
      }
    },
    [story, reorderPages]
  );

  const handleDeletePage = async (pageId: string) => {
    if (confirm('Delete this page? This cannot be undone.')) {
      await deletePage(pageId);
    }
  };

  if (!story) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-gray-500">Loading story…</p>
      </div>
    );
  }

  const editingPage = editingPageId
    ? story.pages.find((p) => p.id === editingPageId) ?? null
    : null;

  // Optimistic display values for inline editing
  const displayTitle = titleValue ?? story.title;
  const displayStudent = studentValue ?? story.studentName;

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 font-medium text-sm mt-1 shrink-0"
          aria-label="Back to stories"
        >
          ← Back
        </button>
        <button
          onClick={onOpenComposer}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
        >
          Download PDF
        </button>
      </div>

      {/* Inline-editable title and student name */}
      <div className="mb-6 space-y-2">
        <input
          value={displayTitle}
          onChange={(e) => setTitleValue(e.target.value)}
          onBlur={async () => {
            if (titleValue !== null && titleValue.trim()) {
              await updateMeta({ title: titleValue.trim() });
            }
            setTitleValue(null);
          }}
          className="w-full text-2xl font-bold text-gray-800 bg-transparent border-b-2 border-transparent focus:border-blue-400 focus:outline-none py-1"
          aria-label="Story title"
        />
        <input
          value={displayStudent}
          onChange={(e) => setStudentValue(e.target.value)}
          onBlur={async () => {
            if (studentValue !== null && studentValue.trim()) {
              await updateMeta({ studentName: studentValue.trim() });
            }
            setStudentValue(null);
          }}
          className="w-full text-base text-gray-500 bg-transparent border-b-2 border-transparent focus:border-blue-400 focus:outline-none py-1"
          aria-label="Student name"
        />
      </div>

      {/* Page list */}
      {story.pages.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl mb-4">
          <p className="text-xl mb-2">No pages yet</p>
          <p className="text-sm">Click <strong>+ Add page</strong> to begin.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext
            items={story.pages.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 mb-4">
              {story.pages.map((page, index) => (
                <SortablePageRow
                  key={page.id}
                  page={page}
                  index={index}
                  onEdit={() => setEditingPageId(page.id)}
                  onDelete={() => handleDeletePage(page.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <button
        onClick={addPage}
        className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 font-medium transition-colors"
      >
        + Add page
      </button>

      {editingPage && (
        <PageEditor
          page={editingPage}
          onSave={(updates) => updatePage(editingPage.id, updates)}
          onClose={() => setEditingPageId(null)}
        />
      )}
    </div>
  );
}

interface RowProps {
  page: StoryPage;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

function SortablePageRow({ page, index, onEdit, onDelete }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-500 shrink-0 touch-none"
        aria-label="Drag to reorder"
        tabIndex={-1}
      >
        ⠿
      </button>

      <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
        {page.imageData ? (
          <img src={page.imageData} alt="" className="w-full h-full object-contain" />
        ) : (
          <span className="text-gray-300 text-xs">No photo</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">Page {index + 1}</p>
        {page.sentence ? (
          <p className="text-sm text-gray-700 truncate">{page.sentence}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">No sentence</p>
        )}
      </div>

      <button
        onClick={onEdit}
        className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
      >
        Edit
      </button>
      <button
        onClick={onDelete}
        className="px-2 py-1.5 text-sm text-red-400 hover:bg-red-50 rounded-lg transition-colors shrink-0"
        aria-label="Delete page"
      >
        ✕
      </button>
    </div>
  );
}
