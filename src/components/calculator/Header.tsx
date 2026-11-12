import React, { useState } from 'react';
import {
  RotateCcw,
  Trophy,
  ArrowLeft,
  Plus,
  Shield,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
import { useAuthStore } from '../../store/authStore';
import type { ThemePreset } from '../../types/tournament';

interface HeaderProps {
  onOpenReset?: () => void;
  onOpenJson: () => void;
}

const THEME_OPTIONS: Array<{ id: ThemePreset; name: string; color: string }> = [
  { id: 'v2', name: 'Yellow Vector', color: '#FACC15' },
  { id: 'blue', name: 'Arctic Cyan', color: '#06B6D4' },
  { id: 'gold', name: 'Cyber Rose', color: '#F43F5E' },
  { id: 'eclipse', name: 'Solar Flare', color: '#FB923C' },
  { id: 'crimson', name: 'Crimson Red', color: '#EF4444' },
  { id: 'emerald', name: 'Toxic Green', color: '#10B981' },
  { id: 'violet', name: 'Royal Violet', color: '#A855F7' },
];

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

  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const isInsideTournament =
    currentTab !== 'home' && currentTab !== 'create' && currentTab !== 'history';

  const handleThemeChange = (theme: ThemePreset) => {
    setSettings({ theme });
    document.documentElement.setAttribute('data-theme', theme);
    setIsThemeMenuOpen(false);
  };

  const completedCount = matches.filter((m) => m.isCompleted).length;
  const activeThemeMeta = THEME_OPTIONS.find((t) => t.id === (settings.theme || 'v2')) || THEME_OPTIONS[0];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#09090B]/90 backdrop-blur-md px-4 py-2.5 sm:px-6 select-none transition-colors">
      <div className="mx-auto flex items-center justify-between gap-4 max-w-7xl">
        {/* Left Section: Breadcrumb / Brand */}
        {isInsideTournament ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setCurrentTab('home')}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
              title="Return to Home Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>

            <span className="text-zinc-600 font-light hidden sm:inline">/</span>

            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate text-sm font-semibold text-zinc-100">
                {settings.name}
              </span>
              <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-zinc-400 shrink-0">
                {settings.mode === 'CHAMPION_RUSH' ? 'Champion Rush' : 'Classic Scrim'}
              </span>
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-zinc-400 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{completedCount}/{matches.length} played</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentTab('home')}
              className="flex items-center gap-2.5 group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-white/[0.08] group-hover:border-zinc-700 transition-colors">
                <Trophy className="h-4 w-4 text-zinc-300 group-hover:text-amber-400 transition-colors" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold tracking-tight text-white uppercase">
                  ESP CALC
                </span>
                <span className="text-[11px] font-medium text-zinc-500 hidden sm:inline">
                  Studio
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Right Section: Compact Workspace Tools */}
        <div className="flex items-center gap-2 shrink-0">
          {isInsideTournament ? (
            <>
              {/* Modern Theme Switcher Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-zinc-900/90 hover:bg-zinc-800/80 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: activeThemeMeta.color }}
                  />
                  <span className="hidden sm:inline">{activeThemeMeta.name}</span>
                  <ChevronDown className="h-3 w-3 text-zinc-400" />
                </button>

                {isThemeMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsThemeMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1.5 z-40 w-44 rounded-xl border border-white/[0.1] bg-[#141417] p-1.5 shadow-2xl space-y-0.5">
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        Poster Theme
                      </div>
                      {THEME_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleThemeChange(opt.id)}
                          className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                            settings.theme === opt.id
                              ? 'bg-white/[0.1] text-white font-semibold'
                              : 'text-zinc-300 hover:bg-white/[0.05] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: opt.color }}
                            />
                            <span>{opt.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Undo Button */}
              <button
                type="button"
                onClick={undo}
                disabled={history.length === 0}
                title="Undo last change"
                className="rounded-lg border border-white/[0.08] bg-zinc-900/90 p-1.5 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              {/* JSON Manager */}
              <button
                type="button"
                onClick={onOpenJson}
                title="Export / Import Tournament JSON"
                className="hidden sm:inline-flex rounded-lg border border-white/[0.08] bg-zinc-900/90 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                JSON
              </button>
            </>
          ) : (
            <>
              {/* Primary Launch Action */}
              <button
                type="button"
                onClick={() => setCurrentTab('create')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-white transition-all shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Tournament</span>
              </button>

              <button
                type="button"
                onClick={onOpenJson}
                title="Backup / Restore JSON data"
                className="hidden sm:inline-flex rounded-lg border border-white/[0.08] bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                JSON
              </button>
            </>
          )}

          {/* Admin Allowlist Access */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setAdminDashboardOpen(true)}
              title="Admin Permissions Dashboard"
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-1.5 text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              <Shield className="h-3.5 w-3.5" />
            </button>
          )}

          {/* User Profile / Logout */}
          {firebaseUser && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-white/[0.08]">
              <div
                title={firebaseUser.email || ''}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-zinc-300 overflow-hidden border border-white/[0.06]"
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
                title="Sign out of ESP CALC"
                className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
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
