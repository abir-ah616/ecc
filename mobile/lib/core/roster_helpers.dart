import '../models/tournament_models.dart';

final RegExp _kPlaceholderSquadRegex =
    RegExp(r'^(?:squad|team|slot)\s*\d+$', caseSensitive: false);

bool isPlaceholderSquadName(String name) {
  final trimmed = name.trim();
  return trimmed.isEmpty || _kPlaceholderSquadRegex.hasMatch(trimmed);
}

String toSquadVaultId(String name) {
  final slug = name
      .trim()
      .toLowerCase()
      .replaceAll(RegExp(r'[^a-z0-9]+'), '_')
      .replaceAll(RegExp(r'^_+|_+$'), '');
  final clipped = slug.length > 80 ? slug.substring(0, 80) : slug;
  return 'sq_${clipped.isEmpty ? 'team' : clipped}';
}

List<String> parseSmartSlotList(String rawText, {int maxTeams = 24}) {
  if (rawText.trim().isEmpty) return const [];

  final lines = rawText.split(RegExp(r'\r?\n'));
  final cleaned = <String>[];

  final headerRe = RegExp(
    r'^(?:slot\s*list|team\s*list|confirmed\s*(?:teams|squads)|registered\s*teams)\s*:?$',
    caseSensitive: false,
  );
  final prefixRe = RegExp(
    r'^(?:[-*•]+\s*)?(?:\[?\s*(?:slot|team|no\.?|#)\s*\d+\s*\]?|#?\d{1,2})\s*(?:[-–—:|.)\]]+\s*|\s+)',
    caseSensitive: false,
  );
  final suffixRe = RegExp(
    r'\s*(?:[|\-–—]\s*|\(\s*|\[\s*)(?:confirmed|confirm|paid|booked|verified|ready|slot\s*booked)\s*[)\]]?\s*$',
    caseSensitive: false,
  );

  for (final rawLine in lines) {
    var line = rawLine
        .replaceAll(RegExp(r'[\uD800-\uDBFF][\uDC00-\uDFFF]'), ' ')
        .replaceAll(RegExp(r'[\u2600-\u27BF]'), ' ')
        .trim();
    if (line.isEmpty || headerRe.hasMatch(line)) continue;

    line = line.replaceFirst(prefixRe, '');
    line = line.replaceFirst(suffixRe, '');
    line = line.replaceAll(RegExp(r'\s+'), ' ').trim();
    if (line.isEmpty || RegExp(r'^[-–—_.:|]+$').hasMatch(line)) continue;

    cleaned.add(line.length > 60 ? line.substring(0, 60) : line);
    if (cleaned.length >= maxTeams) break;
  }

  return cleaned;
}

String incrementStageOrDayLabel(String current) {
  final trimmed = current.trim();
  if (trimmed.isEmpty) return 'Day 2';

  final dayMatch = RegExp(
    r'^(.*?\b(?:day|round|stage|week|phase)\s*#?0*)(\d+)(.*)$',
    caseSensitive: false,
  ).firstMatch(trimmed);
  if (dayMatch != null) {
    final nextNum = (int.tryParse(dayMatch.group(2) ?? '1') ?? 1) + 1;
    return '${dayMatch.group(1)}$nextNum${dayMatch.group(3)}';
  }

  final trailingNum = RegExp(r'^(.*?\s+)(\d+)$').firstMatch(trimmed);
  if (trailingNum != null) {
    final nextNum = (int.tryParse(trailingNum.group(2) ?? '1') ?? 1) + 1;
    return '${trailingNum.group(1)}$nextNum';
  }

  return '$trimmed - Day 2';
}

