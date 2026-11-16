import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Download, X } from 'lucide-react';
import { EspCalcLogoMark } from '../ui/BrandLogo';

interface AppDownloadToastProps {
  currentTab: string;
  onOpenDownloadPage: () => void;
}

export const AppDownloadToast: React.FC<AppDownloadToastProps> = ({
  currentTab,
  onOpenDownloadPage,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (dismissed || currentTab === 'download') {
      return;
    }
    const timer = window.setTimeout(() => {
      setVisible(true);
    }, 550);
    return () => window.clearTimeout(timer);
  }, [dismissed, currentTab]);

  if (dismissed || currentTab === 'download') {
    return null;
  }

  const isShown = visible && !dismissed && currentTab !== 'download';

  const handleDismiss = () => {
    setVisible(false);
    window.setTimeout(() => {
      setDismissed(true);
    }, 280);
  };

  const handleOpen = () => {
    setVisible(false);
    window.setTimeout(() => {
      onOpenDownloadPage();
    }, 140);
  };

  return (
    <aside
      aria-label="Download our app"
      className={`fixed z-40 bottom-20 inset-x-3 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[364px] transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu ${
        isShown
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
          : 'opacity-0 translate-y-4 scale-[0.97] pointer-events-none'
      }`}
    >
      <div className="relative rounded-2xl border border-white/[0.12] bg-[#121621]/95 p-4 shadow-[0_18px_42px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.07)] space-y-3.5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/25 bg-[#0B0E14]">
            <EspCalcLogoMark size={28} />
          </div>

          <div className="min-w-0 flex-1 pr-6">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-400">
              ESP CALC Android · v1.0.0
            </div>
            <h3 className="mt-0.5 text-sm font-bold text-white leading-snug">
              Download our app
            </h3>
            <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">
              Score lobbies faster and export offline standings posters on Android.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss notification"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpen}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3.5 py-2 text-xs font-bold text-zinc-950 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 stroke-[2.25]" />
            <span>Open App Page</span>
          </button>

          <a
            href="/esp-calc.apk?v=20261116"
            download="ESP-CALC-v1.0.0.apk"
            className="glass-pill inline-flex items-center justify-center gap-1 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            <span>APK · 53.3 MB</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
          </a>
        </div>
      </div>
    </aside>
  );
};
