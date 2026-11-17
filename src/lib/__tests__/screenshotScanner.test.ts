import { describe, expect, it } from 'vitest';
import {
  extractIgnTokens,
  matchScannedRowsToTeams,
  mergeAndDeduplicateScans,
  normalizeFreeFireIgn,
  parseOcrElementsToRows,
} from '../screenshotScanner';
import {
  incrementStageOrDayLabel,
  matchLogoFilenameToSquadIndex,
  parseSmartSlotList,
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
  });
});
