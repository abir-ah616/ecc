enum TournamentMode { scrim, championRush }

enum ThemePreset { v2, scarlet, volt, whiteout, blue, gold, eclipse }

enum StandingsViewMode { overall, singleMatch }

enum AspectRatioMode { ratio16x9, ratio4x5 }

enum TieBreakCriterion {
  totalPoints,
  booyahs,
  placementPoints,
  kills,
  lastMatchPlacement,
}

enum RushStatusType { notActive, active, champion }

enum ConclusionReason {
  championCrowned,
  maxMatchesReached,
  scrimCompleted,
  organizerEnded,
}

String tournamentModeToJson(TournamentMode m) =>
    m == TournamentMode.championRush ? 'CHAMPION_RUSH' : 'SCRIM';

TournamentMode tournamentModeFromJson(String? val) =>
    val == 'CHAMPION_RUSH' ? TournamentMode.championRush : TournamentMode.scrim;

String themePresetToJson(ThemePreset t) => t.name;

ThemePreset themePresetFromJson(String? val) {
  if (val == 'crimson') return ThemePreset.scarlet;
  if (val == 'emerald' || val == 'cobalt') return ThemePreset.volt;
  if (val == 'violet') return ThemePreset.whiteout;
  return ThemePreset.values.firstWhere(
    (e) => e.name == val,
    orElse: () => ThemePreset.v2,
  );
}

String tieBreakToJson(TieBreakCriterion c) => c.name;

TieBreakCriterion tieBreakFromJson(String? val) {
  return TieBreakCriterion.values.firstWhere(
    (e) => e.name == val,
    orElse: () => TieBreakCriterion.totalPoints,
  );
}

class PointSystemConfig {
  final List<int> placementPoints;
  final int killPoints;

  const PointSystemConfig({
    required this.placementPoints,
    this.killPoints = 1,
  });

  factory PointSystemConfig.fromJson(Map<String, dynamic> json) {
    final raw = (json['placementPoints'] as List<dynamic>?)
            ?.map((e) => (e as num).toInt())
            .toList() ??
        const [12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    return PointSystemConfig(
      placementPoints: raw,
      killPoints: (json['killPoints'] as num?)?.toInt() ?? 1,
    );
  }

  Map<String, dynamic> toJson() => {
        'placementPoints': placementPoints,
        'killPoints': killPoints,
      };

  PointSystemConfig copyWith({
    List<int>? placementPoints,
    int? killPoints,
  }) =>
      PointSystemConfig(
        placementPoints: placementPoints ?? List<int>.from(this.placementPoints),
        killPoints: killPoints ?? this.killPoints,
      );
}

class ChampionRushConfig {
  final int targetPoints;
  final int maxMatches;
  final bool allowSameMatchBooyahActivation;

  const ChampionRushConfig({
    this.targetPoints = 80,
    this.maxMatches = 8,
    this.allowSameMatchBooyahActivation = false,
  });

  factory ChampionRushConfig.fromJson(Map<String, dynamic> json) =>
      ChampionRushConfig(
        targetPoints: (json['targetPoints'] as num?)?.toInt() ?? 80,
        maxMatches: (json['maxMatches'] as num?)?.toInt() ?? 8,
        allowSameMatchBooyahActivation:
            json['allowSameMatchBooyahActivation'] as bool? ?? false,
      );

  Map<String, dynamic> toJson() => {
        'targetPoints': targetPoints,
        'maxMatches': maxMatches,
        'allowSameMatchBooyahActivation': allowSameMatchBooyahActivation,
      };

