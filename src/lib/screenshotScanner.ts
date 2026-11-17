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
  '\u30E1': ' ', // Katakana separator
  '\u4E42': ' ', // CJK separator
  '\u0F3A': ' ', '\u0F3B': ' ', '\u0F12': ' ', '\u262C': ' ', // Decorative IGN ornaments
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
  if (singleRun) merged.push(singleRun);

  return merged.join(' ');
}

/**
 * Extracts searchable normalized tokens + collapsed compound token from a line of IGN text.
 */
export function extractIgnTokens(raw: string): string[] {
  const norm = normalizeFreeFireIgn(raw);
  if (!norm) return [];
  const parts = norm.split(' ').filter((p) => p.length >= 2 && !/^\d+$/.test(p));
  const set = new Set<string>(parts);
  const collapsed = parts.join('');
  if (collapsed.length >= 3) {
    set.add(collapsed);
  }
  return Array.from(set);
}

function foldOcrConfusableDigits(s: string): string {
  return s
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/5/g, 's')
    .replace(/8/g, 'b')
    .replace(/2/g, 'z');
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let prev = i - 1;
    dp[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const temp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }
  return dp[b.length];
}

export function ocrFuzzySimilarity(candidateToken: string, keywordRaw: string): number {
  const kw = foldOcrConfusableDigits(normalizeFreeFireIgn(keywordRaw).replace(/\s+/g, ''));
  const cand = foldOcrConfusableDigits(candidateToken.toLowerCase().replace(/\s+/g, ''));
  if (!kw || !cand) return 0;
  if (cand === kw) return 1;

  if (kw.length >= 3 && cand.includes(kw)) {
    return 0.94;
  }
  if (cand.length >= 4 && kw.includes(cand)) {
    return Math.min(0.9, cand.length / kw.length + 0.2);
  }

  // Sliding window edit distance when candidate is a compound IGN (e.g. "bdoppyff" vs "oppy")
  if (cand.length > kw.length && kw.length >= 3) {
    let best = 0;
    for (let start = 0; start <= cand.length - kw.length; start += 1) {
      const slice = cand.slice(start, start + kw.length);
      const dist = levenshteinDistance(slice, kw);
      const sim = 1 - dist / kw.length;
      if (sim > best) best = sim;
    }
    if (best >= 0.72) return best * 0.93;
  }

  const maxLen = Math.max(cand.length, kw.length);
  if (maxLen < 3) return 0;
  const dist = levenshteinDistance(cand, kw);
  return 1 - dist / maxLen;
}

export function scoreSquadAgainstTokens(
  tokens: string[],
  team: Pick<Team, 'name' | 'shortCode' | 'player1' | 'player2' | 'learnedTokens'>
): { score: number; matchedKeyword?: string } {
  if (tokens.length === 0) return { score: 0 };

  const primaryKeywords: Array<{ label: string; weight: number }> = [];
  if (team.player1?.trim()) {
    primaryKeywords.push({ label: team.player1.trim(), weight: 1.0 });
  }
  if (team.player2?.trim()) {
    primaryKeywords.push({ label: team.player2.trim(), weight: 0.98 });
  }
  if (team.learnedTokens?.length) {
    for (const lt of team.learnedTokens) {
      if (lt.trim().length >= 3) {
        primaryKeywords.push({ label: lt.trim(), weight: 0.94 });
      }
    }
  }
  if (team.name?.trim() && !/^(?:squad|team|slot)\s*\d+$/i.test(team.name.trim())) {
    primaryKeywords.push({ label: team.name.trim(), weight: 0.88 });
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

  // Slight boost if BOTH player1 & player2 matched in the same rank card
  if (matchHits >= 2) {
    bestScore = Math.min(1, bestScore + 0.05);
  }

  return { score: bestScore, matchedKeyword: bestKw };
}

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

function parseKillIntToken(raw: string): number | null {
  const cleaned = raw.trim().replace(/kills?$/i, '').trim();
  if (!/^\d{1,2}$/.test(cleaned)) return null;
  const val = parseInt(cleaned, 10);
  return val >= 0 && val <= 48 ? val : null;
}

function parseColumnLinesIntoRows(
  lines: NormalizedLine[],
  maxTeams: number,
  sourceImageIndex: number
): ScannedRankRow[] {
  if (lines.length === 0) return [];

  // Identify lines starting with a valid rank number on the left edge of the column
  const anchors: Array<{ lineIdx: number; rank: number }> = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const leftWords = line.words.filter((w) => w.nx0 <= 0.24);
    for (const w of leftWords) {
      const r = parseRankBadgeToken(w.text, maxTeams);
      if (r !== null) {
        // Avoid duplicate consecutive identical rank badge on next sub-line
        if (anchors.length === 0 || anchors[anchors.length - 1].rank !== r) {
          anchors.push({ lineIdx: i, rank: r });
        }
        break;
      }
    }
  }

  if (anchors.length === 0) return [];

  const results: ScannedRankRow[] = [];

  for (let a = 0; a < anchors.length; a += 1) {
    const startIdx = anchors[a].lineIdx;
    const endIdx = a + 1 < anchors.length ? anchors[a + 1].lineIdx - 1 : Math.min(lines.length - 1, startIdx + 4);
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
      if (ln.minY < minY) minY = ln.minY;
      if (ln.maxY > maxY) maxY = ln.maxY;

      // Find right-side numeric kill value on this player line
      let lineKill: number | null = null;
      for (let wIdx = ln.words.length - 1; wIdx >= 0; wIdx -= 1) {
        const w = ln.words[wIdx];
        if (w.nxCenter >= 0.56) {
          const k = parseKillIntToken(w.text);
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
        // Skip the left rank badge itself and right-side numeric columns
        if (sIdx === 0 && w.nx0 <= 0.18 && parseRankBadgeToken(w.text, maxTeams) === rank) {
          continue;
        }
        if (w.nxCenter >= 0.68 && parseKillIntToken(w.text) !== null) {
          continue;
        }
        playerWords.push(w.text);
        confSum += w.confidence;
        confCount += 1;
      }
    }

    const totalKills = perLineKills.reduce((acc, v) => acc + v, 0);
    const rawPlayerText = playerWords.join(' ').trim();
    const normalizedTokens = extractIgnTokens(rawPlayerText);
    const avgConf = confCount > 0 ? confSum / confCount : 60;
    const isEdgeClipped = minY < 0.045 || maxY > 0.955;

    results.push({
      rank,
      kills: totalKills,
      rawPlayerText,
      normalizedTokens,
      confidence: avgConf,
      isEdgeClipped,
      sourceImageIndex,
    });
  }

  return results;
}

