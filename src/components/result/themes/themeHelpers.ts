import type { TeamCumulativeStanding, TournamentSettings } from '../../../types/tournament';

export interface SplitHeadline {
  line1: string;
  line2: string;
  whiteoutTop: string;
  whiteoutBottom: string;
  watermark: string;
}

/** Formats tournament roundOrDay and title into crisp broadcast headline lines. */
export function buildHeadlineParts(settings: TournamentSettings): SplitHeadline {
  const rawRound = (settings.roundOrDay || 'GRAND FINALS').trim().toUpperCase();
  const cleanedRound = rawRound
    .replace(/\bSTANDINGS?\b/gi, '')
    .replace(/\s*[-|//]+\s*$/, '')
    .trim();

  let line1 = cleanedRound || 'GRAND FINALS';
  let line2 = 'STANDINGS';

  // If round has a separator like "GRAND FINALS - DAY 1", put round on line1 and day on line2 or keep concise
  const dashSplit = cleanedRound.split(/\s*[-|]\s*/).filter(Boolean);
  if (dashSplit.length >= 2) {
    line1 = dashSplit[0];
    line2 = `${dashSplit.slice(1).join(' ')} STANDINGS`;
  }

  // Whiteout Pro stacks 2 thick short lines beside a faint outline watermark
  const words = line1.split(/\s+/).filter(Boolean);
  let whiteoutTop = line1;
  let whiteoutBottom = 'STANDINGS';
  if (words.length >= 2) {
    const mid = Math.ceil(words.length / 2);
    whiteoutTop = words.slice(0, mid).join(' ');
    whiteoutBottom = words.slice(mid).join(' ');
  }

  const dayMatch =
    `${rawRound} ${settings.name}`.match(/\b(?:DAY\s*(\d+)|D(\d+))\b/i);
  const watermark = dayMatch
    ? `D${dayMatch[1] || dayMatch[2]}`
    : 'D1';

  return {
    line1,
    line2,
    whiteoutTop,
    whiteoutBottom,
    watermark,
  };
}

/** Splits event title so the final token (e.g. "S2" or "2026") can carry accent highlight. */
export function splitEventNameAccent(rawName: string): {
  base: string;
  accent: string;
} {
  const name = (rawName || 'FREE FIRE ESPORTS').trim().toUpperCase();
  const parts = name.split(/\s+/);
  if (parts.length <= 1) return { base: name, accent: '' };
  return {
    base: parts.slice(0, -1).join(' '),
    accent: parts[parts.length - 1],
  };
}

/** Builds clean left-bar summary string for table header bar in both Rush & Scrim modes. */
export function buildTableRuleBanner(settings: TournamentSettings): string {
  if (settings.mode === 'CHAMPION_RUSH') {
    return 'CHAMPION RUSH STANDINGS  •  SQUAD LEADERBOARD';
  }
  const booyahPts = settings.pointSystem?.placementPoints?.[0] ?? 12;
  const killPts = settings.pointSystem?.killPoints ?? 1;
  return `BOOYAH = ${booyahPts} PTS  •  ${killPts} PT PER ELIMINATION`;
}

/** Generates short team seed/initial tag (e.g. "T1", "T10", "S12") matching broadcast templates. */
export function resolveTeamTag(
  team: TeamCumulativeStanding,
  index: number
): string {
  const parts = (team.teamName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    if (/^\d+$/.test(last) && parts[0].length > 0) {
      return `${parts[0][0]}${last}`.slice(0, 4).toUpperCase();
    }
  }
  const tag = team.shortCode?.trim().toUpperCase();
  if (tag && tag.length <= 4) return tag;
  return `T${index + 1}`;
}

/** Computes a safe px font size so long custom titles never clip or collide with emblems. */
export function fitHeadlinePx(
  text: string,
  basePx: number,
  maxCharsAtBase = 14,
  minPx = 34
): number {
  const len = (text || '').trim().length;
  if (len <= maxCharsAtBase) return basePx;
  const scaled = Math.round(basePx * (maxCharsAtBase / len) * 1.12);
  return Math.max(minPx, Math.min(basePx, scaled));
}

export interface TableDensityConfig {
  rowHeightClass: string;
  rowGapClass: string;
  rankTextClass: string;
  tagTextClass: string;
  nameTextClass: string;
  statTextClass: string;
  totalTextClass: string;
  logoSizeClass: string;
}

export function getTableDensity(
  teamCount: number,
  isPortrait: boolean,
  hasWinnerBanner: boolean
): TableDensityConfig {
  if (teamCount > 20) {
    return {
      rowHeightClass: isPortrait
        ? hasWinnerBanner
          ? 'h-[26px]'
          : 'h-[35px]'
        : 'h-[27px]',
      rowGapClass: 'gap-[2px]',
      rankTextClass: 'text-[14px]',
      tagTextClass: 'text-[10px]',
      nameTextClass: 'text-[13px]',
      statTextClass: 'text-[14px]',
      totalTextClass: 'text-[16px]',
      logoSizeClass: 'h-4 w-4',
    };
  }
  if (teamCount > 15) {
    return {
      rowHeightClass: isPortrait
        ? hasWinnerBanner
          ? 'h-[30px]'
          : 'h-[40px]'
        : 'h-[33px]',
      rowGapClass: 'gap-[2px]',
      rankTextClass: 'text-[17px]',
      tagTextClass: 'text-[11px]',
      nameTextClass: 'text-[15px]',
      statTextClass: 'text-[16px]',
      totalTextClass: 'text-[19px]',
      logoSizeClass: 'h-5 w-5',
    };
  }
  if (teamCount > 12) {
    return {
      rowHeightClass: isPortrait
        ? hasWinnerBanner
          ? 'h-[35px]'
          : 'h-[45px]'
        : 'h-[42px]',
      rowGapClass: 'gap-[4px]',
      rankTextClass: 'text-[20px]',
      tagTextClass: 'text-[12px]',
      nameTextClass: 'text-[18px]',
      statTextClass: 'text-[18px]',
      totalTextClass: 'text-[21px]',
      logoSizeClass: 'h-6 w-6',
    };
  }
  return {
    rowHeightClass: isPortrait
      ? hasWinnerBanner
        ? 'h-[42px]'
        : 'h-[58px]'
      : hasWinnerBanner
        ? 'h-[48px]'
        : 'h-[52px]',
    rowGapClass: isPortrait
      ? hasWinnerBanner
        ? 'gap-[4px]'
        : 'gap-[7px]'
      : 'gap-[6px]',
    rankTextClass: isPortrait && hasWinnerBanner ? 'text-[22px]' : 'text-[28px]',
    tagTextClass: isPortrait && hasWinnerBanner ? 'text-[13px]' : 'text-[15px]',
    nameTextClass: isPortrait && hasWinnerBanner ? 'text-[19px]' : 'text-[24px]',
    statTextClass: isPortrait && hasWinnerBanner ? 'text-[20px]' : 'text-[24px]',
    totalTextClass: isPortrait && hasWinnerBanner ? 'text-[24px]' : 'text-[28px]',
    logoSizeClass: isPortrait && hasWinnerBanner ? 'h-6 w-6' : 'h-8 w-8',
  };
}
