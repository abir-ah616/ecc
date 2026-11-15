import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/scoring.dart';
import '../models/tournament_models.dart';

const String _kStorageKey = 'esp_calc_mobile_store_v1';

class TournamentStore extends ChangeNotifier {
  List<TournamentRecord> _tournaments = [];
  String? _activeTournamentId;
  PointSystemConfig _defaultPointSystem = PointSystemConfig(
    placementPoints: List<int>.from(defaultPlacementPoints),
    killPoints: 1,
  );
  bool _isHydrated = false;

  List<TournamentRecord> get tournaments => _tournaments;
  String? get activeTournamentId => _activeTournamentId;
  PointSystemConfig get defaultPointSystem => _defaultPointSystem;
  bool get isHydrated => _isHydrated;

  TournamentRecord? get activeTournament {
    if (_tournaments.isEmpty) return null;
    if (_activeTournamentId != null) {
      for (final t in _tournaments) {
        if (t.id == _activeTournamentId) return t;
      }
    }
    return _tournaments.first;
  }

  List<Team> get teams => activeTournament?.teams ?? const [];
  List<MatchRecord> get matches => activeTournament?.matches ?? const [];

  TournamentSettings get settings =>
      activeTournament?.settings ??
      TournamentSettings(
        mode: TournamentMode.scrim,
        name: 'FREE FIRE CHAMPIONSHIP',
        roundOrDay: 'GRAND FINALS - DAY 1',
        totalMatchesPlanned: 5,
        teamCount: 12,
        pointSystem: _defaultPointSystem,
        tieBreakOrder: List<TieBreakCriterion>.from(defaultTieBreakOrder),
        championRush: const ChampionRushConfig(
          targetPoints: 80,
          maxMatches: 8,
        ),
      );

  StandingsResult getStandings() {
    final active = activeTournament;
    if (active == null) {
      return const StandingsResult(standings: [], tournamentConcluded: false);
    }
    return calculateTournamentStandings(
      active.teams,
      active.matches,
      active.settings,
    );
  }

