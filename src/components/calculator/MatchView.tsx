import React, { useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit3,
  Save,
  ArrowRight,
  Plus,
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

  // Validate duplicate placements and negative kills
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

  // Dedicated explicit helper: Save and immediately go to or create the next match
  const handleSaveAndGoNextMatch = () => {
    completeMatch(match.id);
    if (nextMatchInList) {
      setCurrentTab(nextMatchInList.id);
    } else {
      const newMatchId = createMatch();
      setCurrentTab(newMatchId);
    }
  };

  // Helper: Just add next match button
  const handleAddNewMatchOnly = () => {
    const newMatchId = createMatch();
    setCurrentTab(newMatchId);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      {/* Top Match Navigation Bar: Quick switcher between Match 1, 2, 3... + Add Next Match */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-800/80 bg-[#120D12] p-3 sm:px-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500 mr-1.5">
            Matches:
          </span>
          {matches.map((m) => {
            const isCurrent = m.id === match.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setCurrentTab(m.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-red-600 text-white shadow-md'
                    : m.isCompleted
                    ? 'bg-neutral-900 border border-neutral-800 text-emerald-400 hover:text-white'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span>Match {m.matchNumber}</span>
                {m.isCompleted && <CheckCircle2 className="h-3 w-3" />}
              </button>
            );
          })}

          {/* Simple "+ Add Match X" button directly on top */}
          <button
            type="button"
            onClick={handleAddNewMatchOnly}
            className="flex items-center gap-1 rounded-xl border border-dashed border-neutral-700 hover:border-red-500 bg-neutral-900/60 px-3 py-1.5 text-xs font-bold text-neutral-300 hover:text-white transition-all ml-1"
          >
            <Plus className="h-3.5 w-3.5 text-red-500" />
            <span>Add Match {matches.length + 1}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setCurrentTab('results')}
          className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 hover:bg-neutral-800 transition-colors"
        >
          View 4K Standings →
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Match Input Table */}
        <div className="space-y-4 lg:col-span-7">
          {/* Header Card */}
          <div className="flex flex-col gap-3 rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-[#161017] via-[#0F0C12] to-[#0A080C] p-5 sm:flex-row sm:items-center sm:justify-between shadow-xl">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-display text-2xl sm:text-3xl font-black tracking-wider text-white uppercase">
                  MATCH {match.matchNumber} RESULTS
                </h2>
                {match.isCompleted ? (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-950/90 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-800/60 shadow-sm">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>SAVED</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-full bg-amber-950/80 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-800/60 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>SCORING LIVE</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Enter finish rank (1–{teams.length}) and kills. Tab or Enter to cycle through squads.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {match.isCompleted ? (
                <button
                  type="button"
                  onClick={() => reopenMatch(match.id)}
                  className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-200 hover:bg-neutral-800 transition-colors shadow-sm"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Match</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => completeMatch(match.id)}
                  disabled={hasErrors}
                  className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-200 hover:bg-neutral-800 disabled:opacity-40 transition-colors shadow-sm"
                >
                  <Save className="h-4 w-4 text-emerald-400" />
                  <span>Save Match</span>
                </button>
              )}

              {/* Clear next match progression button */}
              <button
                type="button"
                onClick={handleSaveAndGoNextMatch}
                disabled={hasErrors}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-xs font-display font-black uppercase tracking-wider text-white hover:from-red-500 hover:to-rose-500 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md active:scale-95"
              >
                <span>
                  {nextMatchInList
                    ? `Save & Go to Match ${nextMatchInList.matchNumber}`
                    : `Save & Add Match ${matches.length + 1}`}
                </span>
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
                  className="rounded-xl border border-neutral-800 bg-neutral-900 p-2.5 text-neutral-400 hover:border-red-900 hover:bg-red-950/40 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Validation Warnings Banner */}
          {hasErrors && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-xs text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                Duplicate placement rank detected:{' '}
                <strong>
                  {Array.from(duplicatePlacements)
                    .map((p) => `#${p}`)
                    .join(', ')}
                </strong>
                . Each squad must have a unique finish rank.
              </span>
            </div>
          )}

          {/* Table Container */}
          <div className="overflow-hidden rounded-2xl border border-neutral-800/80 bg-[#120D12] shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-950/80 text-[11px] font-black uppercase tracking-wider text-neutral-400">
                    <th className="py-3 pl-4 pr-2 w-12 text-center">Rank</th>
                    <th className="py-3 px-3">Squad Name</th>
                    <th className="py-3 px-3 w-28 text-center">Placement</th>
                    <th className="py-3 px-3 w-32 text-center">Kills</th>
                    <th className="py-3 pr-4 pl-2 w-20 text-right">Match Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-body">
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
                        className={`transition-colors hover:bg-neutral-900/40 ${
                          isBooyah ? 'bg-amber-500/[0.04]' : ''
                        }`}
                      >
                        {/* Row Index */}
                        <td className="py-3 pl-4 pr-2 text-center font-display font-black text-neutral-500">
                          {idx + 1}
                        </td>

                        {/* Squad Name & Crest */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-800 bg-black text-amber-400 font-display font-black text-xs overflow-hidden">
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
                            <span className="font-bold text-white uppercase truncate max-w-[180px]">
                              {team.name}
                            </span>
                            {isBooyah && (
                              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-300 border border-amber-500/40">
                                BOOYAH
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Placement Input */}
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min={1}
                            max={teams.length}
                            value={entry.placement ?? ''}
                            onChange={(e) =>
                              handlePlacementChange(team.id, e.target.value)
                            }
                            placeholder="-"
                            className={`w-16 rounded-lg px-2 py-1.5 text-center font-black text-sm transition-all focus:outline-none ${
                              isDuplicate
                                ? 'border-2 border-amber-500 bg-amber-950/40 text-amber-200'
                                : entry.placement === 1
                                ? 'border border-amber-500/80 bg-neutral-900 text-amber-300'
                                : 'border border-neutral-700 bg-neutral-900 text-white focus:border-red-500'
                            }`}
                          />
                        </td>

                        {/* Kills Input with +/- Stepper */}
                        <td className="py-2 px-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleAdjustKills(team.id, -1)}
                              className="h-7 w-7 rounded-lg border border-neutral-800 bg-neutral-900 font-bold text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
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
                              className="w-12 rounded-lg border border-neutral-700 bg-neutral-900 py-1.5 text-center font-black text-sm text-white focus:border-red-500 focus:outline-none font-numbers"
                            />
                            <button
                              type="button"
                              onClick={() => handleAdjustKills(team.id, 1)}
                              className="h-7 w-7 rounded-lg border border-neutral-800 bg-neutral-900 font-bold text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Match Pts Total */}
                        <td className="py-3 pr-4 pl-2 text-right font-numbers font-black text-sm text-neutral-200">
                          <span
                            className={
                              totalMatchPts > 0 ? 'text-amber-400' : 'text-neutral-500'
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
