import React, { useState } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  SlidersHorizontal,
  History,
  Trophy,
  Users,
  Database,
  Shield,
  LogOut,
  RotateCcw,
  Menu,
  X,
  Plus,
  CheckCircle2,
  Circle,
  Image as ImageIcon,
  Gamepad2,
  Flag,
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
import { useAuthStore } from '../../store/authStore';
import { Footer } from './Footer';

interface AppShellProps {
  children: React.ReactNode;
  onOpenJson: () => void;
  onOpenReset?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  onOpenJson,
  onOpenReset,
}) => {
  const {
    tournaments,
    activeTournamentId,
    getActiveTournament,
    currentTab,
    setCurrentTab,
    matches,
    settings,
    createMatch,
    getStandings,
    endTournament,
    reopenTournament,
    undo,
    history,
  } = useTournamentStore();

  const {
    firebaseUser,
    isAdmin,
    allUsers,
    setAdminDashboardOpen,
    logout,
  } = useAuthStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeTournament = getActiveTournament();
  const hasActiveTournament = Boolean(activeTournament && activeTournamentId);

  const standings = hasActiveTournament ? getStandings() : null;
  const completedCount = matches.filter((m) => m.isCompleted).length;

  const maxMatchesReached =
    settings.mode === 'CHAMPION_RUSH'
      ? matches.length >= settings.championRush.maxMatches
      : matches.length >= settings.totalMatchesPlanned;

  const canAddMatch =
    hasActiveTournament &&
    standings !== null &&
    !standings.tournamentConcluded &&
    !maxMatchesReached;

  const preferredMatch =
    matches.find((m) => !m.isCompleted) || matches[matches.length - 1];

  const isInsideTournamentView =
    hasActiveTournament &&
    currentTab !== 'home' &&
    currentTab !== 'create' &&
    currentTab !== 'history' &&
    currentTab !== 'rules' &&
    currentTab !== 'setup';

  const navigate = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileMenuOpen(false);
  };

  const handleAddMatch = () => {
    const newId = createMatch();
    setCurrentTab(newId);
    setMobileMenuOpen(false);
  };

  const getHeaderContext = () => {
    if (currentTab === 'home') {
      return {
        title: 'Overview',
        subtitle: `${tournaments.filter((t) => !t.isEnded).length} active tournaments`,
      };
    }
    if (currentTab === 'create') {
      return {
        title: 'New Tournament',
        subtitle: 'Select mode, targets, and participating squads',
      };
    }
    if (currentTab === 'rules' || currentTab === 'setup') {
      return {
        title: 'Scoring Rules',
        subtitle: 'Default placement points and elimination values',
      };
    }
    if (currentTab === 'history') {
      return {
        title: 'Tournament History',
        subtitle: `${tournaments.length} saved records`,
      };
    }
    if (hasActiveTournament) {
      const activeMatch = matches.find((m) => m.id === currentTab);
      if (activeMatch) {
        return {
          title: settings.name,
          subtitle: `Match ${activeMatch.matchNumber} of ${
            settings.mode === 'CHAMPION_RUSH'
              ? settings.championRush.maxMatches
              : settings.totalMatchesPlanned
          } · ${completedCount} completed`,
        };
      }
      if (currentTab === 'results') {
        return {
          title: settings.name,
          subtitle: 'Standing Graphic Studio',
        };
      }
      if (currentTab === 'edit') {
        return {
          title: settings.name,
          subtitle: 'Squads & Event Settings',
        };
      }
    }
    return { title: 'ESP CALC', subtitle: 'Tournament Workspace' };
  };

  const headerContext = getHeaderContext();

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col justify-between">
      <div className="space-y-6 overflow-y-auto px-3 py-4">
        {/* Brand Logo (Clean Frosted Icon Tile, Zero Glow) */}
        <button
          type="button"
          onClick={() => navigate('home')}
          className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-white/[0.05] transition-colors"
        >
          <div className="glass-tile flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-amber-400">
            <Trophy className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold tracking-wide text-slate-100">
              ESP CALC
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              Standings Studio
            </div>
          </div>
        </button>

        {/* Global App Navigation */}
        <div className="space-y-1">
          <div className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Workspace
          </div>

          <button
            type="button"
            onClick={() => navigate('home')}
            className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium border transition-colors ${
              currentTab === 'home'
                ? 'bg-white/[0.09] border-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('create')}
            className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium border transition-colors ${
              currentTab === 'create'
                ? 'bg-white/[0.09] border-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
            }`}
          >
            <PlusCircle className="h-4 w-4 shrink-0" />
            <span>New Tournament</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('rules')}
            className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium border transition-colors ${
              currentTab === 'rules' || currentTab === 'setup'
                ? 'bg-white/[0.09] border-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0" />
            <span>Scoring Rules</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('history')}
            className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-sm font-medium border transition-colors ${
              currentTab === 'history'
                ? 'bg-white/[0.09] border-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <History className="h-4 w-4 shrink-0" />
              <span>History</span>
            </span>
            {tournaments.length > 0 && (
              <span className="rounded-md bg-white/[0.08] border border-white/[0.08] px-1.5 py-0.5 text-[11px] font-semibold text-slate-300 tabular-nums">
                {tournaments.length}
              </span>
            )}
          </button>
        </div>

        {/* Active Tournament Context */}
        {hasActiveTournament && activeTournament && (
          <div className="space-y-1.5 border-t border-white/[0.08] pt-4">
            <div className="px-2.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Active Event
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                  activeTournament.isEnded
                    ? 'bg-white/[0.06] text-slate-400'
                    : 'bg-emerald-500/15 border border-emerald-400/25 text-emerald-300'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    activeTournament.isEnded ? 'bg-slate-400' : 'bg-emerald-400'
                  }`}
                />
                {activeTournament.isEnded ? 'Ended' : 'Live'}
              </span>
            </div>

            <div className="glass-tile mx-1 rounded-xl px-3 py-2">
              <div className="truncate text-xs font-semibold text-slate-100">
                {settings.name}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400 truncate">
                {settings.mode === 'CHAMPION_RUSH'
                  ? `Champion Rush · ${settings.championRush.targetPoints} pts`
                  : `Classic Scrim · ${settings.totalMatchesPlanned} matches`}
              </div>
            </div>

            {/* Direct Matches List */}
            <div className="space-y-0.5 pt-1">
              {matches.map((m) => {
                const isSelected = currentTab === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => navigate(m.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-sm font-medium border transition-colors ${
                      isSelected
                        ? 'glass-accent text-amber-200'
                        : 'border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      {m.isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      )}
                      <span>Match {m.matchNumber}</span>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {m.isCompleted ? 'Saved' : 'Draft'}
                    </span>
                  </button>
                );
              })}

              {canAddMatch && (
                <button
                  type="button"
                  onClick={handleAddMatch}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-500/10 transition-colors"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <span>Add Match {matches.length + 1}</span>
                </button>
              )}
            </div>

            {/* Event Sub-pages */}
            <div className="space-y-0.5 pt-1">
              <button
                type="button"
                onClick={() => navigate('results')}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium border transition-colors ${
                  currentTab === 'results'
                    ? 'glass-accent text-amber-200'
                    : 'border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                }`}
              >
                <ImageIcon className="h-4 w-4 shrink-0" />
                <span>Standing Poster</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('edit')}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium border transition-colors ${
                  currentTab === 'edit'
                    ? 'glass-accent text-amber-200'
                    : 'border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                }`}
              >
                <Users className="h-4 w-4 shrink-0" />
                <span>Squads & Info</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Data & User Utilities */}
      <div className="border-t border-white/[0.08] p-3 space-y-1.5">
        <button
          type="button"
          onClick={() => {
            setMobileMenuOpen(false);
            onOpenJson();
          }}
          className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 transition-colors"
        >
          <Database className="h-4 w-4 shrink-0" />
          <span>Backup & JSON</span>
        </button>

        {onOpenReset && hasActiveTournament && (
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenReset();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
          >
            <Flag className="h-4 w-4 shrink-0" />
            <span>Reset Active Match Data</span>
          </button>
        )}

        {firebaseUser && isAdmin && (
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              setAdminDashboardOpen(true);
            }}
            className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium text-amber-300 hover:bg-amber-500/10 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Shield className="h-4 w-4 shrink-0" />
              <span>Team Access</span>
            </span>
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-amber-300 tabular-nums">
              {allUsers.length}
            </span>
          </button>
        )}

        {firebaseUser && (
          <div className="glass-tile flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 mt-1">
            <div className="min-w-0">
              <div className="truncate text-xs font-medium text-slate-200">
                {firebaseUser.displayName || 'Authorized User'}
              </div>
              <div className="truncate text-[11px] text-slate-400">
                {firebaseUser.email}
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Sign out"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-500/15 hover:text-rose-300 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="glass-canvas relative min-h-screen text-slate-100 flex font-ui selection:bg-amber-500/30 selection:text-amber-100">
      {/* Static Lightweight Architectural Glass Depth Shapes (Zero Gradients, Zero Animation) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      >
        <circle cx="960" cy="180" r="240" fill="#F59E0B" fillOpacity="0.05" />
        <circle cx="520" cy="700" r="260" fill="#38BDF8" fillOpacity="0.045" />
      </svg>

      {/* Desktop Left Frosted Glass Navigation Rail */}
      <aside className="glass-chrome relative z-20 hidden md:flex md:w-64 shrink-0 flex-col border-r border-white/[0.08] sticky top-0 h-screen">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Slide-over Frosted Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/65"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="glass-modal relative z-10 flex w-72 max-w-[85vw] flex-col border-r border-white/[0.12] h-full">
            <div className="flex items-center justify-end border-b border-white/[0.08] px-3 py-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{renderSidebarContent()}</div>
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* Calm Contextual Frosted Top Bar (No Create CTA, No Theme Selector, No Glows) */}
        <header className="glass-chrome sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-white/[0.08] px-4 sm:px-6 select-none">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              className="glass-pill flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:text-white md:hidden"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>

            <div className="min-w-0">
              <div className="truncate text-sm sm:text-base font-semibold text-white leading-tight">
                {headerContext.title}
              </div>
              <div className="truncate text-[11px] sm:text-xs text-slate-400 leading-tight">
                {headerContext.subtitle}
              </div>
            </div>
          </div>

          {/* Right Contextual Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {history.length > 0 && (
              <button
                type="button"
                onClick={undo}
                title={`Undo last action (${history.length})`}
                className="glass-pill inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                <span>Undo</span>
                <span className="rounded bg-white/[0.1] px-1.5 py-0.5 text-[10px] font-semibold text-slate-200 tabular-nums">
                  {history.length}
                </span>
              </button>
            )}

            {isInsideTournamentView && activeTournament && (
              <button
                type="button"
                onClick={() =>
                  activeTournament.isEnded
                    ? reopenTournament()
                    : endTournament()
                }
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTournament.isEnded
                    ? 'glass-pill text-slate-200'
                    : 'border-emerald-400/30 bg-emerald-500/12 text-emerald-300 hover:bg-emerald-500/20'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    activeTournament.isEnded ? 'bg-slate-400' : 'bg-emerald-400'
                  }`}
                />
                <span className="hidden sm:inline">
                  {activeTournament.isEnded ? 'Reopen Event' : 'End Event'}
                </span>
                <span className="sm:hidden">
                  {activeTournament.isEnded ? 'Reopen' : 'End'}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Workspace Content */}
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 pb-24 md:pb-8">
          <div className="mx-auto max-w-6xl">
            {children}
            <Footer />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Frosted Glass Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="glass-chrome fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.08] px-2 py-1.5 md:hidden select-none"
      >
        <div className="grid grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => navigate('home')}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium border transition-colors ${
              currentTab === 'home'
                ? 'glass-accent text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="h-4.5 w-4.5" />
            <span>Home</span>
          </button>

          {hasActiveTournament && preferredMatch ? (
            <button
              type="button"
              onClick={() => navigate(preferredMatch.id)}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium border transition-colors ${
                matches.some((m) => m.id === currentTab)
                  ? 'glass-accent text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gamepad2 className="h-4.5 w-4.5" />
              <span>Matches</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('create')}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium border transition-colors ${
                currentTab === 'create'
                  ? 'glass-accent text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <PlusCircle className="h-4.5 w-4.5" />
              <span>Create</span>
            </button>
          )}

          {hasActiveTournament ? (
            <button
              type="button"
              onClick={() => navigate('results')}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium border transition-colors ${
                currentTab === 'results'
                  ? 'glass-accent text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="h-4.5 w-4.5" />
              <span>Poster</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('rules')}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium border transition-colors ${
                currentTab === 'rules' || currentTab === 'setup'
                  ? 'glass-accent text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="h-4.5 w-4.5" />
              <span>Rules</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('history')}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium border transition-colors ${
              currentTab === 'history'
                ? 'glass-accent text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="h-4.5 w-4.5" />
            <span>History</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
