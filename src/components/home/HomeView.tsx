import React, { useState } from 'react';
import {
  Trophy,
  Play,
  CheckCircle2,
  Plus,
  Sliders,
  Crown,
  History,
  X,
  ArrowRight,
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
import { calculateTournamentStandings } from '../../lib/scoring';

export const HomeView: React.FC = () => {
  const {
    tournaments,
    switchActiveTournament,
    setCurrentTab,
    endTournamentById,
    defaultPointSystem,
    updateDefaultPointSystem,
  } = useTournamentStore();

  const [isPointModalOpen, setIsPointModalOpen] = useState(false);

  const liveTournaments = tournaments.filter((t) => !t.isEnded);

  const applyOfficialPreset = () => {
    updateDefaultPointSystem({
      killPoints: 1,
      placementPoints: [12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0],
    });
  };

  const applyClassicPreset = () => {
    updateDefaultPointSystem({
      killPoints: 1,
      placementPoints: [20, 17, 15, 13, 12, 10, 6, 4, 3, 2, 1, 0, 0, 0, 0],
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8 select-none">
      {/* Top Banner */}
      <div className="rounded-xl border border-neutral-800 bg-[#11131A] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-sm">
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-wide text-white uppercase">
            Free Fire Tournament Point Table
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 font-medium max-w-xl">
            Live match scoring, Champion Rush point tracking, and high-resolution standing graphics.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCurrentTab('create')}
          className="self-start sm:self-auto flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-500 px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-white transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Create Tournament</span>
        </button>
      </div>

      {/* 3 Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Create Tournament */}
        <div
          onClick={() => setCurrentTab('create')}
          className="cursor-pointer rounded-xl border border-neutral-800 bg-[#11131A] hover:bg-[#151821] hover:border-neutral-700 p-6 flex flex-col justify-between transition-colors shadow-sm"
        >
          <div className="space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-amber-400">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-white uppercase tracking-wide">
                Create Tournament
              </h2>
              <p className="mt-1 text-xs text-neutral-400 leading-normal">
                Start a new tournament with Classic Scrim or Champion Rush format, and configure team rosters.
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between pt-4 border-t border-neutral-800/80 text-xs font-semibold text-neutral-300">
            <span>New Tournament</span>
            <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
          </div>
        </div>

        {/* Card 2: Tournament History */}
        <div
          onClick={() => setCurrentTab('history')}
          className="cursor-pointer rounded-xl border border-neutral-800 bg-[#11131A] hover:bg-[#151821] hover:border-neutral-700 p-6 flex flex-col justify-between transition-colors shadow-sm"
        >
          <div className="space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-cyan-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-white uppercase tracking-wide">
                Tournament History
              </h2>
              <p className="mt-1 text-xs text-neutral-400 leading-normal">
                Browse and view saved tournaments, match scorecards, and standing graphics.
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between pt-4 border-t border-neutral-800/80 text-xs font-semibold text-neutral-300">
            <span>View History ({tournaments.length})</span>
            <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
          </div>
        </div>

        {/* Card 3: Point System */}
        <div
          onClick={() => setIsPointModalOpen(true)}
          className="cursor-pointer rounded-xl border border-neutral-800 bg-[#11131A] hover:bg-[#151821] hover:border-neutral-700 p-6 flex flex-col justify-between transition-colors shadow-sm"
        >
          <div className="space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-purple-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-white uppercase tracking-wide">
                Point System
              </h2>
              <p className="mt-1 text-xs text-neutral-400 leading-normal">
                Check and configure placement points (#1={defaultPointSystem.placementPoints[0]} pts) and kill points ({defaultPointSystem.killPoints} pt/kill).
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between pt-4 border-t border-neutral-800/80 text-xs font-semibold text-neutral-300">
            <span>Scoring Rules</span>
            <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
          </div>
        </div>
      </div>

      {/* Live Tournaments Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-white">
              Live Tournaments ({liveTournaments.length})
            </h2>
          </div>
        </div>

        {liveTournaments.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {liveTournaments.map((t) => {
              const standings = calculateTournamentStandings(t.teams, t.matches, t.settings);
              const leader = standings.standings[0];
              const completedMatches = t.matches.filter((m) => m.isCompleted);
              const pendingMatch = t.matches.find((m) => !m.isCompleted);
              const currentMatch = pendingMatch || t.matches[t.matches.length - 1];

              return (
                <div
                  key={t.id}
                  className="rounded-xl border border-neutral-800 bg-[#11131A] p-5 sm:p-6 shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    {/* Left: Tournament Details */}
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-300">
                          {t.settings.mode === 'CHAMPION_RUSH' ? 'Champion Rush' : 'Classic Scrim'}
                        </span>
                        <span className="rounded bg-emerald-950/40 border border-emerald-900/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                          {completedMatches.length} of {t.matches.length} matches completed
                        </span>
                        <span className="text-xs text-neutral-500 font-medium">
                          {t.teams.length} Teams
                        </span>
                      </div>

                      <h3 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wide text-white truncate">
                        {t.settings.name}
                      </h3>

                      {leader && (
                        <div className="flex items-center gap-2 text-xs text-neutral-300 font-medium">
                          <Crown className="h-3.5 w-3.5 text-amber-400" />
                          <span className="text-neutral-400">1st Place:</span>
                          <strong className="text-white font-bold">{leader.teamName}</strong>
                          <span className="text-amber-400 font-bold font-numbers">
                            {leader.totalPoints} pts
                          </span>
                          <span className="text-neutral-500 font-numbers">
                            ({leader.kills} kills • {leader.booyahCount} booyah)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      {currentMatch && (
                        <button
                          type="button"
                          onClick={() => {
                            switchActiveTournament(t.id);
                            setCurrentTab(currentMatch.id);
                          }}
                          className="flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors"
                        >
                          <Play className="h-3.5 w-3.5 fill-white" />
                          <span>Score Match {currentMatch.matchNumber}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          switchActiveTournament(t.id);
                          setCurrentTab('results');
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-200 transition-colors"
                      >
                        <Trophy className="h-3.5 w-3.5 text-amber-400" />
                        <span>Standing Graphic</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => endTournamentById(t.id)}
                        className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 hover:border-red-900/60 hover:text-red-400 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 transition-colors"
                        title="End tournament"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>End</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-800 bg-[#11131A]/40 p-8 text-center space-y-2">
            <p className="text-xs sm:text-sm text-neutral-400 font-medium">
              No active tournaments in progress.
            </p>
            <button
              type="button"
              onClick={() => setCurrentTab('create')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 px-4 py-2 text-xs font-semibold text-white transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Tournament</span>
            </button>
          </div>
        )}
      </div>

      {/* Point Rules Configuration Modal */}
      {isPointModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-xl border border-neutral-800 bg-[#11131A] p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-display text-xl font-bold text-white uppercase tracking-wide">
                Scoring Rules
              </h3>
              <button
                type="button"
                onClick={() => setIsPointModalOpen(false)}
                className="rounded p-1 text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 pt-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Presets
                </label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={applyOfficialPreset}
                    className="rounded-lg border border-neutral-700 bg-neutral-900 p-3 text-left hover:bg-neutral-800 transition-colors"
                  >
                    <span className="text-xs font-bold text-white block">
                      Official 12-Point
                    </span>
                    <span className="text-[11px] text-neutral-400 mt-0.5 block">
                      12, 9, 8, 7, 6, 5, 4, 3, 2, 1
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={applyClassicPreset}
                    className="rounded-lg border border-neutral-700 bg-neutral-900 p-3 text-left hover:bg-neutral-800 transition-colors"
                  >
                    <span className="text-xs font-bold text-white block">
                      Classic 20-Point
                    </span>
                    <span className="text-[11px] text-neutral-400 mt-0.5 block">
                      20, 17, 15, 13, 12, 10, 6, 4, 3, 2, 1
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Points Per Kill
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={defaultPointSystem.killPoints}
                  onChange={(e) =>
                    updateDefaultPointSystem({
                      killPoints: Math.max(0, parseInt(e.target.value, 10) || 0),
                    })
                  }
                  className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Placement Points (1st - 12th)
                </label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {defaultPointSystem.placementPoints.slice(0, 12).map((pts, idx) => (
                    <div
                      key={idx}
                      className="flex items-center rounded border border-neutral-800 bg-neutral-900 px-2.5 py-1.5"
                    >
                      <span className="w-8 text-[11px] text-neutral-400">#{idx + 1}</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={pts}
                        onChange={(e) => {
                          const newPts = [...defaultPointSystem.placementPoints];
                          newPts[idx] = Math.max(0, parseInt(e.target.value, 10) || 0);
                          updateDefaultPointSystem({ placementPoints: newPts });
                        }}
                        className="w-full bg-transparent text-right text-xs font-bold text-white focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsPointModalOpen(false)}
                  className="rounded-lg bg-red-600 hover:bg-red-500 px-5 py-2 text-xs font-bold uppercase text-white transition-colors"
                >
                  Save Rules
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
