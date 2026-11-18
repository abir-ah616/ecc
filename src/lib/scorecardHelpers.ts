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

export type RapidWizardPhase = 'pick_team' | 'enter_kills' | 'done';

export interface RapidWizardSnapshot {
  entries: BatchEntryUpdate[];
  rank: number;
  phase: RapidWizardPhase;
  selectedTeamId: string | null;
  draftKills: number;
}

export interface RapidWizardState {
  rank: number;
  phase: RapidWizardPhase;
  selectedTeamId: string | null;
  draftKills: number;
  reverseStack: RapidWizardSnapshot[];
  redoStack: RapidWizardSnapshot[];
}

export function ordinalRankLabel(rank: number): string {
  const mod100 = rank % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${rank}th`;
  switch (rank % 10) {
    case 1:
      return `${rank}st`;
    case 2:
      return `${rank}nd`;
    case 3:
      return `${rank}rd`;
    default:
      return `${rank}th`;
  }
}

export function rapidPromptHeadline(rank: number): string {
  if (rank === 1) return 'Which team took Booyah?';
  return `Which team placed ${ordinalRankLabel(rank)}?`;
}

export function createInitialRapidState(
  teams: Team[],
  match: Match
): RapidWizardState {
  const summary = computeMatchScorecardSummary(teams, match);
  if (
    match.isCompleted ||
    summary.unassignedRanks.length === 0 ||
    summary.unplacedTeams.length === 0
  ) {
    return {
      rank: teams.length,
      phase: 'done',
      selectedTeamId: null,
      draftKills: 0,
      reverseStack: [],
      redoStack: [],
    };
  }
  const nextRank = summary.unassignedRanks[0];
  if (
    summary.unassignedRanks.length === 1 &&
    summary.unplacedTeams.length === 1
  ) {
    const onlyTeam = summary.unplacedTeams[0];
    return {
      rank: nextRank,
      phase: 'enter_kills',
      selectedTeamId: onlyTeam.id,
      draftKills: match.entries[onlyTeam.id]?.kills ?? 0,
      reverseStack: [],
      redoStack: [],
    };
  }
  return {
    rank: nextRank,
    phase: 'pick_team',
    selectedTeamId: null,
    draftKills: 0,
    reverseStack: [],
    redoStack: [],
  };
}

export function pickRapidTeam(params: {
  state: RapidWizardState;
  teams: Team[];
  match: Match;
  teamId: string;
}): { nextState: RapidWizardState; updates: BatchEntryUpdate[] } {
  const { state, teams, match, teamId } = params;
  const prevSnapshot: RapidWizardSnapshot = {
    entries: snapshotMatchEntries(teams, match),
    rank: state.rank,
    phase: 'pick_team',
    selectedTeamId: null,
    draftKills: 0,
  };
  const updates = buildSwapOrAssignRankBatch({
    teams,
    match,
    targetTeamId: teamId,
    targetRank: state.rank,
  });
  const currentKills = match.entries[teamId]?.kills ?? 0;

  return {
    nextState: {
      rank: state.rank,
      phase: 'enter_kills',
      selectedTeamId: teamId,
      draftKills: currentKills,
      reverseStack: [...state.reverseStack, prevSnapshot],
      redoStack: [],
    },
    updates,
  };
}

export function confirmRapidKills(params: {
  state: RapidWizardState;
  teams: Team[];
  match: Match;
}): {
  nextState: RapidWizardState;
  updates: BatchEntryUpdate[];
  completedAll: boolean;
} {
  const { state, teams, match } = params;
  const teamId = state.selectedTeamId;
  if (!teamId) {
    return { nextState: state, updates: [], completedAll: false };
  }

  const prevSnapshot: RapidWizardSnapshot = {
    entries: snapshotMatchEntries(teams, match),
    rank: state.rank,
    phase: 'enter_kills',
    selectedTeamId: teamId,
    draftKills: state.draftKills,
  };

  const sanitizedKills = Math.max(0, Math.floor(state.draftKills));
  const committedUpdate: BatchEntryUpdate = {
    teamId,
    placement: state.rank,
    kills: sanitizedKills,
  };

  // Simulate post-commit entries to see what ranks/teams remain
  const simulatedMatch: Match = {
    ...match,
    entries: {
      ...match.entries,
      [teamId]: committedUpdate,
    },
  };
  const summary = computeMatchScorecardSummary(teams, simulatedMatch);

  if (
    summary.unassignedRanks.length === 0 ||
    summary.unplacedTeams.length === 0
  ) {
    return {
      nextState: {
        rank: state.rank,
        phase: 'done',
        selectedTeamId: null,
        draftKills: 0,
        reverseStack: [...state.reverseStack, prevSnapshot],
        redoStack: [],
      },
      updates: [committedUpdate],
      completedAll: true,
    };
  }

  const nextRank = summary.unassignedRanks[0];
  // If only 1 unplaced team and 1 open rank remain, assign it automatically and ask its Total Kills?
  if (
    summary.unassignedRanks.length === 1 &&
    summary.unplacedTeams.length === 1
  ) {
    const soleTeam = summary.unplacedTeams[0];
    const soleUpdate: BatchEntryUpdate = {
      teamId: soleTeam.id,
      placement: nextRank,
      kills: match.entries[soleTeam.id]?.kills ?? 0,
    };
    return {
      nextState: {
        rank: nextRank,
        phase: 'enter_kills',
        selectedTeamId: soleTeam.id,
        draftKills: soleUpdate.kills,
        reverseStack: [...state.reverseStack, prevSnapshot],
        redoStack: [],
      },
      updates: [committedUpdate, soleUpdate],
      completedAll: false,
    };
  }

  return {
    nextState: {
      rank: nextRank,
      phase: 'pick_team',
      selectedTeamId: null,
      draftKills: 0,
      reverseStack: [...state.reverseStack, prevSnapshot],
      redoStack: [],
    },
    updates: [committedUpdate],
    completedAll: false,
  };
}

export function reverseRapidStep(params: {
  state: RapidWizardState;
  teams: Team[];
  match: Match;
}): { nextState: RapidWizardState; updates: BatchEntryUpdate[] } | null {
  const { state, teams, match } = params;
  if (state.reverseStack.length === 0) return null;

  const target = state.reverseStack[state.reverseStack.length - 1];
  const redoSnap: RapidWizardSnapshot = {
    entries: snapshotMatchEntries(teams, match),
    rank: state.rank,
    phase: state.phase,
    selectedTeamId: state.selectedTeamId,
    draftKills: state.draftKills,
  };

  return {
    nextState: {
      rank: target.rank,
      phase: target.phase,
      selectedTeamId: target.selectedTeamId,
      draftKills: target.draftKills,
      reverseStack: state.reverseStack.slice(0, -1),
      redoStack: [...state.redoStack, redoSnap],
    },
    updates: target.entries,
  };
}

export function redoRapidStep(params: {
  state: RapidWizardState;
  teams: Team[];
  match: Match;
}): { nextState: RapidWizardState; updates: BatchEntryUpdate[] } | null {
  const { state, teams, match } = params;
  if (state.redoStack.length === 0) return null;

  const target = state.redoStack[state.redoStack.length - 1];
  const reverseSnap: RapidWizardSnapshot = {
    entries: snapshotMatchEntries(teams, match),
    rank: state.rank,
    phase: state.phase,
    selectedTeamId: state.selectedTeamId,
    draftKills: state.draftKills,
  };

  return {
    nextState: {
      rank: target.rank,
      phase: target.phase,
      selectedTeamId: target.selectedTeamId,
      draftKills: target.draftKills,
      reverseStack: [...state.reverseStack, reverseSnap],
      redoStack: state.redoStack.slice(0, -1),
    },
    updates: target.entries,
  };
}