  ChampionRushConfig copyWith({
    int? targetPoints,
    int? maxMatches,
    bool? allowSameMatchBooyahActivation,
  }) =>
      ChampionRushConfig(
        targetPoints: targetPoints ?? this.targetPoints,
        maxMatches: maxMatches ?? this.maxMatches,
        allowSameMatchBooyahActivation: allowSameMatchBooyahActivation ??
            this.allowSameMatchBooyahActivation,
      );
}

class TournamentSettings {
  final TournamentMode mode;
  final String name;
  final String roundOrDay;
  final String? hostName;
  final String? hostLogoUrl;
  final String? sponsorName;
  final String? sponsorLogoUrl;
  final bool showLogos;
  final int totalMatchesPlanned;
  final int teamCount;
  final PointSystemConfig pointSystem;
  final List<TieBreakCriterion> tieBreakOrder;
  final ChampionRushConfig championRush;
  final ThemePreset theme;
  final String? customLogoUrl;
  final bool isManuallyEnded;
  final bool autoResultFromScreenshot;

  const TournamentSettings({
    required this.mode,
    required this.name,
    required this.roundOrDay,
    this.hostName,
    this.hostLogoUrl,
    this.sponsorName,
    this.sponsorLogoUrl,
    this.showLogos = true,
    required this.totalMatchesPlanned,
    required this.teamCount,
    required this.pointSystem,
    required this.tieBreakOrder,
    required this.championRush,
    this.theme = ThemePreset.v2,
    this.customLogoUrl,
    this.isManuallyEnded = false,
    this.autoResultFromScreenshot = false,
  });

