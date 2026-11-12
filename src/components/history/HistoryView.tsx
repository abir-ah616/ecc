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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Tournament Archive
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Saved scrims and competitions with full match scorecards and standing posters.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCurrentTab('create')}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-white transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Tournament</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      {tournaments.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search tournaments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-zinc-900/90 pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="flex items-center gap-1">
            {(['ALL', 'ACTIVE', 'ENDED'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterMode(mode)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  filterMode === mode
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {mode === 'ALL' ? `All (${tournaments.length})` : mode}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tournaments List */}
      {tournaments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#111114] py-16 text-center space-y-3">
          <Trophy className="mx-auto h-8 w-8 text-zinc-600" />
          <h3 className="text-base font-semibold text-white">
            No Tournaments in Archive
          </h3>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            Tournaments you launch will be automatically preserved here.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setCurrentTab('create')}
              className="rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-white"
            >
              Launch Tournament
            </button>
          </div>
        </div>
      ) : filteredTournaments.length === 0 ? (
        <div className="rounded-xl border border-white/[0.08] bg-[#111114] py-10 text-center text-xs text-zinc-400">
          No tournaments match your search filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredTournaments.map((t) => {
            const isActive = t.id === activeTournamentId;
            const completedMatches = t.matches.filter((m) => m.isCompleted).length;

            return (
              <div
                key={t.id}
                className={`rounded-2xl border p-5 transition-all shadow-md flex flex-col justify-between ${
                  isActive
                    ? 'border-zinc-500 bg-[#141418]'
                    : 'border-white/[0.08] bg-[#111114] hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                    <span>{t.createdAt}</span>
                    <span className="rounded bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                      {t.settings.mode === 'CHAMPION_RUSH' ? 'Champion Rush' : 'Classic Scrim'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white truncate">
                    {t.name}
                  </h3>

                  <p className="text-xs text-zinc-400 mt-1 mb-4">
                    {t.settings.roundOrDay} • {t.teams.length} Squads • {completedMatches}/{t.matches.length} Matches Concluded
                  </p>

                  {t.isEnded && t.championTeamName && (
                    <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/05 p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-400" />
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-amber-400 block">
                            Winner
                          </span>
                          <strong className="text-white text-xs">{t.championTeamName}</strong>
                        </div>
                      </div>
                      {t.championScore !== undefined && (
                        <span className="font-mono font-bold text-amber-400">
                          {t.championScore} PTS
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        switchActiveTournament(t.id);
                        setCurrentTab('results');
                      }}
                      className="rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                    >
                      <Trophy className="h-3.5 w-3.5 text-amber-400" />
                      <span>Poster</span>
                    </button>

                    {!t.isEnded && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextMatch =
                            t.matches.find((m) => !m.isCompleted) ||
                            t.matches[t.matches.length - 1];
                          switchActiveTournament(t.id, nextMatch?.id || 'results');
                        }}
                        className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-white transition-colors flex items-center gap-1.5"
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span>Resume</span>
                      </button>
                    )}
                  </div>

                  {confirmDeleteId === t.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        className="rounded px-2 py-1 text-xs font-semibold text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded px-2 py-1 text-xs text-zinc-500 hover:text-zinc-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(t.id)}
                      title="Delete tournament"
                      className="text-zinc-600 hover:text-red-400 p-1.5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
