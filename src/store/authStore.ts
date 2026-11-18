import { create } from 'zustand';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  onSnapshot,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { auth, db, googleProvider, SUPER_ADMIN_EMAIL } from '../lib/firebase';
import {
  buildAllowedUserRecord,
  isValidEmailAddress,
  normalizeEmail,
  sanitizeDisplayName,
} from '../lib/authValidation';
import type { AllowedUserRecord, UserRole, UserStatus } from '../types/auth';

export { normalizeEmail };

interface AuthState {
  firebaseUser: User | null;
  allowedRecord: AllowedUserRecord | null;
  allUsers: AllowedUserRecord[];
  allowTempLogin: boolean;
  isLoading: boolean;
  isAllowed: boolean;
  isAdmin: boolean;
  canUseAiAuto: boolean;
  authError: string | null;
  isAdminDashboardOpen: boolean;
  requestOpenProfileSettings: boolean;

  setAdminDashboardOpen: (open: boolean) => void;
  setRequestOpenProfileSettings: (open: boolean) => void;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;

  setAllowTempLogin: (enabled: boolean) => Promise<void>;
  promoteTempToUser: (u: AllowedUserRecord) => Promise<void>;
  toggleUserAiAuto: (u: AllowedUserRecord, enabled: boolean) => Promise<void>;

  addAllowedUser: (input: {
    email: string;
    displayName: string;
    role: UserRole;
    status?: UserStatus;
    allowAiAuto?: boolean;
    notes?: string;
  }) => Promise<void>;

  updateAllowedUser: (
    email: string,
    updates: {
      displayName: string;
      role: UserRole;
      status: UserStatus;
      allowAiAuto?: boolean;
      notes?: string;
    }
  ) => Promise<void>;

  deleteAllowedUser: (email: string) => Promise<void>;
}

let userDocUnsub: Unsubscribe | null = null;
let allUsersUnsub: Unsubscribe | null = null;
let authSettingsUnsub: Unsubscribe | null = null;
let visibilityCleanup: (() => void) | null = null;
let authInitialized = false;

const formatAllowedUserError = (err: unknown, currentEmail: string): Error => {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: unknown }).code)
      : '';
  if (code === 'permission-denied') {
    return new Error(
      `Permission denied by Firestore rules. Verify ${currentEmail || 'this account'} has active admin access.`
    );
  }
  if (err instanceof Error) return err;
  return new Error('Failed to save allowed user.');
};

