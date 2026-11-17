import 'dart:async';
import 'dart:io';
import 'dart:math' as math;
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import '../models/tournament_models.dart';

class OcrWordBox {
  final String text;
  final double x0;
  final double y0;
  final double x1;
  final double y1;
  final double confidence;

  const OcrWordBox({
    required this.text,
    required this.x0,
    required this.y0,
    required this.x1,
    required this.y1,
    this.confidence = 80,
  });
}

class ScannedRankRow {
  final int rank;
  final int kills;
  final String rawPlayerText;
  final List<String> normalizedTokens;
  final double confidence;
  final bool isEdgeClipped;
  final int sourceImageIndex;

  const ScannedRankRow({
    required this.rank,
    required this.kills,
    required this.rawPlayerText,
    required this.normalizedTokens,
    required this.confidence,
    required this.isEdgeClipped,
    required this.sourceImageIndex,
  });
}

class MatchedScanRow {
  final int rank;
  final int kills;
  final String rawPlayerText;
  final List<String> normalizedTokens;
  final String? matchedTeamId;
  final double matchConfidence;
  final String? matchedKeyword;

  const MatchedScanRow({
    required this.rank,
    required this.kills,
    required this.rawPlayerText,
    required this.normalizedTokens,
    this.matchedTeamId,
    this.matchConfidence = 0,
    this.matchedKeyword,
  });
}

const Map<int, String> _kHomoglyphRuneMap = {
  // Greek, Cyrillic, Cherokee, Currency/Nickfinder, Small-caps & Letterlike lookalikes
  0x0391: 'a', 0x0410: 'a', 0x13AA: 'a', 0x039B: 'a', 0x03B1: 'a', 0x0430: 'a', 0x1D2C: 'a', 0x1D43: 'a', 0x20B3: 'a',
  0x0392: 'b', 0x0412: 'b', 0x0299: 'b', 0x0432: 'b', 0x1D2E: 'b', 0x1D47: 'b', 0x212C: 'b', 0x0E3F: 'b', 0x20BF: 'b',
  0x0421: 'c', 0x13DF: 'c', 0x1D04: 'c', 0x0441: 'c', 0x1D9C: 'c', 0x212D: 'c', 0x00A2: 'c', 0x20B5: 'c',
  0x13A0: 'd', 0x1D05: 'd', 0x010E: 'd', 0x0110: 'd', 0x0111: 'd', 0x1D30: 'd', 0x1D48: 'd',
  0x0395: 'e', 0x0415: 'e', 0x13AC: 'e', 0x1D07: 'e', 0x0435: 'e', 0x03B5: 'e', 0x1D31: 'e', 0x1D49: 'e', 0x2130: 'e', 0x20AC: 'e',
  0x0492: 'f', 0xA730: 'f', 0x0493: 'f', 0x1DA0: 'f', 0x2131: 'f',
  0x0262: 'g', 0x13C0: 'g', 0x1D33: 'g', 0x1D4D: 'g', 0x20B2: 'g',
  0x0397: 'h', 0x041D: 'h', 0x13BB: 'h', 0x029C: 'h', 0x043D: 'h', 0x1D34: 'h', 0x02B0: 'h', 0x210B: 'h', 0x210C: 'h', 0x20B4: 'h',
  0x0399: 'i', 0x0406: 'i', 0x0407: 'i', 0x026A: 'i', 0x0456: 'i', 0x0457: 'i', 0x1D35: 'i', 0x2071: 'i', 0x2110: 'i',
  0x0408: 'j', 0x1D0A: 'j', 0x0458: 'j', 0x1D36: 'j', 0x02B2: 'j', 0x2111: 'j',
  0x039A: 'k', 0x041A: 'k', 0x1D0B: 'k', 0x043A: 'k', 0x1D37: 'k', 0x1D4F: 'k', 0x20AD: 'k',
  0x13DE: 'l', 0x029F: 'l', 0x0141: 'l', 0x0142: 'l', 0x1D38: 'l', 0x02E1: 'l', 0x2112: 'l', 0x2113: 'l', 0x00A3: 'l',
  0x039C: 'm', 0x041C: 'm', 0x13B7: 'm', 0x1D0D: 'm', 0x043C: 'm', 0x1D39: 'm', 0x1D50: 'm', 0x2133: 'm', 0x20BC: 'm',
  0x039D: 'n', 0x0274: 'n', 0x0418: 'n', 0x0438: 'n', 0x0419: 'n', 0x0439: 'n', 0x1D3A: 'n', 0x207F: 'n', 0x20A6: 'n', 0x2115: 'n',
  0x039F: 'o', 0x041E: 'o', 0x00D8: 'o', 0x00F8: 'o', 0x1D0F: 'o', 0x043E: 'o', 0x1D3C: 'o', 0x1D52: 'o',
  0x03A1: 'p', 0x0420: 'p', 0x1D18: 'p', 0x0440: 'p', 0x1D3E: 'p', 0x1D56: 'p', 0x20B1: 'p', 0x2119: 'p',
  0x042F: 'r', 0x0280: 'r', 0x13D2: 'r', 0x044F: 'r', 0x1D3F: 'r', 0x02B3: 'r', 0x211B: 'r', 0x211C: 'r', 0x211D: 'r', 0x20B9: 'r', 0x20BD: 'r',
  0x0405: 's', 0x13DA: 's', 0xA731: 's', 0x0455: 's', 0x0024: 's', 0x02E2: 's',
  0x03A4: 't', 0x0422: 't', 0x1D1B: 't', 0x0442: 't', 0x1D40: 't', 0x1D57: 't', 0x20AE: 't', 0x20B8: 't', 0x20BA: 't',
  0x054D: 'u', 0x1D1C: 'u', 0x03C5: 'u', 0x1D41: 'u', 0x1D58: 'u',
  0x0474: 'v', 0x1D20: 'v', 0x0475: 'v', 0x2C7D: 'v', 0x1D5B: 'v',
  0x13B3: 'w', 0x1D21: 'w', 0x03C9: 'w', 0x1D42: 'w', 0x02B7: 'w', 0x20A9: 'w',
  0x03A7: 'x', 0x0425: 'x', 0x0445: 'x', 0x02E3: 'x',
  0x03A5: 'y', 0x0423: 'y', 0x028F: 'y', 0x0443: 'y', 0x00A5: 'y', 0x02B8: 'y',
  0x0396: 'z', 0x1D22: 'z', 0x1DBB: 'z', 0x2124: 'z', 0x2128: 'z',
  0x30E1: ' ', 0x4E42: ' ', 0x0F3A: ' ', 0x0F3B: ' ', 0x0F12: ' ', 0x262C: ' ',
  0x2122: ' ', 0x00AE: ' ',
};

String _foldLatinDiacritic(int rune) {
  if ((rune >= 0x00C0 && rune <= 0x00C5) || (rune >= 0x00E0 && rune <= 0x00E5)) return 'a';
  if (rune == 0x00C6 || rune == 0x00E6) return 'ae';
  if (rune == 0x00C7 || rune == 0x00E7) return 'c';
  if ((rune >= 0x00C8 && rune <= 0x00CB) || (rune >= 0x00E8 && rune <= 0x00EB)) return 'e';
  if ((rune >= 0x00CC && rune <= 0x00CF) || (rune >= 0x00EC && rune <= 0x00EF)) return 'i';
  if (rune == 0x00D0 || rune == 0x00F0) return 'd';
  if (rune == 0x00D1 || rune == 0x00F1) return 'n';
  if ((rune >= 0x00D2 && rune <= 0x00D6) || (rune >= 0x00F2 && rune <= 0x00F6)) return 'o';
  if ((rune >= 0x00D9 && rune <= 0x00DC) || (rune >= 0x00F9 && rune <= 0x00FC)) return 'u';
  if (rune == 0x00DD || rune == 0x00FD || rune == 0x00FF) return 'y';
  return '';
}

