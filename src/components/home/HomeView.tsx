import React from 'react';
import {
  Trophy,
  Play,
  CheckCircle2,
  Plus,
  Sliders,
  Calendar,
  Flame,
  Settings,
  Crown,
  History,
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
    loadFullDemoTournament,
  } = useTournamentStore();

  // All tournaments currently LIVE (not ended)
  const liveTournaments = tournaments.filter((t) => !t.isEnded);
  const endedTournaments = tournaments.filter((t) => t.isEnded);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
      {/* 1. Live Active Tournaments Section */}
      {liveTournaments.length > 0 ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="font-display text-2xl tracking-wider text-white uppercase font-black">
                LIVE TOURNAMENTS IN PROGRESS ({liveTournaments.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setCurrentTab('create')}
              className="flex items-center gap-1.5 self-start sm:self-auto rounded bg-red-700/80 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-600 transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Launch Another Tournament</span>
            </button>
          </div>

          {/* If single live tournament: Hero View */}
          {liveTournaments.length === 1 ? (
            (() => {
              const t = liveTournaments[0];
              const standings = calculateTournamentStandings(t.teams, t.matches, t.settings);
              const leader = standings.standings[0];
              const completedMatches = t.matches.filter((m) => m.isCompleted);
              const currentMatch =
                t.matches.find((m) => !m.isCompleted) || t.matches[t.matches.length - 1];

              return (
                <div
                  key={t.id}
                  className="relative overflow-hidden rounded-lg border border-neutral-800 bg-[#110A0C] p-6 sm:p-8 shadow-xl"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1.5 rounded bg-emerald-950/90 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-800/60 shadow-sm">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>LIVE ACTIVE</span>
                        </span>

                        <span className="rounded bg-neutral-900 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-neutral-300 border border-neutral-800">
                          {t.settings.mode}
                        </span>

                        <span className="flex items-center gap-1 text-xs text-neutral-400">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{t.createdAt}</span>
                        </span>
                      </div>

                      <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-wider text-white uppercase font-black drop-shadow-md">
                        {t.name}
                      </h1>

                      <p className="text-xs sm:text-sm text-neutral-300">
                        {t.settings.roundOrDay} • Hosted by{' '}
                        <strong className="text-white">
                          {t.settings.hostName || 'BD Esports Arena'}
                        </strong>{' '}
                        • {completedMatches.length} of {t.matches.length} Matches Concluded
                      </p>
                    </div>

                    {/* Current #1 Squad Card */}
                    {leader && (
                      <div className="flex items-center gap-3.5 rounded-lg border border-neutral-800 bg-neutral-950/80 p-4 shrink-0 sm:min-w-[280px]">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-black/80 border border-amber-500/50 text-amber-400 font-display text-xl font-black">
                          {leader.logoUrl ? (
                            <img
                              src={leader.logoUrl}
                              alt=""
                              className="h-full w-full object-cover rounded-lg"
                            />
                          ) : (
                            generateInitials(leader.teamName)
                          )}
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-400">
                            Current #1 Squad
                          </span>
                          <div className="font-display text-xl font-black text-white uppercase truncate max-w-[160px]">
                            {leader.teamName}
                          </div>
                          <div className="text-xs text-neutral-400 font-numbers">
                            <strong className="text-white">{leader.totalPoints}</strong> Pts •{' '}
                            {leader.kills} Kills
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons for Live Tournament */}
                  <div className="mt-6 pt-5 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          switchActiveTournament(t.id, currentMatch ? currentMatch.id : 'results');
                        }}
                        className="flex items-center gap-2 rounded bg-red-700 px-5 py-2.5 text-xs font-display tracking-wider uppercase font-black text-white hover:bg-red-600 shadow-md transition-all"
                      >
                        <Play className="h-4 w-4" />
                        <span>Continue Match Scoring</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          switchActiveTournament(t.id, 'results');
                        }}
                        className="flex items-center gap-2 rounded border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-200 hover:bg-neutral-800 transition-colors"
                      >
                        <Trophy className="h-4 w-4 text-amber-400" />
                        <span>View Standing Graphic</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          switchActiveTournament(t.id, 'edit');
                        }}
                        className="flex items-center gap-1.5 rounded border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:bg-neutral-800 transition-colors"
                      >
                        <Settings className="h-3.5 w-3.5 text-neutral-400" />
                        <span>Edit Info</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => endTournamentById(t.id)}
                        className="flex items-center gap-1.5 rounded border border-red-800/60 bg-red-950/40 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-red-300 hover:bg-red-900/50 transition-colors"
                      >
                        <CheckCircle2 className="h-4 w-4 text-red-400" />
                        <span>End Tournament</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentTab('create')}
                      className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create Another Tournament</span>
                    </button>
                  </div>
                </div>
              );
            })()
          ) : (
            /* Multi-Live Tournaments Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {liveTournaments.map((t) => {
                const standings = calculateTournamentStandings(t.teams, t.matches, t.settings);
                const leader = standings.standings[0];
                const completedMatches = t.matches.filter((m) => m.isCompleted);
                const currentMatch =
                  t.matches.find((m) => !m.isCompleted) || t.matches[t.matches.length - 1];

                return (
                  <div
                    key={t.id}
                    className="flex flex-col justify-between rounded-lg border border-neutral-800 bg-[#110A0C] p-5 shadow-md"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1.5 rounded bg-emerald-950/90 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-800/50">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>LIVE</span>
                          </span>

                          <span className="rounded bg-neutral-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-300 border border-neutral-800">
                            {t.settings.mode}
                          </span>
                        </div>

                        <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{t.createdAt}</span>
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-display text-2xl font-black uppercase text-white tracking-wide truncate mb-1">
                        {t.name}
                      </h3>

                      <p className="text-xs text-neutral-300 mb-3">
                        {t.settings.roundOrDay} • {completedMatches.length} of {t.matches.length}{' '}
                        Matches Concluded
                      </p>

                      {/* Leader Squad Info */}
                      {leader && (
                        <div className="mb-4 rounded border border-neutral-800 bg-neutral-950/70 px-3 py-2 flex items-center justify-between text-xs">
                          <span className="text-neutral-400 flex items-center gap-2 truncate">
                            <span className="text-[10px] uppercase font-bold text-amber-400">
                              #1
                            </span>
                            <strong className="text-white truncate">{leader.teamName}</strong>
                          </span>
                          <span className="font-numbers font-black text-amber-400 shrink-0">
                            {leader.totalPoints} PTS
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons for this Live Tournament */}
                    <div className="pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            switchActiveTournament(t.id, currentMatch ? currentMatch.id : 'results');
                          }}
                          className="flex items-center gap-1 rounded bg-red-700 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-600 transition-colors shadow-sm"
                        >
                          <Play className="h-3.5 w-3.5" />
                          <span>Score</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            switchActiveTournament(t.id, 'results');
                          }}
                          className="flex items-center gap-1 rounded border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:bg-neutral-800 transition-colors"
                        >
                          <Trophy className="h-3.5 w-3.5 text-amber-400" />
                          <span>Graphic</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            switchActiveTournament(t.id, 'edit');
                          }}
                          className="flex items-center gap-1 rounded border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800 transition-colors"
                        >
                          <Settings className="h-3 w-3 text-neutral-400" />
                          <span>Edit</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => endTournamentById(t.id)}
                        title="Conclude tournament"
                        className="rounded border border-red-950 bg-red-950/40 px-2.5 py-1.5 text-xs font-bold text-red-400 hover:bg-red-900/50 transition-colors"
                      >
                        End
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Empty State (No Live Tournaments) */
        <div className="rounded-lg border border-neutral-800 bg-[#14080A] p-8 text-center space-y-4 shadow-sm">
          <Trophy className="mx-auto h-12 w-12 text-red-500/60" />
          <h2 className="font-display text-3xl tracking-wider text-white uppercase font-black">
            NO LIVE TOURNAMENT CURRENTLY IN PROGRESS
          </h2>
          <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
            All previous tournaments are ended or archived. Create a new tournament with custom
            squad names and logos, or view the history archive.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentTab('create')}
              className="flex items-center gap-2 rounded bg-red-700 px-6 py-3 text-sm font-display tracking-wider uppercase font-black text-white hover:bg-red-600 shadow-xl shadow-red-950/50"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Tournament</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab('history')}
              className="flex items-center gap-2 rounded border border-neutral-700 bg-neutral-900 px-5 py-3 text-xs font-bold uppercase tracking-wider text-neutral-200 hover:bg-neutral-800"
            >
              <History className="h-4 w-4 text-amber-400" />
              <span>Open Tournament History ({tournaments.length})</span>
            </button>

            <button
              type="button"
              onClick={loadFullDemoTournament}
              className="flex items-center gap-1.5 rounded border border-neutral-800 bg-neutral-900 px-4 py-3 text-xs font-medium text-neutral-400 hover:text-white"
            >
              <Flame className="h-3.5 w-3.5 text-red-400" />
              <span>Load Sample 5-Match Tournament</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Global Point System Settings */}
      <div className="rounded-lg border border-neutral-800 bg-[#14080A] p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-800 pb-3">
          <div>
            <h2 className="font-display text-xl tracking-wider text-white flex items-center gap-2 uppercase font-black">
              <Sliders className="h-5 w-5 text-red-500" />
              <span>DEFAULT POINT SYSTEM CONFIGURATION</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              These placement and kill point rules will automatically apply when creating new
              tournaments.
            </p>
          </div>
          <span className="rounded bg-neutral-900 px-2.5 py-1 text-[11px] font-bold text-neutral-400 border border-neutral-800">
            Official Esports Preset
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Kill Points */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
              Kill Points (per kill)
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
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm font-bold text-white focus:border-red-500 focus:outline-none"
            />
            <p className="text-[11px] text-neutral-500">Default is 1 point per confirmed kill.</p>
          </div>

          {/* Placement Points Grid (15 positions) */}
          <div className="md:col-span-3 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
              Placement Points Scale (1st – 15th Position)
            </label>
            <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
              {Array.from({ length: 15 }, (_, i) => {
                const pts = defaultPointSystem.placementPoints[i] ?? 0;
                return (
                  <div key={i} className="rounded bg-neutral-900 border border-neutral-800 p-1.5">
                    <div className="text-[10px] text-neutral-400 font-bold mb-0.5">
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
                      className="w-full bg-transparent text-center font-black text-sm text-white focus:outline-none"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded bg-neutral-900/60 p-3 text-xs text-neutral-400 border border-neutral-800 flex items-center justify-between">
          <span>
            <strong className="text-neutral-200">Tie-Break Hierarchy:</strong> Total Points →
            Booyah Count → Placement Points → Total Kills → Last Match Finish Rank.
          </span>
        </div>
      </div>

      {/* 3. Recent Concluded Tournaments Summary */}
      {endedTournaments.length > 0 && (
        <div className="rounded-lg border border-neutral-800 bg-[#14080A] p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
            <h3 className="font-display text-lg tracking-wider text-white flex items-center gap-2 uppercase font-black">
              <Crown className="h-4 w-4 text-amber-400" />
              <span>RECENTLY CONCLUDED TOURNAMENTS ({endedTournaments.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => setCurrentTab('history')}
              className="text-xs font-bold text-red-400 hover:text-red-300 uppercase tracking-wider"
            >
              View Full History →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {endedTournaments.slice(0, 3).map((t) => (
              <div
                key={t.id}
                className="rounded border border-neutral-800 bg-neutral-950/60 p-3.5 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400">
                    <span>{t.createdAt}</span>
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-bold text-amber-300">
                      ENDED
                    </span>
                  </div>
                  <h4 className="font-display text-lg text-white font-black uppercase truncate mt-1">
                    {t.name}
                  </h4>
                  {t.championTeamName && (
                    <div className="text-xs text-amber-400 font-bold flex items-center gap-1 mt-1">
                      <Crown className="h-3 w-3" />
                      <span>Winner: {t.championTeamName}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-neutral-800 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      switchActiveTournament(t.id);
                      setCurrentTab('results');
                    }}
                    className="flex-1 rounded border border-neutral-700 bg-neutral-900 py-1 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 text-center"
                  >
                    Standing Graphic
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
