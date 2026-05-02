import { useState, useEffect, useCallback } from 'react';
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
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getAllStories } from '../db';
import type {
  SocialStory,
  StoryPage,
  PrintRunItem,
  PrintRunPage,
  PrintRunCover,
  FontChoice,
  FontSizeLabel,
  PagesPerSheet,
} from '../types';
import { exportStoriesToPdf } from '../storyPdf';

interface Props {
  onClose: () => void;
}

export default function PrintComposer({ onClose }: Props) {
  const [stories, setStories] = useState<SocialStory[]>([]);
  const [printRun, setPrintRun] = useState<PrintRunItem[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pagesPerSheet, setPagesPerSheet] = useState<PagesPerSheet>(1);
  const [fontChoice, setFontChoice] = useState<FontChoice>('standard');
  const [fontSize, setFontSize] = useState<FontSizeLabel>('medium');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    getAllStories().then(setStories);
  }, []);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addPage = useCallback((story: SocialStory, page: StoryPage) => {
    const item: PrintRunPage = {
      uid: crypto.randomUUID(),
      type: 'page',
      storyId: story.id,
      storyTitle: story.title,
      pageId: page.id,
      sentence: page.sentence,
      imageData: page.imageData,
      imageSource: page.imageSource,
      arasaacId: page.arasaacId,
    };
    setPrintRun((prev) => [...prev, item]);
  }, []);

  const addCover = () => {
    const item: PrintRunCover = {
      uid: crypto.randomUUID(),
      type: 'cover',
      title: '',
      studentName: '',
    };
    setPrintRun((prev) => [item, ...prev]);
  };

  const removePrintItem = (uid: string) => {
    setPrintRun((prev) => prev.filter((item) => item.uid !== uid));
  };

  const updateCover = (uid: string, updates: Partial<Pick<PrintRunCover, 'title' | 'studentName'>>) => {
    setPrintRun((prev) =>
      prev.map((item) =>
        item.uid === uid && item.type === 'cover' ? { ...item, ...updates } : item
      )
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = printRun.findIndex((item) => item.uid === active.id);
    const toIndex = printRun.findIndex((item) => item.uid === over.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      setPrintRun((prev) => arrayMove(prev, fromIndex, toIndex));
    }
  };

  const handleDownload = async () => {
    if (printRun.length === 0) return;
    setGenerating(true);
    try {
      await exportStoriesToPdf(printRun, { pagesPerSheet, fontChoice, fontSize });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      alert(`PDF generation failed: ${message}`);
    } finally {
      setGenerating(false);
    }
  };

  const hasCover = printRun.some((item) => item.type === 'cover');
  const hasArasaac = printRun.some(
    (item): item is PrintRunPage => item.type === 'page' && item.imageSource === 'arasaac'
  );

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Print Composer</h1>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 font-medium text-sm"
        >
          ← Back to Stories
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left — available pages */}
        <div className="lg:w-80 shrink-0">
          <h2 className="text-base font-semibold text-gray-700 mb-3">Available pages</h2>
          {stories.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No stories yet.</p>
          ) : (
            <div className="space-y-2">
              {stories.map((story) => (
                <StoryAccordion
                  key={story.id}
                  story={story}
                  expanded={expanded.has(story.id)}
                  onToggle={() => toggleExpanded(story.id)}
                  onAddPage={(page) => addPage(story, page)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right — print run + settings */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Settings */}
          <SettingsPanel
            pagesPerSheet={pagesPerSheet}
            fontChoice={fontChoice}
            fontSize={fontSize}
            onPagesPerSheet={setPagesPerSheet}
            onFontChoice={setFontChoice}
            onFontSize={setFontSize}
          />

          {/* Print run header */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-700">
              Print run{' '}
              <span className="text-gray-400 font-normal">
                ({printRun.filter((i) => i.type === 'page').length} pages)
              </span>
            </h2>
            {!hasCover && (
              <button
                onClick={addCover}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                + Add cover page
              </button>
            )}
          </div>

          {/* Sortable print run */}
          {printRun.length === 0 ? (
            <div className="flex-1 min-h-40 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 text-sm">
              Click pages on the left to add them here
            </div>
          ) : (
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <SortableContext
                items={printRun.map((item) => item.uid)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {printRun.map((item) =>
                    item.type === 'cover' ? (
                      <SortableCoverRow
                        key={item.uid}
                        item={item}
                        onUpdate={(u) => updateCover(item.uid, u)}
                        onRemove={() => removePrintItem(item.uid)}
                      />
                    ) : (
                      <SortablePageRow
                        key={item.uid}
                        item={item}
                        onRemove={() => removePrintItem(item.uid)}
                      />
                    )
                  )}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Attribution note */}
          {hasArasaac && (
            <p className="text-xs text-gray-400">
              ARASAAC attribution will appear in the PDF footer.
            </p>
          )}

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={printRun.length === 0 || generating}
            className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-lg disabled:opacity-40 transition-colors"
          >
            {generating ? 'Generating PDF…' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function StoryAccordion({
  story,
  expanded,
  onToggle,
  onAddPage,
}: {
  story: SocialStory;
  expanded: boolean;
  onToggle: () => void;
  onAddPage: (page: StoryPage) => void;
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="min-w-0">
          <p className="font-medium text-gray-800 truncate">{story.title}</p>
          <p className="text-xs text-gray-500">
            {story.studentName} · {story.pages.length} {story.pages.length === 1 ? 'page' : 'pages'}
          </p>
        </div>
        <span className="text-gray-400 ml-2">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="border-t border-gray-100">
          {story.pages.length === 0 ? (
            <p className="text-xs text-gray-400 px-4 py-3">No pages yet.</p>
          ) : (
            story.pages.map((page, i) => (
              <button
                key={page.id}
                onClick={() => onAddPage(page)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left border-t border-gray-50 first:border-0"
              >
                <div className="w-10 h-10 shrink-0 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
                  {page.imageData ? (
                    <img src={page.imageData} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">Page {i + 1}</p>
                  <p className="text-sm text-gray-700 truncate">
                    {page.sentence || <span className="italic text-gray-400">No sentence</span>}
                  </p>
                </div>
                <span className="text-blue-500 text-lg shrink-0">+</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SortablePageRow({
  item,
  onRemove,
}: {
  item: PrintRunPage;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.uid });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0 touch-none"
        aria-label="Drag to reorder"
        tabIndex={-1}
      >
        ⠿
      </button>
      <div className="w-10 h-10 shrink-0 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
        {item.imageData ? (
          <img src={item.imageData} alt="" className="w-full h-full object-contain" />
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 truncate">From: {item.storyTitle}</p>
        <p className="text-sm text-gray-700 truncate">
          {item.sentence || <span className="italic text-gray-400">No sentence</span>}
        </p>
      </div>
      <button
        onClick={onRemove}
        className="text-red-400 hover:text-red-600 px-2 py-1 rounded shrink-0"
        aria-label="Remove from print run"
      >
        ✕
      </button>
    </div>
  );
}

function SortableCoverRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: PrintRunCover;
  onUpdate: (u: Partial<Pick<PrintRunCover, 'title' | 'studentName'>>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.uid });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200 shadow-sm"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-blue-300 hover:text-blue-500 shrink-0 touch-none mt-1"
        aria-label="Drag to reorder"
        tabIndex={-1}
      >
        ⠿
      </button>
      <div className="flex-1 space-y-2">
        <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Cover page</p>
        <input
          value={item.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Story title"
          className="w-full border border-blue-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          value={item.studentName}
          onChange={(e) => onUpdate({ studentName: e.target.value })}
          placeholder="Student name"
          className="w-full border border-blue-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <button
        onClick={onRemove}
        className="text-red-400 hover:text-red-600 px-2 py-1 rounded shrink-0"
        aria-label="Remove cover page"
      >
        ✕
      </button>
    </div>
  );
}

function SettingsPanel({
  pagesPerSheet,
  fontChoice,
  fontSize,
  onPagesPerSheet,
  onFontChoice,
  onFontSize,
}: {
  pagesPerSheet: PagesPerSheet;
  fontChoice: FontChoice;
  fontSize: FontSizeLabel;
  onPagesPerSheet: (v: PagesPerSheet) => void;
  onFontChoice: (v: FontChoice) => void;
  onFontSize: (v: FontSizeLabel) => void;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-4">
      <h3 className="font-semibold text-gray-700 text-sm">Print settings</h3>

      <div>
        <p className="text-sm text-gray-600 mb-2">Pages per sheet</p>
        <div className="flex gap-2">
          {([1, 2, 3, 4] as const).map((n) => (
            <button
              key={n}
              onClick={() => onPagesPerSheet(n)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                pagesPerSheet === n
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm text-gray-600 mb-2">Font</p>
        <div className="flex gap-2">
          {([['standard', 'Standard'], ['queensland', 'Queensland School']] as const).map(
            ([value, label]) => (
              <button
                key={value}
                onClick={() => onFontChoice(value)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  fontChoice === value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>
      </div>

      <div>
        <p className="text-sm text-gray-600 mb-2">Font size</p>
        <div className="flex gap-2">
          {([['small', 'Small'], ['medium', 'Medium'], ['large', 'Large'], ['xl', 'X-Large']] as const).map(
            ([value, label]) => (
              <button
                key={value}
                onClick={() => onFontSize(value)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  fontSize === value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
