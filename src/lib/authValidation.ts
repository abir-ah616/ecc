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
