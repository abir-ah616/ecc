import React, { useState } from 'react';
import {
  RotateCcw,
  Trophy,
  ArrowLeft,
  Plus,
  Shield,
  LogOut,
  ChevronDown,
  Radio,
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
import { useAuthStore } from '../../store/authStore';
import type { ThemePreset } from '../../types/tournament';

interface HeaderProps {
  onOpenReset?: () => void;
  onOpenJson?: () => void;
}

const THEME_OPTIONS: Array<{ id: ThemePreset; name: string; color: string; accent: string }> = [
  { id: 'v2', name: 'Yellow Vector', color: '#FACC15', accent: 'bg-yellow-400' },
  { id: 'blue', name: 'Arctic Cyan', color: '#06B6D4', accent: 'bg-cyan-400' },
  { id: 'gold', name: 'Cyber Rose', color: '#F43F5E', accent: 'bg-rose-500' },
  { id: 'eclipse', name: 'Solar Flare', color: '#FB923C', accent: 'bg-orange-400' },
  { id: 'crimson', name: 'Crimson Red', color: '#EF4444', accent: 'bg-red-500' },
  { id: 'emerald', name: 'Toxic Green', color: '#10B981', accent: 'bg-emerald-400' },
  { id: 'violet', name: 'Royal Violet', color: '#A855F7', accent: 'bg-purple-500' },
];

export const Header: React.FC<HeaderProps> = () => {
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
  const activeThemeMeta =
    THEME_OPTIONS.find((t) => t.id === (settings.theme || 'v2')) || THEME_OPTIONS[0];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B0D14]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl select-none">
      {/* Top Holographic Neon Edge Accent */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber-400/90 to-cyan-400/80 shadow-[0_0_12px_rgba(245,158,11,0.8)]" />

      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* LEFT ZONE: Brand identity or Tournament Telemetry */}
        {isInsideTournament ? (
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {/* Dashboard Return Button */}
            <button
              type="button"
              onClick={() => setCurrentTab('home')}
              className="group flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white hover:bg-white/15 hover:border-amber-400/60 hover:shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all shrink-0 active:scale-95"
              title="Return to Main Command Deck"
            >
              <ArrowLeft className="h-4 w-4 text-amber-400 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">DASHBOARD</span>
            </button>

            <div className="h-8 w-[1px] bg-white/15 hidden sm:block" />

            {/* Live Tournament Status & Name */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-base sm:text-xl font-black uppercase tracking-wider text-white">
                  {settings.name}
                </span>

                <span
                  className={`hidden md:inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border ${
                    settings.mode === 'CHAMPION_RUSH'
                      ? 'bg-purple-950/70 border-purple-500/50 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                      : 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  }`}
                >
                  <Radio className="h-3 w-3 animate-pulse text-amber-400" />
                  <span>{settings.mode === 'CHAMPION_RUSH' ? 'Champion Rush' : 'Classic Scrim'}</span>
                </span>
              </div>

              {/* Progress Bar & Match Ratio */}
              <div className="flex items-center gap-2 mt-0.5">
                <div className="h-1.5 w-20 sm:w-28 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
                    style={{
                      width: `${matches.length > 0 ? (completedCount / matches.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  {completedCount}/{matches.length} MATCHES RECORDED
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setCurrentTab('home')}
              className="flex items-center gap-3.5 group focus:outline-none"
            >
              {/* Futuristic Cyber Badge */}
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 via-neutral-900 to-black border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.3)] group-hover:border-amber-400 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all">
                <Trophy className="h-6 w-6 text-amber-400 group-hover:scale-110 transition-transform" />
                <div className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                </div>
              </div>

              {/* Brand Typography */}
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-display text-2xl sm:text-3xl font-black uppercase tracking-wider text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    ESP CALC
                  </span>
                  <span className="hidden sm:inline-block rounded bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-300">
                    PRO ENGINE
                  </span>
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 -mt-0.5">
                  FREE FIRE BROADCAST DECK
                </p>
              </div>
            </button>
          </div>
        )}

        {/* RIGHT ZONE: High-Impact Action Command Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Quick Create Button (When on Home/History) */}
          {!isInsideTournament && (
            <button
              type="button"
              onClick={() => setCurrentTab('create')}
              className="hidden sm:flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-4 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:brightness-110 hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>CREATE TOURNAMENT</span>
            </button>
          )}

          {/* Holographic Broadcast Theme Matrix Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-amber-400/50 px-3.5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-lg transition-all active:scale-95"
              title="Select Broadcast Graphic Theme"
            >
              <div
                className="h-3.5 w-3.5 rounded-full ring-2 ring-white/20 shadow-sm"
                style={{ backgroundColor: activeThemeMeta.color }}
              />
              <span className="hidden md:inline">{activeThemeMeta.name}</span>
              <ChevronDown
                className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${
                  isThemeMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isThemeMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsThemeMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2.5 w-56 rounded-2xl border border-white/15 bg-[#121520] p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
                  <div className="px-3 py-2 text-[11px] font-black uppercase tracking-widest text-neutral-400 border-b border-white/10 mb-1 flex items-center justify-between">
                    <span>BROADCAST THEMES</span>
                    <span className="text-amber-400 text-[10px]">7 READY</span>
                  </div>
                  <div className="space-y-1">
                    {THEME_OPTIONS.map((theme) => {
                      const isSelected = (settings.theme || 'v2') === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => handleThemeChange(theme.id)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                            isSelected
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                              : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="h-3 w-3 rounded-full ring-2 ring-white/20"
                              style={{ backgroundColor: theme.color }}
                            />
                            <span>{theme.name}</span>
                          </div>
                          {isSelected && (
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#FACC15]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Tactical Undo Control */}
          <button
            type="button"
            onClick={undo}
            disabled={history.length === 0}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              history.length > 0
                ? 'border-white/15 bg-white/5 text-neutral-200 hover:bg-white/15 hover:border-amber-400/50 hover:text-white active:scale-95'
                : 'border-white/5 bg-transparent text-neutral-600 cursor-not-allowed opacity-40'
            }`}
            title={history.length > 0 ? `Undo action (${history.length} available)` : 'Nothing to undo'}
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden lg:inline">UNDO</span>
            {history.length > 0 && (
              <span className="ml-0.5 rounded-md bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-black text-amber-300">
                {history.length}
              </span>
            )}
          </button>

          {/* User Profile / Admin Dashboard */}
          {firebaseUser && (
            <div className="flex items-center gap-2 pl-1 border-l border-white/10">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setAdminDashboardOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-300 transition-all active:scale-95 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  title="Admin Dashboard"
                >
                  <Shield className="h-4 w-4 text-amber-400" />
                  <span className="hidden xl:inline">ADMIN</span>
                </button>
              )}

              <button
                type="button"
                onClick={logout}
                className="flex items-center justify-center h-10 w-10 rounded-xl border border-white/10 bg-white/5 hover:bg-red-500/20 hover:border-red-500/40 text-neutral-400 hover:text-red-300 transition-all active:scale-95"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
