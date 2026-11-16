import type { AllowedUserRecord, UserRole, UserStatus } from '../types/auth';

export const SUPER_ADMIN_EMAIL = 'johncenahzoppy@gmail.com';
export const VALID_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();

export const isValidEmailAddress = (email: string): boolean => {
  const clean = normalizeEmail(email);
  return clean.length >= 3 && clean.length <= 254 && VALID_EMAIL_REGEX.test(clean);
};

export const sanitizeDisplayName = (displayName: string, email: string): string => {
  const cleaned = (displayName.trim() || email.split('@')[0].toUpperCase()).slice(0, 120);
  return cleaned || 'USER';
};

export interface BuildAllowedUserInput {
  email: string;
  displayName: string;
  role: UserRole;
  status?: UserStatus;
  notes?: string;
  currentUserEmail: string;
  existingData?: Partial<AllowedUserRecord> | null;
  now?: number;
}

/**
 * Normalizes and validates an allowlist payload to match firestore.rules constraints.
 */
export const buildAllowedUserRecord = ({
  email,
  displayName,
  role,
  status = 'active',
  notes = '',
  currentUserEmail,
  existingData,
  now = Date.now(),
}: BuildAllowedUserInput): AllowedUserRecord => {
  const cleanEmail = normalizeEmail(email);
  if (!isValidEmailAddress(cleanEmail)) {
    throw new Error('Please enter a valid Google email address.');
  }

  const isSuper = cleanEmail === SUPER_ADMIN_EMAIL;
  const existingAddedBy =
    typeof existingData?.addedBy === 'string' && existingData.addedBy.trim()
      ? existingData.addedBy.trim()
      : '';
  const existingCreatedAt =
    typeof existingData?.createdAt === 'number' &&
    Number.isFinite(existingData.createdAt) &&
    existingData.createdAt >= 0
      ? existingData.createdAt
      : now;

  return {
    email: cleanEmail,
    displayName: sanitizeDisplayName(displayName, cleanEmail),
    role: isSuper ? 'admin' : role,
    status: isSuper ? 'active' : status,
    notes: notes.trim().slice(0, 1000),
    addedBy: (existingAddedBy || normalizeEmail(currentUserEmail)).slice(0, 254),
    createdAt: existingCreatedAt,
    updatedAt: now,
  };
};

const SAFE_DATA_IMAGE_REGEX =
  /^data:image\/(?:png|jpeg|jpg|webp|gif|bmp);base64,[a-zA-Z0-9+/=\s]+$/i;

/**
 * Restricts imported or user-supplied image URLs to safe raster/HTTP/relative schemes
 * (blocking javascript:, vbscript:, data:text/html, and scriptable data:image/svg+xml).
 */
export const sanitizeImageUrl = (raw?: unknown): string | undefined => {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2_000_000) return undefined;
  if (trimmed.startsWith('/assets/')) return trimmed;
  if (SAFE_DATA_IMAGE_REGEX.test(trimmed)) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    return undefined;
  }
  return undefined;
};

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export const stripForbiddenObjectKeys = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => stripForbiddenObjectKeys(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (FORBIDDEN_KEYS.has(key)) continue;
      clean[key] = stripForbiddenObjectKeys(val);
    }
    return clean as T;
  }
  return value;
};

export const sanitizeImportedTournamentPayload = (
  raw: unknown
): Record<string, unknown> | null => {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const cleanRoot = stripForbiddenObjectKeys(raw) as Record<string, unknown>;
  if (!Array.isArray(cleanRoot.tournaments)) return null;
  if (cleanRoot.tournaments.length > 100) return null;

  const cleanTournaments = cleanRoot.tournaments
    .filter((item) => item !== null && typeof item === 'object' && !Array.isArray(item))
    .map((rawT) => {
      const t = rawT as Record<string, unknown>;
      const settings =
        t.settings !== null && typeof t.settings === 'object' && !Array.isArray(t.settings)
          ? { ...(t.settings as Record<string, unknown>) }
          : {};

      settings.hostLogoUrl = sanitizeImageUrl(settings.hostLogoUrl);
      settings.sponsorLogoUrl = sanitizeImageUrl(settings.sponsorLogoUrl);
      settings.customLogoUrl = sanitizeImageUrl(settings.customLogoUrl);

      const rawTeams = Array.isArray(t.teams) ? t.teams.slice(0, 64) : [];
      const cleanTeams = rawTeams
        .filter((tm) => tm !== null && typeof tm === 'object' && !Array.isArray(tm))
        .map((rawTm) => {
          const tm = { ...(rawTm as Record<string, unknown>) };
          tm.logoUrl = sanitizeImageUrl(tm.logoUrl);
          return tm;
        });

      const rawMatches = Array.isArray(t.matches) ? t.matches.slice(0, 64) : [];
      return {
        ...t,
        settings,
        teams: cleanTeams,
        matches: rawMatches,
      };
    });

  return {
    ...cleanRoot,
    tournaments: cleanTournaments,
  };
};
