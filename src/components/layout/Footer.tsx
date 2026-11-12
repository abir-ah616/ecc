import React from 'react';
import { Trophy, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-neutral-800 bg-[#0E0E11] py-4 px-4 sm:px-6 select-none mt-auto">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Left: Brand & Info */}
        <div className="flex items-center gap-2 text-neutral-400">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-neutral-900 border border-neutral-800 text-amber-500">
            <Trophy className="h-3 w-3" />
          </div>
          <span className="font-bold uppercase tracking-wider text-neutral-200">
            ESP CALC
          </span>
          <span className="text-neutral-600">•</span>
          <span className="text-neutral-400">
            Esports Point Table &amp; 4K Broadcast Engine
          </span>
        </div>

        {/* Right: Credits & Portfolio */}
        <div className="flex items-center gap-4 text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span>Engineered by</span>
            <a
              href="https://mroppy.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1"
              title="Visit MR. OPPY Portfolio"
            >
              <span>MR. OPPY</span>
              <ExternalLink className="h-3 w-3 text-amber-400/80" />
            </a>
          </div>

          <span className="text-neutral-700 hidden sm:inline">•</span>

          <span className="text-[11px] text-neutral-500 hidden sm:inline">
            Free Fire Esports Standard
          </span>
        </div>
      </div>
    </footer>
  );
};