  Future<void> hydrate() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_kStorageKey);
      if (raw != null && raw.isNotEmpty) {
        final decoded = jsonDecode(raw) as Map<String, dynamic>;
        final rawTournaments = decoded['tournaments'] as List<dynamic>?;
        if (rawTournaments != null) {
          _tournaments = rawTournaments
              .map((e) => TournamentRecord.fromJson(e as Map<String, dynamic>))
              .toList();
        }
        _activeTournamentId = decoded['activeTournamentId'] as String?;
        if (decoded['defaultPointSystem'] is Map<String, dynamic>) {
          _defaultPointSystem = PointSystemConfig.fromJson(
            decoded['defaultPointSystem'] as Map<String, dynamic>,
          );
        }
      }
    } catch (_) {
      // Ignore corrupt local cache and start clean
    } finally {
      _isHydrated = true;
      notifyListeners();
    }
  }

  Future<void> _persist() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final payload = jsonEncode({
        'tournaments': _tournaments.map((t) => t.toJson()).toList(),
        'activeTournamentId': _activeTournamentId,
        'defaultPointSystem': _defaultPointSystem.toJson(),
      });
      await prefs.setString(_kStorageKey, payload);
    } catch (_) {
      // Non-fatal persistence failure
    }
  }

  void _commit(void Function() mutate) {
    mutate();
    notifyListeners();
    _persist();
  }

  String _formatDateTime(DateTime dt) {
    return DateFormat('dd MMM yyyy, hh:mm a').format(dt);
  }

  String createTournament({
    required String name,
    required TournamentMode mode,
    String roundOrDay = 'FINALS',
    String? hostName,
    String? sponsorName,
    bool showLogos = true,
    String? customLogoUrl,
    required List<({String name, String? logoUrl})> squadInputs,
    int totalMatchesPlanned = 5,
    ChampionRushConfig? championRush,
  }) {
    final now = DateTime.now();
    final ts = now.millisecondsSinceEpoch;
    final tournamentId = 'tourn_$ts';
    final formattedDate = _formatDateTime(now);

    final newTeams = [
      for (int i = 0; i < squadInputs.length; i++)
        Team(
          id: 'team_${tournamentId}_${i + 1}',
          name: squadInputs[i].name.trim().isEmpty
              ? 'Squad ${i + 1}'
              : squadInputs[i].name.trim(),
          logoUrl: squadInputs[i].logoUrl,
          shortCode: generateTeamInitials(
            squadInputs[i].name.trim().isEmpty
                ? 'S${i + 1}'
                : squadInputs[i].name.trim(),
          ),
        ),
    ];

    final match1Id = 'match_${tournamentId}_1';
    final initialEntries = {
      for (final t in newTeams) t.id: TeamMatchEntry(teamId: t.id),
    };

    final newSettings = TournamentSettings(
      mode: mode,
      name: name.trim().isEmpty ? 'Tournament $formattedDate' : name.trim(),
      roundOrDay: roundOrDay.trim().isEmpty ? 'FINALS' : roundOrDay.trim(),
      hostName: (hostName ?? '').trim().isEmpty ? null : hostName!.trim(),
      sponsorName:
          (sponsorName ?? '').trim().isEmpty ? null : sponsorName!.trim(),
      showLogos: showLogos,
      customLogoUrl: customLogoUrl,
      totalMatchesPlanned: totalMatchesPlanned,
      teamCount: newTeams.length,
      pointSystem: _defaultPointSystem.copyWith(),
      tieBreakOrder: List<TieBreakCriterion>.from(defaultTieBreakOrder),
      championRush: championRush ??
          const ChampionRushConfig(targetPoints: 80, maxMatches: 8),
    );

    final record = TournamentRecord(
      id: tournamentId,
      name: newSettings.name,
      createdAt: formattedDate,
      createdAtTimestamp: ts,
      settings: newSettings,
      teams: newTeams,
      matches: [
        MatchRecord(
          id: match1Id,
          matchNumber: 1,
          entries: initialEntries,
          isCompleted: false,
          createdAt: ts,
        ),
      ],
      isEnded: false,
    );

    _commit(() {
      _tournaments = [record, ..._tournaments];
      _activeTournamentId = tournamentId;
    });

    return match1Id;
  }

  void updateTournament(
    String tournamentId, {
    String? name,
    TournamentMode? mode,
    String? roundOrDay,
    String? hostName,
    String? sponsorName,
    bool? showLogos,
    String? customLogoUrl,
    bool clearCustomLogo = false,
    int? totalMatchesPlanned,
    ChampionRushConfig? championRush,
    List<Team>? teams,
  }) {
    _commit(() {
      _tournaments = _tournaments.map((t) {
        if (t.id != tournamentId) return t;
        final nextTeams = teams ?? t.teams;
        final nextMatches = t.matches.map((m) {
          final updatedEntries = <String, TeamMatchEntry>{};
          for (final team in nextTeams) {
            updatedEntries[team.id] =
                m.entries[team.id] ?? TeamMatchEntry(teamId: team.id);
          }
          return m.copyWith(entries: updatedEntries);
        }).toList();

        final nextSettings = t.settings.copyWith(
          name: name ?? t.settings.name,
          mode: mode ?? t.settings.mode,
          roundOrDay: roundOrDay ?? t.settings.roundOrDay,
          hostName: hostName ?? t.settings.hostName,
          sponsorName: sponsorName ?? t.settings.sponsorName,
          showLogos: showLogos ?? t.settings.showLogos,
          customLogoUrl: customLogoUrl,
          clearCustomLogo: clearCustomLogo,
          totalMatchesPlanned:
              totalMatchesPlanned ?? t.settings.totalMatchesPlanned,
          championRush: championRush ?? t.settings.championRush,
          teamCount: nextTeams.length,
        );

        return t.copyWith(
          name: nextSettings.name,
          settings: nextSettings,
          teams: nextTeams,
          matches: nextMatches,
        );
      }).toList();
    });
  }

  void switchActiveTournament(String id) {
    _commit(() {
      _activeTournamentId = id;
    });
  }

  void deleteTournament(String id) {
    _commit(() {
      _tournaments = _tournaments.where((t) => t.id != id).toList();
      if (_activeTournamentId == id) {
        _activeTournamentId =
            _tournaments.isNotEmpty ? _tournaments.first.id : null;
      }
    });
  }

  void endTournamentById(String id) {
    _commit(() {
      _tournaments = _tournaments.map((t) {
        if (t.id != id) return t;
        final res = calculateTournamentStandings(
          t.teams,
          t.matches,
          t.settings.copyWith(isManuallyEnded: true),
        );
        final leader = res.standings.isNotEmpty ? res.standings.first : null;
        return t.copyWith(
          isEnded: true,
          settings: t.settings.copyWith(isManuallyEnded: true),
          championTeamName: leader?.teamName,
          championScore: leader?.totalPoints,
        );
      }).toList();
    });
  }

  void reopenTournamentById(String id) {
    _commit(() {
      _tournaments = _tournaments.map((t) {
        if (t.id != id) return t;
        return t.copyWith(
          isEnded: false,
          settings: t.settings.copyWith(isManuallyEnded: false),
        );
      }).toList();
    });
  }

  void endActiveTournament() {
    final active = activeTournament;
    if (active != null) endTournamentById(active.id);
  }

  void reopenActiveTournament() {
    final active = activeTournament;
    if (active != null) reopenTournamentById(active.id);
  }

  void updateActiveTheme(ThemePreset theme) {
    final active = activeTournament;
    if (active == null) return;
    _commit(() {
      _tournaments = _tournaments.map((t) {
        if (t.id != active.id) return t;
        return t.copyWith(settings: t.settings.copyWith(theme: theme));
      }).toList();
    });
  }

  void updateActivePosterMeta({
    String? name,
    String? roundOrDay,
    String? hostName,
    String? sponsorName,
    bool? showLogos,
  }) {
    final active = activeTournament;
    if (active == null) return;
    _commit(() {
      _tournaments = _tournaments.map((t) {
        if (t.id != active.id) return t;
        final nextName = name != null && name.trim().isNotEmpty
            ? name.trim()
            : t.settings.name;
        final nextRound = roundOrDay != null && roundOrDay.trim().isNotEmpty
            ? roundOrDay.trim()
            : t.settings.roundOrDay;
        final nextSettings = t.settings.copyWith(
          name: nextName,
          roundOrDay: nextRound,
          hostName: hostName != null
              ? (hostName.trim().isEmpty ? null : hostName.trim())
              : t.settings.hostName,
          sponsorName: sponsorName != null
              ? (sponsorName.trim().isEmpty ? null : sponsorName.trim())
              : t.settings.sponsorName,
          showLogos: showLogos ?? t.settings.showLogos,
        );
        return t.copyWith(name: nextName, settings: nextSettings);
      }).toList();
    });
  }

  String duplicateTournament(String sourceId) {
    TournamentRecord? source;
    for (final t in _tournaments) {
      if (t.id == sourceId) {
        source = t;
        break;
      }
    }
    if (source == null) return '';

    final now = DateTime.now();
    final ts = now.millisecondsSinceEpoch;
    final nextId = 'tourn_$ts';
    final formattedDate = _formatDateTime(now);

    final clonedTeams = [
      for (int i = 0; i < source.teams.length; i++)
        Team(
          id: 'team_${nextId}_${i + 1}',
          name: source.teams[i].name,
          logoUrl: source.teams[i].logoUrl,
          shortCode: source.teams[i].shortCode,
        ),
    ];

    final match1Id = 'match_${nextId}_1';
    final cleanEntries = {
      for (final tm in clonedTeams) tm.id: TeamMatchEntry(teamId: tm.id),
    };

    final cloned = TournamentRecord(
      id: nextId,
      name: '${source.name} (Copy)',
      createdAt: formattedDate,
      createdAtTimestamp: ts,
      settings: source.settings.copyWith(
        name: '${source.settings.name} (Copy)',
        teamCount: clonedTeams.length,
        isManuallyEnded: false,
      ),
      teams: clonedTeams,
      matches: [
        MatchRecord(
          id: match1Id,
          matchNumber: 1,
          entries: cleanEntries,
          isCompleted: false,
          createdAt: ts,
        ),
      ],
      isEnded: false,
    );

    _commit(() {
      _tournaments = [cloned, ..._tournaments];
      _activeTournamentId = nextId;
    });

    return nextId;
  }

  void updateDefaultPointSystem(PointSystemConfig nextConfig) {
    _commit(() {
      _defaultPointSystem = nextConfig.copyWith();
      final active = activeTournament;
      if (active != null) {
        _tournaments = _tournaments.map((t) {
          if (t.id != active.id) return t;
          return t.copyWith(
            settings: t.settings.copyWith(pointSystem: nextConfig.copyWith()),
          );
        }).toList();
      }
    });
  }

  String createMatch() {
    final active = activeTournament;
    if (active == null) return '';

    final nextNum = active.matches.isEmpty
        ? 1
        : active.matches.map((m) => m.matchNumber).reduce(math.max) + 1;
    final matchId =
        'match_${active.id}_${DateTime.now().millisecondsSinceEpoch}';

    final entries = {
      for (final t in active.teams) t.id: TeamMatchEntry(teamId: t.id),
    };

    final newMatch = MatchRecord(
      id: matchId,
      matchNumber: nextNum,
      entries: entries,
      isCompleted: false,
      createdAt: DateTime.now().millisecondsSinceEpoch,
    );

    _commit(() {
      _tournaments = _tournaments.map((t) {
        if (t.id != active.id) return t;
        return t.copyWith(matches: [...t.matches, newMatch]);
      }).toList();
    });

    return matchId;
  }

  void updateMatchEntry({
    required String matchId,
    required String teamId,
    required int? placement,
    required int kills,
  }) {
    final active = activeTournament;
    if (active == null) return;
    _commit(() {
      _tournaments = _tournaments.map((t) {
        if (t.id != active.id) return t;
        final nextMatches = t.matches.map((m) {
          if (m.id != matchId) return m;
          final nextEntries = Map<String, TeamMatchEntry>.from(m.entries);
          nextEntries[teamId] = TeamMatchEntry(
            teamId: teamId,
            placement: placement,
            kills: math.max(0, kills),
          );
          return m.copyWith(entries: nextEntries);
        }).toList();
        return t.copyWith(matches: nextMatches);
      }).toList();
    });
  }

  void completeMatch(String matchId) {
    final active = activeTournament;
    if (active == null) return;
    _commit(() {
      _tournaments = _tournaments.map((t) {
        if (t.id != active.id) return t;
        final nextMatches = t.matches
            .map((m) => m.id == matchId ? m.copyWith(isCompleted: true) : m)
            .toList();
        return t.copyWith(matches: nextMatches);
      }).toList();
    });
  }

  void reopenMatch(String matchId) {
    final active = activeTournament;
    if (active == null) return;
    _commit(() {
      _tournaments = _tournaments.map((t) {
        if (t.id != active.id) return t;
        final nextMatches = t.matches
            .map((m) => m.id == matchId ? m.copyWith(isCompleted: false) : m)
            .toList();
        return t.copyWith(matches: nextMatches);
      }).toList();
    });
  }

  void deleteMatch(String matchId) {
    final active = activeTournament;
    if (active == null || active.matches.length <= 1) return;
    _commit(() {
      _tournaments = _tournaments.map((t) {
        if (t.id != active.id) return t;
        final remaining = t.matches.where((m) => m.id != matchId).toList();
        final renumbered = [
          for (int i = 0; i < remaining.length; i++)
            remaining[i].copyWith(matchNumber: i + 1),
        ];
        return t.copyWith(matches: renumbered);
      }).toList();
    });
  }

  void resetActiveMatchData() {
    final active = activeTournament;
    if (active == null) return;
    final cleanEntries = {
      for (final team in active.teams) team.id: TeamMatchEntry(teamId: team.id),
    };
    final cleanMatch1 = MatchRecord(
      id: 'match_${active.id}_1',
      matchNumber: 1,
      entries: cleanEntries,
      isCompleted: false,
      createdAt: DateTime.now().millisecondsSinceEpoch,
    );
    _commit(() {
      _tournaments = _tournaments.map((t) {
        if (t.id != active.id) return t;
        return t.copyWith(
          matches: [cleanMatch1],
          isEnded: false,
          settings: t.settings.copyWith(isManuallyEnded: false),
        );
      }).toList();
    });
  }

  String exportJson() {
    return const JsonEncoder.withIndent('  ').convert({
      'tournaments': _tournaments.map((t) => t.toJson()).toList(),
      'activeTournamentId': _activeTournamentId,
      'defaultPointSystem': _defaultPointSystem.toJson(),
      'exportedAt': DateTime.now().toUtc().toIso8601String(),
    });
  }

  bool importJson(String rawJson) {
    try {
      final parsed = jsonDecode(rawJson);
      if (parsed is! Map<String, dynamic>) return false;
      final rawList = parsed['tournaments'];
      if (rawList is! List) return false;

      final imported = rawList
          .map((e) => TournamentRecord.fromJson(e as Map<String, dynamic>))
          .toList();
      final nextActive = (parsed['activeTournamentId'] as String?) ??
          (imported.isNotEmpty ? imported.first.id : null);
      final nextPointSys = parsed['defaultPointSystem'] is Map<String, dynamic>
          ? PointSystemConfig.fromJson(
              parsed['defaultPointSystem'] as Map<String, dynamic>,
            )
          : _defaultPointSystem;

      _commit(() {
        _tournaments = imported;
        _activeTournamentId = nextActive;
        _defaultPointSystem = nextPointSys;
      });
      return true;
    } catch (_) {
      return false;
    }
  }
}