String formatStandingsTextSummary({
  required TournamentSettings settings,
  required List<TeamCumulativeStanding> standings,
  required StandingsViewMode viewMode,
  int? matchNumber,
  required int completedMatches,
}) {
  final headerTitle =
      (settings.name.trim().isEmpty ? 'TOURNAMENT' : settings.name).toUpperCase();
  final scopeLabel = viewMode == StandingsViewMode.singleMatch
      ? 'MATCH ${matchNumber ?? 1} RESULTS'
      : 'OVERALL STANDINGS ($completedMatches ${completedMatches == 1 ? 'MATCH' : 'MATCHES'})';

  final lines = <String>[
    headerTitle,
    '${settings.roundOrDay.trim().isNotEmpty ? '${settings.roundOrDay.toUpperCase()} · ' : ''}$scopeLabel',
    '------------------------------------',
  ];

  for (final row in standings) {
    final rankStr = '#${row.rank.toString().padLeft(2, '0')}';
    final booyahPart = row.booyahCount > 0 ? ' | ${row.booyahCount}B' : '';
    var rushPart = '';
    if (viewMode == StandingsViewMode.overall &&
        settings.mode == TournamentMode.championRush) {
      if (row.rushStatus.status == RushStatusType.champion) {
        rushPart = ' [CHAMPION]';
      } else if (row.rushStatus.status == RushStatusType.active) {
        rushPart = ' [RUSH]';
      }
    }
    lines.add(
      '$rankStr ${row.teamName} - ${row.totalPoints} PTS (${row.kills}K$booyahPart)$rushPart',
    );
  }

  if ((settings.hostName ?? '').trim().isNotEmpty) {
    lines.add('------------------------------------');
    lines.add('Organized by ${settings.hostName!.trim()}');
  }

  return lines.join('\n');
}

String _normalizeMatchKey(String text) =>
    text.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '');

int matchLogoFilenameToSquadIndex(
  String filename,
  List<String> squadNames,
  Set<int> usedIndices,
) {
  final stem = filename.replaceFirst(RegExp(r'\.[^.]+$'), '').trim();
  final cleanStem =
      _normalizeMatchKey(stem.replaceFirst(RegExp(r'^\d+[\s_-]*'), ''));

  if (cleanStem.length >= 2) {
    for (int i = 0; i < squadNames.length; i++) {
      if (usedIndices.contains(i)) continue;
      final key = _normalizeMatchKey(squadNames[i]);
      if (key.isEmpty || isPlaceholderSquadName(squadNames[i])) continue;
      if (key == cleanStem ||
          key.contains(cleanStem) ||
          cleanStem.contains(key)) {
        return i;
      }
    }
  }

  final numMatch = RegExp(r'^(?:slot|team|sq)?[\s_-]*0*(\d{1,2})\b',
          caseSensitive: false)
      .firstMatch(stem);
  if (numMatch != null) {
    final idx = (int.tryParse(numMatch.group(1) ?? '0') ?? 0) - 1;
    if (idx >= 0 && idx < squadNames.length && !usedIndices.contains(idx)) {
      return idx;
    }
  }

  for (int i = 0; i < squadNames.length; i++) {
    if (!usedIndices.contains(i)) return i;
  }
  return -1;
}

List<String> resolveSquadPlayers({
  List<String> players = const [],
  String? player1,
  String? player2,
}) {
  final out = <String>[];
  final seen = <String>{};
  final candidates = <String>[
    ...players,
    if (player1 != null) player1,
    if (player2 != null) player2,
  ];
  for (final raw in candidates) {
    final trimmed = raw.trim();
    if (trimmed.isEmpty) continue;
    final clipped = trimmed.length > 60 ? trimmed.substring(0, 60) : trimmed;
    final lower = clipped.toLowerCase();
    if (seen.contains(lower)) continue;
    seen.add(lower);
    out.add(clipped);
    if (out.length >= 8) break;
  }
  return out;
}

({List<String> players, String? player1, String? player2})
    buildSquadPlayerFields(List<String> rawPlayers) {
  final cleaned = resolveSquadPlayers(players: rawPlayers);
  return (
    players: cleaned,
    player1: cleaned.isNotEmpty ? cleaned[0] : null,
    player2: cleaned.length > 1 ? cleaned[1] : null,
  );
}
