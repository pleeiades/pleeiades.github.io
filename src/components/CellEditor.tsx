import { useState } from 'react';
import type { Cell } from '../types';
import ArasaacPicker from './ArasaacPicker';
import ImageUpload from './ImageUpload';

type Tab = 'arasaac' | 'upload';

interface Props {
  cell: Cell;
  onSave: (updates: Partial<Cell>) => Promise<void>;
  onClose: () => void;
}

export default function CellEditor({ cell, onSave, onClose }: Props) {
  const [word, setWord] = useState(cell.word);
  const [tab, setTab] = useState<Tab>('arasaac');
  const [imageData, setImageData] = useState(cell.imageData);
  const [imageSource, setImageSource] = useState(cell.imageSource);
  const [arasaacId, setArasaacId] = useState(cell.arasaacId);
  const [saving, setSaving] = useState(false);

  const handleSelectImage = (data: string, source: 'arasaac' | 'upload', id?: number) => {
    setImageData(data);
    setImageSource(source);
    setArasaacId(id);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({ word, imageData, imageSource, arasaacId });
    setSaving(false);
    onClose();
  };

  const handleClearImage = async () => {
    setImageData('');
    setImageSource('none');
    setArasaacId(undefined);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-xl font-bold text-gray-800">Edit Cell</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none p-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
          {/* Word input */}
          <div>
            <label htmlFor="cell-word" className="block text-sm font-medium text-gray-700 mb-1">
              Word
            </label>
            <input
              id="cell-word"
              autoFocus
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Type a word…"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Preview */}
          {imageData && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <img
                src={imageData}
                alt={word || 'Selected image'}
                className="w-20 h-20 object-contain rounded-lg border border-gray-200 bg-white"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500">
                  {imageSource === 'arasaac' ? 'ARASAAC pictogram' : 'Uploaded image'}
                </p>
                <button
                  onClick={handleClearImage}
                  className="text-sm text-red-500 hover:text-red-700 mt-1"
                >
                  Remove image
                </button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div>
            <div className="flex border-b border-gray-200 mb-3" role="tablist">
              <button
                role="tab"
                aria-selected={tab === 'arasaac'}
                onClick={() => setTab('arasaac')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === 'arasaac'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Search ARASAAC
              </button>
              <button
                role="tab"
                aria-selected={tab === 'upload'}
                onClick={() => setTab('upload')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === 'upload'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Upload image
              </button>
            </div>

            {tab === 'arasaac' && (
              <ArasaacPicker
                initialQuery={word}
                onSelect={(data, id) => handleSelectImage(data, 'arasaac', id)}
              />
            )}
            {tab === 'upload' && (
              <ImageUpload onSelect={(data) => handleSelectImage(data, 'upload')} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 pb-5 pt-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