String _foldRune(int rune) {
  final direct = _kHomoglyphRuneMap[rune];
  if (direct != null) return direct;
  final latin = _foldLatinDiacritic(rune);
  if (latin.isNotEmpty) return latin;
  if (rune >= 0xFF01 && rune <= 0xFF5E) {
    return String.fromCharCode(rune - 0xFEE0).toLowerCase();
  }
  if (rune >= 0x1D400 && rune <= 0x1D6A3) {
    final offset = rune - 0x1D400;
    final mod52 = offset % 52;
    if (mod52 < 26) {
      return String.fromCharCode(0x61 + mod52);
    } else {
      return String.fromCharCode(0x61 + (mod52 - 26));
    }
  }
  if (rune >= 0x1D7CE && rune <= 0x1D7FF) {
    final digit = (rune - 0x1D7CE) % 10;
    return '$digit';
  }
  return String.fromCharCode(rune).toLowerCase();
}

String normalizeFreeFireIgn(String raw) {
  if (raw.isEmpty) return '';
  final sb = StringBuffer();
  for (final rune in raw.runes) {
    if (rune >= 0x0300 && rune <= 0x036F) continue;
    sb.write(_foldRune(rune));
  }

  final words = sb
      .toString()
      .replaceAll(RegExp(r'[^a-z0-9]+'), ' ')
      .trim()
      .split(RegExp(r'\s+'))
      .where((w) => w.isNotEmpty)
      .toList();
  if (words.isEmpty) return '';

  final merged = <String>[];
  var singleRun = '';
  for (final w in words) {
    if (w.length == 1 && RegExp(r'^[a-z]$').hasMatch(w)) {
      singleRun += w;
    } else {
      if (singleRun.isNotEmpty) {
        merged.add(singleRun);
        singleRun = '';
      }
      merged.add(w);
    }
  }
  if (singleRun.isNotEmpty) merged.add(singleRun);
  return merged.join(' ');
}

List<String> extractIgnTokens(String raw) {
  final norm = normalizeFreeFireIgn(raw);
  if (norm.isEmpty) return const [];
  final rawWords = norm.split(' ').where((w) => w.isNotEmpty).toList();
  final parts = rawWords
      .where((p) => p.length >= 2 && !RegExp(r'^\d+$').hasMatch(p))
      .toList();
  final set = <String>{...parts};

  for (int i = 0; i < rawWords.length; i++) {
    if (i + 1 < rawWords.length) {
      final pair = rawWords[i] + rawWords[i + 1];
      if (pair.length >= 3 && !RegExp(r'^\d+$').hasMatch(pair)) set.add(pair);
    }
    if (i + 2 < rawWords.length) {
      final trip = rawWords[i] + rawWords[i + 1] + rawWords[i + 2];
      if (trip.length >= 4 && !RegExp(r'^\d+$').hasMatch(trip)) set.add(trip);
    }
  }

  final collapsed = parts.join();
  if (collapsed.length >= 3 && collapsed.length <= 32) set.add(collapsed);
  return set.toList();
}

String _foldOcrAndLeet(String s) => s
    .toLowerCase()
    .replaceAll('0', 'o')
    .replaceAll(RegExp(r'[1l|!]'), 'i')
    .replaceAll('5', 's')
    .replaceAll('4', 'a')
    .replaceAll('8', 'b')
    .replaceAll('2', 'z')
    .replaceAll(RegExp(r'[^a-z0-9]'), '');

int _damerauLevenshtein(String a, String b) {
  if (a == b) return 0;
  final la = a.length;
  final lb = b.length;
  if (la == 0) return lb;
  if (lb == 0) return la;

  final dp = List<List<int>>.generate(
    la + 1,
    (_) => List<int>.filled(lb + 1, 0),
  );
  for (int i = 0; i <= la; i++) {
    dp[i][0] = i;
  }
  for (int j = 0; j <= lb; j++) {
    dp[0][j] = j;
  }

  for (int i = 1; i <= la; i++) {
    for (int j = 1; j <= lb; j++) {
      final cost = a.codeUnitAt(i - 1) == b.codeUnitAt(j - 1) ? 0 : 1;
      var val = math.min(
        math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
        dp[i - 1][j - 1] + cost,
      );
      if (i > 1 &&
          j > 1 &&
          a.codeUnitAt(i - 1) == b.codeUnitAt(j - 2) &&
          a.codeUnitAt(i - 2) == b.codeUnitAt(j - 1)) {
        val = math.min(val, dp[i - 2][j - 2] + 1);
      }
      dp[i][j] = val;
    }
  }
  return dp[la][lb];
}

double ocrFuzzySimilarity(String candidateToken, String keywordRaw) {
  final kw = _foldOcrAndLeet(normalizeFreeFireIgn(keywordRaw));
  final cand = _foldOcrAndLeet(normalizeFreeFireIgn(candidateToken));
  if (kw.isEmpty || cand.isEmpty) return 0;
  if (cand == kw) return 1.0;
  if (kw.length >= 3 && cand.contains(kw)) return 0.96;
  if (cand.length >= 4 && kw.contains(cand)) {
    return math.min(0.92, cand.length / kw.length + 0.22);
  }

  if (cand.length > kw.length && kw.length >= 3) {
    var best = 0.0;
    for (int start = 0; start <= cand.length - kw.length; start++) {
      final slice = cand.substring(start, start + kw.length);
      final sim = 1.0 - _damerauLevenshtein(slice, kw) / kw.length;
      if (sim > best) best = sim;
    }
    if (best >= 0.70) return best * 0.95;
  }

  final maxLen = math.max(cand.length, kw.length);
  if (maxLen < 3) return 0;
  return 1.0 - _damerauLevenshtein(cand, kw) / maxLen;
}

({double score, String? matchedKeyword}) scoreSquadAgainstTokens(
  List<String> tokens,
  Team team,
) {
  if (tokens.isEmpty) return (score: 0.0, matchedKeyword: null);

  final keywords = <({String label, double weight})>[];
  final seenPlayers = <String>{};
  final allPlayers = <String>[
    ...team.players,
    if ((team.player1 ?? '').trim().isNotEmpty) team.player1!.trim(),
    if ((team.player2 ?? '').trim().isNotEmpty) team.player2!.trim(),
  ];

  for (final rawP in allPlayers) {
    final clean = rawP.trim();
    if (clean.isEmpty) continue;
    final lower = clean.toLowerCase();
    if (seenPlayers.contains(lower)) continue;
    seenPlayers.add(lower);
    final baseWeight = seenPlayers.length == 1 ? 1.0 : 0.98;
    keywords.add((label: clean, weight: baseWeight));

    final subParts = normalizeFreeFireIgn(clean)
        .split(' ')
        .where((w) => w.length >= 4 && !RegExp(r'^\d+$').hasMatch(w));
    final collapsedClean = normalizeFreeFireIgn(clean).replaceAll(' ', '');
    for (final sp in subParts) {
      if (sp != collapsedClean) {
        keywords.add((label: sp, weight: baseWeight * 0.94));
      }
    }
  }

  for (final lt in team.learnedTokens) {
    if (lt.trim().length >= 3) {
      keywords.add((label: lt.trim(), weight: 0.94));
    }
  }
  if (team.name.trim().isNotEmpty &&
      !RegExp(r'^(?:squad|team|slot)\s*\d+$', caseSensitive: false)
          .hasMatch(team.name.trim())) {
    keywords.add((label: team.name.trim(), weight: 0.90));
  }

  var bestScore = 0.0;
  String? bestKw;
  var hits = 0;

  for (final kw in keywords) {
    var kwBest = 0.0;
    for (final tok in tokens) {
      final sim = ocrFuzzySimilarity(tok, kw.label) * kw.weight;
      if (sim > kwBest) kwBest = sim;
    }
    if (kwBest >= 0.72) hits++;
    if (kwBest > bestScore) {
      bestScore = kwBest;
      bestKw = kw.label;
    }
  }

  if (hits >= 2) bestScore = math.min(1.0, bestScore + 0.05);
  return (score: bestScore, matchedKeyword: bestKw);
}

