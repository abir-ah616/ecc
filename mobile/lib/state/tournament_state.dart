import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/roster_helpers.dart';
import '../core/scoring.dart';
import '../models/tournament_models.dart';

const String _kStorageKey = 'esp_calc_mobile_store_v1';

enum CloudSyncStatus { idle, syncing, synced, offline }

class MobileCloudSyncHooks {
  final void Function(TournamentRecord record)? onTournamentUpsert;
  final void Function(String tournamentId)? onTournamentDelete;
  final void Function(List<SavedSquadRecord> squads)? onSquadsUpsert;
  final void Function(String squadId)? onSquadDelete;
  final VoidCallback? onMetaUpdate;

  const MobileCloudSyncHooks({
    this.onTournamentUpsert,
    this.onTournamentDelete,
    this.onSquadsUpsert,
    this.onSquadDelete,
    this.onMetaUpdate,
  });
}

class TournamentStore extends ChangeNotifier {
  List<TournamentRecord> _tournaments = [];
  List<SavedSquadRecord> _savedSquads = [];
  OrganizerDefaults _organizerDefaults = const OrganizerDefaults();
  String? _activeTournamentId;
  PointSystemConfig _defaultPointSystem = PointSystemConfig(
    placementPoints: List<int>.from(defaultPlacementPoints),
    killPoints: 1,
  );
  bool _isHydrated = false;
  CloudSyncStatus _cloudSyncStatus = CloudSyncStatus.idle;
  MobileCloudSyncHooks _cloudHooks = const MobileCloudSyncHooks();

  List<TournamentRecord> get tournaments => _tournaments;
  List<SavedSquadRecord> get savedSquads => _savedSquads;
  OrganizerDefaults get organizerDefaults => _organizerDefaults;
  String? get activeTournamentId => _activeTournamentId;
  PointSystemConfig get defaultPointSystem => _defaultPointSystem;
  bool get isHydrated => _isHydrated;
  CloudSyncStatus get cloudSyncStatus => _cloudSyncStatus;

  void registerCloudSyncHooks(MobileCloudSyncHooks hooks) {
    _cloudHooks = hooks;
  }

