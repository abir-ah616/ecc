import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Trash2,
  ArrowRight,
  Plus,
  Minus,
  Crown,
  Circle,
  LockOpen,
} from 'lucide-react';
import {
  useTournamentStore,
  generateInitials,
} from '../../store/tournamentStore';
import { LiveStandingsPanel } from './LiveStandingsPanel';
import { getPlacementPoints, getKillPoints } from '../../lib/scoring';
import type { Match } from '../../types/tournament';

interface MatchViewProps {
  match: Match;
}

export const MatchView: React.FC<MatchViewProps> = ({ match }) => {
  const {
    teams,
    settings,
    matches,
    updateMatchEntry,
    completeMatch,
    reopenMatch,
    deleteMatch,
    setCurrentTab,
    createMatch,
    getStandings,
  } = useTournamentStore();

  const [mobilePane, setMobilePane] = useState<'entry' | 'standings'>('entry');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const standingsResult = getStandings();
  const cumulativeByTeam = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of standingsResult.standings) {
      map.set(row.teamId, row.totalPoints);
    }
    return map;
  }, [standingsResult]);

  const currentIndex = matches.findIndex((m) => m.id === match.id);
  const nextMatchInList =
    currentIndex >= 0 && currentIndex < matches.length - 1
      ? matches[currentIndex + 1]
      : null;

  const maxAllowed =
    settings.mode === 'CHAMPION_RUSH'
      ? settings.championRush.maxMatches
      : settings.totalMatchesPlanned;
  const maxMatchesReached = matches.length >= maxAllowed;
  const canAddMatch = !standingsResult.tournamentConcluded && !maxMatchesReached;

  // Validate duplicate placements and find unassigned ranks
  const { duplicatePlacements, unassignedRanks, hasErrors } = useMemo(() => {
    const placementCounts = new Map<number, number>();
    const assigned = new Set<number>();

    for (const team of teams) {
      const entry = match.entries[team.id];
      if (entry && entry.placement !== null && entry.placement > 0) {
        assigned.add(entry.placement);
        placementCounts.set(
          entry.placement,
          (placementCounts.get(entry.placement) || 0) + 1
        );
      }
    }

    const duplicates = new Set<number>();
    for (const [place, count] of placementCounts.entries()) {
      if (count > 1) duplicates.add(place);
    }

    const missing: number[] = [];
    for (let rank = 1; rank <= teams.length; rank += 1) {
      if (!assigned.has(rank)) missing.push(rank);
    }

    return {
      duplicatePlacements: duplicates,
      unassignedRanks: missing,
      hasErrors: duplicates.size > 0,
    };
  }, [teams, match.entries]);

  const handlePlacementChange = (teamId: string, val: string) => {
    const entry = match.entries[teamId] || {
      teamId,
      placement: null,
      kills: 0,
    };
    const num = parseInt(val, 10);
    const placement =
      Number.isNaN(num) || num <= 0 ? null : Math.min(teams.length, num);
    updateMatchEntry(match.id, teamId, placement, entry.kills);
  };

  const handleKillsChange = (teamId: string, val: string) => {
    const entry = match.entries[teamId] || {
      teamId,
      placement: null,
      kills: 0,
    };
    const num = parseInt(val, 10);
    const kills = Number.isNaN(num) || num < 0 ? 0 : num;
    updateMatchEntry(match.id, teamId, entry.placement, kills);
  };

  const handleAdjustKills = (teamId: string, delta: number) => {
    const entry = match.entries[teamId] || {
      teamId,
      placement: null,
      kills: 0,
    };
    const next = Math.max(0, (entry.kills || 0) + delta);
    updateMatchEntry(match.id, teamId, entry.placement, next);
  };

  const handleSaveAndContinue = () => {
    completeMatch(match.id);
    const updatedState = useTournamentStore.getState();
    const updatedStandings = updatedState.getStandings();

    if (updatedStandings.tournamentConcluded) {
      setCurrentTab('results');
      return;
    }

    if (nextMatchInList) {
      setCurrentTab(nextMatchInList.id);
      return;
    }

    const reachedCap =
      updatedState.matches.length >=
      (updatedState.settings.mode === 'CHAMPION_RUSH'
        ? updatedState.settings.championRush.maxMatches
        : updatedState.settings.totalMatchesPlanned);

    if (!reachedCap) {
      const newMatchId = createMatch();
      setCurrentTab(newMatchId);
    } else {
      setCurrentTab('results');
    }
  };

  const primaryCtaLabel = nextMatchInList
    ? `Save & Go to Match ${nextMatchInList.matchNumber}`
    : canAddMatch
    ? `Save & Start Match ${matches.length + 1}`
    : 'Save & Open Poster';

  return (
    <div className="space-y-5 select-none">
      {/* Mobile-Only Match Switcher Strip (Desktop uses Sidebar directly to avoid duplication) */}
      <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1">
        {matches.map((m) => {
          const isSelected = m.id === match.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setConfirmDelete(false);
                setCurrentTab(m.id);
              }}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                isSelected
                  ? 'glass-accent text-amber-300'
                  : 'glass-tile text-slate-400 hover:text-slate-200'
              }`}
            >
              {m.isCompleted ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Circle className="h-3 w-3 text-amber-400" />
              )}
              <span>Match {m.matchNumber}</span>
            </button>
          );
        })}

        {canAddMatch && (
          <button
            type="button"
            onClick={() => {
              const newId = createMatch();
              setCurrentTab(newId);
            }}
            className="glass-tile border-dashed hover:border-amber-400 hover:text-amber-300 inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Match</span>
          </button>
        )}
      </div>

      {/* Mobile Segmented View Switcher */}
      <div className="glass-panel grid grid-cols-2 gap-1 rounded-xl p-1 lg:hidden">
        <button
          type="button"
          onClick={() => setMobilePane('entry')}
          className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
            mobilePane === 'entry'
              ? 'bg-white/[0.12] text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Score Entry ({teams.length})
        </button>
        <button
          type="button"
          onClick={() => setMobilePane('standings')}
          className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
            mobilePane === 'standings'
              ? 'bg-white/[0.12] text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Live Standings
        </button>
      </div>

      {/* Split Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Scorecard Editor */}
        <div
          className={`lg:col-span-7 space-y-4 ${
            mobilePane === 'entry' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Match Status & Quick Missing-Rank Hint */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Match {match.matchNumber} Scorecard
                </h2>
                {match.isCompleted ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/12 border border-emerald-500/25 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    Saved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/12 border border-amber-500/25 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                    Draft
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {match.isCompleted && (
                  <button
                    type="button"
                    onClick={() => reopenMatch(match.id)}
                    className="glass-pill inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors"
                  >
                    <LockOpen className="h-3 w-3" />
                    <span>Mark Draft</span>
                  </button>
                )}

                {matches.length > 1 &&
                  (confirmDelete ? (
                    <div className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/10 p-1">
                      <button
                        type="button"
                        onClick={() => {
                          deleteMatch(match.id);
                          setConfirmDelete(false);
                        }}
                        className="rounded bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-rose-500"
                      >
                        Delete Match
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="rounded px-2 py-1 text-[11px] text-slate-300 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      title={`Delete Match ${match.matchNumber}`}
                      className="glass-pill flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:border-rose-500/40 hover:bg-rose-500/15 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ))}
              </div>
            </div>

            {hasErrors ? (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span>
                  Duplicate rank:{' '}
                  <strong className="text-white">
                    {Array.from(duplicatePlacements)
                      .sort((a, b) => a - b)
                      .map((p) => `#${p}`)
                      .join(', ')}
                  </strong>
                  . Every finished squad must have a unique placement.
                </span>
              </div>
            ) : unassignedRanks.length > 0 && unassignedRanks.length < teams.length ? (
              <div className="glass-tile rounded-xl px-3 py-2 text-[11px] text-slate-400">
                Unassigned ranks:{' '}
                <span className="font-medium text-slate-200 tabular-nums">
                  {unassignedRanks.map((r) => `#${r}`).join(', ')}
                </span>
              </div>
            ) : unassignedRanks.length === 0 ? (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3 py-2 text-[11px] text-emerald-300">
                All {teams.length} team placements assigned cleanly.
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Enter finish placement (1-{teams.length}) and eliminations for each participating squad.
              </p>
            )}
          </div>

          {/* Squad Rows (Responsive Cards — Zero Cramped Table Scrolling) */}
          <div className="space-y-2.5">
            {teams.map((team, idx) => {
              const entry = match.entries[team.id] || {
                teamId: team.id,
                placement: null,
                kills: 0,
              };
              const isDuplicate =
                entry.placement !== null &&
                duplicatePlacements.has(entry.placement);
              const placementPts = getPlacementPoints(
                entry.placement,
                settings.pointSystem
              );
              const killPts = getKillPoints(entry.kills, settings.pointSystem);
              const totalMatchPts = placementPts + killPts;
              const isBooyah = entry.placement === 1 && !isDuplicate;
              const overallPts = cumulativeByTeam.get(team.id) ?? 0;

              return (
                <div
                  key={team.id}
                  className={`rounded-2xl p-3.5 sm:px-4 sm:py-3 transition-colors ${
                    isDuplicate
                      ? 'glass-panel border-rose-500/60 bg-rose-950/25'
                      : isBooyah
                      ? 'glass-panel border-amber-500/45 bg-amber-500/[0.08]'
                      : 'glass-panel'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Top/Left: Squad Identity */}
                    <div className="flex items-center justify-between gap-2.5 min-w-0 flex-1">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="glass-input flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl text-xs font-bold text-slate-300">
                          {team.logoUrl ? (
                            <img
                              src={team.logoUrl}
                              alt=""
                              className="h-full w-full object-contain p-0.5"
                            />
                          ) : (
                            generateInitials(team.name)
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-semibold text-white">
                              {team.name}
                            </span>
                            {isBooyah && (
                              <span className="inline-flex items-center gap-0.5 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-zinc-950 shrink-0">
                                <Crown className="h-2.5 w-2.5" />
                                #1
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 tabular-nums">
                            Slot {idx + 1} · Overall: {overallPts} pts
                          </div>
                        </div>
                      </div>

                      {/* Match Total Badge on Mobile Header Right */}
                      <div className="sm:hidden text-right shrink-0">
                        <div
                          className={`text-base font-bold tabular-nums leading-none ${
                            totalMatchPts > 0
                              ? isBooyah
                                ? 'text-amber-400'
                                : 'text-white'
                              : 'text-slate-500'
                          }`}
                        >
                          {totalMatchPts}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          match pts
                        </div>
                      </div>
                    </div>

                    {/* Controls: Finish Rank + Kills Stepper + Desktop Match Pts */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 border-t border-white/[0.08] sm:border-t-0 sm:pt-0 shrink-0">
                      {/* Rank Box */}
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={`rank-${match.id}-${team.id}`}
                          className="text-[11px] font-medium text-slate-400"
                        >
                          Rank
                        </label>
                        <input
                          id={`rank-${match.id}-${team.id}`}
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={teams.length}
                          value={entry.placement ?? ''}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) =>
                            handlePlacementChange(team.id, e.target.value)
                          }
                          placeholder="-"
                          className={`glass-input h-10 w-14 rounded-xl text-center text-sm font-bold tabular-nums focus:outline-none transition-colors ${
                            isDuplicate
                              ? 'border-rose-500/70 bg-rose-950/30 text-rose-200'
                              : isBooyah
                              ? 'border-amber-500/70 bg-amber-500/[0.1] text-amber-300'
                              : 'text-white focus:border-amber-400'
                          }`}
                        />
                      </div>

                      {/* Eliminations Stepper */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-slate-400">
                          Kills
                        </span>
                        <div className="glass-input inline-flex items-center rounded-xl p-0.5">
                          <button
                            type="button"
                            onClick={() => handleAdjustKills(team.id, -1)}
                            aria-label={`Decrease kills for ${team.name}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-white/[0.08] hover:text-white transition-colors"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            value={entry.kills}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) =>
                              handleKillsChange(team.id, e.target.value)
                            }
                            aria-label={`Kills for ${team.name}`}
                            className="h-9 w-10 bg-transparent text-center text-sm font-bold text-white tabular-nums focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleAdjustKills(team.id, 1)}
                            aria-label={`Increase kills for ${team.name}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-white/[0.08] hover:text-white transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Match Points Breakdown (Desktop) */}
                      <div className="hidden sm:block w-16 text-right">
                        <div
                          className={`text-base font-bold tabular-nums leading-tight ${
                            totalMatchPts > 0
                              ? isBooyah
                                ? 'text-amber-400'
                                : 'text-white'
                              : 'text-slate-500'
                          }`}
                        >
                          {totalMatchPts}
                        </div>
                        <div className="text-[10px] text-slate-500 tabular-nums">
                          {placementPts}+{killPts}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Primary Save & Next Bar */}
          <div className="glass-panel flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl p-4">
            <button
              type="button"
              onClick={() => completeMatch(match.id)}
              disabled={hasErrors}
              className="glass-pill rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-200 disabled:opacity-40 transition-colors"
            >
              {match.isCompleted ? 'Re-save Match Snapshot' : 'Save Match Only'}
            </button>

            <button
              type="button"
              onClick={handleSaveAndContinue}
              disabled={hasErrors}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-40 transition-colors"
            >
              <span>{primaryCtaLabel}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right: Sticky Live Standings Leaderboard */}
        <div
          className={`lg:col-span-5 ${
            mobilePane === 'standings' ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="lg:sticky lg:top-20">
            <LiveStandingsPanel />
          </div>
        </div>
      </div>
    </div>
  );
};
