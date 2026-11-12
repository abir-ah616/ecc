import React from 'react';
import {
  RotateCcw,
  Trophy,
  ArrowLeft,
  Plus,
  Palette,
  Shield,
  LogOut,
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
import { useAuthStore } from '../../store/authStore';
import type { ThemePreset } from '../../types/tournament';

interface HeaderProps {
  onOpenReset?: () => void;
  onOpenJson: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenJson }) => {
  const {
    currentTab,
    settings,
    setSettings,
    undo,
    history,
    matches,
    setCurrentTab,
  } = useTournamentStore();

  const {
    firebaseUser,
    isAdmin,
    setAdminDashboardOpen,
    logout,
  } = useAuthStore();

  const isInsideTournament =
    currentTab !== 'home' && currentTab !== 'create' && currentTab !== 'history';

  const handleThemeChange = (theme: ThemePreset) => {
    setSettings({ theme });
    document.documentElement.setAttribute('data-theme', theme);
  };

  const completedCount = matches.filter((m) => m.isCompleted).length;

  return (
    <header className="border-b border-neutral-800 bg-[#0E0E11] px-4 py-2.5 sm:px-6 relative z-30 select-none">
      <div className="mx-auto flex items-center justify-between gap-3 max-w-7xl">
        {/* Left Section */}
        {isInsideTournament ? (
          /* When inside tournament workspace */
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setCurrentTab('home')}
              title="Return to Home Dashboard"
              className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>

            <div className="h-4 w-px bg-neutral-800 shrink-0" />

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-white uppercase truncate">
                  {settings.name}
                </h1>
                <span className="rounded bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 text-[10px] font-bold uppercase text-neutral-400 shrink-0">
                  {settings.mode === 'CHAMPION_RUSH' ? 'Rush' : 'Scrim'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 truncate">
                {settings.roundOrDay} • {completedCount}/{matches.length} matches completed
              </p>
            </div>
          </div>
        ) : (
          /* Global Brand */
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setCurrentTab('home')}
              className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-200">
                <Trophy className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-left">
                <div className="font-display text-base font-bold uppercase tracking-wider text-white leading-none">
                  ESP CALC
                </div>
                <div className="text-[10px] text-neutral-400 font-medium leading-none mt-1">
                  Esports Broadcast Studio
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Right Section Tools */}
        <div className="flex items-center gap-2 shrink-0">
          {isInsideTournament ? (
            <>
              {/* Theme selector */}
              <div className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs">
                <Palette className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <select
                  value={settings.theme || 'v2'}
                  onChange={(e) => handleThemeChange(e.target.value as ThemePreset)}
                  aria-label="Color Theme"
                  className="bg-transparent font-semibold text-neutral-200 focus:outline-none cursor-pointer text-xs"
                >
                  <option value="v2" className="bg-neutral-900 text-amber-400">Yellow</option>
                  <option value="blue" className="bg-neutral-900 text-cyan-400">Arctic Cyan</option>
                  <option value="gold" className="bg-neutral-900 text-rose-400">Cyber Rose</option>
                  <option value="eclipse" className="bg-neutral-900 text-orange-300">Solar Flare</option>
                  <option value="crimson" className="bg-neutral-900 text-red-400">Crimson Red</option>
                  <option value="emerald" className="bg-neutral-900 text-emerald-400">Toxic Green</option>
                  <option value="violet" className="bg-neutral-900 text-purple-400">Royal Violet</option>
                </select>
              </div>

              {/* Undo */}
              <button
                type="button"
                onClick={undo}
                disabled={history.length === 0}
                title="Undo"
                className="rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              {/* JSON */}
              <button
                type="button"
                onClick={onOpenJson}
                title="JSON Backup"
                className="hidden sm:inline-flex rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                JSON
              </button>
            </>
          ) : (
            <>
              {/* Home top action: Quick create */}
              <button
                type="button"
                onClick={() => setCurrentTab('create')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-500 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New</span>
              </button>

              <button
                type="button"
                onClick={onOpenJson}
                title="JSON Data Backup & Restore"
                className="hidden sm:inline-flex rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                JSON
              </button>
            </>
          )}

          {/* Admin panel */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setAdminDashboardOpen(true)}
              title="Admin allowlist"
              className="rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-amber-400 hover:bg-neutral-800 transition-colors"
            >
              <Shield className="h-3.5 w-3.5" />
            </button>
          )}

          {/* User profile & logout */}
          {firebaseUser && (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-neutral-800">
              <div
                title={firebaseUser.email || ''}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-800 text-xs font-bold text-neutral-300 overflow-hidden"
              >
                {firebaseUser.photoURL ? (
                  <img src={firebaseUser.photoURL} alt="" className="h-full w-full object-cover" />
                ) : (
                  (firebaseUser.displayName || firebaseUser.email || 'U')[0].toUpperCase()
                )}
              </div>
              <button
                type="button"
                onClick={() => logout()}
                title="Logout"
                className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
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