// ============================================================================
// Condensed Sports Numeral 12x16 Classifier (for Free Fire yellow kill digits
// and right-column rank badges)
// ============================================================================

const Map<int, List<String>> _kDigitTemplates = {
  0: [
    '..########..',
    '.##########.',
    '.##########.',
    '####...#####',
    '####....####',
    '####....####',
    '####....####',
    '###.....####',
    '###.....####',
    '####....####',
    '####....####',
    '####....####',
    '#####..#####',
    '.##########.',
    '.##########.',
    '..########..',
  ],
  1: [
    '...######...',
    '.#########..',
    '##########..',
    '##########..',
    '...#######..',
    '...#######..',
    '...#######..',
    '...#######..',
    '...#######..',
    '...#######..',
    '...#######..',
    '...#######..',
    '...#######..',
    '...#######..',
    '...#######..',
    '...#######..',
  ],
  2: [
    '..########..',
    '.##########.',
    '####...#####',
    '.......#####',
    '.......#####',
    '......######',
    '.....######.',
    '...########.',
    '..########..',
    '.#######....',
    '######......',
    '#####.......',
    '#########...',
    '############',
    '############',
    '.###########',
  ],
  3: [
    '..########..',
    '##########..',
    '###########.',
    '......######',
    '......######',
    '.....######.',
    '..#########.',
    '.##########.',
    '.##########.',
    '.....#######',
    '......######',
    '......######',
    '.....#######',
    '###########.',
    '.##########.',
    '..########..',
  ],
  4: [
    '.....####...',
    '....######..',
    '...#######..',
    '..########..',
    '..#########.',
    '.####..####.',
    '#####..####.',
    '############',
    '############',
    '############',
    '.###########',
    '......#####.',
    '......#####.',
    '......#####.',
    '......#####.',
    '......#####.',
  ],
  5: [
    '.#########..',
    '##########..',
    '#####.......',
    '#####.......',
    '#####.......',
    '#########...',
    '##########..',
    '.##########.',
    '.....#######',
    '.......#####',
    '.......#####',
    '.......#####',
    '.....#######',
    '.##########.',
    '..#########.',
    '...#######..',
  ],
  6: [
    '....#####...',
    '...######...',
    '..######....',
    '..#####.....',
    '.#######....',
    '.#########..',
    '###########.',
    '############',
    '####...#####',
    '###.....####',
    '###.....####',
    '####...#####',
    '###########.',
    '.##########.',
    '.##########.',
    '..########..',
  ],
  7: [
    '.##########.',
    '############',
    '############',
    '......######',
    '......#####.',
    '.....######.',
    '.....#####..',
    '....######..',
    '....#####...',
    '...######...',
    '...#####....',
    '...#####....',
    '..#####.....',
    '..#####.....',
    '..####......',
    '..####......',
  ],
  8: [
    '..########..',
    '.##########.',
    '.###...####.',
    '###.....####',
    '###.....####',
    '.###...####.',
    '.##########.',
    '..########..',
    '.##########.',
    '####...#####',
    '###.....####',
    '###.....####',
    '####...#####',
    '.##########.',
    '..########..',
    '...######...',
  ],
  9: [
    '..########..',
    '.##########.',
    '####...#####',
    '###.....####',
    '###.....####',
    '###.....####',
    '####...#####',
    '.###########',
    '..#########.',
    '......#####.',
    '.....######.',
    '.....#####..',
    '....#####...',
    '...######...',
    '...#####....',
    '..#####.....',
  ],
};

final Map<int, Float32List> _kTemplateVecs = () {
  final out = <int, Float32List>{};
  for (int d = 0; d <= 9; d++) {
    final rows = _kDigitTemplates[d]!;
    final raw = Float32List(192);
    for (int y = 0; y < 16; y++) {
      for (int x = 0; x < 12; x++) {
        raw[y * 12 + x] = rows[y].codeUnitAt(x) == 0x23 ? 1.0 : 0.0;
      }
    }
    final blur = Float32List(192);
    for (int y = 0; y < 16; y++) {
      for (int x = 0; x < 12; x++) {
        var sum = 0.0;
        var w = 0.0;
        for (int dy = -1; dy <= 1; dy++) {
          for (int dx = -1; dx <= 1; dx++) {
            final ny = y + dy;
            final nx = x + dx;
            if (ny >= 0 && ny < 16 && nx >= 0 && nx < 12) {
              final wt = (dx == 0 && dy == 0) ? 4.0 : 1.0;
              sum += raw[ny * 12 + nx] * wt;
              w += wt;
            }
          }
        }
        blur[y * 12 + x] = sum / w;
      }
    }
    out[d] = blur;
  }
  return out;
}();

