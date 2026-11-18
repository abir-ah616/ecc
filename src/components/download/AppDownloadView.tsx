import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Download,
  Share2,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react';
import { useTournamentStore } from '../../store/tournamentStore';
import { EspCalcLogoMark } from '../ui/BrandLogo';

const APK_URL = '/esp-calc.apk?v=20261118v11d';
const APK_FILENAME = 'EspCalc-v1.1.apk';
const APK_SIZE_LABEL = '54.3 MB';

interface AppScreenshot {
  src: string;
  alt: string;
}

const APP_SCREENSHOTS: AppScreenshot[] = [
  {
    src: '/assets/app-screen-1.webp',
    alt: 'EspCalc Broadcast Studio home screen and live tournament overview',
  },
  {
    src: '/assets/app-screen-2.webp',
    alt: 'Set up your tournament format, matches, and rules quickly',
  },
  {
    src: '/assets/app-screen-3.webp',
    alt: 'Multiple esports standings poster styles including Scarlet Strike, FF Yellow, and Whiteout Pro',
  },
];

const FEATURES = [
  'Calculate Classic Scrim & Champion Rush standings automatically',
  'Rapid #1-#N placement tap mode & automated tie-breaker hierarchy',
  'Export 16:9 and 4:5 HD standings graphics in 7 broadcast themes',
  'Live Cloud Sync with Web + Saved Squad Vault & offline JSON backup',
];

export const AppDownloadView: React.FC = () => {
  const { setCurrentTab } = useTournamentStore();
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeShot, setActiveShot] = useState<AppScreenshot | null>(null);

  const handleDownload = () => {
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 4000);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${APK_URL}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 select-none py-2">
      <button
        type="button"
        onClick={() => setCurrentTab('home')}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Studio</span>
      </button>

      {/* Play Store Header Block */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-start gap-4 sm:gap-5">
          <div className="flex h-18 w-18 sm:h-22 sm:w-22 shrink-0 items-center justify-center rounded-2xl border border-white/[0.1] bg-[#0B0E14]">
            <EspCalcLogoMark size={56} />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              EspCalc
            </h1>
            <p className="text-xs font-semibold text-emerald-400">
              MR. OPPY
            </p>
            <p className="text-xs text-slate-400">
              Free Fire Tournament &amp; Standings Studio · No ads
            </p>
          </div>
        </div>

        {/* Clean 3-Stat Play Store Bar */}
        <div className="flex items-center gap-6 sm:gap-10 border-y border-white/[0.08] py-3.5 text-xs">
          <div>
            <div className="flex items-center gap-1 font-bold text-white text-sm">
              <span>4.9</span>
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            </div>
            <div className="text-slate-400 mt-0.5">Rating</div>
          </div>

          <div className="h-6 w-px bg-white/[0.08]" />

          <div>
            <div className="font-bold text-white text-sm tabular-nums">
              {APK_SIZE_LABEL}
            </div>
            <div className="text-slate-400 mt-0.5">APK Size</div>
          </div>

          <div className="h-6 w-px bg-white/[0.08]" />

          <div>
            <div className="font-bold text-white text-sm">v1.1</div>
            <div className="text-slate-400 mt-0.5">Android 7.0+</div>
          </div>
        </div>

        {/* Play Store Install CTA */}
        <div className="flex items-center gap-3">
          <a
            href={APK_URL}
            download={APK_FILENAME}
            onClick={handleDownload}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-8 py-3 text-sm font-bold text-zinc-950 transition-colors cursor-pointer"
          >
            {downloaded ? (
              <>
                <Check className="h-4 w-4 stroke-[2.5]" />
                <span>Downloading APK...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 stroke-[2.5]" />
                <span>Download APK</span>
              </>
            )}
          </a>

          <button
            type="button"
            onClick={handleShare}
            aria-label="Copy APK download link"
            className="glass-pill inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-300">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 text-slate-400" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Play Store Screenshots Gallery */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">App screenshots</h2>
          <span className="text-[11px] text-slate-400">Tap to view</span>
        </div>

        <div className="flex items-stretch gap-3.5 overflow-x-auto pb-1">
          {APP_SCREENSHOTS.map((shot) => (
            <button
              key={shot.src}
              type="button"
              onClick={() => setActiveShot(shot)}
              className="group shrink-0 overflow-hidden rounded-xl border border-white/[0.1] bg-[#0B0E14] hover:border-emerald-400/50 transition-colors cursor-pointer"
            >
              <img
                src={shot.src}
                alt={shot.alt}
                loading="lazy"
                className="h-[340px] sm:h-[400px] w-auto object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* About & Features */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-white">About this app</h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Manage Free Fire scrims and Champion Rush tournaments directly from
          your Android phone, and export clean broadcast standings graphics
          offline.
        </p>

        <ul className="space-y-2 pt-1 text-xs text-slate-300">
          {FEATURES.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="border-t border-white/[0.08] pt-4 space-y-2">
          <div className="text-xs font-bold text-amber-300">
            What&apos;s New in v1.1
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
              <span>
                <strong className="text-white">AI Auto Detect</strong> — extract match placements and kills straight from leaderboard screenshots.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
              <span>
                <strong className="text-white">New Rapid Mode Point Enter</strong> — faster full-screen guided team and kill entry.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
              <span>
                <strong className="text-white">More Themes</strong> — added Inferno Blaze, Obsidian Noir, and Royal Amethyst poster styles.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* App Info & Install Steps */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">App info</h2>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Signed Release Build
          </span>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <dt className="text-slate-500">Version</dt>
            <dd className="mt-0.5 font-semibold text-white">1.1</dd>
          </div>
          <div>
            <dt className="text-slate-500">Package ID</dt>
            <dd className="mt-0.5 font-mono text-slate-200">com.mroppy.espcalc</dd>
          </div>
          <div>
            <dt className="text-slate-500">Requires OS</dt>
            <dd className="mt-0.5 font-semibold text-white">Android 7.0+</dd>
          </div>
          <div>
            <dt className="text-slate-500">Size</dt>
            <dd className="mt-0.5 font-semibold text-white">{APK_SIZE_LABEL}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Developer</dt>
            <dd className="mt-0.5 font-semibold text-white">MR. OPPY</dd>
          </div>
        </dl>

        <div className="border-t border-white/[0.08] pt-3 text-[11px] text-slate-400">
          How to install: Tap <span className="text-slate-200">Download APK</span>, open the downloaded file, allow installation from this source if prompted, and launch EspCalc.
        </div>
      </div>

      {/* Screenshot Lightbox */}
      {activeShot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setActiveShot(null)}
        >
          <div
            className="relative max-h-[90vh] overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0B0E14]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveShot(null)}
              aria-label="Close screenshot"
              className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={activeShot.src}
              alt={activeShot.alt}
              className="max-h-[88vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
