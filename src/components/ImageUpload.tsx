import { useRef } from 'react';

interface Props {
  onSelect: (dataUrl: string) => void;
}

const MAX_SIDE = 500;
const JPEG_QUALITY = 0.8;

async function resizeAndEncode(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function ImageUpload({ onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPEG, or WebP).');
      return;
    }
    try {
      const dataUrl = await resizeAndEncode(file);
      onSelect(dataUrl);
    } catch {
      alert('Could not load this image. Please try a different file.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      aria-label="Upload image. Click or drag and drop."
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
        aria-label="Choose image file"
      />
      <div className="text-4xl mb-3">📁</div>
      <p className="text-gray-600 font-medium">Click to choose an image</p>
      <p className="text-gray-400 text-sm mt-1">or drag and drop here</p>
      <p className="text-gray-400 text-xs mt-2">PNG, JPEG, WebP accepted</p>
    </div>
  );
}
