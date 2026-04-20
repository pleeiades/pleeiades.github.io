import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferredPrompt) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <div
      role="complementary"
      aria-label="Install app"
      className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-md"
    >
      <span className="text-gray-700">Add to home screen</span>
      <button
        onClick={() => void handleInstall()}
        className="rounded bg-[#863bff] px-3 py-1 text-xs font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-[#863bff] focus:ring-offset-1"
      >
        Install
      </button>
      <button
        onClick={() => setDeferredPrompt(null)}
        aria-label="Dismiss install prompt"
        className="ml-1 text-gray-400 hover:text-gray-600 focus:outline-none"
      >
        ✕
      </button>
    </div>
  );
}
