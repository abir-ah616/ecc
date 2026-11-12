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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8 animate-in fade-in duration-150">
      {/* 1. HERO CONTROL STRIP: Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#111114] p-6 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span>Esports Production Studio</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Free Fire Point Table &amp; Broadcast Engine
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
            Live scrim scoring, Champion Rush match-point tracking, and instant 4K standing graphics in 7 themes.
          </p>
        </div>

        {/* 3 Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 md:pt-0">
          <button
            type="button"
            onClick={() => setCurrentTab('create')}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-white shadow-md transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>New Tournament</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('history')}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-zinc-900/90 hover:bg-zinc-800 px-3.5 py-2.5 text-xs font-medium text-zinc-300 transition-colors"
          >
            <History className="h-4 w-4 text-zinc-400" />
            <span>History ({tournaments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPointModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-zinc-900/90 hover:bg-zinc-800 px-3.5 py-2.5 text-xs font-medium text-zinc-300 transition-colors"
          >
            <Sliders className="h-4 w-4 text-zinc-400" />
            <span>Scoring Rules</span>
          </button>
        </div>
      </div>

      {/* 2. LIVE ACTIVE TOURNAMENTS SECTION */}
      {liveTournaments.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Active In-Progress ({liveTournaments.length})
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
                  className="rounded-2xl border border-white/[0.08] bg-[#111114] p-5 sm:p-6 transition-all hover:border-zinc-700 shadow-md"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                    {/* Left: Tournament Details */}
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-medium text-emerald-400 border border-emerald-500/20 text-[11px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Live</span>
                        </span>
                        <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
                          {t.settings.mode === 'CHAMPION_RUSH' ? 'Champion Rush' : 'Classic Scrim'}
                        </span>
                        <span className="text-zinc-500">
                          {t.createdAt}
                        </span>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
                        {t.name}
                      </h3>

                      <p className="text-xs text-zinc-400">
                        {t.settings.roundOrDay} • Hosted by <strong className="text-zinc-200">{t.settings.hostName || 'BD Esports Arena'}</strong> • {completedMatches.length} of {t.matches.length} Matches Concluded
                      </p>
                    </div>

                    {/* Right: Leader squad card */}
                    {leader && (
                      <div className="flex items-center gap-3.5 rounded-xl border border-white/[0.06] bg-zinc-900/60 p-3.5 shrink-0">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-950 border border-white/[0.08] text-amber-400 font-display text-sm font-black overflow-hidden">
                          {leader.logoUrl ? (
                            <img src={leader.logoUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            generateInitials(leader.teamName)
                          )}
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                            <Crown className="h-3 w-3" />
                            <span>Current Leader</span>
                          </div>
                          <div className="font-semibold text-white text-sm truncate max-w-[150px]">
                            {leader.teamName}
                          </div>
                          <div className="text-xs text-zinc-400 font-mono">
                            {leader.totalPoints} PTS • {leader.kills} Kills
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Toolbar */}
                  <div className="mt-5 pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          switchActiveTournament(t.id, currentMatch ? currentMatch.id : 'results');
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-white transition-all shadow-sm"
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span>
                          {pendingMatch
                            ? `Enter Match ${pendingMatch.matchNumber}`
                            : 'Open Scorecard'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          switchActiveTournament(t.id, 'results');
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition-colors"
                      >
                        <Trophy className="h-3.5 w-3.5 text-amber-400" />
                        <span>Standing Graphic</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          switchActiveTournament(t.id, 'edit');
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                      >
                        <Settings className="h-3.5 w-3.5 text-zinc-400" />
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
                      className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400 transition-colors px-2 py-1"
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
        <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#111114] p-12 text-center space-y-3">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-zinc-900 border border-white/[0.08] text-zinc-400">
            <Trophy className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-white">
            No Active Tournaments
          </h2>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Ready to host a tournament? Create a Classic Scrim or Champion Rush with custom point systems.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setCurrentTab('create')}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-5 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-white transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Launch First Tournament</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. RECENT CONCLUDED ARCHIVE (If any exist) */}
      {endedTournaments.length > 0 && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Recently Concluded Tournaments
            </h3>
            <button
              type="button"
              onClick={() => setCurrentTab('history')}
              className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              View All ({endedTournaments.length}) →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {endedTournaments.slice(0, 3).map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-white/[0.08] bg-[#111114] p-4 flex flex-col justify-between hover:border-zinc-700 transition-all"
              >
                <div>
                  <div className="text-[10px] text-zinc-500 mb-1">{t.createdAt}</div>
                  <h4 className="font-semibold text-white text-sm truncate">
                    {t.name}
                  </h4>
                  {t.championTeamName && (
                    <div className="text-xs text-amber-400 font-medium mt-1 flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      <span>{t.championTeamName}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      switchActiveTournament(t.id);
                      setCurrentTab('results');
                    }}
                    className="w-full rounded-lg border border-white/[0.08] bg-zinc-900 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 text-center transition-colors"
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
          <div className="w-full max-w-2xl rounded-2xl border border-white/[0.1] bg-[#141417] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-zinc-300" />
                <h3 className="text-base font-bold text-white">
                  Scoring Rules &amp; Points Scale
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPointModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium mr-1">Presets:</span>
              <button
                type="button"
                onClick={applyOfficialPreset}
                className="rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
              >
                Official 12-Pt
              </button>
              <button
                type="button"
                onClick={applyClassicPreset}
                className="rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
              >
                Classic 20-Pt
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
              {/* Kill Points */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-400">
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
                  className="w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              {/* Placement Scale Grid */}
              <div className="md:col-span-3 space-y-1.5">
                <label className="block text-xs font-medium text-zinc-400">
                  Placement Scale (1st – 15th Position)
                </label>
                <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                  {Array.from({ length: 15 }, (_, i) => {
                    const pts = defaultPointSystem.placementPoints[i] ?? 0;
                    return (
                      <div key={i} className="rounded-xl bg-zinc-900 border border-white/[0.06] p-1.5">
                        <div className="text-[10px] text-zinc-500 font-medium mb-0.5">
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

            <div className="pt-3 border-t border-white/[0.08] flex justify-end">
              <button
                type="button"
                onClick={() => setIsPointModalOpen(false)}
                className="rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-white"
              >
                Save &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
