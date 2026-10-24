import React, { useState } from 'react';
import {
  Trophy,
  Calendar,
  Trash2,
  Plus,
  Crown,
  Play,
  Flame,
  Settings,
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

  const handleOpen = (id: string, tab: 'matches' | 'results') => {
    switchActiveTournament(id);
    if (tab === 'results') {
      setCurrentTab('results');
    }
  };

  const handleDelete = (id: string) => {
    deleteTournament(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border border-neutral-800 bg-[#14080A] p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-red-500" />
            <h1 className="font-display text-3xl tracking-wider text-white uppercase font-black">
              TOURNAMENT HISTORY ARCHIVE
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            All created tournaments saved with independent date, time, squads, and results.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentTab('create')}
            className="flex items-center gap-1.5 rounded bg-red-700 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-600 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create Tournament</span>
          </button>

          {tournaments.length === 0 && (
            <button
              type="button"
              onClick={loadFullDemoTournament}
              className="flex items-center gap-1.5 rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800"
            >
              <Flame className="h-3.5 w-3.5 text-red-400" />
              <span>Load Sample Tournament</span>
            </button>
          )}
        </div>
      </div>

      {/* Tournaments List */}
      {tournaments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-800 bg-[#12070A] py-16 text-center space-y-3">
          <Trophy className="mx-auto h-12 w-12 text-neutral-600" />
          <h3 className="font-display text-xl text-neutral-300">NO TOURNAMENTS CREATED YET</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Click &quot;Create Tournament&quot; above to launch your first Free Fire tournament with date, time, and custom squads.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setCurrentTab('create')}
              className="rounded bg-red-700 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-600"
            >
              Create Tournament Now
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tournaments.map((t) => {
            const isActive = t.id === activeTournamentId;
            const completedMatches = t.matches.filter((m) => m.isCompleted).length;

            return (
              <div
                key={t.id}
                className={`relative rounded-lg border p-5 transition-all shadow-md flex flex-col justify-between ${
                  isActive
                    ? 'border-red-600/80 bg-[#160B0E] ring-1 ring-red-600/30'
                    : 'border-neutral-800 bg-[#14080A] hover:border-neutral-700'
                }`}
              >
                <div>
                  {/* Top Meta */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                      <Calendar className="h-3.5 w-3.5 text-red-500" />
                      <span>{t.createdAt}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-neutral-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border border-neutral-800">
                        {t.settings.mode}
                      </span>

                      {t.isEnded ? (
                        <span className="flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40">
                          <Crown className="h-3 w-3" />
                          <span>ENDED</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-800/40">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>ACTIVE</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-2xl tracking-wider text-white uppercase font-black mb-1 truncate">
                    {t.name}
                  </h3>

                  <div className="text-xs text-neutral-400 mb-4">
                    {t.settings.roundOrDay} • {t.teams.length} Squads • {completedMatches} of {t.matches.length} Matches Played
                  </div>

                  {/* Winner Banner if ended */}
                  {t.isEnded && t.championTeamName && (
                    <div className="mb-4 rounded border border-amber-600/40 bg-amber-950/20 px-3 py-2 flex items-center justify-between text-xs">
                      <span className="text-neutral-300 flex items-center gap-1.5">
                        <Crown className="h-4 w-4 text-amber-400" />
                        <span>Winner:</span>
                        <strong className="text-white font-bold">{t.championTeamName}</strong>
                      </span>
                      {t.championScore !== undefined && (
                        <span className="font-numbers font-black text-amber-400">
                          {t.championScore} PTS
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions Bar */}
                <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpen(t.id, 'matches')}
                      className={`flex items-center gap-1.5 rounded px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                        isActive
                          ? 'bg-red-700 text-white hover:bg-red-600'
                          : 'bg-neutral-900 border border-neutral-700 text-neutral-200 hover:bg-neutral-800'
                      }`}
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>{isActive ? 'Continue' : 'Open'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpen(t.id, 'results')}
                      className="flex items-center gap-1.5 rounded border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800"
                    >
                      <Trophy className="h-3.5 w-3.5 text-amber-400" />
                      <span>Graphic</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        switchActiveTournament(t.id, 'edit');
                      }}
                      className="flex items-center gap-1.5 rounded border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                      title="Edit tournament settings, squads & logos"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>

                  {/* Delete with confirmation */}
                  {confirmDeleteId === t.id ? (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-[11px] text-red-400">Sure?</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        className="rounded bg-red-700 px-2 py-1 text-[11px] font-bold text-white hover:bg-red-600"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded bg-neutral-800 px-2 py-1 text-[11px] text-neutral-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(t.id)}
                      title="Delete tournament"
                      className="rounded p-1.5 text-neutral-500 hover:bg-red-950/60 hover:text-red-400 transition-colors"
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
