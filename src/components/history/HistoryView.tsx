import React, { useState } from 'react';
import {
  Trophy,
  Trash2,
  Plus,
  Crown,
  Play,
  Search,
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';

export const HistoryView: React.FC = () => {
  const {
    tournaments,
    activeTournamentId,
    switchActiveTournament,
    deleteTournament,
    setCurrentTab,
  } = useTournamentStore();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'ACTIVE' | 'ENDED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTournaments = tournaments.filter((t) => {
    if (filterMode === 'ACTIVE' && t.isEnded) return false;
    if (filterMode === 'ENDED' && !t.isEnded) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.settings.roundOrDay.toLowerCase().includes(q) ||
        (t.championTeamName && t.championTeamName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleDelete = (id: string) => {
    deleteTournament(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8 select-none animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06B6D4]" />
            <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-wider text-white">
              BATTLE LOGS &amp; ARCHIVE VAULT
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-neutral-400 mt-1">
            Historical tournaments, match scorecards, and high-resolution standing graphics.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCurrentTab('create')}
          className="self-start sm:self-auto flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:brightness-110 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>NEW TOURNAMENT</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      {tournaments.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="SEARCH TOURNAMENTS OR SQUADS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/50 pl-10 pr-4 py-3 text-xs sm:text-sm font-bold text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 shadow-inner"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10">
            {(['ALL', 'ACTIVE', 'ENDED'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterMode(mode)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-black uppercase tracking-wider transition-all ${
                  filterMode === mode
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {mode === 'ALL'
                  ? `ALL (${tournaments.length})`
                  : mode === 'ACTIVE'
                  ? 'ACTIVE'
                  : 'CONCLUDED'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tournaments List */}
      {filteredTournaments.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredTournaments.map((t) => {
            const completedCount = t.matches.filter((m) => m.isCompleted).length;
            const isCurrentActive = activeTournamentId === t.id;

            return (
              <div
                key={t.id}
                className={`rounded-2xl border p-5 sm:p-6 transition-all shadow-xl ${
                  isCurrentActive
                    ? 'border-amber-400/60 bg-gradient-to-r from-[#171A27] to-[#10131E] shadow-[0_0_30px_rgba(245,158,11,0.15)]'
                    : 'border-white/10 bg-[#121522] hover:border-white/20'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  {/* Left: Tournament Identity */}
                  <div className="space-y-2.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                          t.settings.mode === 'CHAMPION_RUSH'
                            ? 'bg-purple-950/80 border-purple-500/50 text-purple-300'
                            : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                        }`}
                      >
                        {t.settings.mode === 'CHAMPION_RUSH' ? 'Champion Rush' : 'Classic Scrim'}
                      </span>

                      {t.isEnded ? (
                        <span className="rounded-md bg-neutral-800 border border-neutral-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-300">
                          CONCLUDED
                        </span>
                      ) : (
                        <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>LIVE IN PROGRESS</span>
                        </span>
                      )}

                      <span className="text-xs font-semibold text-neutral-400">
                        {completedCount}/{t.matches.length} Matches Recorded
                      </span>
                    </div>

                    <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-wider text-white truncate">
                      {t.name}
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-neutral-400">
                      <span>STAGE: <strong className="text-white">{t.settings.roundOrDay}</strong></span>
                      <span>•</span>
                      <span>HOST: <strong className="text-white">{t.settings.hostName}</strong></span>
                      {t.championTeamName && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <Crown className="h-3.5 w-3.5" />
                            CHAMPION: {t.championTeamName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        switchActiveTournament(t.id);
                        setCurrentTab(t.matches[0]?.id || 'results');
                      }}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-4 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-md hover:brightness-110 active:scale-95 transition-all"
                    >
                      <Play className="h-4 w-4 fill-black" />
                      <span>OPEN CONSOLE</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        switchActiveTournament(t.id);
                        setCurrentTab('results');
                      }}
                      className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white transition-all active:scale-95"
                    >
                      <Trophy className="h-4 w-4 text-amber-400" />
                      <span>STANDINGS</span>
                    </button>

                    {confirmDeleteId === t.id ? (
                      <div className="flex items-center gap-1 rounded-xl border border-red-500/50 bg-red-950/40 p-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id)}
                          className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-500"
                        >
                          CONFIRM
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-neutral-400 hover:text-white"
                        >
                          NO
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(t.id)}
                        className="rounded-xl border border-white/10 bg-white/5 p-2 text-neutral-400 hover:text-red-400 hover:border-red-500/40 transition-colors"
                        title="Delete tournament"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/20 p-12 text-center">
          <Trophy className="h-10 w-10 text-neutral-500 mb-3" />
          <p className="text-sm font-bold uppercase tracking-wider text-neutral-300">
            NO TOURNAMENTS MATCH SEARCH CRITERIA
          </p>
        </div>
      )}
    </div>
  );
};
