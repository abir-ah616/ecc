import { describe, expect, it } from 'vitest';
import {
  buildAllowedUserRecord,
  isValidEmailAddress,
  normalizeEmail,
  sanitizeDisplayName,
  sanitizeImageUrl,
  sanitizeImportedTournamentPayload,
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
      allowAiAuto: false,
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

  it('builds a normalized temporary user record while keeping super admin locked', () => {
    const tempRecord = buildAllowedUserRecord({
      email: ' Guest.Player@Example.COM ',
      displayName: '  Guest Player  ',
      role: 'temp',
      notes: 'Auto temp login',
      currentUserEmail: 'guest.player@example.com',
      now: 1794678600000,
    });

    expect(tempRecord.email).toBe('guest.player@example.com');
    expect(tempRecord.displayName).toBe('Guest Player');
    expect(tempRecord.role).toBe('temp');
    expect(tempRecord.status).toBe('active');
    expect(tempRecord.addedBy).toBe('guest.player@example.com');
    expect(tempRecord.createdAt).toBe(1794678600000);

    const superRecord = buildAllowedUserRecord({
      email: SUPER_ADMIN_EMAIL,
      displayName: 'Super',
      role: 'temp',
      status: 'disabled',
      currentUserEmail: SUPER_ADMIN_EMAIL,
      now: 1794678700000,
    });

    expect(superRecord.role).toBe('admin');
    expect(superRecord.status).toBe('active');
  });

  it('sanitizes image URLs and strips forbidden prototype keys from imported JSON', () => {
    expect(sanitizeImageUrl('https://cdn.example.com/logo.png')).toBe(
      'https://cdn.example.com/logo.png'
    );
    expect(sanitizeImageUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(
      'data:image/png;base64,iVBORw0KGgo='
    );
    expect(sanitizeImageUrl('/assets/app-icon.png')).toBe('/assets/app-icon.png');
    expect(sanitizeImageUrl('javascript:alert(1)')).toBeUndefined();
    expect(sanitizeImageUrl('data:image/svg+xml;base64,PHN2Zz4=')).toBeUndefined();
    expect(sanitizeImageUrl('data:text/html,<script>1</script>')).toBeUndefined();

    const parsed = JSON.parse(
      '{"__proto__":{"polluted":true},"tournaments":[{"id":"t1","settings":{"customLogoUrl":"javascript:alert(1)","hostLogoUrl":"https://cdn.example.com/h.png"},"teams":[{"id":"a","name":"Team A","logoUrl":"data:text/html,x"}],"matches":[]}]}'
    );
    const clean = sanitizeImportedTournamentPayload(parsed);
    expect(clean).not.toBeNull();
    expect(Object.prototype.hasOwnProperty.call(clean, '__proto__')).toBe(false);
    const t0 = (clean!.tournaments as Array<Record<string, unknown>>)[0];
    const s0 = t0.settings as Record<string, unknown>;
    const tm0 = (t0.teams as Array<Record<string, unknown>>)[0];
    expect(s0.customLogoUrl).toBeUndefined();
    expect(s0.hostLogoUrl).toBe('https://cdn.example.com/h.png');
    expect(tm0.logoUrl).toBeUndefined();
  });
});
