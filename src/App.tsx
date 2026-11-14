import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AppShell } from './components/layout/AppShell';
import { HomeView } from './components/home/HomeView';
import { CreateTournamentView } from './components/tournament/CreateTournamentView';
import { EditTournamentView } from './components/tournament/EditTournamentView';
import { RulesView } from './components/rules/RulesView';
import { HistoryView } from './components/history/HistoryView';
import { MatchView } from './components/calculator/MatchView';
import { ResultView } from './components/result/ResultView';
import { ResetModal } from './components/calculator/ResetModal';
import { JsonModal } from './components/calculator/JsonModal';
import { LoginView } from './components/auth/LoginView';
import { AdminDashboardModal } from './components/admin/AdminDashboardModal';
import { useTournamentStore } from './store/tournamentStore';
import { useAuthStore, initAuthListener } from './store/authStore';

export function App() {
  const { currentTab, matches } = useTournamentStore();
  const { firebaseUser, isAllowed, isLoading } = useAuthStore();
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isJsonOpen, setIsJsonOpen] = useState(false);

  useEffect(() => {
    initAuthListener();
  }, []);

  if (isLoading) {
    return (
      <div className="glass-canvas relative min-h-screen text-slate-200 flex flex-col items-center justify-center p-4 font-ui select-none">
        <div className="glass-panel rounded-2xl px-6 py-5 flex flex-col items-center">
          <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
          <p className="mt-3 text-xs font-medium text-slate-300">
            Checking session...
          </p>
        </div>
      </div>
    );
  }

  if (!firebaseUser || !isAllowed) {
    return <LoginView />;
  }

  let activeContent = <HomeView onOpenJson={() => setIsJsonOpen(true)} />;
  if (currentTab === 'home') {
    activeContent = <HomeView onOpenJson={() => setIsJsonOpen(true)} />;
  } else if (currentTab === 'create') {
    activeContent = <CreateTournamentView />;
  } else if (currentTab === 'edit') {
    activeContent = <EditTournamentView />;
  } else if (currentTab === 'rules' || currentTab === 'setup') {
    activeContent = <RulesView />;
  } else if (currentTab === 'history') {
    activeContent = <HistoryView />;
  } else if (currentTab === 'results') {
    activeContent = <ResultView />;
  } else {
    const activeMatch = matches.find((m) => m.id === currentTab);
    if (activeMatch) {
      activeContent = <MatchView match={activeMatch} />;
    } else {
      activeContent = <HomeView onOpenJson={() => setIsJsonOpen(true)} />;
    }
  }

  return (
    <AppShell
      onOpenJson={() => setIsJsonOpen(true)}
      onOpenReset={() => setIsResetOpen(true)}
    >
      {activeContent}
      <ResetModal isOpen={isResetOpen} onClose={() => setIsResetOpen(false)} />
      <JsonModal isOpen={isJsonOpen} onClose={() => setIsJsonOpen(false)} />
      <AdminDashboardModal />
    </AppShell>
  );
}

export default App;
