import { describe, expect, it } from 'vitest';
import {
  buildSwapOrAssignRankBatch,
  computeMatchScorecardSummary,
  snapshotMatchEntries,
} from '../scorecardHelpers';
import type { Match, Team } from '../../types/tournament';

const TEAMS: Team[] = [
  { id: 't1', name: 'BDR Esports' },
  { id: 't2', name: 'EVOS Divine' },
  { id: 't3', name: 'VNX Squad' },
  { id: 't4', name: 'EPE Gaming' },
];

function makeMatch(
  entries: Record<string, { placement: number | null; kills: number }>
): Match {
  const fullEntries: Match['entries'] = {};
  for (const t of TEAMS) {
    fullEntries[t.id] = {
      teamId: t.id,
      placement: entries[t.id]?.placement ?? null,
      kills: entries[t.id]?.kills ?? 0,
    };
  }
  return {
    id: 'm1',
    matchNumber: 1,
    entries: fullEntries,
    isCompleted: false,
    createdAt: 1000,
  };
}

describe('Match Scorecard Summary & Rank Swap Helpers', () => {
  it('computes ranked count, total kills, missing ranks, and ordered placed rows', () => {
    const match = makeMatch({
      t1: { placement: 2, kills: 6 },
      t2: { placement: 1, kills: 11 },
      t3: { placement: null, kills: 0 },
      t4: { placement: null, kills: 3 },
    });

    const summary = computeMatchScorecardSummary(TEAMS, match);
    expect(summary.rankedCount).toBe(2);
    expect(summary.totalKills).toBe(20);
    expect(summary.hasErrors).toBe(false);
    expect(summary.nextOpenRank).toBe(3);
    expect(summary.unassignedRanks).toEqual([3, 4]);
    expect(summary.unplacedTeams.map((t) => t.id)).toEqual(['t3', 't4']);
    expect(summary.placedRows.map((r) => `${r.rank}:${r.team.id}`)).toEqual([
      '1:t2',
      '2:t1',
    ]);
  });

  it('atomically swaps placements between two placed squads while preserving kills', () => {
    const match = makeMatch({
      t1: { placement: 1, kills: 14 },
      t2: { placement: 3, kills: 7 },
      t3: { placement: 2, kills: 4 },
      t4: { placement: 4, kills: 1 },
    });

    const swapUpdates = buildSwapOrAssignRankBatch({
      teams: TEAMS,
      match,
      targetTeamId: 't2',
      targetRank: 1,
    });

    expect(swapUpdates).toEqual([
      { teamId: 't2', placement: 1, kills: 7 },
      { teamId: 't1', placement: 3, kills: 14 },
    ]);
  });

  it('snapshots full match entries for clean Undo recovery', () => {
    const match = makeMatch({
      t1: { placement: 1, kills: 9 },
      t2: { placement: 2, kills: 5 },
    });

    expect(snapshotMatchEntries(TEAMS, match)).toEqual([
      { teamId: 't1', placement: 1, kills: 9 },
      { teamId: 't2', placement: 2, kills: 5 },
      { teamId: 't3', placement: null, kills: 0 },
      { teamId: 't4', placement: null, kills: 0 },
    ]);
  });
});
