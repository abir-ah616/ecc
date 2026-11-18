import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import '../models/tournament_models.dart';
import 'ff_digit_cnn_weights.dart';

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
  0x0391: 'a', 0x0410: 'a', 0x13AA: 'a', 0x039B: 'a', 0x03B1: 'a', 0x0430: 'a', 0x1D2C: 'a', 0x1D43: 'a', 0x20B3: 'a', 0x0245: 'a', 0x028C: 'a', 0x0E14: 'a',
  0x0392: 'b', 0x0412: 'b', 0x0299: 'b', 0x0432: 'b', 0x1D2E: 'b', 0x1D47: 'b', 0x212C: 'b', 0x0E3F: 'b', 0x20BF: 'b', 0x00DF: 'b',
  0x0421: 'c', 0x13DF: 'c', 0x1D04: 'c', 0x0441: 'c', 0x1D9C: 'c', 0x212D: 'c', 0x00A2: 'c', 0x20B5: 'c',
  0x13A0: 'd', 0x1D05: 'd', 0x010E: 'd', 0x0110: 'd', 0x0111: 'd', 0x1D30: 'd', 0x1D48: 'd',
  0x0395: 'e', 0x0415: 'e', 0x13AC: 'e', 0x1D07: 'e', 0x0435: 'e', 0x03B5: 'e', 0x1D31: 'e', 0x1D49: 'e', 0x2130: 'e', 0x20AC: 'e', 0x0246: 'e', 0x0247: 'e',
  0x0492: 'f', 0xA730: 'f', 0x0493: 'f', 0x1DA0: 'f', 0x2131: 'f',
  0x0262: 'g', 0x13C0: 'g', 0x1D33: 'g', 0x1D4D: 'g', 0x20B2: 'g',
  0x0397: 'h', 0x041D: 'h', 0x13BB: 'h', 0x029C: 'h', 0x043D: 'h', 0x1D34: 'h', 0x02B0: 'h', 0x210B: 'h', 0x210C: 'h', 0x20B4: 'h',
  0x0399: 'i', 0x0406: 'i', 0x0407: 'i', 0x026A: 'i', 0x0456: 'i', 0x0457: 'i', 0x1D35: 'i', 0x2071: 'i', 0x2110: 'i', 0x00A1: 'i',
  0x0408: 'j', 0x1D0A: 'j', 0x0458: 'j', 0x1D36: 'j', 0x02B2: 'j', 0x2111: 'j',
  0x039A: 'k', 0x041A: 'k', 0x1D0B: 'k', 0x043A: 'k', 0x1D37: 'k', 0x1D4F: 'k', 0x20AD: 'k',
  0x13DE: 'l', 0x029F: 'l', 0x0141: 'l', 0x0142: 'l', 0x1D38: 'l', 0x02E1: 'l', 0x2112: 'l', 0x2113: 'l', 0x00A3: 'l',
  0x039C: 'm', 0x041C: 'm', 0x13B7: 'm', 0x1D0D: 'm', 0x043C: 'm', 0x1D39: 'm', 0x1D50: 'm', 0x2133: 'm', 0x20BC: 'm',
  0x039D: 'n', 0x0274: 'n', 0x0418: 'n', 0x0438: 'n', 0x0419: 'n', 0x0439: 'n', 0x1D3A: 'n', 0x207F: 'n', 0x20A6: 'n', 0x2115: 'n',
  0x039F: 'o', 0x041E: 'o', 0x00D8: 'o', 0x00F8: 'o', 0x1D0F: 'o', 0x043E: 'o', 0x1D3C: 'o', 0x1D52: 'o', 0x04E8: 'o', 0x04E9: 'o',
  0x03A1: 'p', 0x0420: 'p', 0x1D18: 'p', 0x0440: 'p', 0x1D3E: 'p', 0x1D56: 'p', 0x20B1: 'p', 0x2119: 'p',
  0x042F: 'r', 0x0280: 'r', 0x13D2: 'r', 0x044F: 'r', 0x1D3F: 'r', 0x02B3: 'r', 0x211B: 'r', 0x211C: 'r', 0x211D: 'r', 0x20B9: 'r', 0x20BD: 'r',
  0x0405: 's', 0x13DA: 's', 0xA731: 's', 0x0455: 's', 0x0024: 's', 0x02E2: 's',
  0x03A4: 't', 0x0422: 't', 0x1D1B: 't', 0x0442: 't', 0x1D40: 't', 0x1D57: 't', 0x20AE: 't', 0x20B8: 't', 0x20BA: 't',
  0x054D: 'u', 0x1D1C: 'u', 0x03C5: 'u', 0x1D41: 'u', 0x1D58: 'u', 0x0244: 'u', 0x0289: 'u',
  0x0474: 'v', 0x1D20: 'v', 0x0475: 'v', 0x2C7D: 'v', 0x1D5B: 'v',
  0x13B3: 'w', 0x1D21: 'w', 0x03C9: 'w', 0x1D42: 'w', 0x02B7: 'w', 0x20A9: 'w',
  0x03A7: 'x', 0x0425: 'x', 0x0445: 'x', 0x02E3: 'x',
  0x03A5: 'y', 0x0423: 'y', 0x028F: 'y', 0x0443: 'y', 0x00A5: 'y', 0x02B8: 'y', 0x024E: 'y', 0x024F: 'y',
  0x0396: 'z', 0x1D22: 'z', 0x1DBB: 'z', 0x2124: 'z', 0x2128: 'z',
  0x30E1: ' ', 0x30C4: ' ', 0x4E42: ' ', 0x4E45: ' ', 0x534D: ' ', 0x3005: ' ', 0x4E95: ' ',
  0x0F3A: ' ', 0x0F3B: ' ', 0x0F12: ' ', 0x262C: ' ', 0x20DD: ' ',
  0x2020: ' ', 0x2021: ' ', 0xA9C1: ' ', 0xA9C2: ' ',
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
  if (rune >= 0x24B6 && rune <= 0x24CF) {
    return '${String.fromCharCode(0x61 + (rune - 0x24B6))} ';
  }
  if (rune >= 0x24D0 && rune <= 0x24E9) {
    return '${String.fromCharCode(0x61 + (rune - 0x24D0))} ';
  }
  if (rune >= 0x2776 && rune <= 0x277E) {
    return '${rune - 0x2775}';
  }
  if (rune >= 0x2780 && rune <= 0x2788) {
    return '${rune - 0x277F}';
  }
  if (rune >= 0x278A && rune <= 0x2792) {
    return '${rune - 0x2789}';
  }
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

