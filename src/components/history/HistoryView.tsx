import React, { useState } from 'react';
import {
  Trophy,
  Calendar,
  Trash2,
  Plus,
  Crown,
  Play,
  Flame,
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
    loadFullDemoTournament,
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-[#161017] via-[#0F0C12] to-[#0A080C] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-red-500" />
              <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-wider text-white">
                Tournament History Archive
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              All created scrims and championships saved with individual match scores and final results.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setCurrentTab('create')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-display font-black uppercase tracking-wider text-white hover:bg-red-500 transition-colors shadow-md"
            >
              <Plus className="h-4 w-4" />
              <span>New Tournament</span>
            </button>

            {tournaments.length === 0 && (
              <button
                type="button"
                onClick={loadFullDemoTournament}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800"
              >
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                <span>Load Sample Demo</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        {tournaments.length > 0 && (
          <div className="mt-6 pt-5 border-t border-neutral-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search tournaments by name or champion..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950/70 pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {(['ALL', 'ACTIVE', 'ENDED'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilterMode(mode)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    filterMode === mode
                      ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                      : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                  }`}
                >
                  {mode === 'ALL' ? `All (${tournaments.length})` : mode}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tournaments Grid */}
      {tournaments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-800 bg-[#120D12] py-16 text-center space-y-4">
          <Trophy className="mx-auto h-12 w-12 text-neutral-600" />
          <h3 className="font-display text-2xl text-neutral-300 font-black uppercase">
            No Tournaments Created Yet
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
            Click &quot;New Tournament&quot; above to launch your first Free Fire tournament with custom date, time, and squad logos.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setCurrentTab('create')}
              className="rounded-xl bg-red-600 px-6 py-3 text-xs font-display font-black uppercase tracking-wider text-white hover:bg-red-500 shadow-lg shadow-red-950/60"
            >
              Create Tournament Now
            </button>
          </div>
        </div>
      ) : filteredTournaments.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800 bg-[#120D12] py-12 text-center text-xs text-neutral-400">
          No tournaments match the selected filter or search query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTournaments.map((t) => {
            const isActive = t.id === activeTournamentId;
            const completedMatches = t.matches.filter((m) => m.isCompleted).length;

            return (
              <div
                key={t.id}
                className={`relative rounded-2xl border p-5 sm:p-6 transition-all shadow-md flex flex-col justify-between ${
                  isActive
                    ? 'border-red-600/80 bg-[#150E14] ring-1 ring-red-600/40'
                    : 'border-neutral-800 bg-[#120D12] hover:border-neutral-700'
                }`}
              >
                <div>
                  {/* Top Header Row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                      <span>{t.createdAt}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-neutral-900 border border-neutral-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-300">
                        {t.settings.mode}
                      </span>

                      {t.isEnded ? (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                          <Crown className="h-3 w-3" />
                          <span>ENDED</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-800/50">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>LIVE</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-display text-2xl font-black tracking-wider text-white uppercase mb-1 truncate">
                    {t.name}
                  </h3>

                  <p className="text-xs text-neutral-400 mb-4">
                    {t.settings.roundOrDay} • {t.teams.length} Squads • {completedMatches} of{' '}
                    {t.matches.length} Matches Concluded
                  </p>

                  {/* Champion Banner if ended */}
                  {t.isEnded && t.championTeamName && (
                    <div className="mb-4 rounded-xl border border-amber-600/40 bg-amber-950/20 p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                          <Crown className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-amber-400">
                            Tournament Champion
                          </span>
                          <strong className="text-white font-bold text-sm">
                            {t.championTeamName}
                          </strong>
                        </div>
                      </div>
                      {t.championScore !== undefined && (
                        <span className="font-numbers font-black text-amber-400 text-sm">
                          {t.championScore} PTS
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Actions Toolbar */}
                <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        switchActiveTournament(t.id);
                        setCurrentTab('results');
                      }}
                      className="rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-neutral-200 hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
                    >
                      <Trophy className="h-3.5 w-3.5 text-amber-400" />
                      <span>Graphic</span>
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
                        className="rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-500 transition-colors flex items-center gap-1.5"
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span>Resume Scoring</span>
                      </button>
                    )}
                  </div>

                  {confirmDeleteId === t.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-500"
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-lg border border-neutral-700 px-2 py-1 text-xs text-neutral-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(t.id)}
                      title="Delete tournament"
                      className="rounded-lg border border-neutral-800 p-2 text-neutral-500 hover:border-red-900/60 hover:bg-red-950/40 hover:text-red-400 transition-colors"
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
