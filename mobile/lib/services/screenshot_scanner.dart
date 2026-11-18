import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/tournament_models.dart';

class ScannedPlayerSlot {
  final String ign;
  final int kills;

  const ScannedPlayerSlot({
    required this.ign,
    required this.kills,
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
  final List<ScannedPlayerSlot> players;
  final String? aiMatchedTeamId;

  const ScannedRankRow({
    required this.rank,
    required this.kills,
    required this.rawPlayerText,
    required this.normalizedTokens,
    required this.confidence,
    required this.isEdgeClipped,
    required this.sourceImageIndex,
    this.players = const [],
    this.aiMatchedTeamId,
  });
}

class MatchedScanRow {
  final int rank;
  final int kills;
  final String rawPlayerText;
  final List<String> normalizedTokens;
  final bool isEdgeClipped;
  final String? matchedTeamId;
  final double matchConfidence;
  final String? matchedKeyword;

  const MatchedScanRow({
    required this.rank,
    required this.kills,
    required this.rawPlayerText,
    required this.normalizedTokens,
    this.isEdgeClipped = false,
    this.matchedTeamId,
    this.matchConfidence = 0,
    this.matchedKeyword,
  });
}

enum GeminiErrorCode {
  missingApiKey,
  invalidApiKey,
  rateLimited,
  networkError,
  parseError,
}

class GeminiScannerException implements Exception {
  final GeminiErrorCode code;
  final String message;

  const GeminiScannerException(this.code, this.message);

  @override
  String toString() => message;
}

const String _kGeminiApiBase =
    'https://generativelanguage.googleapis.com/v1beta';
const List<String> _kPreferredFlashModels = <String>[
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
];

String _storageKeyForEmail(String prefix, String? userEmail) {
  final clean = (userEmail ?? '').trim().toLowerCase();
  return '${prefix}_${clean.isEmpty ? 'default' : clean}';
}

String sanitizeGeminiApiKey(String raw) {
  return raw
      .trim()
      .replaceAll(RegExp(r'''^["']+|["']+$'''), '')
      .replaceAll(RegExp(r'\s+'), '');
}

String maskGeminiApiKey(String rawKey) {
  final clean = sanitizeGeminiApiKey(rawKey);
  if (clean.isEmpty) return '';
  if (clean.length <= 10) return '${clean.substring(0, 4)}...';
  return '${clean.substring(0, 6)}...${clean.substring(clean.length - 4)}';
}

Future<String> getStoredGeminiApiKey(String? userEmail) async {
  final prefs = await SharedPreferences.getInstance();
  final raw =
      prefs.getString(_storageKeyForEmail('esp_calc_gemini_api_key', userEmail)) ??
          '';
  return sanitizeGeminiApiKey(raw);
}

Future<String> getStoredGeminiModel(String? userEmail) async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getString(
          _storageKeyForEmail('esp_calc_gemini_model', userEmail)) ??
      _kPreferredFlashModels.first;
}

Future<void> setStoredGeminiApiKey({
  required String? userEmail,
  required String apiKey,
  String? verifiedModel,
}) async {
  final prefs = await SharedPreferences.getInstance();
  final clean = sanitizeGeminiApiKey(apiKey);
  final keyName = _storageKeyForEmail('esp_calc_gemini_api_key', userEmail);
  final modelName = _storageKeyForEmail('esp_calc_gemini_model', userEmail);
  if (clean.isEmpty) {
    await prefs.remove(keyName);
    await prefs.remove(modelName);
    return;
  }
  await prefs.setString(keyName, clean);
  if (verifiedModel != null && verifiedModel.isNotEmpty) {
    await prefs.setString(modelName, verifiedModel);
  }
}

Future<void> clearStoredGeminiApiKey(String? userEmail) async {
  await setStoredGeminiApiKey(userEmail: userEmail, apiKey: '');
}

List<String> _selectVisionFlashModels(List<dynamic> entries) {
  final available = <String>{};
  for (final raw in entries) {
    if (raw is! Map) continue;
    final id = ((raw['name'] as String?) ?? '')
        .replaceFirst(RegExp(r'^models/'), '')
        .trim();
    final methods = (raw['supportedGenerationMethods'] as List?)
            ?.whereType<String>()
            .toList() ??
        const <String>[];
    if (id.isEmpty || !methods.contains('generateContent')) continue;
    final lower = id.toLowerCase();
    if (lower.contains('tts') ||
        lower.contains('embedding') ||
        lower.contains('imagen') ||
        lower.contains('image-generation') ||
        lower.contains('audio') ||
        lower.contains('veo')) {
      continue;
    }
    if (lower.contains('gemini') && lower.contains('flash')) {
      available.add(id);
    }
  }

  final ordered = <String>[];
  for (final pref in _kPreferredFlashModels) {
    if (available.contains(pref)) ordered.add(pref);
  }
  final sortedRest = available.toList()..sort((a, b) => b.compareTo(a));
  for (final id in sortedRest) {
    if (!ordered.contains(id)) ordered.add(id);
  }
  return ordered.isNotEmpty ? ordered : List<String>.from(_kPreferredFlashModels);
}

Future<({ int statusCode, String body })> _geminiHttpRequest({
  required String method,
  required String url,
  required String apiKey,
  String? jsonBody,
}) async {
  final client = HttpClient()..connectionTimeout = const Duration(seconds: 25);
  try {
    final uri = Uri.parse(url);
    final req = method == 'POST'
        ? await client.postUrl(uri)
        : await client.getUrl(uri);
    req.headers.set('x-goog-api-key', apiKey);
    if (jsonBody != null) {
      req.headers.contentType = ContentType.json;
      req.add(utf8.encode(jsonBody));
    }
    final res = await req.close().timeout(const Duration(seconds: 60));
    final body = await utf8.decodeStream(res);
    return (statusCode: res.statusCode, body: body);
  } finally {
    client.close(force: true);
  }
}

Future<({ bool valid, String? model, String? error })> verifyGeminiApiKey(
  String rawKey,
) async {
  final cleanKey = sanitizeGeminiApiKey(rawKey);
  if (cleanKey.length < 20) {
    return (
      valid: false,
      model: null,
      error: 'Paste a complete Google AI Studio API key (starts with AIza...).',
    );
  }

  var candidateModels = List<String>.from(_kPreferredFlashModels);
  try {
    final res = await _geminiHttpRequest(
      method: 'GET',
      url: '$_kGeminiApiBase/models',
      apiKey: cleanKey,
    );

    if (res.statusCode == 400 ||
        res.statusCode == 401 ||
        res.statusCode == 403) {
      return (
        valid: false,
        model: null,
        error:
            'Invalid Gemini API key. Copy the exact key from Google AI Studio (aistudio.google.com/apikey).',
      );
    }

    if (res.statusCode >= 200 && res.statusCode < 300) {
      final decoded = jsonDecode(res.body);
      if (decoded is Map && decoded['models'] is List) {
        candidateModels = _selectVisionFlashModels(decoded['models'] as List);
      }
    }
  } catch (_) {
    return (
      valid: false,
      model: null,
      error:
          'Could not reach Google Gemini servers. Check your internet connection and try again.',
    );
  }

  var sawRateLimit = false;
  for (final model in candidateModels.take(3)) {
    try {
      final ping = await _geminiHttpRequest(
        method: 'POST',
        url:
            '$_kGeminiApiBase/models/${Uri.encodeComponent(model)}:generateContent',
        apiKey: cleanKey,
        jsonBody: jsonEncode({
          'contents': [
            {
              'parts': [
                {'text': 'Return {"ok":true}'},
              ],
            },
          ],
          'generationConfig': {
            'temperature': 0,
            'maxOutputTokens': 16,
          },
        }),
      );

      if (ping.statusCode >= 200 && ping.statusCode < 300) {
        return (valid: true, model: model, error: null);
      }
      if (ping.statusCode == 429) {
        sawRateLimit = true;
        continue;
      }
      if (ping.statusCode == 400 ||
          ping.statusCode == 401 ||
          ping.statusCode == 403) {
        String msg =
            'API key rejected by Google AI Studio. Check key permissions.';
        try {
          final errMap = jsonDecode(ping.body);
          if (errMap is Map &&
              errMap['error'] is Map &&
              errMap['error']['message'] is String) {
            msg = errMap['error']['message'] as String;
          }
        } catch (_) {}
        if (RegExp(r'api.?key', caseSensitive: false).hasMatch(msg) ||
            ping.statusCode != 400) {
          return (valid: false, model: null, error: msg);
        }
      }
    } catch (_) {
      // Try next fallback model
    }
  }

  if (sawRateLimit) {
    return (valid: true, model: candidateModels.first, error: null);
  }

  return (
    valid: false,
    model: null,
    error:
        'Could not verify generateContent access for this key. Generate a fresh key at aistudio.google.com/apikey.',
  );
}

const Map<int, String> _kHomoglyphRuneMap = {
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
  if ((rune >= 0x00C0 && rune <= 0x00C5) || (rune >= 0x00E0 && rune <= 0x00E5)) {
    return 'a';
  }
  if (rune == 0x00C6 || rune == 0x00E6) return 'ae';
  if (rune == 0x00C7 || rune == 0x00E7) return 'c';
  if ((rune >= 0x00C8 && rune <= 0x00CB) || (rune >= 0x00E8 && rune <= 0x00EB)) {
    return 'e';
  }
  if ((rune >= 0x00CC && rune <= 0x00CF) || (rune >= 0x00EC && rune <= 0x00EF)) {
    return 'i';
  }
  if (rune == 0x00D0 || rune == 0x00F0) return 'd';
  if (rune == 0x00D1 || rune == 0x00F1) return 'n';
  if ((rune >= 0x00D2 && rune <= 0x00D6) || (rune >= 0x00F2 && rune <= 0x00F6)) {
    return 'o';
  }
  if ((rune >= 0x00D9 && rune <= 0x00DC) || (rune >= 0x00F9 && rune <= 0x00FC)) {
    return 'u';
  }
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
  r'^(?:eliminations?|elims?|eliminatio|ations?|tions?|ions?|ons?|ns|ws|is)$',
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
        players: primary.players.isNotEmpty ? primary.players : secondary.players,
        aiMatchedTeamId: primary.aiMatchedTeamId ?? secondary.aiMatchedTeamId,
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
          isEdgeClipped: row.isEdgeClipped,
        ),
    ];
  }

  final scoreMat = List<List<({double score, String? matchedKeyword})>>.generate(
    R,
    (rIdx) => [
      for (final team in teams)
        () {
          final det = scoreSquadAgainstTokens(rows[rIdx].normalizedTokens, team);
          if (rows[rIdx].aiMatchedTeamId != null &&
              rows[rIdx].aiMatchedTeamId == team.id) {
            final boosted = math.max(det.score, 0.88);
            return (
              score: det.score >= 0.65
                  ? math.min(1.0, det.score + 0.08)
                  : boosted,
              matchedKeyword: det.matchedKeyword ?? team.name,
            );
          }
          return det;
        }(),
    ],
  );

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
        final cost = 5.0 - w;
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
        isEdgeClipped: rows[i].isEdgeClipped,
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

