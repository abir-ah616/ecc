import React from 'react';
import {
  ShieldAlert,
  LogIn,
  LogOut,
  Trophy,
  Lock,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const LoginView: React.FC = () => {
  const {
    firebaseUser,
    isLoading,
    isAllowed,
    authError,
    signInWithGoogle,
    logout,
    clearAuthError,
  } = useAuthStore();

  // State 1: Signed into Google, but not allowlisted / disabled
  if (firebaseUser && !isAllowed && !isLoading) {
    return (
      <div className="glass-canvas relative min-h-screen w-full text-slate-100 flex items-center justify-center p-4 font-ui">
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          className="pointer-events-none fixed inset-0 z-0 h-full w-full"
        >
          <circle cx="960" cy="180" r="240" fill="#F59E0B" fillOpacity="0.05" />
          <circle cx="520" cy="700" r="260" fill="#38BDF8" fillOpacity="0.045" />
        </svg>

        <div className="glass-modal relative z-10 w-full max-w-md rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-500/35 bg-rose-500/12 text-rose-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Access Restricted</h1>
              <p className="text-xs text-slate-400">
                Account not enabled on workspace allowlist
              </p>
            </div>
          </div>

          <div className="glass-tile rounded-xl p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
              <span className="text-slate-400">Signed in as</span>
              <span className="font-mono font-medium text-white truncate max-w-[220px]">
                {firebaseUser.email}
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              {authError ||
                'This Google account does not have organizer permission yet. Ask an administrator to authorize your email address.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={logout}
              className="glass-pill flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
            <button
              type="button"
              onClick={() => {
                clearAuthError();
                signInWithGoogle();
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-semibold text-zinc-950 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              <span>Switch Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Default Sign In Screen
  return (
    <div className="glass-canvas relative min-h-screen w-full text-slate-100 flex flex-col justify-center items-center p-4 font-ui">
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      >
        <circle cx="960" cy="180" r="240" fill="#F59E0B" fillOpacity="0.05" />
        <circle cx="520" cy="700" r="260" fill="#38BDF8" fillOpacity="0.045" />
      </svg>

      <div className="glass-modal relative z-10 w-full max-w-md rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="space-y-3 text-center">
          <div className="glass-tile mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-amber-400">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              ESP CALC
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Free Fire Tournament Point Table & Standings Studio
            </p>
          </div>
        </div>

        <div className="glass-tile rounded-xl p-4 flex items-center gap-3 text-xs text-slate-300">
          <Lock className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            Authorized organizer access only. Sign in with an approved Google account to continue.
          </span>
        </div>

        {authError && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            {authError}
          </div>
        )}

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-3 text-sm font-semibold text-zinc-950 disabled:opacity-50 transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-slate-500">
          Secured workspace by MR. OPPY
        </p>
      </div>
    </div>
  );
};
