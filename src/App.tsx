import { lazy, Suspense, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AppShell } from './components/layout/AppShell';
import { HomeView } from './components/home/HomeView';
import { LoginView } from './components/auth/LoginView';
import { useTournamentStore } from './store/tournamentStore';
import { useAuthStore, initAuthListener } from './store/authStore';
import {
  startCloudWorkspaceSync,
  stopCloudWorkspaceSync,
} from './lib/cloudSync';

const CreateTournamentView = lazy(() =>
  import('./components/tournament/CreateTournamentView').then((m) => ({
    default: m.CreateTournamentView,
  }))
);
const EditTournamentView = lazy(() =>
  import('./components/tournament/EditTournamentView').then((m) => ({
    default: m.EditTournamentView,
  }))
);
const RulesView = lazy(() =>
  import('./components/rules/RulesView').then((m) => ({
    default: m.RulesView,
  }))
);
const HistoryView = lazy(() =>
  import('./components/history/HistoryView').then((m) => ({
    default: m.HistoryView,
  }))
);
const MatchView = lazy(() =>
  import('./components/calculator/MatchView').then((m) => ({
    default: m.MatchView,
  }))
);
const ResultView = lazy(() =>
  import('./components/result/ResultView').then((m) => ({
    default: m.ResultView,
  }))
);
const AppDownloadView = lazy(() =>
  import('./components/download/AppDownloadView').then((m) => ({
    default: m.AppDownloadView,
  }))
);
const WhatsNewView = lazy(() =>
  import('./components/home/WhatsNewView').then((m) => ({
    default: m.WhatsNewView,
  }))
);
const ResetModal = lazy(() =>
  import('./components/calculator/ResetModal').then((m) => ({
    default: m.ResetModal,
  }))
);
const JsonModal = lazy(() =>
  import('./components/calculator/JsonModal').then((m) => ({
    default: m.JsonModal,
  }))
);
const AdminDashboardModal = lazy(() =>
  import('./components/admin/AdminDashboardModal').then((m) => ({
    default: m.AdminDashboardModal,
  }))
);

const ViewFallback = () => (
  <div className="flex min-h-[260px] items-center justify-center">
    <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
  </div>
);

export function App() {
  const currentTab = useTournamentStore((s) => s.currentTab);
  const matches = useTournamentStore((s) => s.matches);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const isAllowed = useAuthStore((s) => s.isAllowed);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAdminDashboardOpen = useAuthStore((s) => s.isAdminDashboardOpen);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isJsonOpen, setIsJsonOpen] = useState(false);

  useEffect(() => {
    initAuthListener();
  }, []);

  useEffect(() => {
    if (firebaseUser?.email && isAllowed && !isLoading) {
      startCloudWorkspaceSync(firebaseUser.email);
    } else {
      stopCloudWorkspaceSync();
    }
    return () => {
      stopCloudWorkspaceSync();
    };
  }, [firebaseUser?.email, isAllowed, isLoading]);

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
  } else if (currentTab === 'download') {
    activeContent = <AppDownloadView />;
  } else if (currentTab === 'whats-new') {
    activeContent = <WhatsNewView />;
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
    <>
      <AppShell
        onOpenJson={() => setIsJsonOpen(true)}
        onOpenReset={() => setIsResetOpen(true)}
      >
        <Suspense fallback={<ViewFallback />}>{activeContent}</Suspense>
      </AppShell>
      {isResetOpen && (
        <Suspense fallback={null}>
          <ResetModal
            isOpen={isResetOpen}
            onClose={() => setIsResetOpen(false)}
          />
        </Suspense>
      )}
      {isJsonOpen && (
        <Suspense fallback={null}>
          <JsonModal isOpen={isJsonOpen} onClose={() => setIsJsonOpen(false)} />
        </Suspense>
      )}
      {isAdminDashboardOpen && (
        <Suspense fallback={null}>
          <AdminDashboardModal />
        </Suspense>
      )}
    </>
  );
}

export default App;
