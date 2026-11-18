import type { Team } from '../types/tournament';

export interface ScannedPlayerSlot {
  ign: string;
  kills: number;
}

export interface ScannedRankRow {
  rank: number;
  kills: number;
  rawPlayerText: string;
  normalizedTokens: string[];
  confidence: number;
  isEdgeClipped: boolean;
  sourceImageIndex: number;
  players?: ScannedPlayerSlot[];
  aiMatchedTeamId?: string | null;
}

export interface MatchedScanRow extends ScannedRankRow {
  matchedTeamId: string | null;
  matchConfidence: number; // 0..1
  matchedKeyword?: string;
}

export type AiScannerErrorCode =
  | 'NO_QUOTA_ASSIGNED'
  | 'INVALID_CONFIG'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR';

export class AiScannerError extends Error {
  readonly code: AiScannerErrorCode;

  constructor(code: AiScannerErrorCode, message: string) {
    super(message);
    this.name = 'AiScannerError';
    this.code = code;
  }
}

const VISION_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_ACTIVE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest',
] as const;

export function sanitizeApiKeyToken(raw: string): string {
  return raw.trim().replace(/^["']+|["']+$/g, '').replace(/\s+/g, '');
}

/**
 * Parses one or multiple API keys pasted by an Admin (newline, comma, or space separated).
 */
export function parseMultiApiKeyInput(rawText: string): string[] {
  if (!rawText.trim()) return [];
  const parts = rawText
    .split(/[\r\n,;|\s]+/)
    .map((s) => sanitizeApiKeyToken(s))
    .filter((s) => s.length >= 16 && s.length <= 256);
  return Array.from(new Set(parts)).slice(0, 25);
}

export function maskApiKey(apiKey: string): string {
  const clean = sanitizeApiKeyToken(apiKey);
  if (!clean) return '';
  if (clean.length <= 10) return `${clean.slice(0, 4)}...`;
  return `${clean.slice(0, 6)}...${clean.slice(-4)}`;
}

interface ModelListEntry {
  name?: string;
  supportedGenerationMethods?: string[];
}

function parseModelVersionScore(id: string): number {
  const m = id.match(/^gemini-(\d+)(?:\.(\d+))?/i);
  if (!m) return id === 'gemini-flash-latest' ? 3.79 : 3.0;
  const major = Number(m[1] || 0);
  const minor = Number(m[2] || 0);
  return major + minor / 10;
}

/**
 * Selects active multimodal Flash-Lite (Tier 1: highest daily quota & lowest cost)
 * followed by standard Flash (Tier 2: e.g. 3.8-flash / flash-latest), strictly
 * excluding retired 1.x / 2.0 / 2.5 models unless no 3.x+ models exist.
 */
export function rankVisionModelsFromCatalog(entries: ModelListEntry[]): {
  liteModels: string[];
  standardModels: string[];
} {
  const lite: string[] = [];
  const standard: string[] = [];
  const legacyFallback: string[] = [];

  for (const m of entries) {
    const id = (m.name || '').replace(/^models\//, '').trim();
    const methods = m.supportedGenerationMethods || [];
    if (!id || !methods.includes('generateContent')) continue;
    const lower = id.toLowerCase();
    if (!lower.includes('gemini') || !lower.includes('flash')) continue;

    // Exclude non-vision / specialized modalities & retired 1.x / 2.0 endpoints
    if (
      lower.includes('tts') ||
      lower.includes('embedding') ||
      lower.includes('imagen') ||
      lower.includes('image') ||
      lower.includes('audio') ||
      lower.includes('veo') ||
      lower.includes('live') ||
      lower.includes('thinking') ||
      lower.includes('computer-use') ||
      lower.includes('robotics') ||
      lower.startsWith('gemini-1.') ||
      lower.startsWith('gemini-2.0')
    ) {
      continue;
    }

    const ver = parseModelVersionScore(lower);
    if (ver < 3.0) {
      legacyFallback.push(id);
      continue;
    }

    if (lower.includes('lite')) {
      lite.push(id);
    } else {
      standard.push(id);
    }
  }

  const sortDesc = (arr: string[]) =>
    Array.from(new Set(arr)).sort((a, b) => {
      // Prefer stable release names over -exp / -001 snapshots of same version
      const scoreDiff = parseModelVersionScore(b) - parseModelVersionScore(a);
      if (Math.abs(scoreDiff) > 0.001) return scoreDiff;
      const aPreview = a.includes('exp') || a.includes('preview') ? 1 : 0;
      const bPreview = b.includes('exp') || b.includes('preview') ? 1 : 0;
      if (aPreview !== bPreview) return aPreview - bPreview;
      return b.localeCompare(a);
    });

  const sortedLite = sortDesc(lite);
  const sortedStd = sortDesc(standard);

  if (sortedLite.length === 0 && sortedStd.length === 0) {
    if (legacyFallback.length > 0) {
      return { liteModels: [], standardModels: sortDesc(legacyFallback) };
    }
    return {
      liteModels: ['gemini-3.5-flash-lite'],
      standardModels: ['gemini-3.8-flash', 'gemini-flash-latest'],
    };
  }

  return {
    liteModels: sortedLite.slice(0, 3),
    standardModels: sortedStd.slice(0, 3),
  };
}

const MODEL_CATALOG_CACHE = new Map<
  string,
  { fetchedAt: number; liteModels: string[]; standardModels: string[] }
>();

async function resolveActiveModelsForKey(apiKey: string): Promise<{
  liteModels: string[];
  standardModels: string[];
}> {
  const cacheHit = MODEL_CATALOG_CACHE.get(apiKey);
  if (cacheHit && Date.now() - cacheHit.fetchedAt < 6 * 3600 * 1000) {
    return cacheHit;
  }

  try {
    const res = await fetch(`${VISION_API_BASE}/models`, {
      method: 'GET',
      headers: { 'x-goog-api-key': apiKey },
    });
    if (res.ok) {
      const data = (await res.json()) as { models?: ModelListEntry[] };
      if (Array.isArray(data.models) && data.models.length > 0) {
        const ranked = rankVisionModelsFromCatalog(data.models);
        const entry = { fetchedAt: Date.now(), ...ranked };
        MODEL_CATALOG_CACHE.set(apiKey, entry);
        return entry;
      }
    }
  } catch {
    // Fall back to default active Gemini 3.x models
  }

  return {
    liteModels: [DEFAULT_ACTIVE_MODELS[0]],
    standardModels: [DEFAULT_ACTIVE_MODELS[1], DEFAULT_ACTIVE_MODELS[2]],
  };
}

function currentPacificDayKey(): string {
  try {
    return new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/Los_Angeles',
    });
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

let exhaustedDayStamp = '';
const exhaustedKeyModelsToday = new Set<string>();

function isMarkedExhaustedToday(apiKey: string, model: string): boolean {
  const today = currentPacificDayKey();
  if (exhaustedDayStamp !== today) {
    exhaustedDayStamp = today;
    exhaustedKeyModelsToday.clear();
    return false;
  }
  return exhaustedKeyModelsToday.has(`${apiKey.slice(-8)}::${model}`);
}

function markExhaustedToday(apiKey: string, model: string): void {
  const today = currentPacificDayKey();
  if (exhaustedDayStamp !== today) {
    exhaustedDayStamp = today;
    exhaustedKeyModelsToday.clear();
  }
  exhaustedKeyModelsToday.add(`${apiKey.slice(-8)}::${model}`);
}

/**
 * Admin-only helper to verify an API key in Admin Dashboard -> AI / API Management.
 */
export async function verifyAdminAiApiKey(rawKey: string): Promise<{
  valid: boolean;
  primaryModel?: string;
  error?: string;
}> {
  const cleanKey = sanitizeApiKeyToken(rawKey);
  if (cleanKey.length < 16) {
    return { valid: false, error: 'Paste a complete API key.' };
  }

  let modelsToTest: string[] = [...DEFAULT_ACTIVE_MODELS];
  try {
    const res = await fetch(`${VISION_API_BASE}/models`, {
      method: 'GET',
      headers: { 'x-goog-api-key': cleanKey },
    });
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      return { valid: false, error: 'Invalid or unauthorized API key.' };
    }
    if (res.ok) {
      const json = (await res.json()) as { models?: ModelListEntry[] };
      if (Array.isArray(json.models) && json.models.length > 0) {
        const ranked = rankVisionModelsFromCatalog(json.models);
        MODEL_CATALOG_CACHE.set(cleanKey, {
          fetchedAt: Date.now(),
          ...ranked,
        });
        modelsToTest = [...ranked.liteModels, ...ranked.standardModels];
      }
    }
  } catch {
    return {
      valid: false,
      error: 'Network error while verifying key. Check connection.',
    };
  }

  let sawRateLimit = false;
  let lastMsg = '';
  for (const model of modelsToTest.slice(0, 5)) {
    try {
      const ping = await fetch(
        `${VISION_API_BASE}/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': cleanKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Return {"ok":true}' }] }],
            generationConfig: { temperature: 0, maxOutputTokens: 16 },
          }),
        }
      );
      if (ping.ok) {
        return { valid: true, primaryModel: model };
      }
      if (ping.status === 429) {
        sawRateLimit = true;
        continue;
      }
      const errBody = await ping.json().catch(() => null);
      const msg = String(errBody?.error?.message || '');
      lastMsg = msg;
      if (
        ping.status === 401 ||
        ping.status === 403 ||
        (ping.status === 400 && /api.?key/i.test(msg))
      ) {
        return { valid: false, error: msg || 'API key rejected.' };
      }
    } catch {
      // Try next active model
    }
  }

  if (sawRateLimit) {
    return { valid: true, primaryModel: modelsToTest[0] };
  }
  return {
    valid: false,
    error: lastMsg || 'No active vision model responded for this API key.',
  };
}

/**
 * Common Free Fire stylized Unicode lookalikes that NFKD alone does not fold to ASCII.
 */
const HOMOGLYPH_MAP: Record<string, string> = {
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
  '\u30E1': ' ', '\u30C4': ' ',
  '\u4E42': ' ', '\u4E45': ' ', '\u534D': ' ', '\u3005': ' ', '\u4E95': ' ',
  '\u0F3A': ' ', '\u0F3B': ' ', '\u0F12': ' ', '\u262C': ' ', '\u20DD': ' ',
  '\u2020': ' ', '\u2021': ' ', '\uA9C1': ' ', '\uA9C2': ' ',
  '\u2122': ' ', '\u00AE': ' ',
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
    mapped +=
      HOMOGLYPH_MAP[ch] !== undefined ? HOMOGLYPH_MAP[ch] : ch.toLowerCase();
  }
  return mapped;
}

function expandInlineSymbolLeet(raw: string): string {
  if (!raw) return '';
  return preMapHomoglyphs(raw)
    .replace(/@/g, 'a')
    .replace(/([a-z0-9])[!|'\u00A1]+([a-z0-9])/g, '$1i$2')
    .replace(/([a-z0-9.])\?(?=\s|$)/g, '$17')
    .replace(/(^|\s)!(?=[a-z])/g, '$1 ');
}

export function normalizeFreeFireIgn(raw: string): string {
  if (!raw) return '';
  const mapped = preMapHomoglyphs(raw);

  const words = mapped
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return '';

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

const NOISE_FRAGMENT_RE =
  /^(?:eliminations?|elims?|eliminatio|ations?|tions?|ions?|ons?|ns|ws|is)$/i;

export function extractIgnTokens(raw: string): string[] {
  if (!raw) return [];
  const variants = new Set<string>();
  const baseNorm = normalizeFreeFireIgn(raw);
  if (baseNorm) variants.add(baseNorm);

  const leetNorm = normalizeFreeFireIgn(expandInlineSymbolLeet(raw));
  if (leetNorm) variants.add(leetNorm);

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
      const stem = p.replace(/(?:x?\d+|\d+x)$/, '');
      if (stem.length >= 4 && stem !== p) {
        set.add(stem);
      }
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
        OCR_SIMILAR_COSTS.set(
          k1,
          Math.min(cost, OCR_SIMILAR_COSTS.get(k1) ?? 1)
        );
        OCR_SIMILAR_COSTS.set(
          k2,
          Math.min(cost, OCR_SIMILAR_COSTS.get(k2) ?? 1)
        );
      }
    }
  };
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
  addGroup('tr', 0.4);
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

    const subParts = normLeet
      .split(' ')
      .filter((w) => w.length >= 4 && !/^\d+$/.test(w));
    for (const sp of subParts) {
      const partWeight =
        sp.length >= 5 ? baseWeight * 0.95 : baseWeight * 0.89;
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
        aiMatchedTeamId:
          primary.aiMatchedTeamId || secondary.aiMatchedTeamId || null,
      });
    }
  }

  return Array.from(byRank.values()).sort((a, b) => a.rank - b.rank);
}

/**
 * Global maximum-weight bipartite matching (O(N^3) Hungarian algorithm) combining
 * deterministic Unicode/leet roster scoring + AI visual squad matching.
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
    teams.map((team) => {
      const det = scoreSquadAgainstTokens(row.normalizedTokens, team);
      if (row.aiMatchedTeamId && row.aiMatchedTeamId === team.id) {
        const boosted = Math.max(det.score, 0.88);
        return {
          score: det.score >= 0.65 ? Math.min(1, det.score + 0.08) : boosted,
          matchedKeyword: det.matchedKeyword || team.name,
        };
      }
      return det;
    })
  );

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
        const cost = 5.0 - w;
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

// ============================================================================
// Multimodal AI Free Fire Post-Match Scoreboard Engine (Multi-Key Failover)
// ============================================================================

const SCOREBOARD_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    rows: {
      type: 'ARRAY',
      description:
        'Deduplicated Free Fire post-match squad rank cards ordered by rank ascending (1 to 12).',
      items: {
        type: 'OBJECT',
        properties: {
          rank: {
            type: 'INTEGER',
            description:
              'Placement rank badge number shown on the left of the squad card (1 to 24).',
          },
          isBottomClipped: {
            type: 'BOOLEAN',
            description:
              'True ONLY if this card (typically Rank 11 in an un-scrolled single screenshot) has its bottom player row cut off by the scroll edge and no other uploaded screenshot shows it in full.',
          },
          matchedTeamId: {
            type: 'STRING',
            nullable: true,
            description:
              'Exact teamId from the provided REGISTERED_SQUADS list if at least one player IGN on this rank card clearly belongs to that squad; otherwise null.',
          },
          players: {
            type: 'ARRAY',
            description:
              'All visible players inside this squad card (1 to 4 players in a 2x2 grid). Do not invent empty slots.',
            items: {
              type: 'OBJECT',
              properties: {
                ign: {
                  type: 'STRING',
                  description:
                    'Player in-game nickname without the trailing word Eliminations.',
                },
                kills: {
                  type: 'INTEGER',
                  description:
                    'Exact yellow integer shown immediately before Eliminations / Eliminatio for this player (0 to 99, careful with 2-digit kills like 11 or 16).',
                },
              },
              required: ['ign', 'kills'],
            },
          },
          totalKills: {
            type: 'INTEGER',
            description:
              'Sum of kills across all players in this squad card.',
          },
        },
        required: ['rank', 'isBottomClipped', 'players', 'totalKills'],
      },
    },
  },
  required: ['rows'],
};

function buildFreeFireVisionPrompt(teams: Team[], imageCount: number): string {
  const rosterPayload = teams.map((t) => {
    const knownPlayers = Array.from(
      new Set(
        [
          ...(t.players || []),
          t.player1 || '',
          t.player2 || '',
          ...(t.learnedTokens || []),
        ]
          .map((s) => s.trim())
          .filter(Boolean)
      )
    );
    return {
      teamId: t.id,
      squadName: t.name,
      shortCode: t.shortCode || '',
      knownPlayerIgns: knownPlayers,
    };
  });

  return [
    `You are a precision Free Fire Esports tournament scoreboard vision parser analyzing ${imageCount} post-match result screenshot(s) from the SAME match.`,
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
    `REGISTERED_SQUADS JSON:\n${JSON.stringify(rosterPayload)}`,
  ].join('\n');
}

function cleanExtractedIgn(raw: string): string {
  return raw
    .replace(/\b(?:eliminations?|eliminatio|elims?)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface RawAiRankPayload {
  rank?: unknown;
  isBottomClipped?: unknown;
  matchedTeamId?: unknown;
  players?: unknown;
  totalKills?: unknown;
}

export function parseAiStandingsJson(
  rawJsonText: string,
  teams: Team[],
  maxTeams = 24
): MatchedScanRow[] {
  const cleanedText = rawJsonText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: { rows?: RawAiRankPayload[] } | RawAiRankPayload[];
  try {
    parsed = JSON.parse(cleanedText);
  } catch {
    throw new AiScannerError(
      'PARSE_ERROR',
      'AI returned an unreadable scoreboard response. Please click Re-Scan.'
    );
  }

  const rawRows: RawAiRankPayload[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.rows)
    ? parsed.rows
    : [];

  const validTeamIds = new Set(teams.map((t) => t.id));
  const converted: ScannedRankRow[] = [];

  for (const item of rawRows) {
    const rank = Number(item?.rank);
    if (!Number.isInteger(rank) || rank < 1 || rank > maxTeams) continue;

    const rawPlayers = Array.isArray(item?.players) ? item.players : [];
    const players: ScannedPlayerSlot[] = [];
    for (const p of rawPlayers) {
      if (!p || typeof p !== 'object') continue;
      const pObj = p as { ign?: unknown; kills?: unknown };
      const ign = cleanExtractedIgn(String(pObj.ign ?? ''));
      const kNum = Number(pObj.kills);
      const kills =
        Number.isFinite(kNum) && kNum >= 0
          ? Math.min(99, Math.round(kNum))
          : 0;
      if (ign || kills > 0) {
        players.push({ ign, kills });
      }
    }

    const fallbackTotal = Number(item?.totalKills);
    const kills =
      players.length > 0
        ? players.reduce((sum, p) => sum + p.kills, 0)
        : Number.isFinite(fallbackTotal) && fallbackTotal >= 0
        ? Math.min(200, Math.round(fallbackTotal))
        : 0;

    const rawPlayerText = players
      .map((p) => `${p.ign} (${p.kills})`.trim())
      .filter(Boolean)
      .join(' \u00B7 ');
    const plainNamesJoined = players.map((p) => p.ign).join(' ');
    const aiTeamId =
      typeof item?.matchedTeamId === 'string' &&
      validTeamIds.has(item.matchedTeamId)
        ? item.matchedTeamId
        : null;

    converted.push({
      rank,
      kills,
      rawPlayerText: rawPlayerText || plainNamesJoined,
      normalizedTokens: extractIgnTokens(plainNamesJoined),
      confidence: 98,
      isEdgeClipped: Boolean(item?.isBottomClipped),
      sourceImageIndex: 0,
      players,
      aiMatchedTeamId: aiTeamId,
    });
  }

  const deduplicated = mergeAndDeduplicateScans([converted], maxTeams);
  return matchScannedRowsToTeams(deduplicated, teams);
}

async function fileToInlineImagePart(
  file: File
): Promise<{ inlineData: { mimeType: string; data: string } }> {
  const supportedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  if (file.size <= 2_500_000 && supportedTypes.has(file.type)) {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = String(reader.result || '');
        const comma = res.indexOf(',');
        resolve(comma >= 0 ? res.slice(comma + 1) : res);
      };
      reader.onerror = () =>
        reject(new Error('Failed to read screenshot file.'));
      reader.readAsDataURL(file);
    });
    return {
      inlineData: {
        mimeType: file.type,
        data: base64,
      },
    };
  }

  const bitmapUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () =>
        reject(new Error('Could not decode screenshot image.'));
      el.src = bitmapUrl;
    });
    const maxDim = Math.max(img.naturalWidth, img.naturalHeight);
    const scale = maxDim > 1800 ? 1800 / maxDim : 1;
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable.');
    ctx.drawImage(img, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const comma = dataUrl.indexOf(',');
    return {
      inlineData: {
        mimeType: 'image/jpeg',
        data: comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl,
      },
    };
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

/**
 * Scans 1-3 match screenshots using the user's admin-assigned pool of AI keys.
 * Automatically rotates across multiple keys & active Flash-Lite / Flash models
 * when one key hits its daily or per-minute limit.
 */
export async function scanMatchScreenshotsWithAi(
  files: File[],
  teams: Team[],
  assignedApiKeys: string[],
  onProgress?: (statusText: string, progressFraction: number) => void
): Promise<MatchedScanRow[]> {
  if (files.length === 0) return [];

  const cleanKeys = Array.from(
    new Set(
      (assignedApiKeys || [])
        .map((k) => sanitizeApiKeyToken(k))
        .filter((k) => k.length >= 16)
    )
  );

  if (cleanKeys.length === 0) {
    throw new AiScannerError(
      'NO_QUOTA_ASSIGNED',
      'AI Auto Standings (Beta) is not yet activated on your account. Please ask an administrator to enable your AI scan quota.'
    );
  }

  onProgress?.('Preparing match screenshots...', 0.16);
  const imageParts = await Promise.all(
    files.slice(0, 3).map((f) => fileToInlineImagePart(f))
  );

  onProgress?.('Connecting to AI Vision...', 0.34);
  const resolvedPerKey = await Promise.all(
    cleanKeys.map(async (key) => ({
      key,
      ...(await resolveActiveModelsForKey(key)),
    }))
  );

  // Build rotation schedule:
  // 1) All keys' Flash-Lite models (highest free daily quota & fastest)
  // 2) All keys' Standard Flash models (e.g. 3.8-flash / flash-latest)
  const allAttempts: Array<{ key: string; model: string }> = [];
  for (const item of resolvedPerKey) {
    for (const m of item.liteModels) {
      allAttempts.push({ key: item.key, model: m });
    }
  }
  for (const item of resolvedPerKey) {
    for (const m of item.standardModels) {
      allAttempts.push({ key: item.key, model: m });
    }
  }

  const freshAttempts = allAttempts.filter(
    (a) => !isMarkedExhaustedToday(a.key, a.model)
  );
  const schedule = freshAttempts.length > 0 ? freshAttempts : allAttempts;

  const maxTeams = Math.max(12, teams.length);
  const promptText = buildFreeFireVisionPrompt(teams, imageParts.length);

  onProgress?.('Analyzing scoreboard with AI Vision (Beta)...', 0.56);

  let sawRateLimit = false;
  let sawInvalidKey = false;

  for (const attempt of schedule) {
    let response: Response;
    try {
      response = await fetch(
        `${VISION_API_BASE}/models/${encodeURIComponent(
          attempt.model
        )}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': attempt.key,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [...imageParts, { text: promptText }],
              },
            ],
            generationConfig: {
              temperature: 0,
              responseMimeType: 'application/json',
              responseSchema: SCOREBOARD_RESPONSE_SCHEMA,
            },
          }),
        }
      );
    } catch {
      throw new AiScannerError(
        'NETWORK_ERROR',
        'Network error while contacting AI Vision. Check your internet connection and retry.'
      );
    }

    if (response.ok) {
      onProgress?.('Verifying kills & matching squads...', 0.88);
      const data = (await response.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };
      const rawText =
        data?.candidates?.[0]?.content?.parts
          ?.map((pt) => pt.text || '')
          .join('') || '';
      if (!rawText.trim()) {
        throw new AiScannerError(
          'PARSE_ERROR',
          'AI returned an empty scoreboard response. Try clearer full-screen match screenshots.'
        );
      }
      const matched = parseAiStandingsJson(rawText, teams, maxTeams);
      onProgress?.('AI standings ready', 1);
      return matched;
    }

    if (response.status === 429) {
      sawRateLimit = true;
      const errBody = await response.json().catch(() => null);
      const msg = String(errBody?.error?.message || '');
      if (/per.?day|daily|rpd|quota/i.test(msg)) {
        markExhaustedToday(attempt.key, attempt.model);
      }
      // Immediately fail over to the next API key / model in the pool!
      continue;
    }

    if (response.status === 401 || response.status === 403) {
      sawInvalidKey = true;
      continue;
    }

    if (response.status === 400) {
      const errBody = await response.json().catch(() => null);
      const msg = String(errBody?.error?.message || '');
      if (/api.?key/i.test(msg)) {
        sawInvalidKey = true;
      }
      continue;
    }

    // 404 or retired model -> continue to next discovered model/key
  }

  if (sawRateLimit) {
    throw new AiScannerError(
      'RATE_LIMITED',
      'Daily AI scan limit reached across your account quota for today. Please try again later or use Rapid #1-#12 mode.'
    );
  }

  if (sawInvalidKey) {
    throw new AiScannerError(
      'INVALID_CONFIG',
      'AI scan quota configuration needs attention. Please contact an administrator.'
    );
  }

  throw new AiScannerError(
    'PARSE_ERROR',
    'AI scan could not complete right now. Please try again.'
  );
}
