import { useState } from 'react';
import { useBoards } from '../hooks/useBoards';
import type { Board } from '../types';
import NewBoardModal from './NewBoardModal';

interface Props {
  onOpenBoard: (id: string) => void;
}

export default function BoardList({ onOpenBoard }: Props) {
  const { boards, loading, createBoard, removeBoard, copyBoard, renameBoard } =
    useBoards();
  const [showNew, setShowNew] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleCreate = async (name: string, rows: number, cols: number) => {
    const board = await createBoard(name, rows, cols);
    setShowNew(false);
    onOpenBoard(board.id);
  };

  const startRename = (board: Board) => {
    setRenamingId(board.id);
    setRenameValue(board.name);
  };

  const commitRename = async (id: string) => {
    if (renameValue.trim()) await renameBoard(id, renameValue.trim());
    setRenamingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this board? This cannot be undone.')) {
      await removeBoard(id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Boards</h1>
        <button
          onClick={() => setShowNew(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl text-lg transition-colors"
        >
          + New Board
        </button>
      </div>

      {boards.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-2xl mb-3">No boards yet</p>
          <p>Click <strong>+ New Board</strong> to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              renamingId={renamingId}
              renameValue={renameValue}
              onOpen={() => onOpenBoard(board.id)}
              onStartRename={() => startRename(board)}
              onRenameChange={setRenameValue}
              onCommitRename={() => commitRename(board.id)}
              onCopy={() => copyBoard(board.id)}
              onDelete={() => handleDelete(board.id)}
            />
          ))}
        </div>
      )}

      {showNew && (
        <NewBoardModal onConfirm={handleCreate} onClose={() => setShowNew(false)} />
      )}
    </div>
  );
}

interface CardProps {
  board: Board;
  renamingId: string | null;
  renameValue: string;
  onOpen: () => void;
  onStartRename: () => void;
  onRenameChange: (v: string) => void;
  onCommitRename: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

function BoardCard({
  board,
  renamingId,
  renameValue,
  onOpen,
  onStartRename,
  onRenameChange,
  onCommitRename,
  onCopy,
  onDelete,
}: CardProps) {
  const isRenaming = renamingId === board.id;
  const updated = new Date(board.updatedAt).toLocaleDateString();
  const filledCells = board.cells.filter((c) => c.imageData).length;
  const totalCells = board.rows * board.cols;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Thumbnail grid preview */}
      <button
        onClick={onOpen}
        className="w-full p-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={`Open board ${board.name}`}
      >
        <BoardThumbnail board={board} />
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
          <h2 className="text-lg font-semibold text-gray-800 truncate">{board.name}</h2>
        )}
        <p className="text-sm text-gray-500 mt-1">
          {board.rows}×{board.cols} · {filledCells}/{totalCells} cells · {updated}
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

function BoardThumbnail({ board }: { board: Board }) {
  const { rows, cols, cells } = board;
  return (
    <div
      className="grid gap-0.5 w-full aspect-video bg-white border border-gray-200 rounded-lg overflow-hidden"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
      aria-hidden="true"
    >
      {cells.map((cell) => (
        <div key={cell.position} className="bg-gray-100 flex items-center justify-center overflow-hidden">
          {cell.imageData ? (
            <img src={cell.imageData} alt="" className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full bg-gray-100" />
          )}
        </div>
      ))}
    </div>
  );
}
