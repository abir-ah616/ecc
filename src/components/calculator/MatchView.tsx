import React, { useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit3,
  Save,
  ArrowRight,
} from 'lucide-react';
import { useTournamentStore, generateInitials } from '../../store/tournamentStore';
import { LiveStandingsPanel } from './LiveStandingsPanel';
import {
  getPlacementPoints,
  getKillPoints,
} from '../../lib/scoring';
import type { Match } from '../../types/tournament';

interface MatchViewProps {
  match: Match;
}

export const MatchView: React.FC<MatchViewProps> = ({ match }) => {
  const {
    teams,
    settings,
    updateMatchEntry,
    completeMatch,
    reopenMatch,
    deleteMatch,
    setCurrentTab,
    createMatch,
    matches,
  } = useTournamentStore();

  const currentIndex = matches.findIndex((m) => m.id === match.id);
  const isLastMatchInList = currentIndex === matches.length - 1;
  const nextMatchInList = !isLastMatchInList ? matches[currentIndex + 1] : null;

  // Validate duplicate placements
  const { duplicatePlacements, hasErrors } = useMemo(() => {
    const placementCounts = new Map<number, number>();

    for (const team of teams) {
      const entry = match.entries[team.id];
      if (entry && entry.placement !== null && entry.placement > 0) {
        const count = placementCounts.get(entry.placement) || 0;
        placementCounts.set(entry.placement, count + 1);
      }
    }

    const duplicates = new Set<number>();
    for (const [place, count] of placementCounts.entries()) {
      if (count > 1) {
        duplicates.add(place);
      }
    }

    return {
      duplicatePlacements: duplicates,
      hasErrors: duplicates.size > 0,
    };
  }, [teams, match.entries]);

  const handlePlacementChange = (teamId: string, val: string) => {
    const entry = match.entries[teamId] || { teamId, placement: null, kills: 0 };
    const num = parseInt(val, 10);
    const placement = isNaN(num) || num <= 0 ? null : Math.min(teams.length, num);
    updateMatchEntry(match.id, teamId, placement, entry.kills);
  };

  const handleKillsChange = (teamId: string, val: string) => {
    const entry = match.entries[teamId] || { teamId, placement: null, kills: 0 };
    const num = parseInt(val, 10);
    const kills = isNaN(num) || num < 0 ? 0 : num;
    updateMatchEntry(match.id, teamId, entry.placement, kills);
  };

  const handleAdjustKills = (teamId: string, delta: number) => {
    const entry = match.entries[teamId] || { teamId, placement: null, kills: 0 };
    const current = entry.kills || 0;
    const next = Math.max(0, current + delta);
    updateMatchEntry(match.id, teamId, entry.placement, next);
  };

  const handleSaveAndGoNextMatch = () => {
    completeMatch(match.id);
    if (nextMatchInList) {
      setCurrentTab(nextMatchInList.id);
    } else {
      const newMatchId = createMatch();
      setCurrentTab(newMatchId);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6 animate-in fade-in duration-150">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Match Input Table (7 cols on desktop) */}
        <div className="space-y-4 lg:col-span-7">
          {/* Header Action Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#111114] p-4 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white uppercase tracking-tight">
                  Match {match.matchNumber} Scorecard
                </h2>
                {match.isCompleted ? (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Saved</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                    In Progress
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Enter finish placement and kill count for each squad.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {match.isCompleted ? (
                <button
                  type="button"
                  onClick={() => reopenMatch(match.id)}
                  className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => completeMatch(match.id)}
                  disabled={hasErrors}
                  className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-40 transition-colors"
                >
                  <Save className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Save</span>
                </button>
              )}

              {/* Primary Next Action */}
              <button
                type="button"
                onClick={handleSaveAndGoNextMatch}
                disabled={hasErrors}
                className="flex items-center gap-1.5 rounded-xl bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-white disabled:opacity-40 transition-all shadow-sm active:scale-95"
              >
                <span>{nextMatchInList ? `Next (M${nextMatchInList.matchNumber})` : 'Next Match'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              {matches.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete Match ${match.matchNumber}?`)) {
                      deleteMatch(match.id);
                    }
                  }}
                  title="Delete match"
                  className="rounded-lg p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Validation Banner */}
          {hasErrors && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                Duplicate rank detected:{' '}
                <strong>
                  {Array.from(duplicatePlacements).map((p) => `#${p}`).join(', ')}
                </strong>
                . Each squad must have a unique finish rank.
              </span>
            </div>
          )}

          {/* Table Container */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111114] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-zinc-950/40 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    <th className="py-2.5 pl-3 pr-2 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Squad Name</th>
                    <th className="py-2.5 px-2 w-24 text-center">Rank</th>
                    <th className="py-2.5 px-2 w-28 text-center">Kills</th>
                    <th className="py-2.5 pr-3 pl-2 w-16 text-right">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
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
                    const killPts = getKillPoints(
                      entry.kills,
                      settings.pointSystem
                    );
                    const totalMatchPts = placementPts + killPts;
                    const isBooyah = entry.placement === 1;

                    return (
                      <tr
                        key={team.id}
                        className={`transition-colors hover:bg-white/[0.02] ${
                          isBooyah ? 'bg-amber-500/[0.03]' : ''
                        }`}
                      >
                        {/* Index */}
                        <td className="py-2.5 pl-3 pr-2 text-center text-zinc-600 font-mono">
                          {idx + 1}
                        </td>

                        {/* Squad name & logo */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-amber-400 font-bold text-xs overflow-hidden border border-white/[0.08]">
                              {team.logoUrl ? (
                                <img
                                  src={team.logoUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                generateInitials(team.name)
                              )}
                            </div>
                            <span className="font-semibold text-white truncate max-w-[150px] sm:max-w-[200px]">
                              {team.name}
                            </span>
                            {isBooyah && (
                              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-400 border border-amber-500/20">
                                Booyah
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Rank Input */}
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min={1}
                            max={teams.length}
                            value={entry.placement ?? ''}
                            onChange={(e) =>
                              handlePlacementChange(team.id, e.target.value)
                            }
                            placeholder="-"
                            className={`w-14 rounded-lg px-2 py-1 text-center font-bold text-xs transition-colors focus:outline-none ${
                              isDuplicate
                                ? 'border border-amber-500 bg-amber-950/40 text-amber-200'
                                : entry.placement === 1
                                ? 'border border-amber-500/60 bg-zinc-900 text-amber-300'
                                : 'border border-white/[0.08] bg-zinc-900 text-white focus:border-zinc-500'
                            }`}
                          />
                        </td>

                        {/* Kills Input with +/- Stepper */}
                        <td className="py-2 px-2 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleAdjustKills(team.id, -1)}
                              className="h-6 w-6 rounded-md border border-white/[0.08] bg-zinc-900 text-xs font-bold text-zinc-400 hover:bg-zinc-800 hover:text-white"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              value={entry.kills}
                              onChange={(e) =>
                                handleKillsChange(team.id, e.target.value)
                              }
                              className="w-10 rounded-md border border-white/[0.08] bg-zinc-900 py-1 text-center font-semibold text-xs text-white focus:outline-none font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => handleAdjustKills(team.id, 1)}
                              className="h-6 w-6 rounded-md border border-white/[0.08] bg-zinc-900 text-xs font-bold text-zinc-400 hover:bg-zinc-800 hover:text-white"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Match Pts */}
                        <td className="py-2.5 pr-3 pl-2 text-right font-mono font-bold text-xs">
                          <span
                            className={
                              totalMatchPts > 0 ? 'text-zinc-200' : 'text-zinc-600'
                            }
                          >
                            {totalMatchPts}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Live Standings Leaderboard */}
        <div className="lg:col-span-5">
          <div className="sticky top-16">
            <LiveStandingsPanel />
          </div>
        </div>
      </div>
    </div>
  );
};
