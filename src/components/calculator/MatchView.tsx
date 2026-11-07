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

  // Validate duplicate placements and negative kills
  const { duplicatePlacements, unassignedTeams, hasErrors } = useMemo(() => {
    const placementCounts = new Map<number, number>();
    let unassigned = 0;

    for (const team of teams) {
      const entry = match.entries[team.id];
      if (!entry || entry.placement === null || entry.placement === 0) {
        unassigned++;
      } else {
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
      unassignedTeams: unassigned,
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

  const handleSaveAndAdvance = () => {
    completeMatch(match.id);
    // Find next match or create new if not concluded
    const currentIndex = matches.findIndex((m) => m.id === match.id);
    if (currentIndex < matches.length - 1) {
      setCurrentTab(matches[currentIndex + 1].id);
    } else {
      const isConcluded =
        settings.mode === 'SCRIM'
          ? matches.length >= settings.totalMatchesPlanned
          : false;
      if (!isConcluded) {
        const nextId = createMatch();
        setCurrentTab(nextId);
      } else {
        setCurrentTab('results');
      }
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Match Input Table (7 cols on desktop) */}
        <div className="space-y-4 lg:col-span-7">
          {/* Header Card */}
          <div className="flex flex-col gap-3 rounded border border-neutral-800 bg-[#14080A] p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl tracking-wider text-neutral-100">
                  MATCH {match.matchNumber} RESULTS
                </h2>
                {match.isCompleted ? (
                  <span className="flex items-center gap-1 rounded bg-emerald-950/80 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-800/40">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>SAVED</span>
                  </span>
                ) : (
                  <span className="rounded bg-amber-950/80 px-2 py-0.5 text-xs font-bold text-amber-400 border border-amber-800/40">
                    IN PROGRESS
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Enter finish placement (1-{teams.length}) and kills for each squad. Tab/Enter to move fast.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {match.isCompleted ? (
                <button
                  type="button"
                  onClick={() => reopenMatch(match.id)}
                  className="flex items-center gap-1.5 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-200 hover:border-neutral-600 hover:bg-neutral-800 transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Match</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveAndAdvance}
                  disabled={hasErrors}
                  className="flex items-center gap-1.5 rounded bg-red-700 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-600 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Match</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => deleteMatch(match.id)}
                title="Delete this match"
                className="rounded border border-neutral-800 bg-neutral-900 p-2 text-neutral-400 hover:border-red-900 hover:bg-red-950/40 hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Inline Validation Banner */}
          {hasErrors && (
            <div className="flex items-center gap-2 rounded border border-red-700/60 bg-red-950/40 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>
                Duplicate placement detected: Position{' '}
                {Array.from(duplicatePlacements).join(', ')} assigned to multiple teams. Each position must be unique.
              </span>
            </div>
          )}

          {unassignedTeams > 0 && !match.isCompleted && (
            <div className="flex items-center justify-between rounded border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-xs text-neutral-400">
              <span>{unassignedTeams} squad{unassignedTeams > 1 ? 's' : ''} not yet assigned placement.</span>
              <span className="text-[11px] text-neutral-400">All teams can be scored.</span>
            </div>
          )}

          {/* Match Table */}
          <div className="rounded border border-neutral-800 bg-[#14080A] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-numbers">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-950/60 text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                    <th className="py-2.5 px-3">Team</th>
                    <th className="py-2.5 px-2 text-center w-24">Placement</th>
                    <th className="py-2.5 px-2 text-center w-20">Kills</th>
                    <th className="py-2.5 px-2 text-center">Pos Pts</th>
                    <th className="py-2.5 px-2 text-center">Kill Pts</th>
                    <th className="py-2.5 px-3 text-right">Match Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-850">
                  {teams.map((team, idx) => {
                    const entry = match.entries[team.id] || {
                      teamId: team.id,
                      placement: null,
                      kills: 0,
                    };
                    const isDuplicate =
                      entry.placement !== null && duplicatePlacements.has(entry.placement);
                    const posPts = getPlacementPoints(entry.placement, settings.pointSystem);
                    const killPts = getKillPoints(entry.kills, settings.pointSystem);
                    const totalPts = posPts + killPts;
                    const isBooyah = entry.placement === 1;

                    return (
                      <tr
                        key={team.id}
                        className={`transition-colors ${
                          isDuplicate
                            ? 'bg-red-950/40'
                            : isBooyah
                            ? 'bg-amber-950/20'
                            : 'hover:bg-neutral-900/50'
                        }`}
                      >
                        {/* Team Name & Avatar */}
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <span className="w-4 text-[10px] text-neutral-400 font-display">
                              {idx + 1}
                            </span>
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-black/70 text-[9px] font-bold text-red-400 overflow-hidden border border-neutral-800">
                              {team.logoUrl ? (
                                <img
                                  src={team.logoUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span>{team.shortCode || generateInitials(team.name)}</span>
                              )}
                            </div>
                            <div className="truncate font-semibold text-neutral-100 max-w-[140px] sm:max-w-[200px]">
                              {team.name}
                            </div>
                            {isBooyah && (
                              <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-bold uppercase text-amber-400 border border-amber-500/40">
                                Booyah
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Placement input */}
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min={1}
                            max={teams.length}
                            disabled={match.isCompleted}
                            value={entry.placement ?? ''}
                            onChange={(e) => handlePlacementChange(team.id, e.target.value)}
                            placeholder="-"
                            className={`w-16 rounded border px-2 py-1 text-center font-bold text-xs focus:outline-none transition-colors ${
                              isDuplicate
                                ? 'border-red-500 bg-red-950 text-red-200'
                                : entry.placement === 1
                                ? 'border-amber-500/70 bg-amber-950/40 text-amber-300'
                                : 'border-neutral-700 bg-neutral-900 text-neutral-100 focus:border-red-500'
                            }`}
                          />
                        </td>

                        {/* Kills input */}
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min={0}
                            disabled={match.isCompleted}
                            value={entry.kills}
                            onChange={(e) => handleKillsChange(team.id, e.target.value)}
                            className="w-16 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-center font-bold text-xs text-neutral-100 focus:border-red-500 focus:outline-none disabled:opacity-70"
                          />
                        </td>

                        {/* Pos Pts */}
                        <td className="py-2 px-2 text-center text-neutral-300 font-medium">
                          {posPts}
                        </td>

                        {/* Kill Pts */}
                        <td className="py-2 px-2 text-center text-neutral-300 font-medium">
                          {killPts}
                        </td>

                        {/* Total */}
                        <td className="py-2 px-3 text-right font-bold text-neutral-100 text-sm">
                          {totalPts}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Match Actions */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-neutral-800 bg-neutral-950/40 p-3">
              <div className="text-xs text-neutral-400">
                Placement points: 1st={settings.pointSystem.placementPoints[0] || 12} pts, 2nd={settings.pointSystem.placementPoints[1] || 9} pts. Kills: {settings.pointSystem.killPoints} pt/kill.
              </div>

              {!match.isCompleted && (
                <button
                  type="button"
                  onClick={handleSaveAndAdvance}
                  disabled={hasErrors}
                  className="flex items-center justify-center gap-2 rounded bg-red-700 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-600 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md shadow-red-950/50"
                >
                  <span>Save &amp; Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Standings (5 cols on desktop) */}
        <div className="lg:col-span-5">
          <LiveStandingsPanel />
        </div>
      </div>
    </div>
  );
};