String _preMapHomoglyphs(String raw) {
  if (raw.isEmpty) return '';
  final sb = StringBuffer();
  for (final rune in raw.runes) {
    if ((rune >= 0x0300 && rune <= 0x036F) ||
        (rune >= 0x20DE && rune <= 0x20E0)) {
      continue;
    }
    sb.write(_foldRune(rune));
  }
  return sb.toString();
}

String _expandInlineSymbolLeet(String raw) {
  if (raw.isEmpty) return '';
  return _preMapHomoglyphs(raw)
      .replaceAll('@', 'a')
      .replaceAllMapped(
        RegExp(r"([a-z0-9])[!|'\u00A1]+([a-z0-9])"),
        (m) => '${m[1]}i${m[2]}',
      )
      .replaceAllMapped(
        RegExp(r'([a-z0-9.])\?(?=\s|$)'),
        (m) => '${m[1]}7',
      )
      .replaceAllMapped(
        RegExp(r'(^|\s)!(?=[a-z])'),
        (m) => '${m[1]} ',
      );
}

String normalizeFreeFireIgn(String raw) {
  if (raw.isEmpty) return '';
  final mapped = _preMapHomoglyphs(raw);

  final words = mapped
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

final RegExp _kNoiseFragmentRe = RegExp(
  r'^(?:eliminations?|elims?|ations?|tions?|ions?|ons?|ns|ws|is)$',
  caseSensitive: false,
);

List<String> extractIgnTokens(String raw) {
  if (raw.isEmpty) return const [];
  final variants = <String>{};
  final baseNorm = normalizeFreeFireIgn(raw);
  if (baseNorm.isNotEmpty) variants.add(baseNorm);

  final leetNorm = normalizeFreeFireIgn(_expandInlineSymbolLeet(raw));
  if (leetNorm.isNotEmpty) variants.add(leetNorm);

  final xSplit = raw.replaceAllMapped(
    RegExp(r'([A-Z0-9]{2,5})x([A-Z0-9]{2,})'),
    (m) => '${m[1]} ${m[2]}',
  );
  if (xSplit != raw) {
    final xNorm = normalizeFreeFireIgn(_expandInlineSymbolLeet(xSplit));
    if (xNorm.isNotEmpty) variants.add(xNorm);
  }

  final set = <String>{};
  for (final norm in variants) {
    final rawWords = norm
        .split(' ')
        .where((w) => w.isNotEmpty && !_kNoiseFragmentRe.hasMatch(w))
        .toList();
    final parts = rawWords
        .where((p) => p.length >= 2 && !RegExp(r'^\d+$').hasMatch(p))
        .toList();
    for (final p in parts) {
      set.add(p);
      final stem = p.replaceFirst(RegExp(r'(?:x?\d+|\d+x)$'), '');
      if (stem.length >= 4 && stem != p) set.add(stem);
      if (p.length >= 5 && RegExp(r'^(?:ns|ws|ms|s|w|n|v)').hasMatch(p)) {
        final debleed2 = p.replaceFirst(RegExp(r'^(?:ns|ws|ms)'), '');
        if (debleed2.length >= 4 && debleed2 != p) set.add(debleed2);
        final debleed1 = p.substring(1);
        if (debleed1.length >= 4) set.add(debleed1);
      }
    }

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
  }
  return set.toList();
}

String _foldOcrAndLeet(String s) => s
    .toLowerCase()
    .replaceAll('0', 'o')
    .replaceAll(RegExp(r'[1l|!\u00A1]'), 'i')
    .replaceAll('5', 's')
    .replaceAll('4', 'a')
    .replaceAll('8', 'b')
    .replaceAll('6', 'g')
    .replaceAll('3', 'e')
    .replaceAll('2', 'z')
    .replaceAll('7', 't')
    .replaceAll(RegExp(r'[^a-z0-9]'), '');

final Float64List _kOcrCostTable = () {
  final table = Float64List(128 * 128);
  for (int i = 0; i < table.length; i++) {
    table[i] = 1.0;
  }
  for (int c = 0; c < 128; c++) {
    table[c * 128 + c] = 0.0;
  }
  void addGroup(String chars, double cost) {
    for (int i = 0; i < chars.length; i++) {
      for (int j = i + 1; j < chars.length; j++) {
        final c0 = chars.codeUnitAt(i);
        final c1 = chars.codeUnitAt(j);
        if (c0 < 128 && c1 < 128) {
          table[c0 * 128 + c1] = math.min(cost, table[c0 * 128 + c1]);
          table[c1 * 128 + c0] = math.min(cost, table[c1 * 128 + c0]);
        }
      }
    }
  }

  addGroup('odquc', 0.32);
  addGroup('kxhr', 0.35);
  addGroup('aeo', 0.38);
  addGroup('mnwh', 0.38);
  addGroup('iltyvj', 0.35);
  addGroup('bprd', 0.38);
  addGroup('uvwy', 0.35);
  addGroup('ft', 0.35);
  addGroup('sz', 0.35);
  addGroup('bs', 0.42);
  addGroup('tr', 0.40);
  return table;
}();

bool _isAsciiVowel(int cu) =>
    cu == 0x61 || cu == 0x65 || cu == 0x69 || cu == 0x6F || cu == 0x75;

Float64List _dpScratch = Float64List(4096);

double _weightedDamerauLevenshtein(String a, String b) {
  if (a == b) return 0.0;
  final la = a.length;
  final lb = b.length;
  if (la == 0) return lb.toDouble();
  if (lb == 0) return la.toDouble();

  final stride = lb + 1;
  final needed = (la + 1) * stride;
  if (_dpScratch.length < needed) {
    _dpScratch = Float64List(math.max(needed, _dpScratch.length * 2));
  }
  final dp = _dpScratch;

  for (int i = 0; i <= la; i++) {
    dp[i * stride] = i * 0.85;
  }
  for (int j = 0; j <= lb; j++) {
    dp[j] = j * 0.85;
  }

  for (int i = 1; i <= la; i++) {
    final ca = a.codeUnitAt(i - 1);
    final delCost = _isAsciiVowel(ca) ? 0.65 : 0.85;
    final rowOff = i * stride;
    final prevOff = (i - 1) * stride;
    for (int j = 1; j <= lb; j++) {
      final cb = b.codeUnitAt(j - 1);
      final subCost = ca == cb
          ? 0.0
          : (ca < 128 && cb < 128 ? _kOcrCostTable[ca * 128 + cb] : 1.0);
      final insCost = _isAsciiVowel(cb) ? 0.65 : 0.85;
      final d1 = dp[prevOff + j] + delCost;
      final d2 = dp[rowOff + j - 1] + insCost;
      final d3 = dp[prevOff + j - 1] + subCost;
      var val = d1 < d2 ? (d1 < d3 ? d1 : d3) : (d2 < d3 ? d2 : d3);
      if (i > 1 &&
          j > 1 &&
          ca == b.codeUnitAt(j - 2) &&
          a.codeUnitAt(i - 2) == cb) {
        final tr = dp[(i - 2) * stride + (j - 2)] + 0.45;
        if (tr < val) val = tr;
      }
      dp[rowOff + j] = val;
    }
  }
  return dp[la * stride + lb];
}

final Map<String, List<String>> _kFoldedVariantsCache = {};

List<String> _getFoldedVariants(String raw) {
  final cached = _kFoldedVariantsCache[raw];
  if (cached != null) return cached;
  final set = <String>{
    _foldOcrAndLeet(normalizeFreeFireIgn(_expandInlineSymbolLeet(raw))),
    _foldOcrAndLeet(normalizeFreeFireIgn(raw)),
  }..removeWhere((s) => s.isEmpty);
  final computed = set.toList(growable: false);
  if (_kFoldedVariantsCache.length > 4096) {
    _kFoldedVariantsCache.clear();
  }
  _kFoldedVariantsCache[raw] = computed;
  return computed;
}

double ocrFuzzySimilarity(String candidateToken, String keywordRaw) {
  final kwVariants = _getFoldedVariants(keywordRaw);
  final candVariants = _getFoldedVariants(candidateToken);

  if (kwVariants.isEmpty || candVariants.isEmpty) return 0;

  var bestOverall = 0.0;
  for (final kw in kwVariants) {
    for (final cand in candVariants) {
      if (cand == kw) return 1.0;
      if (kw.length >= 3 && cand.contains(kw)) {
        bestOverall = math.max(bestOverall, 0.96);
        continue;
      }
      if (cand.length >= 4 && kw.contains(cand)) {
        bestOverall = math.max(
          bestOverall,
          math.min(0.92, cand.length / kw.length + 0.22),
        );
      }

      if (cand.length > kw.length && kw.length >= 3) {
        var bestSlice = 0.0;
        for (int start = 0; start <= cand.length - kw.length; start++) {
          final slice = cand.substring(start, start + kw.length);
          final sim = 1.0 - _weightedDamerauLevenshtein(slice, kw) / kw.length;
          if (sim > bestSlice) bestSlice = sim;
        }
        if (bestSlice >= 0.75) {
          bestOverall = math.max(bestOverall, bestSlice * 0.95);
        }
      }

      final maxLen = math.max(cand.length, kw.length);
      if (maxLen >= 3) {
        final sim = math.max(
          0.0,
          1.0 - _weightedDamerauLevenshtein(cand, kw) / maxLen,
        );
        bestOverall = math.max(bestOverall, sim);
      }
    }
  }
  return bestOverall;
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

    final normLeet = normalizeFreeFireIgn(_expandInlineSymbolLeet(clean));
    final collapsed = normLeet.replaceAll(' ', '');
    final collapsedStem = collapsed.replaceFirst(RegExp(r'(?:x?\d+|\d+x)$'), '');
    if (collapsedStem.length >= 4 && collapsedStem != collapsed) {
      keywords.add((label: collapsedStem, weight: baseWeight * 0.96));
    }

    final subParts = normLeet
        .split(' ')
        .where((w) => w.length >= 4 && !RegExp(r'^\d+$').hasMatch(w));
    for (final sp in subParts) {
      final partWeight = sp.length >= 5 ? baseWeight * 0.95 : baseWeight * 0.89;
      if (sp != collapsed) {
        keywords.add((label: sp, weight: partWeight));
      }
      final spStem = sp.replaceFirst(RegExp(r'(?:x?\d+|\d+x)$'), '');
      if (spStem.length >= 4 && spStem != sp) {
        keywords.add((label: spStem, weight: partWeight * 0.98));
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
    if (kwBest >= 0.70) hits++;
    if (kwBest > bestScore) {
      bestScore = kwBest;
      bestKw = kw.label;
    }
  }

  if (hits >= 2) bestScore = math.min(1.0, bestScore + 0.05);
  return (score: bestScore, matchedKeyword: bestKw);
}

// ============================================================================
// Dedicated Free Fire Neural Digit & Position CNN (16x20 Aspect-Preserving)
// Architecture: Input(1x20x16) -> Conv3x3(12)+ReLU -> MaxPool2x2
//               -> Conv3x3(24)+ReLU -> MaxPool2x2 -> FC(48)+ReLU -> FC(10)
// ============================================================================

const int _kCnnGw = 16;
const int _kCnnGh = 20;
const int _kCnnC1 = 12;
const int _kCnnC2 = 24;
const int _kCnnH1 = 10;
const int _kCnnW1 = 8;
const int _kCnnH2 = 5;
const int _kCnnW2 = 4;
const int _kCnnFlat = _kCnnC2 * _kCnnH2 * _kCnnW2; // 480
const int _kCnnHid = 48;
const int _kCnnCls = 10;

class _DecodedDigitCnn {
  final Float32List w1;
  final Float32List b1;
  final Float32List w2;
  final Float32List b2;
  final Float32List w3;
  final Float32List b3;
  final Float32List w4;
  final Float32List b4;

  const _DecodedDigitCnn({
    required this.w1,
    required this.b1,
    required this.w2,
    required this.b2,
    required this.w3,
    required this.b3,
    required this.w4,
    required this.b4,
  });
}

_DecodedDigitCnn? _cachedDigitCnn;
final Float32List _cnnPool1Scratch = Float32List(_kCnnC1 * _kCnnH1 * _kCnnW1);
final Float32List _cnnPool2Scratch = Float32List(_kCnnFlat);
final Float32List _cnnHidScratch = Float32List(_kCnnHid);

_DecodedDigitCnn _getDigitCnn() {
  if (_cachedDigitCnn != null) return _cachedDigitCnn!;
  final rawBytes = base64Decode(kFfDigitCnnB64);
  final qBytes = Int8List.sublistView(rawBytes);
  const lens = <int>[
    _kCnnC1 * 9,
    _kCnnC1,
    _kCnnC2 * _kCnnC1 * 9,
    _kCnnC2,
    _kCnnHid * _kCnnFlat,
    _kCnnHid,
    _kCnnCls * _kCnnHid,
    _kCnnCls,
  ];
  var offset = 0;
  final tensors = <Float32List>[];
  for (int idx = 0; idx < lens.length; idx++) {
    final len = lens[idx];
    final scale = kFfDigitCnnScales[idx];
    final out = Float32List(len);
    for (int i = 0; i < len; i++) {
      out[i] = qBytes[offset + i] * scale;
    }
    offset += len;
    tensors.add(out);
  }
  _cachedDigitCnn = _DecodedDigitCnn(
    w1: tensors[0],
    b1: tensors[1],
    w2: tensors[2],
    b2: tensors[3],
    w3: tensors[4],
    b3: tensors[5],
    w4: tensors[6],
    b4: tensors[7],
  );
  return _cachedDigitCnn!;
}

int _classifyGlyphCnn16x20(Float32List x) {
  final net = _getDigitCnn();

  // Conv1 (3x3, pad=1) + ReLU + MaxPool1 (2x2) -> 12x10x8
  for (int oc = 0; oc < _kCnnC1; oc++) {
    final wOff = oc * 9;
    final bias = net.b1[oc];
    for (int py = 0; py < _kCnnH1; py++) {
      for (int px = 0; px < _kCnnW1; px++) {
        var best = 0.0;
        for (int dy = 0; dy < 2; dy++) {
          final y = py * 2 + dy;
          for (int dx = 0; dx < 2; dx++) {
            final xx = px * 2 + dx;
            var s = bias;
            for (int ky = -1; ky <= 1; ky++) {
              final iy = y + ky;
              if (iy < 0 || iy >= _kCnnGh) continue;
              final kRow = (ky + 1) * 3;
              for (int kx = -1; kx <= 1; kx++) {
                final ix = xx + kx;
                if (ix < 0 || ix >= _kCnnGw) continue;
                s += x[iy * _kCnnGw + ix] * net.w1[wOff + kRow + (kx + 1)];
              }
            }
            if (s > best) best = s;
          }
        }
        _cnnPool1Scratch[(oc * _kCnnH1 + py) * _kCnnW1 + px] = best;
      }
    }
  }

  // Conv2 (3x3, pad=1) + ReLU + MaxPool2 (2x2) -> 24x5x4 (480)
  for (int oc = 0; oc < _kCnnC2; oc++) {
    final bias = net.b2[oc];
    for (int py = 0; py < _kCnnH2; py++) {
      for (int px = 0; px < _kCnnW2; px++) {
        var best = 0.0;
        for (int dy = 0; dy < 2; dy++) {
          final y = py * 2 + dy;
          for (int dx = 0; dx < 2; dx++) {
            final xx = px * 2 + dx;
            var s = bias;
            for (int ic = 0; ic < _kCnnC1; ic++) {
              final inBase = ic * _kCnnH1 * _kCnnW1;
              final wBase = (oc * _kCnnC1 + ic) * 9;
              for (int ky = -1; ky <= 1; ky++) {
                final iy = y + ky;
                if (iy < 0 || iy >= _kCnnH1) continue;
                final kRow = (ky + 1) * 3;
                for (int kx = -1; kx <= 1; kx++) {
                  final ix = xx + kx;
                  if (ix < 0 || ix >= _kCnnW1) continue;
                  s += _cnnPool1Scratch[inBase + iy * _kCnnW1 + ix] *
                      net.w2[wBase + kRow + (kx + 1)];
                }
              }
            }
            if (s > best) best = s;
          }
        }
        _cnnPool2Scratch[(oc * _kCnnH2 + py) * _kCnnW2 + px] = best;
      }
    }
  }

  // FC1 (480 -> 48) + ReLU
  for (int i = 0; i < _kCnnHid; i++) {
    var s = net.b3[i];
    final wOff = i * _kCnnFlat;
    for (int j = 0; j < _kCnnFlat; j++) {
      s += _cnnPool2Scratch[j] * net.w3[wOff + j];
    }
    _cnnHidScratch[i] = s > 0 ? s : 0.0;
  }

  // FC2 (48 -> 10) Argmax
  var bestDigit = 0;
  var bestLogit = -1e9;
  for (int c = 0; c < _kCnnCls; c++) {
    var s = net.b4[c];
    final wOff = c * _kCnnHid;
    for (int i = 0; i < _kCnnHid; i++) {
      s += _cnnHidScratch[i] * net.w4[wOff + i];
    }
    if (s > bestLogit) {
      bestLogit = s;
      bestDigit = c;
    }
  }
  return bestDigit;
}

int? readRgbaCellNumber(
  Uint8List rgba,
  int W,
  int H,
  int cropX0,
  int cropY0,
  int cropW,
  int cropH, {
  required bool yellowMode,
}) =>
    _readRgbaCellNumber(
      rgba,
      W,
      H,
      cropX0,
      cropY0,
      cropW,
      cropH,
      yellowMode: yellowMode,
    );

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
        ? math.max(0.0, 0.52 * r + 0.48 * g - 0.18 * b)
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
  if (peak - bg < (yellowMode ? 36.0 : 45.0)) return null;

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
  if (bw / bh > 0.68) {
    final colSum = Float32List(bw);
    for (int x = 0; x < bw; x++) {
      for (int y = minY; y <= maxY; y++) {
        colSum[x] += cell[y * cw + (minX + x)];
      }
    }
    var bestSplit = -1;
    var bestVal = 1e9;
    for (int x = (bw * 0.22).floor(); x <= (bw * 0.78).ceil(); x++) {
      if (colSum[x] < bestVal) {
        bestVal = colSum[x];
        bestSplit = x;
      }
    }
    var leftPeak = 0.0;
    var rightPeak = 0.0;
    for (int x = 0; x < bestSplit; x++) {
      if (colSum[x] > leftPeak) leftPeak = colSum[x];
    }
    for (int x = bestSplit + 1; x < bw; x++) {
      if (colSum[x] > rightPeak) rightPeak = colSum[x];
    }
    if (bestSplit > 0 &&
        bestVal < bh * 0.32 &&
        leftPeak > bestVal * 2.2 &&
        rightPeak > bestVal * 2.2) {
      xRanges.add((minX, minX + bestSplit - 1));
      xRanges.add((minX + bestSplit + 1, maxX));
    } else {
      xRanges.add((minX, maxX));
    }
  } else {
    xRanges.add((minX, maxX));
  }

  final digits = StringBuffer();
  final glyphTensor = Float32List(_kCnnGw * _kCnnGh);
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

    glyphTensor.fillRange(0, glyphTensor.length, 0.0);
    const targetH = 16.0;
    final targetW = (16.0 * (gw / gh)).clamp(2.0, 14.0);
    final padX = (_kCnnGw - targetW) * 0.5;
    const padY = (_kCnnGh - targetH) * 0.5;

    for (int ty = 0; ty < _kCnnGh; ty++) {
      final sy = y0 + ((ty + 0.5 - padY) / targetH) * gh;
      if (sy < y0 - 1 || sy > y1 + 1) continue;
      final cy0 = sy.floor().clamp(0, ch - 1).toInt();
      final cy1 = (cy0 + 1).clamp(0, ch - 1).toInt();
      final wy = (sy - sy.floor()).clamp(0.0, 1.0);

      for (int tx = 0; tx < _kCnnGw; tx++) {
        final sx = x0 + ((tx + 0.5 - padX) / targetW) * gw;
        if (sx < x0 - 1 || sx > x1 + 1) continue;
        final cx0 = sx.floor().clamp(0, cw - 1).toInt();
        final cx1 = (cx0 + 1).clamp(0, cw - 1).toInt();
        final wx = (sx - sx.floor()).clamp(0.0, 1.0);

        glyphTensor[ty * _kCnnGw + tx] =
            (cell[cy0 * cw + cx0] * (1 - wx) + cell[cy0 * cw + cx1] * wx) *
                    (1 - wy) +
                (cell[cy1 * cw + cx0] * (1 - wx) + cell[cy1 * cw + cx1] * wx) *
                    wy;
      }
    }
    digits.write(_classifyGlyphCnn16x20(glyphTensor));
  }

  final str = digits.toString();
  return str.isEmpty ? null : int.tryParse(str);
}

