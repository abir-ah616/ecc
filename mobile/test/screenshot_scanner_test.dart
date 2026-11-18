import 'dart:typed_data';
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

    test(
        'matches inline ! as I, @ as A, 4 as A, omitted -/. separators, and 12/12 single-player stylized squads',
        () {
      expect(ocrFuzzySimilarity('SBR M!TUN', 'sbrmitun'), 1.0);
      expect(ocrFuzzySimilarity('FG~N@B!\u0141', 'fgnabil'), 1.0);
      expect(ocrFuzzySimilarity('UFX.SOH4N', 'ufxsohan'), 1.0);
      expect(ocrFuzzySimilarity('KRK-R!F4T10', 'krkrifatio'), 1.0);
      expect(ocrFuzzySimilarity('F6-066YMT!', 'fgoggym7'), 1.0);
      expect(ocrFuzzySimilarity('FLAME-ADROO?', 'Flame adro07'), 1.0);
      expect(ocrFuzzySimilarity('FLAME-ADROO7', 'Flame adro07'), 1.0);
      expect(ocrFuzzySimilarity('FLAME ADROCT', 'Flame adro07'),
          greaterThan(0.92));

      ScannedRankRow mk(int rank, int kills, String raw,
          {bool clipped = false, int src = 0}) {
        return ScannedRankRow(
          rank: rank,
          kills: kills,
          rawPlayerText: raw,
          normalizedTokens: extractIgnTokens(raw),
          confidence: 90,
          isEdgeClipped: clipped,
          sourceImageIndex: src,
        );
      }

      final shotScrolled = [
        mk(1, 12, 'RQ ARMAN RQ ALOM BOD Xin/FHAD RQ JARIF YT'),
        mk(2, 10, 'F6-066YMT! F6-ZEONAN! Fo- NOB F&-PETRO!!'),
        mk(3, 9, 'NHT Rive! T~ MTSHIHAB NHT-FovsalL NHT-mMAsUM T'),
        mk(4, 12, 'UFX.SHOOTER LB OMOR UFX.SOH4N UFX.ANAZ!'),
        mk(5, 9, 'FLAME -RYXER FLAME-OPPY ! RR-HELLCAT FLAME -ADROO7'),
        mk(7, 10, 'X-7 APON ns SAHADAT.', clipped: true),
        mk(8, 7, '(Raja)8 "bak: WRF RIPPY 11 RQ BENSON wl Electro'),
        mk(9, 4, 'ORK ("Famine N- FREASH NOaa 7d8dcB2t ndF T+BAPPYx4'),
        mk(10, 1, 'BU HAMID FF WR FOREVER SBR MITUN FF Ks RUDRO FF'),
        mk(11, 4, "HXF SANVI af KAYUM & 'S.P SIYAM & ns 'HXF SUU"),
        mk(12, 4, 'RHK-RAHAT!! ns HR-BLAST HR-FAHIM F ns HR-BLAZE A'),
      ];

      final shotTop = [
        mk(1, 12, 'RQ ARMAN !! RQ ALOM BD Xin/FHAD RQ JARIF YT', src: 1),
        mk(2, 10, "F6-066YMT! F6 ZEONAN! Fo-NOR't F&-PETRO!", src: 1),
        mk(3, 9, 'NHT River! I~ WI.SHIHALI NHT FovsaL NHT-mMAsSUM T~', src: 1),
        mk(4, 12, 'UFX.SHOOTER LB OMOR UFX.SOH4N UFXCANAZ!', src: 1),
        mk(5, 9, 'FLAME -RYXER FLAME-OPPY ! RR-HELLCAT FLAME-ADROO?', src: 1),
        mk(6, 5, 'JB-MOWAJNO+ BPX TUGRIL! RAD s FLASH~= PX s CLUTCH!', src: 1),
        mk(7, 15, 'DEADLY GAME BX Evie |! X-7 APON ns SAHADAT.', src: 1),
        mk(8, 7, '(Raja )& "bai: WRF RIPPY 11 RQ BENSON w0 Electro', src: 1),
        mk(9, 4, 'OR (anime & N= FREASH NOaa7d8dcB2! ndFT=BAPPY24', src: 1),
        mk(10, 1, 'BU HAMID FF WR FOREVER SBR MTUN FF KS RUDRO FF', src: 1),
        mk(11, 1, 'HXF SANVI WP KAYUM', clipped: true, src: 1),
      ];

      const singlePlayerTeams = [
        Team(id: 'T1', name: 'Squad 1', player1: 'Xin fihad'),
        Team(id: 'T2', name: 'Squad 2', player1: 'Fg nabil'),
        Team(id: 'T3', name: 'Squad 3', player1: 'Nht rafi'),
        Team(id: 'T4', name: 'Squad 4', player1: 'Ufx sohan'),
        Team(id: 'T5', name: 'Squad 5', player1: 'Flame adro07'),
        Team(id: 'T6', name: 'Squad 6', player1: 'Jb mowaji10'),
        Team(id: 'T7', name: 'Squad 7', player1: 'Deadly gamer'),
        Team(id: 'T8', name: 'Squad 8', player1: 'Raja bai'),
        Team(id: 'T9', name: 'Squad 9', player1: 'Drk fahim'),
        Team(id: 'T10', name: 'Squad 10', player1: 'Sbr mitun'),
        Team(id: 'T11', name: 'Squad 11', player1: 'Sap kayum'),
        Team(id: 'T12', name: 'Squad 12', player1: 'Hr blaze'),
      ];

      final merged =
          mergeAndDeduplicateScans([shotScrolled, shotTop], maxTeams: 12);
      expect(merged.map((r) => r.kills).toList(),
          [12, 10, 9, 12, 9, 5, 15, 7, 4, 1, 4, 4]);

      final matched = matchScannedRowsToTeams(merged, singlePlayerTeams);
      expect(
        matched.map((m) => m.matchedTeamId).toList(),
        [
          'T1',
          'T2',
          'T3',
          'T4',
          'T5',
          'T6',
          'T7',
          'T8',
          'T9',
          'T10',
          'T11',
          'T12',
        ],
      );
    });

    test(
        'achieves 100% (384/384) across Player #1-#4 single-name slots x 4 variants on both lobbies',
        () {
      ScannedRankRow mk(int rank, String raw) => ScannedRankRow(
            rank: rank,
            kills: 5,
            rawPlayerText: raw,
            normalizedTokens: extractIgnTokens(raw),
            confidence: 90,
            isEdgeClipped: false,
            sourceImageIndex: 0,
          );

      final lobby2Merged = [
        mk(1, 'RQ ARMAN !! RQ ALOM BD Xin/FHAD RQ JARIF YT'),
        mk(2, "F6-066YMT! F6-ZEONAN! Fo- NOB F&-PETRO!! | Fo-NOR't"),
        mk(3, 'NHT Rive! T~ MTSHIHAB NHT-FovsalL NHT-mMAsUM T'),
        mk(4, 'UFX.SHOOTER LB OMOR UFX.SOH4N UFX.ANAZ!'),
        mk(5, 'FLAME -RYXER FLAME-OPPY ! RR-HELLCAT FLAME -ADROO7'),
        mk(6, 'JB-MBWAJNO+ WX TUGRIL! R40 s FLASH~ WPXs CLUTCH!'),
        mk(7, 'DEADLY GAME BX Evie |! X-7 APON ns SAHADAT.'),
        mk(8, '(Raja )& "bai: WRF RIPPY 11 RQ BENSON w0 Electro'),
        mk(9, 'ORK ("Famine N- FREASH NOaa 7d8dcB2t ndF T+BAPPYx4'),
        mk(10, 'BU HAMID FF WR FOREVER SBR MITUN FF Ks RUDRO FF'),
        mk(11, "HXF SANVI af KAYUM & 'S.P SIYAM & ns 'HXF SUU"),
        mk(12, 'RHK-RAHAT!! ns HR-BLAST HR-FAHIM F ns HR-BLAZE A'),
      ];

      const lobby2Matrix = [
        [
          ['RQ ARMAN !!', 'rq arman', 'rqarman', 'arman'],
          ['RQ ALOM_BD', 'rq alom bd', 'rqalombd', 'alom bd'],
          ['XIN/FIHAD', 'xin fihad', 'xinfihad', 'fihad'],
          ['RQ JARIF YT', 'rq jarif yt', 'rqjarifyt', 'jarif'],
        ],
        [
          ['FG-OGGYM7!', 'fg oggym7', 'fgoggym7', 'oggym7'],
          ['FG-ZEONAN!', 'fg zeonan', 'fgzeonan', 'zeonan'],
          ['FG~N@B!L', 'fg nabil', 'fgnabil', 'nabil'],
          ['FG-PETRO!!', 'fg petro', 'fgpetro', 'petro'],
        ],
        [
          ['NHT-RAFI!!', 'nht rafi', 'nhtrafi', 'rafi'],
          ['NHT-SHIHAB', 'nht shihab', 'nhtshihab', 'shihab'],
          ['NHT-FOYSAL', 'nht foysal', 'nhtfoysal', 'foysal'],
          ['NHT-MASUM', 'nht masum', 'nhtmasum', 'masum'],
        ],
        [
          ['UFX.SHOOTER', 'ufx shooter', 'ufxshooter', 'shooter'],
          ['LB OMOR', 'lb omor', 'lbomor', 'omor'],
          ['UFX.SOH4N', 'ufx sohan', 'ufxsohan', 'sohan'],
          ['UFX.ANAZ!', 'ufx anaz', 'ufxanaz', 'anaz'],
        ],
        [
          ['FLAME-RYKER', 'flame ryker', 'flameryker', 'ryker'],
          ['FLAME-OPPY !', 'flame oppy', 'flameoppy', 'oppy'],
          ['RR-HELLCAT', 'rr hellcat', 'rrhellcat', 'hellcat'],
          ['FLAME-ADRO07', 'flame adroo7', 'flameadro07', 'adro07'],
        ],
        [
          ['JB-MOWAJ!10', 'jb mowaji10', 'jbmowaj10', 'mowaj10'],
          ['BPX-TUGRIL!', 'bpx tugril', 'bpxtugril', 'tugril'],
          ['R4D-FLASH', 'rad flash', 'radflash', 'r4dflash'],
          ['BPX-CLUTCH!!', 'bpx clutch', 'bpxclutch', 'clutch'],
        ],
        [
          ['DEADLY GAMER', 'deadly gamer', 'deadlygamer', 'deadly'],
          ['JBX EVIL', 'jbx evil', 'jbxevil', 'evil'],
          ['X-7 APON', 'x7 apon', 'x7apon', 'apon'],
          ['SAHADAT.', 'sahadat', 'sahadat', 'sahadat'],
        ],
        [
          ['(Raja)&*bai:', 'raja bai', 'rajabai', 'raja'],
          ['WRF-RIPPY !!', 'wrf rippy', 'wrfrippy', 'rippy'],
          ['RQ BENSON', 'rq benson', 'rqbenson', 'benson'],
          ['RQ ELECTRO', 'rq electro', 'rqelectro', 'electro'],
        ],
        [
          ['DRK-FAHIM', 'drk fahim', 'drkfahim', 'fahim'],
          ['XN~FREASH', 'xn freash', 'xnfreash', 'freash'],
          ['NOaa7d8dc82f', 'noaa7d8dc82f', 'noaa7d8dc82f', '7d8dc82f'],
          ['JFT+BAPPYx4', 'jft bappyx4', 'jftbappy', 'bappy'],
        ],
        [
          ['BU HAMID FF', 'bu hamid ff', 'buhamidff', 'hamid'],
          ['DR FOREVER', 'dr forever', 'drforever', 'forever'],
          ['SBR M!TUN FF', 'sbr mitun ff', 'sbrmitun', 'mitun'],
          ['KS RUDRO FF', 'ks rudro ff', 'ksrudroff', 'rudro'],
        ],
        [
          ['HXF SANVI', 'hxf sanvi', 'hxfsanvi', 'sanvi'],
          ['S4P KAYUM', 'sap kayum', 'sapkayum', 'kayum'],
          ['S4P SIYAM', 'sap siyam', 'sapsiyam', 'siyam'],
          ['!HXF SUU', 'hxf suu', 'hxfsuu', 'suu'],
        ],
        [
          ['RHK-RAHAT!!', 'rhk rahat', 'rhkrahat', 'rahat'],
          ['HR-BL4ST', 'hr blast', 'hrblast', 'blast'],
          ['HR-FAHIM_F', 'hr fahim f', 'hrfahimf', 'hr fahim'],
          ['HR-BL4ZE_A', 'hr blaze a', 'hrblazea', 'blaze'],
        ],
      ];

      const perm = [7, 2, 11, 0, 9, 4, 1, 10, 5, 8, 3, 6];
      for (int slot = 0; slot < 4; slot++) {
        for (int v = 0; v < 4; v++) {
          final scrambled = [
            for (int idx = 0; idx < 12; idx++)
              Team(
                id: 'T${perm[idx] + 1}',
                name: 'Squad ${idx + 1}',
                player1: lobby2Matrix[perm[idx]][slot][v],
              ),
          ];
          final res = matchScannedRowsToTeams(lobby2Merged, scrambled);
          expect(
            res.map((r) => r.matchedTeamId).toList(),
            [
              'T1',
              'T2',
              'T3',
              'T4',
              'T5',
              'T6',
              'T7',
              'T8',
              'T9',
              'T10',
              'T11',
              'T12',
            ],
          );
        }
      }
    });

    test('folds circled Latin Nickfinder IGNs and matches single-screenshot #1-#11 (11 rows vs 12 teams) at 100%', () {
      expect(
        normalizeFreeFireIgn('M\u0280\u20DD\u24B6\u24C0\u24B6\u24C8\u24BD..'),
        'mr akash',
      );
      expect(normalizeFreeFireIgn('J\u00DF\u20DDSDIPTO'), 'jb sdipto');
      expect(normalizeFreeFireIgn('\u0110ARKJ\u0244NAYED'), 'darkjunayed');
      expect(extractIgnTokens('nsINS LUFI !'), contains('lufi'));

      ScannedRankRow mk(int rank, String raw) => ScannedRankRow(
            rank: rank,
            kills: 4,
            rawPlayerText: raw,
            normalizedTokens: extractIgnTokens(raw),
            confidence: 90,
            isEdgeClipped: rank == 11,
            sourceImageIndex: 0,
          );

      final matchBSingleShot = [
        mk(1, 'UL-CHIEF SHANTO i;! MYRA ! X9 TUFANx'),
        mk(2, 'RATU VAI ZENITSU DARKJUNAYEE -SoHaG !!'),
        mk(3, 'TJ SOWRAV.. TJ ARAFAT TJ.HAMJA TJ.ABRAR'),
        mk(4, 'LHE SOURAV [GM] FARHAD -LHE MAHADI LHE HASAN'),
        mk(5, 'WIZ-CHEETAH7 MaLEK BHAI MAMUN 69x!. CX-MIMOSA!'),
        mk(6, 'MUKUL GAMIN nsRAYHAN 777. TERBIUM FF nsSENZYY X'),
        mk(7, 'LAB x WETRI nsLAB xSKYSHO1 LAB x NAYE nsCX-PSYCHO!!'),
        mk(8, 'XTZ WOLF nsXTZ STORM superSPAX nsNRX AETHER'),
        mk(9, 'RXE-RIFAT9x nsRXE-N!4MUL! RXE-RASHED nsRXE-VIPER>9'),
        mk(10, 'UFX-ZATRAY nsUFX-BANLEX UFX-TORN4DO nsF1C.Aimlock1'),
        mk(11, 'PXG ZYROXx nsPXG ZENTIXx'),
      ];

      const matchBMatrix = [
        [
          ['UL-CHIEF', 'ul chief', 'ulchief', 'chief'],
          ['SHANTO', 'shanto', 'shanto', 'shanto'],
          ['MYRA !', 'myra', 'myra', 'myra'],
          ['X9 TUFANx', 'x9 tufan', 'x9tufan', 'tufan'],
        ],
        [
          ['RATU VAI', 'ratu vai', 'ratuvai', 'ratu'],
          ['ZENITSU', 'zenitsu', 'zenitsu', 'zenitsu'],
          ['\u0110ARKJ\u0244NAYED', 'darkjunayed', 'dark junayed', 'junayed'],
          ['SOHAG !!', 'sohag', 'sohag', 'sohag'],
        ],
        [
          ['TJ SOWRAV..', 'tj sowrav', 'tjsowrav', 'sowrav'],
          ['TJ ARAFAT', 'tj arafat', 'tjarafat', 'arafat'],
          ['TJ.HAMJA', 'tj hamja', 'tjhamja', 'hamja'],
          ['TJ.ABRAR', 'tj abrar', 'tjabrar', 'abrar'],
        ],
        [
          ['LHE SOURAV', 'lhe sourav', 'lhesourav', 'sourav'],
          ['GM FARHAD', 'gm farhad', 'gmfarhad', 'farhad'],
          ['LHE MAHADI', 'lhe mahadi', 'lhemahadi', 'mahadi'],
          ['LHE HASAN', 'lhe hasan', 'lhehasan', 'hasan'],
        ],
        [
          ['WIZ-CHEETAH7', 'wiz cheetah7', 'wizcheetah', 'cheetah'],
          ['MALEK BHAI', 'malek bhai', 'malekbhai', 'malek'],
          ['MAMUN 69x!.', 'mamun 69x', 'mamun69x', 'mamun'],
          ['CX-MIMOSA!', 'cx mimosa', 'cxmimosa', 'mimosa'],
        ],
        [
          ['MUKUL GAMING', 'mukul gaming', 'mukulgaming', 'mukul'],
          ['RAYHAN 777.', 'rayhan 777', 'rayhan777', 'rayhan'],
          ['TERBIUM FF', 'terbium ff', 'terbiumff', 'terbium'],
          ['SENZYY X', 'senzyy x', 'senzyyx', 'senzyy'],
        ],
        [
          ['LAB x WETRI', 'lab wetri', 'labxwetri', 'wetri'],
          ['LAB xSKYSHOT', 'lab skyshot', 'labxskyshot', 'skyshot'],
          ['LAB x NAYEM', 'lab nayem', 'labxnayem', 'nayem'],
          ['CX-PSYCHO!!', 'cx psycho', 'cxpsycho', 'psycho'],
        ],
        [
          ['XTZ WOLF', 'xtz wolf', 'xtzwolf', 'wolf'],
          ['XTZ STORM', 'xtz storm', 'xtzstorm', 'storm'],
          ['superSPAX', 'superspax', 'super spax', 'spax'],
          ['NRX AETHER', 'nrx aether', 'nrxaether', 'aether'],
        ],
        [
          ['RXE-R!FAT9x', 'rxe rifat9x', 'rxerifat', 'rifat'],
          ['RXE-N!4MUL!', 'rxe niamul', 'rxen4mul', 'niamul'],
          ['RXE-RASHED', 'rxe rashed', 'rxerashed', 'rashed'],
          ['RXE-VIPER>9', 'rxe viper 9', 'rxeviper', 'viper'],
        ],
        [
          ['UFX-ZATRAY', 'ufx zatray', 'ufxzatray', 'zatray'],
          ['UFX-BANLEX', 'ufx banlex', 'ufxbanlex', 'banlex'],
          ['UFX-TORN4DO', 'ufx tornado', 'ufxtorn4do', 'tornado'],
          ['F1C.Aimlock1', 'f1c aimlock1', 'f1caimlock', 'aimlock'],
        ],
        [
          ['PXG ZYROXx', 'pxg zyroxx', 'pxgzyrox', 'zyrox'],
          ['PXG ZENTIXx', 'pxg zentixx', 'pxgzentix', 'zentix'],
          ['PXG ZYROXx', 'pxg zyroxx', 'pxgzyrox', 'zyrox'],
          ['PXG ZENTIXx', 'pxg zentixx', 'pxgzentix', 'zentix'],
        ],
        [
          ['VNX.AR4B', 'vnx arab', 'vnxar4b', 'arab'],
          ['TVX-REHAN', 'tvx rehan', 'tvxrehan', 'rehan'],
          ['TS SAAD', 'ts saad', 'tssaad', 'saad'],
          ['VNX.AR4B', 'vnx arab', 'vnxar4b', 'arab'],
        ],
      ];

      const perm = [7, 2, 11, 0, 9, 4, 1, 10, 5, 8, 3, 6];
      for (int slot = 0; slot < 4; slot++) {
        for (int v = 0; v < 4; v++) {
          final scrambled = [
            for (int idx = 0; idx < 12; idx++)
              Team(
                id: 'T${perm[idx] + 1}',
                name: 'Squad ${idx + 1}',
                player1: matchBMatrix[perm[idx]][slot][v],
              ),
          ];
          final res = matchScannedRowsToTeams(matchBSingleShot, scrambled);
          expect(
            res.map((r) => r.matchedTeamId).toList(),
            [
              'T1',
              'T2',
              'T3',
              'T4',
              'T5',
              'T6',
              'T7',
              'T8',
              'T9',
              'T10',
              'T11',
            ],
          );
        }
      }
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

    test('classifies single digits 0-9, 2-digit kills (16), and rank badges (12) with embedded Int8 CNN', () {
      const glyphs = <int, List<String>>{
        0: ['.#####.', '##...##', '##...##', '##...##', '##...##', '##...##', '##...##', '##...##', '##...##', '##...##', '##...##', '.#####.'],
        1: ['..###..', '.####..', '#####..', '..###..', '..###..', '..###..', '..###..', '..###..', '..###..', '..###..', '..###..', '..###..'],
        2: ['.#####.', '##...##', '.....##', '.....##', '....##.', '...##..', '..##...', '.##....', '##.....', '##.....', '#######', '#######'],
        3: ['.#####.', '##...##', '.....##', '....##.', '..####.', '....##.', '.....##', '.....##', '.....##', '##...##', '.#####.', '..###..'],
        4: ['....##.', '...###.', '..####.', '.##.##.', '##..##.', '##..##.', '#######', '#######', '....##.', '....##.', '....##.', '....##.'],
        5: ['#######', '##.....', '##.....', '##.....', '######.', '.....##', '.....##', '.....##', '.....##', '##...##', '.#####.', '..###..'],
        6: ['..####.', '.##....', '##.....', '##.....', '######.', '##...##', '##...##', '##...##', '##...##', '##...##', '.#####.', '..###..'],
        7: ['#######', '#######', '.....##', '....##.', '....##.', '...##..', '...##..', '..##...', '..##...', '.##....', '.##....', '.##....'],
        8: ['.#####.', '##...##', '##...##', '##...##', '.#####.', '.#####.', '##...##', '##...##', '##...##', '##...##', '.#####.', '..###..'],
        9: ['.#####.', '##...##', '##...##', '##...##', '##...##', '.######', '.....##', '.....##', '....##.', '...##..', '..##...', '.##....'],
      };

      ({Uint8List rgba, int w, int h}) drawCell(
        String numStr,
        List<int> bgRgb,
        List<int> fgRgb,
      ) {
        const w = 28;
        const h = 22;
        final rgba = Uint8List(w * h * 4);
        for (int i = 0; i < w * h; i++) {
          rgba[i * 4] = bgRgb[0];
          rgba[i * 4 + 1] = bgRgb[1];
          rgba[i * 4 + 2] = bgRgb[2];
          rgba[i * 4 + 3] = 255;
        }
        var cursorX = 3;
        for (final code in numStr.codeUnits) {
          final g = glyphs[code - 48]!;
          for (int y = 0; y < 12; y++) {
            for (int x = 0; x < g[y].length; x++) {
              if (g[y].codeUnitAt(x) == 0x23) {
                final idx = ((5 + y) * w + (cursorX + x)) * 4;
                rgba[idx] = fgRgb[0];
                rgba[idx + 1] = fgRgb[1];
                rgba[idx + 2] = fgRgb[2];
              }
            }
          }
          cursorX += 9;
        }
        return (rgba: rgba, w: w, h: h);
      }

      for (int d = 0; d <= 9; d++) {
        final gold = drawCell('$d', const [96, 72, 16], const [248, 202, 24]);
        expect(
          readRgbaCellNumber(gold.rgba, gold.w, gold.h, 0, 0, gold.w, gold.h, yellowMode: true),
          d,
        );
      }

      final twoDigit11 = drawCell('11', const [92, 68, 14], const [248, 202, 24]);
      expect(
        readRgbaCellNumber(twoDigit11.rgba, twoDigit11.w, twoDigit11.h, 0, 0, twoDigit11.w, twoDigit11.h, yellowMode: true),
        11,
      );

      final twoDigit16 = drawCell('16', const [92, 68, 14], const [248, 202, 24]);
      expect(
        readRgbaCellNumber(twoDigit16.rgba, twoDigit16.w, twoDigit16.h, 0, 0, twoDigit16.w, twoDigit16.h, yellowMode: true),
        16,
      );

      final rank12 = drawCell('12', const [18, 19, 22], const [242, 244, 248]);
      expect(
        readRgbaCellNumber(rank12.rgba, rank12.w, rank12.h, 0, 0, rank12.w, rank12.h, yellowMode: false),
        12,
      );
      expect(normalizeFreeFireIgn('EXV-NOBETA\u277B\u277E'), 'exv nobeta69');
    });
  });
}
