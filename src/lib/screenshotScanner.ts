import type { Team } from '../types/tournament';

export interface OcrWordBox {
  text: string;
  x0: number; // pixel or normalized
  y0: number;
  x1: number;
  y1: number;
  confidence: number; // 0..100
}

export interface ScannedRankRow {
  rank: number;
  kills: number;
  rawPlayerText: string;
  normalizedTokens: string[];
  confidence: number;
  isEdgeClipped: boolean;
  sourceImageIndex: number;
}

export interface MatchedScanRow extends ScannedRankRow {
  matchedTeamId: string | null;
  matchConfidence: number; // 0..1
  matchedKeyword?: string;
}

/**
 * Common Free Fire stylized Unicode lookalikes that NFKD alone does not fold to ASCII.
 */
const HOMOGLYPH_MAP: Record<string, string> = {
  // Greek, Cyrillic, Currency & Nickfinder lookalikes
  '\u0391': 'a', '\u0410': 'a', '\u13AA': 'a', '\u039B': 'a', '\u03B1': 'a', '\u0430': 'a', '\u20B3': 'a',
  '\u0392': 'b', '\u0412': 'b', '\u0299': 'b', '\u0432': 'b', '\u0E3F': 'b', '\u20BF': 'b',
  '\u0421': 'c', '\u13DF': 'c', '\u1D04': 'c', '\u0441': 'c', '\u00A2': 'c', '\u20B5': 'c',
  '\u13A0': 'd', '\u1D05': 'd', '\u010E': 'd', '\u0110': 'd', '\u0111': 'd',
  '\u0395': 'e', '\u0415': 'e', '\u13AC': 'e', '\u1D07': 'e', '\u0435': 'e', '\u03B5': 'e', '\u20AC': 'e',
  '\u0492': 'f', '\uA730': 'f', '\u0493': 'f',
  '\u0262': 'g', '\u13C0': 'g', '\u20B2': 'g',
  '\u0397': 'h', '\u041D': 'h', '\u13BB': 'h', '\u029C': 'h', '\u043D': 'h', '\u20B4': 'h',
  '\u0399': 'i', '\u0406': 'i', '\u0407': 'i', '\u026A': 'i', '\u0456': 'i', '\u0457': 'i',
  '\u0408': 'j', '\u1D0A': 'j', '\u0458': 'j', '\u2111': 'j',
  '\u039A': 'k', '\u041A': 'k', '\u1D0B': 'k', '\u043A': 'k', '\u20AD': 'k',
  '\u13DE': 'l', '\u029F': 'l', '\u0141': 'l', '\u0142': 'l', '\u00A3': 'l',
  '\u039C': 'm', '\u041C': 'm', '\u13B7': 'm', '\u1D0D': 'm', '\u043C': 'm', '\u20BC': 'm',
  '\u039D': 'n', '\u0274': 'n', '\u0418': 'n', '\u0438': 'n', '\u20A6': 'n',
  '\u039F': 'o', '\u041E': 'o', '\u00D8': 'o', '\u00F8': 'o', '\u1D0F': 'o', '\u043E': 'o',
  '\u03A1': 'p', '\u0420': 'p', '\u1D18': 'p', '\u0440': 'p', '\u20B1': 'p',
  '\u042F': 'r', '\u0280': 'r', '\u13D2': 'r', '\u044F': 'r', '\u20B9': 'r', '\u20BD': 'r',
  '\u0405': 's', '\u13DA': 's', '\uA731': 's', '\u0455': 's', '$': 's',
  '\u03A4': 't', '\u0422': 't', '\u1D1B': 't', '\u0442': 't', '\u20AE': 't', '\u20B8': 't', '\u20BA': 't',
  '\u054D': 'u', '\u1D1C': 'u', '\u03C5': 'u',
  '\u0474': 'v', '\u1D20': 'v', '\u0475': 'v',
  '\u13B3': 'w', '\u1D21': 'w', '\u03C9': 'w', '\u20A9': 'w',
  '\u03A7': 'x', '\u0425': 'x', '\u0445': 'x',
  '\u03A5': 'y', '\u0423': 'y', '\u028F': 'y', '\u0443': 'y', '\u00A5': 'y',
  '\u0396': 'z', '\u1D22': 'z',
  // Common Free Fire clan/separator ornaments -> space so adjacent words split cleanly
  '\u30E1': ' ',
  '\u4E42': ' ',
  '\u0F3A': ' ', '\u0F3B': ' ', '\u0F12': ' ', '\u262C': ' ',
  '\u2122': ' ', '\u00AE': ' ', // TM / Registered symbols between clan tag and IGN (e.g. Lg\u2122Slyam)
};

/**
 * Folds stylized Free Fire IGNs (superscripts, fullwidth, math bold, homoglyphs, ornaments)
 * into clean lowercase alphanumeric words.
 */
export function normalizeFreeFireIgn(raw: string): string {
  if (!raw) return '';
  let preMapped = '';
  for (const ch of raw) {
    if (HOMOGLYPH_MAP[ch] !== undefined) {
      preMapped += HOMOGLYPH_MAP[ch];
    } else {
      preMapped += ch;
    }
  }
  const decomposed = preMapped.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  let mapped = '';
  for (const ch of decomposed) {
    if (HOMOGLYPH_MAP[ch] !== undefined) {
      mapped += HOMOGLYPH_MAP[ch];
    } else {
      mapped += ch.toLowerCase();
    }
  }

  const words = mapped
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return '';

  // Collapse runs of spaced single characters: e.g. "s h a k i b" -> "shakib"
  const merged: string[] = [];
  let singleRun = '';
  for (const w of words) {
    if (w.length === 1 && /[a-z]/.test(w)) {
      singleRun += w;
    } else {
      if (singleRun) {
        merged.push(singleRun);
        singleRun = '';
      }
      merged.push(w);
    }
  }
  if (singleRun) {
    merged.push(singleRun);
  }
  return merged.join(' ');
}

/**
 * Extracts distinct searchable word tokens (plus adjacent pairs/triplets so clan+name
 * like "NL Flash" -> "nlflash" and "Dw SPIDER" -> "dwspider" match seamlessly).
 */
