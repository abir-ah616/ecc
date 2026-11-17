import 'dart:io';
import 'dart:math' as math;
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
  // Fullwidth ASCII (FF01..FF5E)
  if (rune >= 0xFF01 && rune <= 0xFF5E) {
    return String.fromCharCode(rune - 0xFEE0).toLowerCase();
  }
  // Mathematical Alphanumeric Symbols (U+1D400..U+1D6A3 — Bold/Italic/Sans/Monospace A-Z, a-z)
  if (rune >= 0x1D400 && rune <= 0x1D6A3) {
    final offset = rune - 0x1D400;
    final mod52 = offset % 52;
    if (mod52 < 26) {
      return String.fromCharCode(0x61 + mod52);
    } else {
      return String.fromCharCode(0x61 + (mod52 - 26));
    }
  }
  // Mathematical Digits (U+1D7CE..U+1D7FF)
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
  final parts = norm
      .split(' ')
      .where((p) => p.length >= 2 && !RegExp(r'^\d+$').hasMatch(p))
      .toList();
  final set = <String>{...parts};
  final collapsed = parts.join();
  if (collapsed.length >= 3) set.add(collapsed);
  return set.toList();
}

String _foldOcrDigits(String s) => s
    .replaceAll('0', 'o')
    .replaceAll('1', 'i')
    .replaceAll('5', 's')
    .replaceAll('8', 'b')
    .replaceAll('2', 'z');

int _levenshtein(String a, String b) {
  if (a == b) return 0;
  if (a.isEmpty) return b.length;
  if (b.isEmpty) return a.length;

  final dp = List<int>.generate(b.length + 1, (i) => i);
  for (int i = 1; i <= a.length; i++) {
    var prev = i - 1;
    dp[0] = i;
    for (int j = 1; j <= b.length; j++) {
      final temp = dp[j];
      final cost = a.codeUnitAt(i - 1) == b.codeUnitAt(j - 1) ? 0 : 1;
      dp[j] = math.min(math.min(dp[j] + 1, dp[j - 1] + 1), prev + cost);
      prev = temp;
    }
  }
  return dp[b.length];
}

double ocrFuzzySimilarity(String candidateToken, String keywordRaw) {
  final kw = _foldOcrDigits(
    normalizeFreeFireIgn(keywordRaw).replaceAll(' ', ''),
  );
  final cand = _foldOcrDigits(
    candidateToken.toLowerCase().replaceAll(' ', ''),
  );
  if (kw.isEmpty || cand.isEmpty) return 0;
  if (cand == kw) return 1.0;
  if (kw.length >= 3 && cand.contains(kw)) return 0.94;
  if (cand.length >= 4 && kw.contains(cand)) {
    return math.min(0.9, cand.length / kw.length + 0.2);
  }

  if (cand.length > kw.length && kw.length >= 3) {
    var best = 0.0;
    for (int start = 0; start <= cand.length - kw.length; start++) {
      final slice = cand.substring(start, start + kw.length);
      final sim = 1.0 - _levenshtein(slice, kw) / kw.length;
      if (sim > best) best = sim;
    }
    if (best >= 0.72) return best * 0.93;
  }

  final maxLen = math.max(cand.length, kw.length);
  if (maxLen < 3) return 0;
  return 1.0 - _levenshtein(cand, kw) / maxLen;
}

({double score, String? matchedKeyword}) scoreSquadAgainstTokens(
  List<String> tokens,
  Team team,
) {
  if (tokens.isEmpty) return (score: 0.0, matchedKeyword: null);

  final keywords = <({String label, double weight})>[];
  if ((team.player1 ?? '').trim().isNotEmpty) {
    keywords.add((label: team.player1!.trim(), weight: 1.0));
  }
  if ((team.player2 ?? '').trim().isNotEmpty) {
    keywords.add((label: team.player2!.trim(), weight: 0.98));
  }
  for (final lt in team.learnedTokens) {
    if (lt.trim().length >= 3) {
      keywords.add((label: lt.trim(), weight: 0.94));
    }
  }
  if (team.name.trim().isNotEmpty &&
      !RegExp(r'^(?:squad|team|slot)\s*\d+$', caseSensitive: false)
          .hasMatch(team.name.trim())) {
    keywords.add((label: team.name.trim(), weight: 0.88));
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
  final cleaned =
      raw.trim().replaceFirst(RegExp(r'kills?$', caseSensitive: false), '').trim();
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
      .where((w) => w.nx0 <= 0.16 && _parseRankBadge(w.text, maxTeams) != null)
      .length;
  final midHits = normWords
      .where(
        (w) =>
            w.nx0 >= 0.46 &&
            w.nx0 <= 0.63 &&
            _parseRankBadge(w.text, maxTeams) != null,
      )
      .length;

  if (leftHits >= 2 && midHits >= 2) {
    final leftWords = normWords
        .where((w) => w.nxCenter < 0.49)
        .map(
          (w) => _NormWord(
            text: w.text,
            nx0: (w.nx0 / 0.49).clamp(0.0, 1.0),
            ny0: w.ny0,
            nx1: (w.nx1 / 0.49).clamp(0.0, 1.0),
            ny1: w.ny1,
            confidence: w.confidence,
          ),
        )
        .toList();
    final rightWords = normWords
        .where((w) => w.nxCenter >= 0.49)
        .map(
          (w) => _NormWord(
            text: w.text,
            nx0: ((w.nx0 - 0.49) / 0.51).clamp(0.0, 1.0),
            ny0: w.ny0,
            nx1: ((w.nx1 - 0.49) / 0.51).clamp(0.0, 1.0),
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
      if (res.score >= 0.72) {
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
    final leftIdx =
        List<int>.generate(rows.length, (i) => i).firstWhere((i) => !usedRows.contains(i));
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
      .where((t) => t.length >= 3 && t.length <= 24 && !RegExp(r'^\d+$').hasMatch(t))
      .take(8)
      .toList();
}

Future<({double width, double height})> _measureImageFile(String path) async {
  final bytes = await File(path).readAsBytes();
  final codec = await ui.instantiateImageCodec(bytes);
  final frame = await codec.getNextFrame();
  final w = frame.image.width.toDouble();
  final h = frame.image.height.toDouble();
  frame.image.dispose();
  return (width: w, height: h);
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
      final dims = await _measureImageFile(path);
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
          dims.width,
          dims.height,
          maxTeams: maxTeams,
          sourceImageIndex: i,
        ),
      );
    }

    final merged = mergeAndDeduplicateScans(perImage, maxTeams: maxTeams);
    return matchScannedRowsToTeams(merged, teams);
  } finally {
    await recognizer.close();
  }
}
