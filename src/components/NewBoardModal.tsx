import { useState } from 'react';

const PRESETS: Array<{ label: string; rows: number; cols: number }> = [
  { label: '2×2', rows: 2, cols: 2 },
  { label: '2×3', rows: 2, cols: 3 },
  { label: '3×3', rows: 3, cols: 3 },
  { label: '3×4', rows: 3, cols: 4 },
  { label: '4×4', rows: 4, cols: 4 },
  { label: '4×6', rows: 4, cols: 6 },
  { label: '5×5', rows: 5, cols: 5 },
];

interface Props {
  onConfirm: (name: string, rows: number, cols: number) => void;
  onClose: () => void;
}

export default function NewBoardModal({ onConfirm, onClose }: Props) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<{ rows: number; cols: number } | null>(null);
  const [custom, setCustom] = useState(false);
  const [customRows, setCustomRows] = useState(3);
  const [customCols, setCustomCols] = useState(4);

  const rows = custom ? customRows : selected?.rows ?? null;
  const cols = custom ? customCols : selected?.cols ?? null;
  const canCreate = name.trim() && rows !== null && cols !== null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    onConfirm(name.trim(), rows!, cols!);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-5">New Board</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="board-name" className="block text-sm font-medium text-gray-700 mb-1">
              Board name
            </label>
            <input
              id="board-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning routine, Animals…"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">Grid size</p>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => { setSelected(p); setCustom(false); }}
                  className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                    !custom && selected?.rows === p.rows && selected?.cols === p.cols
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setCustom(true); setSelected(null); }}
                className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                  custom
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                Custom
              </button>
            </div>

            {custom && (
              <div className="flex gap-3 items-center">
                <label className="text-sm text-gray-700">
                  Rows
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={customRows}
                    onChange={(e) => setCustomRows(Math.min(8, Math.max(1, +e.target.value)))}
                    className="ml-2 w-16 border border-gray-300 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <span className="text-gray-500">×</span>
                <label className="text-sm text-gray-700">
                  Cols
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={customCols}
                    onChange={(e) => setCustomCols(Math.min(8, Math.max(1, +e.target.value)))}
                    className="ml-2 w-16 border border-gray-300 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              </div>
            )}
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
              disabled={!canCreate}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