export function extractIgnTokens(raw: string): string[] {
  const norm = normalizeFreeFireIgn(raw);
  if (!norm) return [];
  const rawWords = norm.split(' ').filter(Boolean);
  const parts = rawWords.filter((p) => p.length >= 2 && !/^\d+$/.test(p));
  const set = new Set<string>(parts);

  for (let i = 0; i < rawWords.length; i += 1) {
    if (i + 1 < rawWords.length) {
      const pair = rawWords[i] + rawWords[i + 1];
      if (pair.length >= 3 && !/^\d+$/.test(pair)) set.add(pair);
    }
    if (i + 2 < rawWords.length) {
      const trip = rawWords[i] + rawWords[i + 1] + rawWords[i + 2];
      if (trip.length >= 4 && !/^\d+$/.test(trip)) set.add(trip);
    }
  }

  const collapsed = parts.join('');
  if (collapsed.length >= 3 && collapsed.length <= 32) {
    set.add(collapsed);
  }
  return Array.from(set);
}

/**
 * Folds common Free Fire leet digits & OCR confusions (0->o, 1/l->i, 5->s, 4->a, 8->b, 2->z).
 */
function foldOcrAndLeet(s: string): string {
  return s
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/[1l|!]/g, 'i')
    .replace(/5/g, 's')
    .replace(/4/g, 'a')
    .replace(/8/g, 'b')
    .replace(/2/g, 'z')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Optimal String Alignment / Damerau-Levenshtein distance (handles adjacent letter
 * transpositions like "filcker" <-> "flicker" as 1 edit instead of 2).
 */
function damerauLevenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  const dp: number[][] = Array.from({ length: la + 1 }, () =>
    new Array<number>(lb + 1).fill(0)
  );
  for (let i = 0; i <= la; i += 1) dp[i][0] = i;
  for (let j = 0; j <= lb; j += 1) dp[0][j] = j;

  for (let i = 1; i <= la; i += 1) {
    for (let j = 1; j <= lb; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let val = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        val = Math.min(val, dp[i - 2][j - 2] + 1);
      }
      dp[i][j] = val;
    }
  }
  return dp[la][lb];
}

export function ocrFuzzySimilarity(
  candidateToken: string,
  keywordRaw: string
): number {
  const kw = foldOcrAndLeet(normalizeFreeFireIgn(keywordRaw));
  const cand = foldOcrAndLeet(normalizeFreeFireIgn(candidateToken));
  if (!kw || !cand) return 0;
  if (cand === kw) return 1;
  if (kw.length >= 3 && cand.includes(kw)) return 0.96;
  if (cand.length >= 4 && kw.includes(cand)) {
    return Math.min(0.92, cand.length / kw.length + 0.22);
  }

  // Sliding substring Damerau-Levenshtein when candidate has clan prefix/suffix attached
  if (cand.length > kw.length && kw.length >= 3) {
    let best = 0;
    for (let start = 0; start <= cand.length - kw.length; start += 1) {
      const slice = cand.slice(start, start + kw.length);
      const dist = damerauLevenshtein(slice, kw);
      const sim = 1 - dist / kw.length;
      if (sim > best) best = sim;
    }
    if (best >= 0.7) return best * 0.95;
  }

  const maxLen = Math.max(cand.length, kw.length);
  if (maxLen < 3) return 0;
  const dist = damerauLevenshtein(cand, kw);
  return 1 - dist / maxLen;
}

export function scoreSquadAgainstTokens(
  tokens: string[],
  team: Pick<
    Team,
    'name' | 'shortCode' | 'player1' | 'player2' | 'players' | 'learnedTokens'
  >
): { score: number; matchedKeyword?: string } {
  if (tokens.length === 0) return { score: 0 };

  const primaryKeywords: Array<{ label: string; weight: number }> = [];
  const seenPlayerLower = new Set<string>();
  const allPlayers = [
    ...(team.players || []),
    team.player1 || '',
    team.player2 || '',
  ];

  for (let i = 0; i < allPlayers.length; i += 1) {
    const clean = allPlayers[i].trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seenPlayerLower.has(key)) continue;
    seenPlayerLower.add(key);
    const baseWeight = seenPlayerLower.size === 1 ? 1.0 : 0.98;
    primaryKeywords.push({ label: clean, weight: baseWeight });

    // Also index individual distinct word parts >= 4 chars (e.g. "RHK flicker" -> "flicker")
    const subParts = normalizeFreeFireIgn(clean)
      .split(' ')
      .filter((w) => w.length >= 4 && !/^\d+$/.test(w));
    for (const sp of subParts) {
      if (sp !== normalizeFreeFireIgn(clean).replace(/\s+/g, '')) {
        primaryKeywords.push({ label: sp, weight: baseWeight * 0.94 });
      }
    }
  }

  if (team.learnedTokens?.length) {
    for (const lt of team.learnedTokens) {
      if (lt.trim().length >= 3) {
        primaryKeywords.push({ label: lt.trim(), weight: 0.94 });
      }
    }
  }
  if (
    team.name?.trim() &&
    !/^(?:squad|team|slot)\s*\d+$/i.test(team.name.trim())
  ) {
    primaryKeywords.push({ label: team.name.trim(), weight: 0.9 });
  }

  let bestScore = 0;
  let bestKw: string | undefined;
  let matchHits = 0;

  for (const kw of primaryKeywords) {
    let kwBest = 0;
    for (const tok of tokens) {
      const sim = ocrFuzzySimilarity(tok, kw.label) * kw.weight;
      if (sim > kwBest) kwBest = sim;
    }
    if (kwBest >= 0.72) {
      matchHits += 1;
    }
    if (kwBest > bestScore) {
      bestScore = kwBest;
      bestKw = kw.label;
    }
  }

  if (matchHits >= 2) {
    bestScore = Math.min(1, bestScore + 0.05);
  }

  return { score: bestScore, matchedKeyword: bestKw };
}

// ============================================================================
// Condensed Sports Numeral 12x16 Classifier (for Free Fire yellow kill digits
// and right-column rank badges)
// ============================================================================

const DIGIT_TEMPLATES: Record<number, string[]> = {
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

const TEMPLATE_VECS: Record<number, Float32Array> = {};
for (let d = 0; d <= 9; d += 1) {
  const rows = DIGIT_TEMPLATES[d];
  const raw = new Float32Array(192);
  for (let y = 0; y < 16; y += 1) {
    for (let x = 0; x < 12; x += 1) {
      raw[y * 12 + x] = rows[y][x] === '#' ? 1 : 0;
    }
  }
  const blur = new Float32Array(192);
  for (let y = 0; y < 16; y += 1) {
    for (let x = 0; x < 12; x += 1) {
      let sum = 0;
      let w = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < 16 && nx >= 0 && nx < 12) {
            const wt = dx === 0 && dy === 0 ? 4 : 1;
            sum += raw[ny * 12 + nx] * wt;
            w += wt;
          }
        }
      }
      blur[y * 12 + x] = sum / w;
    }
  }
  TEMPLATE_VECS[d] = blur;
}

