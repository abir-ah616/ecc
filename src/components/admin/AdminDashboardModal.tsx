import React, { useState, useMemo } from 'react';
import {
  X,
  UserPlus,
  Trash2,
  Edit3,
  Check,
  Shield,
  UserCheck,
  UserX,
  Search,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore, normalizeEmail } from '../../store/authStore';
import { SUPER_ADMIN_EMAIL } from '../../lib/firebase';
import type { AllowedUserRecord, UserRole, UserStatus } from '../../types/auth';

export const AdminDashboardModal: React.FC = () => {
  const {
    isAdmin,
    isAdminDashboardOpen,
    setAdminDashboardOpen,
    allUsers,
    addAllowedUser,
    updateAllowedUser,
    deleteAllowedUser,
  } = useAuthStore();

  // Add User Form State
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit User State
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editEmailInput, setEditEmailInput] = useState('');
  const [editNameInput, setEditNameInput] = useState('');
  const [editRoleInput, setEditRoleInput] = useState<UserRole>('user');
  const [editStatusInput, setEditStatusInput] = useState<UserStatus>('active');
  const [editNotesInput, setEditNotesInput] = useState('');

  // Filter & Feedback State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'USER' | 'DISABLED'>('ALL');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
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
      return true;
    });
  }, [allUsers, searchQuery, roleFilter]);

  if (!isAdmin || !isAdminDashboardOpen) return null;

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeEmail(newEmail);
    if (!clean || !clean.includes('@')) {
      showToast('error', 'Please enter a valid Google email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addAllowedUser({
        email: clean,
        displayName: newName.trim() || clean.split('@')[0].toUpperCase(),
        role: newRole,
        status: 'active',
        notes: newNotes.trim(),
      });
      setNewEmail('');
      setNewName('');
      setNewRole('user');
      setNewNotes('');
      showToast('success', `Authorized ${clean} (${newRole.toUpperCase()}).`);
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
    setEditNotesInput(u.notes || '');
  };

  const handleSaveEdit = async (originalEmail: string) => {
    const targetEmail = normalizeEmail(editEmailInput);
    if (!targetEmail || !targetEmail.includes('@')) {
      showToast('error', 'Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (
        targetEmail !== originalEmail &&
        originalEmail !== SUPER_ADMIN_EMAIL
      ) {
        // Email changed: create new document and remove old document
        await addAllowedUser({
          email: targetEmail,
          displayName: editNameInput,
          role: editRoleInput,
          status: editStatusInput,
          notes: editNotesInput,
        });
        await deleteAllowedUser(originalEmail);
      } else {
        await updateAllowedUser(originalEmail, {
          displayName: editNameInput,
          role: editRoleInput,
          status: editStatusInput,
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
      showToast(
        'success',
        `${u.email} is now ${nextStatus.toUpperCase()}.`
      );
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

  const totalAllowed = allUsers.length;
  const activeAdmins = allUsers.filter(
    (u) => u.role === 'admin' && u.status === 'active'
  ).length;
  const activeUsers = allUsers.filter((u) => u.status === 'active').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-neutral-800 bg-[#0E0E11] text-neutral-100 shadow-2xl">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 bg-[#141418] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded border border-amber-500/40 bg-amber-500/10">
              <Shield className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-white leading-none">
                ADMIN ACCESS CONTROL DASHBOARD
              </h2>
              <p className="mt-0.5 text-xs text-neutral-400">
                Manage authorized Google emails, roles, and workspace permissions
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAdminDashboardOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded border border-neutral-700 bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Counters */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded border border-neutral-800 bg-neutral-900/70 px-4 py-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                TOTAL ALLOWED EMAILS
              </span>
              <div className="mt-1 font-display text-3xl font-bold text-white">
                {totalAllowed}
              </div>
            </div>
            <div className="rounded border border-neutral-800 bg-neutral-900/70 px-4 py-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                ACTIVE ADMINS
              </span>
              <div className="mt-1 font-display text-3xl font-bold text-amber-300">
                {activeAdmins}
              </div>
            </div>
            <div className="rounded border border-neutral-800 bg-neutral-900/70 px-4 py-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                ACTIVE ACCOUNTS
              </span>
              <div className="mt-1 font-display text-3xl font-bold text-emerald-300">
                {activeUsers}
              </div>
            </div>
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`flex items-center gap-2 rounded border px-4 py-2.5 text-xs font-semibold ${
                feedback.type === 'success'
                  ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
                  : 'border-red-500/40 bg-red-950/40 text-red-200'
              }`}
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Add / Authorize New Email Form */}
          <form
            onSubmit={handleAddUser}
            className="rounded-md border border-neutral-800 bg-[#141418] p-4 space-y-3"
          >
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <UserPlus className="h-4 w-4" />
              <span>ALLOW NEW GOOGLE EMAIL</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Google Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@gmail.com"
                  className="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Display Name / Label
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Tournament Moderator"
                  className="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Access Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="sm:col-span-3 flex items-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-1.5 rounded bg-amber-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-950 hover:bg-amber-400 transition-colors disabled:opacity-50 cursor-pointer h-[38px]"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>{isSubmitting ? 'SAVING...' : 'ALLOW EMAIL'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Search & Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by email, name, or note..."
                className="w-full rounded border border-neutral-800 bg-neutral-950 pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-neutral-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 rounded border border-neutral-800 bg-neutral-950 p-1 text-xs">
              {(['ALL', 'ADMIN', 'USER', 'DISABLED'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setRoleFilter(tab)}
                  className={`rounded px-2.5 py-1 font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                    roleFilter === tab
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Allowed Users Table */}
          <div className="overflow-hidden rounded-md border border-neutral-800 bg-[#121216]">
            <div className="divide-y divide-neutral-800/80">
              {filteredUsers.length === 0 ? (
                <div className="py-10 text-center text-xs text-neutral-500">
                  No matching users found.
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isSuper = u.email === SUPER_ADMIN_EMAIL;
                  const isEditing = editingEmail === u.email;

                  if (isEditing) {
                    return (
                      <div
                        key={u.email}
                        className="bg-neutral-900/90 p-4 space-y-3"
                      >
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                          <div className="sm:col-span-4">
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              Email Address
                            </label>
                            <input
                              type="email"
                              disabled={isSuper}
                              value={editEmailInput}
                              onChange={(e) => setEditEmailInput(e.target.value)}
                              className="w-full rounded border border-neutral-700 bg-neutral-950 px-2.5 py-1.5 text-xs text-white disabled:opacity-50"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              Display Name
                            </label>
                            <input
                              type="text"
                              value={editNameInput}
                              onChange={(e) => setEditNameInput(e.target.value)}
                              className="w-full rounded border border-neutral-700 bg-neutral-950 px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              Role
                            </label>
                            <select
                              disabled={isSuper}
                              value={editRoleInput}
                              onChange={(e) =>
                                setEditRoleInput(e.target.value as UserRole)
                              }
                              className="w-full rounded border border-neutral-700 bg-neutral-950 px-2.5 py-1.5 text-xs text-white disabled:opacity-50"
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>

                          <div className="sm:col-span-3">
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              Account Status
                            </label>
                            <select
                              disabled={isSuper}
                              value={editStatusInput}
                              onChange={(e) =>
                                setEditStatusInput(e.target.value as UserStatus)
                              }
                              className="w-full rounded border border-neutral-700 bg-neutral-950 px-2.5 py-1.5 text-xs text-white disabled:opacity-50"
                            >
                              <option value="active">Active (Allowed)</option>
                              <option value="disabled">Disabled (Blocked)</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingEmail(null)}
                            className="rounded border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(u.email)}
                            disabled={isSubmitting}
                            className="flex items-center gap-1 rounded bg-emerald-600 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-emerald-500 cursor-pointer"
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
                      className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between hover:bg-neutral-900/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded border font-display text-sm font-bold uppercase ${
                            u.status === 'disabled'
                              ? 'border-red-500/30 bg-red-950/30 text-red-400'
                              : u.role === 'admin'
                                ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                                : 'border-neutral-700 bg-neutral-900 text-neutral-300'
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
                                  ? 'bg-amber-500 text-neutral-950'
                                  : u.role === 'admin'
                                    ? 'border border-amber-500/40 bg-amber-500/10 text-amber-300'
                                    : 'border border-neutral-700 bg-neutral-900 text-neutral-300'
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
                          </div>

                          <div className="mt-0.5 truncate font-mono text-xs text-neutral-400">
                            {u.email}
                          </div>
                        </div>
                      </div>

                      {/* Row Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditing(u)}
                          className="flex items-center gap-1 rounded border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
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
                                  <span>Disable</span>
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
                              className="flex items-center gap-1 rounded border border-red-500/30 bg-red-950/30 px-2.5 py-1.5 text-xs font-medium text-red-300 hover:bg-red-900/50 transition-colors cursor-pointer"
                              title="Remove email from allowlist"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
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
        </div>
      </div>
    </div>
  );
};
