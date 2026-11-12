import React, { useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit3,
  Save,
  ArrowRight,
  Crown,
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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6 select-none animate-in fade-in duration-200">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Match Input Table (7 cols on desktop) */}
        <div className="space-y-5 lg:col-span-7">
          {/* Header Action Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-white/15 bg-gradient-to-r from-[#121522] via-[#0F121C] to-[#0D0F17] p-5 sm:p-6 shadow-2xl">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-display text-2xl sm:text-3xl font-black text-white uppercase tracking-wider">
                  MATCH {match.matchNumber} SCORECARD
                </h2>
                {match.isCompleted ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>RECORDED</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>SCORING ACTIVE</span>
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-neutral-400 mt-1">
                Assign finish placement (1-{teams.length}) and tap kills for each squad.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              {match.isCompleted ? (
                <button
                  type="button"
                  onClick={() => reopenMatch(match.id)}
                  className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/15 px-3.5 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-all active:scale-95"
                >
                  <Edit3 className="h-4 w-4 text-amber-400" />
                  <span>EDIT</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => completeMatch(match.id)}
                  disabled={hasErrors}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-2.5 text-xs font-black uppercase tracking-wider text-emerald-300 disabled:opacity-40 transition-all active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                >
                  <Save className="h-4 w-4 text-emerald-400" />
                  <span>SAVE</span>
                </button>
              )}

              {/* Primary Next Action */}
              <button
                type="button"
                onClick={handleSaveAndGoNextMatch}
                disabled={hasErrors}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-5 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider text-black hover:brightness-110 disabled:opacity-40 transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95"
              >
                <span>{nextMatchInList ? `NEXT (M${nextMatchInList.matchNumber})` : 'SAVE & NEXT'}</span>
                <ArrowRight className="h-4 w-4 ml-0.5" />
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
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-neutral-400 hover:text-red-400 hover:border-red-500/40 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Validation Banner */}
          {hasErrors && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-red-500/50 bg-red-950/40 p-4 text-xs font-bold text-red-200 shadow-lg">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
              <span>
                DUPLICATE RANK DETECTED:{' '}
                <strong className="text-white">
                  {Array.from(duplicatePlacements).map((p) => `#${p}`).join(', ')}
                </strong>
                . Each squad must have a unique finish placement!
              </span>
            </div>
          )}

          {/* Table Container */}
          <div className="overflow-hidden rounded-3xl border border-white/15 bg-[#121522] shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-black/50 text-[11px] font-black uppercase tracking-widest text-neutral-400">
                    <th className="py-3 pl-4 pr-2 w-10 text-center">#</th>
                    <th className="py-3 px-3">Squad Name</th>
                    <th className="py-3 px-2 w-28 text-center">Finish Rank</th>
                    <th className="py-3 px-2 w-36 text-center">Kills</th>
                    <th className="py-3 pr-4 pl-2 w-20 text-right">Match Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
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
                        className={`transition-colors hover:bg-white/5 ${
                          isBooyah ? 'bg-amber-500/10' : ''
                        }`}
                      >
                        {/* Index */}
                        <td className="py-3.5 pl-4 pr-2 text-center text-neutral-500 font-numbers font-bold">
                          {idx + 1}
                        </td>

                        {/* Squad name & logo */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-black/60 text-amber-300 font-black text-xs overflow-hidden border border-white/15 shadow-sm">
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
                            <span className="font-extrabold text-white text-sm truncate max-w-[150px] sm:max-w-[210px]">
                              {team.name}
                            </span>
                            {isBooyah && (
                              <span className="flex items-center gap-1 rounded-md bg-amber-500/20 border border-amber-500/50 px-2 py-0.5 text-[10px] font-black uppercase text-amber-300 shadow-[0_0_8px_#FACC15]">
                                <Crown className="h-3 w-3 text-amber-400" />
                                <span>BOOYAH</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Rank Input */}
                        <td className="py-3 px-2 text-center">
                          <input
                            type="number"
                            min={1}
                            max={teams.length}
                            value={entry.placement ?? ''}
                            onChange={(e) =>
                              handlePlacementChange(team.id, e.target.value)
                            }
                            placeholder="-"
                            className={`w-16 rounded-xl px-2.5 py-1.5 text-center font-numbers font-black text-sm transition-all focus:outline-none ${
                              isDuplicate
                                ? 'border-2 border-red-500 bg-red-950/60 text-red-200'
                                : entry.placement === 1
                                ? 'border-2 border-amber-400 bg-amber-950/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                                : 'border border-white/20 bg-black/50 text-white focus:border-amber-400'
                            }`}
                          />
                        </td>

                        {/* Kills Input with Large Tactile +/- Stepper */}
                        <td className="py-3 px-2 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-black/40 rounded-xl p-1 border border-white/10">
                            <button
                              type="button"
                              onClick={() => handleAdjustKills(team.id, -1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-sm font-black text-neutral-300 hover:bg-white/20 hover:text-white active:scale-95 transition-all"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <input
                              type="number"
                              min={0}
                              value={entry.kills}
                              onChange={(e) =>
                                handleKillsChange(team.id, e.target.value)
                              }
                              className="w-10 bg-transparent py-1 text-center font-numbers text-base font-black text-amber-300 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleAdjustKills(team.id, 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-sm font-black text-neutral-300 hover:bg-white/20 hover:text-white active:scale-95 transition-all"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Match Pts */}
                        <td className="py-3.5 pr-4 pl-2 text-right font-numbers font-black text-sm sm:text-base">
                          <span
                            className={
                              totalMatchPts > 0 ? 'text-amber-300 drop-shadow-[0_0_6px_rgba(245,158,11,0.3)]' : 'text-neutral-600'
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
          <div className="sticky top-24">
            <LiveStandingsPanel />
          </div>
        </div>
      </div>
    </div>
  );
};