// ============================================================================
// Gemini Multimodal Free Fire Post-Match Scoreboard Engine
// ============================================================================

const Map<String, dynamic> _kGeminiResponseSchema = {
  'type': 'OBJECT',
  'properties': {
    'rows': {
      'type': 'ARRAY',
      'description':
          'Deduplicated Free Fire post-match squad rank cards ordered by rank ascending (1 to 12).',
      'items': {
        'type': 'OBJECT',
        'properties': {
          'rank': {
            'type': 'INTEGER',
            'description':
                'Placement rank badge number shown on the left of the squad card (1 to 24).',
          },
          'isBottomClipped': {
            'type': 'BOOLEAN',
            'description':
                'True ONLY if this card (typically Rank 11 in an un-scrolled single screenshot) has its bottom player row cut off by the scroll edge and no other uploaded screenshot shows it in full.',
          },
          'matchedTeamId': {
            'type': 'STRING',
            'nullable': true,
            'description':
                'Exact teamId from REGISTERED_SQUADS if at least one player IGN on this rank card clearly belongs to that squad; otherwise null.',
          },
          'players': {
            'type': 'ARRAY',
            'description':
                'All visible players inside this squad card (1 to 4 players in a 2x2 grid). Do not invent empty slots.',
            'items': {
              'type': 'OBJECT',
              'properties': {
                'ign': {
                  'type': 'STRING',
                  'description':
                      'Player in-game nickname without the trailing word Eliminations.',
                },
                'kills': {
                  'type': 'INTEGER',
                  'description':
                      'Exact yellow integer shown immediately before Eliminations / Eliminatio for this player (0 to 99, careful with 2-digit kills like 11 or 16).',
                },
              },
              'required': ['ign', 'kills'],
            },
          },
          'totalKills': {
            'type': 'INTEGER',
            'description': 'Sum of kills across all players in this squad card.',
          },
        },
        'required': ['rank', 'isBottomClipped', 'players', 'totalKills'],
      },
    },
  },
  'required': ['rows'],
};

