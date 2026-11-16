import 'dart:math' as math;
import '../models/tournament_models.dart';

const List<int> defaultPlacementPoints = [
  12, 9, 8, 7, 6, 5, 4, 3, 2, 1,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const List<int> classic20PlacementPoints = [
  20, 17, 15, 13, 10, 8, 6, 4, 3, 2, 1,
  0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const List<TieBreakCriterion> defaultTieBreakOrder = [
  TieBreakCriterion.totalPoints,
  TieBreakCriterion.booyahs,
  TieBreakCriterion.placementPoints,
  TieBreakCriterion.kills,
  TieBreakCriterion.lastMatchPlacement,
];

String generateTeamInitials(String name) {
  final trimmed = name.trim();
  if (trimmed.isEmpty) return 'FF';
  final parts = trimmed.split(RegExp(r'\s+'));
  if (parts.length == 1) {
    return parts[0].substring(0, math.min(3, parts[0].length)).toUpperCase();
  }
  final first = parts[0].isNotEmpty ? parts[0][0] : '';
  final last = parts.last;
  if (RegExp(r'^\d+$').hasMatch(last) && first.isNotEmpty) {
    final combined = '$first$last'.toUpperCase();
    return combined.length > 4 ? combined.substring(0, 4) : combined;
  }
  final second = parts.length > 1 && parts[1].isNotEmpty ? parts[1][0] : '';
  return '$first$second'.toUpperCase();
}

int getPlacementPoints(int? placement, PointSystemConfig config) {
  if (placement == null || placement < 1) return 0;
  final idx = placement - 1;
  if (idx < config.placementPoints.length) {
    return config.placementPoints[idx];
  }
  return 0;
}

int getKillPoints(int kills, PointSystemConfig config) {
  if (kills < 0) return 0;
  return kills * config.killPoints;
}

TeamMatchResult calculateTeamMatchResult(
  String teamId,
  int? placement,
  int kills,
  PointSystemConfig config,
) {
  final safePlacement = (placement != null && placement > 0) ? placement : 0;
  final placementPts = getPlacementPoints(safePlacement, config);
  final killPts = getKillPoints(kills, config);
  return TeamMatchResult(
    teamId: teamId,
    placement: safePlacement,
    placementPoints: placementPts,
    kills: kills,
    killPoints: killPts,
    totalPoints: placementPts + killPts,
    isBooyah: safePlacement == 1,
  );
}

int compareTeams(
  TeamCumulativeStanding a,
  TeamCumulativeStanding b,
  List<TieBreakCriterion> tieBreakOrder,
) {
  final aIsChamp = a.rushStatus.status == RushStatusType.champion;
  final bIsChamp = b.rushStatus.status == RushStatusType.champion;
  if (aIsChamp && !bIsChamp) return -1;
  if (!aIsChamp && bIsChamp) return 1;

  for (final criterion in tieBreakOrder) {
    switch (criterion) {
      case TieBreakCriterion.totalPoints:
        if (b.totalPoints != a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        break;
      case TieBreakCriterion.booyahs:
        if (b.booyahCount != a.booyahCount) {
          return b.booyahCount - a.booyahCount;
        }
        break;
      case TieBreakCriterion.placementPoints:
        if (b.placementPoints != a.placementPoints) {
          return b.placementPoints - a.placementPoints;
        }
        break;
      case TieBreakCriterion.kills:
        if (b.kills != a.kills) {
          return b.kills - a.kills;
        }
        break;
      case TieBreakCriterion.lastMatchPlacement:
        final placeA = a.lastMatchPlacement > 0 ? a.lastMatchPlacement : 999;
        final placeB = b.lastMatchPlacement > 0 ? b.lastMatchPlacement : 999;
        if (placeA != placeB) {
          return placeA - placeB;
        }
        break;
    }
  }

  return a.teamName.compareTo(b.teamName);
}

class _TeamAccumulator {
  final Team team;
  int booyahCount = 0;
  int kills = 0;
  int killPoints = 0;
  int placementPoints = 0;
  int totalPoints = 0;
  int lastMatchPlacement = 0;
  TeamRushStatus rushStatus = const TeamRushStatus.notActive();

  _TeamAccumulator(this.team);
}

StandingsResult calculateTournamentStandings(
  List<Team> teams,
  List<MatchRecord> matches,
  TournamentSettings settings,
) {
  final targetPoints = settings.championRush.targetPoints;
  final maxMatches = settings.championRush.maxMatches;
  final allowSameMatch = settings.championRush.allowSameMatchBooyahActivation;

  final accumulators = <String, _TeamAccumulator>{
    for (final t in teams) t.id: _TeamAccumulator(t),
  };

  final sortedMatches = matches.where((m) => m.isCompleted).toList()
    ..sort((a, b) => a.matchNumber.compareTo(b.matchNumber));

  String? championTeamId;
  bool tournamentConcluded = false;
  ConclusionReason? conclusionReason;

  for (final match in sortedMatches) {
    final matchNum = match.matchNumber;

    final activeBeforeMatch = <String>{
      for (final entry in accumulators.entries)
        if (entry.value.rushStatus.status == RushStatusType.active) entry.key,
    };

    for (final team in teams) {
      final entry = match.entries[team.id];
      final acc = accumulators[team.id]!;
      if (entry == null || entry.placement == null) continue;

      final res = calculateTeamMatchResult(
        team.id,
        entry.placement,
        entry.kills,
        settings.pointSystem,
      );
      acc.kills += res.kills;
      acc.killPoints += res.killPoints;
      acc.placementPoints += res.placementPoints;
      acc.totalPoints += res.totalPoints;
      if (res.isBooyah) acc.booyahCount += 1;
      acc.lastMatchPlacement = res.placement;
    }

    if (settings.mode == TournamentMode.championRush && championTeamId == null) {
      for (final team in teams) {
        final entry = match.entries[team.id];
        if (entry == null || entry.placement == null) continue;

        final gotBooyah = entry.placement == 1;
        final wasActiveBefore = activeBeforeMatch.contains(team.id);
        final acc = accumulators[team.id]!;
        final reachedTargetAfterMatch = acc.totalPoints >= targetPoints;

        if (gotBooyah) {
          if (wasActiveBefore || (allowSameMatch && reachedTargetAfterMatch)) {
            acc.rushStatus = TeamRushStatus.champion(matchNum);
            championTeamId = team.id;
            tournamentConcluded = true;
            conclusionReason = ConclusionReason.championCrowned;
            break;
          }
        }
      }

      if (championTeamId != null) {
        break;
      }

      for (final team in teams) {
        final acc = accumulators[team.id]!;
        if (acc.rushStatus.status == RushStatusType.notActive &&
            acc.totalPoints >= targetPoints) {
          acc.rushStatus = TeamRushStatus.active(matchNum);
        }
      }

      if (matchNum >= maxMatches) {
        tournamentConcluded = true;
        conclusionReason = ConclusionReason.maxMatchesReached;
      }
    }
  }

  if (settings.mode == TournamentMode.scrim) {
    if (sortedMatches.length >= settings.totalMatchesPlanned) {
      tournamentConcluded = true;
      conclusionReason = ConclusionReason.scrimCompleted;
    }
  }

  if (settings.isManuallyEnded) {
    tournamentConcluded = true;
    conclusionReason ??= ConclusionReason.organizerEnded;
  }

  final list = accumulators.values.map((acc) {
    final progress = targetPoints > 0
        ? math.min(1.0, math.max(0.0, acc.totalPoints / targetPoints))
        : 0.0;
    return TeamCumulativeStanding(
      teamId: acc.team.id,
      teamName: acc.team.name,
      logoUrl: acc.team.logoUrl,
      shortCode: acc.team.shortCode,
      rank: 0,
      booyahCount: acc.booyahCount,
      kills: acc.kills,
      killPoints: acc.killPoints,
      placementPoints: acc.placementPoints,
      totalPoints: acc.totalPoints,
      lastMatchPlacement: acc.lastMatchPlacement,
      rushStatus: acc.rushStatus,
      progressToTarget: progress,
    );
  }).toList();

  list.sort((a, b) => compareTeams(a, b, settings.tieBreakOrder));

  final ranked = [
    for (int i = 0; i < list.length; i++) list[i].withRank(i + 1),
  ];

  return StandingsResult(
    standings: ranked,
    championTeamId: championTeamId,
    tournamentConcluded: tournamentConcluded,
    conclusionReason: conclusionReason,
  );
}

List<TeamCumulativeStanding> calculateSingleMatchStandings(
  List<Team> teams,
  MatchRecord match,
  PointSystemConfig pointSystem,
  List<TieBreakCriterion> tieBreakOrder,
) {
  final list = teams.map((team) {
    final entry = match.entries[team.id];
    final res = calculateTeamMatchResult(
      team.id,
      entry?.placement,
      entry?.kills ?? 0,
      pointSystem,
    );
    return TeamCumulativeStanding(
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
      rushStatus: const TeamRushStatus.notActive(),
      progressToTarget: 0.0,
    );
  }).toList();

  list.sort((a, b) => compareTeams(a, b, tieBreakOrder));
  return [
    for (int i = 0; i < list.length; i++) list[i].withRank(i + 1),
  ];
}
