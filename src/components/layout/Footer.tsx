import React from 'react';
import { ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-10 border-t border-white/[0.08] pt-5 pb-4 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 select-none">
      <div className="flex items-center gap-2">
        <span className="font-bold tracking-wide text-slate-200">ESP CALC</span>
        <span className="text-slate-700">/</span>
        <span className="tracking-wide text-slate-400">
          Broadcast Standings &amp; Tournament Studio
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
          Made by
        </span>
        <a
          href="https://mroppy.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-bold tracking-[0.12em] text-amber-400 hover:text-amber-300 transition-colors"
        >
          <span>MR. OPPY</span>
          <ExternalLink className="h-3 w-3 text-amber-400/75" />
        </a>
      </div>
    </footer>
  );
};