String _buildFreeFireGeminiPrompt(List<Team> teams, int imageCount) {
  final rosterPayload = teams.map((t) {
    final knownPlayers = <String>{
      ...t.players.map((s) => s.trim()).where((s) => s.isNotEmpty),
      if ((t.player1 ?? '').trim().isNotEmpty) t.player1!.trim(),
      if ((t.player2 ?? '').trim().isNotEmpty) t.player2!.trim(),
      ...t.learnedTokens.map((s) => s.trim()).where((s) => s.isNotEmpty),
    }.toList();
    return {
      'teamId': t.id,
      'squadName': t.name,
      'shortCode': t.shortCode,
      'knownPlayerIgns': knownPlayers,
    };
  }).toList();

  return [
    'You are a precision Free Fire Esports tournament scoreboard vision parser analyzing $imageCount post-match result screenshot(s) from the SAME match.',
    '',
    'CRITICAL FREE FIRE SCOREBOARD LAYOUT & RULES:',
    '1. TWO-COLUMN LAYOUT:',
    '   - Left column contains Ranks 1 to 5: Rank 1 (gold banner), Rank 2 (silver banner), Rank 3 (bronze banner), Rank 4 & 5 (dark cards).',
    '   - Right scrollable column contains Ranks 6 to 12 (dark cards).',
    '2. PLAYER SLOTS & EXACT KILLS (100% PRECISION REQUIRED):',
    '   - Each rank card contains 1 to 4 players arranged in a 2x2 grid (Top-Left, Top-Right, Bottom-Left, Bottom-Right). If a squad entered with 1-3 players, the remaining slot is blank — only include visible players.',
    '   - Every player slot displays: [White Player IGN] [Yellow Number] "Eliminations".',
    '   - In the right column (Ranks 6-12), the left player\'s "Eliminations" label often touches the right player\'s IGN (e.g. "4 EliminationsBRK ROKK7") and the far-right label is clipped to "Eliminatio". NEVER include "Eliminations" or "Eliminatio" inside `ign`, and ALWAYS read every player\'s yellow integer accurately.',
    '   - Inspect 2-digit yellow kill counts carefully (e.g. 10, 11, 12, 16 Eliminations) — never drop a digit or confuse 11/16 with 1/6.',
    '3. MULTI-SCREENSHOT OVERLAP & RANK 11 CLIPPING:',
    '   - Multiple screenshots of the same match overlap (e.g. Screenshot 1 shows Ranks 1-11; Screenshot 2 scrolled down shows Ranks 1-5 on left and Ranks 7-12 on right).',
    '   - Output ONE deduplicated entry per rank (1, 2, 3, ...). NEVER add or double-count kills from two screenshots showing the same rank.',
    '   - IMPORTANT: In an un-scrolled top screenshot, Rank 11 at the bottom-right is sliced horizontally in half above the yellow BACK button (hiding its bottom 2 players). When a second scrolled screenshot shows Rank 11 higher up with all 4 player slots visible, ALWAYS extract Rank 11 from the complete unclipped screenshot and set `isBottomClipped: false`. Only set `isBottomClipped: true` if no uploaded screenshot shows Rank 11\'s bottom row.',
    '4. STYLIZED FREE FIRE NICKNAME MATCHING TO REGISTERED_SQUADS:',
    '   - Match each rank card to `matchedTeamId` from REGISTERED_SQUADS below if at least one player IGN matches a squad\'s `knownPlayerIgns` (or `squadName`/clan tag when unambiguous).',
    '   - Free Fire players use stylized Unicode & leet variations of plain organizer names: circled letters (\u24B6\u24C0\u24B6\u24C8\u24BD = AKASH), dingbat digits (\u277B\u277E = 69), spaced letters ("S A F F A T" = SAFFAT), symbols/separators (\u30E1, \u30C4, \u4E42, \u2122, -, ., _), and leet (! = i, 4 = a, @ = a, 0 = o, ? = 7, 5 = s).',
    '   - Each `teamId` may be assigned to AT MOST ONE rank. If unsure or no `knownPlayerIgns` match, set `matchedTeamId: null`.',
    '',
    'REGISTERED_SQUADS JSON:\n${jsonEncode(rosterPayload)}',
  ].join('\n');
}

