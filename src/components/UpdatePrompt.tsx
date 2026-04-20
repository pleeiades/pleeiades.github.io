import { useRegisterSW } from 'virtual:pwa-register/react';

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm shadow-md"
    >
      <span className="text-gray-700">A new version is available</span>
      <button
        onClick={() => void updateServiceWorker(true)}
        className="rounded bg-[#863bff] px-3 py-1 text-xs font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-[#863bff] focus:ring-offset-1"
      >
        Reload to update
      </button>
    </div>
  );
}