  void setCloudSyncStatus(CloudSyncStatus status) {
    if (_cloudSyncStatus == status) return;
    _cloudSyncStatus = status;
    notifyListeners();
  }

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
        final rawSquads = decoded['savedSquads'] as List<dynamic>?;
        if (rawSquads != null) {
          _savedSquads = rawSquads
              .whereType<Map<String, dynamic>>()
              .map(SavedSquadRecord.fromJson)
              .toList();
        }
        if (decoded['organizerDefaults'] is Map<String, dynamic>) {
          _organizerDefaults = OrganizerDefaults.fromJson(
            decoded['organizerDefaults'] as Map<String, dynamic>,
          );
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
        'savedSquads': _savedSquads.map((s) => s.toJson()).toList(),
        'organizerDefaults': _organizerDefaults.toJson(),
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

  List<SavedSquadRecord> _mergeTeamsIntoVault(List<Team> sourceTeams, int nowMs) {
    final byId = <String, SavedSquadRecord>{
      for (final s in _savedSquads) s.id: s,
    };
    final changed = <SavedSquadRecord>[];

    for (final t in sourceTeams) {
      final clean = t.name.trim();
      if (isPlaceholderSquadName(clean)) continue;
      final id = toSquadVaultId(clean);
      final prev = byId[id];
      final mergedLearned = <String>{
        ...(prev?.learnedTokens ?? const []),
        ...t.learnedTokens,
      }.take(32).toList();

      final item = SavedSquadRecord(
        id: id,
        name: clean.length > 120 ? clean.substring(0, 120) : clean,
        shortCode: (t.shortCode ?? generateTeamInitials(clean)),
        logoUrl: t.logoUrl ?? prev?.logoUrl,
        player1: (t.player1 ?? '').trim().isNotEmpty
            ? t.player1!.trim()
            : prev?.player1,
        player2: (t.player2 ?? '').trim().isNotEmpty
            ? t.player2!.trim()
            : prev?.player2,
        learnedTokens: mergedLearned,
        updatedAt: nowMs,
      );
      byId[id] = item;
      changed.add(item);
    }

    final list = byId.values.toList()
      ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
    _savedSquads = list;
    return changed;
  }

  SavedSquadRecord? findSavedSquadByName(String name) {
    final clean = name.trim();
    if (isPlaceholderSquadName(clean)) return null;
    final id = toSquadVaultId(clean);
    for (final s in _savedSquads) {
      if (s.id == id) return s;
    }
    return null;
  }

  void deleteSavedSquad(String squadId) {
    _commit(() {
      _savedSquads = _savedSquads.where((s) => s.id != squadId).toList();
    });
    _cloudHooks.onSquadDelete?.call(squadId);
  }

  String createTournament({
    required String name,
    required TournamentMode mode,
    String roundOrDay = 'FINALS',
    String? hostName,
    String? sponsorName,
    bool showLogos = true,
    String? customLogoUrl,
    bool autoResultFromScreenshot = false,
    List<({String name, String? logoUrl})> squadInputs = const [],
    List<Team>? richSquads,
    int totalMatchesPlanned = 5,
    ChampionRushConfig? championRush,
  }) {
    final now = DateTime.now();
    final ts = now.millisecondsSinceEpoch;
    final tournamentId = 'tourn_$ts';
    final formattedDate = _formatDateTime(now);

    final List<Team> newTeams;
    if (richSquads != null && richSquads.isNotEmpty) {
      newTeams = [
        for (int i = 0; i < richSquads.length; i++)
          () {
            final src = richSquads[i];
            final cleanName =
                src.name.trim().isEmpty ? 'Squad ${i + 1}' : src.name.trim();
            final vaultHit = findSavedSquadByName(cleanName);
            return Team(
              id: 'team_${tournamentId}_${i + 1}',
              name: cleanName,
              logoUrl: src.logoUrl ?? vaultHit?.logoUrl,
              shortCode: generateTeamInitials(cleanName),
              player1: (src.player1 ?? '').trim().isNotEmpty
                  ? src.player1!.trim()
                  : vaultHit?.player1,
              player2: (src.player2 ?? '').trim().isNotEmpty
                  ? src.player2!.trim()
                  : vaultHit?.player2,
              learnedTokens: src.learnedTokens.isNotEmpty
                  ? src.learnedTokens
                  : (vaultHit?.learnedTokens ?? const []),
            );
          }(),
      ];
    } else {
      newTeams = [
        for (int i = 0; i < squadInputs.length; i++)
          () {
            final cleanName = squadInputs[i].name.trim().isEmpty
                ? 'Squad ${i + 1}'
                : squadInputs[i].name.trim();
            final vaultHit = findSavedSquadByName(cleanName);
            return Team(
              id: 'team_${tournamentId}_${i + 1}',
              name: cleanName,
              logoUrl: squadInputs[i].logoUrl ?? vaultHit?.logoUrl,
              shortCode: generateTeamInitials(cleanName),
              player1: vaultHit?.player1,
              player2: vaultHit?.player2,
              learnedTokens: vaultHit?.learnedTokens ?? const [],
            );
          }(),
      ];
    }

    final match1Id = 'match_${tournamentId}_1';
    final initialEntries = {
      for (final t in newTeams) t.id: TeamMatchEntry(teamId: t.id),
    };

    final cleanHost = (hostName ?? '').trim();
    final cleanSponsor = (sponsorName ?? '').trim();

    final newSettings = TournamentSettings(
      mode: mode,
      name: name.trim().isEmpty ? 'Tournament $formattedDate' : name.trim(),
      roundOrDay: roundOrDay.trim().isEmpty ? 'FINALS' : roundOrDay.trim(),
      hostName: cleanHost.isEmpty ? null : cleanHost,
      sponsorName: cleanSponsor.isEmpty ? null : cleanSponsor,
      showLogos: showLogos,
      customLogoUrl: customLogoUrl,
      autoResultFromScreenshot: autoResultFromScreenshot,
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
      updatedAt: ts,
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

    late List<SavedSquadRecord> changedVault;
    _commit(() {
      _tournaments = [record, ..._tournaments];
      _activeTournamentId = tournamentId;
      _organizerDefaults = OrganizerDefaults(
        hostName:
            cleanHost.isNotEmpty ? cleanHost : _organizerDefaults.hostName,
        sponsorName: cleanSponsor.isNotEmpty
            ? cleanSponsor
            : _organizerDefaults.sponsorName,
        customLogoUrl: customLogoUrl ?? _organizerDefaults.customLogoUrl,
      );
      changedVault = _mergeTeamsIntoVault(newTeams, ts);
    });

    _cloudHooks.onTournamentUpsert?.call(record);
    if (changedVault.isNotEmpty) _cloudHooks.onSquadsUpsert?.call(changedVault);
    _cloudHooks.onMetaUpdate?.call();

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
    bool? autoResultFromScreenshot,
    int? totalMatchesPlanned,
    ChampionRushConfig? championRush,
    List<Team>? teams,
  }) {
    final nowMs = DateTime.now().millisecondsSinceEpoch;
    TournamentRecord? updatedRecord;
    List<SavedSquadRecord> changedVault = const [];

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
          autoResultFromScreenshot:
              autoResultFromScreenshot ?? t.settings.autoResultFromScreenshot,
          totalMatchesPlanned:
              totalMatchesPlanned ?? t.settings.totalMatchesPlanned,
          championRush: championRush ?? t.settings.championRush,
          teamCount: nextTeams.length,
        );

        updatedRecord = t.copyWith(
          name: nextSettings.name,
          updatedAt: nowMs,
          settings: nextSettings,
          teams: nextTeams,
          matches: nextMatches,
        );
        return updatedRecord!;
      }).toList();

      if (teams != null) {
        changedVault = _mergeTeamsIntoVault(teams, nowMs);
      }
      final cleanHost = (hostName ?? '').trim();
      final cleanSponsor = (sponsorName ?? '').trim();
      _organizerDefaults = OrganizerDefaults(
        hostName:
            cleanHost.isNotEmpty ? cleanHost : _organizerDefaults.hostName,
        sponsorName: cleanSponsor.isNotEmpty
            ? cleanSponsor
            : _organizerDefaults.sponsorName,
        customLogoUrl: clearCustomLogo
            ? _organizerDefaults.customLogoUrl
            : (customLogoUrl ?? _organizerDefaults.customLogoUrl),
      );
    });

    if (updatedRecord != null) {
      _cloudHooks.onTournamentUpsert?.call(updatedRecord!);
    }
    if (changedVault.isNotEmpty) _cloudHooks.onSquadsUpsert?.call(changedVault);
    _cloudHooks.onMetaUpdate?.call();
  }

  void switchActiveTournament(String id) {
    _commit(() {
      _activeTournamentId = id;
    });
    _cloudHooks.onMetaUpdate?.call();
  }

  void deleteTournament(String id) {
    _commit(() {
      _tournaments = _tournaments.where((t) => t.id != id).toList();
      if (_activeTournamentId == id) {
        _activeTournamentId =
            _tournaments.isNotEmpty ? _tournaments.first.id : null;
      }
    });
    _cloudHooks.onTournamentDelete?.call(id);
    _cloudHooks.onMetaUpdate?.call();
  }

  void endTournamentById(String id) {
    final nowMs = DateTime.now().millisecondsSinceEpoch;
    TournamentRecord? updated;
    _commit(() {
      _tournaments = _tournaments.map((t) {
        if (t.id != id) return t;
        final res = calculateTournamentStandings(
          t.teams,
          t.matches,
          t.settings.copyWith(isManuallyEnded: true),
        );
        final leader = res.standings.isNotEmpty ? res.standings.first : null;
        updated = t.copyWith(
          updatedAt: nowMs,
          isEnded: true,
          settings: t.settings.copyWith(isManuallyEnded: true),
          championTeamName: leader?.teamName,
          championScore: leader?.totalPoints,
        );
        return updated!;
      }).toList();
    });
    if (updated != null) _cloudHooks.onTournamentUpsert?.call(updated!);
  }

  void reopenTournamentById(String id) {
    final nowMs = DateTime.now().millisecondsSinceEpoch;
    TournamentRecord? updated;
    _commit(() {
      _tournaments = _tournaments.map((t) {
        if (t.id != id) return t;
        updated = t.copyWith(
          updatedAt: nowMs,
          isEnded: false,
          settings: t.settings.copyWith(isManuallyEnded: false),
        );
        return updated!;
      }).toList();
    });
    if (updated != null) _cloudHooks.onTournamentUpsert?.call(updated!);
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
    final nowMs = DateTime.now().millisecondsSinceEpoch;
    TournamentRecord? updated;
    _commit(() {
      _tournaments = _tournaments.map((t) {
        if (t.id != active.id) return t;
        updated = t.copyWith(
          updatedAt: nowMs,
          settings: t.settings.copyWith(theme: theme),
        );
        return updated!;
      }).toList();
    });
    if (updated != null) _cloudHooks.onTournamentUpsert?.call(updated!);
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
    final nowMs = DateTime.now().millisecondsSinceEpoch;
    TournamentRecord? updated;
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
        updated = t.copyWith(
          name: nextName,
          updatedAt: nowMs,
          settings: nextSettings,
        );
        return updated!;
      }).toList();
    });
    if (updated != null) _cloudHooks.onTournamentUpsert?.call(updated!);
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
          player1: source.teams[i].player1,
          player2: source.teams[i].player2,
          learnedTokens: List<String>.from(source.teams[i].learnedTokens),
        ),
    ];

    final match1Id = 'match_${nextId}_1';
    final cleanEntries = {
      for (final tm in clonedTeams) tm.id: TeamMatchEntry(teamId: tm.id),
    };

    final nextStage = incrementStageOrDayLabel(source.settings.roundOrDay);
    final cloned = TournamentRecord(
      id: nextId,
      name: source.name,
      createdAt: formattedDate,
      createdAtTimestamp: ts,
      updatedAt: ts,
      settings: source.settings.copyWith(
        roundOrDay: nextStage,
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

    _cloudHooks.onTournamentUpsert?.call(cloned);
    _cloudHooks.onMetaUpdate?.call();
    return nextId;
  }

  void updateDefaultPointSystem(PointSystemConfig nextConfig) {
    final nowMs = DateTime.now().millisecondsSinceEpoch;
    TournamentRecord? updated;
    _commit(() {
      _defaultPointSystem = nextConfig.copyWith();
      final active = activeTournament;
      if (active != null) {
        _tournaments = _tournaments.map((t) {
          if (t.id != active.id) return t;
          updated = t.copyWith(
            updatedAt: nowMs,
            settings: t.settings.copyWith(pointSystem: nextConfig.copyWith()),
          );
          return updated!;
        }).toList();
      }
    });
    if (updated != null) _cloudHooks.onTournamentUpsert?.call(updated!);
    _cloudHooks.onMetaUpdate?.call();
  }

  String createMatch() {
    final active = activeTournament;
    if (active == null) return '';
    final nowMs = DateTime.now().millisecondsSinceEpoch;

    final nextNum = active.matches.isEmpty
        ? 1
        : active.matches.map((m) => m.matchNumber).reduce(math.max) + 1;
    final matchId = 'match_${active.id}_$nowMs';

    final entries = {
      for (final t in active.teams) t.id: TeamMatchEntry(teamId: t.id),
    };

    final newMatch = MatchRecord(
      id: matchId,
      matchNumber: nextNum,
      entries: entries,
      isCompleted: false,
      createdAt: nowMs,
    );

    TournamentRecord? updated;
    _commit(() {
      _tournaments = _tournaments.map((t) {
        if (t.id != active.id) return t;
        updated = t.copyWith(
          updatedAt: nowMs,
          matches: [...t.matches, newMatch],
        );
        return updated!;
      }).toList();
    });

    if (updated != null) _cloudHooks.onTournamentUpsert?.call(updated!);
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
    final nowMs = DateTime.now().millisecondsSinceEpoch;
    TournamentRecord? updated;
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
        updated = t.copyWith(updatedAt: nowMs, matches: nextMatches);
        return updated!;
      }).toList();
    });
    if (updated != null) _cloudHooks.onTournamentUpsert?.call(updated!);
  }

  void applyBatchMatchResults({
    required String matchId,
    required List<({String teamId, int? placement, int kills})> entries,
    Map<String, List<String>>? learnedByTeamId,
  }) {
    final active = activeTournament;
    if (active == null) return;
    final nowMs = DateTime.now().millisecondsSinceEpoch;
    TournamentRecord? updated;
    List<SavedSquadRecord> changedVault = const [];

    _commit(() {
      _tournaments = _tournaments.map((t) {
        if (t.id != active.id) return t;
        final nextTeams = learnedByTeamId != null
            ? t.teams.map((tm) {
                final extra = learnedByTeamId[tm.id];
                if (extra == null || extra.isEmpty) return tm;
                final combined = <String>{
                  ...tm.learnedTokens,
                  ...extra,
                }.take(32).toList();
                return tm.copyWith(learnedTokens: combined);
              }).toList()
            : t.teams;

        final nextMatches = t.matches.map((m) {
          if (m.id != matchId) return m;
          final nextEntries = Map<String, TeamMatchEntry>.from(m.entries);
          for (final item in entries) {
            nextEntries[item.teamId] = TeamMatchEntry(
              teamId: item.teamId,
              placement: item.placement,
              kills: math.max(0, item.kills),
            );
          }
          return m.copyWith(entries: nextEntries);
        }).toList();

        updated = t.copyWith(
          updatedAt: nowMs,
          teams: nextTeams,
          matches: nextMatches,
        );
        return updated!;
      }).toList();

      if (updated != null && learnedByTeamId != null) {
        changedVault = _mergeTeamsIntoVault(updated!.teams, nowMs);
      }
    });

    if (updated != null) _cloudHooks.onTournamentUpsert?.call(updated!);
    if (changedVault.isNotEmpty) _cloudHooks.onSquadsUpsert?.call(changedVault);
  }

  void completeMatch(String matchId) {
    final active = activeTournament;
    if (active == null) return;
    final nowMs = DateTime.now().millisecondsSinceEpoch;
    TournamentRecord? updated;
    _commit(() {
      _tournaments = _tournaments.map((t) {
        if (t.id != active.id) return t;
        final nextMatches = t.matches
            .map((m) => m.id == matchId ? m.copyWith(isCompleted: true) : m)
            .toList();
        updated = t.copyWith(updatedAt: nowMs, matches: nextMatches);
        return updated!;
      }).toList();
    });
    if (updated != null) _cloudHooks.onTournamentUpsert?.call(updated!);
  }

  void reopenMatch(String matchId) {
    final active = activeTournament;
    if (active == null) return;
    final nowMs = DateTime.now().millisecondsSinceEpoch;
    TournamentRecord? updated;
    _commit(() {
      _tournaments = _tournaments.map((t) {
        if (t.id != active.id) return t;
        final nextMatches = t.matches
            .map((m) => m.id == matchId ? m.copyWith(isCompleted: false) : m)
            .toList();
        updated = t.copyWith(updatedAt: nowMs, matches: nextMatches);
        return updated!;
      }).toList();
    });
    if (updated != null) _cloudHooks.onTournamentUpsert?.call(updated!);
  }

  void deleteMatch(String matchId) {
    final active = activeTournament;
    if (active == null || active.matches.length <= 1) return;
    final nowMs = DateTime.now().millisecondsSinceEpoch;
    TournamentRecord? updated;
    _commit(() {
      _tournaments = _tournaments.map((t) {
        if (t.id != active.id) return t;
        final remaining = t.matches.where((m) => m.id != matchId).toList();
        final renumbered = [
          for (int i = 0; i < remaining.length; i++)
            remaining[i].copyWith(matchNumber: i + 1),
        ];
        updated = t.copyWith(updatedAt: nowMs, matches: renumbered);
        return updated!;
      }).toList();
    });
    if (updated != null) _cloudHooks.onTournamentUpsert?.call(updated!);
  }

  void resetActiveMatchData() {
    final active = activeTournament;
    if (active == null) return;
    final nowMs = DateTime.now().millisecondsSinceEpoch;
    final cleanEntries = {
      for (final team in active.teams) team.id: TeamMatchEntry(teamId: team.id),
    };
    final cleanMatch1 = MatchRecord(
      id: 'match_${active.id}_1',
      matchNumber: 1,
      entries: cleanEntries,
      isCompleted: false,
      createdAt: nowMs,
    );
    TournamentRecord? updated;
    _commit(() {
      _tournaments = _tournaments.map((t) {
        if (t.id != active.id) return t;
        updated = t.copyWith(
          updatedAt: nowMs,
          matches: [cleanMatch1],
          isEnded: false,
          settings: t.settings.copyWith(isManuallyEnded: false),
        );
        return updated!;
      }).toList();
    });
    if (updated != null) _cloudHooks.onTournamentUpsert?.call(updated!);
  }

  void applyCloudWorkspace({
    List<TournamentRecord>? tournaments,
    List<SavedSquadRecord>? savedSquads,
    String? activeTournamentId,
    bool updateActiveId = false,
    PointSystemConfig? defaultPointSystem,
    OrganizerDefaults? organizerDefaults,
  }) {
    _commit(() {
      if (tournaments != null) _tournaments = tournaments;
      if (savedSquads != null) _savedSquads = savedSquads;
      if (defaultPointSystem != null) _defaultPointSystem = defaultPointSystem;
      if (organizerDefaults != null) _organizerDefaults = organizerDefaults;
      if (updateActiveId) {
        if (activeTournamentId != null &&
            _tournaments.any((t) => t.id == activeTournamentId)) {
          _activeTournamentId = activeTournamentId;
        } else if (_activeTournamentId == null && _tournaments.isNotEmpty) {
          _activeTournamentId = _tournaments.first.id;
        }
      }
    });
  }

  String exportJson() {
    return const JsonEncoder.withIndent('  ').convert({
      'tournaments': _tournaments.map((t) => t.toJson()).toList(),
      'savedSquads': _savedSquads.map((s) => s.toJson()).toList(),
      'activeTournamentId': _activeTournamentId,
      'defaultPointSystem': _defaultPointSystem.toJson(),
      'exportedAt': DateTime.now().toUtc().toIso8601String(),
    });
  }

  String? _sanitizeImageUrl(String? raw) {
    if (raw == null) return null;
    final trimmed = raw.trim();
    if (trimmed.isEmpty || trimmed.length > 2000000) return null;
    if (trimmed.startsWith('/assets/')) return trimmed;
    final dataImg = RegExp(
      r'^data:image/(png|jpeg|jpg|webp|gif|bmp);base64,[a-zA-Z0-9+/=\s]+$',
      caseSensitive: false,
    );
    if (dataImg.hasMatch(trimmed)) return trimmed;
    final uri = Uri.tryParse(trimmed);
    if (uri != null && (uri.scheme == 'https' || uri.scheme == 'http')) {
      return trimmed;
    }
    return null;
  }

  bool importJson(String rawJson) {
    try {
      if (rawJson.length > 15000000) return false;
      final parsed = jsonDecode(rawJson);
      if (parsed is! Map<String, dynamic>) return false;
      final rawList = parsed['tournaments'];
      if (rawList is! List || rawList.length > 100) return false;

      final imported = rawList
          .take(100)
          .whereType<Map<String, dynamic>>()
          .map((rawItem) {
        final t = TournamentRecord.fromJson(rawItem);
        final s = t.settings;
        final cleanSettings = TournamentSettings(
          mode: s.mode,
          name: s.name,
          roundOrDay: s.roundOrDay,
          hostName: s.hostName,
          hostLogoUrl: _sanitizeImageUrl(s.hostLogoUrl),
          sponsorName: s.sponsorName,
          sponsorLogoUrl: _sanitizeImageUrl(s.sponsorLogoUrl),
          showLogos: s.showLogos,
          totalMatchesPlanned: s.totalMatchesPlanned,
          teamCount: s.teamCount,
          pointSystem: s.pointSystem,
          tieBreakOrder: s.tieBreakOrder,
          championRush: s.championRush,
          theme: s.theme,
          customLogoUrl: _sanitizeImageUrl(s.customLogoUrl),
          isManuallyEnded: s.isManuallyEnded,
          autoResultFromScreenshot: s.autoResultFromScreenshot,
        );
        final cleanTeams = t.teams.take(64).map((tm) {
          final safeLogo = _sanitizeImageUrl(tm.logoUrl);
          return Team(
            id: tm.id,
            name: tm.name,
            logoUrl: safeLogo,
            shortCode: tm.shortCode,
            player1: tm.player1,
            player2: tm.player2,
            learnedTokens: tm.learnedTokens,
          );
        }).toList();
        return t.copyWith(
          settings: cleanSettings,
          teams: cleanTeams,
          matches: t.matches.take(64).toList(),
        );
      }).toList();
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