String _cleanExtractedIgn(String raw) {
  return raw
      .replaceAll(
          RegExp(r'\b(?:eliminations?|eliminatio|elims?)\b',
              caseSensitive: false),
          ' ')
      .replaceAll(RegExp(r'\s+'), ' ')
      .trim();
}

List<MatchedScanRow> parseGeminiStandingsJson(
  String rawJsonText,
  List<Team> teams, {
  int maxTeams = 24,
}) {
  final cleanedText = rawJsonText
      .trim()
      .replaceFirst(RegExp(r'^```(?:json)?\s*', caseSensitive: false), '')
      .replaceFirst(RegExp(r'\s*```$'), '')
      .trim();

  dynamic decoded;
  try {
    decoded = jsonDecode(cleanedText);
  } catch (_) {
    throw const GeminiScannerException(
      GeminiErrorCode.parseError,
      'Gemini returned an unreadable response. Please tap Re-Scan.',
    );
  }

  final rawRows = decoded is List
      ? decoded
      : (decoded is Map && decoded['rows'] is List
          ? decoded['rows'] as List
          : const <dynamic>[]);

  final validTeamIds = teams.map((t) => t.id).toSet();
  final converted = <ScannedRankRow>[];

  for (final item in rawRows) {
    if (item is! Map) continue;
    final rankNum = item['rank'];
    final rank = rankNum is num ? rankNum.round() : int.tryParse('$rankNum');
    if (rank == null || rank < 1 || rank > maxTeams) continue;

    final rawPlayers = item['players'] is List
        ? item['players'] as List
        : const <dynamic>[];
    final players = <ScannedPlayerSlot>[];
    for (final p in rawPlayers) {
      if (p is! Map) continue;
      final ign = _cleanExtractedIgn('${p['ign'] ?? ''}');
      final kRaw = p['kills'];
      final kVal = kRaw is num
          ? kRaw.round()
          : (int.tryParse('$kRaw') ?? 0);
      final kills = kVal.clamp(0, 99);
      if (ign.isNotEmpty || kills > 0) {
        players.add(ScannedPlayerSlot(ign: ign, kills: kills));
      }
    }

    final fallbackRaw = item['totalKills'];
    final fallbackVal = fallbackRaw is num
        ? fallbackRaw.round()
        : (int.tryParse('$fallbackRaw') ?? 0);
    final kills = players.isNotEmpty
        ? players.fold<int>(0, (sum, p) => sum + p.kills)
        : fallbackVal.clamp(0, 200);

    final rawPlayerText = players
        .map((p) => '${p.ign} (${p.kills})'.trim())
        .where((s) => s.isNotEmpty)
        .join(' \u00B7 ');
    final plainJoined = players.map((p) => p.ign).join(' ');
    final aiTeamId = item['matchedTeamId'] is String &&
            validTeamIds.contains(item['matchedTeamId'] as String)
        ? item['matchedTeamId'] as String
        : null;

    converted.add(
      ScannedRankRow(
        rank: rank,
        kills: kills,
        rawPlayerText: rawPlayerText.isNotEmpty ? rawPlayerText : plainJoined,
        normalizedTokens: extractIgnTokens(plainJoined),
        confidence: 98,
        isEdgeClipped: item['isBottomClipped'] == true,
        sourceImageIndex: 0,
        players: players,
        aiMatchedTeamId: aiTeamId,
      ),
    );
  }

  final deduplicated = mergeAndDeduplicateScans([converted], maxTeams: maxTeams);
  return matchScannedRowsToTeams(deduplicated, teams);
}

