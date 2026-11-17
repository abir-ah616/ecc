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

      // Matches 4th added team member from multi-player list
      final pf = buildSquadPlayerFields(['OPPY', 'SHAKIB', 'ROHAN', 'TAWSIF']);
      expect(pf.players, ['OPPY', 'SHAKIB', 'ROHAN', 'TAWSIF']);
      final multiTeam = [
        Team(
          id: 't4',
          name: 'SQUAD ALPHA',
          player1: pf.player1,
          player2: pf.player2,
          players: pf.players,
        ),
      ];
      final matchedFourth = matchScannedRowsToTeams(
        [
          ScannedRankRow(
            rank: 1,
            kills: 10,
            rawPlayerText: 'BD T A W S I F',
            normalizedTokens: extractIgnTokens('BD T A W S I F'),
            confidence: 90,
            isEdgeClipped: false,
            sourceImageIndex: 0,
          ),
        ],
        multiTeam,
      );
      expect(matchedFourth.first.matchedTeamId, 't4');
    });

    test(
        'matches all 12 real-world Free Fire squads with typos, leet folding, and TM symbols',
        () {
      const userTeams = [
        Team(id: 's1', name: 'VNX', player1: 'VNX.AR4B', player2: 'TVX-REHAN'),
        Team(id: 's2', name: 'EPE', player1: 'EPE.ksndra', player2: 'Svx-ali'),
        Team(
            id: 's3',
            name: 'Squad 3',
            player1: 'Dw spider',
            player2: 'Dw kamrul'),
        Team(id: 's4', name: 'Squad 4', player1: 'Cx hunter'),
        Team(id: 's5', name: 'Squad 5', player1: 'Jh-zihaad', player2: 'Ruhi'),
        Team(
            id: 's6',
            name: 'Squad 6',
            player1: 'Krk-r!f4t10',
            player2: 'Nitroxxx'),
        Team(
            id: 's7',
            name: 'Squad 7',
            player1: 'Bg 1rocket',
            player2: 'Dx crown'),
        Team(
            id: 's8',
            name: 'Squad 8',
            player1: 'Itz habib',
            player2: 'Acxmonster17'),
        Team(
            id: 's9',
            name: 'Squad 9',
            player1: 'Exos.k4kugo!',
            player2: 'Exos.astro'),
        Team(
            id: 's10',
            name: 'Squad 10',
            player1: 'Ems fuse.',
            player2: 'Ems alvi'),
        Team(
            id: 's11',
            name: 'Squad 11',
            player1: 'Nl-flash',
            player2: 'LG siyam'),
        Team(
            id: 's12',
            name: 'Squad 12',
            player1: 'RHK flicker',
            player2: 'Fs-leader'),
      ];

      ScannedRankRow mkRow(int rank, int kills, String raw,
          {bool clipped = false, int src = 0}) {
        return ScannedRankRow(
          rank: rank,
          kills: kills,
          rawPlayerText: raw,
          normalizedTokens: extractIgnTokens(raw),
          confidence: 88,
          isEdgeClipped: clipped,
          sourceImageIndex: src,
        );
      }

      final shot1 = [
        mkRow(1, 16, 'RHK-FILCKER! F5-RICHMANx7 F5-N!LOY.7 F5-LEADER!'),
        mkRow(2, 5, 'NL-Flash. NL-Flash. Lg\u2122Slyam'),
        mkRow(3, 12, 'EMS FUSE. EMS ALVI EMS ALVI'),
        mkRow(4, 15, 'EX05.BAKUG0! EX0SxF4RDIN EXOS.Sanjid! EX05.ASTR0'),
        mkRow(5, 8, 'itz habib ACxMONSTER17 MIRAZ_GX! TRB DEEN'),
        mkRow(6, 9, 'BG 1ROCKET DX CROWN Damn Elop LOUS.RISKY'),
        mkRow(7, 6, "KRK R'E4TI0 NITRO Xxx? Misba SIR DE.TORNADO!"),
        mkRow(8, 12, 'JH-Zihaad ? RUHI JH-REZOAN7 JH-SANY'),
        mkRow(9, 2, 'CX HUNTER CX SP4RK GERD MULLER CX NARUTO'),
        mkRow(10, 3, 'Dw SPIDER Dw KAMRUL MEHW EXL_LEXOx.!'),
        mkRow(11, 0, 'ePE.KSNDRAx1 SVX-SEJ4Nx7!', clipped: true, src: 0),
      ];

      final shot2 = [
        mkRow(8, 12, 'JH-Zihaad ? RUHI JH-REZOAN7 JH-SANY', src: 1),
        mkRow(9, 2, 'CX HUNTER CX SP4RK GERD MULLER CX NARUTO', src: 1),
        mkRow(10, 3, 'Dw SPIDER Dw KAMRUL MEHW EXL_LEXOx.!', src: 1),
        mkRow(11, 0, 'ePE.KSNDRAx1 SVX-SEJ4Nx7! ePE.MAHINx7 SVX-ALI!', src: 1),
        mkRow(12, 0, 'VNX.AR4B! TVX-REHAN TS SAAD', src: 1),
      ];

      final merged = mergeAndDeduplicateScans([shot1, shot2], maxTeams: 12);
      expect(merged.length, 12);
      expect(merged.map((r) => r.kills).toList(),
          [16, 5, 12, 15, 8, 9, 6, 12, 2, 3, 0, 0]);

      final matched = matchScannedRowsToTeams(merged, userTeams);
      expect(
        matched.map((m) => m.matchedTeamId).toList(),
        [
          's12',
          's11',
          's10',
          's9',
          's8',
          's7',
          's6',
          's5',
          's4',
          's3',
          's2',
          's1',
        ],
      );
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