function classifyGlyph12x16(grid: Float32Array, aspect: number): number {
  if (aspect < 0.44) return 1;

  let meanG = 0;
  for (let i = 0; i < 192; i += 1) meanG += grid[i];
  meanG /= 192;
  let varG = 0;
  for (let i = 0; i < 192; i += 1) varG += (grid[i] - meanG) ** 2;
  const stdG = Math.sqrt(varG) || 1;

  const regionMean = (x0: number, x1: number, y0: number, y1: number) => {
    let s = 0;
    let n = 0;
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        s += grid[y * 12 + x];
        n += 1;
      }
    }
    return s / n;
  };

  const midCenter = regionMean(5, 6, 6, 9);
  const upperHole = regionMean(5, 6, 3, 5);
  const lowerHole = regionMean(5, 6, 10, 12);
  const topLeftWall = regionMean(0, 3, 3, 6);
  const topRightWall = regionMean(8, 11, 3, 6);
  const topRightCorner = regionMean(8, 11, 1, 4);
  const botLeftWall = regionMean(0, 3, 9, 12);
  const botRightWall = regionMean(8, 11, 9, 12);
  const topBar = regionMean(2, 9, 0, 2);
  const botBar = regionMean(2, 9, 13, 15);
  const waistOuter = regionMean(0, 1, 6, 9) + regionMean(10, 11, 6, 9);
  const bellyOuter =
    regionMean(0, 1, 3, 4) +
    regionMean(10, 11, 3, 4) +
    regionMean(0, 1, 11, 12) +
    regionMean(10, 11, 11, 12);

  let bestDigit = 0;
  let bestScore = -1e9;
  for (let d = 0; d <= 9; d += 1) {
    if (d === 1 && aspect > 0.48) continue;
    const t = TEMPLATE_VECS[d];
    let meanT = 0;
    for (let i = 0; i < 192; i += 1) meanT += t[i];
    meanT /= 192;
    let varT = 0;
    let cov = 0;
    for (let i = 0; i < 192; i += 1) {
      const dt = t[i] - meanT;
      varT += dt * dt;
      cov += (grid[i] - meanG) * dt;
    }
    let score = cov / (stdG * (Math.sqrt(varT) || 1));

    if (d === 0) {
      score +=
        (1 - midCenter) * 0.28 +
        topLeftWall * 0.14 +
        topRightCorner * 0.16 +
        botLeftWall * 0.1;
    }
    if (d === 6) {
      score +=
        (midCenter - lowerHole) * 0.22 +
        (0.25 - topRightCorner) * 0.45 +
        botLeftWall * 0.1;
    }
    if (d === 8) {
      score +=
        (midCenter - 0.5 * (upperHole + lowerHole)) * 0.38 +
        (0.5 * bellyOuter - waistOuter) * 0.12;
    }
    if (d === 9) {
      score +=
        (midCenter - upperHole) * 0.2 +
        (0.25 - botLeftWall) * 0.4 +
        topRightCorner * 0.12;
    }
    if (d === 3) {
      score +=
        (1 - topLeftWall) * 0.18 +
        (1 - botLeftWall) * 0.18 +
        botBar * 0.15 +
        midCenter * 0.12;
    }
    if (d === 4) {
      score +=
        (1 - regionMean(0, 4, 13, 15)) * 0.2 +
        (1 - regionMean(0, 2, 0, 3)) * 0.12 +
        midCenter * 0.12;
    }
    if (d === 5) {
      score +=
        topLeftWall * 0.18 +
        (1 - topRightWall) * 0.18 +
        (1 - botLeftWall) * 0.15 +
        botBar * 0.1;
    }
    if (d === 2) {
      score +=
        (1 - topLeftWall) * 0.15 +
        botLeftWall * 0.18 +
        (1 - botRightWall) * 0.15 +
        botBar * 0.15;
    }
    if (d === 7) {
      score +=
        topBar * 0.2 +
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

function readRgbaCellNumber(
  rgba: Uint8ClampedArray,
  W: number,
  H: number,
  cropX0: number,
  cropY0: number,
  cropW: number,
  cropH: number,
  mode: 'yellow' | 'white'
): number | null {
  if (cropW < 4 || cropH < 4) return null;
  const cw = Math.max(40, cropW * 5);
  const ch = Math.max(40, cropH * 5);
  const scaleX = cw / cropW;
  const scaleY = ch / cropH;

  const sampleSignal = (sx: number, sy: number) => {
    const px = Math.min(W - 1, Math.max(0, cropX0 + sx));
    const py = Math.min(H - 1, Math.max(0, cropY0 + sy));
    const idx = (py * W + px) * 4;
    const r = rgba[idx];
    const g = rgba[idx + 1];
    const b = rgba[idx + 2];
    return mode === 'yellow'
      ? Math.max(0, 0.55 * r + 0.45 * g - 0.85 * b)
      : 0.4 * r + 0.4 * g + 0.2 * b;
  };

  const vals: number[] = [];
  for (let sy = 0; sy < cropH; sy += 1) {
    for (let sx = 0; sx < cropW; sx += 1) {
      vals.push(sampleSignal(sx, sy));
    }
  }
  vals.sort((a, b) => a - b);
  const bg = vals[Math.floor(vals.length * 0.25)];
  const peak = vals[vals.length - 1];
  if (peak - bg < (mode === 'yellow' ? 32 : 45)) return null;

  const cell = new Float32Array(cw * ch);
  for (let dy = 0; dy < ch; dy += 1) {
    const fy = dy / scaleY;
    const y0 = Math.floor(fy);
    const y1 = Math.min(cropH - 1, y0 + 1);
    const wy = fy - y0;
    for (let dx = 0; dx < cw; dx += 1) {
      const fx = dx / scaleX;
      const x0 = Math.floor(fx);
      const x1 = Math.min(cropW - 1, x0 + 1);
      const wx = fx - x0;
      const v =
        (sampleSignal(x0, y0) * (1 - wx) + sampleSignal(x1, y0) * wx) *
          (1 - wy) +
        (sampleSignal(x0, y1) * (1 - wx) + sampleSignal(x1, y1) * wx) * wy;
      cell[dy * cw + dx] = Math.max(
        0,
        Math.min(1, (v - (bg + (peak - bg) * 0.28)) / Math.max(18, (peak - bg) * 0.55))
      );
    }
  }

  let minY = ch;
  let maxY = -1;
  let minX = cw;
  let maxX = -1;
  for (let y = 2; y < ch - 2; y += 1) {
    for (let x = 2; x < cw - 2; x += 1) {
      if (cell[y * cw + x] > 0.38) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  if (maxY - minY < ch * 0.22 || maxX - minX < 4) return null;

  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const xRanges: Array<[number, number]> = [];
  if (bw / bh > 0.82) {
    const colSum = new Float32Array(bw);
    for (let x = 0; x < bw; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        colSum[x] += cell[y * cw + (minX + x)];
      }
    }
    let bestSplit = -1;
    let bestVal = 1e9;
    for (let x = Math.floor(bw * 0.25); x <= Math.ceil(bw * 0.75); x += 1) {
      if (colSum[x] < bestVal) {
        bestVal = colSum[x];
        bestSplit = x;
      }
    }
    if (bestSplit > 0 && bestVal < bh * 0.18) {
      xRanges.push([minX, minX + bestSplit - 1], [minX + bestSplit + 1, maxX]);
    } else {
      xRanges.push([minX, maxX]);
    }
  } else {
    xRanges.push([minX, maxX]);
  }

  let digits = '';
  for (const [gx0, gx1] of xRanges) {
    let x0 = gx1;
    let x1 = gx0;
    let y0 = maxY;
    let y1 = minY;
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = gx0; x <= gx1; x += 1) {
        if (cell[y * cw + x] > 0.35) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    const gw = Math.max(1, x1 - x0 + 1);
    const gh = Math.max(1, y1 - y0 + 1);
    if (gh < ch * 0.2) continue;

    const grid = new Float32Array(192);
    for (let ny = 0; ny < 16; ny += 1) {
      for (let nx = 0; nx < 12; nx += 1) {
        const ix = Math.min(
          cw - 1,
          Math.max(0, Math.round(x0 + (nx + 0.5) * (gw / 12)))
        );
        const iy = Math.min(
          ch - 1,
          Math.max(0, Math.round(y0 + (ny + 0.5) * (gh / 16)))
        );
        grid[ny * 12 + nx] = cell[iy * cw + ix];
      }
    }
    digits += String(classifyGlyph12x16(grid, gw / gh));
  }

  return digits ? parseInt(digits, 10) : null;
}

interface DetectedScoreboardCard {
  side: 'L' | 'R';
  rank: number;
  kills: number;
  clipped: boolean;
  y0: number;
  y1: number;
  words: string[];
}

interface DetectedGridResult {
  cards: DetectedScoreboardCard[];
  nameCompositeCanvas: HTMLCanvasElement;
  scale: number;
  stripBounds: Array<{ side: 'L' | 'R'; outX0: number; outX1: number }>;
}

function detectFreeFireGridAndBuildNameCanvas(
  rgba: Uint8ClampedArray,
  W: number,
  H: number
): DetectedGridResult | null {
  const lookDist = Math.max(5, Math.round(H * 0.015));
  const yellowScoreX = new Float64Array(W);

  // Scan below #1 gold banner (0.36*H..0.85*H) for local-contrast yellow kill-digit columns
  for (let y = Math.floor(H * 0.36); y < Math.floor(H * 0.85); y += 1) {
    for (let x = Math.floor(W * 0.06); x < Math.floor(W * 0.96); x += 1) {
      const idx = (y * W + x) * 4;
      const r = rgba[idx];
      const g = rgba[idx + 1];
      const b = rgba[idx + 2];
      if (r >= 130 && g >= 95 && 0.6 * r + 0.4 * g - b >= 55) {
        const lIdx = (y * W + Math.max(0, x - lookDist)) * 4;
        const rIdx = (y * W + Math.min(W - 1, x + lookDist)) * 4;
        const bgLum = Math.min(
          0.5 * rgba[lIdx] + 0.5 * rgba[lIdx + 1],
          0.5 * rgba[rIdx] + 0.5 * rgba[rIdx + 1]
        );
        const fgLum = 0.5 * r + 0.5 * g;
        if (fgLum - bgLum >= 35) {
          yellowScoreX[x] += fgLum - bgLum;
        }
      }
    }
  }

  const win = Math.max(2, Math.round(H * 0.007));
  const smoothed = new Float64Array(W);
  for (let x = win; x < W - win; x += 1) {
    for (let dx = -win; dx <= win; dx += 1) {
      smoothed[x] += yellowScoreX[x + dx];
    }
  }

  const cands: Array<{ x: number; score: number }> = [];
  for (let x = Math.floor(W * 0.08); x < Math.floor(W * 0.95); x += 1) {
    if (
      smoothed[x] >= smoothed[x - 1] &&
      smoothed[x] >= smoothed[x + 1] &&
      smoothed[x] > H * 0.85
    ) {
      // Sub-pixel weighted centroid around local peak for +/-1px compression resilience
      let num = 0;
      let den = 0;
      for (let dx = -win - 1; dx <= win + 1; dx += 1) {
        const px = Math.min(W - 1, Math.max(0, x + dx));
        num += px * yellowScoreX[px];
        den += yellowScoreX[px];
      }
      cands.push({ x: den > 0 ? Math.round(num / den) : x, score: smoothed[x] });
    }
  }
  cands.sort((a, b) => b.score - a.score);

  const minPeakDist = H * 0.2;
  const killX: number[] = [];
  for (const c of cands) {
    if (killX.every((px) => Math.abs(px - c.x) >= minPeakDist)) {
      killX.push(c.x);
      if (killX.length === 4) break;
    }
  }
  killX.sort((a, b) => a - b);

  if (killX.length !== 2 && killX.length !== 4) {
    return null;
  }

  const hasRightCol = killX.length === 4;
  const leftSpan = killX[1] - killX[0];
  const rightSpan = hasRightCol ? killX[3] - killX[2] : leftSpan * 0.73;

  if (leftSpan < H * 0.2) return null;

  const findLines = (x0: number, x1: number) => {
    const rowEdge = new Float64Array(H);
    const minEdgeCount = Math.max(5, Math.round((x1 - x0) * 0.025));
    for (let y = Math.floor(H * 0.18); y < Math.floor(H * 0.88); y += 1) {
      let e = 0;
      for (let x = Math.max(1, x0); x < Math.min(W - 1, x1); x += 1) {
        const idx = (y * W + x) * 4;
        const prev = (y * W + x - 1) * 4;
        const lum = 0.55 * rgba[idx] + 0.45 * rgba[idx + 1];
        const lumPrev = 0.55 * rgba[prev] + 0.45 * rgba[prev + 1];
        if (lum >= 125 && Math.abs(lum - lumPrev) >= 22) e += 1;
      }
      rowEdge[y] = e;
    }
    const segs: Array<{ y0: number; y1: number; yc: number }> = [];
    let s = -1;
    const minLineH = Math.max(4, Math.round(H * 0.01));
    for (let y = 0; y < H; y += 1) {
      if (rowEdge[y] >= minEdgeCount) {
        if (s === -1) s = y;
      } else if (s !== -1) {
        if (y - s >= minLineH) {
          segs.push({ y0: s, y1: y - 1, yc: (s + y - 1) / 2 });
        }
        s = -1;
      }
    }
    return segs;
  };

  const pairLines = (lines: Array<{ y0: number; y1: number; yc: number }>) => {
    const grouped: Array<{
      lines: Array<{ y0: number; y1: number; yc: number }>;
      clipped: boolean;
    }> = [];
    for (let i = 0; i < lines.length; ) {
      if (i + 1 < lines.length && lines[i + 1].yc - lines[i].yc < H * 0.056) {
        grouped.push({ lines: [lines[i], lines[i + 1]], clipped: false });
        i += 2;
      } else {
        grouped.push({ lines: [lines[i]], clipped: true });
        i += 1;
      }
    }
    return grouped;
  };

  const leftCards = pairLines(
    findLines(
      Math.round(killX[0] - leftSpan * 0.52),
      Math.round(killX[1] + leftSpan * 0.25)
    )
  );
  const rightCards = hasRightCol
    ? pairLines(
        findLines(
          Math.round(killX[2] - rightSpan * 0.72),
          Math.round(killX[3] + rightSpan * 0.25)
        )
      )
    : [];

  if (leftCards.length === 0 && rightCards.length === 0) return null;

  const halfCellW = Math.max(8, Math.round(H * 0.02));
  const padY = Math.max(2, Math.round(H * 0.0065));

  // Majority-vote starting rank for the scrollable Right Column (6..12)
  let rightStartRank = 6;
  if (hasRightCol && rightCards.length > 0) {
    const startVotes = new Map<number, number>();
    for (let i = 0; i < rightCards.length; i += 1) {
      if (rightCards[i].clipped) continue;
      const rx0 = Math.round(killX[2] - rightSpan * 1.045);
      const midY = Math.round(
        (rightCards[i].lines[0].y0 + rightCards[i].lines[1].y1) / 2 - H * 0.017
      );
      const badge = readRgbaCellNumber(
        rgba,
        W,
        H,
        rx0,
        midY,
        Math.round(rightSpan * 0.19),
        Math.round(H * 0.035),
        'white'
      );
      if (badge !== null && badge >= 6 && badge <= 24) {
        const implied = badge - i;
        startVotes.set(implied, (startVotes.get(implied) || 0) + 1);
      }
    }
    let bestVotes = 0;
    for (const [sr, v] of startVotes.entries()) {
      if (v > bestVotes) {
        bestVotes = v;
        rightStartRank = sr;
      }
    }
  }

  const cards: DetectedScoreboardCard[] = [];
  for (let i = 0; i < leftCards.length; i += 1) {
    const c = leftCards[i];
    let kills = 0;
    for (const ln of c.lines) {
      for (const kx of [killX[0], killX[1]]) {
        const kv = readRgbaCellNumber(
          rgba,
          W,
          H,
          kx - halfCellW,
          ln.y0 - padY,
          halfCellW * 2,
          ln.y1 - ln.y0 + padY * 2,
          'yellow'
        );
        if (kv !== null && kv <= 35) kills += kv;
      }
    }
    cards.push({
      side: 'L',
      rank: i + 1,
      kills,
      clipped: c.clipped,
      y0: c.lines[0].y0 - 6,
      y1: c.lines[c.lines.length - 1].y1 + 6,
      words: [],
    });
  }

  for (let i = 0; i < rightCards.length; i += 1) {
    const c = rightCards[i];
    let kills = 0;
    for (const ln of c.lines) {
      for (const kx of [killX[2], killX[3]]) {
        const kv = readRgbaCellNumber(
          rgba,
          W,
          H,
          kx - halfCellW,
          ln.y0 - padY,
          halfCellW * 2,
          ln.y1 - ln.y0 + padY * 2,
          'yellow'
        );
        if (kv !== null && kv <= 35) kills += kv;
      }
    }
    cards.push({
      side: 'R',
      rank: rightStartRank + i,
      kills,
      clipped: c.clipped,
      y0: c.lines[0].y0 - 6,
      y1: c.lines[c.lines.length - 1].y1 + 6,
      words: [],
    });
  }

  // Build clean 3.5x inverted composite canvas containing ONLY the player-name strips
  const scale = 3.5;
  const strips: Array<{ side: 'L' | 'R'; x0: number; x1: number }> = [
    {
      side: 'L',
      x0: Math.max(0, Math.round(killX[0] - leftSpan * 0.575)),
      x1: Math.max(1, Math.round(killX[0] - leftSpan * 0.068)),
    },
    {
      side: 'L',
      x0: Math.max(0, Math.round(killX[0] + leftSpan * 0.382)),
      x1: Math.max(1, Math.round(killX[1] - leftSpan * 0.068)),
    },
  ];
  if (hasRightCol) {
    strips.push(
      {
        side: 'R',
        x0: Math.max(0, Math.round(killX[2] - rightSpan * 0.735)),
        x1: Math.max(1, Math.round(killX[2] - rightSpan * 0.085)),
      },
      {
        side: 'R',
        x0: Math.max(0, Math.round(killX[2] + rightSpan * 0.39)),
        x1: Math.max(1, Math.round(killX[3] - rightSpan * 0.085)),
      }
    );
  }

  const gutter = 48;
  const stripWidths = strips.map((s) =>
    Math.max(8, Math.round((s.x1 - s.x0) * scale))
  );
  const canvasW =
    stripWidths.reduce((a, b) => a + b, 0) + gutter * (strips.length + 1);
  const canvasH = Math.round(H * scale);

  const outCanvas = document.createElement('canvas');
  outCanvas.width = canvasW;
  outCanvas.height = canvasH;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return null;

  const outImg = outCtx.createImageData(canvasW, canvasH);
  const dst = outImg.data;
  dst.fill(255);

  let curOutX = gutter;
  const stripBounds: Array<{ side: 'L' | 'R'; outX0: number; outX1: number }> = [];

  for (let si = 0; si < strips.length; si += 1) {
    const st = strips[si];
    const dw = stripWidths[si];
    stripBounds.push({ side: st.side, outX0: curOutX, outX1: curOutX + dw });

    const yMin = Math.round(H * 0.18 * scale);
    const yMax = Math.min(canvasH, Math.round(H * 0.89 * scale));
    for (let dy = yMin; dy < yMax; dy += 1) {
      const fy = dy / scale;
      const y0 = Math.floor(fy);
      const y1 = Math.min(H - 1, y0 + 1);
      const wy = fy - y0;

      for (let dx = 0; dx < dw; dx += 1) {
        const fx = st.x0 + dx / scale;
        const x0 = Math.min(W - 1, Math.max(0, Math.floor(fx)));
        const x1 = Math.min(W - 1, x0 + 1);
        const wx = fx - x0;

        const sampleLum = (px: number, py: number) => {
          const idx = (py * W + px) * 4;
          return (
            0.45 * rgba[idx] + 0.45 * rgba[idx + 1] + 0.1 * rgba[idx + 2]
          );
        };

        const v =
          (sampleLum(x0, y0) * (1 - wx) + sampleLum(x1, y0) * wx) * (1 - wy) +
          (sampleLum(x0, y1) * (1 - wx) + sampleLum(x1, y1) * wx) * wy;
        const norm = Math.max(0, Math.min(1, (v - 105) / (215 - 105)));
        const ink = Math.round(255 * (1 - norm));
        const outIdx = (dy * canvasW + (curOutX + dx)) * 4;
        dst[outIdx] = ink;
        dst[outIdx + 1] = ink;
        dst[outIdx + 2] = ink;
        dst[outIdx + 3] = 255;
      }
    }
    curOutX += dw + gutter;
  }

  outCtx.putImageData(outImg, 0, 0);
  return { cards, nameCompositeCanvas: outCanvas, scale, stripBounds };
}

// ============================================================================
// Generic Bounding-Box Fallback Parser (for synthetic tests & custom scoreboards)
// ============================================================================

interface NormalizedLine {
  ny: number;
  minY: number;
  maxY: number;
  words: Array<{
    text: string;
    nx0: number;
    nx1: number;
    nxCenter: number;
    confidence: number;
  }>;
}

function parseRankBadgeToken(raw: string, maxTeams: number): number | null {
  const cleaned = raw
    .trim()
    .replace(/^[#№]+/, '')
    .replace(/(?:st|nd|rd|th)$/i, '')
    .replace(/[.:)\]]+$/, '');
  if (!/^\d{1,2}$/.test(cleaned)) return null;
  const val = parseInt(cleaned, 10);
  if (val >= 1 && val <= maxTeams) return val;
  return null;
}

function parseKillInteger(raw: string): number | null {
  const cleaned = raw
    .trim()
    .replace(/(?:eliminations?|elims?|kills?)$/i, '')
    .trim();
  if (!/^\d{1,2}$/.test(cleaned)) return null;
  const val = parseInt(cleaned, 10);
  return val >= 0 && val <= 48 ? val : null;
}

function clusterNormalizedLines(
  words: Array<{
    text: string;
    nx0: number;
    ny0: number;
    nx1: number;
    ny1: number;
    confidence: number;
  }>
): NormalizedLine[] {
  if (words.length === 0) return [];
  const sorted = [...words].sort(
    (a, b) => (a.ny0 + a.ny1) / 2 - (b.ny0 + b.ny1) / 2
  );
  const lines: NormalizedLine[] = [];

  for (const w of sorted) {
    const wy = (w.ny0 + w.ny1) / 2;
    const wh = Math.max(0.012, w.ny1 - w.ny0);
    const tol = Math.max(0.016, wh * 0.68);
    const existing = lines.find((ln) => Math.abs(ln.ny - wy) <= tol);
    const item = {
      text: w.text,
      nx0: w.nx0,
      nx1: w.nx1,
      nxCenter: (w.nx0 + w.nx1) / 2,
      confidence: w.confidence,
    };

    if (existing) {
      existing.words.push(item);
      existing.minY = Math.min(existing.minY, w.ny0);
      existing.maxY = Math.max(existing.maxY, w.ny1);
      existing.ny = (existing.minY + existing.maxY) / 2;
    } else {
      lines.push({
        ny: wy,
        minY: w.ny0,
        maxY: w.ny1,
        words: [item],
      });
    }
  }

  for (const ln of lines) {
    ln.words.sort((a, b) => a.nx0 - b.nx0);
  }
  return lines.sort((a, b) => a.ny - b.ny);
}

function parseSingleColumnLines(
  lines: NormalizedLine[],
  maxTeams: number,
  sourceImageIndex: number
): ScannedRankRow[] {
  if (lines.length === 0) return [];

  const anchors: Array<{ lineIdx: number; rank: number }> = [];
  for (let i = 0; i < lines.length; i += 1) {
    const ln = lines[i];
    const leftWords = ln.words.filter((w) => w.nx0 <= 0.24);
    for (const w of leftWords) {
      const r = parseRankBadgeToken(w.text, maxTeams);
      if (r !== null) {
        if (anchors.length === 0 || anchors[anchors.length - 1].rank !== r) {
          anchors.push({ lineIdx: i, rank: r });
        }
        break;
      }
    }
  }

  if (anchors.length === 0) return [];

  const rows: ScannedRankRow[] = [];
  for (let a = 0; a < anchors.length; a += 1) {
    const startIdx = anchors[a].lineIdx;
    const endIdx =
      a + 1 < anchors.length
        ? anchors[a + 1].lineIdx - 1
        : Math.min(lines.length - 1, startIdx + 4);
    const rank = anchors[a].rank;
    const slice = lines.slice(startIdx, endIdx + 1);

    const playerWords: string[] = [];
    const perLineKills: number[] = [];
    let confSum = 0;
    let confCount = 0;
    let minY = 1;
    let maxY = 0;

    for (let sIdx = 0; sIdx < slice.length; sIdx += 1) {
      const ln = slice[sIdx];
      minY = Math.min(minY, ln.minY);
      maxY = Math.max(maxY, ln.maxY);

      let lineKill: number | null = null;
      for (let wIdx = ln.words.length - 1; wIdx >= 0; wIdx -= 1) {
        const w = ln.words[wIdx];
        if (w.nxCenter >= 0.56) {
          const k = parseKillInteger(w.text);
          if (k !== null) {
            lineKill = k;
            break;
          }
        }
      }
      if (lineKill !== null && perLineKills.length < 4) {
        perLineKills.push(lineKill);
      }

      for (const w of ln.words) {
        if (
          sIdx === 0 &&
          w.nx0 <= 0.18 &&
          parseRankBadgeToken(w.text, maxTeams) === rank
        ) {
          continue;
        }
        if (w.nxCenter >= 0.68 && parseKillInteger(w.text) !== null) {
          continue;
        }
        if (/^eliminat/i.test(w.text.trim())) continue;
        playerWords.push(w.text);
        confSum += w.confidence;
        confCount += 1;
      }
    }

    const totalKills = perLineKills.reduce((acc, v) => acc + v, 0);
    const rawPlayerText = playerWords.join(' ').trim();
    const tokens = extractIgnTokens(rawPlayerText);
    const isEdgeClipped = minY < 0.045 || maxY > 0.955;

    rows.push({
      rank,
      kills: totalKills,
      rawPlayerText,
      normalizedTokens: tokens,
      confidence: confCount > 0 ? confSum / confCount : 60,
      isEdgeClipped,
      sourceImageIndex,
    });
  }

  return rows;
}

export function parseOcrElementsToRows(
  boxes: OcrWordBox[],
  imageWidth: number,
  imageHeight: number,
  maxTeams = 12,
  sourceImageIndex = 0
): ScannedRankRow[] {
  const safeW = Math.max(1, imageWidth);
  const safeH = Math.max(1, imageHeight);

  const normWords = boxes
    .filter((b) => b.text && b.text.trim().length > 0)
    .map((b) => ({
      text: b.text.trim(),
      nx0: Math.max(0, Math.min(1, b.x0 / safeW)),
      ny0: Math.max(0, Math.min(1, b.y0 / safeH)),
      nx1: Math.max(0, Math.min(1, b.x1 / safeW)),
      ny1: Math.max(0, Math.min(1, b.y1 / safeH)),
      confidence: b.confidence ?? 75,
    }))
    .filter((w) => {
      const cy = (w.ny0 + w.ny1) / 2;
      return cy >= 0.06 && cy <= 0.96;
    });

  if (normWords.length === 0) return [];

  const leftRankHits = normWords.filter(
    (w) => w.nx0 <= 0.22 && parseRankBadgeToken(w.text, maxTeams) !== null
  ).length;
  const midRankHits = normWords.filter(
    (w) =>
      w.nx0 >= 0.45 &&
      w.nx0 <= 0.65 &&
      parseRankBadgeToken(w.text, maxTeams) !== null
  ).length;

  if (leftRankHits >= 1 && midRankHits >= 2) {
    const leftWords = normWords
      .filter((w) => (w.nx0 + w.nx1) / 2 < 0.5)
      .map((w) => ({
        ...w,
        nx0: w.nx0 / 0.5,
        nx1: Math.min(1, w.nx1 / 0.5),
      }));
    const rightWords = normWords
      .filter((w) => (w.nx0 + w.nx1) / 2 >= 0.5)
      .map((w) => ({
        ...w,
        nx0: Math.max(0, (w.nx0 - 0.5) / 0.5),
        nx1: Math.min(1, (w.nx1 - 0.5) / 0.5),
      }));

    return [
      ...parseSingleColumnLines(
        clusterNormalizedLines(leftWords),
        maxTeams,
        sourceImageIndex
      ),
      ...parseSingleColumnLines(
        clusterNormalizedLines(rightWords),
        maxTeams,
        sourceImageIndex
      ),
    ].sort((a, b) => a.rank - b.rank);
  }

  return parseSingleColumnLines(
    clusterNormalizedLines(normWords),
    maxTeams,
    sourceImageIndex
  );
}

/**
 * Deduplicates overlapping ranks across 1-3 scrolled screenshots (e.g. #1-#11 + #8-#12).
 * Prefers unclipped interior rows over scroll-edge-clipped rows and never double-counts kills.
 */
export function mergeAndDeduplicateScans(
  scansPerImage: ScannedRankRow[][],
  maxTeams = 12
): ScannedRankRow[] {
  const byRank = new Map<number, ScannedRankRow>();

  for (const rows of scansPerImage) {
    for (const row of rows) {
      if (row.rank < 1 || row.rank > maxTeams) continue;
      const existing = byRank.get(row.rank);
      if (!existing) {
        byRank.set(row.rank, row);
        continue;
      }

      const incomingBetter =
        (existing.isEdgeClipped && !row.isEdgeClipped) ||
        (existing.isEdgeClipped === row.isEdgeClipped &&
          row.normalizedTokens.length > existing.normalizedTokens.length);

      const primary = incomingBetter ? row : existing;
      const secondary = incomingBetter ? existing : row;

      const mergedTokens = Array.from(
        new Set([...existing.normalizedTokens, ...row.normalizedTokens])
      );

      byRank.set(row.rank, {
        ...primary,
        rawPlayerText:
          primary.rawPlayerText.length >= secondary.rawPlayerText.length
            ? primary.rawPlayerText
            : secondary.rawPlayerText,
        normalizedTokens: mergedTokens,
        confidence: Math.max(existing.confidence, row.confidence),
        isEdgeClipped: existing.isEdgeClipped && row.isEdgeClipped,
      });
    }
  }

  return Array.from(byRank.values()).sort((a, b) => a.rank - b.rank);
}

/**
 * Greedy bipartite matching (highest similarity pairs first) so no two ranks claim the same squad.
 */
export function matchScannedRowsToTeams(
  rows: ScannedRankRow[],
  teams: Team[]
): MatchedScanRow[] {
  const candidatePairs: Array<{
    rowIdx: number;
    teamId: string;
    score: number;
    keyword?: string;
  }> = [];

  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r];
    for (const team of teams) {
      const { score, matchedKeyword } = scoreSquadAgainstTokens(
        row.normalizedTokens,
        team
      );
      if (score >= 0.68) {
        candidatePairs.push({
          rowIdx: r,
          teamId: team.id,
          score,
          keyword: matchedKeyword,
        });
      }
    }
  }

  candidatePairs.sort((a, b) => b.score - a.score);

  const assignedRow = new Set<number>();
  const assignedTeam = new Set<string>();
  const rowAssignments = new Map<
    number,
    { teamId: string; score: number; keyword?: string }
  >();

  for (const pair of candidatePairs) {
    if (assignedRow.has(pair.rowIdx) || assignedTeam.has(pair.teamId)) continue;
    assignedRow.add(pair.rowIdx);
    assignedTeam.add(pair.teamId);
    rowAssignments.set(pair.rowIdx, {
      teamId: pair.teamId,
      score: pair.score,
      keyword: pair.keyword,
    });
  }

  if (
    rows.length === teams.length &&
    rows.length - assignedRow.size === 1 &&
    teams.length - assignedTeam.size === 1
  ) {
    const remainingRowIdx = rows.findIndex((_, idx) => !assignedRow.has(idx));
    const remainingTeam = teams.find((t) => !assignedTeam.has(t.id));
    if (remainingRowIdx >= 0 && remainingTeam) {
      rowAssignments.set(remainingRowIdx, {
        teamId: remainingTeam.id,
        score: 0.7,
        keyword: 'last-remaining-squad',
      });
    }
  }

  return rows.map((row, idx) => {
    const match = rowAssignments.get(idx);
    return {
      ...row,
      matchedTeamId: match?.teamId ?? null,
      matchConfidence: match?.score ?? 0,
      matchedKeyword: match?.keyword,
    };
  });
}

export function extractLearnableTokens(
  row: Pick<ScannedRankRow, 'normalizedTokens'>
): string[] {
  return row.normalizedTokens
    .filter((t) => t.length >= 3 && t.length <= 24 && !/^\d+$/.test(t))
    .slice(0, 10);
}

async function decodeImagePixels(
  file: File
): Promise<{
  rgba: Uint8ClampedArray;
  width: number;
  height: number;
  fallbackCanvas: HTMLCanvasElement;
}> {
  const bitmapUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not decode screenshot image'));
      el.src = bitmapUrl;
    });

    // Normalize high-res screenshots to height <= 600 for fast, consistent grid geometry
    const scaleDown = img.naturalHeight > 640 ? 540 / img.naturalHeight : 1;
    const width = Math.max(1, Math.round(img.naturalWidth * scaleDown));
    const height = Math.max(1, Math.round(img.naturalHeight * scaleDown));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(img, 0, 0, width, height);
    const imgData = ctx.getImageData(0, 0, width, height);
    return { rgba: imgData.data, width, height, fallbackCanvas: canvas };
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