String _inferMimeType(String path, Uint8List bytes) {
  if (bytes.length >= 4 &&
      bytes[0] == 0x89 &&
      bytes[1] == 0x50 &&
      bytes[2] == 0x4E &&
      bytes[3] == 0x47) {
    return 'image/png';
  }
  if (bytes.length >= 2 && bytes[0] == 0xFF && bytes[1] == 0xD8) {
    return 'image/jpeg';
  }
  if (bytes.length >= 12 &&
      bytes[0] == 0x52 &&
      bytes[1] == 0x49 &&
      bytes[8] == 0x57 &&
      bytes[9] == 0x45) {
    return 'image/webp';
  }
  final lower = path.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

Future<Map<String, dynamic>> _fileToInlineImagePart(String path) async {
  final rawBytes = await File(path).readAsBytes();
  final mime = _inferMimeType(path, rawBytes);
  if (rawBytes.length <= 2500000) {
    return {
      'inlineData': {
        'mimeType': mime,
        'data': base64Encode(rawBytes),
      },
    };
  }

  // Downscale oversized > 2.5 MB screenshots cleanly while keeping crisp text
  final codec = await ui.instantiateImageCodec(rawBytes, targetWidth: 1600);
  final frame = await codec.getNextFrame();
  final pngData = await frame.image.toByteData(format: ui.ImageByteFormat.png);
  frame.image.dispose();
  if (pngData == null) {
    return {
      'inlineData': {
        'mimeType': mime,
        'data': base64Encode(rawBytes),
      },
    };
  }
  return {
    'inlineData': {
      'mimeType': 'image/png',
      'data': base64Encode(pngData.buffer.asUint8List()),
    },
  };
}

Future<List<MatchedScanRow>> scanMatchScreenshotsWithGemini({
  required List<String> filePaths,
  required List<Team> teams,
  required String? userEmail,
}) async {
  if (filePaths.isEmpty) return const [];

  final apiKey = await getStoredGeminiApiKey(userEmail);
  if (apiKey.isEmpty) {
    throw const GeminiScannerException(
      GeminiErrorCode.missingApiKey,
      'Add your personal Gemini API key in Home -> User Profile (top-right PFP) before using AI Auto Standings.',
    );
  }

  final imageParts = <Map<String, dynamic>>[];
  for (final p in filePaths.take(3)) {
    imageParts.add(await _fileToInlineImagePart(p));
  }

  final preferredModel = await getStoredGeminiModel(userEmail);
  final modelsToTry = <String>{
    preferredModel,
    ..._kPreferredFlashModels,
  }.toList();
  final maxTeams = math.max(12, teams.length);
  final promptText = _buildFreeFireGeminiPrompt(teams, imageParts.length);

  var sawRateLimit = false;
  var lastErrorMsg = '';

  for (final model in modelsToTry) {
    late final ({int statusCode, String body}) response;
    try {
      response = await _geminiHttpRequest(
        method: 'POST',
        url:
            '$_kGeminiApiBase/models/${Uri.encodeComponent(model)}:generateContent',
        apiKey: apiKey,
        jsonBody: jsonEncode({
          'contents': [
            {
              'parts': [
                ...imageParts,
                {'text': promptText},
              ],
            },
          ],
          'generationConfig': {
            'temperature': 0,
            'responseMimeType': 'application/json',
            'responseSchema': _kGeminiResponseSchema,
          },
        }),
      );
    } catch (_) {
      throw const GeminiScannerException(
        GeminiErrorCode.networkError,
        'Network error while contacting Google Gemini AI. Check your internet connection and retry.',
      );
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final decoded = jsonDecode(response.body);
      String rawText = '';
      if (decoded is Map &&
          decoded['candidates'] is List &&
          (decoded['candidates'] as List).isNotEmpty) {
        final first = (decoded['candidates'] as List).first;
        if (first is Map &&
            first['content'] is Map &&
            first['content']['parts'] is List) {
          rawText = (first['content']['parts'] as List)
              .whereType<Map>()
              .map((pt) => (pt['text'] as String?) ?? '')
              .join();
        }
      }
      if (rawText.trim().isEmpty) {
        throw const GeminiScannerException(
          GeminiErrorCode.parseError,
          'Gemini returned an empty scoreboard response. Try clearer full-screen match screenshots.',
        );
      }
      final matched = parseGeminiStandingsJson(
        rawText,
        teams,
        maxTeams: maxTeams,
      );
      await setStoredGeminiApiKey(
        userEmail: userEmail,
        apiKey: apiKey,
        verifiedModel: model,
      );
      return matched;
    }

    if (response.statusCode == 429) {
      sawRateLimit = true;
      continue;
    }

    String apiMessage = '';
    try {
      final errMap = jsonDecode(response.body);
      if (errMap is Map &&
          errMap['error'] is Map &&
          errMap['error']['message'] is String) {
        apiMessage = errMap['error']['message'] as String;
      }
    } catch (_) {}
    lastErrorMsg = apiMessage;

    if (response.statusCode == 401 ||
        response.statusCode == 403 ||
        (response.statusCode == 400 &&
            RegExp(r'api.?key', caseSensitive: false).hasMatch(apiMessage))) {
      throw const GeminiScannerException(
        GeminiErrorCode.invalidApiKey,
        'Your Gemini API key was rejected by Google AI Studio. Open Home -> User Profile (top-right PFP) to update your API key.',
      );
    }
  }

  if (sawRateLimit) {
    throw const GeminiScannerException(
      GeminiErrorCode.rateLimited,
      'Gemini free-tier rate limit reached. Wait ~30 seconds and tap Re-Scan, or switch to another Google AI Studio API key.',
    );
  }

  throw GeminiScannerException(
    GeminiErrorCode.parseError,
    lastErrorMsg.isNotEmpty
        ? lastErrorMsg
        : 'Gemini AI scan failed. Please try again.',
  );
}