const ROLE_ORDER: Record<UserRole, number> = {
  admin: 0,
  user: 1,
  temp: 2,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  firebaseUser: null,
  allowedRecord: null,
  allUsers: [],
  allowTempLogin: false,
  isLoading: true,
  isAllowed: false,
  isAdmin: false,
  canUseAiAuto: false,
  authError: null,
  isAdminDashboardOpen: false,
  requestOpenProfileSettings: false,

  setAdminDashboardOpen: (open) => set({ isAdminDashboardOpen: open }),
  setRequestOpenProfileSettings: (open) =>
    set({ requestOpenProfileSettings: open }),
  clearAuthError: () => set({ authError: null }),

  signInWithGoogle: async () => {
    set({ authError: null, isLoading: true });
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      if (firebaseErr.code === 'auth/popup-closed-by-user') {
        set({
          isLoading: false,
          authError: 'Google sign-in popup was closed before completion.',
        });
      } else if (firebaseErr.code === 'auth/unauthorized-domain') {
        set({
          isLoading: false,
          authError:
            'This domain is not yet authorized in Firebase Auth settings.',
        });
      } else {
        set({
          isLoading: false,
          authError:
            firebaseErr.message || 'Google sign-in failed. Please try again.',
        });
      }
    }
  },

  logout: async () => {
    if (visibilityCleanup) {
      visibilityCleanup();
      visibilityCleanup = null;
    }
    if (userDocUnsub) {
      userDocUnsub();
      userDocUnsub = null;
    }
    if (allUsersUnsub) {
      allUsersUnsub();
      allUsersUnsub = null;
    }
    if (authSettingsUnsub) {
      authSettingsUnsub();
      authSettingsUnsub = null;
    }
    await signOut(auth);
    set({
      firebaseUser: null,
      allowedRecord: null,
      allUsers: [],
      isAllowed: false,
      isAdmin: false,
      canUseAiAuto: false,
      isAdminDashboardOpen: false,
      requestOpenProfileSettings: false,
      isLoading: false,
      authError: null,
    });
  },

  setAllowTempLogin: async (enabled) => {
    const currentUserEmail = normalizeEmail(get().firebaseUser?.email || '');
    if (!currentUserEmail || !get().isAdmin) {
      throw new Error('Admin authentication required.');
    }
    try {
      await setDoc(
        doc(db, 'app_settings', 'auth'),
        {
          allowTempLogin: enabled,
          updatedAt: Date.now(),
          updatedBy: currentUserEmail,
        },
        { merge: true }
      );
      set({ allowTempLogin: enabled });
    } catch (err) {
      throw formatAllowedUserError(err, currentUserEmail);
    }
  },

  promoteTempToUser: async (u) => {
    await get().updateAllowedUser(u.email, {
      displayName: u.displayName,
      role: 'user',
      status: 'active',
      allowAiAuto: Boolean(u.allowAiAuto),
      notes: u.notes || '',
    });
  },

  toggleUserAiAuto: async (u, enabled) => {
    await get().updateAllowedUser(u.email, {
      displayName: u.displayName,
      role: u.role,
      status: u.status,
      allowAiAuto: enabled,
      notes: u.notes || '',
    });
  },

  addAllowedUser: async ({
    email,
    displayName,
    role,
    status = 'active',
    allowAiAuto = false,
    notes = '',
  }) => {
    const currentUserEmail = normalizeEmail(get().firebaseUser?.email || '');
    if (!currentUserEmail || !get().isAdmin) {
      throw new Error('You must be signed in as an admin to authorize users.');
    }

    const cleanEmail = normalizeEmail(email);
    if (!isValidEmailAddress(cleanEmail)) {
      throw new Error('Please enter a valid Google email address.');
    }

    const userRef = doc(db, 'allowed_users', cleanEmail);
    try {
      const existing = await getDoc(userRef);
      const record = buildAllowedUserRecord({
        email: cleanEmail,
        displayName,
        role,
        status,
        allowAiAuto,
        notes,
        currentUserEmail,
        existingData: existing.exists()
          ? (existing.data() as Partial<AllowedUserRecord>)
          : null,
      });
      await setDoc(userRef, record, { merge: true });
    } catch (err) {
      throw formatAllowedUserError(err, currentUserEmail);
    }
  },

  updateAllowedUser: async (
    email,
    { displayName, role, status, allowAiAuto, notes = '' }
  ) => {
    const currentUserEmail = normalizeEmail(get().firebaseUser?.email || '');
    if (!currentUserEmail || !get().isAdmin) {
      throw new Error('You must be signed in as an admin to update users.');
    }
    const cleanEmail = normalizeEmail(email);
    const isSuper = cleanEmail === SUPER_ADMIN_EMAIL;
    const effectiveRole: UserRole = isSuper ? 'admin' : role;
    const userRef = doc(db, 'allowed_users', cleanEmail);

    const payload: Record<string, unknown> = {
      displayName: sanitizeDisplayName(displayName, cleanEmail),
      role: effectiveRole,
      status: isSuper ? 'active' : status,
      notes: notes.trim().slice(0, 1000),
      updatedAt: Date.now(),
    };
    if (effectiveRole === 'admin') {
      payload.allowAiAuto = true;
    } else if (typeof allowAiAuto === 'boolean') {
      payload.allowAiAuto = allowAiAuto;
    }

    try {
      await updateDoc(userRef, payload);
    } catch (err) {
      throw formatAllowedUserError(err, currentUserEmail);
    }
  },

  deleteAllowedUser: async (email) => {
    const currentUserEmail = normalizeEmail(get().firebaseUser?.email || '');
    if (!currentUserEmail || !get().isAdmin) {
      throw new Error('You must be signed in as an admin to remove users.');
    }
    const cleanEmail = normalizeEmail(email);
    if (cleanEmail === SUPER_ADMIN_EMAIL) {
      throw new Error('Cannot delete the primary Super Admin account.');
    }
    try {
      await deleteDoc(doc(db, 'allowed_users', cleanEmail));
    } catch (err) {
      throw formatAllowedUserError(err, currentUserEmail);
    }
  },
}));

const startAllUsersSubscription = () => {
  if (allUsersUnsub) {
    allUsersUnsub();
    allUsersUnsub = null;
  }

  const colRef = collection(db, 'allowed_users');
  allUsersUnsub = onSnapshot(
    colRef,
    (snapshot) => {
      const list: AllowedUserRecord[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as AllowedUserRecord);
      });
      list.sort((a, b) => {
        if (a.email === SUPER_ADMIN_EMAIL) return -1;
        if (b.email === SUPER_ADMIN_EMAIL) return 1;
        const roleDiff = (ROLE_ORDER[a.role] ?? 1) - (ROLE_ORDER[b.role] ?? 1);
        if (roleDiff !== 0) return roleDiff;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
      useAuthStore.setState({ allUsers: list });
    },
    (err) => {
      console.error('Admin users subscription error:', err);
    }
  );
};

