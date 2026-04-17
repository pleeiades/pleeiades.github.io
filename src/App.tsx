import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BoardList from './components/BoardList';
import BoardEditor from './components/BoardEditor';

const queryClient = new QueryClient();

type View = { screen: 'list' } | { screen: 'editor'; boardId: string };

export default function App() {
  const [view, setView] = useState<View>({ screen: 'list' });

  return (
    <QueryClientProvider client={queryClient}>
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
        <footer className="mt-auto py-3 px-4 text-center text-xs text-gray-400 border-t border-gray-200">
          Pictograms from{' '}
          <a
            href="https://arasaac.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            ARASAAC
          </a>
          {' '}— © Sergio Palao, Government of Aragón (CC BY-NC-SA 4.0)
        </footer>
      </div>
    </QueryClientProvider>
  );
}