function clusterWordsToLines(
  words: Array<{ text: string; nx0: number; ny0: number; nx1: number; ny1: number; confidence: number }>
): NormalizedLine[] {
  if (words.length === 0) return [];
  const sorted = [...words].sort((a, b) => (a.ny0 + a.ny1) / 2 - (b.ny0 + b.ny1) / 2);
  const lines: NormalizedLine[] = [];

  for (const w of sorted) {
    const wy = (w.ny0 + w.ny1) / 2;
    const wh = Math.max(0.012, w.ny1 - w.ny0);
    const tolerance = Math.max(0.016, wh * 0.68);

    const existing = lines.find((ln) => Math.abs(ln.ny - wy) <= tolerance);
    if (existing) {
      existing.words.push({
        text: w.text,
        nx0: w.nx0,
        nx1: w.nx1,
        nxCenter: (w.nx0 + w.nx1) / 2,
        confidence: w.confidence,
      });
      existing.minY = Math.min(existing.minY, w.ny0);
      existing.maxY = Math.max(existing.maxY, w.ny1);
      existing.ny = (existing.minY + existing.maxY) / 2;
    } else {
      lines.push({
        ny: wy,
        minY: w.ny0,
        maxY: w.ny1,
        words: [
          {
            text: w.text,
            nx0: w.nx0,
            nx1: w.nx1,
            nxCenter: (w.nx0 + w.nx1) / 2,
            confidence: w.confidence,
          },
        ],
      });
    }
  }

  for (const ln of lines) {
    ln.words.sort((a, b) => a.nx0 - b.nx0);
  }
  return lines.sort((a, b) => a.ny - b.ny);
}

/**
 * Converts OCR word bounding boxes from 1 Free Fire screenshot into structured Rank rows.
 * Supports both 2-Column Squad Cards and Full-Width Spectator Tables.
 */
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
    // Ignore top title bar ("MATCH RESULT") & bottom navigation buttons
    .filter((w) => (w.ny0 + w.ny1) / 2 >= 0.06 && (w.ny0 + w.ny1) / 2 <= 0.96);

  if (normWords.length === 0) return [];

  // Detect 2-column card layout: rank badges present near x ~ 0.02..0.15 AND x ~ 0.48..0.62
  const leftRankHits = normWords.filter(
    (w) => w.nx0 <= 0.16 && parseRankBadgeToken(w.text, maxTeams) !== null
  ).length;
  const midRankHits = normWords.filter(
    (w) => w.nx0 >= 0.46 && w.nx0 <= 0.63 && parseRankBadgeToken(w.text, maxTeams) !== null
  ).length;

  if (leftRankHits >= 2 && midRankHits >= 2) {
    const leftWords = normWords
      .filter((w) => (w.nx0 + w.nx1) / 2 < 0.49)
      .map((w) => ({
        ...w,
        nx0: Math.min(1, w.nx0 / 0.49),
        nx1: Math.min(1, w.nx1 / 0.49),
      }));
    const rightWords = normWords
      .filter((w) => (w.nx0 + w.nx1) / 2 >= 0.49)
      .map((w) => ({
        ...w,
        nx0: Math.max(0, (w.nx0 - 0.49) / 0.51),
        nx1: Math.min(1, (w.nx1 - 0.49) / 0.51),
      }));

    const leftRows = parseColumnLinesIntoRows(
      clusterWordsToLines(leftWords),
      maxTeams,
      sourceImageIndex
    );
    const rightRows = parseColumnLinesIntoRows(
      clusterWordsToLines(rightWords),
      maxTeams,
      sourceImageIndex
    );
    return [...leftRows, ...rightRows].sort((a, b) => a.rank - b.rank);
  }

  return parseColumnLinesIntoRows(
    clusterWordsToLines(normWords),
    maxTeams,
    sourceImageIndex
  );
}

