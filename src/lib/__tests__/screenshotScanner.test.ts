import { describe, expect, it } from 'vitest';
import {
  extractIgnTokens,
  matchScannedRowsToTeams,
  mergeAndDeduplicateScans,
  normalizeFreeFireIgn,
  parseOcrElementsToRows,
} from '../screenshotScanner';
import {
  buildSquadPlayerFields,
  incrementStageOrDayLabel,
  matchLogoFilenameToSquadIndex,
  parseSmartSlotList,
  resolveSquadPlayers,
} from '../rosterHelpers';
import type { Team } from '../../types/tournament';

describe('Free Fire Screenshot Scanner & Roster Helpers', () => {
  it('normalizes stylized Free Fire IGNs and homoglyphs cleanly', () => {
    // Superscript BD + Katakana separator + Fullwidth OPPY
    const fancy1 = '\u1D2E\u1D30\u30E1\uFF2F\uFF30\uFF30\uFF39';
    expect(normalizeFreeFireIgn(fancy1)).toBe('bd oppy');
    expect(extractIgnTokens(fancy1)).toContain('oppy');
    expect(extractIgnTokens(fancy1)).toContain('bdoppy');

    // Tibetan ornaments + spaced fullwidth SHAKIB
    const fancy2 = '\u0F3A\u0F12\u0F2C\uFF33 \uFF28 \uFF21 \uFF2B \uFF29 \uFF22\u0F2C\u0F12\u0F3B';
    expect(normalizeFreeFireIgn(fancy2)).toBe('shakib');

    // Cyrillic/Greek lookalikes + Nickfinder currency homoglyphs
    const fancy3 = '\u0422\u0415\u0391\u041C \u041A\u0406LL\u0415R';
    expect(normalizeFreeFireIgn(fancy3)).toBe('team killer');
    expect(normalizeFreeFireIgn('\u0F12\u0F3A\u20A6\u0407\u20A6\u2111\u20B3\u0F3B\u0F12')).toBe('ninja');
  });

  it('deduplicates overlapping ranks (#2-#11) across two scrolled screenshots and matches players', () => {
    const teams: Team[] = [
      { id: 't1', name: 'BDR Esports', player1: 'oppy', player2: 'shakib' },
      { id: 't2', name: 'EVOS Divine', player1: 'abax', player2: 'geday' },
      { id: 't3', name: 'Team Liquid', player1: 'raven' },
    ];

    // Screenshot 1 has Rank #1 (interior) and Rank #2 (bottom scroll-edge clipped, partial kills)
    const shot1 = parseOcrElementsToRows(
      [
        { text: '1', x0: 40, y0: 150, x1: 70, y1: 185, confidence: 92 },
        { text: '\u1D2E\u1D30\u30E1OPPY', x0: 150, y0: 150, x1: 380, y1: 185, confidence: 85 },
        { text: '6', x0: 820, y0: 150, x1: 850, y1: 185, confidence: 94 },
        { text: '5HAK1B', x0: 150, y0: 205, x1: 360, y1: 235, confidence: 82 },
        { text: '5', x0: 820, y0: 205, x1: 850, y1: 235, confidence: 91 },

        // Rank #2 clipped at bottom edge y ~ 955/1000
        { text: '2', x0: 40, y0: 930, x1: 70, y1: 960, confidence: 70 },
        { text: 'EVOS_ABAX', x0: 150, y0: 930, x1: 380, y1: 960, confidence: 72 },
        { text: '3', x0: 820, y0: 930, x1: 850, y1: 960, confidence: 80 },
      ],
      1000,
      1000,
      12,
      0
    );

    // Screenshot 2 scrolled down: Rank #2 is now interior with both players (3 + 4 = 7 kills), plus Rank #3
    const shot2 = parseOcrElementsToRows(
      [
        { text: '2', x0: 40, y0: 220, x1: 70, y1: 255, confidence: 95 },
        { text: 'EVOS_ABAX', x0: 150, y0: 220, x1: 380, y1: 255, confidence: 90 },
        { text: '3', x0: 820, y0: 220, x1: 850, y1: 255, confidence: 95 },
        { text: 'GEDAY99', x0: 150, y0: 270, x1: 360, y1: 300, confidence: 89 },
        { text: '4', x0: 820, y0: 270, x1: 850, y1: 300, confidence: 94 },

        { text: '3', x0: 40, y0: 450, x1: 70, y1: 485, confidence: 93 },
        { text: 'TL_R4VEN', x0: 150, y0: 450, x1: 360, y1: 485, confidence: 88 },
        { text: '2', x0: 820, y0: 450, x1: 850, y1: 485, confidence: 93 },
      ],
      1000,
      1000,
      12,
      1
    );

    const merged = mergeAndDeduplicateScans([shot1, shot2], 12);
    expect(merged).toHaveLength(3);
    // Rank 1 summed 6 + 5 = 11 kills
    expect(merged[0].rank).toBe(1);
    expect(merged[0].kills).toBe(11);
    // Rank 2 took interior Shot 2 (3 + 4 = 7 kills), NOT 3 + 7 = 10 double-counted!
    expect(merged[1].rank).toBe(2);
    expect(merged[1].kills).toBe(7);
    expect(merged[2].rank).toBe(3);
    expect(merged[2].kills).toBe(2);

    const matched = matchScannedRowsToTeams(merged, teams);
    expect(matched[0].matchedTeamId).toBe('t1');
    expect(matched[1].matchedTeamId).toBe('t2');
    expect(matched[2].matchedTeamId).toBe('t3');
  });

  it('cleans WhatsApp slot lists, increments Day labels, and matches logo filenames', () => {
    const pasted = parseSmartSlotList(
      'SLOT LIST:\nSlot 01 - BDR Esports | Confirmed\n#2. EVOS Divine (Paid)\n03) Team Liquid - Ready'
    );
    expect(pasted).toEqual(['BDR Esports', 'EVOS Divine', 'Team Liquid']);

    expect(incrementStageOrDayLabel('Grand Finals - Day 1')).toBe(
      'Grand Finals - Day 2'
    );
    expect(incrementStageOrDayLabel('Scrim Series')).toBe(
      'Scrim Series - Day 2'
    );

    const used = new Set<number>();
    const idx = matchLogoFilenameToSquadIndex(
      'evos_divine.png',
      ['BDR Esports', 'EVOS Divine', 'Team Liquid'],
      used
    );
    expect(idx).toBe(1);

    // Multi-member squad IGN matching (3rd/4th added team member)
    const pf = buildSquadPlayerFields(['OPPY', 'SHAKIB', 'ROHAN', 'TAWSIF']);
    expect(pf.players).toEqual(['OPPY', 'SHAKIB', 'ROHAN', 'TAWSIF']);
    expect(resolveSquadPlayers(pf)).toHaveLength(4);
    const matchedMulti = matchScannedRowsToTeams(
      [
        {
          rank: 1,
          kills: 8,
          rawPlayerText: 'BD T A W S I F',
          normalizedTokens: extractIgnTokens('BD T A W S I F'),
          confidence: 90,
          isEdgeClipped: false,
          sourceImageIndex: 0,
        },
      ],
      [{ id: 'sq1', name: 'Squad Alpha', ...pf }]
    );
    expect(matchedMulti[0].matchedTeamId).toBe('sq1');
  });

  it('matches all 12 real-world Free Fire squads with organizer typos, leet folding, and scrolled deduplication', () => {
    const userTeams: Team[] = [
      { id: 's1', name: 'VNX', player1: 'VNX.AR4B', player2: 'TVX-REHAN' },
      { id: 's2', name: 'EPE', player1: 'EPE.ksndra', player2: 'Svx-ali' },
      { id: 's3', name: 'Squad 3', player1: 'Dw spider', player2: 'Dw kamrul' },
      { id: 's4', name: 'Squad 4', player1: 'Cx hunter' },
      { id: 's5', name: 'Squad 5', player1: 'Jh-zihaad', player2: 'Ruhi' },
      { id: 's6', name: 'Squad 6', player1: 'Krk-r!f4t10', player2: 'Nitroxxx' },
      { id: 's7', name: 'Squad 7', player1: 'Bg 1rocket', player2: 'Dx crown' },
      { id: 's8', name: 'Squad 8', player1: 'Itz habib', player2: 'Acxmonster17' },
      { id: 's9', name: 'Squad 9', player1: 'Exos.k4kugo!', player2: 'Exos.astro' },
      { id: 's10', name: 'Squad 10', player1: 'Ems fuse.', player2: 'Ems alvi' },
      { id: 's11', name: 'Squad 11', player1: 'Nl-flash', player2: 'LG siyam' },
      { id: 's12', name: 'Squad 12', player1: 'RHK flicker', player2: 'Fs-leader' },
    ];

    const mkRow = (
      rank: number,
      kills: number,
      rawPlayerText: string,
      isEdgeClipped = false,
      sourceImageIndex = 0
    ) => ({
      rank,
      kills,
      rawPlayerText,
      normalizedTokens: extractIgnTokens(rawPlayerText),
      confidence: 88,
      isEdgeClipped,
      sourceImageIndex,
    });

    // Shot 1: #1-#5 on left, #6-#11 on right (#11 bottom-clipped)
    const shot1 = [
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
      mkRow(11, 0, 'ePE.KSNDRAx1 SVX-SEJ4Nx7!', true, 0),
    ];

    // Shot 2: #1-#5 on left, scrolled #8-#12 on right (#11 now full interior)
    const shot2 = [
      mkRow(1, 16, 'RHK-FILCKER! F5-RICHMANx7 F5-N!LOY.7 F5-LEADER!', false, 1),
      mkRow(2, 5, 'NL-Flash. NL-Flash. Lg\u2122Slyam', false, 1),
      mkRow(3, 12, 'EMS FUSE. EMS ALVI EMS ALVI', false, 1),
      mkRow(4, 15, 'EX05.BAKUG0! EX0SxF4RDIN EXOS.Sanjid! EX05.ASTR0', false, 1),
      mkRow(5, 8, 'itz habib ACxMONSTER17 MIRAZ_GX! TRB DEEN', false, 1),
      mkRow(8, 12, 'JH-Zihaad ? RUHI JH-REZOAN7 JH-SANY', false, 1),
      mkRow(9, 2, 'CX HUNTER CX SP4RK GERD MULLER CX NARUTO', false, 1),
      mkRow(10, 3, 'Dw SPIDER Dw KAMRUL MEHW EXL_LEXOx.!', false, 1),
      mkRow(11, 0, 'ePE.KSNDRAx1 SVX-SEJ4Nx7! ePE.MAHINx7 SVX-ALI!', false, 1),
      mkRow(12, 0, 'VNX.AR4B! TVX-REHAN TS SAAD', false, 1),
    ];

    const merged = mergeAndDeduplicateScans([shot1, shot2], 12);
    expect(merged).toHaveLength(12);
    expect(merged.map((r) => r.kills)).toEqual([16, 5, 12, 15, 8, 9, 6, 12, 2, 3, 0, 0]);

    const matched = matchScannedRowsToTeams(merged, userTeams);
    expect(matched.map((m) => m.matchedTeamId)).toEqual([
      's12', // #1 Squad 12
      's11', // #2 Squad 11
      's10', // #3 Squad 10
      's9',  // #4 Squad 9
      's8',  // #5 Squad 8
      's7',  // #6 Squad 7
      's6',  // #7 Squad 6
      's5',  // #8 Squad 5
      's4',  // #9 Squad 4
      's3',  // #10 Squad 3
      's2',  // #11 EPE
      's1',  // #12 VNX
    ]);
  });
});
