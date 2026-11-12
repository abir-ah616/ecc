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
    <div className="border-b border-white/10 bg-[#0E111B]/95 backdrop-blur-xl px-4 sm:px-6 select-none sticky top-20 z-30 shadow-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 overflow-x-auto py-2.5 scrollbar-thin">
        {/* Match Navigation Tabs + Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Matches List */}
          <div className="flex items-center gap-2 pr-3 border-r border-white/15">
            {matches.map((m) => {
              const isActive = currentTab === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setCurrentTab(m.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-black uppercase tracking-wider transition-all active:scale-95 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 text-amber-300 border border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                      : 'text-neutral-400 hover:bg-white/5 hover:text-white border border-transparent'
                  }`}
                >
                  {m.isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Circle className="h-3 w-3 text-amber-400 fill-amber-400/20" />
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
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-dashed border-white/25 hover:border-amber-400/60 bg-white/5 hover:bg-amber-500/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-neutral-300 hover:text-amber-300 transition-all active:scale-95"
              >
                <Plus className="h-4 w-4 text-amber-400" />
                <span>+ MATCH</span>
              </button>
            )}
          </div>

          {/* Results / Standing Poster Tab */}
          <button
            type="button"
            onClick={() => setCurrentTab('results')}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-black uppercase tracking-wider transition-all active:scale-95 ${
              currentTab === 'results'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-amber-400'
                : 'text-neutral-300 hover:bg-white/10 hover:text-amber-300 border border-white/10'
            }`}
          >
            <Trophy className={`h-4 w-4 ${currentTab === 'results' ? 'text-black' : 'text-amber-400'}`} />
            <span>STANDINGS GRAPHIC</span>
          </button>

          {/* Edit Squads Tab */}
          <button
            type="button"
            onClick={() => setCurrentTab('edit')}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all active:scale-95 ${
              currentTab === 'edit'
                ? 'bg-white/15 text-white border border-white/30 shadow-md'
                : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200 border border-transparent'
            }`}
          >
            <Settings className="h-4 w-4 text-neutral-400" />
            <span>SQUADS &amp; SETTINGS</span>
          </button>
        </div>

        {/* Right: Conclude or Reopen Trigger */}
        <div className="flex items-center gap-2.5 shrink-0">
          {standings.tournamentConcluded ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <Crown className="h-4 w-4 text-amber-400" />
                <span>
                  {teams.find((t) => t.id === standings.championTeamId)?.name || 'CHAMPION'} WINS
                </span>
              </span>

              <button
                type="button"
                onClick={reopenTournament}
                className="flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:bg-white/15 hover:text-white transition-all active:scale-95"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>REOPEN</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={endTournament}
              className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-950/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-400 hover:border-red-500/60 transition-all active:scale-95"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>CONCLUDE TOURNAMENT</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
