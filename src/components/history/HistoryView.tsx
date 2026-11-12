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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white">
            Tournament History
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 font-medium mt-0.5">
            Saved tournaments, scorecards, and standing graphics.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCurrentTab('create')}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Tournament</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      {tournaments.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search tournaments or teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
            />
          </div>

          <div className="flex items-center gap-1">
            {(['ALL', 'ACTIVE', 'ENDED'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterMode(mode)}
                className={`rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  filterMode === mode
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {mode === 'ALL'
                  ? `All (${tournaments.length})`
                  : mode === 'ACTIVE'
                  ? 'Active'
                  : 'Ended'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tournaments List */}
      {filteredTournaments.length > 0 ? (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredTournaments.map((t) => {
            const completedCount = t.matches.filter((m) => m.isCompleted).length;
            const isCurrentActive = activeTournamentId === t.id;

            return (
              <div
                key={t.id}
                className={`rounded-xl border p-5 transition-colors shadow-sm ${
                  isCurrentActive
                    ? 'border-neutral-700 bg-[#141722]'
                    : 'border-neutral-800 bg-[#11131A] hover:bg-[#141722]'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left: Tournament Details */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-300">
                        {t.settings.mode === 'CHAMPION_RUSH' ? 'Champion Rush' : 'Classic Scrim'}
                      </span>

                      {t.isEnded ? (
                        <span className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                          Ended
                        </span>
                      ) : (
                        <span className="rounded bg-emerald-950/40 border border-emerald-900/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                          Active
                        </span>
                      )}

                      <span className="text-xs text-neutral-400 font-medium">
                        {completedCount} of {t.matches.length} matches completed
                      </span>
                    </div>

                    <h2 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wide text-white truncate">
                      {t.name}
                    </h2>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 font-medium">
                      <span>{t.settings.roundOrDay}</span>
                      {t.championTeamName && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <Crown className="h-3 w-3" />
                            Winner: {t.championTeamName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        switchActiveTournament(t.id);
                        setCurrentTab(t.matches[0]?.id || 'results');
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition-colors"
                    >
                      <Play className="h-3.5 w-3.5 fill-white" />
                      <span>Open</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        switchActiveTournament(t.id);
                        setCurrentTab('results');
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-200 transition-colors"
                    >
                      <Trophy className="h-3.5 w-3.5 text-amber-400" />
                      <span>Graphic</span>
                    </button>

                    {confirmDeleteId === t.id ? (
                      <div className="flex items-center gap-1 rounded-lg border border-red-900 bg-red-950/60 p-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id)}
                          className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white hover:bg-red-500"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded px-2 py-0.5 text-xs font-medium text-neutral-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(t.id)}
                        className="rounded p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
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
        <div className="rounded-xl border border-dashed border-neutral-800 bg-[#11131A]/40 p-8 text-center text-xs text-neutral-500 font-medium">
          No tournaments found matching your search.
        </div>
      )}
    </div>
  );
};
