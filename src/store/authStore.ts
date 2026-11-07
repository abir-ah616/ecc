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
  onSnapshot,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { auth, db, googleProvider, SUPER_ADMIN_EMAIL } from '../lib/firebase';
import type { AllowedUserRecord, UserRole, UserStatus } from '../types/auth';

interface AuthState {
  firebaseUser: User | null;
  allowedRecord: AllowedUserRecord | null;
  allUsers: AllowedUserRecord[];
  isLoading: boolean;
  isAllowed: boolean;
  isAdmin: boolean;
  authError: string | null;
  isAdminDashboardOpen: boolean;

  setAdminDashboardOpen: (open: boolean) => void;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;

  addAllowedUser: (input: {
    email: string;
    displayName: string;
    role: UserRole;
    status?: UserStatus;
    notes?: string;
  }) => Promise<void>;

  updateAllowedUser: (
    email: string,
    updates: {
      displayName: string;
      role: UserRole;
      status: UserStatus;
      notes?: string;
    }
  ) => Promise<void>;

  deleteAllowedUser: (email: string) => Promise<void>;
}

let userDocUnsub: Unsubscribe | null = null;
let allUsersUnsub: Unsubscribe | null = null;
let authInitialized = false;

export const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();

export const useAuthStore = create<AuthState>((set, get) => ({
  firebaseUser: null,
  allowedRecord: null,
  allUsers: [],
  isLoading: true,
  isAllowed: false,
  isAdmin: false,
  authError: null,
  isAdminDashboardOpen: false,

  setAdminDashboardOpen: (open) => set({ isAdminDashboardOpen: open }),
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
    if (userDocUnsub) {
      userDocUnsub();
      userDocUnsub = null;
    }
    if (allUsersUnsub) {
      allUsersUnsub();
      allUsersUnsub = null;
    }
    await signOut(auth);
    set({
      firebaseUser: null,
      allowedRecord: null,
      allUsers: [],
      isAllowed: false,
      isAdmin: false,
      isAdminDashboardOpen: false,
      isLoading: false,
      authError: null,
    });
  },

  addAllowedUser: async ({ email, displayName, role, status = 'active', notes = '' }) => {
    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }

    const currentUserEmail = normalizeEmail(get().firebaseUser?.email || '');
    const now = Date.now();
    const userRef = doc(db, 'allowed_users', cleanEmail);
    const existing = await getDoc(userRef);

    const record: AllowedUserRecord = {
      email: cleanEmail,
      displayName:
        displayName.trim() || cleanEmail.split('@')[0].toUpperCase(),
      role: cleanEmail === SUPER_ADMIN_EMAIL ? 'admin' : role,
      status: cleanEmail === SUPER_ADMIN_EMAIL ? 'active' : status,
      notes: notes.trim(),
      addedBy: existing.exists()
        ? (existing.data().addedBy as string) || currentUserEmail
        : currentUserEmail,
      createdAt: existing.exists()
        ? (existing.data().createdAt as number) || now
        : now,
      updatedAt: now,
    };

    await setDoc(userRef, record, { merge: true });
  },

  updateAllowedUser: async (email, { displayName, role, status, notes = '' }) => {
    const cleanEmail = normalizeEmail(email);
    const isSuper = cleanEmail === SUPER_ADMIN_EMAIL;
    const userRef = doc(db, 'allowed_users', cleanEmail);

    await updateDoc(userRef, {
      displayName:
        displayName.trim() || cleanEmail.split('@')[0].toUpperCase(),
      role: isSuper ? 'admin' : role,
      status: isSuper ? 'active' : status,
      notes: notes.trim(),
      updatedAt: Date.now(),
    });
  },

  deleteAllowedUser: async (email) => {
    const cleanEmail = normalizeEmail(email);
    if (cleanEmail === SUPER_ADMIN_EMAIL) {
      throw new Error('Cannot delete the primary Super Admin account.');
    }
    await deleteDoc(doc(db, 'allowed_users', cleanEmail));
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
        if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;
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
    if (userDocUnsub) {
      userDocUnsub();
      userDocUnsub = null;
    }
    if (allUsersUnsub) {
      allUsersUnsub();
      allUsersUnsub = null;
    }

    if (!user || !user.email) {
      useAuthStore.setState({
        firebaseUser: null,
        allowedRecord: null,
        allUsers: [],
        isAllowed: false,
        isAdmin: false,
        isLoading: false,
      });
      return;
    }

    const emailLower = normalizeEmail(user.email);
    const isSuperAdmin = emailLower === SUPER_ADMIN_EMAIL;
    const userDocRef = doc(db, 'allowed_users', emailLower);

    // If Super Admin logs in, ensure their record exists in Firestore
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

    // Subscribe to the user's own allowlist document in real time
    userDocUnsub = onSnapshot(
      userDocRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as AllowedUserRecord;
          const active = isSuperAdmin || data.status === 'active';
          const admin =
            isSuperAdmin || (active && data.role === 'admin');

          useAuthStore.setState({
            firebaseUser: user,
            allowedRecord: data,
            isAllowed: active,
            isAdmin: admin,
            isLoading: false,
          });

          // Update lastLoginAt / uid / photoURL once per session if active
          if (active && (!data.uid || data.uid !== user.uid)) {
            try {
              await updateDoc(userDocRef, {
                lastLoginAt: Date.now(),
                updatedAt: Date.now(),
                uid: user.uid,
                photoURL: user.photoURL || data.photoURL || '',
                displayName:
                  data.displayName ||
                  user.displayName ||
                  emailLower.split('@')[0].toUpperCase(),
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
        } else if (isSuperAdmin) {
          // Fallback if Firestore doc hasn't synced yet for super admin
          const fallbackRecord: AllowedUserRecord = {
            email: emailLower,
            displayName: user.displayName || 'MR. OPPY (SUPER ADMIN)',
            role: 'admin',
            status: 'active',
            notes: 'Primary System Administrator',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          useAuthStore.setState({
            firebaseUser: user,
            allowedRecord: fallbackRecord,
            isAllowed: true,
            isAdmin: true,
            isLoading: false,
          });
          startAllUsersSubscription();
        } else {
          // User is signed in with Google, but NOT in /allowed_users
          useAuthStore.setState({
            firebaseUser: user,
            allowedRecord: null,
            isAllowed: false,
            isAdmin: false,
            isLoading: false,
          });
        }
      },
      (err) => {
        console.error('Allowlist check error:', err);
        if (isSuperAdmin) {
          useAuthStore.setState({
            firebaseUser: user,
            isAllowed: true,
            isAdmin: true,
            isLoading: false,
          });
          startAllUsersSubscription();
        } else {
          useAuthStore.setState({
            firebaseUser: user,
            allowedRecord: null,
            isAllowed: false,
            isAdmin: false,
            isLoading: false,
          });
        }
      }
    );
  });
};

if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__useAuthStore = useAuthStore;
}