int _classifyGlyph12x16(Float32List grid, double aspect) {
  if (aspect < 0.44) return 1;

  var meanG = 0.0;
  for (int i = 0; i < 192; i++) {
    meanG += grid[i];
  }
  meanG /= 192.0;
  var varG = 0.0;
  for (int i = 0; i < 192; i++) {
    final dg = grid[i] - meanG;
    varG += dg * dg;
  }
  final stdG = varG > 0 ? math.sqrt(varG) : 1.0;

  double regionMean(int x0, int x1, int y0, int y1) {
    var s = 0.0;
    var n = 0;
    for (int y = y0; y <= y1; y++) {
      for (int x = x0; x <= x1; x++) {
        s += grid[y * 12 + x];
        n++;
      }
    }
    return s / n;
  }

  final midCenter = regionMean(5, 6, 6, 9);
  final upperHole = regionMean(5, 6, 3, 5);
  final lowerHole = regionMean(5, 6, 10, 12);
  final topLeftWall = regionMean(0, 3, 3, 6);
  final topRightWall = regionMean(8, 11, 3, 6);
  final topRightCorner = regionMean(8, 11, 1, 4);
  final botLeftWall = regionMean(0, 3, 9, 12);
  final botRightWall = regionMean(8, 11, 9, 12);
  final topBar = regionMean(2, 9, 0, 2);
  final botBar = regionMean(2, 9, 13, 15);
  final waistOuter = regionMean(0, 1, 6, 9) + regionMean(10, 11, 6, 9);
  final bellyOuter = regionMean(0, 1, 3, 4) +
      regionMean(10, 11, 3, 4) +
      regionMean(0, 1, 11, 12) +
      regionMean(10, 11, 11, 12);

  var bestDigit = 0;
  var bestScore = -1e9;

  for (int d = 0; d <= 9; d++) {
    if (d == 1 && aspect > 0.48) continue;
    final t = _kTemplateVecs[d]!;
    var meanT = 0.0;
    for (int i = 0; i < 192; i++) {
      meanT += t[i];
    }
    meanT /= 192.0;
    var varT = 0.0;
    var cov = 0.0;
    for (int i = 0; i < 192; i++) {
      final dt = t[i] - meanT;
      varT += dt * dt;
      cov += (grid[i] - meanG) * dt;
    }
    final stdT = varT > 0 ? math.sqrt(varT) : 1.0;
    var score = cov / (stdG * stdT);

    if (d == 0) {
      score += (1 - midCenter) * 0.28 +
          topLeftWall * 0.14 +
          topRightCorner * 0.16 +
          botLeftWall * 0.10;
    }
    if (d == 6) {
      score += (midCenter - lowerHole) * 0.22 +
          (0.25 - topRightCorner) * 0.45 +
          botLeftWall * 0.10;
    }
    if (d == 8) {
      score += (midCenter - 0.5 * (upperHole + lowerHole)) * 0.38 +
          (0.5 * bellyOuter - waistOuter) * 0.12;
    }
    if (d == 9) {
      score += (midCenter - upperHole) * 0.20 +
          (0.25 - botLeftWall) * 0.40 +
          topRightCorner * 0.12;
    }
    if (d == 3) {
      score += (1 - topLeftWall) * 0.18 +
          (1 - botLeftWall) * 0.18 +
          botBar * 0.15 +
          midCenter * 0.12;
    }
    if (d == 4) {
      score += (1 - regionMean(0, 4, 13, 15)) * 0.20 +
          (1 - regionMean(0, 2, 0, 3)) * 0.12 +
          midCenter * 0.12;
    }
    if (d == 5) {
      score += topLeftWall * 0.18 +
          (1 - topRightWall) * 0.18 +
          (1 - botLeftWall) * 0.15 +
          botBar * 0.10;
    }
    if (d == 2) {
      score += (1 - topLeftWall) * 0.15 +
          botLeftWall * 0.18 +
          (1 - botRightWall) * 0.15 +
          botBar * 0.15;
    }
    if (d == 7) {
      score += topBar * 0.20 +
          (1 - botLeftWall) * 0.18 +
          (1 - regionMean(7, 11, 12, 15)) * 0.15;
    }

    if (score > bestScore) {
      bestScore = score;
      bestDigit = d;
    }
  }
  return bestDigit;
}

