import React, { useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit3,
  Save,
  ArrowRight,
  Plus,
  Minus,
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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6 select-none">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Match Input Table (7 cols on desktop) */}
        <div className="space-y-4 lg:col-span-7">
          {/* Header Action Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-neutral-800 bg-[#11131A] p-4 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-white uppercase tracking-wide">
                  Match {match.matchNumber} Scorecard
                </h2>
                {match.isCompleted ? (
                  <span className="flex items-center gap-1 rounded bg-emerald-950/40 border border-emerald-900/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Saved</span>
                  </span>
                ) : (
                  <span className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] font-semibold text-neutral-400">
                    In Progress
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Enter finish rank (1-{teams.length}) and kills for each squad.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {match.isCompleted ? (
                <button
                  type="button"
                  onClick={() => reopenMatch(match.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-300 transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Edit</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => completeMatch(match.id)}
                  disabled={hasErrors}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-300 disabled:opacity-40 transition-colors"
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
                className="flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-40 transition-colors shadow-sm"
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
                  className="rounded p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Validation Banner */}
          {hasErrors && (
            <div className="flex items-center gap-2 rounded-lg border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
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
          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#11131A] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-950/40 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    <th className="py-2.5 pl-3 pr-2 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Squad Name</th>
                    <th className="py-2.5 px-2 w-24 text-center">Rank</th>
                    <th className="py-2.5 px-2 w-32 text-center">Kills</th>
                    <th className="py-2.5 pr-4 pl-2 w-16 text-right">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-sans">
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
                        className={`transition-colors hover:bg-neutral-800/20 ${
                          isBooyah ? 'bg-amber-500/5' : ''
                        }`}
                      >
                        {/* Index */}
                        <td className="py-2.5 pl-3 pr-2 text-center text-neutral-500 font-mono">
                          {idx + 1}
                        </td>

                        {/* Squad name & logo */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-neutral-950 text-neutral-300 font-bold text-xs overflow-hidden border border-neutral-800">
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
                            <span className="font-semibold text-white truncate max-w-[150px] sm:max-w-[200px]">
                              {team.name}
                            </span>
                            {isBooyah && (
                              <span className="rounded bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-bold uppercase text-amber-400 border border-amber-500/20">
                                Booyah
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Rank Input - Clean box without browser spinner arrows */}
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
                            className={`w-12 h-7 rounded border text-center font-bold text-xs focus:outline-none transition-colors ${
                              isDuplicate
                                ? 'border-red-500 bg-red-950/40 text-red-300'
                                : entry.placement === 1
                                ? 'border-amber-500/80 bg-neutral-900 text-amber-300'
                                : 'border-neutral-700 bg-neutral-900 text-white focus:border-neutral-500'
                            }`}
                          />
                        </td>

                        {/* Kills Input with Clean Stepper */}
                        <td className="py-2 px-2 text-center">
                          <div className="inline-flex items-center rounded border border-neutral-700 bg-neutral-900">
                            <button
                              type="button"
                              onClick={() => handleAdjustKills(team.id, -1)}
                              className="h-7 w-7 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <input
                              type="number"
                              min={0}
                              value={entry.kills}
                              onChange={(e) =>
                                handleKillsChange(team.id, e.target.value)
                              }
                              className="w-8 py-0.5 text-center font-bold text-xs text-white bg-transparent focus:outline-none font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => handleAdjustKills(team.id, 1)}
                              className="h-7 w-7 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </td>

                        {/* Match Pts */}
                        <td className="py-2.5 pr-4 pl-2 text-right font-mono font-bold text-xs">
                          <span
                            className={
                              totalMatchPts > 0 ? 'text-white' : 'text-neutral-500'
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
          <div className="sticky top-4">
            <LiveStandingsPanel />
          </div>
        </div>
      </div>
    </div>
  );
};
