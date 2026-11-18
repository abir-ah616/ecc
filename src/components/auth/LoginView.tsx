import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  LogIn,
  LogOut,
  Lock,
  Loader2,
  Image as ImageIcon,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { EspCalcLogoMark } from '../ui/BrandLogo';

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
      <div className="studio-canvas relative min-h-screen w-full text-slate-100 flex items-center justify-center p-4 font-ui overflow-hidden">
        <img
          src="/assets/web-arena-bg.webp"
          alt=""
          aria-hidden="true"
          decoding="async"
          className="pointer-events-none fixed inset-0 h-full w-full object-cover opacity-35 select-none"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 bg-gradient-to-t from-[#090B0F] via-[#090B0F]/75 to-[#090B0F]/60"
        />

        <div className="glass-modal relative z-10 w-full max-w-md rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rose-500/35 bg-rose-500/12 text-rose-400">
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
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-bold text-zinc-950 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              <span>Switch Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Default Broadcast Studio Sign In Gate
  return (
    <div className="studio-canvas relative min-h-screen w-full text-slate-100 flex items-center justify-center p-4 sm:p-6 font-ui overflow-hidden select-none">
      {/* Static Lightweight Generated Arena Backdrop */}
      <img
        src="/assets/web-arena-bg.webp"
        alt=""
        aria-hidden="true"
        decoding="async"
        className="pointer-events-none fixed inset-0 h-full w-full object-cover opacity-45 select-none"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-gradient-to-t from-[#090B0F] via-[#090B0F]/65 to-[#090B0F]/55"
      />

      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-3xl border border-amber-500/25 bg-[#0D1017] shadow-[0_24px_60px_rgba(0,0,0,0.72)] grid grid-cols-1 lg:grid-cols-12">
        {/* Left Atmospheric Studio Showcase */}
        <div className="relative lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between min-h-[250px] lg:min-h-[440px] overflow-hidden border-b lg:border-b-0 lg:border-r border-white/[0.08]">
          <img
            src="/assets/web-hero-character.webp"
            alt=""
            aria-hidden="true"
            decoding="async"
            className="pointer-events-none absolute right-0 top-0 h-full w-[88%] object-cover object-top opacity-85 select-none"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#090B0F] via-[#090B0F]/90 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090B0F] via-transparent to-[#090B0F]/45"
          />

          <div className="relative z-10 flex items-center gap-3">
            <EspCalcLogoMark size={44} />
            <div>
              <div className="text-lg font-extrabold tracking-tight text-white leading-none">
                EspCalc
              </div>
              <div className="mt-1 text-[10px] font-semibold tracking-[0.28em] text-slate-300">
                BROADCAST STUDIO
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-10 space-y-3 max-w-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
                Tournament Graphics
              </span>
              <span className="h-[2px] w-6 rounded-full bg-amber-500" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-[1.12]">
              Create Professional{' '}
              <span className="block italic text-amber-400">
                Esports Graphics
              </span>
            </h1>

            <p className="text-xs text-slate-300/90 leading-relaxed">
              Standings, Match Results, and More — All in One Broadcast Workspace.
            </p>
          </div>
        </div>

        {/* Right Sign-In Gate */}
        <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between bg-[#10131B]">
          <div className="space-y-5">
            <div>
              <span className="glass-accent inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold text-amber-300">
                <Lock className="h-3 w-3" />
                <span>Organizer Workspace</span>
              </span>
              <h2 className="mt-3 text-xl font-bold text-white tracking-tight">
                Sign in to Studio
              </h2>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Authorized organizer access only. Use your approved Google account to manage tournaments and export posters.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="studio-feature-tile rounded-xl p-3 space-y-1">
                <ImageIcon className="h-4 w-4 text-amber-400" />
                <div className="font-semibold text-white">Poster Studio</div>
                <div className="text-[11px] text-slate-400">
                  16:9 &amp; 4:5 HD exports
                </div>
              </div>
              <div className="studio-feature-tile rounded-xl p-3 space-y-1">
                <SlidersHorizontal className="h-4 w-4 text-amber-400" />
                <div className="font-semibold text-white">Champion Rush</div>
                <div className="text-[11px] text-slate-400">
                  Live point engine
                </div>
              </div>
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
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:brightness-105 px-5 py-3.5 text-sm font-extrabold text-zinc-950 disabled:opacity-50 transition-all shadow-[0_8px_22px_rgba(245,158,11,0.28)] cursor-pointer"
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
          </div>

          <div className="mt-6 border-t border-white/[0.08] pt-4 flex items-center justify-between text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              <span>Verified Broadcast Engine</span>
            </span>
            <span className="font-bold tracking-[0.14em] text-amber-400/90">
              MADE BY MR. OPPY
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
