import type {
  Match,
  PointSystemConfig,
  StandingsResult,
  Team,
  TeamCumulativeStanding,
  TeamMatchResult,
  TeamRushStatus,
  TieBreakCriterion,
  TournamentSettings,
} from '../types/tournament';

export const DEFAULT_PLACEMENT_POINTS: number[] = [
  12, // 1st
  9,  // 2nd
  8,  // 3rd
  7,  // 4th
  6,  // 5th
  5,  // 6th
  4,  // 7th
  3,  // 8th
  2,  // 9th
  1,  // 10th
  0,  // 11th
  0,  // 12th
  0,  // 13th
  0,  // 14th
  0,  // 15th
  0,  // 16th
  0,  // 17th
  0,  // 18th
  0,  // 19th
  0,  // 20th
];

export const DEFAULT_TIE_BREAK_ORDER: TieBreakCriterion[] = [
  'totalPoints',
  'booyahs',
  'placementPoints',
  'kills',
  'lastMatchPlacement',
];

/**
 * Calculates placement points for a given 1-based finish rank.
 */
export function getPlacementPoints(placement: number | null, config: PointSystemConfig): number {
  if (!placement || placement < 1) return 0;
  const index = placement - 1;
  if (index < config.placementPoints.length) {
    return config.placementPoints[index] ?? 0;
  }
  return 0;
}

/**
 * Calculates kill points for a given kill count.
 */
export function getKillPoints(kills: number, config: PointSystemConfig): number {
  if (kills < 0) return 0;
  return kills * config.killPoints;
}

/**
 * Calculates match result for a single team in a single match.
 */
export function calculateTeamMatchResult(
  teamId: string,
  placement: number | null,
  kills: number,
  config: PointSystemConfig
): TeamMatchResult {
  const safePlacement = placement && placement > 0 ? placement : 0;
  const placementPoints = getPlacementPoints(safePlacement, config);
  const killPoints = getKillPoints(kills, config);
  const totalPoints = placementPoints + killPoints;
  const isBooyah = safePlacement === 1;

  return {
    teamId,
    placement: safePlacement,
    placementPoints,
    kills,
    killPoints,
    totalPoints,
    isBooyah,
  };
}

/**
 * Tie-break comparator according to custom tie-break order.
 */
export function compareTeams(
  a: TeamCumulativeStanding,
  b: TeamCumulativeStanding,
  tieBreakOrder: TieBreakCriterion[]
): number {
  // If one of them is the crowned champion, champion is always #1
  const aIsChampion = a.rushStatus.status === 'CHAMPION';
  const bIsChampion = b.rushStatus.status === 'CHAMPION';
  if (aIsChampion && !bIsChampion) return -1;
  if (!aIsChampion && bIsChampion) return 1;

  for (const criterion of tieBreakOrder) {
    switch (criterion) {
      case 'totalPoints':
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        break;
      case 'booyahs':
        if (b.booyahCount !== a.booyahCount) {
          return b.booyahCount - a.booyahCount;
        }
        break;
      case 'placementPoints':
        if (b.placementPoints !== a.placementPoints) {
          return b.placementPoints - a.placementPoints;
        }
        break;
      case 'kills':
        if (b.kills !== a.kills) {
          return b.kills - a.kills;
        }
        break;
      case 'lastMatchPlacement': {
        const placeA = a.lastMatchPlacement > 0 ? a.lastMatchPlacement : 999;
        const placeB = b.lastMatchPlacement > 0 ? b.lastMatchPlacement : 999;
        if (placeA !== placeB) {
          return placeA - placeB; // Lower finish rank is better (1st is best)
        }
        break;
      }
    }
  }

  // Fallback stable sort by team name
  return a.teamName.localeCompare(b.teamName);
}

/**
 * Calculates cumulative standings across all completed matches,
 * supporting Scrim and Champion Rush rules, dynamic past-match edits,
 * and custom tie-breakers.
 */