int? _readRgbaCellNumber(
  Uint8List rgba,
  int W,
  int H,
  int cropX0,
  int cropY0,
  int cropW,
  int cropH, {
  required bool yellowMode,
}) {
  if (cropW < 4 || cropH < 4) return null;
  final cw = math.max(40, cropW * 5);
  final ch = math.max(40, cropH * 5);
  final scaleX = cw / cropW;
  final scaleY = ch / cropH;

  double sampleSignal(int sx, int sy) {
    final px = (cropX0 + sx).clamp(0, W - 1).toInt();
    final py = (cropY0 + sy).clamp(0, H - 1).toInt();
    final idx = (py * W + px) * 4;
    final r = rgba[idx].toDouble();
    final g = rgba[idx + 1].toDouble();
    final b = rgba[idx + 2].toDouble();
    return yellowMode
        ? math.max(0.0, 0.55 * r + 0.45 * g - 0.85 * b)
        : (0.4 * r + 0.4 * g + 0.2 * b);
  }

  final vals = <double>[];
  for (int sy = 0; sy < cropH; sy++) {
    for (int sx = 0; sx < cropW; sx++) {
      vals.add(sampleSignal(sx, sy));
    }
  }
  vals.sort();
  final bg = vals[(vals.length * 0.25).floor()];
  final peak = vals.last;
  if (peak - bg < (yellowMode ? 32.0 : 45.0)) return null;

  final cell = Float32List(cw * ch);
  for (int dy = 0; dy < ch; dy++) {
    final fy = dy / scaleY;
    final y0 = fy.floor();
    final y1 = math.min(cropH - 1, y0 + 1);
    final wy = fy - y0;
    for (int dx = 0; dx < cw; dx++) {
      final fx = dx / scaleX;
      final x0 = fx.floor();
      final x1 = math.min(cropW - 1, x0 + 1);
      final wx = fx - x0;
      final v =
          (sampleSignal(x0, y0) * (1 - wx) + sampleSignal(x1, y0) * wx) *
                  (1 - wy) +
              (sampleSignal(x0, y1) * (1 - wx) + sampleSignal(x1, y1) * wx) *
                  wy;
      cell[dy * cw + dx] =
          ((v - (bg + (peak - bg) * 0.28)) / math.max(18.0, (peak - bg) * 0.55))
              .clamp(0.0, 1.0);
    }
  }

  var minY = ch;
  var maxY = -1;
  var minX = cw;
  var maxX = -1;
  for (int y = 2; y < ch - 2; y++) {
    for (int x = 2; x < cw - 2; x++) {
      if (cell[y * cw + x] > 0.38) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  if (maxY - minY < ch * 0.22 || maxX - minX < 4) return null;

  final bw = maxX - minX + 1;
  final bh = maxY - minY + 1;
  final xRanges = <(int, int)>[];
  if (bw / bh > 0.82) {
    final colSum = Float32List(bw);
    for (int x = 0; x < bw; x++) {
      for (int y = minY; y <= maxY; y++) {
        colSum[x] += cell[y * cw + (minX + x)];
      }
    }
    var bestSplit = -1;
    var bestVal = 1e9;
    for (int x = (bw * 0.25).floor(); x <= (bw * 0.75).ceil(); x++) {
      if (colSum[x] < bestVal) {
        bestVal = colSum[x];
        bestSplit = x;
      }
    }
    if (bestSplit > 0 && bestVal < bh * 0.18) {
      xRanges.add((minX, minX + bestSplit - 1));
      xRanges.add((minX + bestSplit + 1, maxX));
    } else {
      xRanges.add((minX, maxX));
    }
  } else {
    xRanges.add((minX, maxX));
  }

  final digits = StringBuffer();
  for (final (gx0, gx1) in xRanges) {
    var x0 = gx1;
    var x1 = gx0;
    var y0 = maxY;
    var y1 = minY;
    for (int y = minY; y <= maxY; y++) {
      for (int x = gx0; x <= gx1; x++) {
        if (cell[y * cw + x] > 0.35) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    final gw = math.max(1, x1 - x0 + 1);
    final gh = math.max(1, y1 - y0 + 1);
    if (gh < ch * 0.20) continue;

    final grid = Float32List(192);
    for (int ny = 0; ny < 16; ny++) {
      for (int nx = 0; nx < 12; nx++) {
        final ix =
            (x0 + (nx + 0.5) * (gw / 12)).round().clamp(0, cw - 1).toInt();
        final iy =
            (y0 + (ny + 0.5) * (gh / 16)).round().clamp(0, ch - 1).toInt();
        grid[ny * 12 + nx] = cell[iy * cw + ix];
      }
    }
    digits.write(_classifyGlyph12x16(grid, gw / gh));
  }

  final str = digits.toString();
  return str.isEmpty ? null : int.tryParse(str);
}

class _DetectedCard {
  final String side; // 'L' or 'R'
  final int rank;
  final int kills;
  final bool clipped;
  final int y0;
  final int y1;
  final List<String> words = [];

  _DetectedCard({
    required this.side,
    required this.rank,
    required this.kills,
    required this.clipped,
    required this.y0,
    required this.y1,
  });
}

class _DetectedGridResult {
  final List<_DetectedCard> cards;
  final Uint8List compositeRgba;
  final int compositeWidth;
  final int compositeHeight;
  final double scale;
  final List<({String side, int outX0, int outX1})> stripBounds;

  const _DetectedGridResult({
    required this.cards,
    required this.compositeRgba,
    required this.compositeWidth,
    required this.compositeHeight,
    required this.scale,
    required this.stripBounds,
  });
}

_DetectedGridResult? _detectFreeFireGridAndBuildComposite(
  Uint8List rgba,
  int W,
  int H,
) {
  final lookDist = math.max(5, (H * 0.015).round());
  final yellowScoreX = Float64List(W);

  for (int y = (H * 0.36).floor(); y < (H * 0.85).floor(); y++) {
    for (int x = (W * 0.06).floor(); x < (W * 0.96).floor(); x++) {
      final idx = (y * W + x) * 4;
      final r = rgba[idx].toDouble();
      final g = rgba[idx + 1].toDouble();
      final b = rgba[idx + 2].toDouble();
      if (r >= 130 && g >= 95 && (0.6 * r + 0.4 * g - b) >= 55) {
        final lIdx = (y * W + math.max<int>(0, x - lookDist)) * 4;
        final rIdx = (y * W + math.min<int>(W - 1, x + lookDist)) * 4;
        final bgLum = math.min(
          0.5 * rgba[lIdx] + 0.5 * rgba[lIdx + 1],
          0.5 * rgba[rIdx] + 0.5 * rgba[rIdx + 1],
        );
        final fgLum = 0.5 * r + 0.5 * g;
        if (fgLum - bgLum >= 35) {
          yellowScoreX[x] += fgLum - bgLum;
        }
      }
    }
  }

  final win = math.max(2, (H * 0.007).round());
  final smoothed = Float64List(W);
  for (int x = win; x < W - win; x++) {
    for (int dx = -win; dx <= win; dx++) {
      smoothed[x] += yellowScoreX[x + dx];
    }
  }

  final cands = <({int x, double score})>[];
  for (int x = (W * 0.08).floor(); x < (W * 0.95).floor(); x++) {
    if (smoothed[x] >= smoothed[x - 1] &&
        smoothed[x] >= smoothed[x + 1] &&
        smoothed[x] > H * 0.85) {
      var numer = 0.0;
      var den = 0.0;
      for (int dx = -win - 1; dx <= win + 1; dx++) {
        final px = (x + dx).clamp(0, W - 1).toInt();
        numer += px * yellowScoreX[px];
        den += yellowScoreX[px];
      }
      cands.add((x: den > 0 ? (numer / den).round() : x, score: smoothed[x]));
    }
  }
  cands.sort((a, b) => b.score.compareTo(a.score));

  final minPeakDist = H * 0.20;
  final killX = <int>[];
  for (final c in cands) {
    if (killX.every((px) => (px - c.x).abs() >= minPeakDist)) {
      killX.add(c.x);
      if (killX.length == 4) break;
    }
  }
  killX.sort();
  if (killX.length != 2 && killX.length != 4) return null;

  final hasRightCol = killX.length == 4;
  final leftSpan = (killX[1] - killX[0]).toDouble();
  final rightSpan =
      hasRightCol ? (killX[3] - killX[2]).toDouble() : leftSpan * 0.73;
  if (leftSpan < H * 0.20) return null;

  List<({int y0, int y1, double yc})> findLines(int x0, int x1) {
    final rowEdge = Int32List(H);
    final minEdgeCount = math.max(5, ((x1 - x0) * 0.025).round());
    for (int y = (H * 0.18).floor(); y < (H * 0.88).floor(); y++) {
      var e = 0;
      for (int x = math.max(1, x0); x < math.min(W - 1, x1); x++) {
        final idx = (y * W + x) * 4;
        final prev = (y * W + x - 1) * 4;
        final lum = 0.55 * rgba[idx] + 0.45 * rgba[idx + 1];
        final lumPrev = 0.55 * rgba[prev] + 0.45 * rgba[prev + 1];
        if (lum >= 125 && (lum - lumPrev).abs() >= 22) e++;
      }
      rowEdge[y] = e;
    }
    final segs = <({int y0, int y1, double yc})>[];
    var s = -1;
    final minLineH = math.max(4, (H * 0.01).round());
    for (int y = 0; y < H; y++) {
      if (rowEdge[y] >= minEdgeCount) {
        if (s == -1) s = y;
      } else if (s != -1) {
        if (y - s >= minLineH) {
          segs.add((y0: s, y1: y - 1, yc: (s + y - 1) / 2.0));
        }
        s = -1;
      }
    }
    return segs;
  }

  List<({List<({int y0, int y1, double yc})> lines, bool clipped})> pairLines(
    List<({int y0, int y1, double yc})> lines,
  ) {
    final grouped =
        <({List<({int y0, int y1, double yc})> lines, bool clipped})>[];
    var i = 0;
    while (i < lines.length) {
      if (i + 1 < lines.length &&
          lines[i + 1].yc - lines[i].yc < H * 0.056) {
        grouped.add((lines: [lines[i], lines[i + 1]], clipped: false));
        i += 2;
      } else {
        grouped.add((lines: [lines[i]], clipped: true));
        i += 1;
      }
    }
    return grouped;
  }

  final leftCards = pairLines(
    findLines(
      (killX[0] - leftSpan * 0.52).round(),
      (killX[1] + leftSpan * 0.25).round(),
    ),
  );
  final rightCards = hasRightCol
      ? pairLines(
          findLines(
            (killX[2] - rightSpan * 0.72).round(),
            (killX[3] + rightSpan * 0.25).round(),
          ),
        )
      : <({List<({int y0, int y1, double yc})> lines, bool clipped})>[];

  if (leftCards.isEmpty && rightCards.isEmpty) return null;

  final halfCellW = math.max(8, (H * 0.02).round());
  final padY = math.max(2, (H * 0.0065).round());

  var rightStartRank = 6;
  if (hasRightCol && rightCards.isNotEmpty) {
    final startVotes = <int, int>{};
    for (int i = 0; i < rightCards.length; i++) {
      if (rightCards[i].clipped) continue;
      final rx0 = (killX[2] - rightSpan * 1.045).round();
      final midY = ((rightCards[i].lines[0].y0 + rightCards[i].lines[1].y1) /
                  2.0 -
              H * 0.017)
          .round();
      final badge = _readRgbaCellNumber(
        rgba,
        W,
        H,
        rx0,
        midY,
        (rightSpan * 0.19).round(),
        (H * 0.035).round(),
        yellowMode: false,
      );
      if (badge != null && badge >= 6 && badge <= 24) {
        final implied = badge - i;
        startVotes[implied] = (startVotes[implied] ?? 0) + 1;
      }
    }
    var bestVotes = 0;
    startVotes.forEach((sr, v) {
      if (v > bestVotes) {
        bestVotes = v;
        rightStartRank = sr;
      }
    });
  }

  final cards = <_DetectedCard>[];
  for (int i = 0; i < leftCards.length; i++) {
    final c = leftCards[i];
    var kills = 0;
    for (final ln in c.lines) {
      for (final kx in [killX[0], killX[1]]) {
        final kv = _readRgbaCellNumber(
          rgba,
          W,
          H,
          kx - halfCellW,
          ln.y0 - padY,
          halfCellW * 2,
          ln.y1 - ln.y0 + padY * 2,
          yellowMode: true,
        );
        if (kv != null && kv <= 35) kills += kv;
      }
    }
    cards.add(
      _DetectedCard(
        side: 'L',
        rank: i + 1,
        kills: kills,
        clipped: c.clipped,
        y0: c.lines.first.y0 - 6,
        y1: c.lines.last.y1 + 6,
      ),
    );
  }

  for (int i = 0; i < rightCards.length; i++) {
    final c = rightCards[i];
    var kills = 0;
    for (final ln in c.lines) {
      for (final kx in [killX[2], killX[3]]) {
        final kv = _readRgbaCellNumber(
          rgba,
          W,
          H,
          kx - halfCellW,
          ln.y0 - padY,
          halfCellW * 2,
          ln.y1 - ln.y0 + padY * 2,
          yellowMode: true,
        );
        if (kv != null && kv <= 35) kills += kv;
      }
    }
    cards.add(
      _DetectedCard(
        side: 'R',
        rank: rightStartRank + i,
        kills: kills,
        clipped: c.clipped,
        y0: c.lines.first.y0 - 6,
        y1: c.lines.last.y1 + 6,
      ),
    );
  }

  const scale = 3.5;
  final strips = <({String side, int x0, int x1})>[
    (
      side: 'L',
      x0: math.max(0, (killX[0] - leftSpan * 0.575).round()),
      x1: math.max(1, (killX[0] - leftSpan * 0.068).round()),
    ),
    (
      side: 'L',
      x0: math.max(0, (killX[0] + leftSpan * 0.382).round()),
      x1: math.max(1, (killX[1] - leftSpan * 0.068).round()),
    ),
  ];
  if (hasRightCol) {
    strips.addAll([
      (
        side: 'R',
        x0: math.max(0, (killX[2] - rightSpan * 0.735).round()),
        x1: math.max(1, (killX[2] - rightSpan * 0.085).round()),
      ),
      (
        side: 'R',
        x0: math.max(0, (killX[2] + rightSpan * 0.39).round()),
        x1: math.max(1, (killX[3] - rightSpan * 0.085).round()),
      ),
    ]);
  }

  const gutter = 48;
  final stripWidths = strips
      .map((s) => math.max(8, ((s.x1 - s.x0) * scale).round()))
      .toList();
  final canvasW =
      stripWidths.fold<int>(0, (a, b) => a + b) + gutter * (strips.length + 1);
  final canvasH = (H * scale).round();

  final dst = Uint8List(canvasW * canvasH * 4);
  dst.fillRange(0, dst.length, 255);

  var curOutX = gutter;
  final stripBounds = <({String side, int outX0, int outX1})>[];

  for (int si = 0; si < strips.length; si++) {
    final st = strips[si];
    final dw = stripWidths[si];
    stripBounds.add((side: st.side, outX0: curOutX, outX1: curOutX + dw));

    final yMin = (H * 0.18 * scale).round();
    final yMax = math.min(canvasH, (H * 0.89 * scale).round());

    for (int dy = yMin; dy < yMax; dy++) {
      final fy = dy / scale;
      final y0 = fy.floor();
      final y1 = math.min(H - 1, y0 + 1);
      final wy = fy - y0;

      for (int dx = 0; dx < dw; dx++) {
        final fx = st.x0 + dx / scale;
        final x0 = fx.floor().clamp(0, W - 1).toInt();
        final x1 = math.min(W - 1, x0 + 1);
        final wx = fx - x0;

        double sampleLum(int px, int py) {
          final idx = (py * W + px) * 4;
          return 0.45 * rgba[idx] +
              0.45 * rgba[idx + 1] +
              0.10 * rgba[idx + 2];
        }

        final v =
            (sampleLum(x0, y0) * (1 - wx) + sampleLum(x1, y0) * wx) *
                    (1 - wy) +
                (sampleLum(x0, y1) * (1 - wx) + sampleLum(x1, y1) * wx) * wy;
        final norm = ((v - 105.0) / (215.0 - 105.0)).clamp(0.0, 1.0);
        final ink = (255.0 * (1.0 - norm)).round();
        final outIdx = (dy * canvasW + (curOutX + dx)) * 4;
        dst[outIdx] = ink;
        dst[outIdx + 1] = ink;
        dst[outIdx + 2] = ink;
        dst[outIdx + 3] = 255;
      }
    }
    curOutX += dw + gutter;
  }

  return _DetectedGridResult(
    cards: cards,
    compositeRgba: dst,
    compositeWidth: canvasW,
    compositeHeight: canvasH,
    scale: scale,
    stripBounds: stripBounds,
  );
}

Future<String> _writeCompositeRgbaToTempPng(
  Uint8List rgba,
  int width,
  int height,
  int index,
) async {
  final completer = Completer<ui.Image>();
  ui.decodeImageFromPixels(
    rgba,
    width,
    height,
    ui.PixelFormat.rgba8888,
    completer.complete,
  );
  final image = await completer.future;
  try {
    final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
    final pngBytes = byteData!.buffer.asUint8List();
    final path =
        '${Directory.systemTemp.path}/esp_calc_ocr_${DateTime.now().microsecondsSinceEpoch}_$index.png';
    await File(path).writeAsBytes(pngBytes, flush: true);
    return path;
  } finally {
    image.dispose();
  }
}

// ============================================================================
// Generic Bounding-Box Fallback Parser
// ============================================================================

class _NormWord {
  final String text;
  final double nx0;
  final double ny0;
  final double nx1;
  final double ny1;
  final double confidence;

  const _NormWord({
    required this.text,
    required this.nx0,
    required this.ny0,
    required this.nx1,
    required this.ny1,
    required this.confidence,
  });

  double get nxCenter => (nx0 + nx1) / 2;
  double get nyCenter => (ny0 + ny1) / 2;
}

class _NormLine {
  double ny;
  double minY;
  double maxY;
  final List<_NormWord> words;

  _NormLine({
    required this.ny,
    required this.minY,
    required this.maxY,
    required this.words,
  });
}

int? _parseRankBadge(String raw, int maxTeams) {
  final cleaned = raw
      .trim()
      .replaceFirst(RegExp(r'^[#№]+'), '')
      .replaceFirst(RegExp(r'(?:st|nd|rd|th)$', caseSensitive: false), '')
      .replaceFirst(RegExp(r'[.:)\]]+$'), '');
  if (!RegExp(r'^\d{1,2}$').hasMatch(cleaned)) return null;
  final val = int.tryParse(cleaned);
  if (val != null && val >= 1 && val <= maxTeams) return val;
  return null;
}

int? _parseKillInt(String raw) {
  final cleaned = raw
      .trim()
      .replaceFirst(
        RegExp(r'(?:eliminations?|elims?|kills?)$', caseSensitive: false),
        '',
      )
      .trim();
  if (!RegExp(r'^\d{1,2}$').hasMatch(cleaned)) return null;
  final val = int.tryParse(cleaned);
  return (val != null && val >= 0 && val <= 48) ? val : null;
}

List<_NormLine> _clusterLines(List<_NormWord> words) {
  if (words.isEmpty) return const [];
  final sorted = [...words]..sort((a, b) => a.nyCenter.compareTo(b.nyCenter));
  final lines = <_NormLine>[];

  for (final w in sorted) {
    final wh = math.max(0.012, w.ny1 - w.ny0);
    final tol = math.max(0.016, wh * 0.68);
    _NormLine? match;
    for (final ln in lines) {
      if ((ln.ny - w.nyCenter).abs() <= tol) {
        match = ln;
        break;
      }
    }
    if (match != null) {
      match.words.add(w);
      match.minY = math.min(match.minY, w.ny0);
      match.maxY = math.max(match.maxY, w.ny1);
      match.ny = (match.minY + match.maxY) / 2;
    } else {
      lines.add(
        _NormLine(ny: w.nyCenter, minY: w.ny0, maxY: w.ny1, words: [w]),
      );
    }
  }

  for (final ln in lines) {
    ln.words.sort((a, b) => a.nx0.compareTo(b.nx0));
  }
  lines.sort((a, b) => a.ny.compareTo(b.ny));
  return lines;
}

List<ScannedRankRow> _parseColumnLines(
  List<_NormLine> lines,
  int maxTeams,
  int sourceImageIndex,
) {
  if (lines.isEmpty) return const [];

  final anchors = <({int lineIdx, int rank})>[];
  for (int i = 0; i < lines.length; i++) {
    for (final w in lines[i].words.where((w) => w.nx0 <= 0.24)) {
      final r = _parseRankBadge(w.text, maxTeams);
      if (r != null) {
        if (anchors.isEmpty || anchors.last.rank != r) {
          anchors.add((lineIdx: i, rank: r));
        }
        break;
      }
    }
  }
  if (anchors.isEmpty) return const [];

  final out = <ScannedRankRow>[];
  for (int a = 0; a < anchors.length; a++) {
    final startIdx = anchors[a].lineIdx;
    final endIdx = a + 1 < anchors.length
        ? anchors[a + 1].lineIdx - 1
        : math.min(lines.length - 1, startIdx + 4);
    final rank = anchors[a].rank;
    final slice = lines.sublist(startIdx, endIdx + 1);

    final playerWords = <String>[];
    final perLineKills = <int>[];
    var minY = 1.0;
    var maxY = 0.0;

    for (int sIdx = 0; sIdx < slice.length; sIdx++) {
      final ln = slice[sIdx];
      minY = math.min(minY, ln.minY);
      maxY = math.max(maxY, ln.maxY);

      int? lineKill;
      for (int wIdx = ln.words.length - 1; wIdx >= 0; wIdx--) {
        final w = ln.words[wIdx];
        if (w.nxCenter >= 0.56) {
          final k = _parseKillInt(w.text);
          if (k != null) {
            lineKill = k;
            break;
          }
        }
      }
      if (lineKill != null && perLineKills.length < 4) {
        perLineKills.add(lineKill);
      }

      for (final w in ln.words) {
        if (sIdx == 0 &&
            w.nx0 <= 0.18 &&
            _parseRankBadge(w.text, maxTeams) == rank) {
          continue;
        }
        if (w.nxCenter >= 0.68 && _parseKillInt(w.text) != null) continue;
        if (RegExp(r'^eliminat', caseSensitive: false).hasMatch(w.text.trim())) {
          continue;
        }
        playerWords.add(w.text);
      }
    }

    final totalKills = perLineKills.fold<int>(0, (acc, v) => acc + v);
    final rawText = playerWords.join(' ').trim();
    out.add(
      ScannedRankRow(
        rank: rank,
        kills: totalKills,
        rawPlayerText: rawText,
        normalizedTokens: extractIgnTokens(rawText),
        confidence: 80,
        isEdgeClipped: minY < 0.045 || maxY > 0.955,
        sourceImageIndex: sourceImageIndex,
      ),
    );
  }
  return out;
}

List<ScannedRankRow> parseOcrElementsToRows(
  List<OcrWordBox> boxes,
  double imageWidth,
  double imageHeight, {
  int maxTeams = 12,
  int sourceImageIndex = 0,
}) {
  final safeW = math.max(1.0, imageWidth);
  final safeH = math.max(1.0, imageHeight);

  final normWords = boxes
      .where((b) => b.text.trim().isNotEmpty)
      .map(
        (b) => _NormWord(
          text: b.text.trim(),
          nx0: (b.x0 / safeW).clamp(0.0, 1.0),
          ny0: (b.y0 / safeH).clamp(0.0, 1.0),
          nx1: (b.x1 / safeW).clamp(0.0, 1.0),
          ny1: (b.y1 / safeH).clamp(0.0, 1.0),
          confidence: b.confidence,
        ),
      )
      .where((w) => w.nyCenter >= 0.06 && w.nyCenter <= 0.96)
      .toList();

  if (normWords.isEmpty) return const [];

  final leftHits = normWords
      .where((w) => w.nx0 <= 0.22 && _parseRankBadge(w.text, maxTeams) != null)
      .length;
  final midHits = normWords
      .where(
        (w) =>
            w.nx0 >= 0.45 &&
            w.nx0 <= 0.65 &&
            _parseRankBadge(w.text, maxTeams) != null,
      )
      .length;

  if (leftHits >= 1 && midHits >= 2) {
    final leftWords = normWords
        .where((w) => w.nxCenter < 0.50)
        .map(
          (w) => _NormWord(
            text: w.text,
            nx0: (w.nx0 / 0.50).clamp(0.0, 1.0),
            ny0: w.ny0,
            nx1: (w.nx1 / 0.50).clamp(0.0, 1.0),
            ny1: w.ny1,
            confidence: w.confidence,
          ),
        )
        .toList();
    final rightWords = normWords
        .where((w) => w.nxCenter >= 0.50)
        .map(
          (w) => _NormWord(
            text: w.text,
            nx0: ((w.nx0 - 0.50) / 0.50).clamp(0.0, 1.0),
            ny0: w.ny0,
            nx1: ((w.nx1 - 0.50) / 0.50).clamp(0.0, 1.0),
            ny1: w.ny1,
            confidence: w.confidence,
          ),
        )
        .toList();
    final merged = [
      ..._parseColumnLines(_clusterLines(leftWords), maxTeams, sourceImageIndex),
      ..._parseColumnLines(_clusterLines(rightWords), maxTeams, sourceImageIndex),
    ]..sort((a, b) => a.rank.compareTo(b.rank));
    return merged;
  }

  return _parseColumnLines(_clusterLines(normWords), maxTeams, sourceImageIndex);
}

List<ScannedRankRow> mergeAndDeduplicateScans(
  List<List<ScannedRankRow>> scansPerImage, {
  int maxTeams = 12,
}) {
  final byRank = <int, ScannedRankRow>{};

  for (final rows in scansPerImage) {
    for (final row in rows) {
      if (row.rank < 1 || row.rank > maxTeams) continue;
      final existing = byRank[row.rank];
      if (existing == null) {
        byRank[row.rank] = row;
        continue;
      }

      final incomingBetter = (existing.isEdgeClipped && !row.isEdgeClipped) ||
          (existing.isEdgeClipped == row.isEdgeClipped &&
              row.normalizedTokens.length > existing.normalizedTokens.length);

      final primary = incomingBetter ? row : existing;
      final secondary = incomingBetter ? existing : row;
      final mergedTokens = <String>{
        ...existing.normalizedTokens,
        ...row.normalizedTokens,
      }.toList();

      byRank[row.rank] = ScannedRankRow(
        rank: primary.rank,
        kills: primary.kills,
        rawPlayerText:
            primary.rawPlayerText.length >= secondary.rawPlayerText.length
                ? primary.rawPlayerText
                : secondary.rawPlayerText,
        normalizedTokens: mergedTokens,
        confidence: math.max(existing.confidence, row.confidence),
        isEdgeClipped: existing.isEdgeClipped && row.isEdgeClipped,
        sourceImageIndex: primary.sourceImageIndex,
      );
    }
  }

  final out = byRank.values.toList()..sort((a, b) => a.rank.compareTo(b.rank));
  return out;
}

List<MatchedScanRow> matchScannedRowsToTeams(
  List<ScannedRankRow> rows,
  List<Team> teams,
) {
  final pairs =
      <({int rowIdx, String teamId, double score, String? keyword})>[];
  for (int i = 0; i < rows.length; i++) {
    for (final team in teams) {
      final res = scoreSquadAgainstTokens(rows[i].normalizedTokens, team);
      if (res.score >= 0.68) {
        pairs.add((
          rowIdx: i,
          teamId: team.id,
          score: res.score,
          keyword: res.matchedKeyword,
        ));
      }
    }
  }
  pairs.sort((a, b) => b.score.compareTo(a.score));

  final usedRows = <int>{};
  final usedTeams = <String>{};
  final assigned = <int, ({String teamId, double score, String? keyword})>{};

  for (final p in pairs) {
    if (usedRows.contains(p.rowIdx) || usedTeams.contains(p.teamId)) continue;
    usedRows.add(p.rowIdx);
    usedTeams.add(p.teamId);
    assigned[p.rowIdx] = (
      teamId: p.teamId,
      score: p.score,
      keyword: p.keyword,
    );
  }

  if (rows.length == teams.length &&
      rows.length - usedRows.length == 1 &&
      teams.length - usedTeams.length == 1) {
    final leftIdx = List<int>.generate(rows.length, (i) => i)
        .firstWhere((i) => !usedRows.contains(i));
    final leftTeam = teams.firstWhere((t) => !usedTeams.contains(t.id));
    assigned[leftIdx] = (
      teamId: leftTeam.id,
      score: 0.7,
      keyword: 'last-remaining-squad',
    );
  }

  return [
    for (int i = 0; i < rows.length; i++)
      MatchedScanRow(
        rank: rows[i].rank,
        kills: rows[i].kills,
        rawPlayerText: rows[i].rawPlayerText,
        normalizedTokens: rows[i].normalizedTokens,
        matchedTeamId: assigned[i]?.teamId,
        matchConfidence: assigned[i]?.score ?? 0,
        matchedKeyword: assigned[i]?.keyword,
      ),
  ];
}

List<String> extractLearnableTokens(List<String> normalizedTokens) {
  return normalizedTokens
      .where(
        (t) =>
            t.length >= 3 &&
            t.length <= 24 &&
            !RegExp(r'^\d+$').hasMatch(t),
      )
      .take(10)
      .toList();
}

Future<({Uint8List rgba, int width, int height, double rawWidth, double rawHeight})>
    _decodeNormalizedRgba(String path) async {
  final bytes = await File(path).readAsBytes();
  final rawCodec = await ui.instantiateImageCodec(bytes);
  final rawFrame = await rawCodec.getNextFrame();
  final rawW = rawFrame.image.width;
  final rawH = rawFrame.image.height;

  if (rawH <= 640) {
    final bd =
        await rawFrame.image.toByteData(format: ui.ImageByteFormat.rawRgba);
    rawFrame.image.dispose();
    return (
      rgba: bd!.buffer.asUint8List(),
      width: rawW,
      height: rawH,
      rawWidth: rawW.toDouble(),
      rawHeight: rawH.toDouble(),
    );
  }

  rawFrame.image.dispose();
  final scaledCodec =
      await ui.instantiateImageCodec(bytes, targetHeight: 540);
  final scaledFrame = await scaledCodec.getNextFrame();
  final w = scaledFrame.image.width;
  final h = scaledFrame.image.height;
  final bd =
      await scaledFrame.image.toByteData(format: ui.ImageByteFormat.rawRgba);
  scaledFrame.image.dispose();

  return (
    rgba: bd!.buffer.asUint8List(),
    width: w,
    height: h,
    rawWidth: rawW.toDouble(),
    rawHeight: rawH.toDouble(),
  );
}

Future<List<MatchedScanRow>> scanMatchScreenshotsOffline({
  required List<String> filePaths,
  required List<Team> teams,
}) async {
  if (filePaths.isEmpty) return const [];
  final recognizer = TextRecognizer(script: TextRecognitionScript.latin);

  try {
    final perImage = <List<ScannedRankRow>>[];
    final maxTeams = math.max(12, teams.length);

    for (int i = 0; i < filePaths.length; i++) {
      final path = filePaths[i];
      final decoded = await _decodeNormalizedRgba(path);
      final grid = _detectFreeFireGridAndBuildComposite(
        decoded.rgba,
        decoded.width,
        decoded.height,
      );

      if (grid != null) {
        String? tempPngPath;
        try {
          tempPngPath = await _writeCompositeRgbaToTempPng(
            grid.compositeRgba,
            grid.compositeWidth,
            grid.compositeHeight,
            i,
          );
          final recognized = await recognizer.processImage(
            InputImage.fromFilePath(tempPngPath),
          );

          for (final block in recognized.blocks) {
            for (final line in block.lines) {
              for (final el in line.elements) {
                final rect = el.boundingBox;
                final wcx = (rect.left + rect.right) / 2.0;
                final origY = ((rect.top + rect.bottom) / 2.0) / grid.scale;

                ({String side, int outX0, int outX1})? st;
                for (final b in grid.stripBounds) {
                  if (wcx >= b.outX0 - 15 && wcx <= b.outX1 + 15) {
                    st = b;
                    break;
                  }
                }
                if (st == null) continue;

                for (final card in grid.cards) {
                  if (card.side == st.side &&
                      origY >= card.y0 - 6 &&
                      origY <= card.y1 + 6) {
                    card.words.add(el.text);
                    break;
                  }
                }
              }
            }
          }

          perImage.add(
            grid.cards.map((c) {
              final rawText = c.words.join(' ').trim();
              return ScannedRankRow(
                rank: c.rank,
                kills: c.kills,
                rawPlayerText: rawText,
                normalizedTokens: extractIgnTokens(rawText),
                confidence: 90,
                isEdgeClipped: c.clipped,
                sourceImageIndex: i,
              );
            }).toList(),
          );
        } finally {
          if (tempPngPath != null) {
            try {
              final f = File(tempPngPath);
              if (await f.exists()) await f.delete();
            } catch (_) {}
          }
        }
      } else {
        // Fallback for custom non-Free-Fire scoreboards
        final recognized = await recognizer.processImage(
          InputImage.fromFilePath(path),
        );
        final boxes = <OcrWordBox>[];
        for (final block in recognized.blocks) {
          for (final line in block.lines) {
            for (final el in line.elements) {
              final rect = el.boundingBox;
              boxes.add(
                OcrWordBox(
                  text: el.text,
                  x0: rect.left,
                  y0: rect.top,
                  x1: rect.right,
                  y1: rect.bottom,
                  confidence: (el.confidence ?? 0.8) * 100,
                ),
              );
            }
          }
        }
        perImage.add(
          parseOcrElementsToRows(
            boxes,
            decoded.rawWidth,
            decoded.rawHeight,
            maxTeams: maxTeams,
            sourceImageIndex: i,
          ),
        );
      }
    }

    final merged = mergeAndDeduplicateScans(perImage, maxTeams: maxTeams);
    return matchScannedRowsToTeams(merged, teams);
  } finally {
    await recognizer.close();
  }
}
