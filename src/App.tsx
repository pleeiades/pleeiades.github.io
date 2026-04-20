import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BoardList from './components/BoardList';
import BoardEditor from './components/BoardEditor';
import InstallPrompt from './components/InstallPrompt';
import UpdatePrompt from './components/UpdatePrompt';

const queryClient = new QueryClient();

type View = { screen: 'list' } | { screen: 'editor'; boardId: string };

export default function App() {
  const [view, setView] = useState<View>({ screen: 'list' });

  return (
    <QueryClientProvider client={queryClient}>
      <UpdatePrompt />
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {view.screen === 'list' && (
          <BoardList onOpenBoard={(id) => setView({ screen: 'editor', boardId: id })} />
        )}
        {view.screen === 'editor' && (
          <BoardEditor
            boardId={view.boardId}
            onBack={() => setView({ screen: 'list' })}
          />
        )}
        <InstallPrompt />
        <footer className="mt-auto py-2 px-4 border-t border-gray-200 flex items-center justify-center gap-2 flex-wrap text-xs text-gray-400">
          <img src="/arasaac_logo.png" alt="ARASAAC" className="h-6 w-auto" />
          <span>
            Pictograms by Sergio Palao /{' '}
            <a
              href="https://arasaac.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600"
            >
              ARASAAC (arasaac.org)
            </a>
            {' '}— Gobierno de Aragón, licensed{' '}
            <a
              href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600"
            >
              CC BY-NC-SA
            </a>
          </span>
        </footer>
      </div>
    </QueryClientProvider>
  );
}
