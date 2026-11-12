import React from 'react';
import {
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
  } = useTournamentStore();

  const isInsideTournament =
    currentTab !== 'home' && currentTab !== 'create' && currentTab !== 'history';

  // If outside a tournament (Home / Create / History), don't show the duplicate tab strip at all!
  // The Homepage action cards and Header handle navigation cleanly.
  if (!isInsideTournament) {
    return null;
  }

  const standings = getStandings();

  const maxMatchesReached =
    settings.mode === 'CHAMPION_RUSH'
      ? matches.length >= settings.championRush.maxMatches
      : matches.length >= settings.totalMatchesPlanned;

  const canAddMatch = !standings.tournamentConcluded && !maxMatchesReached;

  return (
    <div className="border-b border-neutral-800 bg-[#121215] px-4 sm:px-6 select-none sticky top-0 z-20 shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 overflow-x-auto py-2 scrollbar-thin">
        {/* Inside tournament workspace: Clean single row of Match Tabs + Standings Graphic */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Matches List */}
          <div className="flex items-center gap-1.5 pr-2 border-r border-neutral-800">
            {matches.map((m) => {
              const isActive = currentTab === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setCurrentTab(m.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
                      : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                  }`}
                >
                  {m.isCompleted ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Circle className="h-2.5 w-2.5 text-amber-500 fill-amber-500/20" />
                  )}
                  <span>Match {m.matchNumber}</span>
                </button>
              );
            })}

            {/* Quick Add Match Button */}
            {canAddMatch && (
              <button
                type="button"
                onClick={() => createMatch()}
                title="Add next match"
                className="flex shrink-0 items-center gap-1 rounded-lg border border-dashed border-neutral-700 hover:border-neutral-500 bg-neutral-900/60 px-2.5 py-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Match</span>
              </button>
            )}
          </div>

          {/* Results / Standing Poster Tab */}
          <button
            type="button"
            onClick={() => setCurrentTab('results')}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
              currentTab === 'results'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/40 shadow-sm'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-amber-300'
            }`}
          >
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span>Standing Graphic</span>
          </button>

          {/* Edit Squads Tab */}
          <button
            type="button"
            onClick={() => setCurrentTab('edit')}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              currentTab === 'edit'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
            }`}
          >
            <Settings className="h-3.5 w-3.5 text-neutral-400" />
            <span>Squads</span>
          </button>
        </div>

        {/* Right: Conclude or Reopen Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          {standings.tournamentConcluded ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-xs font-bold text-amber-400">
                <Crown className="h-3.5 w-3.5" />
                <span>
                  {teams.find((t) => t.id === standings.championTeamId)?.name || 'CHAMPION'} WINS
                </span>
              </span>

              <button
                type="button"
                onClick={reopenTournament}
                className="flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reopen</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={endTournament}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs font-semibold text-neutral-400 hover:text-red-400 hover:border-red-900/60 transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Conclude</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
