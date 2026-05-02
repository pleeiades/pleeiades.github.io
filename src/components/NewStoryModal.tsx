import { useState } from 'react';

interface Props {
  onConfirm: (title: string, studentName: string) => void;
  onClose: () => void;
}

export default function NewStoryModal({ onConfirm, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [studentName, setStudentName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !studentName.trim()) return;
    onConfirm(title.trim(), studentName.trim());
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">New Social Story</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="story-title" className="block text-sm font-medium text-gray-700 mb-1">
                Story title
              </label>
              <input
                id="story-title"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Going to the Dentist"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="story-student" className="block text-sm font-medium text-gray-700 mb-1">
                Student name
              </label>
              <input
                id="story-student"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Lily"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || !studentName.trim()}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
