import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:esp_calc_mobile/core/scoring.dart';
import 'package:esp_calc_mobile/models/tournament_models.dart';
import 'package:esp_calc_mobile/state/tournament_state.dart';

void main() {
  group('Esports Scoring Engine', () {
    const pointSystem = PointSystemConfig(
      placementPoints: defaultPlacementPoints,
      killPoints: 1,
    );

    const teams = [
      Team(id: 't1', name: 'EVOS DIVINE'),
      Team(id: 't2', name: 'TEAM VAMPIRES'),
      Team(id: 't3', name: 'BURIRAM UNITED'),
    ];

    test('computes placement and kill points for a match', () {
      final booyah = calculateTeamMatchResult('t1', 1, 8, pointSystem);
      expect(booyah.placementPoints, 12);
      expect(booyah.killPoints, 8);
      expect(booyah.totalPoints, 20);
      expect(booyah.isBooyah, true);

      final second = calculateTeamMatchResult('t2', 2, 5, pointSystem);
      expect(second.placementPoints, 9);
      expect(second.killPoints, 5);
      expect(second.totalPoints, 14);
      expect(second.isBooyah, false);
    });

    test('breaks total point ties via Booyahs then placement points then kills',
        () {
      final settings = TournamentSettings(
        mode: TournamentMode.scrim,
        name: 'Tie Test',
        roundOrDay: 'Finals',
        totalMatchesPlanned: 1,
        teamCount: 3,
        pointSystem: pointSystem,
        tieBreakOrder: defaultTieBreakOrder,
        championRush: const ChampionRushConfig(),
      );

      final match1 = MatchRecord(
        id: 'm1',
        matchNumber: 1,
        entries: const {
          't1': TeamMatchEntry(
              teamId: 't1', placement: 1, kills: 3), // 12 + 3 = 15 (1 booyah)
          't2': TeamMatchEntry(
              teamId: 't2', placement: 2, kills: 6), // 9 + 6 = 15 (0 booyah)
          't3':
              TeamMatchEntry(teamId: 't3', placement: 3, kills: 1), // 8 + 1 = 9
        },
        isCompleted: true,
        createdAt: 1,
      );

      final res = calculateTournamentStandings(teams, [match1], settings);
      expect(res.standings.first.teamId, 't1');
      expect(res.standings.first.totalPoints, 15);
      expect(res.standings[1].teamId, 't2');
      expect(res.tournamentConcluded, true);
      expect(res.conclusionReason, ConclusionReason.scrimCompleted);
    });

    test(
        'Champion Rush activates after reaching target then crowns on subsequent Booyah',
        () {
      final settings = TournamentSettings(
        mode: TournamentMode.championRush,
        name: 'Rush Test',
        roundOrDay: 'Finals',
        totalMatchesPlanned: 8,
        teamCount: 3,
        pointSystem: pointSystem,
        tieBreakOrder: defaultTieBreakOrder,
        championRush: const ChampionRushConfig(
          targetPoints: 20,
          maxMatches: 8,
          allowSameMatchBooyahActivation: false,
        ),
      );

      final m1 = MatchRecord(
        id: 'm1',
        matchNumber: 1,
        entries: const {
          't1': TeamMatchEntry(
              teamId: 't1',
              placement: 1,
              kills: 10), // 22 pts >= 20 -> activates Rush
          't2': TeamMatchEntry(teamId: 't2', placement: 2, kills: 4),
          't3': TeamMatchEntry(teamId: 't3', placement: 3, kills: 2),
        },
        isCompleted: true,
        createdAt: 1,
      );

      final midResult = calculateTournamentStandings(teams, [m1], settings);
      expect(midResult.tournamentConcluded, false);
      expect(midResult.championTeamId, isNull);
      expect(
          midResult.standings.first.rushStatus.status, RushStatusType.active);

      final m2 = MatchRecord(
        id: 'm2',
        matchNumber: 2,
        entries: const {
          't1': TeamMatchEntry(
              teamId: 't1',
              placement: 1,
              kills: 5), // Booyah while ACTIVE -> Champion!
          't2': TeamMatchEntry(teamId: 't2', placement: 2, kills: 2),
          't3': TeamMatchEntry(teamId: 't3', placement: 3, kills: 0),
        },
        isCompleted: true,
        createdAt: 2,
      );

      final finalResult =
          calculateTournamentStandings(teams, [m1, m2], settings);
      expect(finalResult.tournamentConcluded, true);
      expect(finalResult.championTeamId, 't1');
      expect(finalResult.conclusionReason, ConclusionReason.championCrowned);
      expect(finalResult.standings.first.rushStatus.status,
          RushStatusType.champion);
    });

    test(
        'TournamentStore creates, updates, scores, and roundtrips JSON cleanly',
        () async {
      SharedPreferences.setMockInitialValues({});
      final store = TournamentStore();
      await store.hydrate();

      expect(store.tournaments, isEmpty);

      final m1Id = store.createTournament(
        name: 'FFWS Mobile Cup',
        mode: TournamentMode.championRush,
        squadInputs: const [
          (name: 'EVOS DIVINE', logoUrl: null),
          (name: 'RRQ KAZU', logoUrl: null),
        ],
        championRush: const ChampionRushConfig(targetPoints: 80, maxMatches: 6),
      );

      expect(store.activeTournament, isNotNull);
      final team1Id = store.teams.first.id;
      store.updateMatchEntry(
        matchId: m1Id,
        teamId: team1Id,
        placement: 1,
        kills: 9,
      );
      store.completeMatch(m1Id);

      final jsonBackup = store.exportJson();
      final restored = TournamentStore();
      await restored.hydrate();
      expect(restored.importJson(jsonBackup), true);
      expect(restored.tournaments.length, 1);
      expect(restored.getStandings().standings.first.totalPoints, 21);

      store.updateActivePosterMeta(
          roundOrDay: 'DAY 2 FINALS', showLogos: false);
      expect(store.activeTournament?.settings.roundOrDay, 'DAY 2 FINALS');
      expect(store.activeTournament?.settings.showLogos, false);

      final origId = store.activeTournament!.id;
      final copyId = store.duplicateTournament(origId);
      expect(copyId, isNotEmpty);
      expect(store.tournaments.length, 2);
      expect(store.activeTournament?.id, copyId);
      expect(store.activeTournament?.teams.length, 2);
      expect(store.activeTournament?.matches.length, 1);
      expect(store.activeTournament?.matches.first.isCompleted, false);
    });
  });
}