class _DetectedCard {
  final String side; // 'L' or 'R'
  final int rank;
  final int kills;
  final bool clipped;
  final List<({int y0, int y1, double yc})> lines;
  final List<String> words = [];

  _DetectedCard({
    required this.side,
    required this.rank,
    required this.kills,
    required this.clipped,
    required this.lines,
  });
}

class _DetectedGridResult {
  final List<_DetectedCard> cards;
  final Uint8List compositeRgba;
  final int compositeWidth;
  final int compositeHeight;
  final List<({int cardIndex, int y0, int y1})> rowMeta;

  const _DetectedGridResult({
    required this.cards,
    required this.compositeRgba,
    required this.compositeWidth,
    required this.compositeHeight,
    required this.rowMeta,
  });
}

_DetectedGridResult? _detectFreeFireGridAndBuildComposite(
  Uint8List rgba,
  int W,
  int H,
  Uint8List rawRgba,
  int rawW,
  int rawH,
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

  final leftCellW = math.max(8, (H * 0.023).round());
  final rightCellW = math.max(5, (H * 0.011).round());
  final padY = math.max(3, (H * 0.0085).round());

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
          kx - leftCellW,
          ln.y0 - padY,
          leftCellW + rightCellW,
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
        lines: c.lines,
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
          kx - leftCellW,
          ln.y0 - padY,
          leftCellW + rightCellW,
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
        lines: c.lines,
      ),
    );
  }

  final rawRatioX = rawW / W;
  final rawRatioY = rawH / H;
  final targetScale = (1750.0 / rawH).clamp(2.0, 4.2);
  final padRawY = math.max(3, (rawH * 0.009).round());

  final strips = <({String side, int x0, int x1})>[
    (
      side: 'L',
      x0: math.max(0, ((killX[0] - leftSpan * 0.60) * rawRatioX).round()),
      x1: math.max(1, ((killX[0] - leftSpan * 0.058) * rawRatioX).round()),
    ),
    (
      side: 'L',
      x0: math.max(0, ((killX[0] + leftSpan * 0.34) * rawRatioX).round()),
      x1: math.max(1, ((killX[1] - leftSpan * 0.058) * rawRatioX).round()),
    ),
  ];
  if (hasRightCol) {
    strips.addAll([
      (
        side: 'R',
        x0: math.max(0, ((killX[2] - rightSpan * 0.78) * rawRatioX).round()),
        x1: math.max(1, ((killX[2] - rightSpan * 0.072) * rawRatioX).round()),
      ),
      (
        side: 'R',
        x0: math.max(0, ((killX[2] + rightSpan * 0.345) * rawRatioX).round()),
        x1: math.max(1, ((killX[3] - rightSpan * 0.072) * rawRatioX).round()),
      ),
    ]);
  }

  final slotRows = <({
    int cardIndex,
    int ry0,
    int ry1,
    ({String side, int x0, int x1}) s0,
    ({String side, int x0, int x1}) s1,
  })>[];

  for (int ci = 0; ci < cards.length; ci++) {
    final card = cards[ci];
    final sideStrips = strips.where((s) => s.side == card.side).toList();
    if (sideStrips.length < 2) continue;
    for (final ln in card.lines) {
      slotRows.add((
        cardIndex: ci,
        ry0: math.max(0, (ln.y0 * rawRatioY).round() - padRawY),
        ry1: math.min(rawH - 1, (ln.y1 * rawRatioY).round() + padRawY),
        s0: sideStrips[0],
        s1: sideStrips[1],
      ));
    }
  }

  var maxStripW = 16;
  for (final s in strips) {
    final sw = ((s.x1 - s.x0) * targetScale).round();
    if (sw > maxStripW) maxStripW = sw;
  }
  final rowPitchY = (rawH * 0.058 * targetScale).round() + 28;
  const gutterX = 64;
  final canvasW = gutterX * 3 + maxStripW * 2;
  final canvasH = math.max(64, 32 + slotRows.length * rowPitchY);

  final dst = Uint8List(canvasW * canvasH * 4);
  dst.fillRange(0, dst.length, 255);

  double sampleRawLum(int px, int py) {
    final idx = (py * rawW + px) * 4;
    return 0.45 * rawRgba[idx] +
        0.45 * rawRgba[idx + 1] +
        0.10 * rawRgba[idx + 2];
  }

  int renderSlot(
    int sx0,
    int sx1,
    int sy0,
    int sy1,
    int outX0,
    int outY0,
  ) {
    final sw = sx1 - sx0;
    final sh = sy1 - sy0 + 1;
    if (sw < 4 || sh < 4) return 20;

    final lums = <double>[];
    for (int y = sy0; y <= sy1; y++) {
      for (int x = sx0; x < sx1; x++) {
        lums.add(sampleRawLum(x, y));
      }
    }
    lums.sort();
    final bg = lums[(lums.length * 0.35).floor()];
    final peak = lums[(lums.length * 0.99).floor()];
    final dw = math.max(4, (sw * targetScale).round());
    final dh = math.max(4, (sh * targetScale).round());
    if (peak - bg < 28.0) return dh;

    final lo = bg + (peak - bg) * 0.25;
    final hi = math.max(lo + 32.0, peak - (peak - bg) * 0.08);

    for (int dy = 0; dy < dh; dy++) {
      final fy = sy0 + dy / targetScale;
      final y0 = math.min<int>(rawH - 1, fy.floor());
      final y1 = math.min<int>(rawH - 1, y0 + 1);
      final wy = fy - y0;

      for (int dx = 0; dx < dw; dx++) {
        final fx = sx0 + dx / targetScale;
        final x0 = fx.floor().clamp(0, rawW - 1).toInt();
        final x1 = math.min<int>(rawW - 1, x0 + 1);
        final wx = fx - x0;

        final v =
            (sampleRawLum(x0, y0) * (1 - wx) + sampleRawLum(x1, y0) * wx) *
                    (1 - wy) +
                (sampleRawLum(x0, y1) * (1 - wx) + sampleRawLum(x1, y1) * wx) *
                    wy;
        final norm = ((v - lo) / (hi - lo)).clamp(0.0, 1.0);
        final ink = (255.0 * (1.0 - norm)).round();
        final outIdx = ((outY0 + dy) * canvasW + (outX0 + dx)) * 4;
        dst[outIdx] = ink;
        dst[outIdx + 1] = ink;
        dst[outIdx + 2] = ink;
        dst[outIdx + 3] = 255;
      }
    }
    return dh;
  }

  final rowMeta = <({int cardIndex, int y0, int y1})>[];
  for (int ri = 0; ri < slotRows.length; ri++) {
    final r = slotRows[ri];
    final outY0 = 20 + ri * rowPitchY;
    final dh0 = renderSlot(r.s0.x0, r.s0.x1, r.ry0, r.ry1, gutterX, outY0);
    final dh1 = renderSlot(
      r.s1.x0,
      r.s1.x1,
      r.ry0,
      r.ry1,
      gutterX * 2 + maxStripW,
      outY0,
    );
    rowMeta.add((
      cardIndex: r.cardIndex,
      y0: outY0 - 8,
      y1: outY0 + math.max<int>(dh0, dh1) + 8,
    ));
  }

  return _DetectedGridResult(
    cards: cards,
    compositeRgba: dst,
    compositeWidth: canvasW,
    compositeHeight: canvasH,
    rowMeta: rowMeta,
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
  final R = rows.length;
  final T = teams.length;
  if (R == 0 || T == 0) {
    return [
      for (final row in rows)
        MatchedScanRow(
          rank: row.rank,
          kills: row.kills,
          rawPlayerText: row.rawPlayerText,
          normalizedTokens: row.normalizedTokens,
        ),
    ];
  }

  final scoreMat = List<List<({double score, String? matchedKeyword})>>.generate(
    R,
    (rIdx) => [
      for (final team in teams)
        scoreSquadAgainstTokens(rows[rIdx].normalizedTokens, team),
    ],
  );

  // Only allow edges that pass the confidence/margin gate, weighted by (1 + score^2)
  // so Hungarian maximizes accepted match cardinality first and convex confidence second.
  final validWeight = List<Float64List>.generate(R, (rIdx) {
    final wRow = Float64List(T);
    for (int tIdx = 0; tIdx < T; tIdx++) {
      final s = scoreMat[rIdx][tIdx].score;
      var runnerUp = 0.0;
      for (int otherT = 0; otherT < T; otherT++) {
        if (otherT != tIdx && scoreMat[rIdx][otherT].score > runnerUp) {
          runnerUp = scoreMat[rIdx][otherT].score;
        }
      }
      if (s >= 0.65 || (s >= 0.58 && s - runnerUp >= 0.12)) {
        wRow[tIdx] = (s >= 0.92 ? 3.5 : 1.0) + s * s;
      }
    }
    return wRow;
  });

  // Global maximum-weight bipartite matching (O(N^3) Hungarian algorithm)
  final N = math.max(R, T);
  final u = Float64List(N + 1);
  final v = Float64List(N + 1);
  final p = Int32List(N + 1);
  final way = Int32List(N + 1);

  for (int i = 1; i <= N; i++) {
    p[0] = i;
    var j0 = 0;
    final minv = Float64List(N + 1);
    for (int k = 0; k <= N; k++) {
      minv[k] = 1e9;
    }
    final used = Uint8List(N + 1);

    do {
      used[j0] = 1;
      final i0 = p[j0];
      var delta = 1e9;
      var j1 = 0;
      for (int j = 1; j <= N; j++) {
        if (used[j] != 0) continue;
        final w =
            (i0 - 1 < R && j - 1 < T) ? validWeight[i0 - 1][j - 1] : 0.0;
        final cost = 5.0 - w; // strictly non-negative [0.5 .. 5.0]
        final cur = cost - u[i0] - v[j];
        if (cur < minv[j]) {
          minv[j] = cur;
          way[j] = j0;
        }
        if (minv[j] < delta) {
          delta = minv[j];
          j1 = j;
        }
      }
      for (int j = 0; j <= N; j++) {
        if (used[j] != 0) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }
      j0 = j1;
    } while (p[j0] != 0);

    do {
      const zero = 0;
      final j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
      if (j0 == zero) break;
    } while (true);
  }

  final usedRows = <int>{};
  final usedTeams = <String>{};
  final assigned = <int, ({String teamId, double score, String? keyword})>{};

  for (int j = 1; j <= T; j++) {
    final rIdx = p[j] - 1;
    final tIdx = j - 1;
    if (rIdx >= 0 && rIdx < R && validWeight[rIdx][tIdx] > 0) {
      final cell = scoreMat[rIdx][tIdx];
      usedRows.add(rIdx);
      usedTeams.add(teams[tIdx].id);
      assigned[rIdx] = (
        teamId: teams[tIdx].id,
        score: cell.score,
        keyword: cell.matchedKeyword,
      );
    }
  }

  // Stage 2: Iterative residual matching among remaining unmatched rows & teams
  // (critical for single-screenshot #1-#11 mode where 12 teams are registered).
  for (int pass = 0; pass < 3; pass++) {
    final remRows = <int>[];
    for (int r = 0; r < R; r++) {
      if (!usedRows.contains(r)) remRows.add(r);
    }
    final remTeamIndices = <int>[];
    for (int t = 0; t < T; t++) {
      if (!usedTeams.contains(teams[t].id)) remTeamIndices.add(t);
    }
    if (remRows.isEmpty || remTeamIndices.isEmpty) break;

    final cands = <({int rIdx, int tIdx, double score, String? kw})>[];
    for (final rIdx in remRows) {
      var bestT = -1;
      var bestS = 0.0;
      var secondS = 0.0;
      for (final tIdx in remTeamIndices) {
        final s = scoreMat[rIdx][tIdx].score;
        if (s > bestS) {
          secondS = bestS;
          bestS = s;
          bestT = tIdx;
        } else if (s > secondS) {
          secondS = s;
        }
      }
      var secondRowS = 0.0;
      if (bestT >= 0) {
        for (final otherR in remRows) {
          if (otherR != rIdx && scoreMat[otherR][bestT].score > secondRowS) {
            secondRowS = scoreMat[otherR][bestT].score;
          }
        }
      }
      if (bestT >= 0 &&
          bestS >= 0.54 &&
          bestS - secondS >= 0.06 &&
          bestS - secondRowS >= 0.03) {
        cands.add((
          rIdx: rIdx,
          tIdx: bestT,
          score: bestS,
          kw: scoreMat[rIdx][bestT].matchedKeyword,
        ));
      }
    }
    if (cands.isEmpty) break;
    cands.sort((a, b) => b.score.compareTo(a.score));
    var added = 0;
    for (final c in cands) {
      if (usedRows.contains(c.rIdx) || usedTeams.contains(teams[c.tIdx].id)) {
        continue;
      }
      usedRows.add(c.rIdx);
      usedTeams.add(teams[c.tIdx].id);
      assigned[c.rIdx] = (
        teamId: teams[c.tIdx].id,
        score: c.score,
        keyword: c.kw,
      );
      added++;
    }
    if (added == 0) break;
  }

  if (R == T && R - usedRows.length == 1 && T - usedTeams.length == 1) {
    final leftIdx = List<int>.generate(R, (i) => i)
        .firstWhere((i) => !usedRows.contains(i));
    final leftTeam = teams.firstWhere((t) => !usedTeams.contains(t.id));
    assigned[leftIdx] = (
      teamId: leftTeam.id,
      score: 0.7,
      keyword: 'last-remaining-squad',
    );
  }

  return [
    for (int i = 0; i < R; i++)
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

Future<
    ({
      Uint8List rgba,
      int width,
      int height,
      Uint8List rawRgba,
      int rawWidth,
      int rawHeight,
    })> _decodeNormalizedRgba(String path) async {
  final bytes = await File(path).readAsBytes();
  final probeCodec = await ui.instantiateImageCodec(bytes);
  final probeFrame = await probeCodec.getNextFrame();
  final origH = probeFrame.image.height;

  late final Uint8List rawRgba;
  late final int rawW;
  late final int rawH;

  if (origH <= 1440) {
    rawW = probeFrame.image.width;
    rawH = origH;
    final bd =
        await probeFrame.image.toByteData(format: ui.ImageByteFormat.rawRgba);
    probeFrame.image.dispose();
    rawRgba = bd!.buffer.asUint8List();
  } else {
    probeFrame.image.dispose();
    final hiCodec = await ui.instantiateImageCodec(bytes, targetHeight: 1440);
    final hiFrame = await hiCodec.getNextFrame();
    rawW = hiFrame.image.width;
    rawH = hiFrame.image.height;
    final bd =
        await hiFrame.image.toByteData(format: ui.ImageByteFormat.rawRgba);
    hiFrame.image.dispose();
    rawRgba = bd!.buffer.asUint8List();
  }

  if (rawH <= 640) {
    return (
      rgba: rawRgba,
      width: rawW,
      height: rawH,
      rawRgba: rawRgba,
      rawWidth: rawW,
      rawHeight: rawH,
    );
  }

  final scaledCodec = await ui.instantiateImageCodec(bytes, targetHeight: 540);
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
    rawRgba: rawRgba,
    rawWidth: rawW,
    rawHeight: rawH,
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
        decoded.rawRgba,
        decoded.rawWidth,
        decoded.rawHeight,
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
                final wy = (rect.top + rect.bottom) / 2.0;
                for (final rm in grid.rowMeta) {
                  if (wy >= rm.y0 && wy <= rm.y1) {
                    grid.cards[rm.cardIndex].words.add(el.text);
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
            decoded.rawWidth.toDouble(),
            decoded.rawHeight.toDouble(),
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
