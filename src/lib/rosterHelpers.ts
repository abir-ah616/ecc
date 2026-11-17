import type { TeamCumulativeStanding, TournamentSettings } from '../types/tournament';

const PLACEHOLDER_SQUAD_REGEX = /^(?:squad|team|slot)\s*\d+$/i;

export function isPlaceholderSquadName(name: string): boolean {
  const trimmed = name.trim();
  return !trimmed || PLACEHOLDER_SQUAD_REGEX.test(trimmed);
}

export function toSquadVaultId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
  return `sq_${slug || 'team'}`;
}

/**
 * Cleans messy WhatsApp / Discord / Messenger slot lists into clean team names.
 * Examples handled:
 *   "Slot 01 - BDR Esports" -> "BDR Esports"
 *   "2) EVOS Divine | Confirmed" -> "EVOS Divine"
 *   "#03. Team Liquid [PAID]" -> "Team Liquid"
 */
export function parseSmartSlotList(rawText: string, maxTeams = 24): string[] {
  if (!rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/);
  const cleaned: string[] = [];

  for (const rawLine of lines) {
    // Strip surrogate pairs / pictographs without embedding literal emojis in source
    let line = rawLine
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ' ')
      .replace(/[\u2600-\u27BF]/g, ' ')
      .trim();

    if (!line) continue;

    // Skip pure header lines like "SLOT LIST:" or "CONFIRMED TEAMS"
    if (/^(?:slot\s*list|team\s*list|confirmed\s*(?:teams|squads)|registered\s*teams)\s*:?$/i.test(line)) {
      continue;
    }

    // Strip leading slot prefixes: "Slot 01 -", "Team 2:", "#03.", "04)", "- [5]"
    line = line.replace(
      /^(?:[-*•]+\s*)?(?:\[?\s*(?:slot|team|no\.?|#)\s*\d+\s*\]?|#?\d{1,2})\s*(?:[-–—:|.)\]]+\s*|\s+)/i,
      ''
    );

    // Strip trailing status annotations: "| Confirmed", "(Paid)", "- booked"
    line = line.replace(
      /\s*(?:[|\-–—]\s*|\(\s*|\[\s*)(?:confirmed|confirm|paid|booked|verified|ready|slot\s*booked)\s*[)\]]?\s*$/i,
      ''
    );

    line = line.replace(/\s+/g, ' ').trim();
    if (!line || /^[-–—_.:|]+$/.test(line)) continue;

    cleaned.push(line.slice(0, 60));
    if (cleaned.length >= maxTeams) break;
  }

  return cleaned;
}

/**
 * Increments Day / Stage / Round numbers for "Clone / Start Next Day".
 * e.g. "Grand Finals - Day 1" -> "Grand Finals - Day 2"
 *      "Scrim Series" -> "Scrim Series - Day 2"
 */
export function incrementStageOrDayLabel(current: string): string {
  const trimmed = current.trim();
  if (!trimmed) return 'Day 2';

  const dayMatch = trimmed.match(/^(.*?\b(?:day|round|stage|week|phase)\s*#?0*)(\d+)(.*)$/i);
  if (dayMatch) {
    const nextNum = parseInt(dayMatch[2], 10) + 1;
    return `${dayMatch[1]}${nextNum}${dayMatch[3]}`;
  }

  const trailingNum = trimmed.match(/^(.*?\s+)(\d+)$/);
  if (trailingNum) {
    const nextNum = parseInt(trailingNum[2], 10) + 1;
    return `${trailingNum[1]}${nextNum}`;
  }

  return `${trimmed} - Day 2`;
}

/**
 * Formats standings into clean plain-text suitable for pasting into WhatsApp / Discord.
 */
export function formatStandingsTextSummary(params: {
  settings: TournamentSettings;
  standings: TeamCumulativeStanding[];
  viewMode: 'OVERALL' | 'SINGLE_MATCH';
  matchNumber?: number;
  completedMatches: number;
}): string {
  const { settings, standings, viewMode, matchNumber, completedMatches } = params;
  const headerTitle = (settings.name || 'TOURNAMENT').toUpperCase();
  const scopeLabel =
    viewMode === 'SINGLE_MATCH'
      ? `MATCH ${matchNumber || 1} RESULTS`
      : `OVERALL STANDINGS (${completedMatches} ${completedMatches === 1 ? 'MATCH' : 'MATCHES'})`;

  const lines: string[] = [
    `${headerTitle}`,
    `${settings.roundOrDay ? `${settings.roundOrDay.toUpperCase()} · ` : ''}${scopeLabel}`,
    '------------------------------------',
  ];

  for (const row of standings) {
    const rankStr = `#${String(row.rank).padStart(2, '0')}`;
    const booyahPart = row.booyahCount > 0 ? ` | ${row.booyahCount}B` : '';
    const rushPart =
      viewMode === 'OVERALL' && settings.mode === 'CHAMPION_RUSH'
        ? row.rushStatus.status === 'CHAMPION'
          ? ' [CHAMPION]'
          : row.rushStatus.status === 'ACTIVE'
          ? ' [RUSH]'
          : ''
        : '';
    lines.push(
      `${rankStr} ${row.teamName} - ${row.totalPoints} PTS (${row.kills}K${booyahPart})${rushPart}`
    );
  }

  if (settings.hostName?.trim()) {
    lines.push('------------------------------------');
    lines.push(`Organized by ${settings.hostName.trim()}`);
  }

  return lines.join('\n');
}

/**
 * Downscales and compresses an uploaded image file to <= maxDim px so logos stay
 * fast in posters, under localStorage limits, and well below Firestore's 1 MB doc cap.
 */
export async function compressImageFileToDataUrl(
  file: File,
  maxDim = 256
): Promise<string> {
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read image'));
      reader.readAsDataURL(file);
    });
  }

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const ratio = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
        const targetW = Math.max(1, Math.round(img.width * ratio));
        const targetH = Math.max(1, Math.round(img.height * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }
        ctx.clearRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);
        // Prefer WebP (preserves transparency at ~1/4 PNG size), fallback to PNG
        const webp = canvas.toDataURL('image/webp', 0.86);
        if (webp.startsWith('data:image/webp')) {
          resolve(webp);
        } else {
          resolve(canvas.toDataURL('image/png'));
        }
      } catch {
        resolve(rawDataUrl);
      }
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}

