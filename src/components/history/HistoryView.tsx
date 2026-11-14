import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  Crown,
  Play,
  Search,
  Image as ImageIcon,
  Calendar,
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
  const [filterMode, setFilterMode] = useState<'ALL' | 'ACTIVE' | 'ENDED'>(
    'ALL'
  );
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
    <div className="space-y-5 select-none">
      {/* Borderless Action Intro Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-slate-300/90">
          Open past scorecards, track winners, or export tournament graphics.
        </p>

        <button
          type="button"
          onClick={() => setCurrentTab('create')}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-950 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Tournament</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      {tournaments.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tournament, stage, or winner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-full rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="glass-panel inline-flex rounded-xl p-1">
            {(['ALL', 'ACTIVE', 'ENDED'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterMode(mode)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filterMode === mode
                    ? 'bg-white/[0.12] text-white'
                    : 'text-slate-400 hover:text-slate-200'
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

      {/* List */}
      {tournaments.length === 0 ? (
        <div className="glass-panel rounded-2xl border-dashed p-12 text-center space-y-3">
          <div className="text-sm font-semibold text-slate-200">
            No saved tournaments yet
          </div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Create your first Classic Scrim or Champion Rush event to track matches and export standings posters.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setCurrentTab('create')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-semibold text-zinc-950 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Tournament</span>
            </button>
          </div>
        </div>
      ) : filteredTournaments.length > 0 ? (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredTournaments.map((t) => {
            const completedCount = t.matches.filter((m) => m.isCompleted).length;
            const isCurrentActive = activeTournamentId === t.id;
            const dateLabel = new Date(t.createdAt).toLocaleDateString();

            return (
              <div
                key={t.id}
                className={`glass-panel rounded-2xl p-5 transition-colors ${
                  isCurrentActive
                    ? 'border-amber-500/40'
                    : 'hover:border-white/[0.18]'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="glass-tile rounded-md px-2 py-0.5 text-[11px] font-medium text-slate-300">
                        {t.settings.mode === 'CHAMPION_RUSH'
                          ? 'Champion Rush'
                          : 'Classic Scrim'}
                      </span>

                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                          t.isEnded
                            ? 'bg-white/[0.08] text-slate-300'
                            : 'bg-emerald-500/15 text-emerald-300'
                        }`}
                      >
                        {t.isEnded ? 'Concluded' : 'Active'}
                      </span>

                      {isCurrentActive && (
                        <span className="glass-accent rounded-md px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                          Loaded
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="h-3 w-3" />
                        {dateLabel}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                      {t.settings.name}
                    </h2>

                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
                      <span>{t.settings.roundOrDay || 'Main Stage'}</span>
                      <span>·</span>
                      <span>
                        {completedCount} of {t.matches.length} matches scored
                      </span>
                      {t.championTeamName && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
                            <Crown className="h-3.5 w-3.5" />
                            Winner: {t.championTeamName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        switchActiveTournament(t.id);
                        setCurrentTab(t.matches[0]?.id || 'results');
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-semibold text-zinc-950 transition-colors"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Open Matches</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        switchActiveTournament(t.id);
                        setCurrentTab('results');
                      }}
                      className="glass-pill inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-amber-400" />
                      <span>Poster</span>
                    </button>

                    {confirmDeleteId === t.id ? (
                      <div className="inline-flex items-center gap-1 rounded-xl border border-rose-500/40 bg-rose-500/15 p-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id)}
                          className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-500"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-lg px-2 py-1 text-xs text-slate-300 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(t.id)}
                        className="glass-pill flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:border-rose-500/40 hover:bg-rose-500/15 hover:text-rose-300 transition-colors"
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
        <div className="glass-panel rounded-2xl border-dashed p-10 text-center text-xs text-slate-400">
          No tournaments found matching your filter.
        </div>
      )}
    </div>
  );
};
