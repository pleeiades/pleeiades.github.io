import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BoardList from './components/BoardList';
import BoardEditor from './components/BoardEditor';
import StoryList from './components/StoryList';
import StoryEditor from './components/StoryEditor';
import PrintComposer from './components/PrintComposer';
import InstallPrompt from './components/InstallPrompt';
import UpdatePrompt from './components/UpdatePrompt';

const queryClient = new QueryClient();

type View =
  | { screen: 'boards-list' }
  | { screen: 'boards-editor'; boardId: string }
  | { screen: 'stories-list' }
  | { screen: 'stories-editor'; storyId: string }
  | { screen: 'stories-composer' };

export default function App() {
  const [view, setView] = useState<View>({ screen: 'boards-list' });

  const section: 'boards' | 'stories' = view.screen.startsWith('boards') ? 'boards' : 'stories';

  const switchSection = (s: 'boards' | 'stories') => {
    setView(s === 'boards' ? { screen: 'boards-list' } : { screen: 'stories-list' });
  };

  // BoardEditor is full-screen and has its own header — hide the nav there to preserve existing layout
  const showNav = view.screen !== 'boards-editor';

  return (
    <QueryClientProvider client={queryClient}>
      <UpdatePrompt />
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {showNav && (
          <header className="bg-white border-b border-gray-200 shrink-0">
            <nav
              className="max-w-4xl mx-auto flex items-center gap-1 h-14 px-4"
              aria-label="Main navigation"
            >
              <button
                onClick={() => switchSection('boards')}
                aria-current={section === 'boards' ? 'page' : undefined}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  section === 'boards'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                ALD Boards
              </button>
              <button
                onClick={() => switchSection('stories')}
                aria-current={section === 'stories' ? 'page' : undefined}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  section === 'stories'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Social Stories
              </button>
            </nav>
          </header>
        )}

        {view.screen === 'boards-list' && (
          <BoardList onOpenBoard={(id) => setView({ screen: 'boards-editor', boardId: id })} />
        )}
        {view.screen === 'boards-editor' && (
          <BoardEditor
            boardId={view.boardId}
            onBack={() => setView({ screen: 'boards-list' })}
          />
        )}
        {view.screen === 'stories-list' && (
          <StoryList
            onOpenStory={(id) => setView({ screen: 'stories-editor', storyId: id })}
            onOpenComposer={() => setView({ screen: 'stories-composer' })}
          />
        )}
        {view.screen === 'stories-editor' && (
          <StoryEditor
            storyId={view.storyId}
            onBack={() => setView({ screen: 'stories-list' })}
            onOpenComposer={() => setView({ screen: 'stories-composer' })}
          />
        )}
        {view.screen === 'stories-composer' && (
          <PrintComposer onClose={() => setView({ screen: 'stories-list' })} />
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
