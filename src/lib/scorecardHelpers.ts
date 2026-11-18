import type { Match, Team, TeamMatchEntry } from '../types/tournament';

export interface PlacedScorecardRow {
  rank: number;
  team: Team;
  entry: TeamMatchEntry;
}

export interface MatchScorecardSummary {
  rankedCount: number;
  totalKills: number;
  duplicatePlacements: Set<number>;
  unassignedRanks: number[];
  nextOpenRank: number | null;
  teamByRank: Map<number, string>;
  unplacedTeams: Team[];
  placedRows: PlacedScorecardRow[];
  hasErrors: boolean;
}

export interface BatchEntryUpdate {
  teamId: string;
  placement: number | null;
  kills: number;
}

/**
 * Derives placement validation, live kill totals, unplaced squads, and ordered placed rows
 * from the active match scorecard.
 */
export function computeMatchScorecardSummary(
  teams: Team[],
  match: Match
): MatchScorecardSummary {
  const placementCounts = new Map<number, number>();
  const assignedRanks = new Set<number>();
  const teamByRank = new Map<number, string>();
  const unplacedTeams: Team[] = [];
  const placedRows: PlacedScorecardRow[] = [];

  let rankedCount = 0;
  let totalKills = 0;

  for (const team of teams) {
    const entry: TeamMatchEntry = match.entries[team.id] || {
      teamId: team.id,
      placement: null,
      kills: 0,
    };
    const kills = Math.max(0, entry.kills || 0);
    totalKills += kills;

    const p = entry.placement;
    if (p !== null && p !== undefined && p >= 1 && p <= teams.length) {
      rankedCount += 1;
      assignedRanks.add(p);
      if (!teamByRank.has(p)) {
        teamByRank.set(p, team.id);
      }
      placementCounts.set(p, (placementCounts.get(p) || 0) + 1);
      placedRows.push({ rank: p, team, entry: { ...entry, kills } });
    } else {
      unplacedTeams.push(team);
    }
  }

  placedRows.sort((a, b) => a.rank - b.rank);

  const duplicatePlacements = new Set<number>();
  for (const [place, count] of placementCounts.entries()) {
    if (count > 1) duplicatePlacements.add(place);
  }

  const unassignedRanks: number[] = [];
  for (let rank = 1; rank <= teams.length; rank += 1) {
    if (!assignedRanks.has(rank)) unassignedRanks.push(rank);
  }

  return {
    rankedCount,
    totalKills,
    duplicatePlacements,
    unassignedRanks,
    nextOpenRank: unassignedRanks[0] ?? null,
    teamByRank,
    unplacedTeams,
    placedRows,
    hasErrors: duplicatePlacements.size > 0,
  };
}

/**
 * Produces an atomic batch update assigning `targetRank` to `targetTeamId`.
 * If another team currently holds `targetRank`, both teams swap placements while
 * preserving their individual kill counts.
 */
export function buildSwapOrAssignRankBatch(params: {
  teams: Team[];
  match: Match;
  targetTeamId: string;
  targetRank: number | null;
}): BatchEntryUpdate[] {
  const { teams, match, targetTeamId, targetRank } = params;
  const targetEntry = match.entries[targetTeamId];
  const prevTargetRank = targetEntry?.placement ?? null;

  const updates: BatchEntryUpdate[] = [
    {
      teamId: targetTeamId,
      placement: targetRank,
      kills: targetEntry?.kills ?? 0,
    },
  ];

  if (targetRank !== null && targetRank !== prevTargetRank) {
    for (const tm of teams) {
      if (tm.id === targetTeamId) continue;
      const occupantEntry = match.entries[tm.id];
      if (occupantEntry?.placement === targetRank) {
        updates.push({
          teamId: tm.id,
          placement: prevTargetRank,
          kills: occupantEntry.kills ?? 0,
        });
      }
    }
  }

  return updates;
}

/**
 * Snapshots all team placements and kills in the match for single-step Undo.
 */
export function snapshotMatchEntries(
  teams: Team[],
  match: Match
): BatchEntryUpdate[] {
  return teams.map((t) => {
    const entry = match.entries[t.id];
    return {
      teamId: t.id,
      placement: entry?.placement ?? null,
      kills: entry?.kills ?? 0,
    };
  });
}
