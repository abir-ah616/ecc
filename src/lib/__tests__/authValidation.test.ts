import { describe, expect, it } from 'vitest';
import {
  buildAllowedUserRecord,
  isValidEmailAddress,
  normalizeEmail,
  sanitizeDisplayName,
  SUPER_ADMIN_EMAIL,
} from '../authValidation';

describe('Allowlist Auth Validation', () => {
  it('normalizes and validates emails matching firestore.rules regex', () => {
    expect(normalizeEmail('  TeSt.User+1@Gmail.COM  ')).toBe('test.user+1@gmail.com');
    expect(isValidEmailAddress('organizer@gmail.com')).toBe(true);
    expect(isValidEmailAddress('  abirah616@gmail.com ')).toBe(true);
    expect(isValidEmailAddress('invalid-email')).toBe(false);
    expect(isValidEmailAddress('missing@tld')).toBe(false);
  });

  it('builds a valid new Firestore allowlist record with default displayName', () => {
    const record = buildAllowedUserRecord({
      email: '  NewMod@Gmail.com ',
      displayName: '   ',
      role: 'user',
      currentUserEmail: SUPER_ADMIN_EMAIL,
      now: 1794678500000,
    });

    expect(record).toEqual({
      email: 'newmod@gmail.com',
      displayName: 'NEWMOD',
      role: 'user',
      status: 'active',
      notes: '',
      addedBy: SUPER_ADMIN_EMAIL,
      createdAt: 1794678500000,
      updatedAt: 1794678500000,
    });
  });

  it('enforces field limits and preserves valid existing createdAt/addedBy metadata', () => {
    const longName = 'A'.repeat(160);
    const longNotes = 'N'.repeat(1200);

    const record = buildAllowedUserRecord({
      email: 'mod@example.com',
      displayName: longName,
      role: 'admin',
      notes: longNotes,
      currentUserEmail: SUPER_ADMIN_EMAIL,
      existingData: {
        addedBy: 'otheradmin@gmail.com',
        createdAt: 1700000000000,
      },
      now: 1794678500000,
    });

    expect(record.displayName.length).toBe(120);
    expect(record.notes?.length).toBe(1000);
    expect(record.addedBy).toBe('otheradmin@gmail.com');
    expect(record.createdAt).toBe(1700000000000);
    expect(record.updatedAt).toBe(1794678500000);
  });

  it('falls back safely when existing createdAt is missing or non-numeric and locks super admin privileges', () => {
    const record = buildAllowedUserRecord({
      email: SUPER_ADMIN_EMAIL.toUpperCase(),
      displayName: sanitizeDisplayName('', SUPER_ADMIN_EMAIL),
      role: 'user',
      status: 'disabled',
      currentUserEmail: 'someoneelse@gmail.com',
      existingData: {
        createdAt: 'not-a-number' as unknown as number,
      },
      now: 1794678500000,
    });

    expect(record.role).toBe('admin');
    expect(record.status).toBe('active');
    expect(record.createdAt).toBe(1794678500000);
  });
});
