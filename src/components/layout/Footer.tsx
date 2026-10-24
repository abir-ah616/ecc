import React from 'react';
import { Trophy, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-neutral-800/80 bg-[#090608] py-3.5 px-4 sm:px-6 select-none mt-auto">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Left: Brand & Product Info */}
        <div className="flex items-center gap-2 text-neutral-400 font-medium">
          <Trophy className="h-4 w-4 text-neutral-500 shrink-0" />
          <span className="font-display font-bold uppercase tracking-wider text-neutral-200">
            ESP CALC
          </span>
          <span className="text-neutral-600">•</span>
          <span className="text-neutral-400">Free Fire Esports Point Table &amp; Broadcast Engine</span>
        </div>

        {/* Right: Made by MR. OPPY Clickable Credit */}
        <div className="flex items-center gap-1.5 text-neutral-400 font-medium">
          <span>Made by</span>
          <a
            href="https://mroppy.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-amber-400 hover:text-amber-300 hover:underline transition-colors inline-flex items-center gap-1"
            title="Visit MR. OPPY Portfolio"
          >
            <span>MR. OPPY</span>
            <ExternalLink className="h-3 w-3 text-amber-400/80" />
          </a>
        </div>
      </div>
    </footer>
  );
};
