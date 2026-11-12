import React from 'react';
import {
  RotateCcw,
  Trophy,
  ArrowLeft,
  Download,
  Shield,
  LogOut,
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
import { useAuthStore } from '../../store/authStore';

interface HeaderProps {
  onOpenReset?: () => void;
  onOpenJson: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenJson }) => {
  const {
    currentTab,
    settings,
    undo,
    history,
    matches,
    setCurrentTab,
  } = useTournamentStore();

  const {
    firebaseUser,
    isAdmin,
    allUsers,
    setAdminDashboardOpen,
    logout,
  } = useAuthStore();

  const isInsideTournament =
    currentTab !== 'home' && currentTab !== 'create' && currentTab !== 'history';

  const completedCount = matches.filter((m) => m.isCompleted).length;

  return (
    <header className="border-b border-neutral-800 bg-[#090A0F] px-4 py-3 sm:px-6 relative z-20 select-none">
      <div className="mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 max-w-7xl">
        {/* Left Section */}
        {isInsideTournament ? (
          <div className="flex items-center gap-3 min-w-0">
            {/* Dashboard Return Button */}
            <button
              type="button"
              onClick={() => setCurrentTab('home')}
              title="Return to Dashboard"
              className="flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white transition-colors shrink-0"
            >
              <ArrowLeft className="h-4 w-4 text-neutral-400" />
              <span>Dashboard</span>
            </button>

            <div className="h-5 w-px bg-neutral-800 shrink-0" />

            {/* Tournament Details */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-base sm:text-lg font-bold tracking-wide text-white uppercase truncate">
                  {settings.name}
                </h1>
                <span className="rounded bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-300 shrink-0">
                  {settings.mode === 'CHAMPION_RUSH' ? 'CHAMPION RUSH' : 'SCRIM'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-medium">
                {settings.roundOrDay} •{' '}
                <span className="text-neutral-200 font-bold">{completedCount}</span> of{' '}
                <span className="text-neutral-200 font-bold">{matches.length}</span> matches completed
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentTab('home')}
              className="flex items-center gap-2.5 text-left"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-900 border border-neutral-800 text-amber-400">
                <Trophy className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg tracking-wider text-white font-bold uppercase">
                    ESP CALC
                  </span>
                  <span className="text-neutral-600 text-xs hidden sm:inline">•</span>
                  <span className="text-xs text-neutral-400 font-medium hidden sm:inline">
                    Free Fire Tournament Standings
                  </span>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Right Section Tools */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Undo Action */}
          <button
            type="button"
            onClick={undo}
            disabled={history.length === 0}
            title={history.length > 0 ? `Undo (${history.length})` : 'Nothing to undo'}
            className="flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 px-2.5 py-1.5 text-xs font-semibold text-neutral-300 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Undo</span>
            {history.length > 0 && (
              <span className="rounded bg-neutral-800 px-1 py-0.2 text-[10px] font-bold text-neutral-200">
                {history.length}
              </span>
            )}
          </button>

          {/* JSON Backup Button */}
          <button
            type="button"
            onClick={onOpenJson}
            title="Export / Import JSON"
            className="flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 px-2.5 py-1.5 text-xs font-semibold text-neutral-300 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>JSON</span>
          </button>

          {/* Admin Panel */}
          {firebaseUser && isAdmin && (
            <button
              type="button"
              onClick={() => setAdminDashboardOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 transition-colors"
            >
              <Shield className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Admin</span>
              <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[10px] font-bold text-amber-300">
                {allUsers.length}
              </span>
            </button>
          )}

          {/* User Sign Out */}
          {firebaseUser && (
            <div className="flex items-center gap-2 pl-1 border-l border-neutral-800">
              <span
                className="max-w-[120px] truncate text-[11px] font-medium text-neutral-400 hidden lg:inline"
                title={firebaseUser.email || ''}
              >
                {firebaseUser.email}
              </span>
              <button
                type="button"
                onClick={logout}
                title="Sign out"
                className="flex items-center gap-1 rounded-md border border-neutral-800 bg-neutral-900 hover:bg-red-950/40 hover:border-red-900/60 p-1.5 text-xs font-semibold text-neutral-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
