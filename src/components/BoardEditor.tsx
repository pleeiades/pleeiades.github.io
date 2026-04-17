import { useState, useCallback } from 'react';
import { useBoardEditor } from '../hooks/useBoards';
import type { Cell } from '../types';
import CellEditor from './CellEditor';
import { exportBoardToPdf } from '../pdf';

interface Props {
  boardId: string;
  onBack: () => void;
}

export default function BoardEditor({ boardId, onBack }: Props) {
  const { board, updateCell, renameBoard } = useBoardEditor(boardId);
  const [editingCell, setEditingCell] = useState<number | null>(null);
  const [isRenamingBoard, setIsRenamingBoard] = useState(false);
  const [boardNameValue, setBoardNameValue] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleCellSave = useCallback(
    async (position: number, updates: Partial<Cell>) => {
      await updateCell(position, updates);
    },
    [updateCell]
  );

  const handleBoardRenameStart = () => {
    if (!board) return;
    setBoardNameValue(board.name);
    setIsRenamingBoard(true);
  };

  const handleBoardRenameCommit = async () => {
    if (boardNameValue.trim()) await renameBoard(boardNameValue.trim());
    setIsRenamingBoard(false);
  };

  const handleExport = async () => {
    if (!board) return;
    setExporting(true);
    try {
      await exportBoardToPdf(board);
    } finally {
      setExporting(false);
    }
  };

  if (!board) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading board…</p>
      </div>
    );
  }

  const activeCell = editingCell !== null ? board.cells[editingCell] : null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Back to boards list"
        >
          ← Back
        </button>

        <div className="flex-1 flex items-center gap-2">
          {isRenamingBoard ? (
            <input
              autoFocus
              value={boardNameValue}
              onChange={(e) => setBoardNameValue(e.target.value)}
              onBlur={handleBoardRenameCommit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleBoardRenameCommit();
                if (e.key === 'Escape') setIsRenamingBoard(false);
              }}
              className="text-xl font-bold border border-blue-400 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <button
              onClick={handleBoardRenameStart}
              className="text-xl font-bold text-gray-800 hover:underline hover:decoration-dashed"
              title="Click to rename"
            >
              {board.name}
            </button>
          )}
          <span className="text-sm text-gray-400">
            {board.rows}×{board.cols}
          </span>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl transition-colors"
        >
          {exporting ? 'Exporting…' : '⬇ Download PDF'}
        </button>
      </header>

      {/* Grid */}
      <main className="flex-1 p-4 flex items-start justify-center">
        <div className="w-full max-w-5xl">
          <p className="text-sm text-gray-500 mb-3 text-center">
            Tap a cell to add a word and picture
          </p>
          <BoardGrid
            board={board}
            onCellClick={(pos) => setEditingCell(pos)}
          />
        </div>
      </main>

      {/* Cell editor modal */}
      {editingCell !== null && activeCell && (
        <CellEditor
          cell={activeCell}
          onSave={(updates) => handleCellSave(editingCell, updates)}
          onClose={() => setEditingCell(null)}
        />
      )}
    </div>
  );
}

function BoardGrid({
  board,
  onCellClick,
}: {
  board: { rows: number; cols: number; cells: Cell[] };
  onCellClick: (pos: number) => void;
}) {
  return (
    <div
      className="grid gap-2 w-full"
      style={{ gridTemplateColumns: `repeat(${board.cols}, 1fr)` }}
      role="grid"
      aria-label="Board cells"
    >
      {board.cells.map((cell) => (
        <button
          key={cell.position}
          onClick={() => onCellClick(cell.position)}
          className="aspect-square bg-white border-2 border-gray-300 rounded-xl hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 flex flex-col items-center justify-center p-2 transition-colors group"
          aria-label={cell.word || `Empty cell ${cell.position + 1}`}
          role="gridcell"
        >
          {cell.imageData ? (
            <img
              src={cell.imageData}
              alt={cell.word}
              className="flex-1 w-full object-contain min-h-0"
            />
          ) : (
            <div className="flex-1 w-full flex items-center justify-center text-gray-300 group-hover:text-blue-300">
              <span className="text-4xl">+</span>
            </div>
          )}
          {cell.word && (
            <span className="text-center text-sm font-medium text-gray-700 mt-1 leading-tight line-clamp-2">
              {cell.word}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
