import 'package:esp_calc_mobile/core/roster_helpers.dart';
import 'package:esp_calc_mobile/models/tournament_models.dart';
import 'package:esp_calc_mobile/services/screenshot_scanner.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Offline Free Fire OCR Normalizer & Deduplicator', () {
    test('normalizes stylish Unicode homoglyphs and spaced letters', () {
      expect(normalizeFreeFireIgn('꧁༺₦Ї₦ℑ₳༻꧂'), 'ninja');
      expect(normalizeFreeFireIgn('V A M P I R E'), 'vampire');
      expect(extractIgnTokens('BD71メ O P P Y'), contains('oppy'));
    });

    test('deduplicates overlapping ranks (#2-#11) across scrolled screenshots',
        () {
      final shot1 = [
        for (int r = 1; r <= 11; r++)
          ScannedRankRow(
            rank: r,
            kills: r == 11 ? 2 : r + 1, // #11 bottom-clipped in shot 1
            rawPlayerText: 'PlayerRank$r',
            normalizedTokens: ['playerrank$r'],
            confidence: 82,
            isEdgeClipped: r == 11,
            sourceImageIndex: 0,
          ),
      ];

      final shot2 = [
        for (int r = 2; r <= 12; r++)
          ScannedRankRow(
            rank: r,
            kills: r == 2
                ? 1
                : (r == 11 ? 9 : r + 1), // #2 top-clipped, #11 full in shot 2
            rawPlayerText: 'PlayerRank$r Full',
            normalizedTokens: ['playerrank$r', 'full'],
            confidence: 85,
            isEdgeClipped: r == 2,
            sourceImageIndex: 1,
          ),
      ];

      final merged = mergeAndDeduplicateScans([shot1, shot2], maxTeams: 12);
      expect(merged.length, 12);
      expect(merged.map((m) => m.rank).toList(),
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      // #2 keeps shot1 unclipped kills (3), #11 upgrades to shot2 unclipped kills (9)
      expect(merged.firstWhere((m) => m.rank == 2).kills, 3);
      expect(merged.firstWhere((m) => m.rank == 11).kills, 9);
      // Overlapping middle rank #5 is NOT summed/doubled (remains 6)
      expect(merged.firstWhere((m) => m.rank == 5).kills, 6);
    });

    test('matches OCR rows to squads via Player 1 IGN and deduces final squad',
        () {
      const teams = [
        Team(id: 't1', name: 'EVOS DIVINE', player1: 'ABIR'),
        Team(id: 't2', name: 'TEAM VAMPIRES', player1: 'OPPY'),
        Team(id: 't3', name: 'BURIRAM UNITED', player1: 'JOJO'),
      ];

      final rows = [
        ScannedRankRow(
          rank: 1,
          kills: 11,
          rawPlayerText: 'BD71 O P P Y',
          normalizedTokens: extractIgnTokens('BD71 O P P Y'),
          confidence: 88,
          isEdgeClipped: false,
          sourceImageIndex: 0,
        ),
        ScannedRankRow(
          rank: 2,
          kills: 7,
          rawPlayerText: 'EVOS A B I R',
          normalizedTokens: extractIgnTokens('EVOS A B I R'),
          confidence: 86,
          isEdgeClipped: false,
          sourceImageIndex: 0,
        ),
        const ScannedRankRow(
          rank: 3,
          kills: 4,
          rawPlayerText: 'UNREADABLE SYMBOLS',
          normalizedTokens: ['unreadablesymbols'],
          confidence: 70,
          isEdgeClipped: false,
          sourceImageIndex: 0,
        ),
      ];

      final matched = matchScannedRowsToTeams(rows, teams);
      expect(matched[0].matchedTeamId, 't2');
      expect(matched[1].matchedTeamId, 't1');
      // Last remaining squad automatically deduced when N-1 of N matched!
      expect(matched[2].matchedTeamId, 't3');
    });
  });

  group('Smart Roster & Stage Helpers', () {
    test('parses WhatsApp/Discord numbered slot lists cleanly', () {
      const raw = '''
Confirmed Squads:
Slot 01 - EVOS DIVINE (Confirmed)
#2: TEAM VAMPIRES | Paid
3. BURIRAM UNITED [Ready]
''';
      expect(
        parseSmartSlotList(raw),
        ['EVOS DIVINE', 'TEAM VAMPIRES', 'BURIRAM UNITED'],
      );
    });

    test('increments Day / Round labels automatically', () {
      expect(incrementStageOrDayLabel('GRAND FINALS - DAY 1'),
          'GRAND FINALS - DAY 2');
      expect(incrementStageOrDayLabel('Round 2'), 'Round 3');
      expect(incrementStageOrDayLabel('FINALS'), 'FINALS - Day 2');
    });
  });
}
