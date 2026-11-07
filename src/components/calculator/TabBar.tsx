import React from 'react';
import {
  Home,
  PlusCircle,
  History,
  Trophy,
  CheckCircle2,
  Circle,
  Plus,
  Crown,
  RotateCcw,
  Settings,
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';

export const TabBar: React.FC = () => {
  const {
    matches,
    currentTab,
    setCurrentTab,
    createMatch,
    settings,
    getStandings,
    endTournament,
    reopenTournament,
    tournaments,
  } = useTournamentStore();

  const isInsideTournament =
    currentTab !== 'home' && currentTab !== 'create' && currentTab !== 'history';

  const standings = getStandings();

  const maxMatchesReached =
    settings.mode === 'CHAMPION_RUSH'
      ? matches.length >= settings.championRush.maxMatches
      : matches.length >= settings.totalMatchesPlanned;

  const canAddMatch = !standings.tournamentConcluded && !maxMatchesReached;
  const liveCount = tournaments.filter((t) => !t.isEnded).length;

  return (
    <div className="border-b border-neutral-800 bg-[#120B0D] px-4 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 overflow-x-auto py-2 scrollbar-thin">
        {/* If user is OUTSIDE tournament (Home / Create / History) */}
        {!isInsideTournament ? (
          <div className="flex items-center justify-between w-full">
            {/* Global Tabs Only */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Home Tab */}
              <button
                type="button"
                onClick={() => setCurrentTab('home')}
                className={`flex shrink-0 items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  currentTab === 'home'
                    ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                }`}
              >
                <Home className="h-3.5 w-3.5 text-red-500" />
                <span>Home</span>
              </button>

              {/* Create Tournament Tab */}
              <button
                type="button"
                onClick={() => setCurrentTab('create')}
                className={`flex shrink-0 items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  currentTab === 'create'
                    ? 'bg-red-950 text-red-200 shadow-sm border border-red-700/80'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                }`}
              >
                <PlusCircle className="h-3.5 w-3.5 text-red-400" />
                <span>Create Tournament</span>
              </button>

              {/* Tournament History Tab */}
              <button
                type="button"
                onClick={() => setCurrentTab('history')}
                className={`flex shrink-0 items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  currentTab === 'history'
                    ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                }`}
              >
                <History className="h-3.5 w-3.5 text-amber-400" />
                <span>History ({tournaments.length})</span>
              </button>
            </div>

            {/* Live Indicator on the right */}
            <div className="flex items-center gap-2">
              {liveCount > 0 ? (
                <span className="flex items-center gap-1.5 rounded bg-emerald-950/80 border border-emerald-800/50 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{liveCount} Tournament{liveCount === 1 ? '' : 's'} Live</span>
                </span>
              ) : (
                <span className="text-xs text-neutral-500">
                  All tournaments concluded
                </span>
              )}
            </div>
          </div>
        ) : (
          /* If user IS INSIDE tournament workspace (matches / results / edit) */
          <>
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Matches List */}
              <div className="flex items-center gap-1 pr-1.5 border-r border-neutral-800/80">
                {matches.map((m) => {
                  const isActive = currentTab === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setCurrentTab(m.id)}
                      className={`flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                        isActive
                          ? 'bg-red-950/90 text-red-300 border border-red-700/60 shadow-sm'
                          : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                      }`}
                    >
                      {m.isCompleted ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Circle className="h-3 w-3 text-amber-500 animate-pulse" />
                      )}
                      <span>M{m.matchNumber}</span>
                    </button>
                  );
                })}

                {canAddMatch && (
                  <button
                    type="button"
                    onClick={() => createMatch()}
                    title="Add new match to active tournament"
                    className="flex shrink-0 items-center gap-1 rounded border border-dashed border-red-800/60 bg-red-950/20 px-2 py-1.5 text-xs font-bold text-red-400 hover:border-red-600 hover:bg-red-950/50 hover:text-red-200 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+M{matches.length + 1}</span>
                  </button>
                )}
              </div>

              {/* Standings Graphic Tab */}
              <button
                type="button"
                onClick={() => setCurrentTab('results')}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  currentTab === 'results'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-neutral-300 hover:bg-neutral-900 hover:text-white border border-neutral-800'
                }`}
              >
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                <span>Standings Graphic</span>
              </button>

              {/* Edit Tournament Tab */}
              <button
                type="button"
                onClick={() => setCurrentTab('edit')}
                className={`flex shrink-0 items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  currentTab === 'edit'
                    ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                }`}
              >
                <Settings className="h-3.5 w-3.5 text-neutral-400" />
                <span>Edit Tournament</span>
              </button>
            </div>

            {/* Right side: Tournament Status & End Tournament Button */}
            <div className="flex items-center gap-2 shrink-0">
              {standings.tournamentConcluded ? (
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1 rounded bg-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-300 border border-amber-500/40">
                    <Crown className="h-3.5 w-3.5 text-amber-400" />
                    <span>ENDED</span>
                  </span>
                  <button
                    type="button"
                    onClick={reopenTournament}
                    title="Undo End Tournament"
                    className="flex items-center gap-1 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs font-medium text-neutral-300 hover:bg-neutral-800 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reopen</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={endTournament}
                  title="Officially conclude tournament"
                  className="flex items-center gap-1 rounded border border-red-800/80 bg-red-950/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-300 hover:bg-red-900/60 transition-colors"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-red-400" />
                  <span>End Tournament</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
