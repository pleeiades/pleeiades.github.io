import { useState } from 'react';
import { useStories } from '../hooks/useStories';
import type { SocialStory } from '../types';
import NewStoryModal from './NewStoryModal';

interface Props {
  onOpenStory: (id: string) => void;
  onOpenComposer: () => void;
}

export default function StoryList({ onOpenStory, onOpenComposer }: Props) {
  const { stories, loading, createStory, removeStory, copyStory, renameStory } = useStories();
  const [showNew, setShowNew] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleCreate = async (title: string, studentName: string) => {
    const story = await createStory(title, studentName);
    setShowNew(false);
    onOpenStory(story.id);
  };

  const startRename = (story: SocialStory) => {
    setRenamingId(story.id);
    setRenameValue(story.title);
  };

  const commitRename = async (id: string) => {
    if (renameValue.trim()) await renameStory(id, renameValue.trim());
    setRenamingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this story? This cannot be undone.')) {
      await removeStory(id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8">
      <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
        <h1 className="text-3xl font-bold text-gray-800">Social Stories</h1>
        <div className="flex gap-3">
          {stories.length > 0 && (
            <button
              onClick={onOpenComposer}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-3 rounded-xl text-base transition-colors"
            >
              Download PDF
            </button>
          )}
          <button
            onClick={() => setShowNew(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl text-lg transition-colors"
          >
            + New Story
          </button>
        </div>
      </div>

      {stories.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-2xl mb-3">No stories yet</p>
          <p>Click <strong>+ New Story</strong> to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              renamingId={renamingId}
              renameValue={renameValue}
              onOpen={() => onOpenStory(story.id)}
              onStartRename={() => startRename(story)}
              onRenameChange={setRenameValue}
              onCommitRename={() => commitRename(story.id)}
              onCopy={() => copyStory(story.id)}
              onDelete={() => handleDelete(story.id)}
            />
          ))}
        </div>
      )}

      {showNew && (
        <NewStoryModal onConfirm={handleCreate} onClose={() => setShowNew(false)} />
      )}
    </div>
  );
}

interface CardProps {
  story: SocialStory;
  renamingId: string | null;
  renameValue: string;
  onOpen: () => void;
  onStartRename: () => void;
  onRenameChange: (v: string) => void;
  onCommitRename: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

function StoryCard({
  story,
  renamingId,
  renameValue,
  onOpen,
  onStartRename,
  onRenameChange,
  onCommitRename,
  onCopy,
  onDelete,
}: CardProps) {
  const isRenaming = renamingId === story.id;
  const updated = new Date(story.updatedAt).toLocaleDateString();
  const pageCount = story.pages.length;
  const firstImage = story.pages.find((p) => p.imageData)?.imageData;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <button
        onClick={onOpen}
        className="w-full h-36 bg-gray-50 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-hidden"
        aria-label={`Open story ${story.title}`}
      >
        {firstImage ? (
          <img src={firstImage} alt="" className="w-full h-full object-contain p-2" />
        ) : (
          <span className="text-5xl" aria-hidden="true">📖</span>
        )}
      </button>

      <div className="p-4">
        {isRenaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            onBlur={onCommitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCommitRename();
              if (e.key === 'Escape') onRenameChange('');
            }}
            className="w-full border border-blue-400 rounded-lg px-2 py-1 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <h2 className="text-lg font-semibold text-gray-800 truncate">{story.title}</h2>
        )}
        <p className="text-sm text-gray-500 mt-1 truncate">
          {story.studentName} · {pageCount} {pageCount === 1 ? 'page' : 'pages'} · {updated}
        </p>

        <div className="flex gap-2 mt-3">
          <button
            onClick={onOpen}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onStartRename}
            className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Rename"
          >
            ✏️
          </button>
          <button
            onClick={onCopy}
            className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Duplicate"
          >
            📋
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
