import React, { useState } from 'react';
import {
  Trophy,
  Play,
  CheckCircle2,
  Plus,
  Sliders,
  Settings,
  Crown,
  History,
  ChevronRight,
  X,
} from 'lucide-react';
import { useTournamentStore, generateInitials } from '../../store/tournamentStore';
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

  // Separate active and ended tournaments
  const liveTournaments = tournaments.filter((t) => !t.isEnded);
  const endedTournaments = tournaments.filter((t) => t.isEnded);

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
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-6">
      {/* 1. TOP CONTROL BAR / ACTION HUB */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Button 1: Create Tournament */}
        <button
          type="button"
          onClick={() => setCurrentTab('create')}
          className="flex items-center justify-between p-4 rounded-xl border border-neutral-800 bg-[#121215] hover:bg-[#18181D] hover:border-neutral-700 transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/10 text-red-500 border border-red-500/20 group-hover:bg-red-600 group-hover:text-white transition-all">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white uppercase tracking-wider">
                Create Tournament
              </div>
              <div className="text-xs text-neutral-400">
                Classic Scrim or Champion Rush
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* Button 2: History Archive */}
        <button
          type="button"
          onClick={() => setCurrentTab('history')}
          className="flex items-center justify-between p-4 rounded-xl border border-neutral-800 bg-[#121215] hover:bg-[#18181D] hover:border-neutral-700 transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-black transition-all">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white uppercase tracking-wider">
                Tournament History
              </div>
              <div className="text-xs text-neutral-400">
                {tournaments.length} Saved {tournaments.length === 1 ? 'Tournament' : 'Tournaments'}
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* Button 3: Edit Point System */}
        <button
          type="button"
          onClick={() => setIsPointModalOpen(true)}
          className="flex items-center justify-between p-4 rounded-xl border border-neutral-800 bg-[#121215] hover:bg-[#18181D] hover:border-neutral-700 transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300 border border-neutral-700 group-hover:bg-neutral-700 group-hover:text-white transition-all">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white uppercase tracking-wider">
                Scoring Rules
              </div>
              <div className="text-xs text-neutral-400">
                1st: {defaultPointSystem.placementPoints[0]} pts • Kill: {defaultPointSystem.killPoints} pt
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      {/* 2. LIVE ACTIVE TOURNAMENTS SECTION */}
      {liveTournaments.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Live Tournaments in Progress ({liveTournaments.length})
              </h2>
            </div>
          </div>

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
                  className="rounded-xl border border-neutral-800 bg-[#121215] p-5 sm:p-6 transition-all hover:border-neutral-700"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                    {/* Left: Tournament Details */}
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 rounded bg-emerald-950 px-2 py-0.5 font-bold text-emerald-400 border border-emerald-800/60 text-[10px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>LIVE</span>
                        </span>
                        <span className="rounded bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-bold uppercase text-neutral-300">
                          {t.settings.mode === 'CHAMPION_RUSH' ? 'Champion Rush' : 'Classic Scrim'}
                        </span>
                        <span className="text-neutral-500 font-medium">
                          {t.createdAt}
                        </span>
                      </div>

                      <h3 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-wider text-white truncate">
                        {t.name}
                      </h3>

                      <p className="text-xs text-neutral-400">
                        {t.settings.roundOrDay} • Hosted by <strong className="text-neutral-200">{t.settings.hostName || 'BD Esports Arena'}</strong> • {completedMatches.length} of {t.matches.length} Matches Concluded
                      </p>
                    </div>

                    {/* Right: Leader squad card */}
                    {leader && (
                      <div className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/60 p-3 shrink-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-black border border-neutral-800 text-amber-400 font-display text-sm font-black overflow-hidden">
                          {leader.logoUrl ? (
                            <img src={leader.logoUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            generateInitials(leader.teamName)
                          )}
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1">
                            <Crown className="h-3 w-3" />
                            <span>1st Place</span>
                          </div>
                          <div className="font-bold text-white text-sm uppercase truncate max-w-[140px]">
                            {leader.teamName}
                          </div>
                          <div className="text-xs text-neutral-400">
                            {leader.totalPoints} PTS • {leader.kills} Kills
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Toolbar */}
                  <div className="mt-5 pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          switchActiveTournament(t.id, currentMatch ? currentMatch.id : 'results');
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-500 transition-colors"
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span>
                          {pendingMatch
                            ? `Enter Match ${pendingMatch.matchNumber}`
                            : 'Score Matches'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          switchActiveTournament(t.id, 'results');
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-neutral-200 hover:bg-neutral-800 transition-colors"
                      >
                        <Trophy className="h-3.5 w-3.5 text-amber-400" />
                        <span>Standing Graphic</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          switchActiveTournament(t.id, 'edit');
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
                      >
                        <Settings className="h-3.5 w-3.5 text-neutral-400" />
                        <span>Edit Squads</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Conclude and archive "${t.name}"?`)) {
                          endTournamentById(t.id);
                        }
                      }}
                      className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-red-400 transition-colors"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Conclude</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        /* Zero state when no tournaments exist */
        <div className="rounded-xl border border-neutral-800 bg-[#121215] p-10 text-center space-y-3">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400">
            <Trophy className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl font-black uppercase tracking-wider text-white">
            No Active Tournaments
          </h2>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Get started by launching a new tournament or adjusting your custom scoring rules.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setCurrentTab('create')}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Tournament</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. RECENT CONCLUDED TOURNAMENTS (If any exist) */}
      {endedTournaments.length > 0 && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Recently Concluded Tournaments
            </h3>
            <button
              type="button"
              onClick={() => setCurrentTab('history')}
              className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
            >
              View All ({endedTournaments.length}) →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {endedTournaments.slice(0, 3).map((t) => (
              <div
                key={t.id}
                className="rounded-lg border border-neutral-800 bg-[#121215] p-4 flex flex-col justify-between hover:border-neutral-700 transition-all"
              >
                <div>
                  <div className="text-[10px] text-neutral-500 mb-1">{t.createdAt}</div>
                  <h4 className="font-bold text-white uppercase text-sm truncate">
                    {t.name}
                  </h4>
                  {t.championTeamName && (
                    <div className="text-xs text-amber-400 font-medium mt-1 flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      <span>{t.championTeamName}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => {
                      switchActiveTournament(t.id);
                      setCurrentTab('results');
                    }}
                    className="w-full rounded border border-neutral-700 bg-neutral-900 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 text-center"
                  >
                    View Poster
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. POINT SYSTEM EDIT MODAL */}
      {isPointModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-xl border border-neutral-800 bg-[#121215] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-neutral-300" />
                <h3 className="font-display text-lg font-bold uppercase tracking-wider text-white">
                  Default Point System Settings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPointModalOpen(false)}
                className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 font-semibold mr-1">Presets:</span>
              <button
                type="button"
                onClick={applyOfficialPreset}
                className="rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-800"
              >
                Official 12-Pt
              </button>
              <button
                type="button"
                onClick={applyClassicPreset}
                className="rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-800"
              >
                Classic 20-Pt
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
              {/* Kill Points */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-400">
                  Kill Points
                </label>
                <input
                  type="number"
                  min={0}
                  value={defaultPointSystem.killPoints}
                  onChange={(e) =>
                    updateDefaultPointSystem({
                      killPoints: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-neutral-500"
                />
              </div>

              {/* Placement Scale Grid */}
              <div className="md:col-span-3 space-y-1">
                <label className="block text-xs font-semibold text-neutral-400">
                  Placement Scale (1st – 15th Position)
                </label>
                <div className="grid grid-cols-5 gap-1 text-center text-xs">
                  {Array.from({ length: 15 }, (_, i) => {
                    const pts = defaultPointSystem.placementPoints[i] ?? 0;
                    return (
                      <div key={i} className="rounded bg-neutral-900 border border-neutral-800 p-1">
                        <div className="text-[10px] text-neutral-500 font-bold mb-0.5">
                          #{i + 1}
                        </div>
                        <input
                          type="number"
                          min={0}
                          value={pts}
                          onChange={(e) => {
                            const updated = [...defaultPointSystem.placementPoints];
                            updated[i] = Math.max(0, parseInt(e.target.value) || 0);
                            updateDefaultPointSystem({ placementPoints: updated });
                          }}
                          className="w-full bg-transparent text-center font-bold text-xs text-white focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPointModalOpen(false)}
                className="rounded-lg bg-neutral-800 px-4 py-2 text-xs font-bold uppercase text-white hover:bg-neutral-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
