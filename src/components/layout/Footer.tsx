import React from 'react';
import { ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/10 bg-[#0A0C13] py-6 px-4 sm:px-6 select-none mt-auto">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold uppercase tracking-wider text-neutral-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-white">ESP CALC</span>
          </div>
          <span className="text-neutral-700">|</span>
          <span className="text-neutral-400">FREE FIRE BROADCAST SUITE V3.2</span>
          <span className="text-neutral-700 hidden sm:inline">|</span>
          <span className="text-amber-400/90 hidden sm:inline">4K UHD GRAPHICS READY</span>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500">ENGINEERED BY</span>
            <a
              href="https://mroppy.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1 font-black"
            >
              <span>MR. OPPY</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <span className="text-neutral-700 hidden md:inline">|</span>
          <span className="text-[11px] text-neutral-500 hidden md:inline">
            7 BROADCAST THEMES • CHAMPION RUSH • CLOUD SYNC
          </span>
        </div>
      </div>
    </footer>
  );
};