/**
 * Runs 100% Free Offline OCR + Free Fire Pixel Scoreboard Grid Analysis across 1-3 screenshots.
 */
export async function scanMatchScreenshotsOffline(
  files: File[],
  teams: Team[],
  onProgress?: (statusText: string, progressFraction: number) => void
): Promise<MatchedScanRow[]> {
  if (files.length === 0) return [];

  onProgress?.('Loading offline OCR engine...', 0.06);
  const Tesseract = await import('tesseract.js');
  const worker = await Tesseract.createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        onProgress?.('Reading player IGNs offline...', 0.2 + m.progress * 0.72);
      }
    },
  });

  try {
    await worker.setParameters({ tessedit_pageseg_mode: '6' as never });
    const scansPerImage: ScannedRankRow[][] = [];
    const maxTeams = Math.max(12, teams.length);

    for (let i = 0; i < files.length; i += 1) {
      onProgress?.(
        `Analyzing screenshot ${i + 1} of ${files.length}...`,
        (i + 0.15) / files.length
      );
      const { rgba, width, height, fallbackCanvas } = await decodeImagePixels(
        files[i]
      );

      const grid = detectFreeFireGridAndBuildNameCanvas(rgba, width, height);
      if (grid) {
        const result = await worker.recognize(
          grid.nameCompositeCanvas,
          {},
          { text: true, blocks: true }
        );

        for (const block of result.data.blocks || []) {
          for (const para of block.paragraphs || []) {
            for (const line of para.lines || []) {
              for (const word of line.words || []) {
                const wcx = (word.bbox.x0 + word.bbox.x1) / 2;
                const origY = (word.bbox.y0 + word.bbox.y1) / 2 / grid.scale;
                const st = grid.stripBounds.find(
                  (b) => wcx >= b.outX0 - 15 && wcx <= b.outX1 + 15
                );
                if (!st) continue;
                const card = grid.cards.find(
                  (c) =>
                    c.side === st.side &&
                    origY >= c.y0 - 6 &&
                    origY <= c.y1 + 6
                );
                if (card) card.words.push(word.text);
              }
            }
          }
        }

        const parsedRows: ScannedRankRow[] = grid.cards.map((c) => {
          const rawPlayerText = c.words.join(' ').trim();
          return {
            rank: c.rank,
            kills: c.kills,
            rawPlayerText,
            normalizedTokens: extractIgnTokens(rawPlayerText),
            confidence: 90,
            isEdgeClipped: c.clipped,
            sourceImageIndex: i,
          };
        });
        scansPerImage.push(parsedRows);
      } else {
        // Fallback for custom non-Free-Fire screenshots
        const result = await worker.recognize(
          fallbackCanvas,
          {},
          { text: true, blocks: true }
        );
        const wordBoxes: OcrWordBox[] = [];
        for (const block of result.data.blocks || []) {
          for (const para of block.paragraphs || []) {
            for (const line of para.lines || []) {
              for (const word of line.words || []) {
                wordBoxes.push({
                  text: word.text,
                  x0: word.bbox.x0,
                  y0: word.bbox.y0,
                  x1: word.bbox.x1,
                  y1: word.bbox.y1,
                  confidence: word.confidence ?? 80,
                });
              }
            }
          }
        }
        scansPerImage.push(
          parseOcrElementsToRows(wordBoxes, width, height, maxTeams, i)
        );
      }
    }

    onProgress?.('Matching squads & deduplicating ranks...', 0.96);
    const deduplicated = mergeAndDeduplicateScans(scansPerImage, maxTeams);
    const matched = matchScannedRowsToTeams(deduplicated, teams);
    onProgress?.('Scan complete', 1);
    return matched;
  } finally {
    await worker.terminate();
  }
}
