import { useState } from 'react';
import type { StoryPage } from '../types';
import ArasaacPicker from './ArasaacPicker';
import ImageUpload from './ImageUpload';

type Tab = 'upload' | 'arasaac';

interface Props {
  page: StoryPage;
  onSave: (updates: Partial<StoryPage>) => Promise<void>;
  onClose: () => void;
}

export default function PageEditor({ page, onSave, onClose }: Props) {
  const [sentence, setSentence] = useState(page.sentence);
  const [imageData, setImageData] = useState(page.imageData);
  const [imageSource, setImageSource] = useState(page.imageSource);
  const [arasaacId, setArasaacId] = useState(page.arasaacId);
  const [tab, setTab] = useState<Tab>('upload');

  const handleSelectImage = (data: string, source: 'upload' | 'arasaac', id?: number) => {
    setImageData(data);
    setImageSource(source);
    setArasaacId(id);
  };

  const handleClose = () => {
    onSave({ sentence, imageData, imageSource, arasaacId });
    onClose();
  };

  const initialArasaacQuery = sentence.trim().split(/\s+/)[0] ?? '';

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-xl font-bold text-gray-800">Edit Page</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none p-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
          {/* Sentence — no label per spec */}
          <textarea
            autoFocus
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            placeholder="Write the sentence for this page…"
            rows={3}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          {/* Image preview */}
          {imageData && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <img
                src={imageData}
                alt=""
                className="w-20 h-20 object-contain rounded-lg border border-gray-200 bg-white"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500">
                  {imageSource === 'arasaac' ? 'ARASAAC pictogram' : 'Uploaded photo'}
                </p>
                <button
                  onClick={() => {
                    setImageData('');
                    setImageSource('upload');
                    setArasaacId(undefined);
                  }}
                  className="text-sm text-red-500 hover:text-red-700 mt-1"
                >
                  Remove image
                </button>
              </div>
            </div>
          )}

          {/* Tabs — Upload first (primary for Social Stories) */}
          <div>
            <div className="flex border-b border-gray-200 mb-3" role="tablist">
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
                Upload photo
              </button>
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
            </div>

            {tab === 'upload' && (
              <ImageUpload onSelect={(data) => handleSelectImage(data, 'upload')} />
            )}
            {tab === 'arasaac' && (
              <ArasaacPicker
                initialQuery={initialArasaacQuery}
                onSelect={(data, id) => handleSelectImage(data, 'arasaac', id)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
