import type { Team } from '../types/tournament';
import { FF_DIGIT_CNN_B64, FF_DIGIT_CNN_SCALES } from './ffDigitCnnWeights';

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
  '\u0391': 'a', '\u0410': 'a', '\u13AA': 'a', '\u039B': 'a', '\u03B1': 'a', '\u0430': 'a', '\u20B3': 'a', '\u0245': 'a', '\u028C': 'a', '\u0E14': 'a',
  '\u0392': 'b', '\u0412': 'b', '\u0299': 'b', '\u0432': 'b', '\u0E3F': 'b', '\u20BF': 'b', '\u00DF': 'b',
  '\u0421': 'c', '\u13DF': 'c', '\u1D04': 'c', '\u0441': 'c', '\u00A2': 'c', '\u20B5': 'c',
  '\u13A0': 'd', '\u1D05': 'd', '\u010E': 'd', '\u0110': 'd', '\u0111': 'd',
  '\u0395': 'e', '\u0415': 'e', '\u13AC': 'e', '\u1D07': 'e', '\u0435': 'e', '\u03B5': 'e', '\u20AC': 'e', '\u0246': 'e', '\u0247': 'e',
  '\u0492': 'f', '\uA730': 'f', '\u0493': 'f',
  '\u0262': 'g', '\u13C0': 'g', '\u20B2': 'g',
  '\u0397': 'h', '\u041D': 'h', '\u13BB': 'h', '\u029C': 'h', '\u043D': 'h', '\u20B4': 'h',
  '\u0399': 'i', '\u0406': 'i', '\u0407': 'i', '\u026A': 'i', '\u0456': 'i', '\u0457': 'i', '\u00A1': 'i',
  '\u0408': 'j', '\u1D0A': 'j', '\u0458': 'j', '\u2111': 'j',
  '\u039A': 'k', '\u041A': 'k', '\u1D0B': 'k', '\u043A': 'k', '\u20AD': 'k',
  '\u13DE': 'l', '\u029F': 'l', '\u0141': 'l', '\u0142': 'l', '\u00A3': 'l',
  '\u039C': 'm', '\u041C': 'm', '\u13B7': 'm', '\u1D0D': 'm', '\u043C': 'm', '\u20BC': 'm',
  '\u039D': 'n', '\u0274': 'n', '\u0418': 'n', '\u0438': 'n', '\u20A6': 'n',
  '\u039F': 'o', '\u041E': 'o', '\u00D8': 'o', '\u00F8': 'o', '\u1D0F': 'o', '\u043E': 'o', '\u04E8': 'o', '\u04E9': 'o',
  '\u03A1': 'p', '\u0420': 'p', '\u1D18': 'p', '\u0440': 'p', '\u20B1': 'p',
  '\u042F': 'r', '\u0280': 'r', '\u13D2': 'r', '\u044F': 'r', '\u20B9': 'r', '\u20BD': 'r',
  '\u0405': 's', '\u13DA': 's', '\uA731': 's', '\u0455': 's', '$': 's',
  '\u03A4': 't', '\u0422': 't', '\u1D1B': 't', '\u0442': 't', '\u20AE': 't', '\u20B8': 't', '\u20BA': 't',
  '\u054D': 'u', '\u1D1C': 'u', '\u03C5': 'u', '\u0244': 'u', '\u0289': 'u',
  '\u0474': 'v', '\u1D20': 'v', '\u0475': 'v',
  '\u13B3': 'w', '\u1D21': 'w', '\u03C9': 'w', '\u20A9': 'w',
  '\u03A7': 'x', '\u0425': 'x', '\u0445': 'x',
  '\u03A5': 'y', '\u0423': 'y', '\u028F': 'y', '\u0443': 'y', '\u00A5': 'y', '\u024E': 'y', '\u024F': 'y',
  '\u0396': 'z', '\u1D22': 'z',
  // Common Free Fire clan/separator ornaments -> space so adjacent words split cleanly
  '\u30E1': ' ', '\u30C4': ' ',
  '\u4E42': ' ', '\u4E45': ' ', '\u534D': ' ', '\u3005': ' ', '\u4E95': ' ',
  '\u0F3A': ' ', '\u0F3B': ' ', '\u0F12': ' ', '\u262C': ' ', '\u20DD': ' ',
  '\u2020': ' ', '\u2021': ' ', '\uA9C1': ' ', '\uA9C2': ' ',
  '\u2122': ' ', '\u00AE': ' ', // TM / Registered symbols between clan tag and IGN (e.g. Lg\u2122Slyam)
};

function preMapHomoglyphs(raw: string): string {
  if (!raw) return '';
  let preMapped = '';
  for (const ch of raw) {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp >= 0x24b6 && cp <= 0x24cf) {
      preMapped += `${String.fromCharCode(0x61 + (cp - 0x24b6))} `;
      continue;
    }
    if (cp >= 0x24d0 && cp <= 0x24e9) {
      preMapped += `${String.fromCharCode(0x61 + (cp - 0x24d0))} `;
      continue;
    }
    if (cp >= 0x2776 && cp <= 0x277e) {
      preMapped += String(cp - 0x2775);
      continue;
    }
    if (cp >= 0x2780 && cp <= 0x2788) {
      preMapped += String(cp - 0x277f);
      continue;
    }
    if (cp >= 0x278a && cp <= 0x2792) {
      preMapped += String(cp - 0x2789);
      continue;
    }
    preMapped += HOMOGLYPH_MAP[ch] !== undefined ? HOMOGLYPH_MAP[ch] : ch;
  }
  const decomposed = preMapped
    .normalize('NFKD')
    .replace(/[\u0300-\u036f\u20dd-\u20e0]/g, '');
  let mapped = '';
  for (const ch of decomposed) {
    mapped += HOMOGLYPH_MAP[ch] !== undefined ? HOMOGLYPH_MAP[ch] : ch.toLowerCase();
  }
  return mapped;
}

