import { describe, expect, it } from 'vitest';
import {
  extractIgnTokens,
  matchScannedRowsToTeams,
  mergeAndDeduplicateScans,
  normalizeFreeFireIgn,
  ocrFuzzySimilarity,
  parseOcrElementsToRows,
  readRgbaCellNumber,
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

  it('matches inline ! as I, @ as A, 4 as A, omitted - / . separators, and 12/12 single-player stylized squads', () => {
    expect(ocrFuzzySimilarity('SBR M!TUN', 'sbrmitun')).toBe(1);
    expect(ocrFuzzySimilarity('FG~N@B!\u0141', 'fgnabil')).toBe(1);
    expect(ocrFuzzySimilarity('UFX.SOH4N', 'ufxsohan')).toBe(1);
    expect(ocrFuzzySimilarity('KRK-R!F4T10', 'krkrifatio')).toBe(1);
    expect(ocrFuzzySimilarity('F6-066YMT!', 'fgoggym7')).toBe(1);
    expect(ocrFuzzySimilarity('FLAME-ADROO?', 'Flame adro07')).toBe(1);
    expect(ocrFuzzySimilarity('FLAME-ADROO7', 'Flame adro07')).toBe(1);
    expect(ocrFuzzySimilarity('FLAME ADROCT', 'Flame adro07')).toBeGreaterThan(0.92);

    const mk = (rank: number, kills: number, raw: string, clipped = false, src = 0) => ({
      rank,
      kills,
      rawPlayerText: raw,
      normalizedTokens: extractIgnTokens(raw),
      confidence: 90,
      isEdgeClipped: clipped,
      sourceImageIndex: src,
    });

    const shotScrolled = [
      mk(1, 12, 'RQ ARMAN RQ ALOM BOD Xin/FHAD RQ JARIF YT', false, 0),
      mk(2, 10, 'F6-066YMT! F6-ZEONAN! Fo- NOB F&-PETRO!!', false, 0),
      mk(3, 9, 'NHT Rive! T~ MTSHIHAB NHT-FovsalL NHT-mMAsUM T', false, 0),
      mk(4, 12, 'UFX.SHOOTER LB OMOR UFX.SOH4N UFX.ANAZ!', false, 0),
      mk(5, 9, 'FLAME -RYXER FLAME-OPPY ! RR-HELLCAT FLAME -ADROO7', false, 0),
      mk(7, 10, 'X-7 APON ns SAHADAT.', true, 0),
      mk(8, 7, '(Raja)8 "bak: WRF RIPPY 11 RQ BENSON wl Electro', false, 0),
      mk(9, 4, 'ORK ("Famine N- FREASH NOaa 7d8dcB2t ndF T+BAPPYx4', false, 0),
      mk(10, 1, 'BU HAMID FF WR FOREVER SBR MITUN FF Ks RUDRO FF', false, 0),
      mk(11, 4, "HXF SANVI af KAYUM & 'S.P SIYAM & ns 'HXF SUU", false, 0),
      mk(12, 4, 'RHK-RAHAT!! ns HR-BLAST HR-FAHIM F ns HR-BLAZE A', false, 0),
    ];

    const shotTop = [
      mk(1, 12, 'RQ ARMAN !! RQ ALOM BD Xin/FHAD RQ JARIF YT', false, 1),
      mk(2, 10, "F6-066YMT! F6 ZEONAN! Fo-NOR't F&-PETRO!", false, 1),
      mk(3, 9, 'NHT River! I~ WI.SHIHALI NHT FovsaL NHT-mMAsSUM T~', false, 1),
      mk(4, 12, 'UFX.SHOOTER LB OMOR UFX.SOH4N UFXCANAZ!', false, 1),
      mk(5, 9, 'FLAME -RYXER FLAME-OPPY ! RR-HELLCAT FLAME-ADROO?', false, 1),
      mk(6, 5, 'JB-MOWAJNO+ BPX TUGRIL! RAD s FLASH~= PX s CLUTCH!', false, 1),
      mk(7, 15, 'DEADLY GAME BX Evie |! X-7 APON ns SAHADAT.', false, 1),
      mk(8, 7, '(Raja )& "bai: WRF RIPPY 11 RQ BENSON w0 Electro', false, 1),
      mk(9, 4, 'OR (anime & N= FREASH NOaa7d8dcB2! ndFT=BAPPY24', false, 1),
      mk(10, 1, 'BU HAMID FF WR FOREVER SBR MTUN FF KS RUDRO FF', false, 1),
      mk(11, 1, 'HXF SANVI WP KAYUM', true, 1),
    ];

    const singlePlayerTeams: Team[] = [
      { id: 'T1', name: 'Squad 1', player1: 'Xin fihad' },
      { id: 'T2', name: 'Squad 2', player1: 'Fg nabil' },
      { id: 'T3', name: 'Squad 3', player1: 'Nht rafi' },
      { id: 'T4', name: 'Squad 4', player1: 'Ufx sohan' },
      { id: 'T5', name: 'Squad 5', player1: 'Flame adro07' },
      { id: 'T6', name: 'Squad 6', player1: 'Jb mowaji10' },
      { id: 'T7', name: 'Squad 7', player1: 'Deadly gamer' },
      { id: 'T8', name: 'Squad 8', player1: 'Raja bai' },
      { id: 'T9', name: 'Squad 9', player1: 'Drk fahim' },
      { id: 'T10', name: 'Squad 10', player1: 'Sbr mitun' },
      { id: 'T11', name: 'Squad 11', player1: 'Sap kayum' },
      { id: 'T12', name: 'Squad 12', player1: 'Hr blaze' },
    ];

    const merged = mergeAndDeduplicateScans([shotScrolled, shotTop], 12);
    expect(merged.map((r) => r.kills)).toEqual([12, 10, 9, 12, 9, 5, 15, 7, 4, 1, 4, 4]);

    const matched = matchScannedRowsToTeams(merged, singlePlayerTeams);
    expect(matched.map((m) => m.matchedTeamId)).toEqual([
      'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12',
    ]);
  });

  it('achieves 100% (384/384) across Player #1, #2, #3, #4 single-name slots x 4 typing variants on both lobbies', () => {
    const mk = (rank: number, raw: string) => ({
      rank,
      kills: 5,
      rawPlayerText: raw,
      normalizedTokens: extractIgnTokens(raw),
      confidence: 90,
      isEdgeClipped: false,
      sourceImageIndex: 0,
    });

    const lobby1Merged = [
      mk(1, 'RHK-FILOKER! FS-RICHMAN: 7 FS-NILOY.? FS-LEADER! | RMK-FILCKER! FS-N\'LOY.7 FS-LEADER!'),
      mk(2, 'NL Flash. X NL Flash. X Lg\u2122Skyam'),
      mk(3, 'EMS FUSE. EMS ALW EMS AL | EMS FUSE. EMS ALVI'),
      mk(4, 'EXDS.B4KUGO! EXOSxF 4RDIN EXDS. Sanjid! EXDS.ASTRO | EXDS.BAKUGD! EXOSxF4RDIN EXDS.Sanjid! EXDS.ASTRO'),
      mk(5, 'itze/habid ACXMONSTER1? F MRAZ SX! TRE DEEN | itz habid ACXMONSTER1? MRAZ BX TRE DEEN'),
      mk(6, 'BG ROCKET DX CROWN Damn Elop 1s LOUS RISKY'),
      mk(7, 'KRK-RIFATIO s NITROX? Misba Sie IE TORNADO!'),
      mk(8, 'M-Zihaad ? s RUMI JH-REZOAN? WHSANY 3! | M-Zihaad ? 5 RUMI JH-REZDANT WH SANY 3)'),
      mk(9, '(X HUNTER WwW SPARK A wno Mien Kk NARUTD | (X HUNTER SPARK A RD MULLER Kk NARUTO'),
      mk(10, 'Dw SPIDER is Dw KAMRUL Mghw (9 wEXL_LEXOx! | Dw SPIDER s DW KAMRUL Mehw (9 wEXL_LEXDx!'),
      mk(11, 'PE KSNDRAX! BVI SEMNT! PE MAKING? ns SVX-ALI'),
      mk(12, 'VNXAR4B! ns TVX-REHAN TS SAAD ns'),
    ];

    const lobby1Matrix = [
      [['RHK-FILCKER!', 'rhk flicker', 'rhkfilcker', 'flicker'], ['F5-RICHMANx7', 'fs richmanx7', 'fsrichman', 'richman'], ['F5-N!LOY.7', 'fs niloy 7', 'fsniloy7', 'niloy'], ['F5-LEADER!', 'fs leader', 'fsleader', 'leader']],
      [['NL-Flash.', 'nl flash', 'nlflash', 'flash'], ['NL-Flash.', 'nl flash', 'nlflash', 'flash'], ['Lg Slyam', 'lg siyam', 'lgslyam', 'slyam'], ['Lg Slyam', 'lg siyam', 'lgsiyam', 'siyam']],
      [['EMS FUSE.', 'ems fuse', 'emsfuse', 'fuse'], ['EMS ALVI', 'ems alvi', 'emsalvi', 'alvi'], ['EMS ALVI', 'ems alvi', 'emsalvi', 'alvi'], ['EMS FUSE.', 'ems fuse', 'emsfuse', 'fuse']],
      [['EXOS.B4KUGO!', 'exos bakugo', 'exosbakugo', 'bakugo'], ['EXOSxF4RDIN', 'exos fardin', 'exosfardin', 'fardin'], ['EXOS.Sanjid!', 'exos sanjid', 'exossanjid', 'sanjid'], ['EXOS.ASTRO', 'exos astro', 'exosastro', 'astro']],
      [['itz habib', 'itz habib', 'itzhabib', 'habib'], ['ACxMONSTER17', 'acx monster17', 'acxmonster17', 'monster17'], ['MIRA2_GX!', 'miraz gx', 'mirazgx', 'miraz'], ['TRB DEEN', 'trb deen', 'trbdeen', 'deen']],
      [['BG 1ROCKET', 'bg 1rocket', 'bg1rocket', '1rocket'], ['DX CROWN', 'dx crown', 'dxcrown', 'crown'], ['Damn Elop', 'damn elop', 'damnelop', 'elop'], ['LOUS.RISKY', 'lous risky', 'lousrisky', 'risky']],
      [['KRK-R!F4T10', 'krk rifat10', 'krkrifatio', 'rifat10'], ['NITROXx7', 'nitroxx7', 'nitroxxx', 'nitro'], ['Misba SIR', 'misba sir', 'misbasir', 'misba'], ['DE.TORNADO!', 'de tornado', 'detornado', 'tornado']],
      [['JH-Zihaad', 'jh zihaad', 'jhzihaad', 'zihaad'], ['RUHI', 'ruhi', 'ruhi', 'ruhi'], ['JH-REZOAN7', 'jh rezoan7', 'jhrezoan7', 'rezoan'], ['JH-SANY', 'jh sany', 'jhsany', 'sany']],
      [['CX HUNTER', 'cx hunter', 'cxhunter', 'hunter'], ['CX SP4RK', 'cx spark', 'cxspark', 'spark'], ['GERD MULLER', 'gerd muller', 'gerdmuller', 'muller'], ['CX NARUTO', 'cx naruto', 'cxnaruto', 'naruto']],
      [['Dw SPIDER', 'dw spider', 'dwspider', 'spider'], ['Dw KAMRUL', 'dw kamrul', 'dwkamrul', 'kamrul'], ['Mehw', 'mehw', 'mehw', 'mehw'], ['EXL_LEXOx.!', 'exl lexox', 'exllexox', 'lexox']],
      [['ePE.KSNDRAx1', 'epe ksndra', 'epeksndrax1', 'ksndra'], ['SVX-SEJ4Nx7!', 'svx sejanx7', 'svxsejan', 'sejan'], ['ePE.MAHINx7', 'epe mahinx7', 'epemahin', 'mahin'], ['SVX-ALI!', 'svx ali', 'svxali', 'ali']],
      [['VNX.AR4B!', 'vnx arab', 'vnxarab', 'ar4b'], ['TVX-REHAN', 'tvx rehan', 'tvxrehan', 'rehan'], ['TS SAAD', 'ts saad', 'tssaad', 'saad'], ['TVX-REHAN', 'tvx rehan', 'tvxrehan', 'rehan']],
    ];

    const lobby2Merged = [
      mk(1, 'RQ ARMAN !! RQ ALOM BD Xin/FHAD RQ JARIF YT'),
      mk(2, "F6-066YMT! F6-ZEONAN! Fo- NOB F&-PETRO!! | F6-066YMT! F6 ZEONAN! Fo-NOR't F&-PETRO!"),
      mk(3, 'NHT Rive! T~ MTSHIHAB NHT-FovsalL NHT-mMAsUM T | NHT River! I~ WI.SHIHALI NHT FovsaL NHT-mMAsSUM T~'),
      mk(4, 'UFX.SHOOTER LB OMOR UFX.SOH4N UFX.ANAZ!'),
      mk(5, 'FLAME -RYXER FLAME-OPPY ! RR-HELLCAT FLAME -ADROO7'),
      mk(6, 'JB-MBWAJNO+ WX TUGRIL! R40 s FLASH~ WPXs CLUTCH!'),
      mk(7, 'DEADLY GAME BX Evie |! X-7 APON ns SAHADAT.'),
      mk(8, '(Raja)8 "bak: WRF RIPPY 11 RQ BENSON wl Electro | (Raja )& "bai: WRF RIPPY 11 RQ BENSON w0 Electro'),
      mk(9, 'ORK ("Famine N- FREASH NOaa 7d8dcB2t ndF T+BAPPYx4'),
      mk(10, 'BU HAMID FF WR FOREVER SBR MITUN FF Ks RUDRO FF'),
      mk(11, "HXF SANVI af KAYUM & 'S.P SIYAM & ns 'HXF SUU"),
      mk(12, 'RHK-RAHAT!! ns HR-BLAST HR-FAHIM F ns HR-BLAZE A'),
    ];

    const lobby2Matrix = [
      [['RQ ARMAN !!', 'rq arman', 'rqarman', 'arman'], ['RQ ALOM_BD', 'rq alom bd', 'rqalombd', 'alom bd'], ['XIN/FIHAD', 'xin fihad', 'xinfihad', 'fihad'], ['RQ JARIF YT', 'rq jarif yt', 'rqjarifyt', 'jarif']],
      [['FG-OGGYM7!', 'fg oggym7', 'fgoggym7', 'oggym7'], ['FG-ZEONAN!', 'fg zeonan', 'fgzeonan', 'zeonan'], ['FG~N@B!L', 'fg nabil', 'fgnabil', 'nabil'], ['FG-PETRO!!', 'fg petro', 'fgpetro', 'petro']],
      [['NHT-RAFI!!', 'nht rafi', 'nhtrafi', 'rafi'], ['NHT-SHIHAB', 'nht shihab', 'nhtshihab', 'shihab'], ['NHT-FOYSAL', 'nht foysal', 'nhtfoysal', 'foysal'], ['NHT-MASUM', 'nht masum', 'nhtmasum', 'masum']],
      [['UFX.SHOOTER', 'ufx shooter', 'ufxshooter', 'shooter'], ['LB OMOR', 'lb omor', 'lbomor', 'omor'], ['UFX.SOH4N', 'ufx sohan', 'ufxsohan', 'sohan'], ['UFX.ANAZ!', 'ufx anaz', 'ufxanaz', 'anaz']],
      [['FLAME-RYKER', 'flame ryker', 'flameryker', 'ryker'], ['FLAME-OPPY !', 'flame oppy', 'flameoppy', 'oppy'], ['RR-HELLCAT', 'rr hellcat', 'rrhellcat', 'hellcat'], ['FLAME-ADRO07', 'flame adroo7', 'flameadro07', 'adro07']],
      [['JB-MOWAJ!10', 'jb mowaji10', 'jbmowaj10', 'mowaj10'], ['BPX-TUGRIL!', 'bpx tugril', 'bpxtugril', 'tugril'], ['R4D-FLASH', 'rad flash', 'radflash', 'r4dflash'], ['BPX-CLUTCH!!', 'bpx clutch', 'bpxclutch', 'clutch']],
      [['DEADLY GAMER', 'deadly gamer', 'deadlygamer', 'deadly'], ['JBX EVIL', 'jbx evil', 'jbxevil', 'evil'], ['X-7 APON', 'x7 apon', 'x7apon', 'apon'], ['SAHADAT.', 'sahadat', 'sahadat', 'sahadat']],
      [['(Raja)&*bai:', 'raja bai', 'rajabai', 'raja'], ['WRF-RIPPY !!', 'wrf rippy', 'wrfrippy', 'rippy'], ['RQ BENSON', 'rq benson', 'rqbenson', 'benson'], ['RQ ELECTRO', 'rq electro', 'rqelectro', 'electro']],
      [['DRK-FAHIM', 'drk fahim', 'drkfahim', 'fahim'], ['XN~FREASH', 'xn freash', 'xnfreash', 'freash'], ['NOaa7d8dc82f', 'noaa7d8dc82f', 'noaa7d8dc82f', '7d8dc82f'], ['JFT+BAPPYx4', 'jft bappyx4', 'jftbappy', 'bappy']],
      [['BU HAMID FF', 'bu hamid ff', 'buhamidff', 'hamid'], ['DR FOREVER', 'dr forever', 'drforever', 'forever'], ['SBR M!TUN FF', 'sbr mitun ff', 'sbrmitun', 'mitun'], ['KS RUDRO FF', 'ks rudro ff', 'ksrudroff', 'rudro']],
      [['HXF SANVI', 'hxf sanvi', 'hxfsanvi', 'sanvi'], ['S4P KAYUM', 'sap kayum', 'sapkayum', 'kayum'], ['S4P SIYAM', 'sap siyam', 'sapsiyam', 'siyam'], ['!HXF SUU', 'hxf suu', 'hxfsuu', 'suu']],
      [['RHK-RAHAT!!', 'rhk rahat', 'rhkrahat', 'rahat'], ['HR-BL4ST', 'hr blast', 'hrblast', 'blast'], ['HR-FAHIM_F', 'hr fahim f', 'hrfahimf', 'hr fahim'], ['HR-BL4ZE_A', 'hr blaze a', 'hrblazea', 'blaze']],
    ];

    // Scramble team registration order (odd/even interleaved reverse) so position never helps
    const perm = [7, 2, 11, 0, 9, 4, 1, 10, 5, 8, 3, 6];

    for (const [rows, matrix] of [
      [lobby1Merged, lobby1Matrix],
      [lobby2Merged, lobby2Matrix],
    ] as const) {
      for (let slot = 0; slot < 4; slot += 1) {
        for (let v = 0; v < 4; v += 1) {
          const scrambledTeams: Team[] = perm.map((origIdx, slotNum) => ({
            id: `T${origIdx + 1}`,
            name: `Squad ${slotNum + 1}`,
            player1: matrix[origIdx][slot][v],
          }));
          const res = matchScannedRowsToTeams(rows, scrambledTeams);
          expect(
            res.map((r) => r.matchedTeamId),
            `slot=${slot + 1} v=${v} typed3=${matrix[2][slot][v]} typed11=${matrix[10][slot][v]} r3=${res[2].matchConfidence.toFixed(3)}:${res[2].matchedKeyword} r11=${res[10].matchConfidence.toFixed(3)}:${res[10].matchedKeyword}`
          ).toEqual([
            'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12',
          ]);
        }
      }
    }
  });

  it('folds circled Latin Nickfinder IGNs and matches single-screenshot #1-#11 (11 rows vs 12 teams) at 100%', () => {
    expect(
      normalizeFreeFireIgn('M\u0280\u20DD\u24B6\u24C0\u24B6\u24C8\u24BD..')
    ).toBe('mr akash');
    expect(normalizeFreeFireIgn('J\u00DF\u20DDSDIPTO')).toBe('jb sdipto');
    expect(normalizeFreeFireIgn('\u0110ARKJ\u0244NAYED')).toBe('darkjunayed');
    expect(extractIgnTokens('nsINS LUFI !')).toContain('lufi');

    const mk = (rank: number, raw: string) => ({
      rank,
      kills: 4,
      rawPlayerText: raw,
      normalizedTokens: extractIgnTokens(raw),
      confidence: 90,
      isEdgeClipped: rank === 11,
      sourceImageIndex: 0,
    });

    // Real single-screenshot #1-#11 OCR rows from Match B (12th squad scrolled off-screen)
    const matchBSingleShot = [
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
      [['UL-CHIEF', 'ul chief', 'ulchief', 'chief'], ['SHANTO', 'shanto', 'shanto', 'shanto'], ['MYRA !', 'myra', 'myra', 'myra'], ['X9 TUFANx', 'x9 tufan', 'x9tufan', 'tufan']],
      [['RATU VAI', 'ratu vai', 'ratuvai', 'ratu'], ['ZENITSU', 'zenitsu', 'zenitsu', 'zenitsu'], ['\u0110ARKJ\u0244NAYED', 'darkjunayed', 'dark junayed', 'junayed'], ['SOHAG !!', 'sohag', 'sohag', 'sohag']],
      [['TJ SOWRAV..', 'tj sowrav', 'tjsowrav', 'sowrav'], ['TJ ARAFAT', 'tj arafat', 'tjarafat', 'arafat'], ['TJ.HAMJA', 'tj hamja', 'tjhamja', 'hamja'], ['TJ.ABRAR', 'tj abrar', 'tjabrar', 'abrar']],
      [['LHE SOURAV', 'lhe sourav', 'lhesourav', 'sourav'], ['GM FARHAD', 'gm farhad', 'gmfarhad', 'farhad'], ['LHE MAHADI', 'lhe mahadi', 'lhemahadi', 'mahadi'], ['LHE HASAN', 'lhe hasan', 'lhehasan', 'hasan']],
      [['WIZ-CHEETAH7', 'wiz cheetah7', 'wizcheetah', 'cheetah'], ['MALEK BHAI', 'malek bhai', 'malekbhai', 'malek'], ['MAMUN 69x!.', 'mamun 69x', 'mamun69x', 'mamun'], ['CX-MIMOSA!', 'cx mimosa', 'cxmimosa', 'mimosa']],
      [['MUKUL GAMING', 'mukul gaming', 'mukulgaming', 'mukul'], ['RAYHAN 777.', 'rayhan 777', 'rayhan777', 'rayhan'], ['TERBIUM FF', 'terbium ff', 'terbiumff', 'terbium'], ['SENZYY X', 'senzyy x', 'senzyyx', 'senzyy']],
      [['LAB x WETRI', 'lab wetri', 'labxwetri', 'wetri'], ['LAB xSKYSHOT', 'lab skyshot', 'labxskyshot', 'skyshot'], ['LAB x NAYEM', 'lab nayem', 'labxnayem', 'nayem'], ['CX-PSYCHO!!', 'cx psycho', 'cxpsycho', 'psycho']],
      [['XTZ WOLF', 'xtz wolf', 'xtzwolf', 'wolf'], ['XTZ STORM', 'xtz storm', 'xtzstorm', 'storm'], ['superSPAX', 'superspax', 'super spax', 'spax'], ['NRX AETHER', 'nrx aether', 'nrxaether', 'aether']],
      [['RXE-R!FAT9x', 'rxe rifat9x', 'rxerifat', 'rifat'], ['RXE-N!4MUL!', 'rxe niamul', 'rxen4mul', 'niamul'], ['RXE-RASHED', 'rxe rashed', 'rxerashed', 'rashed'], ['RXE-VIPER>9', 'rxe viper 9', 'rxeviper', 'viper']],
      [['UFX-ZATRAY', 'ufx zatray', 'ufxzatray', 'zatray'], ['UFX-BANLEX', 'ufx banlex', 'ufxbanlex', 'banlex'], ['UFX-TORN4DO', 'ufx tornado', 'ufxtorn4do', 'tornado'], ['F1C.Aimlock1', 'f1c aimlock1', 'f1caimlock', 'aimlock']],
      [['PXG ZYROXx', 'pxg zyroxx', 'pxgzyrox', 'zyrox'], ['PXG ZENTIXx', 'pxg zentixx', 'pxgzentix', 'zentix'], ['PXG ZYROXx', 'pxg zyroxx', 'pxgzyrox', 'zyrox'], ['PXG ZENTIXx', 'pxg zentixx', 'pxgzentix', 'zentix']],
      // 12th registered team (scrolled off-screen in single-screenshot workflow)
      [['VNX.AR4B', 'vnx arab', 'vnxar4b', 'arab'], ['TVX-REHAN', 'tvx rehan', 'tvxrehan', 'rehan'], ['TS SAAD', 'ts saad', 'tssaad', 'saad'], ['VNX.AR4B', 'vnx arab', 'vnxar4b', 'arab']],
    ];

    const perm = [7, 2, 11, 0, 9, 4, 1, 10, 5, 8, 3, 6];
    for (let slot = 0; slot < 4; slot += 1) {
      for (let v = 0; v < 4; v += 1) {
        const scrambledTeams: Team[] = perm.map((origIdx, slotNum) => ({
          id: `T${origIdx + 1}`,
          name: `Squad ${slotNum + 1}`,
          player1: matchBMatrix[origIdx][slot][v],
        }));
        const res = matchScannedRowsToTeams(matchBSingleShot, scrambledTeams);
        expect(res.map((r) => r.matchedTeamId)).toEqual([
          'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11',
        ]);
      }
    }
  });

  it('classifies single digits 0-9, 2-digit kills (16), and rank badges (12) with embedded Int8 CNN', () => {
    const glyphs: Record<number, string[]> = {
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

    const drawCell = (
      numStr: string,
      bgRgb: [number, number, number],
      fgRgb: [number, number, number]
    ) => {
      const W = 28;
      const H = 22;
      const rgba = new Uint8ClampedArray(W * H * 4);
      for (let i = 0; i < W * H; i += 1) {
        rgba[i * 4] = bgRgb[0];
        rgba[i * 4 + 1] = bgRgb[1];
        rgba[i * 4 + 2] = bgRgb[2];
        rgba[i * 4 + 3] = 255;
      }
      let cursorX = 3;
      for (const ch of numStr) {
        const g = glyphs[Number(ch)];
        for (let y = 0; y < 12; y += 1) {
          for (let x = 0; x < g[y].length; x += 1) {
            if (g[y][x] === '#') {
              const idx = ((5 + y) * W + (cursorX + x)) * 4;
              rgba[idx] = fgRgb[0];
              rgba[idx + 1] = fgRgb[1];
              rgba[idx + 2] = fgRgb[2];
            }
          }
        }
        cursorX += 9;
      }
      return { rgba, W, H };
    };

    for (let d = 0; d <= 9; d += 1) {
      // Gold #1-#3 banner background + yellow kill digit
      const gold = drawCell(String(d), [96, 72, 16], [248, 202, 24]);
      expect(readRgbaCellNumber(gold.rgba, gold.W, gold.H, 0, 0, gold.W, gold.H, 'yellow')).toBe(d);
    }

    // Narrow two-digit 11 kills + 16 kills on gold banner + white rank badge 12 on dark card
    const twoDigit11 = drawCell('11', [92, 68, 14], [248, 202, 24]);
    expect(
      readRgbaCellNumber(twoDigit11.rgba, twoDigit11.W, twoDigit11.H, 0, 0, twoDigit11.W, twoDigit11.H, 'yellow')
    ).toBe(11);

    const twoDigit16 = drawCell('16', [92, 68, 14], [248, 202, 24]);
    expect(
      readRgbaCellNumber(twoDigit16.rgba, twoDigit16.W, twoDigit16.H, 0, 0, twoDigit16.W, twoDigit16.H, 'yellow')
    ).toBe(16);

    const rank12 = drawCell('12', [18, 19, 22], [242, 244, 248]);
    expect(
      readRgbaCellNumber(rank12.rgba, rank12.W, rank12.H, 0, 0, rank12.W, rank12.H, 'white')
    ).toBe(12);
    expect(normalizeFreeFireIgn('EXV-NOBETA\u277B\u277E')).toBe('exv nobeta69');
  });
});