function normalizeMatchKey(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Matches an uploaded logo filename (e.g. "evos-divine.png" or "03_bdr.webp")
 * to the best squad index in `squadNames`.
 */
export function matchLogoFilenameToSquadIndex(
  filename: string,
  squadNames: string[],
  usedIndices: Set<number>
): number {
  const stem = filename.replace(/\.[^.]+$/, '').trim();
  const cleanStem = normalizeMatchKey(stem.replace(/^\d+[\s_-]*/, ''));

  if (cleanStem.length >= 2) {
    // 1. Exact or strong substring match against unused squads
    for (let i = 0; i < squadNames.length; i += 1) {
      if (usedIndices.has(i)) continue;
      const key = normalizeMatchKey(squadNames[i]);
      if (!key || isPlaceholderSquadName(squadNames[i])) continue;
      if (key === cleanStem || key.includes(cleanStem) || cleanStem.includes(key)) {
        return i;
      }
    }
  }

  // 2. Leading slot number in filename e.g. "01.png" or "slot_4.png"
  const numMatch = stem.match(/^(?:slot|team|sq)?[\s_-]*0*(\d{1,2})\b/i);
  if (numMatch) {
    const idx = parseInt(numMatch[1], 10) - 1;
    if (idx >= 0 && idx < squadNames.length && !usedIndices.has(idx)) {
      return idx;
    }
  }

  // 3. Fallback: first unused slot
  for (let i = 0; i < squadNames.length; i += 1) {
    if (!usedIndices.has(i)) return i;
  }
  return -1;
}

/**
 * Resolves all configured team member IGNs for a squad (backward-compatible with player1/player2).
 */
export function resolveSquadPlayers(item?: {
  player1?: string;
  player2?: string;
  players?: string[];
}): string[] {
  if (!item) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  const candidates = [
    ...(item.players || []),
    item.player1 || '',
    item.player2 || '',
  ];
  for (const raw of candidates) {
    const trimmed = raw.trim().slice(0, 60);
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    out.push(trimmed);
    if (out.length >= 8) break;
  }
  return out;
}

/**
 * Normalizes an array of draft player strings into synchronized { players, player1, player2 } fields.
 */
export function buildSquadPlayerFields(rawPlayers: string[]): {
  players?: string[];
  player1?: string;
  player2?: string;
} {
  const cleaned = resolveSquadPlayers({ players: rawPlayers });
  return {
    players: cleaned.length > 0 ? cleaned : undefined,
    player1: cleaned[0],
    player2: cleaned[1],
  };
}