  factory TournamentSettings.fromJson(Map<String, dynamic> json) {
    final rawTie = (json['tieBreakOrder'] as List<dynamic>?)
            ?.map((e) => tieBreakFromJson(e as String?))
            .toList() ??
        const [
          TieBreakCriterion.totalPoints,
          TieBreakCriterion.booyahs,
          TieBreakCriterion.placementPoints,
          TieBreakCriterion.kills,
          TieBreakCriterion.lastMatchPlacement,
        ];

    return TournamentSettings(
      mode: tournamentModeFromJson(json['mode'] as String?),
      name: (json['name'] as String?) ?? 'Tournament',
      roundOrDay: (json['roundOrDay'] as String?) ?? 'FINALS',
      hostName: json['hostName'] as String?,
      hostLogoUrl: json['hostLogoUrl'] as String?,
      sponsorName: json['sponsorName'] as String?,
      sponsorLogoUrl: json['sponsorLogoUrl'] as String?,
      showLogos: json['showLogos'] as bool? ?? true,
      totalMatchesPlanned: (json['totalMatchesPlanned'] as num?)?.toInt() ?? 5,
      teamCount: (json['teamCount'] as num?)?.toInt() ?? 12,
      pointSystem: PointSystemConfig.fromJson(
        (json['pointSystem'] as Map<String, dynamic>?) ?? const {},
      ),
      tieBreakOrder: rawTie,
      championRush: ChampionRushConfig.fromJson(
        (json['championRush'] as Map<String, dynamic>?) ?? const {},
      ),
      theme: themePresetFromJson(json['theme'] as String?),
      customLogoUrl: json['customLogoUrl'] as String?,
      isManuallyEnded: json['isManuallyEnded'] as bool? ?? false,
      autoResultFromScreenshot:
          json['autoResultFromScreenshot'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'mode': tournamentModeToJson(mode),
        'name': name,
        'roundOrDay': roundOrDay,
        if (hostName != null) 'hostName': hostName,
        if (hostLogoUrl != null) 'hostLogoUrl': hostLogoUrl,
        if (sponsorName != null) 'sponsorName': sponsorName,
        if (sponsorLogoUrl != null) 'sponsorLogoUrl': sponsorLogoUrl,
        'showLogos': showLogos,
        'totalMatchesPlanned': totalMatchesPlanned,
        'teamCount': teamCount,
        'pointSystem': pointSystem.toJson(),
        'tieBreakOrder': tieBreakOrder.map(tieBreakToJson).toList(),
        'championRush': championRush.toJson(),
        'theme': themePresetToJson(theme),
        if (customLogoUrl != null) 'customLogoUrl': customLogoUrl,
        'isManuallyEnded': isManuallyEnded,
        'autoResultFromScreenshot': autoResultFromScreenshot,
      };

  TournamentSettings copyWith({
    TournamentMode? mode,
    String? name,
    String? roundOrDay,
    String? hostName,
    String? hostLogoUrl,
    String? sponsorName,
    String? sponsorLogoUrl,
    bool? showLogos,
    int? totalMatchesPlanned,
    int? teamCount,
    PointSystemConfig? pointSystem,
    List<TieBreakCriterion>? tieBreakOrder,
    ChampionRushConfig? championRush,
    ThemePreset? theme,
    String? customLogoUrl,
    bool clearCustomLogo = false,
    bool? isManuallyEnded,
    bool? autoResultFromScreenshot,
  }) =>
      TournamentSettings(
        mode: mode ?? this.mode,
        name: name ?? this.name,
        roundOrDay: roundOrDay ?? this.roundOrDay,
        hostName: hostName ?? this.hostName,
        hostLogoUrl: hostLogoUrl ?? this.hostLogoUrl,
        sponsorName: sponsorName ?? this.sponsorName,
        sponsorLogoUrl: sponsorLogoUrl ?? this.sponsorLogoUrl,
        showLogos: showLogos ?? this.showLogos,
        totalMatchesPlanned: totalMatchesPlanned ?? this.totalMatchesPlanned,
        teamCount: teamCount ?? this.teamCount,
        pointSystem: pointSystem ?? this.pointSystem,
        tieBreakOrder: tieBreakOrder ?? this.tieBreakOrder,
        championRush: championRush ?? this.championRush,
        theme: theme ?? this.theme,
        customLogoUrl:
            clearCustomLogo ? null : (customLogoUrl ?? this.customLogoUrl),
        isManuallyEnded: isManuallyEnded ?? this.isManuallyEnded,
        autoResultFromScreenshot:
            autoResultFromScreenshot ?? this.autoResultFromScreenshot,
      );
}

class Team {
  final String id;
  final String name;
  final String? logoUrl;
  final String? shortCode;
  final String? player1;
  final String? player2;
  final List<String> players;
  final List<String> learnedTokens;

  const Team({
    required this.id,
    required this.name,
    this.logoUrl,
    this.shortCode,
    this.player1,
    this.player2,
    this.players = const [],
    this.learnedTokens = const [],
  });

  factory Team.fromJson(Map<String, dynamic> json) => Team(
        id: json['id'] as String,
        name: json['name'] as String,
        logoUrl: json['logoUrl'] as String?,
        shortCode: json['shortCode'] as String?,
        player1: json['player1'] as String?,
        player2: json['player2'] as String?,
        players: ((json['players'] as List<dynamic>?) ?? const [])
            .whereType<String>()
            .toList(),
        learnedTokens: ((json['learnedTokens'] as List<dynamic>?) ?? const [])
            .whereType<String>()
            .toList(),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        if (logoUrl != null) 'logoUrl': logoUrl,
        if (shortCode != null) 'shortCode': shortCode,
        if (player1 != null && player1!.trim().isNotEmpty)
          'player1': player1!.trim(),
        if (player2 != null && player2!.trim().isNotEmpty)
          'player2': player2!.trim(),
        if (players.isNotEmpty) 'players': players,
        if (learnedTokens.isNotEmpty) 'learnedTokens': learnedTokens,
      };

  Team copyWith({
    String? id,
    String? name,
    String? logoUrl,
    bool clearLogo = false,
    String? shortCode,
    String? player1,
    bool clearPlayer1 = false,
    String? player2,
    bool clearPlayer2 = false,
    List<String>? players,
    List<String>? learnedTokens,
  }) =>
      Team(
        id: id ?? this.id,
        name: name ?? this.name,
        logoUrl: clearLogo ? null : (logoUrl ?? this.logoUrl),
        shortCode: shortCode ?? this.shortCode,
        player1: clearPlayer1 ? null : (player1 ?? this.player1),
        player2: clearPlayer2 ? null : (player2 ?? this.player2),
        players: players ?? this.players,
        learnedTokens: learnedTokens ?? this.learnedTokens,
      );
}

class TeamMatchEntry {
  final String teamId;
  final int? placement;
  final int kills;

  const TeamMatchEntry({
    required this.teamId,
    this.placement,
    this.kills = 0,
  });

  factory TeamMatchEntry.fromJson(Map<String, dynamic> json) => TeamMatchEntry(
        teamId: json['teamId'] as String,
        placement: (json['placement'] as num?)?.toInt(),
        kills: (json['kills'] as num?)?.toInt() ?? 0,
      );

  Map<String, dynamic> toJson() => {
        'teamId': teamId,
        'placement': placement,
        'kills': kills,
      };

  TeamMatchEntry copyWith({
    int? placement,
    bool clearPlacement = false,
    int? kills,
  }) =>
      TeamMatchEntry(
        teamId: teamId,
        placement: clearPlacement ? null : (placement ?? this.placement),
        kills: kills ?? this.kills,
      );
}

class MatchRecord {
  final String id;
  final int matchNumber;
  final Map<String, TeamMatchEntry> entries;
  final bool isCompleted;
  final int createdAt;

  const MatchRecord({
    required this.id,
    required this.matchNumber,
    required this.entries,
    required this.isCompleted,
    required this.createdAt,
  });

  factory MatchRecord.fromJson(Map<String, dynamic> json) {
    final rawEntries = (json['entries'] as Map<String, dynamic>?) ?? const {};
    final parsedEntries = <String, TeamMatchEntry>{};
    rawEntries.forEach((key, value) {
      if (value is Map<String, dynamic>) {
        parsedEntries[key] = TeamMatchEntry.fromJson(value);
      }
    });
    return MatchRecord(
      id: json['id'] as String,
      matchNumber: (json['matchNumber'] as num).toInt(),
      entries: parsedEntries,
      isCompleted: json['isCompleted'] as bool? ?? false,
      createdAt: (json['createdAt'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'matchNumber': matchNumber,
        'entries': entries.map((k, v) => MapEntry(k, v.toJson())),
        'isCompleted': isCompleted,
        'createdAt': createdAt,
      };

  MatchRecord copyWith({
    int? matchNumber,
    Map<String, TeamMatchEntry>? entries,
    bool? isCompleted,
  }) =>
      MatchRecord(
        id: id,
        matchNumber: matchNumber ?? this.matchNumber,
        entries: entries ?? this.entries,
        isCompleted: isCompleted ?? this.isCompleted,
        createdAt: createdAt,
      );
}

class TeamRushStatus {
  final RushStatusType status;
  final int? activatedAtMatch;
  final int? crownedAtMatch;

  const TeamRushStatus._({
    required this.status,
    this.activatedAtMatch,
    this.crownedAtMatch,
  });

  const TeamRushStatus.notActive()
      : this._(status: RushStatusType.notActive);

  const TeamRushStatus.active(int matchNumber)
      : this._(status: RushStatusType.active, activatedAtMatch: matchNumber);

  const TeamRushStatus.champion(int matchNumber)
      : this._(status: RushStatusType.champion, crownedAtMatch: matchNumber);

  Map<String, dynamic> toJson() {
    switch (status) {
      case RushStatusType.notActive:
        return {'status': 'NOT_ACTIVE'};
      case RushStatusType.active:
        return {'status': 'ACTIVE', 'activatedAtMatch': activatedAtMatch ?? 1};
      case RushStatusType.champion:
        return {'status': 'CHAMPION', 'crownedAtMatch': crownedAtMatch ?? 1};
    }
  }
}

class TeamMatchResult {
  final String teamId;
  final int placement;
  final int placementPoints;
  final int kills;
  final int killPoints;
  final int totalPoints;
  final bool isBooyah;

  const TeamMatchResult({
    required this.teamId,
    required this.placement,
    required this.placementPoints,
    required this.kills,
    required this.killPoints,
    required this.totalPoints,
    required this.isBooyah,
  });
}

class TeamCumulativeStanding {
  final String teamId;
  final String teamName;
  final String? logoUrl;
  final String? shortCode;
  final int rank;
  final int booyahCount;
  final int kills;
  final int killPoints;
  final int placementPoints;
  final int totalPoints;
  final int lastMatchPlacement;
  final TeamRushStatus rushStatus;
  final double progressToTarget;

  const TeamCumulativeStanding({
    required this.teamId,
    required this.teamName,
    this.logoUrl,
    this.shortCode,
    required this.rank,
    required this.booyahCount,
    required this.kills,
    required this.killPoints,
    required this.placementPoints,
    required this.totalPoints,
    required this.lastMatchPlacement,
    required this.rushStatus,
    required this.progressToTarget,
  });

  TeamCumulativeStanding withRank(int nextRank) => TeamCumulativeStanding(
        teamId: teamId,
        teamName: teamName,
        logoUrl: logoUrl,
        shortCode: shortCode,
        rank: nextRank,
        booyahCount: booyahCount,
        kills: kills,
        killPoints: killPoints,
        placementPoints: placementPoints,
        totalPoints: totalPoints,
        lastMatchPlacement: lastMatchPlacement,
        rushStatus: rushStatus,
        progressToTarget: progressToTarget,
      );

  Map<String, dynamic> toJson() => {
        'teamId': teamId,
        'teamName': teamName,
        if (logoUrl != null) 'logoUrl': logoUrl,
        if (shortCode != null) 'shortCode': shortCode,
        'rank': rank,
        'booyahCount': booyahCount,
        'kills': kills,
        'killPoints': killPoints,
        'placementPoints': placementPoints,
        'totalPoints': totalPoints,
        'lastMatchPlacement': lastMatchPlacement,
        'rushStatus': rushStatus.toJson(),
        'progressToTarget': progressToTarget,
      };
}

class StandingsResult {
  final List<TeamCumulativeStanding> standings;
  final String? championTeamId;
  final bool tournamentConcluded;
  final ConclusionReason? conclusionReason;

  const StandingsResult({
    required this.standings,
    this.championTeamId,
    required this.tournamentConcluded,
    this.conclusionReason,
  });
}

class TournamentRecord {
  final String id;
  final String name;
  final String createdAt;
  final int createdAtTimestamp;
  final int updatedAt;
  final TournamentSettings settings;
  final List<Team> teams;
  final List<MatchRecord> matches;
  final bool isEnded;
  final String? championTeamName;
  final int? championScore;

  const TournamentRecord({
    required this.id,
    required this.name,
    required this.createdAt,
    required this.createdAtTimestamp,
    int? updatedAt,
    required this.settings,
    required this.teams,
    required this.matches,
    required this.isEnded,
    this.championTeamName,
    this.championScore,
  }) : updatedAt = updatedAt ?? createdAtTimestamp;

  factory TournamentRecord.fromJson(Map<String, dynamic> json) {
    final createdTs = (json['createdAtTimestamp'] as num?)?.toInt() ?? 0;
    return TournamentRecord(
      id: json['id'] as String,
      name: json['name'] as String,
      createdAt: (json['createdAt'] as String?) ?? '',
      createdAtTimestamp: createdTs,
      updatedAt: (json['updatedAt'] as num?)?.toInt() ?? createdTs,
      settings: TournamentSettings.fromJson(
        (json['settings'] as Map<String, dynamic>?) ?? const {},
      ),
      teams: ((json['teams'] as List<dynamic>?) ?? const [])
          .map((e) => Team.fromJson(e as Map<String, dynamic>))
          .toList(),
      matches: ((json['matches'] as List<dynamic>?) ?? const [])
          .map((e) => MatchRecord.fromJson(e as Map<String, dynamic>))
          .toList(),
      isEnded: json['isEnded'] as bool? ?? false,
      championTeamName: json['championTeamName'] as String?,
      championScore: (json['championScore'] as num?)?.toInt(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'createdAt': createdAt,
        'createdAtTimestamp': createdAtTimestamp,
        'updatedAt': updatedAt,
        'settings': settings.toJson(),
        'teams': teams.map((t) => t.toJson()).toList(),
        'matches': matches.map((m) => m.toJson()).toList(),
        'isEnded': isEnded,
        if (championTeamName != null) 'championTeamName': championTeamName,
        if (championScore != null) 'championScore': championScore,
      };

  TournamentRecord copyWith({
    String? name,
    int? updatedAt,
    TournamentSettings? settings,
    List<Team>? teams,
    List<MatchRecord>? matches,
    bool? isEnded,
    String? championTeamName,
    int? championScore,
  }) =>
      TournamentRecord(
        id: id,
        name: name ?? this.name,
        createdAt: createdAt,
        createdAtTimestamp: createdAtTimestamp,
        updatedAt: updatedAt ?? this.updatedAt,
        settings: settings ?? this.settings,
        teams: teams ?? this.teams,
        matches: matches ?? this.matches,
        isEnded: isEnded ?? this.isEnded,
        championTeamName: championTeamName ?? this.championTeamName,
        championScore: championScore ?? this.championScore,
      );
}

class SavedSquadRecord {
  final String id;
  final String name;
  final String shortCode;
  final String? logoUrl;
  final String? player1;
  final String? player2;
  final List<String> players;
  final List<String> learnedTokens;
  final int updatedAt;

  const SavedSquadRecord({
    required this.id,
    required this.name,
    required this.shortCode,
    this.logoUrl,
    this.player1,
    this.player2,
    this.players = const [],
    this.learnedTokens = const [],
    required this.updatedAt,
  });

  factory SavedSquadRecord.fromJson(Map<String, dynamic> json) =>
      SavedSquadRecord(
        id: (json['id'] as String?) ?? '',
        name: (json['name'] as String?) ?? 'Squad',
        shortCode: (json['shortCode'] as String?) ?? 'SQ',
        logoUrl: json['logoUrl'] as String?,
        player1: json['player1'] as String?,
        player2: json['player2'] as String?,
        players: ((json['players'] as List<dynamic>?) ?? const [])
            .whereType<String>()
            .toList(),
        learnedTokens: ((json['learnedTokens'] as List<dynamic>?) ?? const [])
            .whereType<String>()
            .toList(),
        updatedAt: (json['updatedAt'] as num?)?.toInt() ?? 0,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'shortCode': shortCode,
        if (logoUrl != null) 'logoUrl': logoUrl,
        if (player1 != null && player1!.trim().isNotEmpty)
          'player1': player1!.trim(),
        if (player2 != null && player2!.trim().isNotEmpty)
          'player2': player2!.trim(),
        if (players.isNotEmpty) 'players': players,
        if (learnedTokens.isNotEmpty) 'learnedTokens': learnedTokens,
        'updatedAt': updatedAt,
      };
}

class OrganizerDefaults {
  final String hostName;
  final String sponsorName;
  final String? customLogoUrl;

  const OrganizerDefaults({
    this.hostName = '',
    this.sponsorName = '',
    this.customLogoUrl,
  });

  factory OrganizerDefaults.fromJson(Map<String, dynamic> json) =>
      OrganizerDefaults(
        hostName: (json['hostName'] as String?) ?? '',
        sponsorName: (json['sponsorName'] as String?) ?? '',
        customLogoUrl: json['customLogoUrl'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'hostName': hostName,
        'sponsorName': sponsorName,
        if (customLogoUrl != null) 'customLogoUrl': customLogoUrl,
      };
}
