import React from 'react';
import { ShieldAlert, LogOut, Lock, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const LoginView: React.FC = () => {
  const {
    firebaseUser,
    allowedRecord,
    isLoading,
    authError,
    signInWithGoogle,
    logout,
    clearAuthError,
  } = useAuthStore();

  const isUnauthorizedUser = !!firebaseUser;
  const isDisabledAccount = allowedRecord?.status === 'disabled';

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-[#09090B] text-neutral-100 select-none">
      {/* Subtle Broadcast Grid & Top Accent Glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 0%, rgba(220, 38, 38, 0.28) 0%, transparent 55%)',
        }}
      />

      {/* Top Minimal Brand Bar */}
      <header className="relative z-10 border-b border-neutral-800/80 bg-[#09090B]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-neutral-700 bg-neutral-900">
              <Lock className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl font-bold tracking-wider uppercase text-white">
                ESP CALC
              </span>
              <span className="text-[11px] font-medium tracking-wider uppercase text-neutral-500">
                BY MR. OPPY
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>PROTECTED WORKSPACE</span>
          </div>
        </div>
      </header>

      {/* Center Login / Access Restricted Card */}
      <main className="relative z-10 my-auto flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-lg border border-neutral-800 bg-[#111114] p-7 shadow-2xl">
          {!isUnauthorizedUser ? (
            /* STATE 1: GOOGLE SIGN-IN SCREEN */
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900 shadow-inner">
                <svg
                  viewBox="0 0 64 56"
                  fill="none"
                  className="h-8 w-8"
                >
                  <path
                    d="M8 38L4 12L21 24L32 8L43 24L60 12L56 38H8Z"
                    stroke="#F59E0B"
                    strokeWidth="4.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 48H52"
                    stroke="#F59E0B"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-amber-300">
                <span>AUTHORIZED PERSONNEL ONLY</span>
              </div>

              <h1 className="mt-3 font-display text-3xl font-bold uppercase tracking-wider text-white">
                SIGN IN TO ESP CALC
              </h1>
              <p className="mt-1.5 text-sm text-neutral-400">
                Sign in with an approved Google account to access the Free Fire
                Esports Point Table &amp; Broadcast Graphic Engine.
              </p>

              {authError && (
                <div className="mt-4 flex w-full items-start gap-2.5 rounded-md border border-red-500/40 bg-red-950/40 p-3 text-left text-xs text-red-200">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <div className="flex-1">
                    <p className="font-semibold">{authError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearAuthError}
                    className="text-neutral-400 hover:text-white"
                  >
                    &times;
                  </button>
                </div>
              )}

              {/* Google Sign-In Button (Only Login Method) */}
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={isLoading}
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-md bg-white px-5 py-3 text-sm font-bold uppercase tracking-wider text-neutral-950 hover:bg-neutral-200 transition-colors disabled:opacity-60 cursor-pointer shadow-lg"
              >
                {/* Official Google G Vector */}
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span>
                  {isLoading ? 'VERIFYING CREDENTIALS...' : 'CONTINUE WITH GOOGLE'}
                </span>
              </button>

              <div className="mt-6 flex w-full items-center justify-center gap-2 border-t border-neutral-800/80 pt-4 text-xs text-neutral-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Google OAuth 2.0 + Allowlist Verification</span>
              </div>
            </div>
          ) : (
            /* STATE 2: SIGNED IN, BUT EMAIL NOT ON ALLOWLIST (OR DISABLED) */
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-red-500/40 bg-red-950/30">
                <ShieldAlert className="h-7 w-7 text-red-400" />
              </div>

              <div className="inline-flex items-center gap-1.5 rounded border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-red-300">
                <span>
                  {isDisabledAccount
                    ? 'ACCOUNT ACCESS SUSPENDED'
                    : 'EMAIL NOT ON ALLOWLIST'}
                </span>
              </div>

              <h1 className="mt-3 font-display text-3xl font-bold uppercase tracking-wider text-white">
                ACCESS RESTRICTED
              </h1>

              <p className="mt-2 text-sm text-neutral-400">
                You are currently signed in as:
              </p>

              <div className="mt-2 w-full rounded border border-neutral-800 bg-neutral-950 px-4 py-2.5 font-mono text-sm font-semibold text-amber-300 break-all">
                {firebaseUser.email}
              </div>

              <p className="mt-3 text-xs leading-relaxed text-neutral-400">
                {isDisabledAccount
                  ? 'Your account has been disabled by an administrator. Contact the system administrator to restore access.'
                  : 'This Google account is not yet authorized to use ESP CALC. Please ask the administrator to add your email in the Admin Dashboard, or switch to an approved Google account.'}
              </p>

              <button
                type="button"
                onClick={logout}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-neutral-700 bg-neutral-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4 text-red-400" />
                <span>SIGN OUT &amp; SWITCH GOOGLE ACCOUNT</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Creator Bar */}
      <footer className="relative z-10 border-t border-neutral-800/80 bg-[#09090B] py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 text-xs text-neutral-500 sm:px-6">
          <span>ESP CALC • Free Fire Esports Point Table &amp; Broadcast Engine</span>
          <span>
            Made by{' '}
            <a
              href="https://mroppy.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-neutral-200 underline decoration-neutral-600 underline-offset-4 hover:text-white"
            >
              MR. OPPY
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
};
