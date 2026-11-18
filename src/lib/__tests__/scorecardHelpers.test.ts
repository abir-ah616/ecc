import { describe, expect, it } from 'vitest';
import {
  buildSwapOrAssignRankBatch,
  computeMatchScorecardSummary,
  confirmRapidKills,
  createInitialRapidState,
  pickRapidTeam,
  rapidPromptHeadline,
  redoRapidStep,
  reverseRapidStep,
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

describe('Guided Rapid Wizard State Machine (Booyah -> Total Kills? -> Reverse/Redo)', () => {
  it('walks Booyah -> 2nd -> 3rd -> auto-4th with accurate Reverse and Redo stacks', () => {
    let match = makeMatch({});
    const applyUpdates = (
      m: Match,
      updates: Array<{ teamId: string; placement: number | null; kills: number }>
    ): Match => {
      const nextEntries = { ...m.entries };
      for (const u of updates) {
        nextEntries[u.teamId] = { ...u };
      }
      return { ...m, entries: nextEntries };
    };

    let wiz = createInitialRapidState(TEAMS, match);
    expect(wiz.rank).toBe(1);
    expect(wiz.phase).toBe('pick_team');
    expect(rapidPromptHeadline(wiz.rank)).toBe('Which team took Booyah?');

    // Pick #1 Booyah (t1) -> opens Total Kills?
    const p1 = pickRapidTeam({ state: wiz, teams: TEAMS, match, teamId: 't1' });
    match = applyUpdates(match, p1.updates);
    wiz = { ...p1.nextState, draftKills: 11 };
    expect(wiz.phase).toBe('enter_kills');
    expect(wiz.selectedTeamId).toBe('t1');

    // Confirm #1 kills -> asks "Which team placed 2nd?"
    const c1 = confirmRapidKills({ state: wiz, teams: TEAMS, match });
    match = applyUpdates(match, c1.updates);
    wiz = c1.nextState;
    expect(c1.completedAll).toBe(false);
    expect(wiz.rank).toBe(2);
    expect(wiz.phase).toBe('pick_team');
    expect(rapidPromptHeadline(wiz.rank)).toBe('Which team placed 2nd?');
    expect(match.entries.t1).toEqual({ teamId: 't1', placement: 1, kills: 11 });

    // Reverse from #2 pick goes back to #1 Total Kills? with 11 preserved
    const rev1 = reverseRapidStep({ state: wiz, teams: TEAMS, match })!;
    expect(rev1).not.toBeNull();
    match = applyUpdates(match, rev1.updates);
    wiz = rev1.nextState;
    expect(wiz.rank).toBe(1);
    expect(wiz.phase).toBe('enter_kills');
    expect(wiz.draftKills).toBe(11);

    // Reverse again returns to "Which team took Booyah?" and clears t1 placement
    const rev2 = reverseRapidStep({ state: wiz, teams: TEAMS, match })!;
    match = applyUpdates(match, rev2.updates);
    wiz = rev2.nextState;
    expect(wiz.rank).toBe(1);
    expect(wiz.phase).toBe('pick_team');
    expect(match.entries.t1.placement).toBeNull();

    // Redo x2 restores #1 (t1, 11 kills) and lands on 2nd pick
    const redo1 = redoRapidStep({ state: wiz, teams: TEAMS, match })!;
    match = applyUpdates(match, redo1.updates);
    wiz = redo1.nextState;
    const redo2 = redoRapidStep({ state: wiz, teams: TEAMS, match })!;
    match = applyUpdates(match, redo2.updates);
    wiz = redo2.nextState;
    expect(wiz.rank).toBe(2);
    expect(wiz.phase).toBe('pick_team');
    expect(match.entries.t1).toEqual({ teamId: 't1', placement: 1, kills: 11 });

    // Complete 2nd (t2, 6 kills), 3rd (t3, 4 kills -> auto-loads 4th t4), and 4th (t4, 2 kills)
    const p2 = pickRapidTeam({ state: wiz, teams: TEAMS, match, teamId: 't2' });
    match = applyUpdates(match, p2.updates);
    const c2 = confirmRapidKills({
      state: { ...p2.nextState, draftKills: 6 },
      teams: TEAMS,
      match,
    });
    match = applyUpdates(match, c2.updates);
    wiz = c2.nextState;
    expect(wiz.rank).toBe(3);

    const p3 = pickRapidTeam({ state: wiz, teams: TEAMS, match, teamId: 't3' });
    match = applyUpdates(match, p3.updates);
    const c3 = confirmRapidKills({
      state: { ...p3.nextState, draftKills: 4 },
      teams: TEAMS,
      match,
    });
    match = applyUpdates(match, c3.updates);
    wiz = c3.nextState;
    // Sole remaining 4th team (t4) auto-opens in Total Kills?
    expect(wiz.rank).toBe(4);
    expect(wiz.phase).toBe('enter_kills');
    expect(wiz.selectedTeamId).toBe('t4');

    const c4 = confirmRapidKills({
      state: { ...wiz, draftKills: 2 },
      teams: TEAMS,
      match,
    });
    match = applyUpdates(match, c4.updates);
    expect(c4.completedAll).toBe(true);
    expect(c4.nextState.phase).toBe('done');
    expect(match.entries.t4).toEqual({ teamId: 't4', placement: 4, kills: 2 });
  });
});
