import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { useTournamentStore } from './store/tournamentStore';
import { useAuthStore, initAuthListener } from './store/authStore';
import { Header } from './components/calculator/Header';
import { TabBar } from './components/calculator/TabBar';
import { HomeView } from './components/home/HomeView';
import { CreateTournamentView } from './components/tournament/CreateTournamentView';
import { EditTournamentView } from './components/tournament/EditTournamentView';
import { SetupView } from './components/calculator/SetupView';
import { MatchView } from './components/calculator/MatchView';
import { ResultView } from './components/result/ResultView';
import { HistoryView } from './components/history/HistoryView';
import { ResetModal } from './components/calculator/ResetModal';
import { JsonModal } from './components/calculator/JsonModal';
import { Footer } from './components/layout/Footer';
import { LoginView } from './components/auth/LoginView';
import { AdminDashboardModal } from './components/admin/AdminDashboardModal';

export function App() {
  const { currentTab, matches, settings } = useTournamentStore();
  const { firebaseUser, isAllowed, isLoading } = useAuthStore();
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isJsonOpen, setIsJsonOpen] = useState(false);

  useEffect(() => {
    initAuthListener();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'v2');
  }, [settings.theme]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070609] text-white flex flex-col items-center justify-center p-6 select-none">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400">
            <Trophy className="h-6 w-6 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="font-display text-lg font-bold uppercase tracking-widest text-white">
              ESP CALC
            </p>
            <p className="mt-1 text-xs uppercase tracking-widest text-neutral-500 font-semibold">
              Verifying Broadcast Credentials...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!firebaseUser || !isAllowed) {
    return <LoginView />;
  }

  // Determine active view
  let activeContent = <HomeView />;
  if (currentTab === 'home') {
    activeContent = <HomeView />;
  } else if (currentTab === 'create') {
    activeContent = <CreateTournamentView />;
  } else if (currentTab === 'edit') {
    activeContent = <EditTournamentView />;
  } else if (currentTab === 'setup') {
    activeContent = <SetupView />;
  } else if (currentTab === 'history') {
    activeContent = <HistoryView />;
  } else if (currentTab === 'results') {
    activeContent = <ResultView />;
  } else {
    const activeMatch = matches.find((m) => m.id === currentTab);
    if (activeMatch) {
      activeContent = <MatchView match={activeMatch} />;
    } else {
      activeContent = <HomeView />;
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0B0D] text-[#F5F2F2] flex flex-col font-body selection:bg-red-800 selection:text-white">
      {/* Top Header */}
      <Header
        onOpenReset={() => setIsResetOpen(true)}
        onOpenJson={() => setIsJsonOpen(true)}
      />

      {/* Main Tab Navigation */}
      <TabBar />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">{activeContent}</main>

      {/* Global Interactive Footer */}
      <Footer />

      {/* Modals */}
      <ResetModal isOpen={isResetOpen} onClose={() => setIsResetOpen(false)} />
      <JsonModal isOpen={isJsonOpen} onClose={() => setIsJsonOpen(false)} />
      <AdminDashboardModal />
    </div>
  );
}

export default App;