/**
 * Fallback line parser when plain OCR text is provided without reliable bounding boxes.
 */
export function parsePlainTextOcrToRows(
  rawText: string,
  maxTeams = 12,
  sourceImageIndex = 0
): ScannedRankRow[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const rows: ScannedRankRow[] = [];

  for (const line of lines) {
    const m = line.match(/^#?(\d{1,2})\b\s*(.+?)\s+(\d{1,2})(?:\s*kills?)?$/i);
    if (!m) continue;
    const rank = parseInt(m[1], 10);
    const kills = parseInt(m[3], 10);
    if (rank < 1 || rank > maxTeams || kills < 0 || kills > 48) continue;
    const rawPlayerText = m[2].trim();
    rows.push({
      rank,
      kills,
      rawPlayerText,
      normalizedTokens: extractIgnTokens(rawPlayerText),
      confidence: 70,
      isEdgeClipped: false,
      sourceImageIndex,
    });
  }
  return rows;
}

/**
 * Merges rows from 1..N overlapping screenshots of the SAME match (e.g. Screenshot 1 has #1-#11,
 * Screenshot 2 scrolled slightly has #2-#12) without double-counting overlapping ranks #2-#11.
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
        byRank.set(row.rank, {
          ...row,
          normalizedTokens: [...row.normalizedTokens],
        });
        continue;
      }

      // Prefer non-edge-clipped scan over scroll-edge-clipped scan for kill accuracy
      const incomingBetter =
        (existing.isEdgeClipped && !row.isEdgeClipped) ||
        (existing.isEdgeClipped === row.isEdgeClipped &&
          (row.normalizedTokens.length > existing.normalizedTokens.length ||
            (row.normalizedTokens.length === existing.normalizedTokens.length &&
              row.confidence > existing.confidence)));

      const mergedTokens = Array.from(
        new Set([...existing.normalizedTokens, ...row.normalizedTokens])
      );
      const primary = incomingBetter ? row : existing;
      const secondary = incomingBetter ? existing : row;

      byRank.set(row.rank, {
        ...primary,
        rawPlayerText:
          primary.rawPlayerText.length >= secondary.rawPlayerText.length
            ? primary.rawPlayerText
            : secondary.rawPlayerText,
        normalizedTokens: mergedTokens,
        isEdgeClipped: existing.isEdgeClipped && row.isEdgeClipped,
      });
    }
  }

  return Array.from(byRank.values()).sort((a, b) => a.rank - b.rank);
}

/**
 * Matches deduplicated Rank rows one-to-one against tournament squads using
 * player1, player2, learnedTokens, and squad name.
 */
export function matchScannedRowsToTeams(
  rows: ScannedRankRow[],
  teams: Team[]
): MatchedScanRow[] {
  interface CandidatePair {
    rowIndex: number;
    teamId: string;
    score: number;
    matchedKeyword?: string;
  }

  const pairs: CandidatePair[] = [];
  rows.forEach((row, rowIndex) => {
    for (const team of teams) {
      const { score, matchedKeyword } = scoreSquadAgainstTokens(
        row.normalizedTokens,
        team
      );
      if (score >= 0.72) {
        pairs.push({ rowIndex, teamId: team.id, score, matchedKeyword });
      }
    }
  });

  pairs.sort((a, b) => b.score - a.score);

  const usedRows = new Set<number>();
  const usedTeams = new Set<string>();
  const assignment = new Map<number, { teamId: string; score: number; matchedKeyword?: string }>();

  for (const p of pairs) {
    if (usedRows.has(p.rowIndex) || usedTeams.has(p.teamId)) continue;
    usedRows.add(p.rowIndex);
    usedTeams.add(p.teamId);
    assignment.set(p.rowIndex, {
      teamId: p.teamId,
      score: p.score,
      matchedKeyword: p.matchedKeyword,
    });
  }

  // If exactly 1 rank row and 1 team remain unmatched across a full lobby, auto-pair the last team
  const unmatchedRowIndices = rows
    .map((_, idx) => idx)
    .filter((idx) => !usedRows.has(idx));
  const remainingTeams = teams.filter((t) => !usedTeams.has(t.id));
  if (
    rows.length === teams.length &&
    unmatchedRowIndices.length === 1 &&
    remainingTeams.length === 1
  ) {
    assignment.set(unmatchedRowIndices[0], {
      teamId: remainingTeams[0].id,
      score: 0.7,
      matchedKeyword: 'last-remaining-squad',
    });
  }

  return rows.map((row, idx) => {
    const hit = assignment.get(idx);
    return {
      ...row,
      matchedTeamId: hit?.teamId ?? null,
      matchConfidence: hit?.score ?? 0,
      matchedKeyword: hit?.matchedKeyword,
    };
  });
}

/**
 * Filters clean OCR tokens (>= 3 chars, non-numeric) to auto-learn onto a squad after Match 1 review.
 */
export function extractLearnableTokens(row: Pick<ScannedRankRow, 'normalizedTokens'>): string[] {
  return row.normalizedTokens
    .filter((t) => t.length >= 3 && t.length <= 24 && !/^\d+$/.test(t))
    .slice(0, 8);
}

async function preprocessScreenshotCanvas(file: File): Promise<{
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read screenshot file.'));
    reader.readAsDataURL(file);
  });

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = img.width < 1280 ? 1.5 : 1;
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable.'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Enhance bright Free Fire white/gold text against dark card backgrounds
      const imgData = ctx.getImageData(0, 0, width, height);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        // Invert & contrast-stretch so dark text on white background feeds Tesseract cleanly
        const boosted = lum > 132 ? Math.max(0, 255 - (lum - 90) * 1.55) : 255;
        const clamped = Math.max(0, Math.min(255, Math.round(boosted)));
        d[i] = clamped;
        d[i + 1] = clamped;
        d[i + 2] = clamped;
      }
      ctx.putImageData(imgData, 0, 0);
      resolve({ canvas, width, height });
    };
    img.onerror = () => reject(new Error('Invalid screenshot image.'));
    img.src = dataUrl;
  });
}