export const initAuthListener = () => {
  if (authInitialized) return;
  authInitialized = true;

  onAuthStateChanged(auth, async (user) => {
    if (visibilityCleanup) {
      visibilityCleanup();
      visibilityCleanup = null;
    }
    if (userDocUnsub) {
      userDocUnsub();
      userDocUnsub = null;
    }
    if (allUsersUnsub) {
      allUsersUnsub();
      allUsersUnsub = null;
    }
    if (authSettingsUnsub) {
      authSettingsUnsub();
      authSettingsUnsub = null;
    }

    if (!user || !user.email) {
      useAuthStore.setState({
        firebaseUser: null,
        allowedRecord: null,
        allUsers: [],
        isAllowed: false,
        isAdmin: false,
        canUseAiAuto: false,
        isLoading: false,
      });
      return;
    }

    if (!user.emailVerified) {
      useAuthStore.setState({
        firebaseUser: user,
        allowedRecord: null,
        allUsers: [],
        isAllowed: false,
        isAdmin: false,
        canUseAiAuto: false,
        authError: 'A verified Google account email is required to access this workspace.',
        isLoading: false,
      });
      return;
    }

    const emailLower = normalizeEmail(user.email);
    const isSuperAdmin = emailLower === SUPER_ADMIN_EMAIL;
    const userDocRef = doc(db, 'allowed_users', emailLower);
    const settingsRef = doc(db, 'app_settings', 'auth');

    let latestRecord: AllowedUserRecord | null = null;
    let latestRecordLoaded = false;
    let latestAllowTemp = false;
    let settingsLoaded = false;
    let serverVerified = false;
    let attemptedTempSelfRegister = false;
    let lastServerCheckAt = 0;

    const evaluateSession = async () => {
      if (!serverVerified || !latestRecordLoaded || !settingsLoaded) return;

      if (latestRecord) {
        const isActive = latestRecord.status === 'active';
        const isTemp = latestRecord.role === 'temp';
        const allowed =
          isSuperAdmin || (isActive && (!isTemp || latestAllowTemp));
        const admin =
          isSuperAdmin || (isActive && latestRecord.role === 'admin');
        const aiAuto =
          admin || (allowed && Boolean(latestRecord.allowAiAuto));

        useAuthStore.setState({
          firebaseUser: user,
          allowedRecord: latestRecord,
          allowTempLogin: latestAllowTemp,
          isAllowed: allowed,
          isAdmin: admin,
          canUseAiAuto: aiAuto,
          authError:
            isTemp && isActive && !latestAllowTemp
              ? 'Temporary login is currently disabled. Ask an administrator to re-enable Temp Login or upgrade your account to a permanent User.'
              : null,
          isLoading: false,
        });

        if (allowed && (!latestRecord.uid || latestRecord.uid !== user.uid)) {
          try {
            await updateDoc(userDocRef, {
              lastLoginAt: Date.now(),
              updatedAt: Date.now(),
              uid: user.uid,
              photoURL: user.photoURL || latestRecord.photoURL || '',
              displayName: sanitizeDisplayName(
                latestRecord.displayName || user.displayName || '',
                emailLower
              ),
            });
          } catch {
            // Ignore metadata update error if rules restrict
          }
        }

        if (admin) {
          startAllUsersSubscription();
        } else if (allUsersUnsub) {
          allUsersUnsub();
          allUsersUnsub = null;
        }
        return;
      }

      if (isSuperAdmin) {
        const fallbackRecord: AllowedUserRecord = {
          email: emailLower,
          displayName: user.displayName || 'MR. OPPY (SUPER ADMIN)',
          role: 'admin',
          status: 'active',
          allowAiAuto: true,
          notes: 'Primary System Administrator',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        useAuthStore.setState({
          firebaseUser: user,
          allowedRecord: fallbackRecord,
          allowTempLogin: latestAllowTemp,
          isAllowed: true,
          isAdmin: true,
          canUseAiAuto: true,
          isLoading: false,
        });
        startAllUsersSubscription();
        return;
      }

      // Auto-onboard un-allowlisted user as a temporary user when allowTempLogin is enabled
      if (latestAllowTemp && !attemptedTempSelfRegister) {
        attemptedTempSelfRegister = true;
        try {
          const now = Date.now();
          await setDoc(userDocRef, {
            email: emailLower,
            displayName: sanitizeDisplayName(user.displayName || '', emailLower),
            role: 'temp',
            status: 'active',
            notes: 'Temporary login session',
            addedBy: 'temp-login',
            createdAt: now,
            updatedAt: now,
            lastLoginAt: now,
            photoURL: user.photoURL || '',
            uid: user.uid,
          });
          return;
        } catch (err) {
          console.warn('Temp user onboarding error:', err);
        }
      }

      useAuthStore.setState({
        firebaseUser: user,
        allowedRecord: null,
        allowTempLogin: latestAllowTemp,
        isAllowed: false,
        isAdmin: false,
        canUseAiAuto: false,
        isLoading: false,
      });
    };

    const verifySessionWithServer = async (forceTokenRefresh: boolean) => {
      const now = Date.now();
      if (!forceTokenRefresh && now - lastServerCheckAt < 25_000) return;
      lastServerCheckAt = now;

      try {
        await user.getIdToken(forceTokenRefresh);
        const [settingsSnap, userSnap] = await Promise.all([
          getDocFromServer(settingsRef),
          getDocFromServer(userDocRef),
        ]);
        latestAllowTemp = settingsSnap.exists()
          ? Boolean(settingsSnap.data()?.allowTempLogin)
          : false;
        latestRecord = userSnap.exists()
          ? (userSnap.data() as AllowedUserRecord)
          : null;
        settingsLoaded = true;
        latestRecordLoaded = true;
        serverVerified = true;
        useAuthStore.setState({ allowTempLogin: latestAllowTemp });
        await evaluateSession();
      } catch (err: unknown) {
        const code =
          typeof err === 'object' && err !== null && 'code' in err
            ? String((err as { code?: unknown }).code)
            : '';
        if (
          code === 'auth/user-disabled' ||
          code === 'auth/user-token-expired' ||
          code === 'auth/user-not-found' ||
          code === 'auth/invalid-user-token'
        ) {
          await signOut(auth).catch(() => {});
          useAuthStore.setState({
            firebaseUser: null,
            allowedRecord: null,
            allUsers: [],
            isAllowed: false,
            isAdmin: false,
            canUseAiAuto: false,
            authError: 'Your session has been revoked or disabled.',
            isLoading: false,
          });
          return;
        }
        if (!serverVerified) {
          useAuthStore.setState({
            firebaseUser: user,
            allowedRecord: null,
            allowTempLogin: false,
            isAllowed: false,
            isAdmin: false,
            canUseAiAuto: false,
            authError:
              'Online server verification is required to sign in. Check your connection and retry.',
            isLoading: false,
          });
        }
      }
    };

    // Bootstrap Super Admin record
    if (isSuperAdmin) {
      try {
        const now = Date.now();
        await setDoc(
          userDocRef,
          {
            email: emailLower,
            displayName: user.displayName || 'MR. OPPY (SUPER ADMIN)',
            role: 'admin',
            status: 'active',
            allowAiAuto: true,
            notes: 'Primary System Administrator',
            addedBy: 'system',
            createdAt: now,
            updatedAt: now,
            lastLoginAt: now,
            photoURL: user.photoURL || '',
            uid: user.uid,
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('Super admin bootstrap write:', e);
      }
    }

    // Perform initial server-authoritative token + Firestore verification before unlocking
    await verifySessionWithServer(true);

    // Listen in real time to shared Temp Login setting (ignoring pure disk cache until server confirms)
    authSettingsUnsub = onSnapshot(
      settingsRef,
      { includeMetadataChanges: true },
      (snap) => {
        if (!serverVerified && snap.metadata.fromCache) return;
        if (!snap.metadata.fromCache) serverVerified = true;
        latestAllowTemp = snap.exists()
          ? Boolean(snap.data()?.allowTempLogin)
          : false;
        settingsLoaded = true;
        useAuthStore.setState({ allowTempLogin: latestAllowTemp });
        void evaluateSession();
      },
      () => {
        latestAllowTemp = false;
        settingsLoaded = true;
        void evaluateSession();
      }
    );

    // Subscribe to the user's own allowlist document in real time
    userDocUnsub = onSnapshot(
      userDocRef,
      { includeMetadataChanges: true },
      (docSnap) => {
        if (!serverVerified && docSnap.metadata.fromCache) return;
        if (!docSnap.metadata.fromCache) serverVerified = true;
        latestRecord = docSnap.exists()
          ? (docSnap.data() as AllowedUserRecord)
          : null;
        latestRecordLoaded = true;
        void evaluateSession();
      },
      (err) => {
        console.error('Allowlist check error:', err);
        latestRecordLoaded = true;
        if (isSuperAdmin && serverVerified) {
          useAuthStore.setState({
            firebaseUser: user,
            isAllowed: true,
            isAdmin: true,
            canUseAiAuto: true,
            isLoading: false,
          });
          startAllUsersSubscription();
        } else {
          void evaluateSession();
        }
      }
    );

    if (typeof document !== 'undefined') {
      const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          void verifySessionWithServer(false);
        }
      };
      document.addEventListener('visibilitychange', onVisibilityChange);
      visibilityCleanup = () => {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      };
    }
  });
};
