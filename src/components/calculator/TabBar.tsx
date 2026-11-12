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
    teams,
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
    <div className="border-b border-neutral-800/80 bg-[#110D12] px-4 sm:px-6 select-none">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 overflow-x-auto py-2.5 scrollbar-thin">
        {/* If user is OUTSIDE tournament workspace */}
        {!isInsideTournament ? (
          <div className="flex items-center justify-between w-full">
            {/* Global Tabs */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Home */}
              <button
                type="button"
                onClick={() => setCurrentTab('home')}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  currentTab === 'home'
                    ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/80'
                    : 'text-neutral-400 hover:bg-neutral-900/80 hover:text-neutral-200'
                }`}
              >
                <Home className="h-4 w-4 text-red-500" />
                <span>Home Dashboard</span>
              </button>

              {/* Create Tournament */}
              <button
                type="button"
                onClick={() => setCurrentTab('create')}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  currentTab === 'create'
                    ? 'bg-red-950 text-red-200 shadow-sm border border-red-700/80'
                    : 'text-neutral-400 hover:bg-neutral-900/80 hover:text-neutral-200'
                }`}
              >
                <PlusCircle className="h-4 w-4 text-red-400" />
                <span>Create Tournament</span>
              </button>

              {/* History Archive */}
              <button
                type="button"
                onClick={() => setCurrentTab('history')}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  currentTab === 'history'
                    ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/80'
                    : 'text-neutral-400 hover:bg-neutral-900/80 hover:text-neutral-200'
                }`}
              >
                <History className="h-4 w-4 text-amber-400" />
                <span>History Archive ({tournaments.length})</span>
              </button>
            </div>

            {/* Live Tourneys Indicator */}
            <div className="flex items-center gap-2">
              {liveCount > 0 ? (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 px-3 py-1 text-[11px] font-bold text-emerald-400 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{liveCount} Tournament{liveCount === 1 ? '' : 's'} Active</span>
                </span>
              ) : (
                <span className="text-xs text-neutral-500 font-medium">
                  All tournaments concluded
                </span>
              )}
            </div>
          </div>
        ) : (
          /* INSIDE TOURNAMENT WORKSPACE */
          <>
            <div className="flex items-center gap-2 shrink-0">
              {/* Matches List */}
              <div className="flex items-center gap-1.5 pr-2 border-r border-neutral-800/80">
                {matches.map((m) => {
                  const isActive = currentTab === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setCurrentTab(m.id)}
                      className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                        isActive
                          ? 'bg-red-950/90 text-red-300 border border-red-700/70 shadow-sm'
                          : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                      }`}
                    >
                      {m.isCompleted ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Circle className="h-3 w-3 text-amber-500 animate-pulse" />
                      )}
                      <span>M{m.matchNumber}</span>
                    </button>
                  );
                })}

                {/* Add Match Button */}
                {canAddMatch && (
                  <button
                    type="button"
                    onClick={() => createMatch()}
                    title="Add new match to tournament"
                    className="flex shrink-0 items-center gap-1 rounded-xl border border-dashed border-neutral-700 hover:border-red-600 bg-neutral-900/60 px-2.5 py-1.5 text-xs font-bold text-neutral-400 hover:text-white transition-all"
                  >
                    <Plus className="h-3.5 w-3.5 text-red-400" />
                    <span>Match</span>
                  </button>
                )}
              </div>

              {/* Results / Standing Poster Tab */}
              <button
                type="button"
                onClick={() => setCurrentTab('results')}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-display font-black uppercase tracking-wider transition-all ${
                  currentTab === 'results'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-sm'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-amber-300'
                }`}
              >
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                <span>4K Standing Graphic</span>
              </button>

              {/* Edit Squads Tab */}
              <button
                type="button"
                onClick={() => setCurrentTab('edit')}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                  currentTab === 'edit'
                    ? 'bg-neutral-800 text-white border border-neutral-700'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                }`}
              >
                <Settings className="h-3.5 w-3.5 text-neutral-400" />
                <span>Edit Squads</span>
              </button>
            </div>

            {/* Conclude or Reopen Trigger */}
            <div className="flex items-center gap-2 shrink-0">
              {standings.tournamentConcluded ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-400">
                    <Crown className="h-3.5 w-3.5" />
                    <span>
                      {teams.find((t) => t.id === standings.championTeamId)?.name || 'CHAMPION'}{' '}
                      WINS
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={reopenTournament}
                    className="flex items-center gap-1 rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reopen</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={endTournament}
                  className="flex items-center gap-1.5 rounded-xl border border-red-900/60 bg-red-950/30 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-900/50 transition-colors"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Conclude Tournament</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
