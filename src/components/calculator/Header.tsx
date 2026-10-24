import React from 'react';
import {
  RotateCcw,
  Download,
  RefreshCw,
  Trophy,
  Flame,
  ArrowLeft,
  Plus,
  Palette,
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
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
    loadFullDemoTournament,
    matches,
    setCurrentTab,
  } = useTournamentStore();

  const isInsideTournament =
    currentTab !== 'home' && currentTab !== 'create' && currentTab !== 'history';

  const handleThemeChange = (theme: ThemePreset) => {
    setSettings({ theme });
    document.documentElement.setAttribute('data-theme', theme);
  };

  const completedCount = matches.filter((m) => m.isCompleted).length;

  return (
    <header className="border-b border-neutral-800/80 bg-[#090608] px-4 py-2.5 sm:px-6 relative z-20 select-none">
      <div className="mx-auto flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between max-w-7xl">
        {/* Left Section */}
        {isInsideTournament ? (
          /* INSIDE TOURNAMENT WORKSPACE */
          <div className="flex items-center gap-3 min-w-0">
            {/* Dashboard Back Button */}
            <button
              type="button"
              onClick={() => setCurrentTab('home')}
              title="Return to Tournaments Dashboard"
              className="flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white transition-colors shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-neutral-400" />
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
                <span className="text-neutral-300 font-bold">{completedCount}</span> of{' '}
                <span className="text-neutral-300 font-bold">{matches.length}</span> matches completed
              </p>
            </div>
          </div>
        ) : (
          /* GLOBAL DASHBOARD */
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-900 border border-neutral-800 text-amber-400">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg tracking-wider text-white font-bold uppercase">
                  ESP CALC
                </h1>
                <span className="text-neutral-600 text-xs">•</span>
                <span className="text-xs text-neutral-400 font-medium">
                  Free Fire Tournament Standings
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
              {/* Sleek Compact Theme Selector */}
              <div className="flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-300">
                <Palette className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <span className="text-neutral-500 text-[11px] font-semibold uppercase">Theme:</span>
                <select
                  value={settings.theme || 'v2'}
                  onChange={(e) => handleThemeChange(e.target.value as ThemePreset)}
                  aria-label="Color Theme"
                  className="bg-transparent font-bold text-neutral-200 focus:outline-none cursor-pointer text-xs"
                >
                  <option value="v2" className="bg-neutral-900 text-amber-400">Yellow</option>
                  <option value="crimson" className="bg-neutral-900 text-red-400">Crimson</option>
                  <option value="blue" className="bg-neutral-900 text-blue-400">Blue</option>
                  <option value="gold" className="bg-neutral-900 text-amber-300">Gold</option>
                  <option value="emerald" className="bg-neutral-900 text-emerald-400">Emerald</option>
                  <option value="violet" className="bg-neutral-900 text-purple-400">Violet</option>
                </select>
              </div>

              {/* Undo */}
              <button
                type="button"
                onClick={undo}
                disabled={history.length === 0}
                title="Undo last change"
                className="flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 px-2.5 py-1 text-xs font-semibold text-neutral-300 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Undo</span>
              </button>

              {/* JSON Export/Import */}
              <button
                type="button"
                onClick={onOpenJson}
                title="Export or import tournament JSON"
                className="flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 px-2.5 py-1 text-xs font-semibold text-neutral-300 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>JSON</span>
              </button>

              {/* Reset Tournament */}
              <button
                type="button"
                onClick={onOpenReset}
                title="Reset active tournament data"
                className="flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 hover:border-red-900/60 hover:bg-red-950/40 px-2.5 py-1 text-xs font-semibold text-neutral-400 hover:text-red-400 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            </>
          ) : (
            /* GLOBAL DASHBOARD TOOLS */
            <>
              <button
                type="button"
                onClick={() => setCurrentTab('create')}
                className="flex items-center gap-1.5 rounded-md bg-red-600 hover:bg-red-500 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition-colors shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Tournament</span>
              </button>

              <button
                type="button"
                onClick={loadFullDemoTournament}
                title="Load full 5-match sample tournament"
                className="flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition-colors"
              >
                <Flame className="h-3.5 w-3.5 text-neutral-400" />
                <span>Sample Demo</span>
              </button>

              <button
                type="button"
                onClick={onOpenJson}
                title="Export or import tournaments backup"
                className="flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>JSON Backup</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