/**
 * Expands inline symbol-leet commonly used inside Free Fire IGNs (e.g. @ -> a,
 * medial !/|/' between letters/digits -> i as in M!TUN, N@B!L, KRK-R!F4T10)
 * without polluting trailing decorative exclamation marks (e.g. PETRO!!).
 */
function expandInlineSymbolLeet(raw: string): string {
  if (!raw) return '';
  return preMapHomoglyphs(raw)
    .replace(/@/g, 'a')
    .replace(/([a-z0-9])[!|'\u00A1]+([a-z0-9])/g, '$1i$2')
    .replace(/([a-z0-9.])\?(?=\s|$)/g, '$17')
    .replace(/(^|\s)!(?=[a-z])/g, '$1 ');
}

/**
 * Folds stylized Free Fire IGNs (superscripts, fullwidth, math bold, homoglyphs, ornaments)
 * into clean lowercase alphanumeric words.
 */
export function normalizeFreeFireIgn(raw: string): string {
  if (!raw) return '';
  const mapped = preMapHomoglyphs(raw);

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

const NOISE_FRAGMENT_RE = /^(?:eliminations?|elims?|ations?|tions?|ions?|ons?|ns|ws|is)$/i;

/**
 * Extracts distinct searchable word tokens (plus inline-symbol-leet variants, alpha stems,
 * x-clan splits, and adjacent pairs/triplets so clan+name match with or without '-' / '.').
 */
export function extractIgnTokens(raw: string): string[] {
  if (!raw) return [];
  const variants = new Set<string>();
  const baseNorm = normalizeFreeFireIgn(raw);
  if (baseNorm) variants.add(baseNorm);

  const leetNorm = normalizeFreeFireIgn(expandInlineSymbolLeet(raw));
  if (leetNorm) variants.add(leetNorm);

  // Split uppercase clan + lowercase 'x' + uppercase name (e.g. EXOSxF4RDIN -> EXOS F4RDIN)
  const xSplit = raw.replace(/([A-Z0-9]{2,5})x([A-Z0-9]{2,})/g, '$1 $2');
  if (xSplit !== raw) {
    const xNorm = normalizeFreeFireIgn(expandInlineSymbolLeet(xSplit));
    if (xNorm) variants.add(xNorm);
  }

  const set = new Set<string>();
  for (const norm of variants) {
    const rawWords = norm
      .split(' ')
      .filter((w) => w.length > 0 && !NOISE_FRAGMENT_RE.test(w));
    const parts = rawWords.filter((p) => p.length >= 2 && !/^\d+$/.test(p));
    for (const p of parts) {
      set.add(p);
      // Alpha stem stripping trailing digits / x-suffix (e.g. ksndrax1 -> ksndra, rifat9x -> rifat)
      const stem = p.replace(/(?:x?\d+|\d+x)$/, '');
      if (stem.length >= 4 && stem !== p) {
        set.add(stem);
      }
      // Strip accidental 1-2 char "Eliminations" suffix overlap on tight right-column crops
      if (p.length >= 5 && /^(?:ns|ws|ms|s|w|n|v)/.test(p)) {
        const debleed2 = p.replace(/^(?:ns|ws|ms)/, '');
        if (debleed2.length >= 4 && debleed2 !== p) set.add(debleed2);
        const debleed1 = p.slice(1);
        if (debleed1.length >= 4) set.add(debleed1);
      }
    }

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
  }
  return Array.from(set);
}

/**
 * Folds common Free Fire leet digits & OCR confusions
 * (0->o, 1/l/!->i, 5->s, 4->a, 8->b, 6->g, 3->e, 2->z, 7->t).
 */
function foldOcrAndLeet(s: string): string {
  return s
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/[1l|!\u00A1]/g, 'i')
    .replace(/5/g, 's')
    .replace(/4/g, 'a')
    .replace(/8/g, 'b')
    .replace(/6/g, 'g')
    .replace(/3/g, 'e')
    .replace(/2/g, 'z')
    .replace(/7/g, 't')
    .replace(/[^a-z0-9]/g, '');
}

const OCR_SIMILAR_COSTS = new Map<string, number>();
(function initOcrSimilarCosts() {
  const addGroup = (chars: string, cost: number) => {
    for (let i = 0; i < chars.length; i += 1) {
      for (let j = i + 1; j < chars.length; j += 1) {
        const k1 = chars[i] + chars[j];
        const k2 = chars[j] + chars[i];
        OCR_SIMILAR_COSTS.set(k1, Math.min(cost, OCR_SIMILAR_COSTS.get(k1) ?? 1));
        OCR_SIMILAR_COSTS.set(k2, Math.min(cost, OCR_SIMILAR_COSTS.get(k2) ?? 1));
      }
    }
  };
  addGroup('odquc', 0.32);  // O <-> D <-> Q <-> U <-> C (ALOM/ALDM, ORK/DRK)
  addGroup('kxhr', 0.35);   // K <-> X <-> H <-> R (RYKER/RYXER, RHK/RMK)
  addGroup('aeo', 0.38);    // A <-> E <-> O (NABIL/NEBL, MOWAJ/MBWAJ)
  addGroup('mnwh', 0.38);   // M <-> N <-> W <-> H (FAHIM/FAMINE)
  addGroup('iltyvj', 0.35); // I <-> L <-> T <-> Y <-> V (ALVI/ALW, SIYAM/SKYAM)
  addGroup('bprd', 0.38);   // B <-> P <-> R <-> D
  addGroup('uvwy', 0.35);   // U <-> V <-> W <-> Y
  addGroup('ft', 0.35);     // F <-> T
  addGroup('sz', 0.35);     // S <-> Z
  addGroup('bs', 0.42);     // B <-> S (8/B/S condensed font)
  addGroup('tr', 0.4);      // T <-> R
})();

const OCR_COST_TABLE = new Float64Array(128 * 128).fill(1.0);
for (let c = 0; c < 128; c += 1) OCR_COST_TABLE[c * 128 + c] = 0;
OCR_SIMILAR_COSTS.forEach((cost, pair) => {
  const c0 = pair.charCodeAt(0);
  const c1 = pair.charCodeAt(1);
  if (c0 < 128 && c1 < 128) OCR_COST_TABLE[c0 * 128 + c1] = cost;
});

function isAsciiVowelCode(cu: number): boolean {
  return cu === 97 || cu === 101 || cu === 105 || cu === 111 || cu === 117;
}

let dpScratch = new Float64Array(4096);

/**
 * Weighted OCR Damerau-Levenshtein distance: handles adjacent transpositions
 * ("filcker" <-> "flicker") and visual Free Fire font confusions ("ORK" <-> "DRK",
 * "RYXER" <-> "RYKER", dropped stylized vowels) accurately for single-name setups.
 */
function weightedDamerauLevenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  const stride = lb + 1;
  const needed = (la + 1) * stride;
  if (dpScratch.length < needed) {
    dpScratch = new Float64Array(Math.max(needed, dpScratch.length * 2));
  }
  const dp = dpScratch;

  for (let i = 0; i <= la; i += 1) dp[i * stride] = i * 0.85;
  for (let j = 0; j <= lb; j += 1) dp[j] = j * 0.85;

  for (let i = 1; i <= la; i += 1) {
    const ca = a.charCodeAt(i - 1);
    const delCost = isAsciiVowelCode(ca) ? 0.65 : 0.85;
    const rowOff = i * stride;
    const prevOff = (i - 1) * stride;
    for (let j = 1; j <= lb; j += 1) {
      const cb = b.charCodeAt(j - 1);
      const subCost =
        ca === cb
          ? 0
          : ca < 128 && cb < 128
            ? OCR_COST_TABLE[ca * 128 + cb]
            : 1.0;
      const insCost = isAsciiVowelCode(cb) ? 0.65 : 0.85;
      const d1 = dp[prevOff + j] + delCost;
      const d2 = dp[rowOff + j - 1] + insCost;
      const d3 = dp[prevOff + j - 1] + subCost;
      let val = d1 < d2 ? (d1 < d3 ? d1 : d3) : d2 < d3 ? d2 : d3;
      if (
        i > 1 &&
        j > 1 &&
        ca === b.charCodeAt(j - 2) &&
        a.charCodeAt(i - 2) === cb
      ) {
        const tr = dp[(i - 2) * stride + (j - 2)] + 0.45;
        if (tr < val) val = tr;
      }
      dp[rowOff + j] = val;
    }
  }
  return dp[la * stride + lb];
}

const FOLDED_VARIANTS_CACHE = new Map<string, string[]>();

function getFoldedVariants(raw: string): string[] {
  const cached = FOLDED_VARIANTS_CACHE.get(raw);
  if (cached !== undefined) return cached;
  const computed = Array.from(
    new Set(
      [
        foldOcrAndLeet(normalizeFreeFireIgn(expandInlineSymbolLeet(raw))),
        foldOcrAndLeet(normalizeFreeFireIgn(raw)),
      ].filter(Boolean)
    )
  );
  if (FOLDED_VARIANTS_CACHE.size > 4096) {
    FOLDED_VARIANTS_CACHE.clear();
  }
  FOLDED_VARIANTS_CACHE.set(raw, computed);
  return computed;
}

export function ocrFuzzySimilarity(
  candidateToken: string,
  keywordRaw: string
): number {
  const kwVariants = getFoldedVariants(keywordRaw);
  const candVariants = getFoldedVariants(candidateToken);
  if (kwVariants.length === 0 || candVariants.length === 0) return 0;

  let bestOverall = 0;
  for (const kw of kwVariants) {
    for (const cand of candVariants) {
      if (cand === kw) return 1;
      if (kw.length >= 3 && cand.includes(kw)) {
        bestOverall = Math.max(bestOverall, 0.96);
        continue;
      }
      if (cand.length >= 4 && kw.includes(cand)) {
        bestOverall = Math.max(
          bestOverall,
          Math.min(0.92, cand.length / kw.length + 0.22)
        );
      }

      if (cand.length > kw.length && kw.length >= 3) {
        let bestSlice = 0;
        for (let start = 0; start <= cand.length - kw.length; start += 1) {
          const slice = cand.slice(start, start + kw.length);
          const dist = weightedDamerauLevenshtein(slice, kw);
          const sim = 1 - dist / kw.length;
          if (sim > bestSlice) bestSlice = sim;
        }
        if (bestSlice >= 0.75) {
          bestOverall = Math.max(bestOverall, bestSlice * 0.95);
        }
      }

      const maxLen = Math.max(cand.length, kw.length);
      if (maxLen >= 3) {
        const dist = weightedDamerauLevenshtein(cand, kw);
        bestOverall = Math.max(bestOverall, Math.max(0, 1 - dist / maxLen));
      }
    }
  }
  return bestOverall;
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

    const normLeet = normalizeFreeFireIgn(expandInlineSymbolLeet(clean));
    const collapsed = normLeet.replace(/\s+/g, '');
    const collapsedStem = collapsed.replace(/(?:x?\d+|\d+x)$/, '');
    if (collapsedStem.length >= 4 && collapsedStem !== collapsed) {
      primaryKeywords.push({ label: collapsedStem, weight: baseWeight * 0.96 });
    }

    // Index individual distinct word parts >= 4 chars (longer unique names weighted above 4-char clan prefixes)
    const subParts = normLeet
      .split(' ')
      .filter((w) => w.length >= 4 && !/^\d+$/.test(w));
    for (const sp of subParts) {
      const partWeight = sp.length >= 5 ? baseWeight * 0.95 : baseWeight * 0.89;
      if (sp !== collapsed) {
        primaryKeywords.push({ label: sp, weight: partWeight });
      }
      const spStem = sp.replace(/(?:x?\d+|\d+x)$/, '');
      if (spStem.length >= 4 && spStem !== sp) {
        primaryKeywords.push({ label: spStem, weight: partWeight * 0.98 });
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
    if (kwBest >= 0.7) {
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
// Dedicated Free Fire Neural Digit & Position CNN (16x20 Aspect-Preserving)
// Architecture: Input(1x20x16) -> Conv3x3(12)+ReLU -> MaxPool2x2
//               -> Conv3x3(24)+ReLU -> MaxPool2x2 -> FC(48)+ReLU -> FC(10)
// ============================================================================

const CNN_GW = 16;
const CNN_GH = 20;
const CNN_C1 = 12;
const CNN_C2 = 24;
const CNN_H1 = 10;
const CNN_W1 = 8;
const CNN_H2 = 5;
const CNN_W2 = 4;
const CNN_FLAT = CNN_C2 * CNN_H2 * CNN_W2; // 480
const CNN_HID = 48;
const CNN_CLS = 10;

interface DecodedDigitCnn {
  w1: Float32Array;
  b1: Float32Array;
  w2: Float32Array;
  b2: Float32Array;
  w3: Float32Array;
  b3: Float32Array;
  w4: Float32Array;
  b4: Float32Array;
}

let cachedDigitCnn: DecodedDigitCnn | null = null;
const cnnPool1Scratch = new Float32Array(CNN_C1 * CNN_H1 * CNN_W1);
const cnnPool2Scratch = new Float32Array(CNN_FLAT);
const cnnHidScratch = new Float32Array(CNN_HID);

function getDigitCnn(): DecodedDigitCnn {
  if (cachedDigitCnn) return cachedDigitCnn;
  const bin = atob(FF_DIGIT_CNN_B64);
  const lens = [
    CNN_C1 * 9,
    CNN_C1,
    CNN_C2 * CNN_C1 * 9,
    CNN_C2,
    CNN_HID * CNN_FLAT,
    CNN_HID,
    CNN_CLS * CNN_HID,
    CNN_CLS,
  ];
  let offset = 0;
  const tensors = lens.map((len, idx) => {
    const scale = FF_DIGIT_CNN_SCALES[idx];
    const out = new Float32Array(len);
    for (let i = 0; i < len; i += 1) {
      const byte = bin.charCodeAt(offset + i);
      const signed = byte > 127 ? byte - 256 : byte;
      out[i] = signed * scale;
    }
    offset += len;
    return out;
  });
  cachedDigitCnn = {
    w1: tensors[0],
    b1: tensors[1],
    w2: tensors[2],
    b2: tensors[3],
    w3: tensors[4],
    b3: tensors[5],
    w4: tensors[6],
    b4: tensors[7],
  };
  return cachedDigitCnn;
}

function classifyGlyphCnn16x20(x: Float32Array): number {
  const net = getDigitCnn();

  // Conv1 (3x3, pad=1) + ReLU + MaxPool1 (2x2) -> 12x10x8
  for (let oc = 0; oc < CNN_C1; oc += 1) {
    const wOff = oc * 9;
    const bias = net.b1[oc];
    for (let py = 0; py < CNN_H1; py += 1) {
      for (let px = 0; px < CNN_W1; px += 1) {
        let best = 0;
        for (let dy = 0; dy < 2; dy += 1) {
          const y = py * 2 + dy;
          for (let dx = 0; dx < 2; dx += 1) {
            const xx = px * 2 + dx;
            let s = bias;
            for (let ky = -1; ky <= 1; ky += 1) {
              const iy = y + ky;
              if (iy < 0 || iy >= CNN_GH) continue;
              const kRow = (ky + 1) * 3;
              for (let kx = -1; kx <= 1; kx += 1) {
                const ix = xx + kx;
                if (ix < 0 || ix >= CNN_GW) continue;
                s += x[iy * CNN_GW + ix] * net.w1[wOff + kRow + (kx + 1)];
              }
            }
            if (s > best) best = s;
          }
        }
        cnnPool1Scratch[(oc * CNN_H1 + py) * CNN_W1 + px] = best;
      }
    }
  }

  // Conv2 (3x3, pad=1) + ReLU + MaxPool2 (2x2) -> 24x5x4 (480)
  for (let oc = 0; oc < CNN_C2; oc += 1) {
    const bias = net.b2[oc];
    for (let py = 0; py < CNN_H2; py += 1) {
      for (let px = 0; px < CNN_W2; px += 1) {
        let best = 0;
        for (let dy = 0; dy < 2; dy += 1) {
          const y = py * 2 + dy;
          for (let dx = 0; dx < 2; dx += 1) {
            const xx = px * 2 + dx;
            let s = bias;
            for (let ic = 0; ic < CNN_C1; ic += 1) {
              const inBase = ic * CNN_H1 * CNN_W1;
              const wBase = (oc * CNN_C1 + ic) * 9;
              for (let ky = -1; ky <= 1; ky += 1) {
                const iy = y + ky;
                if (iy < 0 || iy >= CNN_H1) continue;
                const kRow = (ky + 1) * 3;
                for (let kx = -1; kx <= 1; kx += 1) {
                  const ix = xx + kx;
                  if (ix < 0 || ix >= CNN_W1) continue;
                  s +=
                    cnnPool1Scratch[inBase + iy * CNN_W1 + ix] *
                    net.w2[wBase + kRow + (kx + 1)];
                }
              }
            }
            if (s > best) best = s;
          }
        }
        cnnPool2Scratch[(oc * CNN_H2 + py) * CNN_W2 + px] = best;
      }
    }
  }

  // FC1 (480 -> 48) + ReLU
  for (let i = 0; i < CNN_HID; i += 1) {
    let s = net.b3[i];
    const wOff = i * CNN_FLAT;
    for (let j = 0; j < CNN_FLAT; j += 1) {
      s += cnnPool2Scratch[j] * net.w3[wOff + j];
    }
    cnnHidScratch[i] = s > 0 ? s : 0;
  }

  // FC2 (48 -> 10) Argmax
  let bestDigit = 0;
  let bestLogit = -1e9;
  for (let c = 0; c < CNN_CLS; c += 1) {
    let s = net.b4[c];
    const wOff = c * CNN_HID;
    for (let i = 0; i < CNN_HID; i += 1) {
      s += cnnHidScratch[i] * net.w4[wOff + i];
    }
    if (s > bestLogit) {
      bestLogit = s;
      bestDigit = c;
    }
  }
  return bestDigit;
}

export function readRgbaCellNumber(
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
      ? Math.max(0, 0.52 * r + 0.48 * g - 0.18 * b)
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
  if (peak - bg < (mode === 'yellow' ? 36 : 45)) return null;

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
  if (bw / bh > 0.68) {
    const colSum = new Float32Array(bw);
    for (let x = 0; x < bw; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        colSum[x] += cell[y * cw + (minX + x)];
      }
    }
    let bestSplit = -1;
    let bestVal = 1e9;
    for (let x = Math.floor(bw * 0.22); x <= Math.ceil(bw * 0.78); x += 1) {
      if (colSum[x] < bestVal) {
        bestVal = colSum[x];
        bestSplit = x;
      }
    }
    let leftPeak = 0;
    let rightPeak = 0;
    for (let x = 0; x < bestSplit; x += 1) {
      if (colSum[x] > leftPeak) leftPeak = colSum[x];
    }
    for (let x = bestSplit + 1; x < bw; x += 1) {
      if (colSum[x] > rightPeak) rightPeak = colSum[x];
    }
    if (
      bestSplit > 0 &&
      bestVal < bh * 0.32 &&
      leftPeak > bestVal * 2.2 &&
      rightPeak > bestVal * 2.2
    ) {
      xRanges.push([minX, minX + bestSplit - 1], [minX + bestSplit + 1, maxX]);
    } else {
      xRanges.push([minX, maxX]);
    }
  } else {
    xRanges.push([minX, maxX]);
  }

  let digits = '';
  const glyphTensor = new Float32Array(CNN_GW * CNN_GH);
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

    // Aspect-preserving 16x20 tensor (targetH=16, targetW=clamp(2..14, 16*(gw/gh)))
    glyphTensor.fill(0);
    const targetH = 16.0;
    const targetW = Math.max(2.0, Math.min(14.0, 16.0 * (gw / gh)));
    const padX = (CNN_GW - targetW) * 0.5;
    const padY = (CNN_GH - targetH) * 0.5;

    for (let ty = 0; ty < CNN_GH; ty += 1) {
      const sy = y0 + ((ty + 0.5 - padY) / targetH) * gh;
      if (sy < y0 - 1 || sy > y1 + 1) continue;
      const cy0 = Math.max(0, Math.min(ch - 1, Math.floor(sy)));
      const cy1 = Math.max(0, Math.min(ch - 1, cy0 + 1));
      const wy = Math.max(0, Math.min(1, sy - Math.floor(sy)));

      for (let tx = 0; tx < CNN_GW; tx += 1) {
        const sx = x0 + ((tx + 0.5 - padX) / targetW) * gw;
        if (sx < x0 - 1 || sx > x1 + 1) continue;
        const cx0 = Math.max(0, Math.min(cw - 1, Math.floor(sx)));
        const cx1 = Math.max(0, Math.min(cw - 1, cx0 + 1));
        const wx = Math.max(0, Math.min(1, sx - Math.floor(sx)));

        glyphTensor[ty * CNN_GW + tx] =
          (cell[cy0 * cw + cx0] * (1 - wx) + cell[cy0 * cw + cx1] * wx) *
            (1 - wy) +
          (cell[cy1 * cw + cx0] * (1 - wx) + cell[cy1 * cw + cx1] * wx) * wy;
      }
    }
    digits += String(classifyGlyphCnn16x20(glyphTensor));
  }

  return digits ? parseInt(digits, 10) : null;
}

interface DetectedScoreboardCard {
  side: 'L' | 'R';
  rank: number;
  kills: number;
  clipped: boolean;
  lines: Array<{ y0: number; y1: number; yc: number }>;
  words: string[];
}

interface DetectedGridResult {
  cards: DetectedScoreboardCard[];
  nameCompositeCanvas: HTMLCanvasElement;
  rowMeta: Array<{ cardIndex: number; y0: number; y1: number }>;
}

function detectFreeFireGridAndBuildNameCanvas(
  rgba: Uint8ClampedArray,
  W: number,
  H: number,
  rawRgba: Uint8ClampedArray,
  rawW: number,
  rawH: number
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

  // Asymmetric kill-digit cell crop: captures 1- and 2-digit kills (e.g. 16) while
  // stopping before the "E" of "Eliminations" on the right.
  const leftCellW = Math.max(8, Math.round(H * 0.023));
  const rightCellW = Math.max(5, Math.round(H * 0.011));
  const padY = Math.max(3, Math.round(H * 0.0085));

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
          kx - leftCellW,
          ln.y0 - padY,
          leftCellW + rightCellW,
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
      lines: c.lines,
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
          kx - leftCellW,
          ln.y0 - padY,
          leftCellW + rightCellW,
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
      lines: c.lines,
      words: [],
    });
  }

  // Build isolated per-line composite from full-resolution rawRgba with per-slot local
  // background removal (erases #1-#3 gold fog and card borders) + widened sub-column bounds
  const rawRatioX = rawW / W;
  const rawRatioY = rawH / H;
  const targetScale = Math.max(2.0, Math.min(4.2, 1750 / rawH));
  const padRawY = Math.max(3, Math.round(rawH * 0.009));

  const strips: Array<{ side: 'L' | 'R'; x0: number; x1: number }> = [
    {
      side: 'L',
      x0: Math.max(0, Math.round((killX[0] - leftSpan * 0.6) * rawRatioX)),
      x1: Math.max(1, Math.round((killX[0] - leftSpan * 0.058) * rawRatioX)),
    },
    {
      side: 'L',
      x0: Math.max(0, Math.round((killX[0] + leftSpan * 0.34) * rawRatioX)),
      x1: Math.max(1, Math.round((killX[1] - leftSpan * 0.058) * rawRatioX)),
    },
  ];
  if (hasRightCol) {
    strips.push(
      {
        side: 'R',
        x0: Math.max(0, Math.round((killX[2] - rightSpan * 0.78) * rawRatioX)),
        x1: Math.max(1, Math.round((killX[2] - rightSpan * 0.072) * rawRatioX)),
      },
      {
        side: 'R',
        x0: Math.max(0, Math.round((killX[2] + rightSpan * 0.345) * rawRatioX)),
        x1: Math.max(1, Math.round((killX[3] - rightSpan * 0.072) * rawRatioX)),
      }
    );
  }

  const slotRows: Array<{
    cardIndex: number;
    ry0: number;
    ry1: number;
    s0: { x0: number; x1: number };
    s1: { x0: number; x1: number };
  }> = [];

  for (let ci = 0; ci < cards.length; ci += 1) {
    const card = cards[ci];
    const sideStrips = strips.filter((s) => s.side === card.side);
    if (sideStrips.length < 2) continue;
    for (const ln of card.lines) {
      slotRows.push({
        cardIndex: ci,
        ry0: Math.max(0, Math.round(ln.y0 * rawRatioY) - padRawY),
        ry1: Math.min(rawH - 1, Math.round(ln.y1 * rawRatioY) + padRawY),
        s0: sideStrips[0],
        s1: sideStrips[1],
      });
    }
  }

  const maxStripW = Math.max(
    16,
    ...strips.map((s) => Math.round((s.x1 - s.x0) * targetScale))
  );
  const rowPitchY = Math.round(rawH * 0.058 * targetScale) + 28;
  const gutterX = 64;
  const canvasW = gutterX * 3 + maxStripW * 2;
  const canvasH = Math.max(64, 32 + slotRows.length * rowPitchY);

  const outCanvas = document.createElement('canvas');
  outCanvas.width = canvasW;
  outCanvas.height = canvasH;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return null;

  const outImg = outCtx.createImageData(canvasW, canvasH);
  const dst = outImg.data;
  dst.fill(255);

  const sampleRawLum = (px: number, py: number) => {
    const idx = (py * rawW + px) * 4;
    return (
      0.45 * rawRgba[idx] +
      0.45 * rawRgba[idx + 1] +
      0.1 * rawRgba[idx + 2]
    );
  };

  const renderSlot = (
    sx0: number,
    sx1: number,
    sy0: number,
    sy1: number,
    outX0: number,
    outY0: number
  ): number => {
    const sw = sx1 - sx0;
    const sh = sy1 - sy0 + 1;
    if (sw < 4 || sh < 4) return 20;

    const lums: number[] = [];
    for (let y = sy0; y <= sy1; y += 1) {
      for (let x = sx0; x < sx1; x += 1) {
        lums.push(sampleRawLum(x, y));
      }
    }
    lums.sort((a, b) => a - b);
    const bg = lums[Math.floor(lums.length * 0.35)];
    const peak = lums[Math.floor(lums.length * 0.99)];
    const dw = Math.max(4, Math.round(sw * targetScale));
    const dh = Math.max(4, Math.round(sh * targetScale));
    if (peak - bg < 28) return dh;

    const lo = bg + (peak - bg) * 0.25;
    const hi = Math.max(lo + 32, peak - (peak - bg) * 0.08);

    for (let dy = 0; dy < dh; dy += 1) {
      const fy = sy0 + dy / targetScale;
      const y0 = Math.min(rawH - 1, Math.floor(fy));
      const y1 = Math.min(rawH - 1, y0 + 1);
      const wy = fy - y0;

      for (let dx = 0; dx < dw; dx += 1) {
        const fx = sx0 + dx / targetScale;
        const x0 = Math.min(rawW - 1, Math.max(0, Math.floor(fx)));
        const x1 = Math.min(rawW - 1, x0 + 1);
        const wx = fx - x0;

        const v =
          (sampleRawLum(x0, y0) * (1 - wx) + sampleRawLum(x1, y0) * wx) *
            (1 - wy) +
          (sampleRawLum(x0, y1) * (1 - wx) + sampleRawLum(x1, y1) * wx) * wy;
        const norm = Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
        const ink = Math.round(255 * (1 - norm));
        const outIdx = ((outY0 + dy) * canvasW + (outX0 + dx)) * 4;
        dst[outIdx] = ink;
        dst[outIdx + 1] = ink;
        dst[outIdx + 2] = ink;
        dst[outIdx + 3] = 255;
      }
    }
    return dh;
  };

  const rowMeta: Array<{ cardIndex: number; y0: number; y1: number }> = [];
  for (let ri = 0; ri < slotRows.length; ri += 1) {
    const r = slotRows[ri];
    const outY0 = 20 + ri * rowPitchY;
    const dh0 = renderSlot(r.s0.x0, r.s0.x1, r.ry0, r.ry1, gutterX, outY0);
    const dh1 = renderSlot(
      r.s1.x0,
      r.s1.x1,
      r.ry0,
      r.ry1,
      gutterX * 2 + maxStripW,
      outY0
    );
    rowMeta.push({
      cardIndex: r.cardIndex,
      y0: outY0 - 8,
      y1: outY0 + Math.max(dh0, dh1) + 8,
    });
  }

  outCtx.putImageData(outImg, 0, 0);
  return { cards, nameCompositeCanvas: outCanvas, rowMeta };
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
 * Global maximum-weight bipartite matching (O(N^3) Hungarian algorithm) so no squad
 * greedily steals another squad's match when single-player or shared-clan IGNs overlap.
 */
export function matchScannedRowsToTeams(
  rows: ScannedRankRow[],
  teams: Team[]
): MatchedScanRow[] {
  const R = rows.length;
  const T = teams.length;
  if (R === 0 || T === 0) {
    return rows.map((row) => ({
      ...row,
      matchedTeamId: null,
      matchConfidence: 0,
    }));
  }

  const scoreMat = rows.map((row) =>
    teams.map((team) => scoreSquadAgainstTokens(row.normalizedTokens, team))
  );

  // Only allow edges that pass the confidence/margin gate, weighted by (1 + score^2)
  // so Hungarian maximizes accepted match cardinality first and convex confidence second.
  const validWeight = Array.from({ length: R }, (_, rIdx) =>
    teams.map((_, tIdx) => {
      const s = scoreMat[rIdx][tIdx].score;
      let runnerUp = 0;
      for (let otherT = 0; otherT < T; otherT += 1) {
        if (otherT !== tIdx && scoreMat[rIdx][otherT].score > runnerUp) {
          runnerUp = scoreMat[rIdx][otherT].score;
        }
      }
      if (s >= 0.65 || (s >= 0.58 && s - runnerUp >= 0.12)) {
        // Exact/near-exact matches (>= 0.92) carry anchor weight so two weak 0.66
        // fuzzy guesses can never displace a 100% exact IGN match.
        return (s >= 0.92 ? 3.5 : 1.0) + s * s;
      }
      return 0;
    })
  );

  const N = Math.max(R, T);
  const u = new Float64Array(N + 1);
  const v = new Float64Array(N + 1);
  const p = new Int32Array(N + 1);
  const way = new Int32Array(N + 1);

  for (let i = 1; i <= N; i += 1) {
    p[0] = i;
    let j0 = 0;
    const minv = new Float64Array(N + 1).fill(1e9);
    const used = new Uint8Array(N + 1);
    do {
      used[j0] = 1;
      const i0 = p[j0];
      let delta = 1e9;
      let j1 = 0;
      for (let j = 1; j <= N; j += 1) {
        if (used[j]) continue;
        const w =
          i0 - 1 < R && j - 1 < T ? validWeight[i0 - 1][j - 1] : 0;
        const cost = 5.0 - w; // strictly non-negative [0.5 .. 5.0]
        const cur = cost - u[i0] - v[j];
        if (cur < minv[j]) {
          minv[j] = cur;
          way[j] = j0;
        }
        if (minv[j] < delta) {
          delta = minv[j];
          j1 = j;
        }
      }
      for (let j = 0; j <= N; j += 1) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }
      j0 = j1;
    } while (p[j0] !== 0);

    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  const assignedRow = new Set<number>();
  const assignedTeam = new Set<string>();
  const rowAssignments = new Map<
    number,
    { teamId: string; score: number; keyword?: string }
  >();

  for (let j = 1; j <= T; j += 1) {
    const rIdx = p[j] - 1;
    const tIdx = j - 1;
    if (rIdx >= 0 && rIdx < R && validWeight[rIdx][tIdx] > 0) {
      const cell = scoreMat[rIdx][tIdx];
      assignedRow.add(rIdx);
      assignedTeam.add(teams[tIdx].id);
      rowAssignments.set(rIdx, {
        teamId: teams[tIdx].id,
        score: cell.score,
        keyword: cell.matchedKeyword,
      });
    }
  }

  // Stage 2: Iterative residual matching among remaining unmatched rows & teams
  // (critical for single-screenshot #1-#11 mode where 12 teams are registered).
  for (let pass = 0; pass < 3; pass += 1) {
    const remRows: number[] = [];
    for (let r = 0; r < R; r += 1) {
      if (!assignedRow.has(r)) remRows.push(r);
    }
    const remTeamIndices: number[] = [];
    for (let t = 0; t < T; t += 1) {
      if (!assignedTeam.has(teams[t].id)) remTeamIndices.push(t);
    }
    if (remRows.length === 0 || remTeamIndices.length === 0) break;

    const cands: Array<{
      rIdx: number;
      tIdx: number;
      score: number;
      kw?: string;
    }> = [];
    for (const rIdx of remRows) {
      let bestT = -1;
      let bestS = 0;
      let secondS = 0;
      for (const tIdx of remTeamIndices) {
        const s = scoreMat[rIdx][tIdx].score;
        if (s > bestS) {
          secondS = bestS;
          bestS = s;
          bestT = tIdx;
        } else if (s > secondS) {
          secondS = s;
        }
      }
      let secondRowS = 0;
      if (bestT >= 0) {
        for (const otherR of remRows) {
          if (otherR !== rIdx && scoreMat[otherR][bestT].score > secondRowS) {
            secondRowS = scoreMat[otherR][bestT].score;
          }
        }
      }
      if (
        bestT >= 0 &&
        bestS >= 0.54 &&
        bestS - secondS >= 0.06 &&
        bestS - secondRowS >= 0.03
      ) {
        cands.push({
          rIdx,
          tIdx: bestT,
          score: bestS,
          kw: scoreMat[rIdx][bestT].matchedKeyword,
        });
      }
    }
    if (cands.length === 0) break;
    cands.sort((a, b) => b.score - a.score);
    let added = 0;
    for (const c of cands) {
      if (assignedRow.has(c.rIdx) || assignedTeam.has(teams[c.tIdx].id)) {
        continue;
      }
      assignedRow.add(c.rIdx);
      assignedTeam.add(teams[c.tIdx].id);
      rowAssignments.set(c.rIdx, {
        teamId: teams[c.tIdx].id,
        score: c.score,
        keyword: c.kw,
      });
      added += 1;
    }
    if (added === 0) break;
  }

  if (
    R === T &&
    R - assignedRow.size === 1 &&
    T - assignedTeam.size === 1
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
  rawRgba: Uint8ClampedArray;
  rawWidth: number;
  rawHeight: number;
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

    // Keep native mobile screenshot resolution (up to 1440p) for crisp player-name crops
    const rawScale = img.naturalHeight > 1440 ? 1440 / img.naturalHeight : 1;
    const rawWidth = Math.max(1, Math.round(img.naturalWidth * rawScale));
    const rawHeight = Math.max(1, Math.round(img.naturalHeight * rawScale));

    const rawCanvas = document.createElement('canvas');
    rawCanvas.width = rawWidth;
    rawCanvas.height = rawHeight;
    const rawCtx = rawCanvas.getContext('2d');
    if (!rawCtx) throw new Error('Canvas 2D context unavailable');
    rawCtx.drawImage(img, 0, 0, rawWidth, rawHeight);
    const rawRgba = rawCtx.getImageData(0, 0, rawWidth, rawHeight).data;

    // Normalized <=540p buffer for fast grid & digit analysis
    if (rawHeight <= 640) {
      return {
        rgba: rawRgba,
        width: rawWidth,
        height: rawHeight,
        rawRgba,
        rawWidth,
        rawHeight,
        fallbackCanvas: rawCanvas,
      };
    }

    const scaleDown = 540 / rawHeight;
    const width = Math.max(1, Math.round(rawWidth * scaleDown));
    const height = 540;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(img, 0, 0, width, height);
    const imgData = ctx.getImageData(0, 0, width, height);
    return {
      rgba: imgData.data,
      width,
      height,
      rawRgba,
      rawWidth,
      rawHeight,
      fallbackCanvas: rawCanvas,
    };
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
      const {
        rgba,
        width,
        height,
        rawRgba,
        rawWidth,
        rawHeight,
        fallbackCanvas,
      } = await decodeImagePixels(files[i]);

      const grid = detectFreeFireGridAndBuildNameCanvas(
        rgba,
        width,
        height,
        rawRgba,
        rawWidth,
        rawHeight
      );
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
                const wy = (word.bbox.y0 + word.bbox.y1) / 2;
                const rm = grid.rowMeta.find(
                  (m) => wy >= m.y0 && wy <= m.y1
                );
                if (rm) {
                  grid.cards[rm.cardIndex].words.push(word.text);
                }
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
          parseOcrElementsToRows(wordBoxes, rawWidth, rawHeight, maxTeams, i)
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