/**
 * Runs 100% offline in-browser OCR on 1..3 match result screenshots, merges & deduplicates
 * overlapping ranks, and matches squads using player1 / player2 / learnedTokens.
 */
export async function scanMatchScreenshotsOffline(
  files: File[],
  teams: Team[],
  onProgress?: (status: string, fraction: number) => void
): Promise<MatchedScanRow[]> {
  if (files.length === 0) return [];
  onProgress?.('Loading offline OCR engine...', 0.08);

  const Tesseract = await import('tesseract.js');
  const worker = await Tesseract.createWorker('eng');

  try {
    const perImageScans: ScannedRankRow[][] = [];

    for (let i = 0; i < files.length; i += 1) {
      const baseProgress = 0.12 + (i / files.length) * 0.78;
      onProgress?.(
        `Scanning screenshot ${i + 1} of ${files.length}...`,
        baseProgress
      );

      const { canvas, width, height } = await preprocessScreenshotCanvas(files[i]);
      const result = await worker.recognize(
        canvas,
        {},
        { text: true, blocks: true }
      );

      const wordBoxes: OcrWordBox[] = [];
      for (const block of result.data.blocks || []) {
        for (const para of block.paragraphs || []) {
          for (const line of para.lines || []) {
            for (const word of line.words || []) {
              if (!word.text?.trim()) continue;
              wordBoxes.push({
                text: word.text,
                x0: word.bbox.x0,
                y0: word.bbox.y0,
                x1: word.bbox.x1,
                y1: word.bbox.y1,
                confidence: word.confidence,
              });
            }
          }
        }
      }

      let parsed = parseOcrElementsToRows(
        wordBoxes,
        width,
        height,
        Math.max(12, teams.length),
        i
      );
      if (parsed.length === 0 && result.data.text) {
        parsed = parsePlainTextOcrToRows(
          result.data.text,
          Math.max(12, teams.length),
          i
        );
      }
      perImageScans.push(parsed);
    }

    onProgress?.('Matching players and deduplicating ranks...', 0.94);
    const merged = mergeAndDeduplicateScans(
      perImageScans,
      Math.max(12, teams.length)
    );
    const matched = matchScannedRowsToTeams(merged, teams);
    onProgress?.('Scan complete.', 1);
    return matched;
  } finally {
    await worker.terminate().catch(() => {});
  }
}