export function calculateTournamentStandings(
  teams: Team[],
  matches: Match[],
  settings: TournamentSettings
): StandingsResult {
  const targetPoints = settings.championRush.targetPoints;
  const maxMatches = settings.championRush.maxMatches;
  const allowSameMatch = settings.championRush.allowSameMatchBooyahActivation;

  // Initialize accumulators for each team
  interface Accumulator {
    teamId: string;
    teamName: string;
    logoUrl?: string;
    shortCode?: string;
    booyahCount: number;
    kills: number;
    killPoints: number;
    placementPoints: number;
    totalPoints: number;
    lastMatchPlacement: number;
    rushStatus: TeamRushStatus;
  }

  const teamMap = new Map<string, Team>();
  for (const t of teams) {
    teamMap.set(t.id, t);
  }

  const accumulators = new Map<string, Accumulator>();
  for (const t of teams) {
    accumulators.set(t.id, {
      teamId: t.id,
      teamName: t.name,
      logoUrl: t.logoUrl,
      shortCode: t.shortCode,
      booyahCount: 0,
      kills: 0,
      killPoints: 0,
      placementPoints: 0,
      totalPoints: 0,
      lastMatchPlacement: 0,
      rushStatus: { status: 'NOT_ACTIVE' },
    });
  }

  // Sort matches sequentially by matchNumber
  const sortedMatches = [...matches]
    .filter((m) => m.isCompleted)
    .sort((a, b) => a.matchNumber - b.matchNumber);

  let championTeamId: string | undefined = undefined;
  let tournamentConcluded = false;
  let conclusionReason: StandingsResult['conclusionReason'] = undefined;

  for (let mIdx = 0; mIdx < sortedMatches.length; mIdx++) {
    const match = sortedMatches[mIdx];
    const matchNum = match.matchNumber;

    // In Champion Rush, capture who was ALREADY active BEFORE this match started
    const activeBeforeMatch = new Set<string>();
    for (const [teamId, acc] of accumulators.entries()) {
      if (acc.rushStatus.status === 'ACTIVE') {
        activeBeforeMatch.add(teamId);
      }
    }

    // Process entries for this match
    for (const team of teams) {
      const entry = match.entries[team.id];
      const acc = accumulators.get(team.id)!;
      if (!entry || entry.placement === null) continue;

      const result = calculateTeamMatchResult(
        team.id,
        entry.placement,
        entry.kills,
        settings.pointSystem
      );

      acc.kills += result.kills;
      acc.killPoints += result.killPoints;
      acc.placementPoints += result.placementPoints;
      acc.totalPoints += result.totalPoints;
      if (result.isBooyah) {
        acc.booyahCount += 1;
      }
      acc.lastMatchPlacement = result.placement;
    }

    // Check Champion Rush condition for this match
    if (settings.mode === 'CHAMPION_RUSH' && !championTeamId) {
      for (const team of teams) {
        const entry = match.entries[team.id];
        if (!entry || entry.placement === null) continue;

        const gotBooyah = entry.placement === 1;
        const wasActiveBefore = activeBeforeMatch.has(team.id);
        const acc = accumulators.get(team.id)!;
        const reachedTargetAfterMatch = acc.totalPoints >= targetPoints;

        if (gotBooyah) {
          if (wasActiveBefore) {
            // Crown champion!
            acc.rushStatus = { status: 'CHAMPION', crownedAtMatch: matchNum };
            championTeamId = team.id;
            tournamentConcluded = true;
            conclusionReason = 'CHAMPION_CROWNED';
            break;
          } else if (allowSameMatch && reachedTargetAfterMatch) {
            // Same match activation toggle is ON
            acc.rushStatus = { status: 'CHAMPION', crownedAtMatch: matchNum };
            championTeamId = team.id;
            tournamentConcluded = true;
            conclusionReason = 'CHAMPION_CROWNED';
            break;
          }
        }
      }

      // If champion was crowned, stop processing subsequent matches (if any exist)
      if (championTeamId) {
        break;
      }

      // If no champion, check which teams have now crossed targetPoints to become active from NEXT match
      for (const team of teams) {
        const acc = accumulators.get(team.id)!;
        if (acc.rushStatus.status === 'NOT_ACTIVE' && acc.totalPoints >= targetPoints) {
          acc.rushStatus = { status: 'ACTIVE', activatedAtMatch: matchNum };
        }
      }

      // Check max matches reached
      if (matchNum >= maxMatches) {
        tournamentConcluded = true;
        conclusionReason = 'MAX_MATCHES_REACHED';
      }
    }
  }

  // Check Scrim conclusion
  if (settings.mode === 'SCRIM') {
    if (sortedMatches.length >= settings.totalMatchesPlanned) {
      tournamentConcluded = true;
      conclusionReason = 'SCRIM_COMPLETED';
    }
  }

  // Check Manual Organizer End
  if (settings.isManuallyEnded) {
    tournamentConcluded = true;
    if (!conclusionReason) {
      conclusionReason = 'ORGANIZER_ENDED';
    }
  }

  // Convert accumulators to standings
  const standingsList: TeamCumulativeStanding[] = Array.from(accumulators.values()).map(
    (acc) => {
      const progressToTarget =
        targetPoints > 0 ? Math.min(1, Math.max(0, acc.totalPoints / targetPoints)) : 0;

      return {
        teamId: acc.teamId,
        teamName: acc.teamName,
        logoUrl: acc.logoUrl,
        shortCode: acc.shortCode,
        rank: 0, // Assigned below
        booyahCount: acc.booyahCount,
        kills: acc.kills,
        killPoints: acc.killPoints,
        placementPoints: acc.placementPoints,
        totalPoints: acc.totalPoints,
        lastMatchPlacement: acc.lastMatchPlacement,
        rushStatus: acc.rushStatus,
        progressToTarget,
      };
    }
  );

  // Sort standings using the tie-break criteria
  standingsList.sort((a, b) => compareTeams(a, b, settings.tieBreakOrder));

  // Assign ranks (1..N)
  for (let i = 0; i < standingsList.length; i++) {
    standingsList[i].rank = i + 1;
  }

  return {
    standings: standingsList,
    championTeamId,
    tournamentConcluded,
    conclusionReason,
  };
}

/**
 * Calculates single-match standings for a specific match.
 */
export function calculateSingleMatchStandings(
  teams: Team[],
  match: Match,
  pointSystem: PointSystemConfig,
  tieBreakOrder: TieBreakCriterion[]
): TeamCumulativeStanding[] {
  const standings: TeamCumulativeStanding[] = teams.map((team) => {
    const entry = match.entries[team.id];
    const placement = entry?.placement ?? null;
    const kills = entry?.kills ?? 0;
    const res = calculateTeamMatchResult(team.id, placement, kills, pointSystem);

    return {
      teamId: team.id,
      teamName: team.name,
      logoUrl: team.logoUrl,
      shortCode: team.shortCode,
      rank: 0,
      booyahCount: res.isBooyah ? 1 : 0,
      kills: res.kills,
      killPoints: res.killPoints,
      placementPoints: res.placementPoints,
      totalPoints: res.totalPoints,
      lastMatchPlacement: res.placement,
      rushStatus: { status: 'NOT_ACTIVE' },
      progressToTarget: 0,
    };
  });

  standings.sort((a, b) => compareTeams(a, b, tieBreakOrder));

  for (let i = 0; i < standings.length; i++) {
    standings[i].rank = i + 1;
  }

  return standings;
}
