import React from 'react';
import { ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/[0.06] bg-[#09090B] py-4 px-4 sm:px-6 select-none mt-auto">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-300">ESP CALC</span>
          <span className="text-zinc-700">•</span>
          <span>Esports Broadcast Engine</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span>By</span>
            <a
              href="https://mroppy.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-300 hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <span>MR. OPPY</span>
              <ExternalLink className="h-3 w-3 text-zinc-500" />
            </a>
          </div>

          <span className="text-zinc-700 hidden sm:inline">•</span>
          <span className="text-[11px] text-zinc-600 hidden sm:inline">Free Fire Esports Standard</span>
        </div>
      </div>
    </footer>
  );
};
