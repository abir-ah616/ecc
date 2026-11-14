import React from 'react';
import {
  Plus,
  Play,
  SlidersHorizontal,
  History,
  Crown,
  Image as ImageIcon,
  Users,
  ArrowRight,
  Database,
  CheckCircle2,
  Swords,
  Flame,
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
import { calculateTournamentStandings } from '../../lib/scoring';

interface HomeViewProps {
  onOpenJson?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onOpenJson }) => {
  const {
    tournaments,
    activeTournamentId,
    switchActiveTournament,
    setCurrentTab,
    endTournamentById,
    defaultPointSystem,
  } = useTournamentStore();

  const liveTournaments = tournaments.filter((t) => !t.isEnded);
  const completedRecent = tournaments.filter((t) => t.isEnded).slice(0, 4);

  return (
    <div className="space-y-6 select-none">
      {/* Live Tournaments Section */}
      {liveTournaments.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Active Tournaments ({liveTournaments.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {liveTournaments.map((t) => {
              const standingsResult = calculateTournamentStandings(
                t.teams,
                t.matches,
                t.settings
              );
              const topThree = standingsResult.standings.slice(0, 3);
              const completedCount = t.matches.filter((m) => m.isCompleted).length;
              const plannedCount =
                t.settings.mode === 'CHAMPION_RUSH'
                  ? t.settings.championRush.maxMatches
                  : t.settings.totalMatchesPlanned;
              const progressPct = Math.min(
                100,
                Math.round((completedCount / Math.max(1, plannedCount)) * 100)
              );
              const nextMatch =
                t.matches.find((m) => !m.isCompleted) ||
                t.matches[t.matches.length - 1];
              const isSelectedActive = t.id === activeTournamentId;

              return (
                <div
                  key={t.id}
                  className="glass-panel rounded-2xl p-5 sm:p-6 space-y-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border ${
                            t.settings.mode === 'CHAMPION_RUSH'
                              ? 'glass-accent text-amber-300'
                              : 'glass-tile text-slate-300'
                          }`}
                        >
                          {t.settings.mode === 'CHAMPION_RUSH' ? (
                            <Flame className="h-3 w-3" />
                          ) : (
                            <Swords className="h-3 w-3" />
                          )}
                          <span>
                            {t.settings.mode === 'CHAMPION_RUSH'
                              ? `Champion Rush (${t.settings.championRush.targetPoints} pts)`
                              : 'Classic Scrim'}
                          </span>
                        </span>

                        {isSelectedActive && (
                          <span className="rounded-md bg-emerald-500/15 border border-emerald-400/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                            Loaded
                          </span>
                        )}

                        <span className="text-xs text-slate-400">
                          {t.teams.length} squads
                        </span>
                      </div>

                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white truncate">
                          {t.settings.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {t.settings.roundOrDay || 'Main Stage'}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          switchActiveTournament(t.id);
                          if (nextMatch) {
                            setCurrentTab(nextMatch.id);
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-950 transition-colors"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>
                          {nextMatch
                            ? `Open Match ${nextMatch.matchNumber}`
                            : 'Open Scorecard'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          switchActiveTournament(t.id);
                          setCurrentTab('results');
                        }}
                        className="glass-pill inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-200 transition-colors"
                      >
                        <ImageIcon className="h-3.5 w-3.5 text-amber-400" />
                        <span>Poster</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          switchActiveTournament(t.id);
                          setCurrentTab('edit');
                        }}
                        className="glass-pill inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-200 transition-colors"
                      >
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>Squads</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => endTournamentById(t.id)}
                        className="glass-pill inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-300 hover:border-emerald-400/35 hover:text-emerald-300 transition-colors"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Finish</span>
                      </button>
                    </div>
                  </div>

                  {/* Match Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>
                        Match progress: <strong className="text-slate-200">{completedCount}</strong> of{' '}
                        <strong className="text-slate-200">{plannedCount}</strong> matches scored
                      </span>
                      <span className="tabular-nums font-semibold text-slate-300">
                        {progressPct}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all duration-200"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Top 3 Leaderboard Snapshot */}
                  {topThree.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      {topThree.map((team, idx) => (
                        <div
                          key={team.teamId}
                          className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 ${
                            idx === 0 ? 'glass-accent' : 'glass-tile'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold tabular-nums ${
                                idx === 0
                                  ? 'bg-amber-500 text-zinc-950'
                                  : 'bg-white/[0.1] text-slate-200'
                              }`}
                            >
                              {team.rank}
                            </span>
                            <div className="min-w-0">
                              <div className="truncate text-xs font-semibold text-white">
                                {team.teamName}
                              </div>
                              <div className="text-[11px] text-slate-400 tabular-nums">
                                {team.booyahCount}W · {team.kills}K
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 pl-2">
                            <div
                              className={`text-sm font-bold tabular-nums ${
                                idx === 0 ? 'text-amber-400' : 'text-slate-200'
                              }`}
                            >
                              {team.totalPoints}
                            </div>
                            <div className="text-[10px] text-slate-400">pts</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        /* Welcoming Empty Dashboard State (Zero Sample Data) */
        <section className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="glass-accent inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                Ready for Match Day
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Run tournament standings without spreadsheets
              </h1>
              <p className="text-sm text-slate-300/90 leading-relaxed">
                Create a Classic Scrim or Champion Rush lobby, enter finish positions and kills from any phone or laptop, and export broadcast-ready standing posters.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setCurrentTab('create')}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-3 text-sm font-semibold text-zinc-950 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Tournament</span>
              </button>

              {onOpenJson && (
                <button
                  type="button"
                  onClick={onOpenJson}
                  className="glass-pill inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-200 transition-colors"
                >
                  <Database className="h-4 w-4 text-slate-400" />
                  <span>Import JSON</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/[0.08]">
            <div className="glass-tile rounded-xl p-4">
              <div className="text-xs font-semibold text-amber-400">Step 1</div>
              <div className="mt-1 text-sm font-semibold text-white">
                Pick Format & Roster
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Choose Scrim or Champion Rush, paste team lists, and upload team badges.
              </p>
            </div>

            <div className="glass-tile rounded-xl p-4">
              <div className="text-xs font-semibold text-amber-400">Step 2</div>
              <div className="mt-1 text-sm font-semibold text-white">
                Score Matches Live
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Fast mobile steppers and duplicate-rank checks keep scoring error-free.
              </p>
            </div>

            <div className="glass-tile rounded-xl p-4">
              <div className="text-xs font-semibold text-amber-400">Step 3</div>
              <div className="mt-1 text-sm font-semibold text-white">
                Export Standings Poster
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Download crisp 16:9 broadcast or 4:5 portrait PNG graphics in 7 themes.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Clean Quick Access Tiles */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setCurrentTab('create')}
          className="glass-panel group rounded-2xl p-5 text-left hover:border-white/[0.2] hover:bg-white/[0.06] transition-colors flex flex-col justify-between"
        >
          <div className="space-y-2.5">
            <div className="glass-tile flex h-10 w-10 items-center justify-center rounded-xl text-amber-400">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Create Tournament
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Start a new Classic Scrim or Champion Rush event with custom teams.
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-medium text-slate-300 group-hover:text-white">
            <span>Configure event</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('rules')}
          className="glass-panel group rounded-2xl p-5 text-left hover:border-white/[0.2] hover:bg-white/[0.06] transition-colors flex flex-col justify-between"
        >
          <div className="space-y-2.5">
            <div className="glass-tile flex h-10 w-10 items-center justify-center rounded-xl text-amber-400">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Scoring Rules
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Currently: #1 = {defaultPointSystem.placementPoints[0] ?? 12} pts ·{' '}
                {defaultPointSystem.killPoints} pt per kill
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-medium text-slate-300 group-hover:text-white">
            <span>Adjust point values</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('history')}
          className="glass-panel group rounded-2xl p-5 text-left hover:border-white/[0.2] hover:bg-white/[0.06] transition-colors flex flex-col justify-between"
        >
          <div className="space-y-2.5">
            <div className="glass-tile flex h-10 w-10 items-center justify-center rounded-xl text-amber-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Tournament History
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                {tournaments.length === 0
                  ? 'No archived tournaments yet.'
                  : `${tournaments.length} saved tournament${
                      tournaments.length === 1 ? '' : 's'
                    } on this browser.`}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-medium text-slate-300 group-hover:text-white">
            <span>Browse archive</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
          </div>
        </button>
      </section>

      {/* Completed Archive Snapshot */}
      {completedRecent.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Past Completed Events
            </h2>
            {tournaments.filter((t) => t.isEnded).length > 4 && (
              <button
                type="button"
                onClick={() => setCurrentTab('history')}
                className="text-xs font-medium text-amber-400 hover:text-amber-300"
              >
                View all
              </button>
            )}
          </div>

          <div className="glass-panel overflow-hidden rounded-2xl divide-y divide-white/[0.07]">
            {completedRecent.map((t) => (
              <div
                key={t.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3.5 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="glass-tile flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400">
                    <Crown className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-white">
                        {t.settings.name}
                      </span>
                      <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                        Ended
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {t.settings.roundOrDay || 'Main Stage'} ·{' '}
                      {t.matches.filter((m) => m.isCompleted).length} matches scored
                      {t.championTeamName ? ` · Winner: ${t.championTeamName}` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      switchActiveTournament(t.id);
                      setCurrentTab('results');
                    }}
                    className="glass-pill rounded-lg px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors"
                  >
                    View Poster
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
