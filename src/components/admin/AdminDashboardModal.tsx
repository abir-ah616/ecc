import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  UserPlus,
  Trash2,
  Edit3,
  Check,
  Shield,
  Users,
  KeyRound,
  Eye,
  EyeOff,
  Plus,
  Loader2,
  UserCheck,
  UserX,
  Search,
  AlertCircle,
  ScanLine,
} from 'lucide-react';
import { useAuthStore, normalizeEmail } from '../../store/authStore';
import { isValidEmailAddress, sanitizeAiApiKeyList } from '../../lib/authValidation';
import { SUPER_ADMIN_EMAIL } from '../../lib/firebase';
import {
  maskApiKey,
  parseMultiApiKeyInput,
  verifyAdminAiApiKey,
} from '../../lib/screenshotScanner';
import type { AllowedUserRecord, UserRole, UserStatus } from '../../types/auth';

type AdminSectionTab = 'USERS' | 'AI_API';
type AiFilterMode = 'ALL' | 'ENABLED' | 'MISSING_KEYS';

export const AdminDashboardModal: React.FC = () => {
  const {
    isAdmin,
    isAdminDashboardOpen,
    setAdminDashboardOpen,
    allUsers,
    allowTempLogin,
    setAllowTempLogin,
    promoteTempToUser,
    toggleUserAiAuto,
    setUserAiConfig,
    addAllowedUser,
    updateAllowedUser,
    deleteAllowedUser,
  } = useAuthStore();

  const [sectionTab, setSectionTab] = useState<AdminSectionTab>('USERS');
  const [togglingTemp, setTogglingTemp] = useState(false);

  // Add User Form State
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [newAllowAiAuto, setNewAllowAiAuto] = useState(false);
  const [newAiKeysRaw, setNewAiKeysRaw] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit User State
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editEmailInput, setEditEmailInput] = useState('');
  const [editNameInput, setEditNameInput] = useState('');
  const [editRoleInput, setEditRoleInput] = useState<UserRole>('user');
  const [editStatusInput, setEditStatusInput] = useState<UserStatus>('active');
  const [editAllowAiAutoInput, setEditAllowAiAutoInput] = useState(false);
  const [editNotesInput, setEditNotesInput] = useState('');

  // Users & Access Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<
    'ALL' | 'ADMIN' | 'USER' | 'DISABLED' | 'TEMP'
  >('ALL');

  // AI / API Management State
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiFilterMode, setAiFilterMode] = useState<AiFilterMode>('ALL');
  const [draftKeysByEmail, setDraftKeysByEmail] = useState<Record<string, string>>({});
  const [busyAiEmail, setBusyAiEmail] = useState<string | null>(null);
  const [revealedKeyIds, setRevealedKeyIds] = useState<Record<string, boolean>>({});
  const [rowStatusByEmail, setRowStatusByEmail] = useState<
    Record<string, { type: 'success' | 'error'; text: string }>
  >({});

  // Global Pinned Feedback Banner State
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isAdminDashboardOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAdminDashboardOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAdminDashboardOpen, setAdminDashboardOpen]);

  const showToast = (type: 'success' | 'error', text: string) => {
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
    setFeedback({ type, text });
    if (type === 'success') {
      feedbackTimerRef.current = window.setTimeout(() => {
        setFeedback(null);
        feedbackTimerRef.current = null;
      }, 4500);
    }
  };

  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        u.email.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        (u.notes || '').toLowerCase().includes(q);

      if (!matchesQuery) return false;
      if (roleFilter === 'ADMIN') return u.role === 'admin';
      if (roleFilter === 'USER') return u.role === 'user' && u.status === 'active';
      if (roleFilter === 'DISABLED') return u.status === 'disabled';
      if (roleFilter === 'TEMP') return u.role === 'temp';
      return true;
    });
  }, [allUsers, searchQuery, roleFilter]);

  const filteredAiUsers = useMemo(() => {
    return allUsers.filter((u) => {
      const q = aiSearchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        u.email.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q);
      if (!matchesQuery) return false;

      const aiEnabled = u.role === 'admin' || Boolean(u.allowAiAuto);
      const keyCount = (u.aiApiKeys || []).length;

      if (aiFilterMode === 'ENABLED') return aiEnabled;
      if (aiFilterMode === 'MISSING_KEYS') return aiEnabled && keyCount === 0;
      return true;
    });
  }, [allUsers, aiSearchQuery, aiFilterMode]);

  if (!isAdmin || !isAdminDashboardOpen) return null;

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeEmail(newEmail);
    if (!isValidEmailAddress(clean)) {
      showToast('error', 'Please enter a valid Google email address.');
      return;
    }

    const parsedInitialKeys = parseMultiApiKeyInput(newAiKeysRaw);
    const shouldAllowAi =
      newRole === 'admin' || newAllowAiAuto || parsedInitialKeys.length > 0;

    setIsSubmitting(true);
    try {
      await addAllowedUser({
        email: clean,
        displayName: newName.trim() || clean.split('@')[0].toUpperCase(),
        role: newRole,
        status: 'active',
        allowAiAuto: shouldAllowAi,
        aiApiKeys: parsedInitialKeys.length > 0 ? parsedInitialKeys : undefined,
        notes: newNotes.trim(),
      });
      setNewEmail('');
      setNewName('');
      setNewRole('user');
      setNewAllowAiAuto(false);
      setNewAiKeysRaw('');
      setNewNotes('');
      showToast(
        'success',
        parsedInitialKeys.length > 0
          ? `Authorized ${clean} with ${parsedInitialKeys.length} personal API key(s).`
          : `Authorized ${clean} (${newRole.toUpperCase()}).`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add user.';
      showToast('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (u: AllowedUserRecord) => {
    setEditingEmail(u.email);
    setEditEmailInput(u.email);
    setEditNameInput(u.displayName);
    setEditRoleInput(u.role);
    setEditStatusInput(u.status);
    setEditAllowAiAutoInput(u.role === 'admin' || Boolean(u.allowAiAuto));
    setEditNotesInput(u.notes || '');
  };

  const handleSaveEdit = async (originalEmail: string) => {
    const targetEmail = normalizeEmail(editEmailInput);
    if (!isValidEmailAddress(targetEmail)) {
      showToast('error', 'Please enter a valid email address.');
      return;
    }

    const existingUser = allUsers.find((item) => item.email === originalEmail);

    setIsSubmitting(true);
    try {
      const nextAiAuto =
        editRoleInput === 'admin' ? true : editAllowAiAutoInput;
      if (
        targetEmail !== originalEmail &&
        originalEmail !== SUPER_ADMIN_EMAIL
      ) {
        await addAllowedUser({
          email: targetEmail,
          displayName: editNameInput,
          role: editRoleInput,
          status: editStatusInput,
          allowAiAuto: nextAiAuto,
          aiApiKeys: existingUser?.aiApiKeys,
          notes: editNotesInput,
        });
        await deleteAllowedUser(originalEmail);
      } else {
        await updateAllowedUser(originalEmail, {
          displayName: editNameInput,
          role: editRoleInput,
          status: editStatusInput,
          allowAiAuto: nextAiAuto,
          notes: editNotesInput,
        });
      }
      setEditingEmail(null);
      showToast('success', `Updated user ${targetEmail}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update user.';
      showToast('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAiAuto = async (u: AllowedUserRecord) => {
    if (u.role === 'admin') return;
    const nextValue = !u.allowAiAuto;
    try {
      await toggleUserAiAuto(u, nextValue);
      showToast(
        'success',
        nextValue
          ? `Enabled AI Auto Standings (Beta) for ${u.email}.`
          : `Disabled AI Auto Standings (Beta) for ${u.email}.`
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to update AI access.';
      showToast('error', msg);
    }
  };

  const handleOpenUserAiManagement = (email: string) => {
    setSectionTab('AI_API');
    setAiFilterMode('ALL');
    setAiSearchQuery(email);
  };

  const handleVerifyAndAddKeys = async (u: AllowedUserRecord) => {
    const draft = draftKeysByEmail[u.email] || '';
    const parsedNew = parseMultiApiKeyInput(draft);
    if (parsedNew.length === 0) {
      setRowStatusByEmail((prev) => ({
        ...prev,
        [u.email]: {
          type: 'error',
          text: 'Paste 1 or more valid API keys (separated by newline or comma).',
        },
      }));
      return;
    }

    const existingKeys = sanitizeAiApiKeyList(u.aiApiKeys);
    const existingSet = new Set(existingKeys);
    const uniqueToAdd = parsedNew.filter((k) => !existingSet.has(k));

    if (uniqueToAdd.length === 0) {
      setDraftKeysByEmail((prev) => ({ ...prev, [u.email]: '' }));
      setRowStatusByEmail((prev) => ({
        ...prev,
        [u.email]: {
          type: 'success',
          text: 'Key(s) already assigned to this user.',
        },
      }));
      return;
    }

    if (existingKeys.length + uniqueToAdd.length > 25) {
      setRowStatusByEmail((prev) => ({
        ...prev,
        [u.email]: {
          type: 'error',
          text: 'Maximum 25 personal API keys per user reached.',
        },
      }));
      return;
    }

    setBusyAiEmail(u.email);
    setRowStatusByEmail((prev) => {
      const copy = { ...prev };
      delete copy[u.email];
      return copy;
    });

    try {
      let primaryDetectedModel = '';
      for (let i = 0; i < uniqueToAdd.length; i += 1) {
        const keyCandidate = uniqueToAdd[i];
        const check = await verifyAdminAiApiKey(keyCandidate);
        if (!check.valid) {
          setRowStatusByEmail((prev) => ({
            ...prev,
            [u.email]: {
              type: 'error',
              text: `Key ${maskApiKey(keyCandidate)} failed check: ${
                check.error || 'Invalid key.'
              }`,
            },
          }));
          return;
        }
        if (!primaryDetectedModel && check.primaryModel) {
          primaryDetectedModel = check.primaryModel;
        }
      }

      const mergedKeys = sanitizeAiApiKeyList([...existingKeys, ...uniqueToAdd]);
      await setUserAiConfig(u.email, {
        allowAiAuto: true,
        aiApiKeys: mergedKeys,
      });

      setDraftKeysByEmail((prev) => ({ ...prev, [u.email]: '' }));
      const modelNote = primaryDetectedModel ? ` (${primaryDetectedModel})` : '';
      const successMsg = `Added ${uniqueToAdd.length} verified key(s) for ${u.email}${modelNote}. Pool size: ${mergedKeys.length}.`;
      setRowStatusByEmail((prev) => ({
        ...prev,
        [u.email]: { type: 'success', text: successMsg },
      }));
      showToast('success', successMsg);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to save API key pool.';
      setRowStatusByEmail((prev) => ({
        ...prev,
        [u.email]: { type: 'error', text: msg },
      }));
      showToast('error', msg);
    } finally {
      setBusyAiEmail(null);
    }
  };

  const handleRemoveSingleKey = async (u: AllowedUserRecord, keyToRemove: string) => {
    const nextKeys = (u.aiApiKeys || []).filter((k) => k !== keyToRemove);
    setBusyAiEmail(u.email);
    try {
      await setUserAiConfig(u.email, { aiApiKeys: nextKeys });
      setRowStatusByEmail((prev) => ({
        ...prev,
        [u.email]: {
          type: 'success',
          text: `Removed ${maskApiKey(keyToRemove)}. Remaining keys: ${nextKeys.length}.`,
        },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove key.';
      showToast('error', msg);
    } finally {
      setBusyAiEmail(null);
    }
  };

  const handleToggleRevealKey = (id: string) => {
    setRevealedKeyIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleStatus = async (u: AllowedUserRecord) => {
    if (u.email === SUPER_ADMIN_EMAIL) return;
    const nextStatus: UserStatus = u.status === 'active' ? 'disabled' : 'active';
    try {
      await updateAllowedUser(u.email, {
        displayName: u.displayName,
        role: u.role,
        status: nextStatus,
        notes: u.notes,
      });
      showToast('success', `${u.email} is now ${nextStatus.toUpperCase()}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Status update failed.';
      showToast('error', msg);
    }
  };

  const handleDelete = async (email: string) => {
    if (email === SUPER_ADMIN_EMAIL) return;
    try {
      await deleteAllowedUser(email);
      showToast('success', `Removed ${email} from allowed users.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed.';
      showToast('error', msg);
    }
  };

  const handleToggleTempLogin = async () => {
    if (togglingTemp) return;
    setTogglingTemp(true);
    try {
      const nextValue = !allowTempLogin;
      await setAllowTempLogin(nextValue);
      showToast(
        'success',
        nextValue
          ? 'Allow Temp Login turned ON across Web & Android.'
          : 'Allow Temp Login turned OFF. Existing & new temp logins blocked.'
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to toggle Temp Login.';
      showToast('error', msg);
    } finally {
      setTogglingTemp(false);
    }
  };

  const handlePromoteTemp = async (u: AllowedUserRecord) => {
    try {
      await promoteTempToUser(u);
      showToast('success', `Upgraded ${u.email} from TEMP to USER.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Promotion failed.';
      showToast('error', msg);
    }
  };

  const totalAllowed = allUsers.length;
  const activeAdmins = allUsers.filter(
    (u) => u.role === 'admin' && u.status === 'active'
  ).length;
  const tempUsersCount = allUsers.filter((u) => u.role === 'temp').length;

  const aiEnabledCount = allUsers.filter(
    (u) => u.role === 'admin' || Boolean(u.allowAiAuto)
  ).length;
  const totalAssignedKeys = allUsers.reduce(
    (sum, u) => sum + (u.aiApiKeys?.length || 0),
    0
  );
  const missingKeyAccounts = allUsers.filter(
    (u) =>
      (u.role === 'admin' || Boolean(u.allowAiAuto)) &&
      (u.aiApiKeys?.length || 0) === 0
  ).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Admin Access Control"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm font-ui"
    >
      <div className="glass-modal relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl text-slate-100">
        {/* Top Modal Header */}
        <div className="flex flex-col gap-3 border-b border-white/[0.08] bg-white/[0.03] px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/35 bg-amber-500/12">
                <Shield className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white leading-tight">
                  Admin Control Center
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Manage workspace access, roles, and per-user AI / API key pools
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close Admin Control Center"
              onClick={() => setAdminDashboardOpen(false)}
              className="glass-pill flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Section Switcher Tabs */}
          <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-black/30 p-1">
            <button
              type="button"
              onClick={() => setSectionTab('USERS')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                sectionTab === 'USERS'
                  ? 'bg-amber-500 text-zinc-950'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Users &amp; Access ({totalAllowed})</span>
            </button>
            <button
              type="button"
              onClick={() => setSectionTab('AI_API')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                sectionTab === 'AI_API'
                  ? 'bg-amber-500 text-zinc-950'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>AI / API Management ({totalAssignedKeys} Keys)</span>
            </button>
          </div>
        </div>

        {/* Pinned Feedback Banner */}
        {feedback && (
          <div
            role="status"
            className={`mx-4 sm:mx-6 mt-4 flex items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold ${
              feedback.type === 'success'
                ? 'border-emerald-500/40 bg-emerald-950/60 text-emerald-200'
                : 'border-red-500/45 bg-red-950/70 text-red-200'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="break-words">{feedback.text}</span>
            </div>
            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() => setFeedback(null)}
              className="rounded p-0.5 text-current/70 hover:text-current cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {sectionTab === 'USERS' ? (
            <>
              {/* Allow Temp Login Master Switch */}
              <div
                className={`rounded-xl border px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  allowTempLogin
                    ? 'border-sky-400/40 bg-sky-500/10'
                    : 'glass-tile'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      Allow Temp Login
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        allowTempLogin
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-400/35'
                          : 'bg-white/[0.06] text-slate-400 border border-white/[0.1]'
                      }`}
                    >
                      {allowTempLogin ? 'ON · GLOBAL SYNC' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {allowTempLogin
                      ? 'Anyone signing in with Google gets Temp access. Turn off anytime to block all Temp users.'
                      : 'Only authorized Admins and Users can sign in. All Temp accounts are blocked.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleTempLogin}
                  disabled={togglingTemp}
                  className={`shrink-0 rounded-xl px-4 py-2 text-xs font-extrabold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer ${
                    allowTempLogin
                      ? 'bg-sky-400 text-zinc-950 hover:bg-sky-300'
                      : 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                  }`}
                >
                  {togglingTemp
                    ? 'Updating...'
                    : allowTempLogin
                      ? 'Turn Off Temp Login'
                      : 'Turn On Temp Login'}
                </button>
              </div>

              {/* Summary Counters */}
              <div className="grid grid-cols-3 gap-3">
                <div className="glass-tile rounded-xl px-4 py-3">
                  <span className="text-[11px] font-medium text-slate-400">
                    Total Accounts
                  </span>
                  <div className="mt-1 text-2xl font-bold text-white tabular-nums">
                    {totalAllowed}
                  </div>
                </div>
                <div className="glass-tile rounded-xl px-4 py-3">
                  <span className="text-[11px] font-medium text-amber-400">
                    Active Admins
                  </span>
                  <div className="mt-1 text-2xl font-bold text-amber-300 tabular-nums">
                    {activeAdmins}
                  </div>
                </div>
                <div className="glass-tile rounded-xl px-4 py-3">
                  <span className="text-[11px] font-medium text-sky-400">
                    Temp Users
                  </span>
                  <div className="mt-1 text-2xl font-bold text-sky-300 tabular-nums">
                    {tempUsersCount}
                  </div>
                </div>
              </div>

              {/* Add / Authorize New Email Form */}
              <form
                onSubmit={handleAddUser}
                className="glass-tile rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <UserPlus className="h-4 w-4" />
                  <span>ALLOW NEW GOOGLE EMAIL</span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-4">
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Google Email Address *
                    </label>
                    <input
                      type="email"
                      inputMode="email"
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="user@gmail.com"
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Display Name / Label
                    </label>
                    <input
                      type="text"
                      maxLength={120}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Moderator name"
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Access Role
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as UserRole)}
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                    >
                      <option value="user" className="bg-[#121622] text-white">User</option>
                      <option value="admin" className="bg-[#121622] text-white">Admin</option>
                      <option value="temp" className="bg-[#121622] text-white">Temp User</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3 flex items-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-amber-400 transition-colors disabled:opacity-50 cursor-pointer h-[38px]"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>{isSubmitting ? 'SAVING...' : 'ALLOW EMAIL'}</span>
                    </button>
                  </div>
                </div>

                {newRole !== 'admin' && (
                  <label className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 cursor-pointer">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ScanLine className="h-4 w-4 shrink-0 text-amber-400" />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-white">
                          Allow AI Auto Standings (Beta)
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Unlocks AI screenshot auto-standings (Beta) for this user
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={newAllowAiAuto}
                      onChange={(e) => setNewAllowAiAuto(e.target.checked)}
                      className="h-4 w-4 rounded accent-amber-500 cursor-pointer"
                    />
                  </label>
                )}

                {(newRole === 'admin' || newAllowAiAuto) && (
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Personal API Key Pool (Optional — paste 1 or multiple keys separated by comma or newline)
                    </label>
                    <input
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      value={newAiKeysRaw}
                      onChange={(e) => setNewAiKeysRaw(e.target.value)}
                      placeholder="Paste personal API key(s) now, or configure anytime in AI / API Management"
                      className="glass-input w-full rounded-lg px-3 py-2 font-mono text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                )}
              </form>

              {/* Search & Filter Bar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-56 lg:w-64 shrink-0">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search email or name..."
                    className="glass-input w-full rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-white/25 focus:outline-none"
                  />
                </div>

                <div className="glass-input flex flex-wrap items-center gap-1 rounded-lg p-1 text-xs">
                  {(['ALL', 'ADMIN', 'USER', 'DISABLED', 'TEMP'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setRoleFilter(tab)}
                      className={`rounded-md px-2.5 py-1 font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                        roleFilter === tab
                          ? tab === 'TEMP'
                            ? 'bg-sky-500/25 text-sky-200 border border-sky-400/40'
                            : 'bg-white/[0.14] text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Allowed Users Table */}
              <div className="glass-tile overflow-hidden rounded-xl">
                <div className="divide-y divide-white/[0.07]">
                  {filteredUsers.length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-500">
                      No matching users found.
                    </div>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSuper = u.email === SUPER_ADMIN_EMAIL;
                      const isEditing = editingEmail === u.email;
                      const keyCount = u.aiApiKeys?.length || 0;

                      if (isEditing) {
                        return (
                          <div
                            key={u.email}
                            className="bg-white/[0.04] p-4 space-y-3"
                          >
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                              <div className="sm:col-span-4">
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Email Address
                                </label>
                                <input
                                  type="email"
                                  disabled={isSuper}
                                  value={editEmailInput}
                                  onChange={(e) => setEditEmailInput(e.target.value)}
                                  className="glass-input w-full rounded-lg px-2.5 py-1.5 text-xs text-white disabled:opacity-50"
                                />
                              </div>

                              <div className="sm:col-span-3">
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Display Name
                                </label>
                                <input
                                  type="text"
                                  maxLength={120}
                                  value={editNameInput}
                                  onChange={(e) => setEditNameInput(e.target.value)}
                                  className="glass-input w-full rounded-lg px-2.5 py-1.5 text-xs text-white"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Role
                                </label>
                                <select
                                  disabled={isSuper}
                                  value={editRoleInput}
                                  onChange={(e) =>
                                    setEditRoleInput(e.target.value as UserRole)
                                  }
                                  className="glass-input w-full rounded-lg px-2.5 py-1.5 text-xs text-white disabled:opacity-50"
                                >
                                  <option value="user" className="bg-[#121622] text-white">User</option>
                                  <option value="admin" className="bg-[#121622] text-white">Admin</option>
                                  <option value="temp" className="bg-[#121622] text-white">Temp User</option>
                                </select>
                              </div>

                              <div className="sm:col-span-3">
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Account Status
                                </label>
                                <select
                                  disabled={isSuper}
                                  value={editStatusInput}
                                  onChange={(e) =>
                                    setEditStatusInput(e.target.value as UserStatus)
                                  }
                                  className="glass-input w-full rounded-lg px-2.5 py-1.5 text-xs text-white disabled:opacity-50"
                                >
                                  <option value="active" className="bg-[#121622] text-white">Active (Allowed)</option>
                                  <option value="disabled" className="bg-[#121622] text-white">Disabled (Blocked)</option>
                                </select>
                              </div>
                            </div>

                            {editRoleInput !== 'admin' && (
                              <label className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <ScanLine className="h-4 w-4 text-amber-400" />
                                  <span className="text-xs font-semibold text-white">
                                    Allow AI Auto Standings (Beta)
                                  </span>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={editAllowAiAutoInput}
                                  onChange={(e) =>
                                    setEditAllowAiAutoInput(e.target.checked)
                                  }
                                  className="h-4 w-4 rounded accent-amber-500 cursor-pointer"
                                />
                              </label>
                            )}

                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingEmail(null)}
                                className="glass-pill rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(u.email)}
                                disabled={isSubmitting}
                                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-emerald-500 cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Save Changes</span>
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={u.email}
                          className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between hover:bg-white/[0.03] transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-bold uppercase ${
                                u.status === 'disabled'
                                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                                  : u.role === 'admin'
                                    ? 'border-amber-500/40 bg-amber-500/12 text-amber-300'
                                    : u.role === 'temp'
                                      ? 'border-sky-400/35 bg-sky-500/12 text-sky-300'
                                      : 'border-white/[0.12] bg-white/[0.06] text-slate-300'
                              }`}
                            >
                              {u.displayName.slice(0, 2).toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="truncate font-semibold text-sm text-white">
                                  {u.displayName}
                                </span>

                                <span
                                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    isSuper
                                      ? 'bg-amber-500 text-zinc-950'
                                      : u.role === 'admin'
                                        ? 'border border-amber-500/40 bg-amber-500/10 text-amber-300'
                                        : u.role === 'temp'
                                          ? 'border border-sky-400/35 bg-sky-500/12 text-sky-300'
                                          : 'border border-white/[0.12] bg-white/[0.06] text-slate-300'
                                  }`}
                                >
                                  {isSuper ? 'SUPER ADMIN' : u.role.toUpperCase()}
                                </span>

                                <span
                                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    u.status === 'active'
                                      ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                      : 'border border-red-500/30 bg-red-500/10 text-red-300'
                                  }`}
                                >
                                  {u.status === 'active' ? 'ACTIVE' : 'DISABLED'}
                                </span>

                                {(u.role === 'admin' || u.allowAiAuto) && (
                                  <span className="inline-flex items-center gap-1 rounded border border-amber-500/35 bg-amber-500/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                                    <ScanLine className="h-3 w-3" />
                                    <span>AI BETA · {keyCount} KEY{keyCount === 1 ? '' : 'S'}</span>
                                  </span>
                                )}
                              </div>

                              <div className="mt-0.5 truncate font-mono text-xs text-slate-400">
                                {u.email}
                              </div>
                            </div>
                          </div>

                          {/* Row Actions */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {u.role !== 'admin' && (
                              <button
                                type="button"
                                onClick={() => handleToggleAiAuto(u)}
                                className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                                  u.allowAiAuto
                                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                                    : 'border-white/[0.12] bg-white/[0.04] text-slate-300 hover:bg-white/[0.09] hover:text-white'
                                }`}
                              >
                                <ScanLine className="h-3.5 w-3.5" />
                                <span>
                                  {u.allowAiAuto ? 'AI: ON' : 'Allow AI'}
                                </span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenUserAiManagement(u.email)}
                              className="flex items-center gap-1 rounded-lg border border-white/[0.12] bg-white/[0.05] px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.1] hover:text-white transition-colors cursor-pointer"
                              title="Manage personal API key pool for this user"
                            >
                              <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                              <span>Keys ({keyCount})</span>
                            </button>

                            {u.role === 'temp' && (
                              <button
                                type="button"
                                onClick={() => handlePromoteTemp(u)}
                                className="flex items-center gap-1 rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                                title="Convert temporary user into permanent User"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                <span>Make User</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => startEditing(u)}
                              className="glass-pill flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                              title="Edit user name, role, or email"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>

                            {!isSuper && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(u)}
                                  className={`flex items-center gap-1 rounded border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                                    u.status === 'active'
                                      ? 'border-amber-500/30 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40'
                                      : 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40'
                                  }`}
                                  title={
                                    u.status === 'active'
                                      ? 'Suspend user access'
                                      : 'Restore user access'
                                  }
                                >
                                  {u.status === 'active' ? (
                                    <>
                                      <UserX className="h-3.5 w-3.5" />
                                      <span>Block</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="h-3.5 w-3.5" />
                                      <span>Enable</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDelete(u.email)}
                                  className="flex items-center gap-1 rounded border border-red-500/30 bg-red-950/30 px-2.5 py-1.5 text-xs font-medium text-red-300 hover:bg-red-900/45 transition-colors cursor-pointer"
                                  title="Revoke and delete email"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          ) : (
            /* AI / API MANAGEMENT SECTION */
            <>
              <div className="glass-tile rounded-xl px-4 py-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <KeyRound className="h-4 w-4" />
                  <span>Per-User AI Quota &amp; Multi-Key Failover Pool</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Assign 1 or multiple personal API keys per account (up to 25 keys per user, each created in a separate project for independent daily quota). Users never see API keys or model names in the app — only <span className="font-semibold text-white">AI (Beta)</span>. When Key #1 reaches its daily limit, Key #2 is used automatically for the rest of that day.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="glass-tile rounded-xl px-4 py-3">
                  <span className="text-[11px] font-medium text-slate-400">
                    AI-Enabled Accounts
                  </span>
                  <div className="mt-1 text-2xl font-bold text-white tabular-nums">
                    {aiEnabledCount}
                  </div>
                </div>
                <div className="glass-tile rounded-xl px-4 py-3">
                  <span className="text-[11px] font-medium text-emerald-400">
                    Assigned API Keys
                  </span>
                  <div className="mt-1 text-2xl font-bold text-emerald-300 tabular-nums">
                    {totalAssignedKeys}
                  </div>
                </div>
                <div className="glass-tile rounded-xl px-4 py-3">
                  <span className="text-[11px] font-medium text-amber-400">
                    AI On · 0 Keys Set
                  </span>
                  <div className="mt-1 text-2xl font-bold text-amber-300 tabular-nums">
                    {missingKeyAccounts}
                  </div>
                </div>
              </div>

              {/* AI Filter & Search */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-64 shrink-0">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={aiSearchQuery}
                    onChange={(e) => setAiSearchQuery(e.target.value)}
                    placeholder="Filter account email or name..."
                    className="glass-input w-full rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:border-white/25 focus:outline-none"
                  />
                  {aiSearchQuery && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => setAiSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="glass-input flex flex-wrap items-center gap-1 rounded-lg p-1 text-xs">
                  {(
                    [
                      { id: 'ALL', label: 'All Accounts' },
                      { id: 'ENABLED', label: 'AI Enabled' },
                      { id: 'MISSING_KEYS', label: 'Needs Keys' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAiFilterMode(item.id)}
                      className={`rounded-md px-2.5 py-1 font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                        aiFilterMode === item.id
                          ? 'bg-white/[0.14] text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Per-User API Pool Management List */}
              <div className="space-y-3">
                {filteredAiUsers.length === 0 ? (
                  <div className="glass-tile rounded-xl py-10 text-center text-xs text-slate-500">
                    No matching accounts found.
                  </div>
                ) : (
                  filteredAiUsers.map((u) => {
                    const isSuper = u.email === SUPER_ADMIN_EMAIL;
                    const aiEnabled = u.role === 'admin' || Boolean(u.allowAiAuto);
                    const keys = u.aiApiKeys || [];
                    const draft = draftKeysByEmail[u.email] || '';
                    const isBusy = busyAiEmail === u.email;
                    const rowStatus = rowStatusByEmail[u.email];

                    return (
                      <div
                        key={u.email}
                        className="glass-tile rounded-xl p-4 space-y-3"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-sm text-white truncate">
                                {u.displayName}
                              </span>
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  isSuper
                                    ? 'bg-amber-500 text-zinc-950'
                                    : u.role === 'admin'
                                      ? 'border border-amber-500/40 bg-amber-500/10 text-amber-300'
                                      : 'border border-white/[0.12] bg-white/[0.06] text-slate-300'
                                }`}
                              >
                                {isSuper ? 'SUPER ADMIN' : u.role.toUpperCase()}
                              </span>
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  keys.length > 0
                                    ? 'border border-emerald-500/35 bg-emerald-500/12 text-emerald-300'
                                    : aiEnabled
                                      ? 'border border-amber-500/35 bg-amber-500/12 text-amber-300'
                                      : 'border border-white/[0.1] bg-white/[0.04] text-slate-400'
                                }`}
                              >
                                {keys.length} KEY{keys.length === 1 ? '' : 'S'} IN POOL
                              </span>
                            </div>
                            <div className="mt-0.5 font-mono text-xs text-slate-400 truncate">
                              {u.email}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {u.role === 'admin' ? (
                              <span className="rounded-lg border border-amber-500/35 bg-amber-500/12 px-3 py-1.5 text-xs font-bold text-amber-300">
                                AI Beta: Always ON (Admin)
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleAiAuto(u)}
                                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                                  u.allowAiAuto
                                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                                    : 'border-white/[0.14] bg-white/[0.05] text-slate-300 hover:bg-white/[0.1] hover:text-white'
                                }`}
                              >
                                <ScanLine className="h-3.5 w-3.5" />
                                <span>
                                  {u.allowAiAuto
                                    ? 'AI Beta: Enabled'
                                    : 'Enable AI Beta'}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Assigned Keys Pool */}
                        {keys.length > 0 ? (
                          <div className="space-y-1.5">
                            {keys.map((k, idx) => {
                              const revealId = `${u.email}::${idx}`;
                              const isRevealed = Boolean(revealedKeyIds[revealId]);
                              return (
                                <div
                                  key={`${idx}-${k.slice(-6)}`}
                                  className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="shrink-0 rounded bg-white/[0.08] px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                                      {idx === 0 ? 'KEY #1 · PRIMARY' : `KEY #${idx + 1} · FAILOVER`}
                                    </span>
                                    <span className="truncate font-mono text-xs text-slate-200">
                                      {isRevealed ? k : maskApiKey(k)}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleRevealKey(revealId)}
                                      className="rounded p-1 text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
                                      title={isRevealed ? 'Hide key' : 'Reveal key'}
                                    >
                                      {isRevealed ? (
                                        <EyeOff className="h-3.5 w-3.5" />
                                      ) : (
                                        <Eye className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => handleRemoveSingleKey(u, k)}
                                      className="rounded p-1 text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition-colors disabled:opacity-40 cursor-pointer"
                                      title="Remove key from user pool"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-white/[0.1] bg-black/20 px-3 py-2 text-xs text-slate-400">
                            No personal API keys assigned yet. Add 1 or more keys below to activate daily AI scan quota for this account.
                          </div>
                        )}

                        {/* Add 1 or Multiple Keys Input */}
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                          <textarea
                            rows={1}
                            value={draft}
                            onChange={(e) =>
                              setDraftKeysByEmail((prev) => ({
                                ...prev,
                                [u.email]: e.target.value,
                              }))
                            }
                            placeholder="Paste 1 or multiple API keys (newline or comma separated)..."
                            spellCheck={false}
                            className="glass-input flex-1 resize-y rounded-lg px-3 py-2 font-mono text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none min-h-[38px]"
                          />
                          <button
                            type="button"
                            disabled={isBusy || !draft.trim()}
                            onClick={() => handleVerifyAndAddKeys(u)}
                            className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider text-zinc-950 hover:bg-amber-400 transition-colors disabled:opacity-45 cursor-pointer"
                          >
                            {isBusy ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Verifying...</span>
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5" />
                                <span>Verify &amp; Add Key(s)</span>
                              </>
                            )}
                          </button>
                        </div>

                        {rowStatus && (
                          <div
                            className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                              rowStatus.type === 'success'
                                ? 'border-emerald-500/35 bg-emerald-950/40 text-emerald-200'
                                : 'border-rose-500/40 bg-rose-950/40 text-rose-200'
                            }`}
                          >
                            {rowStatus.text}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
