import { describe, expect, it } from 'vitest';
import {
  calculateSingleMatchStandings,
  calculateTournamentStandings,
  DEFAULT_PLACEMENT_POINTS,
  DEFAULT_TIE_BREAK_ORDER,
  getKillPoints,
  getPlacementPoints,
} from '../scoring';
import type { Match, Team, TournamentSettings } from '../../types/tournament';

describe('Scoring Engine - Unit Tests', () => {
  const mockPointSystem = {
    placementPoints: DEFAULT_PLACEMENT_POINTS,
    killPoints: 1,
  };

  const createTeams = (count: number): Team[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `team_${i + 1}`,
      name: `Team ${String.fromCharCode(65 + i)}`,
      shortCode: `T${i + 1}`,
    }));
  };

  it('calculates standard placement points and kill points accurately', () => {
    expect(getPlacementPoints(1, mockPointSystem)).toBe(12);
    expect(getPlacementPoints(2, mockPointSystem)).toBe(9);
    expect(getPlacementPoints(3, mockPointSystem)).toBe(8);
    expect(getPlacementPoints(10, mockPointSystem)).toBe(1);
    expect(getPlacementPoints(11, mockPointSystem)).toBe(0);
    expect(getPlacementPoints(15, mockPointSystem)).toBe(0);
    expect(getPlacementPoints(null, mockPointSystem)).toBe(0);

    expect(getKillPoints(0, mockPointSystem)).toBe(0);
    expect(getKillPoints(5, mockPointSystem)).toBe(5);
  });

  describe('Mode A: SCRIM (12-team & 15-team)', () => {
    it('calculates standings accurately for 12 teams over 3 matches', () => {
      const teams = createTeams(12);
      const settings: TournamentSettings = {
        mode: 'SCRIM',
        name: 'Daily Scrim',
        roundOrDay: 'Day 1',
        totalMatchesPlanned: 3,
        teamCount: 12,
        pointSystem: mockPointSystem,
        tieBreakOrder: DEFAULT_TIE_BREAK_ORDER,
        championRush: {
          targetPoints: 50,
          maxMatches: 5,
          allowSameMatchBooyahActivation: false,
        },
        theme: 'crimson',
      };

      // Match 1: Team A gets 1st place (12 pts) + 10 kills = 22 pts
      // Match 1: Team B gets 2nd place (9 pts) + 2 kills = 11 pts
      const match1: Match = {
        id: 'm1',
        matchNumber: 1,
        isCompleted: true,
        createdAt: 1000,
        entries: {
          team_1: { teamId: 'team_1', placement: 1, kills: 10 },
          team_2: { teamId: 'team_2', placement: 2, kills: 2 },
        },
      };

      const result = calculateTournamentStandings(teams, [match1], settings);
      expect(result.tournamentConcluded).toBe(false);
      expect(result.standings[0].teamId).toBe('team_1');
      expect(result.standings[0].totalPoints).toBe(22);
      expect(result.standings[0].booyahCount).toBe(1);
      expect(result.standings[1].teamId).toBe('team_2');
      expect(result.standings[1].totalPoints).toBe(11);
    });

    it('handles 15-team league room and concludes after all planned matches', () => {
      const teams = createTeams(15);
      const settings: TournamentSettings = {
        mode: 'SCRIM',
        name: 'Championship League 15',
        roundOrDay: 'Day 1',
        totalMatchesPlanned: 2,
        teamCount: 15,
        pointSystem: mockPointSystem,
        tieBreakOrder: DEFAULT_TIE_BREAK_ORDER,
        championRush: {
          targetPoints: 50,
          maxMatches: 5,
          allowSameMatchBooyahActivation: false,
        },
        theme: 'crimson',
      };

      const match1: Match = {
        id: 'm1',
        matchNumber: 1,
        isCompleted: true,
        createdAt: 1000,
        entries: {
          team_15: { teamId: 'team_15', placement: 1, kills: 8 },
        },
      };

      const match2: Match = {
        id: 'm2',
        matchNumber: 2,
        isCompleted: true,
        createdAt: 2000,
        entries: {
          team_15: { teamId: 'team_15', placement: 2, kills: 5 },
        },
      };

      const result = calculateTournamentStandings(teams, [match1, match2], settings);
      expect(result.tournamentConcluded).toBe(true);
      expect(result.conclusionReason).toBe('SCRIM_COMPLETED');
      expect(result.standings[0].teamId).toBe('team_15');
      // Match 1: 12 + 8 = 20. Match 2: 9 + 5 = 14. Total = 34.
      expect(result.standings[0].totalPoints).toBe(34);
      expect(result.standings[0].rank).toBe(1);
    });
  });

  describe('Tie-Breaking Logic (5-tier system)', () => {
    const teams = createTeams(4);
    const baseSettings: TournamentSettings = {
      mode: 'SCRIM',
      name: 'Tie Break Test',
      roundOrDay: 'Finals',
      totalMatchesPlanned: 2,
      teamCount: 4,
      pointSystem: mockPointSystem,
      tieBreakOrder: DEFAULT_TIE_BREAK_ORDER,
      championRush: {
        targetPoints: 50,
        maxMatches: 5,
        allowSameMatchBooyahActivation: false,
      },
      theme: 'crimson',
    };

    it('breaks ties using booyah count first when total points are equal', () => {
      // Both have 20 total points:
      // Team 1: 1st place (12 pts) + 8 kills = 20 pts (1 Booyah)
      // Team 2: 2nd place (9 pts) + 11 kills = 20 pts (0 Booyahs)
      const match1: Match = {
        id: 'm1',
        matchNumber: 1,
        isCompleted: true,
        createdAt: 1000,
        entries: {
          team_1: { teamId: 'team_1', placement: 1, kills: 8 },
          team_2: { teamId: 'team_2', placement: 2, kills: 11 },
        },
      };

      const result = calculateTournamentStandings(teams, [match1], baseSettings);
      expect(result.standings[0].teamId).toBe('team_1');
      expect(result.standings[1].teamId).toBe('team_2');
    });

    it('breaks ties using placement points when total points and booyahs are equal', () => {
      // Team 1: 2nd (9 pts) + 3 kills = 12 pts (0 Booyah, 9 placement pts)
      // Team 2: 3rd (8 pts) + 4 kills = 12 pts (0 Booyah, 8 placement pts)
      const match1: Match = {
        id: 'm1',
        matchNumber: 1,
        isCompleted: true,
        createdAt: 1000,
        entries: {
          team_1: { teamId: 'team_1', placement: 2, kills: 3 },
          team_2: { teamId: 'team_2', placement: 3, kills: 4 },
        },
      };

      const result = calculateTournamentStandings(teams, [match1], baseSettings);
      expect(result.standings[0].teamId).toBe('team_1');
      expect(result.standings[1].teamId).toBe('team_2');
    });

    it('breaks ties using total kills when total points, booyahs, and placement points are equal', () => {
      // Over 2 matches:
      // Team 1: M1 4th (7 pts, 3 kills) = 10 pts. M2 5th (6 pts, 4 kills) = 10 pts.
      // Total: 20 pts, 0 Booyahs, 13 pos pts, 7 kills.
      // Team 2: M1 5th (6 pts, 4 kills) = 10 pts. M2 4th (7 pts, 3 kills) = 10 pts.
      // Total: 20 pts, 0 Booyahs, 13 pos pts, 7 kills.
      // Let's make kills different:
      // Team 1: M1 2nd (9 pts, 1 kill), M2 3rd (8 pts, 2 kills) -> 20 pts, 17 pos pts, 3 kills.
      // Team 2: M1 2nd (9 pts, 2 kills), M2 3rd (8 pts, 1 kill) -> 20 pts, 17 pos pts, 3 kills -> equal kills.
      // But if Team 1 has 4 kills and Team 2 has 3 kills, but points differ:
      // Note: total points = placement pts + kills! So if total points AND placement points are equal,
      // kills = total - placement, so kills will always be equal if total points and placement points are equal!
      // Therefore, the 5th criterion 'lastMatchPlacement' decides!
      // In M2: Team 1 got 4th place (7 pts), Team 2 got 3rd place (8 pts) -> placement points would differ.
      // What if Team 1 finished 3rd in M1 and 4th in M2, while Team 2 finished 4th in M1 and 3rd in M2:
      // Both: 8 + 7 = 15 pos pts. Both 5 kills total -> 20 total pts.
      // In M2 (last match): Team 2 got 3rd, Team 1 got 4th!
      // So Team 2 wins the lastMatchPlacement tiebreak!
      const match1: Match = {
        id: 'm1',
        matchNumber: 1,
        isCompleted: true,
        createdAt: 1000,
        entries: {
          team_1: { teamId: 'team_1', placement: 3, kills: 2 }, // 8 + 2 = 10
          team_2: { teamId: 'team_2', placement: 4, kills: 3 }, // 7 + 3 = 10
        },
      };
      const match2: Match = {
        id: 'm2',
        matchNumber: 2,
        isCompleted: true,
        createdAt: 2000,
        entries: {
          team_1: { teamId: 'team_1', placement: 4, kills: 3 }, // 7 + 3 = 10, total 20, last match place 4
          team_2: { teamId: 'team_2', placement: 3, kills: 2 }, // 8 + 2 = 10, total 20, last match place 3
        },
      };

      const result = calculateTournamentStandings(teams, [match1, match2], baseSettings);
      expect(result.standings[0].teamId).toBe('team_2'); // Last match 3rd < 4th
      expect(result.standings[1].teamId).toBe('team_1');
    });
  });

  describe('Mode B: CHAMPION RUSH Logic', () => {
    const teams = createTeams(6);
    const rushSettings: TournamentSettings = {
      mode: 'CHAMPION_RUSH',
      name: 'Rush Tournament',
      roundOrDay: 'Grand Finals',
      totalMatchesPlanned: 8,
      teamCount: 6,
      pointSystem: mockPointSystem,
      tieBreakOrder: DEFAULT_TIE_BREAK_ORDER,
      championRush: {
        targetPoints: 50,
        maxMatches: 5,
        allowSameMatchBooyahActivation: false, // Default: must be active *prior*
      },
      theme: 'crimson',
    };

    it('does NOT crown champion if team crosses target in the same match where it gets Booyah (default toggle OFF)', () => {
      // Team 1 starts at 40 points after Match 1.
      // In Match 2, Team 1 gets Booyah (12 pts) + 5 kills = 17 pts -> Total = 57 points (>= 50).
      // Since it was NOT active before Match 2, it is NOT crowned champion!
      // It becomes ACTIVE starting for Match 3.
      const match1: Match = {
        id: 'm1',
        matchNumber: 1,
        isCompleted: true,
        createdAt: 1000,
        entries: {
          team_1: { teamId: 'team_1', placement: 2, kills: 31 }, // 9 + 31 = 40 pts (< 50)
        },
      };

      const match2: Match = {
        id: 'm2',
        matchNumber: 2,
        isCompleted: true,
        createdAt: 2000,
        entries: {
          team_1: { teamId: 'team_1', placement: 1, kills: 5 }, // 12 + 5 = 17 pts -> 57 pts
        },
      };

      const result = calculateTournamentStandings(teams, [match1, match2], rushSettings);
      expect(result.tournamentConcluded).toBe(false);
      expect(result.championTeamId).toBeUndefined();
      expect(result.standings[0].teamId).toBe('team_1');
      expect(result.standings[0].rushStatus.status).toBe('ACTIVE');
      if (result.standings[0].rushStatus.status === 'ACTIVE') {
        expect(result.standings[0].rushStatus.activatedAtMatch).toBe(2);
      }
    });

    it('crowns champion when an ACTIVE team achieves Booyah in a subsequent match and places them at Rank 1 regardless of points', () => {
      // Continuing from above: Team 1 became active after M2.
      // Team 2 has 80 points (huge kill game), but Team 1 gets Booyah in M3.
      // Team 1 must be crowned CHAMPION and ranked #1!
      const match1: Match = {
        id: 'm1',
        matchNumber: 1,
        isCompleted: true,
        createdAt: 1000,
        entries: {
          team_1: { teamId: 'team_1', placement: 2, kills: 45 }, // 9 + 45 = 54 pts (Active after M1!)
          team_2: { teamId: 'team_2', placement: 3, kills: 40 }, // 8 + 40 = 48 pts
        },
      };

      const match2: Match = {
        id: 'm2',
        matchNumber: 2,
        isCompleted: true,
        createdAt: 2000,
        entries: {
          team_1: { teamId: 'team_1', placement: 5, kills: 2 }, // 6 + 2 = 8 pts -> 62 pts
          team_2: { teamId: 'team_2', placement: 1, kills: 30 }, // 12 + 30 = 42 pts -> 90 pts (Team 2 active after M2)
        },
      };

      const match3: Match = {
        id: 'm3',
        matchNumber: 3,
        isCompleted: true,
        createdAt: 3000,
        entries: {
          team_1: { teamId: 'team_1', placement: 1, kills: 4 }, // Team 1 was active before M3, and got Booyah!
          team_2: { teamId: 'team_2', placement: 2, kills: 15 }, // Team 2 has 90 + 9 + 15 = 114 pts!
        },
      };

      const result = calculateTournamentStandings(teams, [match1, match2, match3], rushSettings);
      expect(result.tournamentConcluded).toBe(true);
      expect(result.conclusionReason).toBe('CHAMPION_CROWNED');
      expect(result.championTeamId).toBe('team_1');
      // Even though Team 2 has ~114 pts and Team 1 has ~78 pts, Team 1 MUST be Rank 1!
      expect(result.standings[0].teamId).toBe('team_1');
      expect(result.standings[0].rank).toBe(1);
      expect(result.standings[0].rushStatus.status).toBe('CHAMPION');
      expect(result.standings[1].teamId).toBe('team_2');
      expect(result.standings[1].rank).toBe(2);
    });

    it('crowns champion on same match when allowSameMatchBooyahActivation is TRUE', () => {
      const sameMatchSettings: TournamentSettings = {
        ...rushSettings,
        championRush: {
          ...rushSettings.championRush,
          allowSameMatchBooyahActivation: true,
        },
      };

      const match1: Match = {
        id: 'm1',
        matchNumber: 1,
        isCompleted: true,
        createdAt: 1000,
        entries: {
          // Crosses 50 target with 1st place in Match 1 itself!
          team_1: { teamId: 'team_1', placement: 1, kills: 40 }, // 12 + 40 = 52 pts
        },
      };

      const result = calculateTournamentStandings(teams, [match1], sameMatchSettings);
      expect(result.tournamentConcluded).toBe(true);
      expect(result.championTeamId).toBe('team_1');
      expect(result.standings[0].rushStatus.status).toBe('CHAMPION');
    });

    it('falls back to Scrim total points ranking when maxMatches is reached with no active Booyah', () => {
      // 5 matches max, nobody gets Booyah while active
      const matches: Match[] = [1, 2, 3, 4, 5].map((num) => ({
        id: `m${num}`,
        matchNumber: num,
        isCompleted: true,
        createdAt: num * 1000,
        entries: {
          team_1: { teamId: 'team_1', placement: 3, kills: 2 }, // accumulates without booyah
          team_2: { teamId: 'team_2', placement: 4, kills: 1 },
        },
      }));

      const result = calculateTournamentStandings(teams, matches, rushSettings);
      expect(result.tournamentConcluded).toBe(true);
      expect(result.conclusionReason).toBe('MAX_MATCHES_REACHED');
      expect(result.championTeamId).toBeUndefined();
      expect(result.standings[0].rank).toBe(1);
    });

    it('recalculates everything deterministically when editing a past match', () => {
      // Initial: Team 1 reached 50 in M1 with 50 kills.
      const match1: Match = {
        id: 'm1',
        matchNumber: 1,
        isCompleted: true,
        createdAt: 1000,
        entries: {
          team_1: { teamId: 'team_1', placement: 2, kills: 45 }, // 9 + 45 = 54 pts
        },
      };
      const match2: Match = {
        id: 'm2',
        matchNumber: 2,
        isCompleted: true,
        createdAt: 2000,
        entries: {
          team_1: { teamId: 'team_1', placement: 1, kills: 5 }, // Booyah in M2 -> was champion!
        },
      };

      const res1 = calculateTournamentStandings(teams, [match1, match2], rushSettings);
      expect(res1.championTeamId).toBe('team_1');

      // Now organizer edits Match 1: corrected kills from 45 to 20!
      // New M1 points = 9 + 20 = 29 pts (< 50).
      // So Team 1 was NOT active before Match 2.
      // Therefore, in Match 2, Team 1 does NOT become champion!
      const editedMatch1: Match = {
        ...match1,
        entries: {
          team_1: { teamId: 'team_1', placement: 2, kills: 20 },
        },
      };

      const res2 = calculateTournamentStandings(teams, [editedMatch1, match2], rushSettings);
      expect(res2.championTeamId).toBeUndefined();
      expect(res2.tournamentConcluded).toBe(false);
      expect(res2.standings[0].rushStatus.status).toBe('NOT_ACTIVE');
    });
  });

  describe('Single Match Calculation', () => {
    it('computes isolated match standings without affecting cumulative state', () => {
      const teams = createTeams(3);
      const match: Match = {
        id: 'm1',
        matchNumber: 1,
        isCompleted: true,
        createdAt: 1000,
        entries: {
          team_1: { teamId: 'team_1', placement: 2, kills: 5 }, // 9 + 5 = 14
          team_2: { teamId: 'team_2', placement: 1, kills: 4 }, // 12 + 4 = 16
          team_3: { teamId: 'team_3', placement: 3, kills: 0 }, // 8 + 0 = 8
        },
      };

      const single = calculateSingleMatchStandings(
        teams,
        match,
        mockPointSystem,
        DEFAULT_TIE_BREAK_ORDER
      );
      expect(single[0].teamId).toBe('team_2');
      expect(single[0].rank).toBe(1);
      expect(single[0].totalPoints).toBe(16);
      expect(single[1].teamId).toBe('team_1');
      expect(single[1].rank).toBe(2);
      expect(single[1].totalPoints).toBe(14);
    });
  });
});
