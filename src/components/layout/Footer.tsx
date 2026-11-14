import React from 'react';
import { ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-10 border-t border-white/[0.08] pt-5 pb-4 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 select-none">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-300">ESP CALC</span>
        <span className="text-slate-700">/</span>
        <span>Free Fire Point Table & Standings Studio</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span>Built by</span>
        <a
          href="https://mroppy.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-slate-300 hover:text-amber-400 transition-colors"
        >
          <span>MR. OPPY</span>
          <ExternalLink className="h-3 w-3 text-slate-500" />
        </a>
      </div>
    </footer>
  );
};
