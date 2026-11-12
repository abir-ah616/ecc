import React from 'react';
import {
  RotateCcw,
  Download,
  RefreshCw,
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
  onOpenReset: () => void;
  onOpenJson: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenReset, onOpenJson }) => {
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
    allUsers,
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
    <header className="border-b border-neutral-800/80 bg-[#0E0B10]/95 backdrop-blur-md px-4 py-3 sm:px-6 relative z-20 select-none">
      <div className="mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between max-w-7xl">
        {/* Left Section */}
        {isInsideTournament ? (
          /* INSIDE TOURNAMENT WORKSPACE */
          <div className="flex items-center gap-3 min-w-0">
            {/* Dashboard Back Button */}
            <button
              type="button"
              onClick={() => setCurrentTab('home')}
              title="Return to Tournaments Dashboard"
              className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900/90 hover:bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white transition-colors shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-neutral-400" />
              <span>Dashboard</span>
            </button>

            <div className="h-5 w-px bg-neutral-800 shrink-0" />

            {/* Tournament Details */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-base sm:text-lg font-black tracking-wide text-white uppercase truncate">
                  {settings.name}
                </h1>
                <span className="rounded-md bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-300 shrink-0">
                  {settings.mode === 'CHAMPION_RUSH' ? 'CHAMPION RUSH' : 'SCRIM'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-medium">
                {settings.roundOrDay} •{' '}
                <span className="text-emerald-400 font-bold">{completedCount}</span> of{' '}
                <span className="text-white font-bold">{matches.length}</span> matches concluded
              </p>
            </div>
          </div>
        ) : (
          /* GLOBAL DASHBOARD */
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-md shadow-red-950/60">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg tracking-wider text-white font-black uppercase">
                  ESP CALC
                </h1>
                <span className="text-neutral-600 text-xs">•</span>
                <span className="text-xs text-neutral-400 font-medium">
                  Free Fire Esports Broadcast Engine
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Right Section Toolbar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isInsideTournament ? (
            /* TOURNAMENT TOOLS */
            <>
              {/* Theme Selector */}
              <div className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900/90 px-3 py-1.5 text-xs text-neutral-300">
                <Palette className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="text-neutral-500 text-[11px] font-semibold uppercase">Style:</span>
                <select
                  value={settings.theme || 'v2'}
                  onChange={(e) => handleThemeChange(e.target.value as ThemePreset)}
                  aria-label="Color Theme"
                  className="bg-transparent font-bold text-neutral-200 focus:outline-none cursor-pointer text-xs"
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
                title="Undo last change"
                className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900/90 hover:bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-300 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Undo</span>
              </button>

              {/* JSON Export/Import */}
              <button
                type="button"
                onClick={onOpenJson}
                title="Export or Import JSON data"
                className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900/90 hover:bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">JSON</span>
              </button>

              {/* Reset Data */}
              <button
                type="button"
                onClick={onOpenReset}
                title="Reset or clear tournament data"
                className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900/90 hover:bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </>
          ) : (
            /* GLOBAL DASHBOARD TOOLS */
            <>
              {/* Quick Launch Button */}
              <button
                type="button"
                onClick={() => setCurrentTab('create')}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-display font-black uppercase tracking-wider text-white hover:bg-red-500 transition-colors shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Tournament</span>
              </button>

              {/* JSON Manager */}
              <button
                type="button"
                onClick={onOpenJson}
                title="Export or Import tournament JSON"
                className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900/90 hover:bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">JSON</span>
              </button>
            </>
          )}

          {/* Admin Dashboard Trigger */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setAdminDashboardOpen(true)}
              title="Admin Dashboard (User Allowlist)"
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              <Shield className="h-3.5 w-3.5 text-amber-400" />
              <span>Admin ({allUsers.length})</span>
            </button>
          )}

          {/* User Profile Avatar / Logout */}
          {firebaseUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
              <div
                title={firebaseUser.email || ''}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-800 border border-neutral-700 text-xs font-bold text-neutral-200 overflow-hidden"
              >
                {firebaseUser.photoURL ? (
                  <img
                    src={firebaseUser.photoURL}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (firebaseUser.displayName || firebaseUser.email || 'U')[0].toUpperCase()
                )}
              </div>
              <button
                type="button"
                onClick={() => logout()}
                title="Sign out of ESP CALC"
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-red-400 transition-colors"
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
